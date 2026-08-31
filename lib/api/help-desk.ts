/**
 * Help Desk support tickets — mirrors app/api/help_desk.py exactly.
 * Tenant-scoped (no site_id) — an account's support history isn't split
 * per storefront. Superadmin replies land as email (and status "Replied");
 * merchants don't see a chat thread here.
 */

import useSWR, { type SWRResponse } from "swr";
import { request, type Page } from "../api";

export type TicketPriority = "Low" | "Medium" | "High";
export type TicketStatus =
  | "Open"
  | "In Progress"
  | "Replied"
  | "Resolved"
  | "Closed";

export type HelpTicketOut = {
  id: string;
  tenant_id: string;
  user_id: string;
  ticket_number: number;
  ticket_number_display: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  message: string;
  created_at: string;
  updated_at: string;
};

export type HelpTicketCreate = {
  subject: string;
  category: string;
  priority: TicketPriority;
  message: string;
};

export async function listHelpTickets(): Promise<Page<HelpTicketOut>> {
  return request<Page<HelpTicketOut>>("/help/tickets?limit=100");
}

export function useHelpTicketsSWR(): SWRResponse<Page<HelpTicketOut>> {
  return useSWR("help-tickets", () => listHelpTickets());
}

export async function createHelpTicket(
  data: HelpTicketCreate,
): Promise<HelpTicketOut> {
  return request<HelpTicketOut>("/help/tickets", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
