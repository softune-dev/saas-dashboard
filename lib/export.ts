/**
 * Zero-dependency export helpers — CSV/JSON via a Blob download, PDF via
 * the browser's own native print-to-PDF (a real, install-nothing way to
 * get a PDF: open a clean printable window, call print(), let the browser
 * handle "Save as PDF"). No charting/PDF library added for this.
 */

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/** Escapes a cell for CSV — wraps in quotes and doubles any inner quotes
 * whenever the value contains a comma, quote, or newline. */
function csvCell(value: string | number): string {
  const s = String(value);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Rows can mix plain data rows with section headers/blank spacer rows —
 * callers pass whatever string[][] they want, this just joins it. */
export function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  // BOM so Excel opens UTF-8 (৳, non-ASCII names) correctly instead of mojibake.
  triggerDownload(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" }), filename);
}

export function downloadJson(filename: string, data: unknown) {
  triggerDownload(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    filename,
  );
}

/** Opens a plain, self-contained printable window and triggers the
 * browser's print dialog — the user picks "Save as PDF" there. `bodyHtml`
 * is trusted content built from the caller's own real data, not user input. */
export function exportAsPdf(title: string, bodyHtml: string) {
  const win = window.open("", "_blank", "width=900,height=1000");
  if (!win) return;
  win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${title}</title>
<style>
  body { font-family: -apple-system, Segoe UI, Arial, sans-serif; color: #171717; padding: 32px; }
  h1 { font-size: 20px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 24px 0 8px; }
  p.meta { color: #6b7280; font-size: 12px; margin: 0 0 24px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  th, td { text-align: left; padding: 6px 8px; font-size: 12px; border-bottom: 1px solid #e5e7eb; }
  th { color: #6b7280; font-weight: 600; }
  .stats { display: flex; gap: 24px; margin-bottom: 8px; }
  .stat { flex: 1; }
  .stat-value { font-size: 18px; font-weight: 700; }
  .stat-label { font-size: 11px; color: #6b7280; }
</style>
</head>
<body>
  <h1>${title}</h1>
  <p class="meta">Generated ${new Date().toLocaleString()}</p>
  ${bodyHtml}
</body>
</html>`);
  win.document.close();
  win.focus();
  // Give the new document a tick to finish laying out before printing.
  setTimeout(() => win.print(), 250);
}
