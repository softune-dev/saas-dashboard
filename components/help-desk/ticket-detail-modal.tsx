"use client";

import { MailCheck } from "lucide-react";
import { SettingsModal } from "@/components/settings/site/ui/settings-modal";
import { formatDisplayDate } from "@/lib/format";
import type { HelpTicketOut } from "@/lib/api/help-desk";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "./ticket-status-badge";

type TicketDetailModalProps = {
  ticket: HelpTicketOut | null;
  onClose: () => void;
};

export function TicketDetailModal({ ticket, onClose }: TicketDetailModalProps) {
  return (
    <SettingsModal
      open={!!ticket}
      title={ticket ? `#${ticket.id.slice(0, 8).toUpperCase()}` : ""}
      onClose={onClose}
    >
      {ticket ? (
        <div className="flex flex-col gap-4">
          <div>
            <p className="text-base font-semibold text-foreground">
              {ticket.subject}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              <span className="text-xs text-muted">{ticket.category}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs text-muted">
            <div>
              <p className="font-medium text-muted-soft">Submitted</p>
              <p className="mt-0.5 text-foreground">
                {formatDisplayDate(new Date(ticket.created_at))}
              </p>
            </div>
            <div>
              <p className="font-medium text-muted-soft">Last updated</p>
              <p className="mt-0.5 text-foreground">
                {formatDisplayDate(new Date(ticket.updated_at))}
              </p>
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-soft">
              Your message
            </p>
            <p className="rounded-md border border-border bg-search-bg px-3 py-2.5 text-sm whitespace-pre-wrap text-foreground">
              {ticket.message}
            </p>
          </div>

          {/* Honest placeholder, not a fake reply thread — there is no
           * in-app admin/reply feature yet (no admin panel exists). A real
           * response happens over email today, manually, until that exists. */}
          <div className="flex items-start gap-2.5 rounded-md border border-dashed border-border px-3 py-2.5 text-xs text-muted">
            <MailCheck className="mt-0.5 size-4 shrink-0 text-muted-soft" strokeWidth={1.75} />
            <span>
              We&apos;ll follow up by email — replies aren&apos;t shown here
              yet.
            </span>
          </div>
        </div>
      ) : null}
    </SettingsModal>
  );
}
