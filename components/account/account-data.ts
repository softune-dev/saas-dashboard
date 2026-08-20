export type AccountProfile = {
  name: string;
  email: string;
  phone: string;
  role: string;
  store: string;
  joined: string;
  avatar: string;
  language: string;
  timezone: string;
};

/** Legal / tax identity for the Softune account (not storefront contact) */
export type BusinessProfile = {
  legalName: string;
  tradeName: string;
  businessType: string;
  tradeLicense: string;
  tin: string;
  billingEmail: string;
};

export const defaultProfile: AccountProfile = {
  name: "Admin User",
  email: "admin@modhubon.com",
  phone: "+880 1711-000000",
  role: "Owner",
  store: "Modhu Bon",
  joined: "Jan 12, 2025",
  avatar:
    "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=160&h=160&fit=crop",
  language: "English",
  timezone: "Asia/Dhaka (GMT+6)",
};

export const businessTypeOptions = [
  { value: "retail", label: "Retail store" },
  { value: "online", label: "Online only" },
  { value: "hybrid", label: "Hybrid (online + offline)" },
  { value: "wholesale", label: "Wholesale" },
  { value: "service", label: "Service business" },
];

export const languageOptions = [
  { value: "English", label: "English" },
  { value: "Bangla", label: "Bangla" },
];

export const timezoneOptions = [
  { value: "Asia/Dhaka (GMT+6)", label: "Asia/Dhaka (GMT+6)" },
  { value: "Asia/Kolkata (GMT+5:30)", label: "Asia/Kolkata (GMT+5:30)" },
  { value: "UTC", label: "UTC" },
];
