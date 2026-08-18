"use client";

import { Globe, Info, Plus } from "lucide-react";
import { useState } from "react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SettingsActions } from "../ui/settings-actions";
import { SettingsModal } from "../ui/settings-modal";
import {
  initialDomains,
  type DomainRecord,
  type DomainStatus,
} from "./domains-data";

const statusStyles: Record<DomainStatus, string> = {
  Connected: "bg-emerald-50 text-emerald-600",
  Pending: "bg-amber-50 text-amber-600",
  Failed: "bg-red-50 text-red-500",
};

export function DomainsSection() {
  const [domains, setDomains] = useState(initialDomains);
  const [newHost, setNewHost] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);

  function addDomain() {
    const host = newHost.trim().toLowerCase();
    if (!host) return;
    const next: DomainRecord = {
      id: String(Date.now()),
      host,
      primary: domains.length === 0,
      status: "Pending",
      ssl: false,
    };
    setDomains((list) => [...list, next]);
    setNewHost("");
  }

  function removeDomain(id: string) {
    setDomains((list) => list.filter((d) => d.id !== id));
  }

  function setPrimary(id: string) {
    setDomains((list) =>
      list.map((d) => ({ ...d, primary: d.id === id })),
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header row: title actions */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-slate-500">Your domains</p>
        <button
          type="button"
          onClick={() => setSetupOpen(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary transition-opacity hover:opacity-80"
        >
          <Info className="size-4" strokeWidth={1.75} />
          How to setup
        </button>
      </div>

      {/* Add domain — aligned row */}
      <div className="flex items-center gap-2">
        <div className="relative min-w-0 flex-1">
          <Globe
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-soft"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={newHost}
            onChange={(e) => setNewHost(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addDomain();
            }}
            placeholder="shop.yourstore.com"
            className="h-10 w-full rounded-md border border-slate-200 bg-white pr-3 pl-10 text-sm text-foreground outline-none placeholder:text-muted-soft focus:border-primary"
          />
        </div>
        <PrimaryButton
          type="button"
          onClick={addDomain}
          className="h-10 shrink-0"
        >
          <Plus className="size-4" strokeWidth={2} />
          Add domain
        </PrimaryButton>
      </div>

      {/* Domain list */}
      <ul className="flex flex-col gap-2">
        {domains.map((domain) => (
          <li
            key={domain.id}
            className="flex flex-wrap items-center gap-3 rounded-md border border-slate-200 px-3 py-3"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Globe className="size-4" strokeWidth={1.75} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold text-foreground">{domain.host}</p>
                {domain.primary ? (
                  <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-semibold text-white">
                    Primary
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-slate-500">
                {domain.ssl ? "SSL active" : "SSL pending"}
              </p>
            </div>

            <span
              className={[
                "inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                statusStyles[domain.status],
              ].join(" ")}
            >
              {domain.status}
            </span>

            {!domain.primary ? (
              <button
                type="button"
                onClick={() => setPrimary(domain.id)}
                className="text-xs font-semibold text-primary transition-opacity hover:opacity-80"
              >
                Set primary
              </button>
            ) : null}

            <button
              type="button"
              aria-label={`Remove ${domain.host}`}
              onClick={() => removeDomain(domain.id)}
              className="inline-flex size-8 items-center justify-center text-muted transition-colors hover:text-red-500"
            >
              <MaskIcon src="/sidebar/delete.svg" className="size-4" />
            </button>
          </li>
        ))}

        {domains.length === 0 ? (
          <li className="rounded-md bg-search-bg px-4 py-8 text-center text-sm text-slate-500">
            No domains yet
          </li>
        ) : null}
      </ul>

      <SettingsActions saveLabel="Save domains" />

      <SettingsModal
        open={setupOpen}
        title="How to setup your domain"
        onClose={() => setSetupOpen(false)}
      >
        <ol className="flex list-decimal flex-col gap-3 pl-4 text-slate-600">
          <li>
            Add your domain above (example:{" "}
            <span className="font-medium text-foreground">yourstore.com</span>
            ).
          </li>
          <li>
            In your DNS provider, create a{" "}
            <span className="font-medium text-foreground">CNAME</span> record
            pointing to{" "}
            <span className="font-medium text-primary">connect.softune.app</span>
            .
          </li>
          <li>
            For apex domains, add an{" "}
            <span className="font-medium text-foreground">A</span> record to the
            IP shown in Softune after the domain is added.
          </li>
          <li>
            Wait for DNS to propagate (often a few minutes, up to 24 hours). SSL
            is issued automatically when the domain connects.
          </li>
          <li>
            Mark one domain as{" "}
            <span className="font-medium text-primary">Primary</span> for
            storefront links and emails.
          </li>
        </ol>
      </SettingsModal>
    </div>
  );
}
