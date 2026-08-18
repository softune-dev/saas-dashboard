import type { StatCardData } from "@/components/dashboard/stats/stats-data";

export type TicketStatus = "Open" | "In Progress" | "Resolved" | "Closed";
export type TicketPriority = "Low" | "Medium" | "High";

export type HelpTicket = {
  id: string;
  ticketId: string;
  subject: string;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  updatedAt: string;
  createdAt: string;
};

export type HelpTopic = {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
};

export const helpStats: StatCardData[] = [
  {
    id: "open",
    title: "Open tickets",
    value: "6",
    changePercent: 20.0,
    lastMonthValue: "5",
    icon: "/sidebar/help-desk.svg",
  },
  {
    id: "progress",
    title: "In progress",
    value: "3",
    changePercent: -25.0,
    lastMonthValue: "4",
    icon: "/sidebar/inbox.svg",
  },
  {
    id: "resolved",
    title: "Resolved",
    value: "28",
    changePercent: 16.7,
    lastMonthValue: "24",
    icon: "/sidebar/note.svg",
  },
  {
    id: "avg",
    title: "Avg. reply",
    value: "4h",
    changePercent: -12.5,
    lastMonthValue: "4.5h",
    icon: "/sidebar/notification.svg",
  },
];

export const ticketCategories = [
  { value: "Billing", label: "Billing" },
  { value: "Technical", label: "Technical" },
  { value: "Domain", label: "Domain" },
  { value: "Shipping", label: "Shipping" },
  { value: "Account", label: "Account" },
  { value: "Other", label: "Other" },
];

export const priorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
];

export const tickets: HelpTicket[] = [
  {
    id: "1",
    ticketId: "#HD-24081",
    subject: "Domain SSL not issuing",
    category: "Domain",
    priority: "High",
    status: "In Progress",
    updatedAt: "Aug 8, 2026",
    createdAt: "Aug 7, 2026",
  },
  {
    id: "2",
    ticketId: "#HD-24080",
    subject: "Invoice download missing",
    category: "Billing",
    priority: "Medium",
    status: "Open",
    updatedAt: "Aug 8, 2026",
    createdAt: "Aug 8, 2026",
  },
  {
    id: "3",
    ticketId: "#HD-24075",
    subject: "Need help with shipping zones",
    category: "Shipping",
    priority: "Low",
    status: "Resolved",
    updatedAt: "Aug 6, 2026",
    createdAt: "Aug 5, 2026",
  },
  {
    id: "4",
    ticketId: "#HD-24070",
    subject: "Cannot update store logo",
    category: "Technical",
    priority: "Medium",
    status: "Open",
    updatedAt: "Aug 5, 2026",
    createdAt: "Aug 5, 2026",
  },
  {
    id: "5",
    ticketId: "#HD-24061",
    subject: "Change account email",
    category: "Account",
    priority: "Low",
    status: "Closed",
    updatedAt: "Aug 3, 2026",
    createdAt: "Aug 1, 2026",
  },
  {
    id: "6",
    ticketId: "#HD-24055",
    subject: "Checkout not loading on mobile",
    category: "Technical",
    priority: "High",
    status: "In Progress",
    updatedAt: "Aug 4, 2026",
    createdAt: "Aug 3, 2026",
  },
  {
    id: "7",
    ticketId: "#HD-24048",
    subject: "Refund not reflected",
    category: "Billing",
    priority: "Medium",
    status: "Resolved",
    updatedAt: "Aug 2, 2026",
    createdAt: "Jul 30, 2026",
  },
];

export const helpTopics: HelpTopic[] = [
  {
    id: "1",
    title: "Connect a custom domain",
    category: "Domain",
    description: "Point DNS and issue SSL for your store.",
    icon: "/sidebar/domain.svg",
  },
  {
    id: "2",
    title: "Set up delivery locations",
    category: "Shipping",
    description: "Zones, rates, and free shipping rules.",
    icon: "/sidebar/delivery.svg",
  },
  {
    id: "3",
    title: "Manage your subscription",
    category: "Billing",
    description: "Plans, invoices, and payment methods.",
    icon: "/sidebar/billing.svg",
  },
  {
    id: "4",
    title: "Reset account password",
    category: "Account",
    description: "Secure login and recovery options.",
    icon: "/sidebar/account.svg",
  },
  {
    id: "5",
    title: "Theme editor basics",
    category: "Themes",
    description: "Brand, colors, pages, and sections.",
    icon: "/sidebar/themes.svg",
  },
  {
    id: "6",
    title: "Track and fulfill orders",
    category: "Orders",
    description: "Statuses, packing, and customer updates.",
    icon: "/sidebar/orders.svg",
  },
];
