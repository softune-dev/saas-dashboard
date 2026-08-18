import { redirect } from "next/navigation";

/** Default Site Settings entry → Domains */
export default function SiteSettingsIndexPage() {
  redirect("/settings/site/domains");
}
