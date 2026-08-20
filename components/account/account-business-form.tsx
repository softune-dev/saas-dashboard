"use client";

import { useEffect, useState } from "react";
import { updateTenantBusiness } from "@/lib/api";
import { useSession } from "@/components/providers/session-provider";
import { SettingsActions } from "@/components/settings/site/ui/settings-actions";
import {
  SettingsInput,
  SettingsSelect,
} from "@/components/settings/site/ui/settings-field";
import { SettingsRowSkeleton } from "@/components/settings/site/ui/settings-skeleton";
import { useToast } from "@/components/ui/toast";
import { businessTypeOptions } from "./account-data";

/**
 * Legal / tax identity for the account (billing & invoicing) — not shown as
 * storefront contact, that lives in Site settings -> Contact.
 */
export function AccountBusinessForm() {
  const { me, loading, refetch } = useSession();
  const { toast } = useToast();
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [tradeLicense, setTradeLicense] = useState("");
  const [tin, setTin] = useState("");
  const [billingEmail, setBillingEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const business = me?.tenant.business;
    setLegalName(business?.legal_name ?? "");
    setTradeName(business?.trade_name ?? "");
    setBusinessType(business?.business_type ?? "");
    setTradeLicense(business?.trade_license ?? "");
    setTin(business?.tin ?? "");
    setBillingEmail(business?.billing_email ?? "");
  }, [me?.tenant.business]);

  if (loading) {
    return (
      <section className="rounded-md bg-surface p-4 sm:p-5">
        <h2 className="mb-5 text-base font-semibold text-foreground">
          Business details
        </h2>
        <SettingsRowSkeleton />
      </section>
    );
  }

  async function handleSave() {
    if (!me || busy) return;
    setBusy(true);
    try {
      await updateTenantBusiness({
        legal_name: legalName.trim(),
        trade_name: tradeName.trim(),
        business_type: businessType,
        trade_license: tradeLicense.trim(),
        tin: tin.trim(),
        billing_email: billingEmail.trim(),
      });
      refetch();
      toast({ title: "Business details updated", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't update business details",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-md bg-surface p-4 sm:p-5">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-foreground">
          Business details
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SettingsInput
          label="Legal business name"
          value={legalName}
          onChange={(e) => setLegalName(e.target.value)}
          disabled={!me}
        />
        <SettingsInput
          label="Trade / brand name"
          value={tradeName}
          onChange={(e) => setTradeName(e.target.value)}
          disabled={!me}
        />
        <SettingsSelect
          label="Business type"
          value={businessType}
          options={businessTypeOptions}
          onChange={(e) => setBusinessType(e.target.value)}
          disabled={!me}
        />
        <SettingsInput
          label="Trade license no."
          value={tradeLicense}
          onChange={(e) => setTradeLicense(e.target.value)}
          placeholder="Optional"
          disabled={!me}
        />
        <SettingsInput
          label="TIN / VAT"
          value={tin}
          onChange={(e) => setTin(e.target.value)}
          placeholder="Optional"
          disabled={!me}
        />
        <SettingsInput
          label="Billing email"
          type="email"
          value={billingEmail}
          onChange={(e) => setBillingEmail(e.target.value)}
          disabled={!me}
        />
      </div>

      <SettingsActions
        saveLabel={busy ? "Saving…" : "Save business details"}
        onSave={handleSave}
      />
    </section>
  );
}
