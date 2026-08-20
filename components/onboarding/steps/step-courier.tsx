"use client";

import { useMemo, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { CourierCard } from "@/components/courier/courier-card";
import { COURIER_CATALOG } from "@/components/courier/courier-data";
import {
  SteadfastConnectModal,
  type SteadfastConnectValues,
} from "@/components/courier/steadfast-connect-modal";
import { useToast } from "@/components/ui/toast";
import { MaskIcon } from "@/components/ui/mask-icon";
import {
  connectSteadfast,
  disconnectCourier,
  listCourierConnections,
} from "@/lib/api/courier";
import { useOnboarding } from "../onboarding-context";

export function StepCourier() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const { state, dispatch } = useOnboarding();
  const [connectOpen, setConnectOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectionsByProvider = useMemo(() => {
    const map = new Map(state.courierConnections.map((c) => [c.provider, c]));
    return map;
  }, [state.courierConnections]);

  async function refresh() {
    if (!currentSite?.id) return;
    const connections = await listCourierConnections(currentSite.id);
    dispatch({ type: "setCourierConnections", connections });
  }

  async function handleSteadfastConnect(values: SteadfastConnectValues) {
    setBusy(true);
    setError(null);
    try {
      if (currentSite?.id) {
        await connectSteadfast(currentSite.id, {
          api_key: values.apiKey,
          secret_key: values.secretKey,
          base_url: values.baseUrl || undefined,
          label: values.label || undefined,
        });
        await refresh();
      }
      setConnectOpen(false);
      toast({ title: "Steadfast connected", variant: "success" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't connect Steadfast.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect(connectionId: string) {
    if (!currentSite?.id) return;
    try {
      await disconnectCourier(currentSite.id, connectionId);
      await refresh();
    } catch (err) {
      toast({
        title: "Couldn't disconnect",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MaskIcon src="/sidebar/delivery.svg" className="size-4 text-primary" />
        Connect a courier service (optional)
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {COURIER_CATALOG.map((entry) => {
          const connection = connectionsByProvider.get(entry.provider) ?? null;
          return (
            <CourierCard
              key={entry.provider}
              entry={entry}
              connection={connection}
              onConnect={() => {
                if (entry.provider === "steadfast") {
                  setConnectOpen(true);
                  return;
                }
                toast({
                  title: "Coming soon",
                  description: `${entry.name} unlocks when that integration ships.`,
                  variant: "info",
                });
              }}
              onDisconnect={() => {
                if (connection) handleDisconnect(connection.id);
              }}
              onUnlock={() =>
                toast({
                  title: "Coming soon",
                  description: `${entry.name} unlocks when that integration ships.`,
                  variant: "info",
                })
              }
            />
          );
        })}
      </div>

      <SteadfastConnectModal
        open={connectOpen}
        busy={busy}
        error={error}
        onClose={() => setConnectOpen(false)}
        onConnect={handleSteadfastConnect}
      />
    </div>
  );
}
