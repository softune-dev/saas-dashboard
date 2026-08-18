/** Mirrors app/api/push.py exactly — see dashboard/lib/push.ts for the
 * browser-side subscribe flow that calls these. */

import { request } from "../api";

export async function subscribePush(
  siteId: string,
  subscription: PushSubscriptionJSON,
): Promise<void> {
  await request<void>(`/sites/${siteId}/push/subscribe`, {
    method: "POST",
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
    }),
  });
}

export async function unsubscribePush(
  siteId: string,
  endpoint: string,
): Promise<void> {
  await request<void>(`/sites/${siteId}/push/unsubscribe`, {
    method: "POST",
    body: JSON.stringify({ endpoint }),
  });
}
