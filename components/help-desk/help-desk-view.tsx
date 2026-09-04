"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { PageHeading } from "@/components/ui/page-heading";
import { HelpStats } from "./help-stats";
import { HelpTopics } from "./help-topics";
import { NewTicketForm } from "./new-ticket-form";
import { TicketsTable } from "./tickets-table";

export function HelpDeskView() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title={t("Help Desk")} />

      <HelpStats />

      <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <NewTicketForm />
        <HelpTopics />
      </div>

      <TicketsTable />
    </div>
  );
}
