import { ChevronRight } from "lucide-react";
import { MaskIcon } from "@/components/ui/mask-icon";
import { helpTopics } from "./help-data";

export function HelpTopics() {
  return (
    <section className="flex h-full flex-col rounded-md bg-white p-4 sm:p-5">
      <div className="mb-4 shrink-0">
        <h2 className="text-base font-semibold text-foreground">Quick help</h2>
        <p className="mt-0.5 text-sm text-slate-500">Popular guides</p>
      </div>

      <ul className="grid flex-1 grid-cols-1 gap-2.5 content-stretch sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        {helpTopics.map((topic) => (
          <li key={topic.id} className="flex min-h-[5.5rem]">
            <button
              type="button"
              className="group flex w-full items-center gap-3 rounded-xl bg-search-bg px-3.5 py-3.5 text-left transition-colors hover:bg-primary/5"
            >
              <div className="flex min-w-0 flex-1 flex-col items-start gap-2.5">
                <span className="flex size-12 items-center justify-center rounded-full bg-white text-primary">
                  <MaskIcon src={topic.icon} className="size-6" />
                </span>
                <div className="min-w-0 w-full">
                  <p className="text-sm font-semibold text-foreground">
                    {topic.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500">
                    {topic.description}
                  </p>
                </div>
              </div>

              <ChevronRight
                className="size-5 shrink-0 self-center text-muted-soft transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                strokeWidth={1.75}
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
