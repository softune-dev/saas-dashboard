/**
 * Dashboard bell notifications — mirrors app/api/notifications.py exactly.
 *
 * Rows are created server-side as a side effect of other writes (a new
 * order, a publish/unpublish — see app/notifications.py's notify()); there
 * is no create call here, only list + mark-read.
 *
 * useNotificationsSWR polls every 5s. That's the whole "real-time" story —
 * no websocket/SSE server exists for this yet. A 30-row list scoped to one
 * site by an indexed query is cheap enough to poll this often; push
 * notifications (app/push.py) are the actually-instant path for anyone who
 * enabled them, this interval is just how fast the in-app bell/toast catch
 * up for everyone else.
 */

import useSWR, { type SWRResponse } from "swr";
import { request } from "../api";

export type NotificationType =
  | "order_created"
  | "order_blocked"
  | "site_published"
  | "site_unpublished";

export type NotificationOut = {
  id: string;
  site_id: string;
  type: NotificationType;
  title: string;
  body: string;
  link: string | null;
  read_at: string | null;
  created_at: string;
};

export async function listNotifications(
  siteId: string,
): Promise<NotificationOut[]> {
  return request<NotificationOut[]>(`/sites/${siteId}/notifications`);
}

export function useNotificationsSWR(
  siteId: string | null,
): SWRResponse<NotificationOut[]> {
  return useSWR(
    siteId ? [siteId, "notifications"] : null,
    ([id]) => listNotifications(id),
    { refreshInterval: 5000 },
  );
}

export async function markNotificationRead(
  siteId: string,
  id: string,
): Promise<NotificationOut> {
  return request<NotificationOut>(
    `/sites/${siteId}/notifications/${id}/read`,
    { method: "POST" },
  );
}

export async function markAllNotificationsRead(siteId: string): Promise<void> {
  await request<void>(`/sites/${siteId}/notifications/read-all`, {
    method: "POST",
  });
}
