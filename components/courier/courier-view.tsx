"use client";

import { Truck } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { useToast } from "@/components/ui/toast";
import {
  connectEcourier,
  connectPathao,
  connectRedx,
  connectSteadfast,
  disconnectCourier,
  useCourierConnectionsSWR,
  type CourierConnectionOut,
  type CourierProvider,
} from "@/lib/api/courier";
import { COURIER_CATALOG } from "./courier-data";
import { CourierCard } from "./courier-card";
import {
  SteadfastConnectModal,
  type SteadfastConnectValues,
} from "./steadfast-connect-modal";
import { RedxConnectModal, type RedxConnectValues } from "./redx-connect-modal";
import { PathaoConnectModal, type PathaoConnectValues } from "./pathao-connect-modal";
import { EcourierConnectModal, type EcourierConnectValues } from "./ecourier-connect-modal";

export function CourierView() {
  const { currentSite, loading: sessionLoading } = useSession();
  const { toast } = useToast();

  const {
    data: connections = [],
    error: swrError,
    isLoading: loading,
    mutate,
  } = useCourierConnectionsSWR(currentSite?.id ?? null);
  const error = swrError instanceof Error ? swrError.message : swrError ? "Failed to load couriers" : null;

  const [connectingProvider, setConnectingProvider] = useState<CourierProvider | null>(null);
  const [connectBusy, setConnectBusy] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [disconnecting, setDisconnecting] = useState<CourierConnectionOut | null>(null);
  const [disconnectBusy, setDisconnectBusy] = useState(false);

  function applyConnection(connection: CourierConnectionOut, providerLabel: string) {
    mutate((prev = []) => [connection, ...prev.filter((c) => c.id !== connection.id)], false);
    setConnectingProvider(null);
    if (connection.status === "connected") {
      toast({ title: `${providerLabel} connected`, variant: "success" });
    } else {
      toast({
        title: `Saved, but ${providerLabel} rejected these credentials`,
        description: "Double-check your credentials, then reconnect.",
        variant: "info",
      });
    }
  }

  async function handleConnectSteadfast(values: SteadfastConnectValues) {
    if (!currentSite) return;
    setConnectBusy(true);
    setConnectError(null);
    try {
      const connection = await connectSteadfast(currentSite.id, {
        api_key: values.apiKey,
        secret_key: values.secretKey,
        base_url: values.baseUrl || undefined,
        label: values.label || undefined,
      });
      applyConnection(connection, "Steadfast");
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Couldn't connect Steadfast.");
    } finally {
      setConnectBusy(false);
    }
  }

  async function handleConnectRedx(values: RedxConnectValues) {
    if (!currentSite) return;
    setConnectBusy(true);
    setConnectError(null);
    try {
      const connection = await connectRedx(currentSite.id, {
        access_token: values.accessToken,
        base_url: values.baseUrl || undefined,
        label: values.label || undefined,
      });
      applyConnection(connection, "RedX");
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Couldn't connect RedX.");
    } finally {
      setConnectBusy(false);
    }
  }

  async function handleConnectEcourier(values: EcourierConnectValues) {
    if (!currentSite) return;
    setConnectBusy(true);
    setConnectError(null);
    try {
      const connection = await connectEcourier(currentSite.id, {
        username: values.username,
        password: values.password,
        label: values.label || undefined,
      });
      applyConnection(connection, "eCourier");
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Couldn't connect eCourier.");
    } finally {
      setConnectBusy(false);
    }
  }

  async function handleConnectPathao(values: PathaoConnectValues) {
    if (!currentSite) return;
    setConnectBusy(true);
    setConnectError(null);
    try {
      const connection = await connectPathao(currentSite.id, {
        client_id: values.clientId,
        client_secret: values.clientSecret,
        username: values.username,
        password: values.password,
        base_url: values.baseUrl || undefined,
        label: values.label || undefined,
      });
      applyConnection(connection, "Pathao");
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Couldn't connect Pathao.");
    } finally {
      setConnectBusy(false);
    }
  }

  async function handleDisconnect() {
    if (!currentSite || !disconnecting) return;
    setDisconnectBusy(true);
    try {
      await disconnectCourier(currentSite.id, disconnecting.id);
      mutate((prev = []) => prev.filter((c) => c.id !== disconnecting.id), false);
      toast({ title: `${disconnecting.provider} disconnected`, variant: "success" });
      setDisconnecting(null);
    } catch (err) {
      toast({
        title: "Couldn't disconnect",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setDisconnectBusy(false);
    }
  }

  if (!sessionLoading && !currentSite) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <PageHeading title="Courier" />
        <EmptyState
          icon={Truck}
          title="No site yet"
          description="Create a site from a template in Themes before connecting couriers."
        />
      </div>
    );
  }

  const showSkeleton = sessionLoading || (loading && currentSite);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Courier" />

      {showSkeleton ? (
        <div className="grid grid-cols-1 gap-5 px-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={Truck} title="Couldn't load couriers" description={error} />
      ) : (
        <div className="grid grid-cols-1 gap-5 px-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {COURIER_CATALOG.map((entry) => {
            const connection = connections.find((c) => c.provider === entry.provider) ?? null;
            return (
              <CourierCard
                key={entry.provider}
                entry={entry}
                connection={connection}
                onConnect={() => {
                  setConnectError(null);
                  setConnectingProvider(entry.provider);
                }}
                onDisconnect={() => setDisconnecting(connection)}
                onUnlock={() =>
                  toast({
                    title: `${entry.name} is locked`,
                    description:
                      "Upgrade your plan in Billing to unlock this courier.",
                    variant: "info",
                  })
                }
              />
            );
          })}
        </div>
      )}

      <SteadfastConnectModal
        open={connectingProvider === "steadfast"}
        busy={connectBusy}
        error={connectError}
        onClose={() => setConnectingProvider(null)}
        onConnect={handleConnectSteadfast}
      />

      <RedxConnectModal
        open={connectingProvider === "redx"}
        busy={connectBusy}
        error={connectError}
        onClose={() => setConnectingProvider(null)}
        onConnect={handleConnectRedx}
      />

      <PathaoConnectModal
        open={connectingProvider === "pathao"}
        busy={connectBusy}
        error={connectError}
        onClose={() => setConnectingProvider(null)}
        onConnect={handleConnectPathao}
      />

      <EcourierConnectModal
        open={connectingProvider === "ecourier"}
        busy={connectBusy}
        error={connectError}
        onClose={() => setConnectingProvider(null)}
        onConnect={handleConnectEcourier}
      />

      <ConfirmDialog
        open={!!disconnecting}
        title={`Disconnect ${disconnecting?.provider ?? "courier"}?`}
        description="You'll need to re-enter API credentials to reconnect."
        confirmLabel="Disconnect"
        destructive
        busy={disconnectBusy}
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnecting(null)}
      />
    </div>
  );
}
