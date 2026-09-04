"use client";

import { Percent, Plus } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/components/providers/language-provider";
import { useSession } from "@/components/providers/session-provider";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeading } from "@/components/ui/page-heading";
import { PrimaryButton } from "@/components/ui/primary-button";
import { TableSkeleton } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { useUndoableDelete } from "@/lib/use-undoable-delete";
import {
  createEvent,
  deleteEvent,
  updateEvent,
  useEventsSWR,
  useProductsSWR,
  type EventCreate,
  type EventOut,
  type EventUpdate,
} from "@/lib/api/commerce";
import { EventsStats } from "./events-stats";
import { EventsTable, emptyEventFilters, type EventFilters } from "./events-table";
import { EventFormModal } from "./event-form-modal";

export function EventsView() {
  const { t } = useLanguage();
  const { currentSite, loading: sessionLoading } = useSession();
  const { toast } = useToast();
  const { deleteWithUndo } = useUndoableDelete();
  const siteId = currentSite?.id ?? null;
  const [filters, setFilters] = useState<EventFilters>(emptyEventFilters);

  const {
    data: eventsPage,
    error: eventsError,
    isLoading: eventsLoading,
    mutate: mutateEvents,
  } = useEventsSWR(siteId);
  const events = eventsPage?.items ?? [];

  // Enough to populate the product picker for a typical catalog size — same
  // tradeoff as Categories' own product fetch.
  const { data: productsPage, isLoading: productsLoading } = useProductsSWR(siteId, {
    limit: 100,
  });
  const products = productsPage?.items ?? [];

  const loading = eventsLoading || productsLoading;
  const error = eventsError
    ? eventsError instanceof Error
      ? eventsError.message
      : t("Failed to load events")
    : null;

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<EventOut | null>(null);
  const [deleting, setDeleting] = useState<EventOut | null>(null);

  async function handleCreate(data: EventCreate) {
    if (!currentSite) return;
    const created = await createEvent(currentSite.id, data);
    await mutateEvents(
      (prev) =>
        prev ? { ...prev, items: [...prev.items, created], total: prev.total + 1 } : prev,
      { revalidate: false },
    );
    toast({ title: t("Event created"), variant: "success" });
  }

  async function handleUpdate(id: string, data: EventUpdate) {
    if (!currentSite) return;
    const updated = await updateEvent(currentSite.id, id, data);
    await mutateEvents(
      (prev) =>
        prev ? { ...prev, items: prev.items.map((e) => (e.id === id ? updated : e)) } : prev,
      { revalidate: false },
    );
    toast({ title: t("Event updated"), variant: "success" });
  }

  function handleDelete() {
    if (!currentSite || !deleting) return;
    const site = currentSite;
    const event = deleting;
    setDeleting(null);

    deleteWithUndo({
      id: event.id,
      item: event,
      title: `"${event.name}" deleted`,
      optimisticRemove: () =>
        mutateEvents(
          (prev) =>
            prev
              ? { ...prev, items: prev.items.filter((e) => e.id !== event.id), total: prev.total - 1 }
              : prev,
          { revalidate: false },
        ),
      restore: (e) =>
        mutateEvents(
          (prev) => (prev ? { ...prev, items: [...prev.items, e], total: prev.total + 1 } : prev),
          { revalidate: false },
        ),
      commitDelete: () => deleteEvent(site.id, event.id),
      onError: (err) =>
        toast({
          title: t("Couldn't delete event"),
          description: err instanceof Error ? err.message : "Something went wrong.",
          variant: "info",
        }),
    });
  }

  const showSkeleton = sessionLoading || (loading && currentSite);

  return (
    <div className="flex flex-col gap-4 pb-2">
      <PageHeading
        title={t("Events")}
        actionsInline
        actions={
          <PrimaryButton
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            disabled={!currentSite}
          >
            <Plus className="size-4" strokeWidth={2} />
            {t("Add Event")}
          </PrimaryButton>
        }
      />

      {!sessionLoading && !currentSite ? (
        <EmptyState
          icon={Percent}
          title={t("No site yet")}
          description={t("Create a site from a template in Themes before adding events.")}
        />
      ) : showSkeleton ? (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[132px] animate-pulse rounded-md bg-surface" />
            ))}
          </div>
          <TableSkeleton columns={4} />
        </>
      ) : error ? (
        <EmptyState icon={Percent} title={t("Couldn't load events")} description={error} />
      ) : events.length === 0 ? (
        <EmptyState
          icon={Percent}
          title={t("No events yet")}
          description={t("Run a themed sale — New Arrival, Summer Sale — with a real discount on the products you pick.")}
          action={
            <PrimaryButton
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="size-4" strokeWidth={2} />
              {t("Add Event")}
            </PrimaryButton>
          }
        />
      ) : (
        <>
          <EventsStats events={events} />
          <EventsTable
            events={events}
            filters={filters}
            onFiltersChange={setFilters}
            onEdit={(e) => {
              setEditing(e);
              setFormOpen(true);
            }}
            onDelete={setDeleting}
          />
        </>
      )}

      <EventFormModal
        open={formOpen}
        siteId={currentSite?.id ?? null}
        event={editing}
        products={products}
        onClose={() => setFormOpen(false)}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ConfirmDialog
        open={!!deleting}
        title={`${t("Delete")} "${deleting?.name}"?`}
        description={t("You'll have 10 seconds to undo from the toast after this.")}
        confirmLabel={t("Delete")}
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
