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
import { CodConnectModal, type CodConnectValues } from "./cod-connect-modal";
import {
  GatewayConnectModal,
  type GatewayConnectValues,
} from "./gateway-connect-modal";
import {
  ManualConnectModal,
  type ManualConnectValues,
} from "./manual-connect-modal";
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
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [gatewayProvider, setGatewayProvider] =
    useState<PaymentProvider | null>(null);
  const [busy, setBusy] = useState(false);

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
    if (provider === "cod") {
      setCodOpen(true);
      return;
    }
    if (provider === "manual") {
      setManualOpen(true);
      return;
    }
    setGatewayProvider(provider);
    setGatewayOpen(true);
  }

  async function handleCodConnect(values: CodConnectValues) {
    if (!siteId) return;
    setBusy(true);
    try {
      const feeTaka = values.codFee.trim();
      await connectPayment(siteId, "cod", {
        label: "Cash on Delivery",
        cod_fee_cents: feeTaka ? Math.round(parseFloat(feeTaka) * 100) : undefined,
      });
      await mutate();
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
      await connectPayment(siteId, "manual", {
        label: "Manual Payment",
        payment_number: values.paymentNumber,
        wallets: values.wallets,
      });
      await mutate();
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

  async function handleGatewayConnect(values: GatewayConnectValues) {
    if (!gatewayProvider || !siteId) return;
    setBusy(true);
    try {
      await connectPayment(siteId, gatewayProvider, {
        label: values.label || undefined,
        merchant_id: values.merchantId || undefined,
        api_key: values.apiKey,
        secret_key: values.secretKey,
      });
      await mutate();
      setGatewayOpen(false);
      setGatewayProvider(null);
      toast({ title: "Payment method connected", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't connect",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
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
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-white" />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={Wallet} title="Couldn't load payment methods" description={error} />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
      <GatewayConnectModal
        open={gatewayOpen}
        provider={gatewayProvider}
        providerName={
          PAYMENT_CATALOG.find((e) => e.provider === gatewayProvider)?.name
        }
        comingSoon={
          gatewayProvider
            ? !PAYMENT_CATALOG.find((e) => e.provider === gatewayProvider)
                ?.available
            : false
        }
        busy={busy}
        onClose={() => {
          setGatewayOpen(false);
          setGatewayProvider(null);
        }}
        onConnect={handleGatewayConnect}
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
