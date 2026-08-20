"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import {
  SettingsInput,
  SettingsSelect,
  SettingsTextarea,
} from "@/components/settings/site/ui/settings-field";
import { createHelpTicket, type TicketPriority } from "@/lib/api/help-desk";
import { priorityOptions, ticketCategories } from "./help-data";

export function NewTicketForm() {
  const { toast } = useToast();
  const { mutate } = useSWRConfig();
  const [form, setForm] = useState({
    subject: "",
    category: "Technical",
    priority: "Medium" as TicketPriority,
    message: "",
  });
  const [busy, setBusy] = useState(false);

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit() {
    if (!form.subject.trim() || !form.message.trim()) {
      toast({
        title: "Missing details",
        description: "Add a subject and message to submit a ticket.",
        variant: "error",
      });
      return;
    }
    setBusy(true);
    try {
      await createHelpTicket({
        subject: form.subject.trim(),
        category: form.category,
        priority: form.priority,
        message: form.message.trim(),
      });
      await mutate("help-tickets");
      toast({
        title: "Ticket submitted",
        description: "We'll reply by email when there's an update.",
        variant: "success",
      });
      setForm({ subject: "", category: "Technical", priority: "Medium", message: "" });
    } catch (err) {
      toast({
        title: "Couldn't submit ticket",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "error",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex h-full flex-col rounded-md bg-surface p-4 sm:p-5">
      <h2 className="mb-1 text-base font-semibold text-foreground">
        New ticket
      </h2>
      <p className="mb-5 text-sm text-muted">
        Tell us what you need help with
      </p>

      <div className="flex flex-1 flex-col gap-4">
        <SettingsInput
          label="Subject"
          value={form.subject}
          onChange={(e) => setField("subject", e.target.value)}
          placeholder="Brief summary of the issue"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingsSelect
            label="Category"
            value={form.category}
            options={ticketCategories}
            onChange={(e) => setField("category", e.target.value)}
          />
          <SettingsSelect
            label="Priority"
            value={form.priority}
            options={priorityOptions}
            onChange={(e) => setField("priority", e.target.value)}
          />
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <SettingsTextarea
            label="Message"
            value={form.message}
            onChange={(e) => setField("message", e.target.value)}
            placeholder="Describe the problem with steps if you can…"
            className="!min-h-[140px] flex-1"
          />
        </div>

        <div className="mt-auto flex justify-end pt-1">
          <PrimaryButton type="button" onClick={submit} disabled={busy}>
            {busy ? "Submitting…" : "Submit ticket"}
          </PrimaryButton>
        </div>
      </div>
    </section>
  );
}
