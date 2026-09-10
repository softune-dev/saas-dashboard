"use client";

import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { MaskIcon } from "@/components/ui/mask-icon";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import { useLanguage } from "@/components/providers/language-provider";
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
  const { t } = useLanguage();
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
      toast({ title: t("Contact info saved"), variant: "success" });
    } catch (err) {
      toast({
        title: t("Couldn't save contact info"),
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
        <div className="border-t border-border dark:border-transparent pt-5">
          <SettingsRowSkeleton />
        </div>
        <SettingsTextareaSkeleton />
        <div className="flex flex-col gap-2 border-t border-border dark:border-transparent pt-5">
          <SettingsListRowSkeleton />
          <SettingsListRowSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-muted">
        Public storefront contact details shown on your site. Legal business
        details live under{" "}
        <span className="font-medium text-foreground">{t("Account")}</span>.
      </p>

      {/* Storefront contact */}
      <div className="flex flex-col gap-4">
        <h2 className="text-base font-semibold text-foreground">{t("Store contact")}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingsInput
            label={t("Store display name")}
            value={form.storeName}
            onChange={(e) => setField("storeName", e.target.value)}
          />
          <SettingsInput
            label={t("Support email")}
            type="email"
            value={form.supportEmail}
            onChange={(e) => setField("supportEmail", e.target.value)}
          />
          <SettingsInput
            label={t("Phone")}
            value={form.phone}
            onChange={(e) => setField("phone", e.target.value)}
          />
          <SettingsInput
            label={t("WhatsApp")}
            value={form.whatsapp}
            onChange={(e) => setField("whatsapp", e.target.value)}
          />
        </div>
      </div>

      {/* Public address */}
      <div className="flex flex-col gap-4 border-t border-border dark:border-transparent pt-5">
        <h2 className="text-base font-semibold text-foreground">
          {t("Public store address")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SettingsSelect
            label={t("Country")}
            value={form.country}
            options={countryOptions}
            onChange={(e) => setField("country", e.target.value)}
          />
          <SettingsInput
            label={t("City")}
            value={form.city}
            onChange={(e) => setField("city", e.target.value)}
          />
          <SettingsInput
            label={t("Area / Thana")}
            value={form.area}
            onChange={(e) => setField("area", e.target.value)}
          />
          <SettingsInput
            label={t("Postal code")}
            value={form.postalCode}
            onChange={(e) => setField("postalCode", e.target.value)}
          />
        </div>
        <SettingsTextarea
          label={t("Street address")}
          value={form.address}
          onChange={(e) => setField("address", e.target.value)}
          className="!min-h-[88px]"
        />
        <SettingsInput
          label={t("Map link (optional)")}
          value={form.mapUrl}
          onChange={(e) => setField("mapUrl", e.target.value)}
          placeholder="https://maps.google.com/..."
        />
      </div>

      {/* Business hours — add / edit / remove */}
      <div className="flex flex-col gap-4 border-t border-border dark:border-transparent pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("Business hours")}</h2>
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
            {t("Add hours")}
          </PrimaryButton>
        </div>

        {hours.length === 0 ? (
          <p className="rounded-xl bg-search-bg px-3 py-6 text-center text-sm text-muted">
            No hours yet — add a day to show when you are open
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {hours.map((row, index) => (
              <li
                key={index}
                className="grid grid-cols-2 items-end gap-2 rounded-xl bg-search-bg p-3 md:grid-cols-[1fr_1fr_1fr_auto_auto] md:gap-3"
              >
                <div className="col-span-2 md:col-span-1">
                  <SettingsSelect
                    label={t("Day")}
                    name={`day-${index}`}
                    value={row.day}
                    options={dayPresets.map((d) => ({ value: d, label: d }))}
                    onChange={(e) => updateHour(index, { day: e.target.value })}
                  />
                </div>
                <div className={row.closed ? "max-md:hidden" : ""}>
                  <SettingsSelect
                    label={t("Opens")}
                    name={`open-${index}`}
                    value={row.open}
                    options={timeOptions}
                    disabled={row.closed}
                    onChange={(e) => updateHour(index, { open: e.target.value })}
                    className={row.closed ? "opacity-40" : ""}
                  />
                </div>
                <div className={row.closed ? "max-md:hidden" : ""}>
                  <SettingsSelect
                    label={t("Closes")}
                    name={`close-${index}`}
                    value={row.close}
                    options={timeOptions}
                    disabled={row.closed}
                    onChange={(e) => updateHour(index, { close: e.target.value })}
                    className={row.closed ? "opacity-40" : ""}
                  />
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={row.closed}
                  aria-label={row.closed ? t("Closed") : t("Open")}
                  onClick={() => updateHour(index, { closed: !row.closed })}
                  className={[
                    "inline-flex h-11 min-w-[5.5rem] cursor-pointer items-center justify-center gap-2 rounded-full border px-3 text-sm font-medium transition-colors md:mb-1 md:h-10",
                    row.closed
                      ? "border-border bg-surface text-muted"
                      : "border-primary/30 bg-primary/10 text-primary",
                  ].join(" ")}
                >
                  {row.closed ? t("Closed") : t("Open")}
                </button>
                <button
                  type="button"
                  aria-label="Remove hours row"
                  onClick={() => removeHour(index)}
                  className="inline-flex h-11 w-full items-center justify-center text-muted transition-colors hover:text-red-500 md:mb-1 md:size-10 md:w-10"
                >
                  <MaskIcon src="/sidebar/delete.svg" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Social — real platform icons */}
      <div className="flex flex-col gap-4 border-t border-border dark:border-transparent pt-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-foreground">{t("Social media")}</h2>
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
            {t("Add link")}
          </PrimaryButton>
        </div>

        <ul className="flex flex-col max-md:divide-y max-md:divide-border dark:max-md:divide-transparent md:gap-2">
          {socials.map((social) => {
            const meta = getPlatformMeta(social.platform);
            const Icon = meta.Icon;
            return (
              <li
                key={social.id}
                className="flex items-center gap-3 py-3 md:flex-wrap md:items-end md:rounded-xl md:bg-search-bg md:p-3"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-search-bg text-foreground md:mb-0.5 md:bg-surface">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2 md:flex-row md:items-end md:gap-3">
                  <div className="w-full md:w-40">
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
                </div>
                <button
                  type="button"
                  aria-label="Remove social link"
                  onClick={() => removeSocial(social.id)}
                  className="inline-flex size-10 shrink-0 items-center justify-center self-center text-muted transition-colors hover:text-red-500 md:mb-0.5 md:self-end"
                >
                  <MaskIcon src="/sidebar/delete.svg" className="size-4" />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Support note for site */}
      <div className="flex flex-col gap-4 border-t border-border dark:border-transparent pt-5">
        <SettingsTextarea
          label={t("Support note (shown on contact page)")}
          value={form.supportNote}
          onChange={(e) => setField("supportNote", e.target.value)}
          className="!min-h-[88px]"
        />
      </div>

      <SettingsActions
        saveLabel={saving ? "Saving…" : t("Save contact info")}
        onSave={handleSave}
      />
    </div>
  );
}
