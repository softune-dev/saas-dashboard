/**
 * Preselected WhatsApp message templates for superadmin's manual outreach —
 * see whatsapp-message-modal.tsx. No Meta API involved: these just build a
 * wa.me deep link with the text pre-filled, which opens WhatsApp Web/the
 * app with the message already typed in, one click from actually sending.
 * That's a deliberate stand-in until (if ever) the real Cloud API
 * integration (app/whatsapp.py, backend) gets activated — see that
 * module's docstring.
 *
 * {{name}} is the only placeholder — filled in from the user's full_name
 * (or "there" if they have none) when a template is selected.
 */

export type WhatsAppTemplate = {
  id: string;
  label: string;
  body: string;
};

export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "welcome",
    label: "Welcome / getting started",
    body: "Hi {{name}}! Welcome to Softunebd. If you need any help setting up your store or run into an issue, just reply here — we're happy to help.",
  },
  {
    id: "support-check-in",
    label: "Support check-in",
    body: "Hi {{name}}, this is Softunebd support. We noticed you might need a hand with your store — is there anything we can help you with today?",
  },
  {
    id: "trial-ending",
    label: "Trial ending soon",
    body: "Hi {{name}}, your Softunebd free trial is ending soon. Want help picking a plan, or have any questions before it ends? Just reply here.",
  },
  {
    id: "custom",
    label: "Custom message",
    body: "",
  },
];

/** Bangladeshi mobile number -> wa.me's expected digits-only format
 * ("8801XXXXXXXXX"). Returns null for anything that doesn't look like a
 * real BD mobile number — same acceptance rule as the backend's
 * _validate_bd_phone / whatsapp.to_whatsapp_number. */
export function toWhatsAppNumber(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const normalized = digits.startsWith("880") ? "0" + digits.slice(3) : digits;
  if (!/^01[3-9]\d{8}$/.test(normalized)) return null;
  return "880" + normalized.slice(1);
}

export function fillTemplate(body: string, name: string): string {
  return body.replaceAll("{{name}}", name || "there");
}

export function buildWhatsAppLink(phone: string, message: string): string | null {
  const number = toWhatsAppNumber(phone);
  if (!number) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
