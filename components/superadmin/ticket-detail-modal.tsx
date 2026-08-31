"use client";

import { Mail, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/help-desk/ticket-status-badge";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import { formatDisplayDate } from "@/lib/format";
import {
  replyToTicket,
  updateTicket,
  useTicketRepliesSWR,
  type SuperAdminTicket,
} from "@/lib/api/superadmin";

const STATUS_OPTIONS = [
  "Open",
  "In Progress",
  "Replied",
  "Resolved",
  "Closed",
] as const;

type TicketDetailModalProps = {
  ticket: SuperAdminTicket | null;
  onClose: () => void;
  onUpdated: (ticket: SuperAdminTicket) => void;
};

export function TicketDetailModal({
  ticket,
  onClose,
  onUpdated,
}: TicketDetailModalProps) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [statusBusy, setStatusBusy] = useState(false);

  const { data: replies = [], mutate: mutateReplies } = useTicketRepliesSWR(
    ticket?.id ?? null,
  );

  useEffect(() => {
    setDraft("");
  }, [ticket?.id]);

  async function handleStatus(status: string) {
    if (!ticket || status === ticket.status) return;
    setStatusBusy(true);
    try {
      const updated = await updateTicket(ticket.id, { status });
      onUpdated(updated);
    } catch (err) {
      toast({
        title: "Couldn't update status",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setStatusBusy(false);
    }
  }

  async function handleReply(e: FormEvent) {
    e.preventDefault();
    if (!ticket) return;
    const message = draft.trim();
    if (!message) return;
    setSending(true);
    try {
      await replyToTicket(ticket.id, message);
      setDraft("");
      await mutateReplies();
      onUpdated({ ...ticket, status: "Replied" });
      toast({
        title: "Reply emailed",
        description: `Sent to ${ticket.user_email}.`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't send reply",
        description: err instanceof Error ? err.message : undefined,
        variant: "error",
      });
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {ticket ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/35"
            onClick={sending ? undefined : onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="ticket-detail-title"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-border bg-surface"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-5 py-4 dark:border-transparent">
              <div className="min-w-0">
                <h3
                  id="ticket-detail-title"
                  className="font-mono text-base font-semibold text-foreground"
                >
                  {ticket.ticket_number_display}
                </h3>
                <p className="mt-0.5 truncate text-sm text-muted">
                  {ticket.tenant_name} · {ticket.user_email}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={onClose}
                disabled={sending}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-search-bg hover:text-foreground disabled:opacity-60"
              >
                <X className="size-4" strokeWidth={1.75} />
              </button>
            </div>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5">
              <div>
                <p className="text-base font-semibold text-foreground">
                  {ticket.subject}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <TicketPriorityBadge priority={ticket.priority} />
                  <TicketStatusBadge status={ticket.status} />
                  <span className="text-xs text-muted">{ticket.category}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs text-muted">
                <div>
                  <p className="font-medium text-muted-soft">Opened</p>
                  <p className="mt-0.5 text-foreground">
                    {formatDisplayDate(new Date(ticket.created_at))}
                  </p>
                </div>
                <label className="block">
                  <span className="font-medium text-muted-soft">Status</span>
                  <select
                    value={ticket.status}
                    disabled={statusBusy || sending}
                    onChange={(e) => handleStatus(e.target.value)}
                    className="mt-0.5 h-8 w-full rounded-md border border-border bg-search-bg px-2 text-sm text-foreground outline-none focus:border-primary"
                  >
                    {STATUS_OPTIONS.includes(
                      ticket.status as (typeof STATUS_OPTIONS)[number],
                    ) ? null : (
                      <option value={ticket.status}>{ticket.status}</option>
                    )}
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-soft">
                  Customer message
                </p>
                <p className="rounded-md border border-border bg-search-bg px-3 py-2.5 text-sm whitespace-pre-wrap text-foreground">
                  {ticket.message}
                </p>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-soft">
                  Replies sent
                </p>
                {replies.length === 0 ? (
                  <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-sm text-muted">
                    No replies sent yet.
                  </p>
                ) : (
                  <ol className="flex flex-col gap-2">
                    {replies.map((reply) => (
                      <li
                        key={reply.id}
                        className="rounded-md border border-border px-3 py-2.5"
                      >
                        <p className="text-xs text-muted-soft">
                          {formatDisplayDate(new Date(reply.created_at))}
                        </p>
                        <p className="mt-1.5 text-sm whitespace-pre-wrap text-foreground">
                          {reply.message}
                        </p>
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>

            <form
              onSubmit={handleReply}
              className="shrink-0 border-t border-border px-5 py-4 dark:border-transparent"
            >
              <label
                htmlFor="ticket-reply"
                className="text-sm font-medium text-foreground"
              >
                Email a reply
              </label>
              <p className="mt-1 text-xs text-muted">
                This sends a real email to{" "}
                <span className="font-medium text-foreground">
                  {ticket.user_email}
                </span>
                . It is not a live chat — they read it in their inbox.
              </p>
              <textarea
                id="ticket-reply"
                required
                rows={4}
                maxLength={5000}
                value={draft}
                disabled={sending}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write the email you'll send…"
                className="mt-3 min-h-[96px] w-full resize-y rounded-md border border-border bg-search-bg px-3 py-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary focus:bg-surface disabled:opacity-60"
              />
              <PrimaryButton
                type="submit"
                disabled={sending || !draft.trim()}
                className="mt-3 w-full"
              >
                <Mail className="size-4" strokeWidth={1.75} />
                {sending ? "Sending email…" : "Send reply by email"}
              </PrimaryButton>
            </form>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
