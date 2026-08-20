"use client";

import { useState } from "react";
import { SettingsActions } from "@/components/settings/site/ui/settings-actions";
import {
  SettingsInput,
  SettingsSelect,
} from "@/components/settings/site/ui/settings-field";
import {
  businessTypeOptions,
  defaultBusinessProfile,
} from "./account-data";

/**
 * Legal / business identity for the account owner.
 * Not shown as storefront contact — that lives in Site settings → Contact.
 */
export function AccountBusinessForm() {
  const [form, setForm] = useState(defaultBusinessProfile);

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
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
          value={form.legalName}
          onChange={(e) => setField("legalName", e.target.value)}
        />
        <SettingsInput
          label="Trade / brand name"
          value={form.tradeName}
          onChange={(e) => setField("tradeName", e.target.value)}
        />
        <SettingsSelect
          label="Business type"
          value={form.businessType}
          options={businessTypeOptions}
          onChange={(e) => setField("businessType", e.target.value)}
        />
        <SettingsInput
          label="Trade license no."
          value={form.tradeLicense}
          onChange={(e) => setField("tradeLicense", e.target.value)}
          placeholder="Optional"
        />
        <SettingsInput
          label="TIN / VAT"
          value={form.tin}
          onChange={(e) => setField("tin", e.target.value)}
          placeholder="Optional"
        />
        <SettingsInput
          label="Billing email"
          type="email"
          value={form.billingEmail}
          onChange={(e) => setField("billingEmail", e.target.value)}
        />
      </div>

      <SettingsActions saveLabel="Save business details" />
    </section>
  );
}
