import { redirect } from "next/navigation";

/** Default Dropship entry → Browse Suppliers */
export default function DropshipIndexPage() {
  redirect("/dropship/browse");
}
