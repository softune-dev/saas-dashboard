"use client";

import { useEffect, useRef, useState, type DragEvent } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Link as LinkIcon, Paperclip, FileCheck, Brain } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import {
  type Conversation,
  type ChatMessage,
  type FileAttachment,
  loadConversations,
  saveConversations,
  loadActiveConversationId,
  saveActiveConversationId,
  createNewConversation,
} from "./ai-chat-store";
import { useSWRConfig } from "swr";
import { AI_USAGE_SWR_KEY, chatWithAssistant, TOOL_LABELS } from "@/lib/api/ai";
import { AiChatHeader } from "./ai-chat-header";
import { AiEmptyState } from "./ai-empty-state";
import { AiMessageItem } from "./ai-message-item";
import { AiInputBar } from "./ai-input-bar";

type AiSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function AiSidebar({ open, onClose }: AiSidebarProps) {
  const { mutate } = useSWRConfig();
  const pathname = usePathname();
  const isThemeEditor = pathname.startsWith("/themes/editor");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  // New assistant replies animate letter-by-letter; history stays instant.
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesListRef = useRef<HTMLDivElement>(null);

  const scrollMessagesToBottom = () => {
    const list = messagesListRef.current;
    if (list) {
      list.scrollTop = list.scrollHeight;
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }
  };

  // Load conversations from local storage on mount
  useEffect(() => {
    const loaded = loadConversations();
    const active = loadActiveConversationId();
    setConversations(loaded);
    if (active && loaded.some((c) => c.id === active)) {
      setActiveId(active);
    } else if (loaded.length > 0) {
      setActiveId(loaded[0].id);
    }
  }, []);

  // Drawer content unmounts when closed, so reopen must re-scroll — message
  // deps alone won't re-fire. rAF waits for layout after remount.
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      scrollMessagesToBottom();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, conversations, activeId, isThinking, streamingId]);

  const activeConv = conversations.find((c) => c.id === activeId);
  const messages = activeConv?.messages ?? [];

  const updateConversationsState = (next: Conversation[], nextActiveId?: string | null) => {
    setConversations(next);
    saveConversations(next);
    const idToSave = nextActiveId !== undefined ? nextActiveId : activeId;
    setActiveId(idToSave);
    saveActiveConversationId(idToSave);
  };

  const handleNewChat = () => {
    const newConv = createNewConversation();
    updateConversationsState([newConv, ...conversations], newConv.id);
  };

  const handleDeleteChat = (id: string) => {
    const remaining = conversations.filter((c) => c.id !== id);
    const nextActiveId = remaining.length > 0 ? remaining[0].id : null;
    updateConversationsState(remaining, nextActiveId);
  };

  const handleSendMessage = (
    textToSend?: string,
    attachmentsToSend?: FileAttachment[],
    contextHint?: string,
  ) => {
    const text = (textToSend || input).trim();
    if ((!text && (!attachmentsToSend || attachmentsToSend.length === 0)) || isThinking) return;

    let targetConv = activeConv;
    let nextConvs = [...conversations];

    // Create a new conversation if none exists
    if (!targetConv) {
      targetConv = createNewConversation(text.slice(0, 24) || "Attachment");
      nextConvs = [targetConv, ...nextConvs];
    } else if (targetConv.messages.length === 0) {
      targetConv = { ...targetConv, title: text.slice(0, 24) || "Attachment" };
      nextConvs = nextConvs.map((c) => (c.id === targetConv!.id ? targetConv! : c));
    }

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: timeStr,
      attachments: attachmentsToSend,
    };

    const updatedConv = {
      ...targetConv,
      messages: [...targetConv.messages, userMsg],
      updatedAt: new Date().toISOString(),
    };

    const updatedAllConvs = nextConvs.map((c) =>
      c.id === updatedConv.id ? updatedConv : c
    );

    updateConversationsState(updatedAllConvs, updatedConv.id);
    setInput("");
    setStreamingId(null);
    setIsThinking(true);

    // History sent as context — attachments aren't uploaded to the AI yet,
    // just noted by name so a reply can still acknowledge them.
    const history = updatedConv.messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    const attachmentNote =
      attachmentsToSend && attachmentsToSend.length > 0
        ? `\n\n(Attached: ${attachmentsToSend.map((a) => a.name).join(", ")})`
        : "";
    // Context tag hints steer which real tool the assistant reaches for
    // (see ai-input-bar.tsx's CONTEXT_TAG_OPTIONS) — sent to the backend
    // but not shown in the chat bubble, so the displayed conversation
    // stays exactly what the merchant typed.
    const outgoingText = contextHint ? `${contextHint}\n\n${text}` : text;

    const startedAt = performance.now();

    chatWithAssistant(outgoingText + attachmentNote, history)
      .then(({ reply, toolsUsed, pendingAction }) => {
        const elapsedSec = (performance.now() - startedAt) / 1000;
        const aiMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          thinkingTimeSec: Math.round(elapsedSec * 10) / 10,
          // Real trail of what it actually queried — not fabricated
          // reasoning. Omitted (no chip shown) when it answered from the
          // conversation alone, since there's nothing honest to show.
          thoughtProcess:
            toolsUsed.length > 0
              ? `Looked up: ${toolsUsed.map((t) => TOOL_LABELS[t] ?? t).join(", ")}`
              : undefined,
          pendingAction,
        };
        const finalConv = {
          ...updatedConv,
          messages: [...updatedConv.messages, aiMsg],
          updatedAt: new Date().toISOString(),
        };
        const finalAllConvs = updatedAllConvs.map((c) =>
          c.id === finalConv.id ? finalConv : c
        );
        updateConversationsState(finalAllConvs, finalConv.id);
        setStreamingId(aiMsg.id);
      })
      .catch((err) => {
        const errMsg: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content:
            err instanceof Error
              ? err.message
              : "Something went wrong reaching the AI assistant.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        const finalConv = {
          ...updatedConv,
          messages: [...updatedConv.messages, errMsg],
          updatedAt: new Date().toISOString(),
        };
        const finalAllConvs = updatedAllConvs.map((c) =>
          c.id === finalConv.id ? finalConv : c
        );
        updateConversationsState(finalAllConvs, finalConv.id);
        setStreamingId(errMsg.id);
      })
      .finally(() => {
        setIsThinking(false);
        // Refresh the header's credits pill either way — a request that
        // hit the daily cap still counted as an attempt (see
        // app/ai.py's _check_ai_access), so the header should reflect
        // that block state too, not just successful replies.
        mutate(AI_USAGE_SWR_KEY);
      });
  };

  const handleEditUserMessage = (text: string) => {
    setInput(text);
  };

  // Marks the card resolved in place (so it can't be double-clicked or
  // re-shown as pending on reload) and drops a short system note in the
  // conversation confirming what actually happened.
  const handleResolveAction = (
    messageId: string,
    outcome: "confirmed" | "cancelled",
    resultNote: string,
  ) => {
    if (!activeConv) return;
    const withResolved = activeConv.messages.map((m) =>
      m.id === messageId ? { ...m, actionResolved: outcome } : m,
    );
    const noteMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: resultNote,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    const finalConv = {
      ...activeConv,
      messages: [...withResolved, noteMsg],
      updatedAt: new Date().toISOString(),
    };
    updateConversationsState(
      conversations.map((c) => (c.id === finalConv.id ? finalConv : c)),
      finalConv.id,
    );
  };

  const handleRetryAiMessage = () => {
    if (!activeConv || messages.length === 0) return;
    const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content, lastUserMsg.attachments);
    }
  };
  return (
    <AnimatePresence>
      {open ? (
        <div
          className="fixed inset-0 z-[100] flex justify-end overflow-hidden"
        >
          {/* Dark Overlay Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
            onClick={onClose}
          />

          {/* Right Sliding Sidebar Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex h-full w-full max-w-md flex-col overflow-hidden bg-background font-ai-chat shadow-2xl"
          >


            {/* Saved Conversation & Header Navigation */}
            <AiChatHeader
              conversations={conversations}
              activeConversationId={activeId}
              onSelectConversation={(id) => {
                setStreamingId(null);
                setActiveId(id);
              }}
              onNewChat={() => {
                setStreamingId(null);
                handleNewChat();
              }}
              onDeleteChat={handleDeleteChat}
              onClose={onClose}
            />

            {/* Chat Body Container */}
            <div
              ref={messagesListRef}
              className="flex flex-1 flex-col overflow-y-auto p-4 scrollbar-none"
            >
              {messages.length === 0 ? (
                <AiEmptyState
                  isThemeEditor={isThemeEditor}
                  onSelectSuggestion={(prompt) => handleSendMessage(prompt)}
                />
              ) : (
                <div className="flex flex-col flex-1">
                  {messages.map((msg) => (
                    <AiMessageItem
                      key={msg.id}
                      message={msg}
                      onEditUserMessage={handleEditUserMessage}
                      onRetryAiMessage={handleRetryAiMessage}
                      onResolveAction={(outcome, note) =>
                        handleResolveAction(msg.id, outcome, note)
                      }
                      animate={msg.id === streamingId}
                      onAnimateComplete={() =>
                        setStreamingId((id) => (id === msg.id ? null : id))
                      }
                      onAnimateProgress={scrollMessagesToBottom}
                    />
                  ))}

                  {/* AI Thinking Indicator */}
                  {isThinking ? (
                    <div className="my-3 flex items-center gap-2 text-sm text-muted">
                      <Brain className="size-4 animate-pulse text-primary" />
                      <span className="italic">AI is thinking...</span>
                    </div>
                  ) : null}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Bottom Dribbble-Style AI Floating Input Bar */}
            <AiInputBar
              input={input}
              onInputChange={setInput}
              onSendMessage={(text, atts, contextHint) =>
                handleSendMessage(text, atts, contextHint)
              }
              isThinking={isThinking}
              isThemeEditor={isThemeEditor}
            />
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
