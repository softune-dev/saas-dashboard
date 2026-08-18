"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { MaskIcon } from "@/components/ui/mask-icon";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import {
  saveSiteBusiness,
  useSiteSettingsSWR,
  type BusinessHour,
} from "@/lib/api/site-settings";
import { SettingsActions } from "../ui/settings-actions";
import {
  SettingsInput,
  SettingsSelect,
  SettingsTextarea,
} from "../ui/settings-field";
import {
  SettingsListRowSkeleton,
  SettingsRowSkeleton,
  SettingsTextareaSkeleton,
} from "../ui/settings-skeleton";
import {
  countryOptions,
  dayPresets,
  timeOptions,
  getPlatformMeta,
  socialPlatforms,
  type SocialLink,
  type SocialPlatform,
} from "./contact-data";

const emptyForm = {
  storeName: "",
  supportEmail: "",
  phone: "",
  whatsapp: "",
  country: "Bangladesh",
  city: "",
  area: "",
  postalCode: "",
  address: "",
  mapUrl: "",
  supportNote: "",
};

/** "Mo 10:00 AM-08:00 PM" — schema.org / _json_ld's openingHours just wants
 * strings, so this is computed on save rather than stored twice out of sync. */
function formatHours(hours: BusinessHour[]): string[] {
  return hours
    .filter((h) => !h.closed)
    .map((h) => `${h.day.slice(0, 2)} ${h.open}-${h.close}`);
}

export function ContactSection() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;
  const { data, isLoading, mutate } = useSiteSettingsSWR(siteId);

  const [form, setForm] = useState(emptyForm);
  const [hours, setHours] = useState<BusinessHour[]>([]);
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!data) return;
    const b = data.business;
    setForm({
      storeName: b.name ?? "",
      supportEmail: b.email ?? "",
      phone: b.phone ?? "",
      whatsapp: b.whatsapp ?? "",
      country: b.address?.country ?? "Bangladesh",
      city: b.address?.city ?? "",
      area: b.address?.region ?? "",
      postalCode: b.address?.postal_code ?? "",
      address: b.address?.street ?? "",
      mapUrl: b.map_url ?? "",
      supportNote: b.support_note ?? "",
    });
    setHours(b.hours ?? []);
    setSocials(
      Object.entries(b.socials ?? {}).map(([platform, url], i) => ({
        id: String(i),
        platform: platform as SocialPlatform,
        url,
      })),
    );
  }, [data]);

  function setField<K extends keyof typeof form>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addHour() {
    setHours((list) => [
      ...list,
      { day: "Monday", open: "10:00 AM", close: "08:00 PM", closed: false },
    ]);
  }
  function removeHour(index: number) {
    setHours((list) => list.filter((_, i) => i !== index));
  }
  function updateHour(index: number, patch: Partial<BusinessHour>) {
    setHours((list) => list.map((h, i) => (i === index ? { ...h, ...patch } : h)));
  }

  function addSocial() {
    setSocials((list) => [...list, { id: String(Date.now()), platform: "facebook", url: "" }]);
  }
  function removeSocial(id: string) {
    setSocials((list) => list.filter((s) => s.id !== id));
  }
  function updateSocial(id: string, patch: Partial<SocialLink>) {
    setSocials((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  async function handleSave() {
    if (!siteId) return;
    setSaving(true);
    try {
      const socialsRecord = Object.fromEntries(
        socials.filter((s) => s.url.trim()).map((s) => [s.platform, s.url]),
      );
      const updated = await saveSiteBusiness(siteId, {
        name: form.storeName,
        email: form.supportEmail,
        phone: form.phone,
        whatsapp: form.whatsapp,
        address: {
          street: form.address,
          city: form.city,
          region: form.area,
          postal_code: form.postalCode,
          country: form.country,
        },
        map_url: form.mapUrl,
        hours,
        opening_hours: formatHours(hours),
        socials: socialsRecord,
        support_note: form.supportNote,
        description: data?.business.description,
        type: data?.business.type,
        logo_url: data?.business.logo_url,
      });
      await mutate({ ...data!, business: updated.business }, { revalidate: false });
      toast({ title: "Contact info saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save contact info",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <SettingsRowSkeleton />
        <div className="border-t border-slate-100 pt-5">
          <SettingsRowSkeleton />
        </div>
        <SettingsTextareaSkeleton />
        <div className="flex flex-col gap-2 border-t border-slate-100 pt-5">
          <SettingsListRowSkeleton />
          <SettingsListRowSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-slate-500">
        Public storefront contact details shown on your site. Legal business
        details live under{" "}
        <span className="font-medium text-foreground">Account</span>.
      </p>

      {/* Storefront contact */}
      <div className="flex flex-col gap-4">
        <p className="text-sm font-medium text-slate-500">Store contact</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingsInput
            label="Store display name"
            value={form.storeName}
            onChange={(e) => setField("storeName", e.target.value)}
          />
          <SettingsInput
            label="Support email"
            type="email"
            value={form.supportEmail}
            onChange={(e) => setField("supportEmail", e.target.value)}
          />
          <SettingsInput
            label="Phone"
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
          />
          <SettingsInput
            label="WhatsApp"
            value={form.whatsapp}
            onChange={(e) => setField("whatsapp", e.target.value)}
          />
        </div>
      </div>

      {/* Public address */}
      <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
        <p className="text-sm font-medium text-slate-500">
          Public store address
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingsSelect
            label="Country"
            value={form.country}
            options={countryOptions}
            onChange={(e) => setField("country", e.target.value)}
          />
          <SettingsInput
            label="City"
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
          />
          <SettingsInput
            label="Area / Thana"
            value={form.area}
            onChange={(e) => setField("area", e.target.value)}
          />
          <SettingsInput
            label="Postal code"
            value={form.postalCode}
            onChange={(e) => setField("postalCode", e.target.value)}
          />
        </div>
        <SettingsTextarea
          label="Street address"
          value={form.address}
          onChange={(e) => setField("address", e.target.value)}
          className="!min-h-[88px]"
        />
        <SettingsInput
          label="Map link (optional)"
          value={form.mapUrl}
          onChange={(e) => setField("mapUrl", e.target.value)}
          placeholder="https://maps.google.com/..."
        />
      </div>

      {/* Business hours — add / edit / remove */}
      <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Business hours</p>
            <p className="mt-0.5 text-xs text-muted-soft">
              Add days and set open / close times
            </p>
          </div>
          <PrimaryButton
            type="button"
            onClick={addHour}
            className="!h-9 !px-3 text-xs"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            Add hours
          </PrimaryButton>
        </div>

        {hours.length === 0 ? (
          <p className="rounded-xl bg-search-bg px-3 py-6 text-center text-sm text-slate-500">
            No hours yet — add a day to show when you are open
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {hours.map((row, index) => (
              <li
                key={index}
                className="grid grid-cols-1 items-end gap-3 rounded-xl bg-search-bg p-3 sm:grid-cols-[1fr_1fr_1fr_auto_auto]"
              >
                <SettingsSelect
                  label="Day"
                  name={`day-${index}`}
                  value={row.day}
                  options={dayPresets.map((d) => ({ value: d, label: d }))}
                  onChange={(e) => updateHour(index, { day: e.target.value })}
                />
                <SettingsSelect
                  label="Opens"
                  name={`open-${index}`}
                  value={row.open}
                  options={timeOptions}
                  disabled={row.closed}
                  onChange={(e) => updateHour(index, { open: e.target.value })}
                  className={row.closed ? "opacity-40" : ""}
                />
                <SettingsSelect
                  label="Closes"
                  name={`close-${index}`}
                  value={row.close}
                  options={timeOptions}
                  disabled={row.closed}
                  onChange={(e) => updateHour(index, { close: e.target.value })}
                  className={row.closed ? "opacity-40" : ""}
                />
                <label className="mb-1 flex h-10 cursor-pointer items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm text-foreground">
                  <input
                    type="checkbox"
                    checked={row.closed}
                    onChange={(e) => updateHour(index, { closed: e.target.checked })}
                    className="size-3.5 accent-[var(--primary)]"
                  />
                  Closed
                </label>
                <button
                  type="button"
                  aria-label="Remove hours row"
                  onClick={() => removeHour(index)}
                  className="mb-1 inline-flex size-10 items-center justify-center text-muted transition-colors hover:text-red-500"
                >
                  <MaskIcon src="/sidebar/delete.svg" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Social — real platform icons */}
      <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-slate-500">Social media</p>
            <p className="mt-0.5 text-xs text-muted-soft">
              Links shown on your storefront footer and contact page
            </p>
          </div>
          <PrimaryButton
            type="button"
            onClick={addSocial}
            className="!h-9 !px-3 text-xs"
          >
            <Plus className="size-3.5" strokeWidth={2} />
            Add link
          </PrimaryButton>
        </div>

        <ul className="flex flex-col gap-2">
          {socials.map((social) => {
            const meta = getPlatformMeta(social.platform);
            const Icon = meta.Icon;
            return (
              <li
                key={social.id}
                className="flex flex-wrap items-end gap-3 rounded-xl bg-search-bg p-3"
              >
                <span className="mb-0.5 flex size-10 shrink-0 items-center justify-center rounded-full bg-white text-foreground">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="w-full sm:w-40">
                  <SettingsSelect
                    label="Platform"
                    name={`platform-${social.id}`}
                    value={social.platform}
                    options={socialPlatforms.map((p) => ({
                      value: p.value,
                      label: p.label,
                    }))}
                    onChange={(e) =>
                      updateSocial(social.id, {
                        platform: e.target.value as SocialPlatform,
                      })
                    }
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <SettingsInput
                    label="URL"
                    name={`url-${social.id}`}
                    value={social.url}
                    onChange={(e) => updateSocial(social.id, { url: e.target.value })}
                    placeholder={meta.placeholder}
                  />
                </div>
                <button
                  type="button"
                  aria-label="Remove social link"
                  onClick={() => removeSocial(social.id)}
                  className="mb-0.5 inline-flex size-10 items-center justify-center text-muted transition-colors hover:text-red-500"
                >
                  <MaskIcon src="/sidebar/delete.svg" className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Support note for site */}
      <div className="flex flex-col gap-4 border-t border-slate-100 pt-5">
        <SettingsTextarea
          label="Support note (shown on contact page)"
          value={form.supportNote}
          onChange={(e) => setField("supportNote", e.target.value)}
          className="!min-h-[88px]"
        />
      </div>

      <SettingsActions
        saveLabel={saving ? "Saving…" : "Save contact info"}
        onSave={handleSave}
      />
    </div>
  );
}
