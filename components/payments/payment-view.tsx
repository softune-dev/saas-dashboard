"use client";

import { Wallet } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { useToast } from "@/components/ui/toast";
import {
  connectPayment,
  disconnectPayment,
  usePaymentConnectionsSWR,
  type PaymentConnectionOut,
} from "@/lib/api/payments";
import { BkashConnectModal, type BkashConnectValues } from "./bkash-connect-modal";
import { CodConnectModal, type CodConnectValues } from "./cod-connect-modal";
import {
  ManualConnectModal,
  type ManualConnectValues,
} from "./manual-connect-modal";
import { NagadConnectModal, type NagadConnectValues } from "./nagad-connect-modal";
import {
  SslcommerzConnectModal,
  type SslcommerzConnectValues,
} from "./sslcommerz-connect-modal";
import { PAYMENT_CATALOG, type PaymentProvider } from "./payment-data";
import { PaymentCard } from "./payment-card";
import type { PaymentConnection } from "./payment-types";

/** Adapts the real API shape to the presentational components' mock-era
 * shape (PaymentCard/modals only ever cared about a flat display record,
 * built when this page was UI-only) — avoids touching those components. */
function toDisplayConnection(out: PaymentConnectionOut): PaymentConnection {
  return {
    provider: out.provider,
    label: out.label ?? undefined,
    codFee:
      out.config.cod_fee_cents != null ? String(out.config.cod_fee_cents / 100) : undefined,
    paymentNumber: out.config.payment_number,
    wallets: out.config.wallets?.filter(
      (w): w is "bkash" | "nagad" => w === "bkash" || w === "nagad",
    ),
    apiKeyHint: out.api_key_hint ?? undefined,
    merchantId: out.config.merchant_id,
    status: out.status,
    lastVerifiedAt: out.last_verified_at,
  };
}

export function PaymentView() {
  const { currentSite, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;

  const {
    data: connectionRows = [],
    error: swrError,
    isLoading: connectionsLoading,
    mutate,
  } = usePaymentConnectionsSWR(siteId);
  const connections = connectionRows.map(toDisplayConnection);

  const [codOpen, setCodOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [bkashOpen, setBkashOpen] = useState(false);
  const [sslOpen, setSslOpen] = useState(false);
  const [nagadOpen, setNagadOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [disconnecting, setDisconnecting] = useState<PaymentConnectionOut | null>(
    null,
  );

  function connectionFor(provider: PaymentProvider) {
    return connections.find((c) => c.provider === provider) ?? null;
  }
  function rowFor(provider: PaymentProvider) {
    return connectionRows.find((c) => c.provider === provider) ?? null;
  }

  function openConfig(provider: PaymentProvider) {
    setConnectError(null);
    if (provider === "cod") {
      setCodOpen(true);
      return;
    }
    if (provider === "manual") {
      setManualOpen(true);
      return;
    }
    if (provider === "bkash") {
      setBkashOpen(true);
      return;
    }
    if (provider === "sslcommerz") {
      setSslOpen(true);
      return;
    }
    if (provider === "nagad") {
      setNagadOpen(true);
    }
  }

  /** Close first, then patch the list from the POST body — waiting on
   * mutate() left the modal on "Saving…" after the card had already
   * updated (same pattern as courier applyConnection). */
  function applyConnection(row: PaymentConnectionOut) {
    mutate(
      (prev = []) => [row, ...prev.filter((c) => c.provider !== row.provider)],
      false,
    );
  }

  async function handleCodConnect(values: CodConnectValues) {
    if (!siteId) return;
    setBusy(true);
    try {
      const feeTaka = values.codFee.trim();
      const row = await connectPayment(siteId, "cod", {
        label: "Cash on Delivery",
        cod_fee_cents: feeTaka ? Math.round(parseFloat(feeTaka) * 100) : undefined,
      });
      applyConnection(row);
      setCodOpen(false);
      toast({ title: "Cash on Delivery saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save Cash on Delivery",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleManualConnect(values: ManualConnectValues) {
    if (!siteId) return;
    setBusy(true);
    try {
      const row = await connectPayment(siteId, "manual", {
        label: "Manual Payment",
        payment_number: values.paymentNumber,
        wallets: values.wallets,
      });
      applyConnection(row);
      setManualOpen(false);
      toast({ title: "Manual Payment saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save Manual Payment",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleBkashConnect(values: BkashConnectValues) {
    if (!siteId) return;
    setBusy(true);
    setConnectError(null);
    try {
      const row = await connectPayment(siteId, "bkash", {
        api_key: values.appKey,
        secret_key: values.appSecret,
        username: values.username,
        password: values.password,
        sandbox: values.sandbox,
        label: values.label || undefined,
      });
      applyConnection(row);
      setBkashOpen(false);
      if (row.last_verified_at) {
        toast({ title: "bKash connected", variant: "success" });
      } else {
        toast({
          title: "Saved, but bKash rejected these credentials",
          description: "Double-check the details, then reconnect.",
          variant: "info",
        });
      }
    } catch (err) {
      // Generic only — never echo keys/passwords back into the UI.
      setConnectError(
        err instanceof Error ? err.message : "Couldn't connect bKash.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSslConnect(values: SslcommerzConnectValues) {
    if (!siteId) return;
    setBusy(true);
    setConnectError(null);
    try {
      const row = await connectPayment(siteId, "sslcommerz", {
        api_key: values.storeId,
        secret_key: values.storePassword,
        sandbox: values.sandbox,
        label: values.label || undefined,
      });
      applyConnection(row);
      setSslOpen(false);
      toast({
        title: "SSLCommerz saved — not yet verified",
        variant: "info",
      });
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : "Couldn't save SSLCommerz.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleNagadConnect(values: NagadConnectValues) {
    if (!siteId) return;
    setBusy(true);
    setConnectError(null);
    try {
      const row = await connectPayment(siteId, "nagad", {
        merchant_id: values.merchantId,
        merchant_private_key: values.merchantPrivateKey,
        nagad_public_key: values.nagadPublicKey,
        sandbox: values.sandbox,
        label: values.label || undefined,
      });
      applyConnection(row);
      setNagadOpen(false);
      toast({
        title: "Nagad saved — not yet verified",
        variant: "info",
      });
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : "Couldn't save Nagad.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    if (!disconnecting || !siteId) return;
    try {
      await disconnectPayment(siteId, disconnecting.id);
      await mutate((prev = []) => prev.filter((c) => c.id !== disconnecting.id), false);
      toast({
        title: `${disconnecting.provider} disconnected`,
        variant: "success",
      });
    } catch (err) {
      toast({
        title: "Couldn't disconnect",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setDisconnecting(null);
    }
  }

  if (!sessionLoading && !currentSite) {
    return (
      <div className="flex flex-col gap-4 pb-2">
        <PageHeading title="Payments" />
        <EmptyState
          icon={Wallet}
          title="No site yet"
          description="Create a site from a template in Themes before configuring payment methods."
        />
      </div>
    );
  }

  const showSkeleton = sessionLoading || connectionsLoading;
  const error = swrError instanceof Error ? swrError.message : swrError ? "Failed to load payment methods" : null;
  const codConnection = connectionFor("cod");
  const manualConnection = connectionFor("manual");

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title="Payments" />

      {showSkeleton ? (
        <div className="grid grid-cols-1 gap-5 px-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={Wallet} title="Couldn't load payment methods" description={error} />
      ) : (
        <div className="grid grid-cols-1 gap-5 px-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PAYMENT_CATALOG.map((entry) => {
            const connection = connectionFor(entry.provider);
            return (
              <PaymentCard
                key={entry.provider}
                entry={entry}
                connection={connection}
                onConnect={() => openConfig(entry.provider)}
                onManage={() => openConfig(entry.provider)}
                onDisconnect={() => setDisconnecting(rowFor(entry.provider))}
                onUnlock={() =>
                  toast({
                    title: `${entry.name} is locked`,
                    description:
                      "Upgrade your plan in Billing to unlock this gateway.",
                    variant: "info",
                  })
                }
              />
            );
          })}
        </div>
      )}

      <CodConnectModal
        open={codOpen}
        busy={busy}
        initialFee={codConnection?.codFee ?? ""}
        onClose={() => setCodOpen(false)}
        onConnect={handleCodConnect}
      />
      <ManualConnectModal
        open={manualOpen}
        busy={busy}
        initialNumber={manualConnection?.paymentNumber ?? ""}
        initialWallets={manualConnection?.wallets ?? ["bkash"]}
        onClose={() => setManualOpen(false)}
        onConnect={handleManualConnect}
      />
      <BkashConnectModal
        open={bkashOpen}
        busy={busy}
        error={connectError}
        onClose={() => {
          setBkashOpen(false);
          setConnectError(null);
        }}
        onConnect={handleBkashConnect}
      />
      <SslcommerzConnectModal
        open={sslOpen}
        busy={busy}
        error={connectError}
        onClose={() => {
          setSslOpen(false);
          setConnectError(null);
        }}
        onConnect={handleSslConnect}
      />
      <NagadConnectModal
        open={nagadOpen}
        busy={busy}
        error={connectError}
        onClose={() => {
          setNagadOpen(false);
          setConnectError(null);
        }}
        onConnect={handleNagadConnect}
      />

      <ConfirmDialog
        open={!!disconnecting}
        title={`Disconnect ${disconnecting?.provider ?? "payment method"}?`}
        description="You can reconnect anytime. Checkout will stop offering this method until you enable it again."
        confirmLabel="Disconnect"
        destructive
        onConfirm={handleDisconnect}
        onCancel={() => setDisconnecting(null)}
      />
    </div>
  );
}
