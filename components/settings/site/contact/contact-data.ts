import type { IconType } from "react-icons";
import {
  FaFacebook,
  FaInstagram,
  FaLinkedinIn,
  FaTelegram,
  FaTiktok,
  FaWhatsapp,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { HiOutlineGlobeAlt } from "react-icons/hi2";

export type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "youtube"
  | "x"
  | "linkedin"
  | "whatsapp"
  | "telegram"
  | "other";

export type SocialLink = {
  id: string;
  platform: SocialPlatform;
  url: string;
};

export type PlatformMeta = {
  value: SocialPlatform;
  label: string;
  Icon: IconType;
  placeholder: string;
};

export const socialPlatforms: PlatformMeta[] = [
  {
    value: "facebook",
    label: "Facebook",
    Icon: FaFacebook,
    placeholder: "https://facebook.com/yourstore",
  },
  {
    value: "instagram",
    label: "Instagram",
    Icon: FaInstagram,
    placeholder: "https://instagram.com/yourstore",
  },
  {
    value: "tiktok",
    label: "TikTok",
    Icon: FaTiktok,
    placeholder: "https://tiktok.com/@yourstore",
  },
  {
    value: "youtube",
    label: "YouTube",
    Icon: FaYoutube,
    placeholder: "https://youtube.com/@yourstore",
  },
  {
    value: "x",
    label: "X (Twitter)",
    Icon: FaXTwitter,
    placeholder: "https://x.com/yourstore",
  },
  {
    value: "linkedin",
    label: "LinkedIn",
    Icon: FaLinkedinIn,
    placeholder: "https://linkedin.com/company/yourstore",
  },
  {
    value: "whatsapp",
    label: "WhatsApp",
    Icon: FaWhatsapp,
    placeholder: "https://wa.me/8801XXXXXXXXX",
  },
  {
    value: "telegram",
    label: "Telegram",
    Icon: FaTelegram,
    placeholder: "https://t.me/yourstore",
  },
  {
    value: "other",
    label: "Other",
    Icon: HiOutlineGlobeAlt,
    placeholder: "https://",
  },
];

export function getPlatformMeta(platform: SocialPlatform): PlatformMeta {
  return (
    socialPlatforms.find((p) => p.value === platform) ?? socialPlatforms[8]
  );
}

export const dayPresets = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const timeOptions = [
  "06:00 AM",
  "07:00 AM",
  "08:00 AM",
  "09:00 AM",
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "01:00 PM",
  "02:00 PM",
  "03:00 PM",
  "04:00 PM",
  "05:00 PM",
  "06:00 PM",
  "07:00 PM",
  "08:00 PM",
  "09:00 PM",
  "10:00 PM",
  "11:00 PM",
].map((t) => ({ value: t, label: t }));

export const countryOptions = [
  { value: "Bangladesh", label: "Bangladesh" },
  { value: "India", label: "India" },
  { value: "Other", label: "Other" },
];
