"use client";

import type { PendingAction } from "@/lib/api/ai";

export type MessageRole = "user" | "assistant";

export type FileAttachment = {
  id: string;
  name: string;
  size: string;
  type: "image" | "file";
  url: string;
};

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  attachments?: FileAttachment[];
  thinkingTimeSec?: number;
  thoughtProcess?: string;
  /** A proposed write the assistant wants to make — set only once, resolved
   * (confirmed/cancelled) in place so re-opening the conversation doesn't
   * show a stale, already-actioned card as if it were still pending. */
  pendingAction?: PendingAction | null;
  actionResolved?: "confirmed" | "cancelled";
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "softune.ai.conversations";
const ACTIVE_CONV_KEY = "softune.ai.active_id";

export const DEFAULT_SUGGESTIONS = [
  { text: "Analyze store sales & conversion rate", icon: "/sidebar/analytics.svg" },
  { text: "Suggest modern theme styles for honey store", icon: "/sidebar/themes.svg" },
  { text: "Write product description for organic tea", icon: "/sidebar/products.svg" },
  { text: "Check low inventory products", icon: "/sidebar/categories.svg" },
];

export const THEME_EDITOR_SUGGESTIONS = [
  { text: "Suggest a modern color palette for honey store", icon: "/sidebar/themes.svg" },
  { text: "Write high-converting Hero title & headline", icon: "/sidebar/note.svg" },
  { text: "Recommend best section order for organic store", icon: "/sidebar/categories.svg" },
  { text: "Generate announcement banner text & offer", icon: "/sidebar/analytics.svg" },
];

export type AiModel = {
  id: string;
  name: string;
  icon: string;
  /** Locked models stay in the list but cannot be selected. */
  locked: boolean;
};

/** Only Gemini is available; others show as locked placeholders. */
export const AI_MODELS: AiModel[] = [
  { id: "gemini", name: "Gemini 3.6", icon: "/sidebar/gemini.svg", locked: false },
  { id: "gpt-5.2", name: "GPT-5.2", icon: "/sidebar/gpt.svg", locked: true },
  { id: "claude-3.7", name: "Claude 3.7", icon: "/sidebar/claude.svg", locked: true },
  { id: "grok-3", name: "Grok 3", icon: "/sidebar/grok.svg", locked: true },
];

export const DEFAULT_AI_MODEL =
  AI_MODELS.find((m) => !m.locked) ?? AI_MODELS[0];


function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadConversations(): Conversation[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function loadActiveConversationId(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACTIVE_CONV_KEY);
}

export function saveActiveConversationId(id: string | null) {
  if (!canUseStorage()) return;
  if (id) {
    localStorage.setItem(ACTIVE_CONV_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CONV_KEY);
  }
}

export function createNewConversation(initialTitle?: string): Conversation {
  const newConv: Conversation = {
    id: `conv-${Date.now()}`,
    title: initialTitle || "New Chat",
    messages: [],
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    updatedAt: new Date().toISOString(),
  };
  return newConv;
}

