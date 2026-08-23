"use client";

import { useEffect, useRef, useState } from "react";
import {
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

/** Turns the model's markdown into real HTML instead of leaving raw `**`/`*`
 * characters visible in the chat — bold and inline code were already
 * handled, but a `* item` or `1. item` line rendered as literal asterisks
 * and digits since nothing converted list lines into an actual <ul>/<ol>. */
function formatAiMarkdown(text: string): string {
  const inline = (s: string) =>
    s
      // [text](url) -> a real link, opens in a new tab since this is
      // usually a doc article or an external reference, not somewhere
      // navigating away from the chat makes sense. Runs first so the link
      // TEXT can still contain bold/italic without the url itself being
      // touched by those patterns.
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary underline underline-offset-2 hover:opacity-80">$1</a>',
      )
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-foreground">$1</strong>')
      .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, "<em>$1</em>")
      .replace(/`(.*?)`/g, '<code class="bg-primary/10 text-primary px-1 rounded">$1</code>');

  const lines = text.split("\n");
  const html: string[] = [];
  let listType: "ul" | "ol" | null = null;

  const closeList = () => {
    if (listType) {
      html.push(listType === "ul" ? "</ul>" : "</ol>");
      listType = null;
    }
  };

  for (const rawLine of lines) {
    const bulletMatch = /^\s*[*-]\s+(.*)$/.exec(rawLine);
    const numberedMatch = /^\s*\d+[.)]\s+(.*)$/.exec(rawLine);

    if (bulletMatch) {
      if (listType !== "ul") {
        closeList();
        html.push('<ul class="my-1.5 list-disc space-y-1 pl-5">');
        listType = "ul";
      }
      html.push(`<li>${inline(bulletMatch[1])}</li>`);
    } else if (numberedMatch) {
      if (listType !== "ol") {
        closeList();
        html.push('<ol class="my-1.5 list-decimal space-y-1 pl-5">');
        listType = "ol";
      }
      html.push(`<li>${inline(numberedMatch[1])}</li>`);
    } else {
      closeList();
      html.push(rawLine.trim() ? `${inline(rawLine)}<br/>` : "<br/>");
    }
  }
  closeList();

  return html.join("");
}

type AiMessageItemProps = {
  message: ChatMessage;
  onEditUserMessage?: (text: string) => void;
  onRetryAiMessage?: () => void;
  onResolveAction?: (outcome: "confirmed" | "cancelled", resultNote: string) => void;
  /** When true, reveal the assistant reply letter-by-letter (API is non-streaming). */
  animate?: boolean;
  onAnimateComplete?: () => void;
  onAnimateProgress?: () => void;
};

export function AiMessageItem({
  message,
  onEditUserMessage,
  onRetryAiMessage,
  onResolveAction,
  animate = false,
  onAnimateComplete,
  onAnimateProgress,
}: AiMessageItemProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [visibleLen, setVisibleLen] = useState(() =>
    animate ? 0 : message.content.length,
  );
  const onCompleteRef = useRef(onAnimateComplete);
  const onProgressRef = useRef(onAnimateProgress);
  onCompleteRef.current = onAnimateComplete;
  onProgressRef.current = onAnimateProgress;

  const isUser = message.role === "user";
  const isAnimating = !isUser && animate && visibleLen < message.content.length;

  // Client typewriter — the chat API returns the full reply in one shot.
  useEffect(() => {
    if (isUser || !animate) {
      setVisibleLen(message.content.length);
      return;
    }

    setVisibleLen(0);
    const full = message.content;
    // Keep long replies snappy while short ones still feel letter-by-letter.
    const step = full.length > 800 ? 3 : full.length > 400 ? 2 : 1;
    const tickMs = 18;
    let len = 0;
    const id = window.setInterval(() => {
      len = Math.min(full.length, len + step);
      setVisibleLen(len);
      onProgressRef.current?.();
      if (len >= full.length) {
        window.clearInterval(id);
        onCompleteRef.current?.();
      }
    }, tickMs);

    return () => window.clearInterval(id);
  }, [animate, isUser, message.id, message.content]);

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
                  className="flex items-center gap-2 rounded-xl bg-surface p-1.5 pr-2.5 border border-border/60"
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

  // "Looked up: Orders, Analytics" -> ["Orders", "Analytics"] — real tool
  // names the assistant actually called this turn (see ai-sidebar.tsx),
  // never fabricated. Shown as small source chips instead of hidden behind
  // a click, since this is exactly the kind of "what did it actually check"
  // transparency worth surfacing by default.
  const sources = message.thoughtProcess?.startsWith("Looked up: ")
    ? message.thoughtProcess.slice("Looked up: ".length).split(", ")
    : [];

  // AI Message: NO bg, NO padding on container
  return (
    <div className="my-4 flex flex-col gap-2">
      {sources.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-soft">
            <Brain className="size-3.5 text-primary" />
            Checked
          </span>
          {sources.map((source) => (
            <span
              key={source}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              {source}
            </span>
          ))}
        </div>
      ) : null}

      {/* AI Reply Text: No background, no padding */}
      <div className="whitespace-pre-line text-[15px] leading-[1.65] text-foreground">
        <span
          dangerouslySetInnerHTML={{
            __html: formatAiMarkdown(message.content.slice(0, visibleLen)),
          }}
        />
        {isAnimating ? (
          <span
            aria-hidden
            className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[2px] animate-pulse bg-primary align-baseline"
          />
        ) : null}
      </div>

      {!isAnimating && message.pendingAction ? (
        <ActionConfirmCard
          action={message.pendingAction}
          resolved={message.actionResolved}
          onResolve={(outcome, note) => onResolveAction?.(outcome, note)}
        />
      ) : null}

      {/* Actions stay hidden until the typewriter finishes */}
      {!isAnimating ? (
        <div className="flex items-center gap-2 pt-1 text-muted-soft">
          <span className="pr-1 text-xs text-muted-soft">
            {message.timestamp}
            {message.thinkingTimeSec !== undefined
              ? ` · Answered in ${message.thinkingTimeSec}s`
              : ""}
          </span>

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
      ) : null}
    </div>
  );
}
