"use client";

import { useState } from "react";
import { Plus, X, ChevronDown } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import type { Conversation } from "./ai-chat-store";

type AiChatHeaderProps = {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onClose: () => void;
};

export function AiChatHeader({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewChat,
  onDeleteChat,
  onClose,
}: AiChatHeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  return (
    <div className="relative flex h-14 shrink-0 items-center justify-between border-b border-border/80 px-4 bg-white">
      {/* Title / Saved Conversations Selector */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="flex shrink-0 items-center justify-center mr-1">
          <img src="/sidebar/gemini.svg" alt="Gemini" className="size-6" />
        </div>

        <div className="relative min-w-0 flex-1">
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 min-w-0 max-w-full text-left text-sm font-semibold text-foreground hover:text-primary transition-colors"
          >
            <span className="truncate">
              {activeConv ? activeConv.title : "AI Assistant"}
            </span>
            <ChevronDown className={`size-4 shrink-0 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
          </button>

          {/* Conversations Dropdown Drawer */}
          {dropdownOpen ? (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 z-50 mt-1.5 w-64 rounded-2xl border border-border bg-white p-1.5 shadow-xl">
                <div className="px-2 py-1 text-[11px] font-semibold text-muted uppercase tracking-wider">
                  Saved Conversations
                </div>
                <div className="max-h-56 overflow-y-auto scrollbar-none py-1 flex flex-col gap-0.5">
                  {conversations.length === 0 ? (
                    <div className="px-2 py-2 text-xs text-muted-soft italic">
                      No saved chats yet
                    </div>
                  ) : (
                    conversations.map((conv) => (
                      <div
                        key={conv.id}
                        className={`flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                          conv.id === activeConversationId
                            ? "bg-primary/10 font-semibold text-primary"
                            : "hover:bg-search-bg text-foreground"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            onSelectConversation(conv.id);
                            setDropdownOpen(false);
                          }}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                        >
                          <MaskIcon src="/sidebar/empty.svg" className="size-3.5 shrink-0 text-muted-soft" />
                          <span className="truncate">{conv.title}</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(conv.id);
                          }}
                          aria-label="Delete chat"
                          title="Delete chat"
                          className="text-muted-soft hover:text-rose-500 transition-colors"
                        >
                          <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-1 border-t border-border/60 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onNewChat();
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors"
                  >
                    <Plus className="size-3.5" />
                    <span>New Chat</span>
                  </button>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Header Actions */}
      <div className="flex items-center gap-2 shrink-0 pl-2">
        <button
          type="button"
          onClick={onNewChat}
          aria-label="New Chat"
          title="New Chat"
          className="inline-flex size-7 items-center justify-center rounded-full border border-slate-200 bg-transparent text-muted transition-colors hover:text-foreground hover:border-slate-300"
        >
          <Plus className="size-3.5" />
        </button>

        {activeConv ? (
          <button
            type="button"
            onClick={() => onDeleteChat(activeConv.id)}
            aria-label="Delete Chat"
            title="Delete Chat"
            className="inline-flex size-7 items-center justify-center rounded-full border border-slate-200 bg-transparent text-muted transition-colors hover:text-rose-500 hover:border-rose-200"
          >
            <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          aria-label="Close Assistant"
          title="Close"
          className="inline-flex size-7 items-center justify-center rounded-full border border-slate-200 bg-transparent text-muted transition-colors hover:text-foreground hover:border-slate-300 ml-1"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
