"use client";

import { Send, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { MaskIcon } from "@/components/ui/mask-icon";

type ChatMessage = {
  id: string;
  role: "agent" | "user";
  body: string;
  time: string;
};

const SEED_MESSAGES: ChatMessage[] = [
  {
    id: "m1",
    role: "agent",
    body: "Hi! Softune Support here. How can we help with your store?",
    time: "Just now",
  },
];

const QUICK_REPLIES = [
  "Domain issue",
  "Billing question",
  "Theme help",
] as const;

function formatTime() {
  try {
    return new Date().toLocaleTimeString([], {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "Now";
  }
}

/** Floating chat bubble — panel only opens when the user clicks it */
export function HelpChat() {
  const [open, setOpen] = useState(false);
  const [chatLog, setChatLog] = useState<ChatMessage[]>(() => [
    ...SEED_MESSAGES,
  ]);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const messages = Array.isArray(chatLog) ? chatLog : SEED_MESSAGES;

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages.length, typing, open]);

  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, []);

  function pushUserMessage(text: string) {
    const body = text.trim();
    if (!body || typing) return;

    setChatLog((prev) => [
      ...(Array.isArray(prev) ? prev : SEED_MESSAGES),
      {
        id: `u-${Date.now()}`,
        role: "user",
        body,
        time: formatTime(),
      },
    ]);
    setDraft("");
    setTyping(true);

    if (replyTimer.current) clearTimeout(replyTimer.current);
    replyTimer.current = setTimeout(() => {
      setChatLog((prev) => [
        ...(Array.isArray(prev) ? prev : SEED_MESSAGES),
        {
          id: `a-${Date.now()}`,
          role: "agent",
          body: "Thanks — an agent will follow up shortly. For longer issues, open a ticket on this page.",
          time: formatTime(),
        },
      ]);
      setTyping(false);
    }, 1000);
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    pushUserMessage(draft);
  }

  return (
    <>
      {/* Dim + blur page behind the chat */}
      <AnimatePresence>
        {open ? (
          <motion.button
            key="chat-backdrop"
            type="button"
            aria-label="Close chat"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 bg-black/35 backdrop-blur-[3px]"
          />
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col items-end gap-3 sm:right-6 sm:bottom-6">
      <AnimatePresence>
        {open ? (
          <motion.div
            key="chat-panel"
            role="dialog"
            aria-label="Support chat"
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-auto flex h-[min(480px,72dvh)] w-[min(100vw-2rem,380px)] flex-col overflow-hidden rounded-2xl bg-white"
          >
            {/* Header */}
            <div className="relative shrink-0 overflow-hidden bg-primary px-4 py-4 text-white">
              <div
                aria-hidden
                className="pointer-events-none absolute -top-8 -right-6 size-28 rounded-full bg-white/10"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -bottom-10 left-10 size-24 rounded-full bg-black/5"
              />

              <div className="relative flex items-center gap-3">
                <span className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                  <MaskIcon src="/sidebar/chat.svg" className="size-5" />
                  <span className="absolute right-0 bottom-0 size-2.5 rounded-full bg-emerald-400 ring-2 ring-primary" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold tracking-tight">
                    Softune Support
                  </p>
                  <p className="mt-0.5 text-[11px] text-white/80">
                    Online · usually replies in ~4h
                  </p>
                </div>
                <button
                  type="button"
                  aria-label="Close chat"
                  onClick={() => setOpen(false)}
                  className="inline-flex size-8 items-center justify-center rounded-full bg-white/15 text-white transition-colors hover:bg-white/25"
                >
                  <X className="size-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={listRef}
              className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#F7F7F8] px-3.5 py-4"
            >
              {messages.map((msg) => {
                const mine = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={[
                      "flex gap-2",
                      mine ? "flex-row-reverse" : "flex-row",
                    ].join(" ")}
                  >
                    {!mine ? (
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <MaskIcon src="/sidebar/chat.svg" className="size-3.5" />
                      </span>
                    ) : null}

                    <div
                      className={[
                        "flex max-w-[78%] flex-col gap-1",
                        mine ? "items-end" : "items-start",
                      ].join(" ")}
                    >
                      <div
                        className={[
                          "px-3.5 py-2.5 text-sm leading-relaxed",
                          mine
                            ? "rounded-2xl rounded-br-md bg-primary text-white"
                            : "rounded-2xl rounded-bl-md bg-white text-foreground",
                        ].join(" ")}
                      >
                        {msg.body}
                      </div>
                      <span className="px-1 text-[10px] font-medium text-muted-soft">
                        {mine ? "You" : "Support"} · {msg.time}
                      </span>
                    </div>
                  </div>
                );
              })}

              {typing ? (
                <div className="flex gap-2">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MaskIcon src="/sidebar/chat.svg" className="size-3.5" />
                  </span>
                  <div className="rounded-2xl rounded-bl-md bg-white px-3.5 py-3">
                    <span className="flex gap-1">
                      <span className="size-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:120ms]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:240ms]" />
                    </span>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Quick replies */}
            <div className="flex gap-1.5 overflow-x-auto bg-[#F7F7F8] px-3.5 pb-2">
              {QUICK_REPLIES.map((reply) => (
                <button
                  key={reply}
                  type="button"
                  disabled={typing}
                  onClick={() => pushUserMessage(reply)}
                  className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary disabled:opacity-50"
                >
                  {reply}
                </button>
              ))}
            </div>

            {/* Composer */}
            <form
              onSubmit={onSubmit}
              className="flex items-end gap-2 border-t border-slate-100 bg-white p-3"
            >
              <div className="flex min-h-11 flex-1 items-end rounded-2xl bg-search-bg px-3 py-1.5">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      pushUserMessage(draft);
                    }
                  }}
                  rows={1}
                  placeholder="Write a message..."
                  className="max-h-24 min-h-8 w-full resize-none bg-transparent py-1.5 text-sm text-foreground outline-none placeholder:text-muted-soft"
                />
              </div>
              <button
                type="submit"
                disabled={!draft.trim() || typing}
                aria-label="Send message"
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-primary text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Send className="size-4" strokeWidth={1.75} />
              </button>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Launcher bubble */}
      <button
        type="button"
        aria-label={open ? "Close chat" : "Open chat"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className={[
          "pointer-events-auto inline-flex size-14 items-center justify-center rounded-full text-white transition-transform hover:scale-105",
          open ? "bg-foreground" : "bg-primary",
        ].join(" ")}
      >
        {open ? (
          <X className="size-5" strokeWidth={1.75} />
        ) : (
          <MaskIcon src="/sidebar/chat.svg" className="size-6" />
        )}
      </button>
      </div>
    </>
  );
}
