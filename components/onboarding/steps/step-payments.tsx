"use client";

import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { BkashConnectModal, type BkashConnectValues } from "@/components/payments/bkash-connect-modal";
import { CodConnectModal, type CodConnectValues } from "@/components/payments/cod-connect-modal";
import {
  ManualConnectModal,
  type ManualConnectValues,
} from "@/components/payments/manual-connect-modal";
import { NagadConnectModal, type NagadConnectValues } from "@/components/payments/nagad-connect-modal";
import {
  SslcommerzConnectModal,
  type SslcommerzConnectValues,
} from "@/components/payments/sslcommerz-connect-modal";
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
  const [bkashOpen, setBkashOpen] = useState(false);
  const [sslOpen, setSslOpen] = useState(false);
  const [nagadOpen, setNagadOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

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
      status: c.status,
      lastVerifiedAt: c.last_verified_at,
    };
  }

  async function refresh() {
    if (!siteId) return;
    const fresh = await listPaymentConnections(siteId);
    dispatch({ type: "setPaymentConnections", connections: fresh });
  }

  function applyConnection(row: (typeof connections)[number]) {
    dispatch({
      type: "setPaymentConnections",
      connections: [row, ...connections.filter((c) => c.provider !== row.provider)],
    });
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

  async function handleCod(values: CodConnectValues) {
    setBusy(true);
    try {
      if (siteId) {
        const feeTaka = values.codFee.trim();
        const row = await connectPayment(siteId, "cod", {
          label: "Cash on Delivery",
          cod_fee_cents: feeTaka ? Math.round(parseFloat(feeTaka) * 100) : undefined,
        });
        applyConnection(row);
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
        const row = await connectPayment(siteId, "manual", {
          label: "Manual Payment",
          payment_number: values.paymentNumber,
          wallets: values.wallets,
        });
        applyConnection(row);
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

  async function handleBkash(values: BkashConnectValues) {
    setBusy(true);
    setConnectError(null);
    try {
      if (siteId) {
        const row = await connectPayment(siteId, "bkash", {
          api_key: values.appKey,
          secret_key: values.appSecret,
          username: values.username,
          password: values.password,
          sandbox: values.sandbox,
          label: values.label || undefined,
        });
        applyConnection(row);
        if (row.last_verified_at) {
          toast({ title: "bKash connected", variant: "success" });
        } else {
          toast({
            title: "Saved, but bKash rejected these credentials",
            description: "Double-check the details, then reconnect.",
            variant: "info",
          });
        }
      }
      setBkashOpen(false);
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : "Couldn't connect bKash.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleSsl(values: SslcommerzConnectValues) {
    setBusy(true);
    setConnectError(null);
    try {
      if (siteId) {
        const row = await connectPayment(siteId, "sslcommerz", {
          api_key: values.storeId,
          secret_key: values.storePassword,
          sandbox: values.sandbox,
          label: values.label || undefined,
        });
        applyConnection(row);
      }
      setSslOpen(false);
      toast({ title: "SSLCommerz saved — not yet verified", variant: "info" });
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : "Couldn't save SSLCommerz.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleNagad(values: NagadConnectValues) {
    setBusy(true);
    setConnectError(null);
    try {
      if (siteId) {
        const row = await connectPayment(siteId, "nagad", {
          merchant_id: values.merchantId,
          merchant_private_key: values.merchantPrivateKey,
          nagad_public_key: values.nagadPublicKey,
          sandbox: values.sandbox,
          label: values.label || undefined,
        });
        applyConnection(row);
      }
      setNagadOpen(false);
      toast({ title: "Nagad saved — not yet verified", variant: "info" });
    } catch (err) {
      setConnectError(
        err instanceof Error ? err.message : "Couldn't save Nagad.",
      );
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
      <BkashConnectModal
        open={bkashOpen}
        busy={busy}
        error={connectError}
        onClose={() => {
          setBkashOpen(false);
          setConnectError(null);
        }}
        onConnect={handleBkash}
      />
      <SslcommerzConnectModal
        open={sslOpen}
        busy={busy}
        error={connectError}
        onClose={() => {
          setSslOpen(false);
          setConnectError(null);
        }}
        onConnect={handleSsl}
      />
      <NagadConnectModal
        open={nagadOpen}
        busy={busy}
        error={connectError}
        onClose={() => {
          setNagadOpen(false);
          setConnectError(null);
        }}
        onConnect={handleNagad}
      />
    </div>
  );
}
