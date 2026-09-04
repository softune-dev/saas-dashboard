/**
 * Platform-operator panel — mirrors app/api/superadmin.py exactly.
 *
 * Cross-tenant on purpose: these routes are gated by is_superadmin on the
 * backend (404 for everyone else). Keys are prefixed `superadmin-*` so
 * mutate() never collides with a merchant's own tenant-scoped SWR cache.
 */

import useSWR, { type SWRResponse } from "swr";
import { request, type Page } from "../api";

export type SuperAdminTenant = {
  id: string;
  slug: string;
  name: string;
  plan: "trial" | "demo" | "starter" | "growth" | "business";
  status: "active" | "suspended" | "cancelled";
  created_at: string;
  /** ISO timestamp when plan is "trial"; null otherwise. */
  trial_expires_at: string | null;
  business: {
    legal_name?: string | null;
    trade_name?: string | null;
    business_type?: string | null;
    trade_license?: string | null;
    tin?: string | null;
    billing_email?: string | null;
  };
  site_count: number;
  category_count: number;
  product_count: number;
  order_count: number;
  user_count: number;
  payment_providers: string[];
  courier_providers: string[];
};

export type SuperAdminStats = {
  total_tenants: number;
  total_users: number;
  active_users: number;
  new_tenants_7d: number;
  tenants_by_plan: Record<string, number>;
  tenants_by_status: Record<string, number>;
};

export async function getStats(): Promise<SuperAdminStats> {
  return request<SuperAdminStats>("/superadmin/stats");
}

export function useSuperAdminStatsSWR(): SWRResponse<SuperAdminStats> {
  return useSWR(["superadmin-stats"], () => getStats());
}

export type SuperAdminUser = {
  id: string;
  tenant_id: string;
  tenant_name: string;
  email: string;
  full_name: string | null;
  role: "owner" | "admin" | "member";
  is_active: boolean;
  is_superadmin: boolean;
  last_login_at: string | null;
  created_at: string;
};

export async function listTenants(
  params: { q?: string; limit?: number; offset?: number } = {},
): Promise<Page<SuperAdminTenant>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  return request<Page<SuperAdminTenant>>(`/superadmin/tenants?${search}`);
}

export function useTenantsSWR(
  params: { q?: string } = {},
): SWRResponse<Page<SuperAdminTenant>> {
  return useSWR(["superadmin-tenants", params.q ?? ""], () =>
    listTenants(params),
  );
}

export type CreateAccountIn = {
  email: string;
  password: string;
  workspace_name: string;
  full_name?: string;
  plan: SuperAdminTenant["plan"];
  template_key: string;
  site_name: string;
  subdomain: string;
};

export async function createAccount(
  data: CreateAccountIn,
): Promise<SuperAdminTenant> {
  return request<SuperAdminTenant>("/superadmin/tenants", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTenant(
  id: string,
  data: {
    plan?: SuperAdminTenant["plan"];
    status?: SuperAdminTenant["status"];
  },
): Promise<SuperAdminTenant> {
  return request<SuperAdminTenant>(`/superadmin/tenants/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** Hard delete — 204, no body. Irreversible; every child row cascades. */
export async function deleteTenant(id: string): Promise<void> {
  await request<void>(`/superadmin/tenants/${id}`, { method: "DELETE" });
}

export type SuperAdminLead = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  shop_name: string | null;
  shop_category: string | null;
  status:
    | "signed_up"
    | "otp_verified"
    | "profile_complete"
    | "demo_accessed"
    | "purchase_requested";
  demo_accessed_at: string | null;
  purchase_requested_at: string | null;
  created_at: string;
};

export async function listLeads(
  params: {
    q?: string;
    status_filter?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<Page<SuperAdminLead>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status_filter) search.set("status_filter", params.status_filter);
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  return request<Page<SuperAdminLead>>(`/superadmin/leads?${search}`);
}

export function useLeadsSWR(
  params: { q?: string; status_filter?: string } = {},
): SWRResponse<Page<SuperAdminLead>> {
  return useSWR(
    ["superadmin-leads", params.q ?? "", params.status_filter ?? ""],
    () => listLeads(params),
  );
}

export type ConvertLeadIn = {
  workspace_name: string;
  plan: SuperAdminTenant["plan"];
  template_key: string;
  site_name: string;
  subdomain: string;
};

export async function convertLead(
  leadId: string,
  data: ConvertLeadIn,
): Promise<SuperAdminTenant> {
  return request<SuperAdminTenant>(`/superadmin/leads/${leadId}/convert`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function listUsers(
  params: {
    q?: string;
    tenant_id?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<Page<SuperAdminUser>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.tenant_id) search.set("tenant_id", params.tenant_id);
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  return request<Page<SuperAdminUser>>(`/superadmin/users?${search}`);
}

export function useSuperAdminUsersSWR(
  params: { q?: string; tenant_id?: string } = {},
): SWRResponse<Page<SuperAdminUser>> {
  return useSWR(
    ["superadmin-users", params.q ?? "", params.tenant_id ?? ""],
    () => listUsers(params),
  );
}

export type CreateTeammateIn = {
  tenant_id: string;
  email: string;
  password: string;
  full_name?: string;
  role: "owner" | "admin" | "member";
};

export async function createTeammate(
  data: CreateTeammateIn,
): Promise<SuperAdminUser> {
  return request<SuperAdminUser>("/superadmin/users", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateUser(
  id: string,
  data: {
    role?: "owner" | "admin" | "member";
    is_active?: boolean;
    is_superadmin?: boolean;
    new_password?: string;
  },
): Promise<SuperAdminUser> {
  return request<SuperAdminUser>(`/superadmin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export type SuperAdminTicket = {
  id: string;
  ticket_number: number;
  ticket_number_display: string;
  tenant_id: string;
  tenant_name: string;
  user_email: string;
  subject: string;
  category: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Replied" | "Resolved" | "Closed" | string;
  message: string;
  created_at: string;
  updated_at: string;
};

export type SuperAdminTicketReply = {
  id: string;
  ticket_id: string;
  message: string;
  created_at: string;
};

export async function listTickets(
  params: {
    q?: string;
    status_filter?: string;
    limit?: number;
    offset?: number;
  } = {},
): Promise<Page<SuperAdminTicket>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.status_filter) search.set("status_filter", params.status_filter);
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  return request<Page<SuperAdminTicket>>(`/superadmin/tickets?${search}`);
}

export function useTicketsSWR(
  params: { q?: string; status_filter?: string } = {},
): SWRResponse<Page<SuperAdminTicket>> {
  return useSWR(
    ["superadmin-tickets", params.q ?? "", params.status_filter ?? ""],
    () => listTickets(params),
  );
}

export async function listTicketReplies(
  ticketId: string,
): Promise<SuperAdminTicketReply[]> {
  return request<SuperAdminTicketReply[]>(
    `/superadmin/tickets/${ticketId}/replies`,
  );
}

export function useTicketRepliesSWR(
  ticketId: string | null,
): SWRResponse<SuperAdminTicketReply[]> {
  return useSWR(
    ticketId ? ["superadmin-ticket-replies", ticketId] : null,
    () => listTicketReplies(ticketId!),
  );
}

export async function replyToTicket(
  ticketId: string,
  message: string,
): Promise<SuperAdminTicketReply> {
  return request<SuperAdminTicketReply>(
    `/superadmin/tickets/${ticketId}/replies`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  );
}

export async function updateTicket(
  ticketId: string,
  data: { status?: string },
): Promise<SuperAdminTicket> {
  return request<SuperAdminTicket>(`/superadmin/tickets/${ticketId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export type SuperAdminDemoAccess = {
  id: string;
  email: string;
  ip: string | null;
  request_count: number;
  first_requested_at: string;
  last_requested_at: string;
};

export async function listDemoRequests(
  params: { q?: string; limit?: number; offset?: number } = {},
): Promise<Page<SuperAdminDemoAccess>> {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  search.set("limit", String(params.limit ?? 50));
  search.set("offset", String(params.offset ?? 0));
  return request<Page<SuperAdminDemoAccess>>(
    `/superadmin/demo-requests?${search}`,
  );
}

export function useDemoRequestsSWR(
  params: { q?: string } = {},
): SWRResponse<Page<SuperAdminDemoAccess>> {
  return useSWR(["superadmin-demo-requests", params.q ?? ""], () =>
    listDemoRequests(params),
  );
}

/** Queues the fixed follow-up template. 204, no body. */
export async function sendDemoMarketingEmail(id: string): Promise<void> {
  await request<void>(`/superadmin/demo-requests/${id}/send-marketing-email`, {
    method: "POST",
  });
}

// =============================================================================
//  Vercel domain cleanup — mirrors app/vercel.py's orphaned_domains_report.
//  "review" domains (custom domains, the real wildcard *.SITE_BASE_DOMAIN)
//  are NEVER auto-detachable from this page — only shown for awareness.
// =============================================================================

export type SuperAdminVercelTemplateReport = {
  project_id: string;
  orphaned: string[];
  review: string[];
};

export type SuperAdminVercelOrphans = {
  templates: Record<string, SuperAdminVercelTemplateReport>;
};

export async function listOrphanedVercelDomains(): Promise<SuperAdminVercelOrphans> {
  return request<SuperAdminVercelOrphans>("/superadmin/vercel/orphaned-domains");
}

export function useOrphanedVercelDomainsSWR(): SWRResponse<SuperAdminVercelOrphans> {
  return useSWR("superadmin-vercel-orphaned-domains", listOrphanedVercelDomains);
}

export type SuperAdminVercelDetachResult = {
  results: { domain: string; success: boolean }[];
};

export async function detachVercelDomains(
  domains: { domain: string; project_id: string }[],
): Promise<SuperAdminVercelDetachResult> {
  return request<SuperAdminVercelDetachResult>(
    `/superadmin/vercel/orphaned-domains/detach`,
    { method: "POST", body: JSON.stringify({ domains }) },
  );
}
