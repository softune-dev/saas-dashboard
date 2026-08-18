"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import {
  sectionLabel,
  type PageSection,
} from "./editor-types";

type SectionsSortableListProps = {
  sections: PageSection[];
  onReorder: (sections: PageSection[]) => void;
  onRemove: (id: string) => void;
};

export function SectionsSortableList({
  sections,
  onReorder,
  onRemove,
}: SectionsSortableListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onReorder(arrayMove(sections, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex flex-col gap-2">
          {sections.map((section, index) => (
            <SortableSectionRow
              key={section.id}
              section={section}
              index={index}
              onRemove={onRemove}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableSectionRow({
  section,
  index,
  onRemove,
}: {
  section: PageSection;
  index: number;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        "flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2 py-2",
        isDragging ? "z-10 border-primary bg-primary/5 opacity-95" : "",
      ].join(" ")}
    >
      <button
        type="button"
        aria-label={`Drag ${sectionLabel(section.type)}`}
        className="inline-flex size-8 shrink-0 cursor-grab items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-search-bg hover:text-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" strokeWidth={1.75} />
      </button>

      <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-search-bg text-[10px] font-bold text-slate-500">
        {index + 1}
      </span>

      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
        {sectionLabel(section.type)}
      </span>

      <button
        type="button"
        aria-label={`Remove ${sectionLabel(section.type)}`}
        onClick={() => onRemove(section.id)}
        className="inline-flex size-7 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
      >
        <MaskIcon src="/sidebar/delete.svg" className="size-3.5" />
      </button>
    </li>
  );
}
