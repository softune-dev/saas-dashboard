"use client";

import { MapPin, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { MaskIcon } from "@/components/ui/mask-icon";
import { PrimaryButton } from "@/components/ui/primary-button";
import { useToast } from "@/components/ui/toast";
import {
  saveSiteShipping,
  useSiteSettingsSWR,
  type ShippingLocation,
} from "@/lib/api/site-settings";
import { SettingsActions } from "../ui/settings-actions";
import { SettingsInput } from "../ui/settings-field";
import { SettingsListRowSkeleton } from "../ui/settings-skeleton";

function centsToMajor(cents: number): string {
  return (cents / 100).toString();
}

function majorToCents(major: string): number {
  const n = parseFloat(major);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

export function ShippingSection() {
  const { currentSite } = useSession();
  const { toast } = useToast();
  const siteId = currentSite?.id ?? null;
  const { data, isLoading, mutate } = useSiteSettingsSWR(siteId);

  const [locations, setLocations] = useState<ShippingLocation[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setLocations(data.shipping.locations ?? []);
  }, [data]);

  function addLocation() {
    setLocations((list) => [
      ...list,
      { id: String(Date.now()), name: "", charge_cents: 0 },
    ]);
  }

  function removeLocation(id: string) {
    setLocations((list) => list.filter((z) => z.id !== id));
  }

  function updateLocation(id: string, patch: Partial<ShippingLocation>) {
    setLocations((list) => list.map((z) => (z.id === id ? { ...z, ...patch } : z)));
  }

  async function handleSave() {
    if (!siteId) return;
    setSaving(true);
    try {
      const cleaned = locations.filter((l) => l.name.trim());
      const updated = await saveSiteShipping(siteId, { locations: cleaned });
      setLocations(updated.shipping.locations);
      await mutate({ ...data!, shipping: updated.shipping }, { revalidate: false });
      toast({ title: "Shipping settings saved", variant: "success" });
    } catch (err) {
      toast({
        title: "Couldn't save shipping settings",
        description: err instanceof Error ? err.message : "Something went wrong.",
        variant: "info",
      });
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <SettingsListRowSkeleton />
        <SettingsListRowSkeleton />
        <SettingsListRowSkeleton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-foreground">Delivery locations</h2>
          <p className="mt-0.5 text-xs text-muted-soft">
            Used in the Add Product page to pick a delivery charge instead of
            typing one each time.
          </p>
        </div>
        <PrimaryButton
          type="button"
          onClick={addLocation}
          className="!h-9 !px-3 text-xs"
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Add location
        </PrimaryButton>
      </div>

      {locations.length === 0 ? (
        <p className="rounded-md bg-search-bg px-4 py-8 text-center text-sm text-muted">
          No delivery locations yet. Add one to start pricing shipping by
          area.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {locations.map((zone) => (
            <li
              key={zone.id}
              className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <MapPin className="size-4" strokeWidth={1.75} />
              </span>

              <div className="min-w-0 flex-1 basis-[10rem]">
                <SettingsInput
                  name={`location-${zone.id}`}
                  value={zone.name}
                  placeholder="Location name (e.g. Inside Dhaka)"
                  onChange={(e) => updateLocation(zone.id, { name: e.target.value })}
                />
              </div>

              <div className="w-full sm:w-36">
                <SettingsInput
                  name={`charge-${zone.id}`}
                  placeholder="Charge (৳)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={centsToMajor(zone.charge_cents)}
                  onChange={(e) =>
                    updateLocation(zone.id, { charge_cents: majorToCents(e.target.value) })
                  }
                />
              </div>

              <button
                type="button"
                aria-label={`Remove ${zone.name || "location"}`}
                onClick={() => removeLocation(zone.id)}
                className="inline-flex size-10 items-center justify-center text-muted transition-colors hover:text-red-500"
              >
                <MaskIcon src="/sidebar/delete.svg" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <SettingsActions saveLabel={saving ? "Saving…" : "Save shipping"} onSave={handleSave} />
    </div>
  );
}
