"use client";

import { useState } from "react";
import {
  ChevronRight,
  Copy,
  Check,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  FileText,
  Brain,
} from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { ActionConfirmCard } from "./action-confirm-card";
import type { ChatMessage } from "./ai-chat-store";
import { useToast } from "@/components/ui/toast";

type AiMessageItemProps = {
  message: ChatMessage;
  onEditUserMessage?: (text: string) => void;
  onRetryAiMessage?: () => void;
  onResolveAction?: (outcome: "confirmed" | "cancelled", resultNote: string) => void;
};

export function AiMessageItem({
  message,
  onEditUserMessage,
  onRetryAiMessage,
  onResolveAction,
}: AiMessageItemProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [showThought, setShowThought] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);

  const isUser = message.role === "user";

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast({
      title: "Copied to clipboard",
      variant: "info",
    });
    setTimeout(() => setCopied(false), 1800);
  };

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1.5 my-3">
        {/* User Message Bubble: Gray bg, small padding, rounded */}
        <div className="max-w-[85%] rounded-3xl bg-search-bg px-4 py-3 text-[15px] leading-[1.65] text-foreground shadow-2xs">
          {/* Display Attachments if any */}
          {message.attachments && message.attachments.length > 0 ? (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {message.attachments.map((att) => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 rounded-xl bg-white p-1.5 pr-2.5 border border-border/60"
                >
                  {att.type === "image" ? (
                    <img
                      src={att.url}
                      alt={att.name}
                      className="size-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileText className="size-4" />
                    </div>
                  )}
                  <div className="flex flex-col min-w-0 max-w-[110px]">
                    <span className="truncate text-xs font-medium text-foreground">
                      {att.name}
                    </span>
                    <span className="text-[10px] text-muted-soft">{att.size}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {message.content}
        </div>

        {/* User Actions & Time under message */}
        <div className="flex items-center gap-2.5 px-1 text-xs text-muted-soft">
          <span>{message.timestamp}</span>

          {onEditUserMessage ? (
            <button
              type="button"
              onClick={() => onEditUserMessage(message.content)}
              aria-label="Edit message"
              title="Edit message"
              className="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-search-bg hover:text-foreground"
            >
              <MaskIcon src="/sidebar/edit.svg" className="size-3.5" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy text"
            title="Copy"
            className="inline-flex size-6 items-center justify-center rounded-md transition-colors hover:bg-search-bg hover:text-foreground"
          >
            {copied ? (
              <Check className="size-3.5 text-emerald-500" />
            ) : (
              <Copy className="size-3.5" />
            )}
          </button>
        </div>
      </div>
    );
  }

  // AI Message: NO bg, NO padding on container
  return (
    <div className="my-4 flex flex-col gap-2">
      {/* Thought Header (Top of reply text with Inbox Icon) */}
      {message.thoughtProcess ? (
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => setShowThought(!showThought)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <Brain className="size-3.5 text-primary" />
            <span>Thought for {message.thinkingTimeSec ?? 1.5}s</span>
            <ChevronRight
              className={`size-3.5 transition-transform duration-200 ${
                showThought ? "rotate-90" : ""
              }`}
            />
          </button>

          {/* Expandable Thought Detail */}
          {showThought ? (
            <div className="mt-1 rounded-xl border-l-2 border-primary/50 bg-search-bg/60 px-3 py-2 text-xs leading-relaxed text-muted">
              {message.thoughtProcess}
            </div>
          ) : null}
        </div>
      ) : null}

      {/* AI Reply Text: No background, no padding */}
      <div
        className="whitespace-pre-line text-[15px] leading-[1.65] text-foreground"
        dangerouslySetInnerHTML={{
          __html: message.content
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
            .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code class="bg-primary/10 text-primary px-1 rounded">$1</code>')
        }}
      />

      {message.pendingAction ? (
        <ActionConfirmCard
          action={message.pendingAction}
          resolved={message.actionResolved}
          onResolve={(outcome, note) => onResolveAction?.(outcome, note)}
        />
      ) : null}

      {/* AI Action Icons at Bottom: No padding, no background */}
      <div className="flex items-center gap-2 pt-1 text-muted-soft">
        {onRetryAiMessage ? (
          <button
            type="button"
            onClick={onRetryAiMessage}
            aria-label="Retry response"
            title="Retry"
            className="inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-search-bg hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy response"
          title="Copy"
          className="inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-search-bg hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setLiked(liked === true ? null : true)}
          aria-label="Good response"
          title="Good response"
          className={`inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-search-bg ${
            liked === true ? "text-primary font-semibold" : "hover:text-foreground"
          }`}
        >
          <ThumbsUp className="size-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setLiked(liked === false ? null : false)}
          aria-label="Poor response"
          title="Poor response"
          className={`inline-flex size-7 items-center justify-center rounded-md transition-colors hover:bg-search-bg ${
            liked === false ? "text-rose-500 font-semibold" : "hover:text-foreground"
          }`}
        >
          <ThumbsDown className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
