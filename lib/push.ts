/**
 * Browser-side Web Push subscribe flow. Requires a user gesture to call
 * Notification.requestPermission() reliably across browsers, so this is
 * only ever invoked from a click handler (the bell dropdown's "Enable
 * notifications" button) — never automatically on page load.
 */

import { subscribePush, unsubscribePush } from "./api/push";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    VAPID_PUBLIC_KEY !== ""
  );
}

export function pushPermission(): NotificationPermission | "unsupported" {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

// Web Push wants the VAPID key as a raw Uint8Array, but it's stored/shipped
// as base64url (the same format app/push.py generates it in).
function urlBase64ToUint8Array(base64url: string): BufferSource {
  const padding = "=".repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

export async function enablePushForSite(siteId: string): Promise<boolean> {
  if (!pushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return false;

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await subscribePush(siteId, subscription.toJSON() as PushSubscriptionJSON);
  return true;
}

export async function disablePushForSite(siteId: string): Promise<void> {
  if (!("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration("/sw.js");
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  await unsubscribePush(siteId, subscription.endpoint).catch(() => {});
  await subscription.unsubscribe();
}
