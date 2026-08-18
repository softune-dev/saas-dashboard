import { notFound } from "next/navigation";
import { ThemeEditorView } from "@/components/themes/editor/theme-editor-view";
import { getThemeById } from "@/components/themes/themes-data";

export default async function ThemeEditorPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const theme = getThemeById(siteId);
  if (!theme || theme.status !== "active") notFound();

  return <ThemeEditorView siteId={theme.id} previewUrl={theme.previewUrl} />;
}
