"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";
import { useSession } from "@/components/providers/session-provider";
import { useToast } from "@/components/ui/toast";
import { updateMe } from "@/lib/api";
import { AvatarPickerModal } from "./avatar-picker-modal";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function AccountProfileCard() {
  const { me, currentSite, loading, refetch } = useSession();
  const { toast } = useToast();
  const [pickerOpen, setPickerOpen] = useState(false);
  const user = me?.user;
  const tenant = me?.tenant;
  const name = user?.full_name || user?.email || "Account";

  async function handleAvatarSelect(url: string) {
    await updateMe({ avatar_url: url });
    refetch();
    toast({ title: "Profile picture updated", variant: "success" });
  }

  if (loading) {
    return (
      <section className="flex h-full flex-col rounded-md bg-primary p-4 text-white">
        <p className="text-[11px] font-semibold tracking-wide text-white/80 uppercase">
          Account
        </p>
        <div className="mt-4 flex flex-col items-center gap-2.5">
          <div className="size-20 animate-pulse rounded-full bg-white/15" />
          <div className="h-5 w-32 animate-pulse rounded-md bg-white/15" />
          <div className="h-3.5 w-40 animate-pulse rounded-md bg-white/10" />
        </div>
        <div className="mt-5 flex flex-col gap-2.5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-4 w-full animate-pulse rounded-md bg-white/10" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="flex h-full flex-col rounded-md bg-primary p-4 text-white">
      <p className="text-[11px] font-semibold tracking-wide text-white/80 uppercase">
        Account
      </p>

      <div className="mt-4 flex flex-col items-center gap-2.5 text-center">
        <button
          type="button"
          onClick={() => setPickerOpen(true)}
          aria-label="Change profile picture"
          className="group relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white/10 bg-white/20 text-xl font-semibold shadow-sm"
        >
          {user?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            initials(name)
          )}
          <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Pencil className="size-5 text-white" strokeWidth={1.75} />
          </span>
        </button>
        <div className="min-w-0 mt-0.5">
          <h2 className="truncate text-xl font-semibold tracking-tight">{name}</h2>
          <p className="truncate text-[13px] font-medium text-white/80">{user?.email ?? ""}</p>
        </div>
      </div>

      <dl className="mt-5 flex flex-col gap-2.5 text-[13px]">
        <div className="flex items-center gap-2">
          <dt className="text-white/70 whitespace-nowrap">Role</dt>
          <div className="flex-1 border-b border-dashed border-white/30" />
          <dd className="font-medium whitespace-nowrap capitalize">{user?.role ?? "—"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-white/70 whitespace-nowrap">Store</dt>
          <div className="flex-1 border-b border-dashed border-white/30" />
          <dd className="truncate font-medium whitespace-nowrap">{tenant?.name ?? "—"}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="text-white/70 whitespace-nowrap">Joined</dt>
          <div className="flex-1 border-b border-dashed border-white/30" />
          <dd className="font-medium whitespace-nowrap">
            {user ? new Date(user.created_at).toLocaleDateString() : "—"}
          </dd>
        </div>
      </dl>

      <AvatarPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        currentUrl={user?.avatar_url ?? null}
        siteId={currentSite?.id ?? null}
        onSelect={handleAvatarSelect}
      />
    </section>
  );
}
