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

// Bangla + English mixed, same register as the landing site's own Bangla
// copy (lib/features-data.ts's FEATURE_PAGES_BN etc.) — sentence structure
// in Bangla, brand/technical terms (Softunebd, dashboard, trial, WhatsApp)
// kept in English rather than transliterated, since that's how Bangladeshi
// businesses actually write these. No emoji, real paragraph breaks so it
// reads as a message, not a wall of text.
export const WHATSAPP_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: "welcome",
    label: "Welcome / getting started",
    body:
      "Hi {{name}},\n\n" +
      "Softunebd-এ আপনাকে স্বাগতম। আপনার স্টোর এখন লাইভ এবং ব্যবহারের জন্য প্রস্তুত।\n\n" +
      "সেটআপ করতে গিয়ে কোথাও আটকে গেলে বা কোনো প্রশ্ন থাকলে, এই নম্বরেই মেসেজ করুন — আমরা সরাসরি সাহায্য করব।\n\n" +
      "ধন্যবাদ,\nSoftunebd Support",
  },
  {
    id: "support-check-in",
    label: "Support check-in",
    body:
      "Hi {{name}},\n\n" +
      "Softunebd সাপোর্ট থেকে যোগাযোগ করছি। আপনার স্টোর সেটআপ কেমন এগোচ্ছে জানতে চাইলাম।\n\n" +
      "কোনো জায়গায় আটকে থাকলে বা সাহায্য দরকার হলে এখানে রিপ্লাই দিন, আমরা দেখে নিচ্ছি।\n\n" +
      "ধন্যবাদ,\nSoftunebd Support",
  },
  {
    id: "trial-ending",
    label: "Trial ending soon",
    body:
      "Hi {{name}},\n\n" +
      "আপনার Softunebd ফ্রি ট্রায়াল খুব শীঘ্রই শেষ হতে যাচ্ছে।\n\n" +
      "স্টোর ও ড্যাশবোর্ড অ্যাক্সেস চালু রাখতে একটি প্ল্যান বেছে নিতে পারেন। প্ল্যান বাছাইয়ে সাহায্য লাগলে বা কোনো প্রশ্ন থাকলে এখানে জানান।\n\n" +
      "ধন্যবাদ,\nSoftunebd Support",
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
