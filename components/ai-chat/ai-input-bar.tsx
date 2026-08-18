"use client";

import { useState, useRef, type ClipboardEvent } from "react";
import {
  Plus,
  ArrowUp,
  Mic,
  ChevronDown,
  X,
  FileText,
  Check,
  Upload,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { useSession } from "@/components/providers/session-provider";
import {
  AI_MODELS,
  DEFAULT_AI_MODEL,
  type FileAttachment,
} from "./ai-chat-store";

type ContextTag = {
  id: string;
  label: string;
  /** Prepended to the outgoing message (not shown in the chat bubble) so
   * the tag actually steers which of app/ai_tools.py's real tools the
   * assistant reaches for, instead of being a decorative chip. */
  hint: string;
};

type AiInputBarProps = {
  onSendMessage: (
    text: string,
    attachments: FileAttachment[],
    contextHint?: string,
  ) => void;
  isThinking: boolean;
  input: string;
  onInputChange: (val: string) => void;
  isThemeEditor?: boolean;
};

// Every option here maps to a tool the backend assistant can actually call
// (see app/ai_tools.py) — no invented categories with nothing behind them.
const CONTEXT_TAG_OPTIONS: ContextTag[] = [
  {
    id: "orders",
    label: "Recent Orders",
    hint: "Focus your answer on my recent orders — look up the actual order list/details before answering.",
  },
  {
    id: "inventory",
    label: "Product Inventory",
    hint: "Focus your answer on my current product inventory and stock levels — look up the actual product list before answering.",
  },
  {
    id: "sales",
    label: "Sales Summary",
    hint: "Focus your answer on my real sales summary and revenue numbers — look those up before answering.",
  },
  {
    id: "site",
    label: "Site Settings",
    hint: "Focus your answer on my actual site settings/configuration — look those up before answering.",
  },
];

export function AiInputBar({
  onSendMessage,
  isThinking,
  input,
  onInputChange,
  isThemeEditor,
}: AiInputBarProps) {
  const { currentSite, me } = useSession();
  const storeName = currentSite?.name ?? me?.tenant.name ?? "Your store";

  const [selectedModel, setSelectedModel] = useState(DEFAULT_AI_MODEL);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const defaultTag: ContextTag = isThemeEditor
    ? {
        id: "theme",
        label: `Theme Editor · ${storeName}`,
        hint: "Focus your answer on my current theme and site settings — look those up before answering.",
      }
    : {
        id: "overview",
        label: `${storeName} · Today`,
        hint: "Focus your answer on my store's real business overview — look it up before answering.",
      };
  const [contextTags, setContextTags] = useState<ContextTag[]>([defaultTag]);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  const SUGGESTED_TAGS = CONTEXT_TAG_OPTIONS.filter(
    (tag) => !contextTags.some((t) => t.id === tag.id),
  );

  const handleInputChangeEvent = (val: string) => {
    onInputChange(val);
    // Check if the user is typing an @mention at the end of the input
    const match = val.match(/@([a-zA-Z]*)$/);
    if (match) {
      setShowTagPicker(true);
    } else {
      setShowTagPicker(false);
    }
  };

  // Process uploaded or dropped files
  const processFiles = (fileList: FileList | File[]) => {
    const newAttachments: FileAttachment[] = [];

    Array.from(fileList).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const url = URL.createObjectURL(file);
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      const sizeStr = `${sizeMb} MB`;

      newAttachments.push({
        id: `att-${Date.now()}-${Math.random()}`,
        name: file.name,
        size: sizeStr,
        type: isImage ? "image" : "file",
        url,
      });
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  // Clipboard Paste listener (e.g. pasting image screenshot with Ctrl+V)
  const handlePaste = (e: ClipboardEvent<HTMLDivElement | HTMLTextAreaElement>) => {
    if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length > 0) {
      processFiles(e.clipboardData.files);
    }
  };

  // Drag and Drop Event Handlers
  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = () => {
    if ((!input.trim() && attachments.length === 0) || isThinking) return;
    const contextHint = contextTags.map((t) => t.hint).join(" ");
    onSendMessage(input, attachments, contextHint || undefined);
    setAttachments([]);
  };

  return (
    <div
      className="relative z-10 p-3 pb-5 bg-transparent border-t border-border/60"
      onPaste={handlePaste}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Dribbble Style Rounded Floating AI Input Container */}
      <div
        className="relative flex flex-col rounded-3xl border border-slate-200/90 bg-white p-3.5 transition-all focus-within:border-primary/50"
        style={{ boxShadow: "0 -8px 24px rgba(0, 0, 0, 0.08), 0 12px 24px rgba(0, 0, 0, 0.20)" }}
      >
        {/* Drag & Drop Full Zone Overlay (Inside Input Bar) */}
        <AnimatePresence>
          {isDragging ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-50 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-primary bg-primary/5 p-4 text-center backdrop-blur-xs"
            >
              <div className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary shadow-sm">
                <Upload className="size-5 animate-bounce" />
              </div>
              <h3 className="text-[13px] font-bold text-primary">Drop files to attach</h3>
            </motion.div>
          ) : null}
        </AnimatePresence>
        
        {/* Tag Picker Popover */}
        {showTagPicker && (
          <div className="absolute bottom-full left-4 z-50 mb-2 w-56 rounded-2xl border border-border bg-white p-1.5 shadow-xl">
            <div className="px-2 py-1 text-[10px] font-semibold tracking-wider text-muted uppercase">
              Suggested Context
            </div>
            <div className="flex flex-col gap-0.5">
              {SUGGESTED_TAGS.length === 0 ? (
                <p className="px-2.5 py-1.5 text-xs text-muted-soft">
                  All context tags already added.
                </p>
              ) : (
                SUGGESTED_TAGS.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => {
                      setContextTags((prev) =>
                        prev.some((t) => t.id === tag.id) ? prev : [...prev, tag],
                      );
                      onInputChange(input.replace(/@([a-zA-Z]*)$/, ""));
                      setShowTagPicker(false);
                    }}
                    className="w-full flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-search-bg"
                  >
                    <MaskIcon src="/sidebar/save.svg" className="size-3.5 text-muted-soft shrink-0" />
                    <span>{tag.label}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Context Tag Pills (Multiple @tags) */}
        {contextTags.length > 0 ? (
          <div className="mb-2 flex flex-wrap items-center gap-2">
            {contextTags.map((tag) => (
              <span key={tag.id} className="inline-flex items-center gap-1.5 rounded-full bg-search-bg px-3 py-1 text-[11px] font-medium text-muted">
                <span className="text-muted-soft font-normal">@</span>
                <span className="text-foreground">{tag.label}</span>
                <button
                  type="button"
                  onClick={() => setContextTags((prev) => prev.filter((t) => t.id !== tag.id))}
                  className="ml-1 text-muted-soft hover:text-foreground"
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : null}

        {/* Text Input / Textarea */}
        <textarea
          value={input}
          onChange={(e) => handleInputChangeEvent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder={
            isThemeEditor
              ? "Ask AI to write hero text, suggest colors, or organize sections..."
              : "Ask a follow-up. Use @ to tag docs or files..."
          }
          rows={2}
          className="w-full resize-none bg-transparent text-[15px] leading-[1.65] text-foreground outline-none placeholder:text-muted-soft"
        />

        {/* Attached File Preview Chips */}
        {attachments.length > 0 ? (
          <div className="my-2 flex flex-wrap gap-2">
            {attachments.map((att) => (
              <div
                key={att.id}
                className="group relative flex items-center gap-2 rounded-xl border border-border bg-search-bg/80 p-1.5 pr-2.5 text-xs"
              >
                {att.type === "image" ? (
                  <img
                    src={att.url}
                    alt={att.name}
                    className="size-8 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FileText className="size-4" />
                  </div>
                )}
                <div className="flex flex-col min-w-0 max-w-[100px]">
                  <span className="truncate text-[11px] font-medium text-foreground">
                    {att.name}
                  </span>
                  <span className="text-[9px] text-muted-soft">{att.size}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="ml-1 inline-flex size-4 items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-500 hover:text-white"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Bottom Toolbar Controls */}
        <div className="mt-2 flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          
          {/* Left Controls: File Picker, Model Selector Pill, Action Pills */}
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files) processFiles(e.target.files);
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Add attachment"
              title="Add attachment / Drag and drop files"
              className="inline-flex size-7 items-center justify-center rounded-full text-slate-500 hover:bg-search-bg hover:text-foreground transition-colors"
            >
              <Plus className="size-4" />
            </button>

            {/* Model Selector Pill with Model Icons */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-search-bg/50 px-2.5 py-1 text-[11px] font-medium text-foreground hover:bg-white transition-colors"
              >
                <img src={selectedModel.icon} alt={selectedModel.name} className="size-3.5" />
                <span>{selectedModel.name}</span>
                <ChevronDown className="size-3 text-muted-soft" />
              </button>

              {/* Model Dropdown Menu */}
              {modelDropdownOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setModelDropdownOpen(false)}
                  />
                  <div className="absolute bottom-full left-0 z-50 mb-1.5 w-52 rounded-2xl border border-border bg-white p-1 shadow-xl">
                    {AI_MODELS.map((model) => {
                      const isSelected = selectedModel.id === model.id;
                      return (
                        <button
                          key={model.id}
                          type="button"
                          disabled={model.locked}
                          onClick={() => {
                            if (model.locked) return;
                            setSelectedModel(model);
                            setModelDropdownOpen(false);
                          }}
                          className={[
                            "flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs transition-colors",
                            model.locked
                              ? "cursor-not-allowed text-muted-soft opacity-70"
                              : isSelected
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-foreground hover:bg-search-bg",
                          ].join(" ")}
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={model.icon}
                              alt={model.name}
                              className={[
                                "size-4",
                                model.locked ? "opacity-50" : "",
                              ].join(" ")}
                            />
                            <span>{model.name}</span>
                          </div>
                          {model.locked ? (
                            <MaskIcon
                              src="/sidebar/lock.svg"
                              className="size-3.5 text-muted-soft"
                            />
                          ) : isSelected ? (
                            <Check className="size-3.5" />
                          ) : null}
                        </button>
                      );
                    })}
                  </div>
                </>
              ) : null}
            </div>

            {/* Quick Action Pill with note.svg */}
            <button
              type="button"
              onClick={() => onInputChange("Generate document report for store sales")}
              className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-search-bg/30 px-2.5 py-1 text-[10px] font-medium text-muted hover:text-foreground hover:bg-white transition-colors"
            >
              <MaskIcon src="/sidebar/note.svg" className="size-3 text-primary" />
              <span>Generate doc</span>
            </button>
          </div>

          {/* Right Controls: Mic & Send Button */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              title="Voice Input"
              className="inline-flex size-8 items-center justify-center rounded-full bg-search-bg text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Mic className="size-4" />
            </button>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={(!input.trim() && attachments.length === 0) || isThinking}
              aria-label="Send"
              className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-white shadow-xs transition-transform hover:scale-105 active:scale-95 disabled:opacity-40 disabled:hover:scale-100"
            >
              <ArrowUp className="size-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
