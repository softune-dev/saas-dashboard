/**
 * Order.customer is free-form JSONB (see OrderCreate in app/schemas.py) —
 * different storefronts collect different fields. These helpers pick the
 * common keys without inventing a Customer model.
 */

function pickString(
  customer: Record<string, unknown>,
  ...keys: string[]
): string {
  for (const key of keys) {
    const v = customer[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

/** True when the string looks like an email — used to split the storefront
 * checkout's single "contact" field (phone OR email) into the right bucket. */
function looksLikeEmail(v: string): boolean {
  return v.includes("@");
}

export function customerName(customer: Record<string, unknown>): string {
  const direct = pickString(customer, "name", "full_name", "fullName");
  if (direct) return direct;
  // Aurora's checkout collects first_name/last_name separately.
  const first = pickString(customer, "first_name", "firstName");
  const last = pickString(customer, "last_name", "lastName");
  const combined = [first, last].filter(Boolean).join(" ").trim();
  return combined || "Guest";
}

export function customerEmail(customer: Record<string, unknown>): string {
  const direct = pickString(customer, "email");
  if (direct) return direct;
  // Aurora's checkout has one combined "Phone number or Email" field.
  const contact = pickString(customer, "contact");
  return looksLikeEmail(contact) ? contact : "";
}

export function customerPhone(customer: Record<string, unknown>): string {
  const direct = pickString(customer, "phone", "phone_number", "mobile", "tel");
  if (direct) return direct;
  const contact = pickString(customer, "contact");
  return contact && !looksLikeEmail(contact) ? contact : "";
}

/** Full shipping address, when the storefront collected one (Aurora does:
 * address/city/zip). Empty string when nothing was collected. */
export function customerAddress(customer: Record<string, unknown>): string {
  const address = pickString(customer, "address");
  const city = pickString(customer, "city");
  const zip = pickString(customer, "zip", "postal_code", "postcode");
  return [address, city, zip].filter(Boolean).join(", ");
}

/** Stable identity for deduping customers across orders — prefer email,
 * fall back to phone, then a synthetic key so guests without either still
 * group by name+order rather than collapsing into one row. */
export function customerKey(
  customer: Record<string, unknown>,
  orderId: string,
): string {
  const email = customerEmail(customer).toLowerCase();
  if (email) return `email:${email}`;
  const phone = customerPhone(customer);
  if (phone) return `phone:${phone}`;
  return `order:${orderId}`;
}
