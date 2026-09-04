"use client";

import { useState, type FormEvent } from "react";
import { FormModal } from "@/components/ui/form-modal";
import type { SettlementMethod, SupplierProfile } from "@/lib/dropship-mock";

type BecomeSupplierModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (profile: SupplierProfile) => void;
};

const empty: SupplierProfile = {
  businessName: "",
  description: "",
  publicPhone: "",
  city: "",
  legalBusinessName: "",
  ownerName: "",
  nidOrTradeLicense: "",
  verificationPhone: "",
  fullAddress: "",
  paymentMethod: "bkash",
  paymentAccountNumber: "",
  paymentAccountName: "",
};

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <label className="block">
      <span className="text-xs font-medium text-muted-soft">{label}</span>
      <input
        {...rest}
        className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
      />
    </label>
  );
}

export function BecomeSupplierModal({ open, onClose, onSave }: BecomeSupplierModalProps) {
  const [form, setForm] = useState<SupplierProfile>(empty);

  function set<K extends keyof SupplierProfile>(key: K, value: SupplierProfile[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const required: (keyof SupplierProfile)[] = [
      "businessName",
      "publicPhone",
      "city",
      "legalBusinessName",
      "ownerName",
      "nidOrTradeLicense",
      "verificationPhone",
      "fullAddress",
      "paymentAccountNumber",
      "paymentAccountName",
    ];
    if (required.some((key) => !form[key].toString().trim())) return;
    onSave(form);
    setForm(empty);
  }

  return (
    <FormModal
      open={open}
      title="Become a Supplier"
      submitLabel="Start supplying"
      onClose={() => {
        setForm(empty);
        onClose();
      }}
      onSubmit={handleSubmit}
    >
      <div className="flex flex-col gap-6">
        <div>
          <p className="mb-3 text-xs font-semibold text-muted-soft uppercase">Store profile</p>
          <div className="flex flex-col gap-3">
            <Field
              label="Business name"
              required
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              placeholder="Dhaka Fabrics Ltd."
            />
            <label className="block">
              <span className="text-xs font-medium text-muted-soft">About your business</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="What you supply"
                className="mt-1 w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="WhatsApp number"
                required
                value={form.publicPhone}
                onChange={(e) => set("publicPhone", e.target.value)}
                placeholder="01XXXXXXXXX"
              />
              <Field
                label="City"
                required
                value={form.city}
                onChange={(e) => set("city", e.target.value)}
                placeholder="Dhaka"
              />
            </div>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold text-muted-soft uppercase">
            Business verification
          </p>
          <div className="flex flex-col gap-3">
            <Field
              label="Legal business name"
              required
              value={form.legalBusinessName}
              onChange={(e) => set("legalBusinessName", e.target.value)}
              placeholder="Registered company name"
            />
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Owner name"
                required
                value={form.ownerName}
                onChange={(e) => set("ownerName", e.target.value)}
                placeholder="Full name"
              />
              <Field
                label="NID or trade license"
                required
                value={form.nidOrTradeLicense}
                onChange={(e) => set("nidOrTradeLicense", e.target.value)}
                placeholder="Number"
              />
            </div>
            <Field
              label="Verification phone"
              required
              value={form.verificationPhone}
              onChange={(e) => set("verificationPhone", e.target.value)}
              placeholder="01XXXXXXXXX"
            />
            <label className="block">
              <span className="text-xs font-medium text-muted-soft">Business address</span>
              <textarea
                rows={2}
                required
                value={form.fullAddress}
                onChange={(e) => set("fullAddress", e.target.value)}
                placeholder="Warehouse or pickup address"
                className="mt-1 w-full resize-y rounded-md border border-border bg-surface px-2.5 py-2 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
              />
            </label>
          </div>
        </div>

        <div>
          <p className="mb-3 text-xs font-semibold text-muted-soft uppercase">
            Payout details
          </p>
          <div className="flex flex-col gap-3">
            <label className="block">
              <span className="text-xs font-medium text-muted-soft">Payment method</span>
              <select
                value={form.paymentMethod}
                onChange={(e) => set("paymentMethod", e.target.value as SettlementMethod)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-surface px-2.5 text-sm text-foreground outline-none focus:border-primary"
              >
                <option value="bkash">bKash</option>
                <option value="nagad">Nagad</option>
                <option value="bank">Bank transfer</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Account number"
                required
                value={form.paymentAccountNumber}
                onChange={(e) => set("paymentAccountNumber", e.target.value)}
              />
              <Field
                label="Account name"
                required
                value={form.paymentAccountName}
                onChange={(e) => set("paymentAccountName", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </FormModal>
  );
}
