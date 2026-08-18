/**
 * Push-only service worker — shows an OS notification when the backend
 * sends a push (see app/push.py's send_order_push, new orders only), and
 * focuses/opens the dashboard's orders page on click.
 *
 * Deliberately does nothing else: no offline caching, no asset
 * interception. Registered from dashboard/lib/push.ts.
 */

self.addEventListener("push", (event) => {
  let data = { title: "New notification", body: "", url: "/orders" };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // Non-JSON payload — fall back to the defaults above.
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/favicon.ico",
      data: { url: data.url },
      tag: data.url, // collapses repeat pushes for the same order into one
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/orders";

  event.waitUntil(
    (async () => {
      const clientsList = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });
      for (const client of clientsList) {
        if ("focus" in client) {
          await client.focus();
          if ("navigate" in client) await client.navigate(url);
          return;
        }
      }
      await self.clients.openWindow(url);
    })(),
  );
});
