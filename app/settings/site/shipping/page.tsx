import { ShippingSection, SiteSettingsShell } from "@/components/settings/site";

export default function ShippingPage() {
  return (
    <SiteSettingsShell title="Shipping" hideSectionTitle>
      <ShippingSection />
    </SiteSettingsShell>
  );
}
