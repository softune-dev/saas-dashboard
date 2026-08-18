"use client";

import type { PendingAction } from "@/lib/api/ai";

export type MessageRole = "user" | "assistant";

export type FileAttachment = {
  id: string;
  name: string;
  size: string;
  type: "image" | "file";
  url: string;
};

export type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  attachments?: FileAttachment[];
  thinkingTimeSec?: number;
  thoughtProcess?: string;
  /** A proposed write the assistant wants to make — set only once, resolved
   * (confirmed/cancelled) in place so re-opening the conversation doesn't
   * show a stale, already-actioned card as if it were still pending. */
  pendingAction?: PendingAction | null;
  actionResolved?: "confirmed" | "cancelled";
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "softune.ai.conversations";
const ACTIVE_CONV_KEY = "softune.ai.active_id";

export const DEFAULT_SUGGESTIONS = [
  { text: "Analyze store sales & conversion rate", icon: "/sidebar/analytics.svg" },
  { text: "Suggest modern theme styles for honey store", icon: "/sidebar/themes.svg" },
  { text: "Write product description for organic tea", icon: "/sidebar/products.svg" },
  { text: "Check low inventory products", icon: "/sidebar/categories.svg" },
];

export const THEME_EDITOR_SUGGESTIONS = [
  { text: "Suggest a modern color palette for honey store", icon: "/sidebar/themes.svg" },
  { text: "Write high-converting Hero title & headline", icon: "/sidebar/note.svg" },
  { text: "Recommend best section order for organic store", icon: "/sidebar/categories.svg" },
  { text: "Generate announcement banner text & offer", icon: "/sidebar/analytics.svg" },
];

export type AiModel = {
  id: string;
  name: string;
  icon: string;
  /** Locked models stay in the list but cannot be selected. */
  locked: boolean;
};

/** Only Gemini is available; others show as locked placeholders. */
export const AI_MODELS: AiModel[] = [
  { id: "gemini", name: "Gemini 3.6", icon: "/sidebar/gemini.svg", locked: false },
  { id: "gpt-5.2", name: "GPT-5.2", icon: "/sidebar/gpt.svg", locked: true },
  { id: "claude-3.7", name: "Claude 3.7", icon: "/sidebar/claude.svg", locked: true },
  { id: "grok-3", name: "Grok 3", icon: "/sidebar/grok.svg", locked: true },
];

export const DEFAULT_AI_MODEL =
  AI_MODELS.find((m) => !m.locked) ?? AI_MODELS[0];


function canUseStorage() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

export function loadConversations(): Conversation[] {
  if (!canUseStorage()) return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Conversation[];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: Conversation[]) {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
}

export function loadActiveConversationId(): string | null {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACTIVE_CONV_KEY);
}

export function saveActiveConversationId(id: string | null) {
  if (!canUseStorage()) return;
  if (id) {
    localStorage.setItem(ACTIVE_CONV_KEY, id);
  } else {
    localStorage.removeItem(ACTIVE_CONV_KEY);
  }
}

export function createNewConversation(initialTitle?: string): Conversation {
  const newConv: Conversation = {
    id: `conv-${Date.now()}`,
    title: initialTitle || "New Chat",
    messages: [],
    createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    updatedAt: new Date().toISOString(),
  };
  return newConv;
}

export function generateMockAiResponse(
  userMessage: string,
  attachments?: FileAttachment[]
): {
  reply: string;
  thinkingTimeSec: number;
  thoughtProcess: string;
} {
  const query = userMessage.toLowerCase();
  
  // Auto-detect Bangla characters in the user's message
  const isBangla = /[\u0980-\u09FF]/.test(userMessage);
  const language = isBangla ? "BN" : "EN";

  let reply = "";
  let thoughtProcess = "";
  const thinkingTimeSec = parseFloat((Math.random() * 1.5 + 1.2).toFixed(1));

  const attachmentNoticeEN = attachments && attachments.length > 0
    ? `\n\n*Analyzed ${attachments.length} attached file(s): ${attachments.map(a => a.name).join(", ")}.*`
    : "";
  const attachmentNoticeBN = attachments && attachments.length > 0
    ? `\n\n*${attachments.length} টি ফাইল বিশ্লেষণ করা হয়েছে: ${attachments.map(a => a.name).join(", ")}.*`
    : "";
    
  const attachmentNotice = language === "BN" ? attachmentNoticeBN : attachmentNoticeEN;

  if (query.includes("color") || query.includes("palette")) {
    thoughtProcess = language === "BN" 
      ? "সক্রিয় স্টোরফ্রন্ট থিম বিশ্লেষণ করা হয়েছে। ওয়ার্ম টোন এবং কালার কনট্রাস্ট চেক করা হয়েছে।" 
      : "Analyzed active storefront theme settings. Checked WCAG AAA color contrast ratios and warm tone harmonies for organic honey brands.";
    reply = language === "BN"
      ? `আপনার স্টোরের জন্য এখানে একটি প্রস্তাবিত কালার প্যালেট দেওয়া হলো:\n\n• **প্রাইমারি কালার**: \`#FF5A36\` (উষ্ণ অ্যাম্বার)\n• **অ্যাকসেন্ট কালার**: \`#171717\` (চারকোল ডার্ক)\n• **সারফেস কালার**: \`#F4F4F5\` (ক্লিন সফট গ্রে)\n\nআপনি বাম দিকের **Colors** প্যানেল থেকে এগুলো দ্রুত সেট করতে পারবেন!${attachmentNotice}`
      : `Here is a recommended color palette tailored for your honey & natural products store:\n\n• **Primary Color**: \`#FF5A36\` (Warm Amber - high converting CTA)\n• **Accent Color**: \`#171717\` (Charcoal Dark for headings)\n• **Surface Color**: \`#F4F4F5\` (Clean Soft Gray for backgrounds)\n\nYou can set these instantly in the **Colors** panel on the left!${attachmentNotice}`;
  } else if (query.includes("hero") || query.includes("headline") || query.includes("title")) {
    thoughtProcess = language === "BN" 
      ? "সুন্দরবনের খাঁটি মধুর উপর ভিত্তি করে উচ্চ কনভার্শন রেট সম্পন্ন হিরো সেকশনের কপি তৈরি করা হয়েছে।" 
      : "Formulated high-converting Hero headlines & body copy focused on pure Sundarbans honey USP.";
    reply = language === "BN"
      ? `এখানে হিরো সেকশনের জন্য ২টি চমৎকার অপশন দেওয়া হলো:\n\n**অপশন এ (আধুনিক ও বোল্ড)**\n• আইব্রো: *১০০% খাঁটি মধু*\n• শিরোনাম: *সুন্দরবন থেকে সরাসরি সংগৃহীত খাঁটি মধু*\n• বডি: *সারা বাংলাদেশে খামার থেকে সরাসরি ডেলিভারি।*\n• বাটন: *এখনই কিনুন*\n\n**অপশন বি (সিম্পল ও সুন্দর)**\n• আইব্রো: *প্রকৃতির সেরা উপহার*\n• শিরোনাম: *খাঁটি মধুর আসল স্বাদ*\n• বডি: *আপনার পরিবারের জন্য ল্যাব টেস্টেড ১০০% আসল মধু।*\n• বাটন: *আমাদের প্রোডাক্টগুলো দেখুন*${attachmentNotice}`
      : `Here are 2 high-converting Hero section options:\n\n**Option A (Modern & Bold)**\n• Eyebrow: *100% Pure Harvest*\n• Hero Title: *Raw Honey Directly From Sundarbans*\n• Body: *Farm-fresh jars delivered across Bangladesh.*\n• CTA Button: *Shop Fresh Harvest*\n\n**Option B (Minimal & Warm)**\n• Eyebrow: *Nature's Sweetest Miracle*\n• Hero Title: *Golden Taste of Pure Honey*\n• Body: *Unfiltered, raw & lab-tested for your family.*\n• CTA Button: *Explore Collection*${attachmentNotice}`;
  } else if (query.includes("section") || query.includes("order")) {
    thoughtProcess = language === "BN"
      ? "ই-কমার্স কনভার্শন ফ্লো বিশ্লেষণ করে হোমপেজ সেকশনের সঠিক বিন্যাস নির্ণয় করা হয়েছে।"
      : "Evaluated homepage section hierarchy for e-commerce conversion flow.";
    reply = language === "BN"
      ? `সর্বোচ্চ সেলসের জন্য আমি হোমপেজের সেকশনগুলো এইভাবে সাজানোর পরামর্শ দিচ্ছি:\n\n১. **অ্যানাউন্সমেন্ট ব্যানার** (অফার / ফ্রি শিপিং)\n২. **হিরো সেকশন** (মূল বার্তা + কল টু অ্যাকশন)\n৩. **ক্যাটাগরি গ্রিড** (দ্রুত নেভিগেশন)\n৪. **ফিচারড প্রোডাক্ট** (বেস্ট সেলার)\n৫. **কেন আমাদের বেছে নিবেন** (১০০% খাঁটি, দ্রুত ডেলিভারি)\n৬. **রিভিউ বা টেস্টিমোনিয়াল** (গ্রাহকের আস্থা)\n৭. **ফুটার**\n\nআপনি **Sections** বিল্ডার থেকে খুব সহজেই এগুলো ড্র্যাগ করে সাজাতে পারবেন!${attachmentNotice}`
      : `For maximum conversion in organic e-commerce, I recommend this top-to-bottom section order:\n\n1. **Announcement Banner** (Offer / Free shipping threshold)\n2. **Hero** (Strong value proposition + clear CTA)\n3. **Categories Grid** (Fast catalog navigation)\n4. **Featured Products** (Showcase bestsellers)\n5. **Why Choose Us** (Trust badges: 100% Pure, Fast Shipping)\n6. **Testimonials** (Customer social proof)\n7. **Footer**\n\nYou can drag and reorder these sections anytime in the **Sections** builder!${attachmentNotice}`;
  } else if (query.includes("announcement") || query.includes("banner")) {
    thoughtProcess = language === "BN" ? "হেডারের জন্য আকর্ষণীয় অফার ব্যানার কপি তৈরি করা হয়েছে।" : "Drafted urgency-driven announcement bar copy for header.";
    reply = language === "BN"
      ? `আপনার স্টোরের জন্য কিছু চমৎকার ব্যানারের আইডিয়া দেওয়া হলো:\n\n• 🚚 *"২০০০ টাকার বেশি অর্ডারে সারা বাংলাদেশে ফ্রি শিপিং!"*\n• 🍯 *"সুন্দরবনের নতুন খাঁটি মধু স্টক ইন হয়েছে — আজই অর্ডার করুন!"*\n• ⚡ *"প্রথম অর্ডারে ১০% ছাড় পেতে ব্যবহার করুন \`HONEY10\` কোড!"*${attachmentNotice}`
      : `Here are top announcement banner ideas for your store:\n\n• 🚚 *"Free shipping across Bangladesh on orders over 2000৳!"*\n• 🍯 *"New Harvest Sundarbans Honey is now in stock — Order Today!"*\n• ⚡ *"Use code \`HONEY10\` for 10% off your first order!"*${attachmentNotice}`;
  } else if (query.includes("sales") || query.includes("analytics") || query.includes("conversion")) {
    thoughtProcess = language === "BN" ? "গত ৩০ দিনের ডাটা বিশ্লেষণ করা হয়েছে।" : "Analyzed recent 30-day analytics data. Cross-referenced store traffic with checkout completion rates. Identified peak traffic hours.";
    reply = language === "BN" 
      ? `আপনার স্টোরের কনভার্শন রেট এই মাসে ১৪.২% বৃদ্ধি পেয়েছে! সবচেয়ে বেশি সেল হওয়া প্রোডাক্ট হলো ৫০০ গ্রাম মধুর জার। গড় অর্ডারের পরিমাণ বাড়ানোর জন্য আমি একটি বান্ডেল অফার চালু করার পরামর্শ দিচ্ছি।${attachmentNotice}`
      : `Your store's overall conversion rate is up 14.2% this month! Top revenue driver is the Honey Jar 500g product. I recommend running a bundle promotion on complementary categories to boost Average Order Value (AOV).${attachmentNotice}`;
  } else if (query.includes("theme") || query.includes("design") || query.includes("style")) {
    thoughtProcess = language === "BN" ? "বর্তমান থিম বিশ্লেষণ করা হয়েছে।" : "Evaluated current active theme 'Modhu Bon'. Inspected color contrasts, section order, and typography settings.";
    reply = language === "BN" 
      ? `আপনার স্টোরফ্রন্টের জন্য ওয়ার্ম কালার টোন এবং আকর্ষণীয় কল-টু-অ্যাকশন বাটন সবচেয়ে ভালো কাজ করবে। আপনি থিম এডিটর থেকে সহজেই এগুলো পরিবর্তন করতে পারবেন।${attachmentNotice}`
      : `For your storefront, warm organic tones combined with vibrant call-to-action buttons perform best. You can customize hero section banners and color schemes directly from the Themes Editor page.${attachmentNotice}`;
  } else if (query.includes("product") || query.includes("tea") || query.includes("description")) {
    thoughtProcess = language === "BN" ? "এস.ই.ও অপটিমাইজড প্রোডাক্ট ডেসক্রিপশন তৈরি করা হয়েছে।" : "Formulated SEO-optimized product title, feature bullets, and benefit-focused copy tailored for organic goods.";
    reply = language === "BN" 
      ? `এখানে একটি খসড়া ডেসক্রিপশন দেওয়া হলো:\n\n**খাঁটি অর্গানিক মধু**\nসম্পূর্ণ প্রাকৃতিক ও ১০০% খাঁটি। চা, বেকিং বা প্রতিদিনের সুস্বাস্থ্যের জন্য পারফেক্ট।${attachmentNotice}`
      : `Here is a draft description:\n\n**Pure Organic Wildflower Honey**\nHarvested from pristine mountain pastures. 100% raw, unpasteurized, and rich in natural antioxidants. Perfect for tea, baking, or daily wellness.${attachmentNotice}`;
  } else if (query.includes("inventory") || query.includes("stock")) {
    thoughtProcess = language === "BN" ? "বর্তমান স্টকের তথ্য চেক করা হয়েছে।" : "Scanned active inventory levels across 1,284 products. Identified 3 items below reorder threshold.";
    reply = language === "BN" 
      ? `আপনার বর্তমানে ৩টি প্রোডাক্টের স্টক প্রায় শেষ:\n- খাঁটি সরিষা মধু ২৫০ গ্রাম (৪টি আছে)\n- অর্গানিক ব্ল্যাক টি (২টি আছে)\n- হানি ডিপার (স্টক আউট)${attachmentNotice}`
      : `You currently have 3 items running low on stock:\n- Raw Mustard Honey 250g (4 remaining)\n- Organic Black Tea Leaves (2 remaining)\n- Artisan Honey Dipper (0 remaining - Out of Stock)${attachmentNotice}`;
  } else {
    thoughtProcess = language === "BN" ? "ইউজার কমান্ড অনুযায়ী ডাটা বিশ্লেষণ করা হচ্ছে।" : "Processed user query and attached assets. Synthesized business logic and dashboard metrics to generate actionable insights.";
    reply = language === "BN" 
      ? `আমি আপনাকে আপনার স্টোর ম্যানেজ করতে, থিম ডিজাইন করতে বা সেলস ডাটা বিশ্লেষণ করতে সাহায্য করতে পারি। আপনি আমাকে কী করতে বলছেন তা বিস্তারিত জানান!${attachmentNotice}`
      : `I can help you manage your store, optimize theme designs, write product descriptions, or analyze performance data. Let me know what specific task you'd like assistance with!${attachmentNotice}`;
  }

  return { reply, thinkingTimeSec, thoughtProcess };
}
