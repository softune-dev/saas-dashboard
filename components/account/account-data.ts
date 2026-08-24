/** Legal / tax identity for the Softune account (not storefront contact) */
export type BusinessProfile = {
  legalName: string;
  tradeName: string;
  businessType: string;
  tradeLicense: string;
  tin: string;
  billingEmail: string;
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
