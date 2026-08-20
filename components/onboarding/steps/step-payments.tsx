"use client";

import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { CodConnectModal, type CodConnectValues } from "@/components/payments/cod-connect-modal";
import {
  GatewayConnectModal,
  type GatewayConnectValues,
} from "@/components/payments/gateway-connect-modal";
import {
  ManualConnectModal,
  type ManualConnectValues,
} from "@/components/payments/manual-connect-modal";
import { PaymentCard } from "@/components/payments/payment-card";
import { PAYMENT_CATALOG, type PaymentProvider } from "@/components/payments/payment-data";
import type { PaymentConnection } from "@/components/payments/payment-types";
import { useToast } from "@/components/ui/toast";
import { MaskIcon } from "@/components/ui/mask-icon";
import { connectPayment, disconnectPayment, listPaymentConnections } from "@/lib/api/payments";
import { useOnboarding } from "../onboarding-context";

export function StepPayments() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const { state, dispatch } = useOnboarding();
  const siteId = currentSite?.id ?? null;

  const [codOpen, setCodOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [gatewayOpen, setGatewayOpen] = useState(false);
  const [gatewayProvider, setGatewayProvider] = useState<PaymentProvider | null>(
    null,
  );
  const [busy, setBusy] = useState(false);

  const connections = state.paymentConnections;

  // PaymentCard's prop type predates the real API (it was built for a mock
  // with a flat shape) — adapt the real PaymentConnectionOut into it here
  // rather than widening the shared component type for one caller.
  function connectionFor(provider: PaymentProvider): PaymentConnection | null {
    const c = connections.find((c) => c.provider === provider);
    if (!c) return null;
    return {
      provider: c.provider,
      label: c.label ?? undefined,
      codFee:
        c.config.cod_fee_cents != null ? String(c.config.cod_fee_cents / 100) : undefined,
      paymentNumber: c.config.payment_number,
      wallets: c.config.wallets,
      apiKeyHint: c.api_key_hint ?? undefined,
      merchantId: c.config.merchant_id,
    };
  }

  async function refresh() {
    if (!siteId) return;
    const fresh = await listPaymentConnections(siteId);
    dispatch({ type: "setPaymentConnections", connections: fresh });
  }

  async function handleDisconnect(connectionId: string) {
    if (!siteId) return;
    try {
      await disconnectPayment(siteId, connectionId);
      await refresh();
    } catch (err) {
      toast({
        title: "Couldn't disconnect",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    }
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

  async function handleCod(values: CodConnectValues) {
    setBusy(true);
    try {
      if (siteId) {
        const feeTaka = values.codFee.trim();
        await connectPayment(siteId, "cod", {
          label: "Cash on Delivery",
          cod_fee_cents: feeTaka ? Math.round(parseFloat(feeTaka) * 100) : undefined,
        });
        await refresh();
      }
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

  async function handleManual(values: ManualConnectValues) {
    setBusy(true);
    try {
      if (siteId) {
        await connectPayment(siteId, "manual", {
          label: "Manual Payment",
          payment_number: values.paymentNumber,
          wallets: values.wallets,
        });
        await refresh();
      }
      setManualOpen(false);
      toast({ title: "Manual payment saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save manual payment",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusy(false);
    }
  }

  async function handleGateway(values: GatewayConnectValues) {
    if (!gatewayProvider) return;
    setBusy(true);
    try {
      if (siteId) {
        await connectPayment(siteId, gatewayProvider, {
          label: gatewayProvider,
          merchant_id: values.merchantId,
          api_key: values.apiKey,
          secret_key: values.secretKey,
        });
        await refresh();
      }
      setGatewayOpen(false);
      toast({ title: `${gatewayProvider} saved`, variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save gateway",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusy(false);
    }
  }

  const cod = connectionFor("cod");
  const manual = connectionFor("manual");

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MaskIcon src="/sidebar/wallet.svg" className="size-4 text-primary" />
        Enable at least one payment method
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PAYMENT_CATALOG.map((entry) => (
          <PaymentCard
            key={entry.provider}
            entry={entry}
            connection={connectionFor(entry.provider)}
            onConnect={() => openConfig(entry.provider)}
            onManage={() => openConfig(entry.provider)}
            onDisconnect={() => {
              const conn = connections.find((c) => c.provider === entry.provider);
              if (conn) handleDisconnect(conn.id);
            }}
            onUnlock={() =>
              toast({
                title: "Coming soon",
                description: `${entry.name} unlocks when merchant credentials are ready.`,
                variant: "info",
              })
            }
          />
        ))}
      </div>

      <CodConnectModal
        open={codOpen}
        busy={busy}
        initialFee={cod?.codFee ?? ""}
        onClose={() => setCodOpen(false)}
        onConnect={handleCod}
      />
      <ManualConnectModal
        open={manualOpen}
        busy={busy}
        initialNumber={manual?.paymentNumber ?? ""}
        initialWallets={manual?.wallets ?? ["bkash"]}
        onClose={() => setManualOpen(false)}
        onConnect={handleManual}
      />
      <GatewayConnectModal
        open={gatewayOpen}
        busy={busy}
        provider={gatewayProvider}
        providerName={
          PAYMENT_CATALOG.find((p) => p.provider === gatewayProvider)?.name
        }
        comingSoon={
          gatewayProvider
            ? !PAYMENT_CATALOG.find((p) => p.provider === gatewayProvider)
                ?.available
            : true
        }
        onClose={() => setGatewayOpen(false)}
        onConnect={handleGateway}
      />
    </div>
  );
}
