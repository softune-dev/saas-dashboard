"use client";

import { AlertTriangle, MessageCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { SuperAdminUser } from "@/lib/api/superadmin";
import {
  buildWhatsAppLink,
  fillTemplate,
  toWhatsAppNumber,
  WHATSAPP_TEMPLATES,
} from "./whatsapp-templates";

type WhatsAppMessageModalProps = {
  user: SuperAdminUser | null;
  onClose: () => void;
};

/** Picks a template, previews it filled in, then opens a wa.me link with
 * the text pre-typed — no Meta API, no message actually sent by us; the
 * operator still hits Send themselves in WhatsApp. See
 * whatsapp-templates.ts's module docstring for why this exists alongside
 * (not instead of) the real Cloud API welcome message on the backend. */
export function WhatsAppMessageModal({ user, onClose }: WhatsAppMessageModalProps) {
  const [templateId, setTemplateId] = useState(WHATSAPP_TEMPLATES[0].id);
  const [customBody, setCustomBody] = useState("");

  useEffect(() => {
    setTemplateId(WHATSAPP_TEMPLATES[0].id);
    setCustomBody("");
  }, [user?.id]);

  if (!user) return null;

  const template = WHATSAPP_TEMPLATES.find((t) => t.id === templateId) ?? WHATSAPP_TEMPLATES[0];
  const name = user.full_name || "there";
  const message = template.id === "custom" ? customBody : fillTemplate(template.body, name);
  const number = user.phone ? toWhatsAppNumber(user.phone) : null;
  const link = user.phone ? buildWhatsAppLink(user.phone, message) : null;

  // Editing the preview text switches to "custom" so further edits aren't
  // clobbered by the template's own fixed wording — same instinct as any
  // "start from a template, then make it yours" editor.
  function handleMessageEdit(value: string) {
    setTemplateId("custom");
    setCustomBody(value);
  }

  return (
    <AnimatePresence>
      {user ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35"
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="whatsapp-message-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 dark:border-transparent">
              <div className="min-w-0">
                <h3 id="whatsapp-message-title" className="truncate text-base font-semibold text-foreground">
                  Message {user.full_name || user.email}
                </h3>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {user.phone || "No phone number on file"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
              {!user.phone ? (
                <div className="flex items-start gap-2 rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-sm text-rose-600">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                  <span>This user has no phone number saved, so there&apos;s no WhatsApp number to open.</span>
                </div>
              ) : !number ? (
                <div className="flex items-start gap-2 rounded-md border border-rose-500/20 bg-rose-500/5 px-3 py-2.5 text-sm text-rose-600">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" strokeWidth={1.75} />
                  <span>
                    &ldquo;{user.phone}&rdquo; doesn&apos;t look like a valid Bangladeshi mobile
                    number.
                  </span>
                </div>
              ) : null}

              <label className="block">
                <span className="text-xs font-medium text-muted-soft">Template</span>
                <select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
                >
                  {WHATSAPP_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="text-xs font-medium text-muted-soft">
                  {template.id === "custom" ? "Message" : "Preview (edit if you like)"}
                </span>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => handleMessageEdit(e.target.value)}
                  className="mt-1 w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none focus:border-primary"
                />
              </label>

              <a
                href={link ?? undefined}
                target="_blank"
                rel="noreferrer"
                aria-disabled={!link || !message.trim()}
                onClick={(e) => {
                  if (!link || !message.trim()) e.preventDefault();
                }}
                className={[
                  "inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-medium text-white transition-opacity",
                  link && message.trim()
                    ? "bg-emerald-600 hover:opacity-90"
                    : "cursor-not-allowed bg-emerald-600/50",
                ].join(" ")}
              >
                <MessageCircle className="size-4" strokeWidth={1.75} />
                Open in WhatsApp
              </a>
              <p className="text-center text-xs text-muted-soft">
                Opens WhatsApp with this message typed in — you still hit Send yourself.
              </p>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
