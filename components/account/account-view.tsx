"use client";

import { useLanguage } from "@/components/providers/language-provider";
import { PageHeading } from "@/components/ui/page-heading";
import { AccountBusinessForm } from "./account-business-form";
import { AccountNotifications } from "./account-notifications";
import { AccountProfileCard } from "./account-profile-card";
import { AccountProfileForm } from "./account-profile-form";
import { AccountSecurity } from "./account-security";

export function AccountView() {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading title={t("Account")} />

      <div className="grid grid-cols-1 items-stretch gap-3 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,2.15fr)]">
        <AccountProfileCard />
        <AccountProfileForm />
      </div>

      <AccountBusinessForm />

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <AccountSecurity />
        <AccountNotifications />
      </div>
    </div>
  );
}
