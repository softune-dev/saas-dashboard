"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/components/providers/session-provider";
import { listTemplates } from "@/lib/api";
import {
  EDITOR_STEPS,
  POST_EDITOR_STEPS,
  PRE_EDITOR_STEPS,
  TOUR_PENDING_KEY,
  TOUR_RESUME_INDEX_KEY,
  TOUR_SEEN_KEY,
  type TourStep,
} from "./tour-steps";
import { TourOverlay } from "./tour-overlay";

type ResolvedStep = TourStep & { route: string };

type TourContextValue = {
  /** Single entry point: dashboard chrome, then in-place into the theme
   * editor for its own tools, then back to finish on the dashboard. */
  startTour: () => void;
  active: boolean;
};

const TourContext = createContext<TourContextValue | null>(null);

function markSeen() {
  try {
    localStorage.setItem(TOUR_SEEN_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { currentSite } = useSession();

  // The editor route is per-tenant (a template key, not a fixed path), so it
  // can only be resolved once the session's current site is known. Tenants
  // with no resolvable site/template just get the dashboard-only steps.
  const [editorPath, setEditorPath] = useState<string | null>(null);
  useEffect(() => {
    if (!currentSite) {
      setEditorPath(null);
      return;
    }
    let cancelled = false;
    listTemplates()
      .then((templates) => {
        if (cancelled) return;
        const key = templates.find((t) => t.id === currentSite.template_id)?.key;
        setEditorPath(key ? `/themes/editor/${key}` : null);
      })
      .catch(() => {
        if (!cancelled) setEditorPath(null);
      });
    return () => {
      cancelled = true;
    };
  }, [currentSite]);

  const steps = useMemo<ResolvedStep[]>(() => {
    const pre = PRE_EDITOR_STEPS.map((s) => ({ ...s, route: "/" }));
    const post = POST_EDITOR_STEPS.map((s) => ({ ...s, route: "/" }));
    if (!editorPath) return [...pre, ...post];
    const editor = EDITOR_STEPS.map((s) => ({ ...s, route: editorPath }));
    return [...pre, ...editor, ...post];
  }, [editorPath]);

  const [active, setActive] = useState(false);
  const [index, setIndex] = useState(0);

  const openAt = useCallback((i: number) => {
    setIndex(i);
    setActive(true);
  }, []);

  const startTour = useCallback(() => {
    if (pathname !== "/") {
      try {
        sessionStorage.setItem(TOUR_PENDING_KEY, "1");
      } catch {
        /* ignore */
      }
      router.push("/");
      return;
    }
    requestAnimationFrame(() => openAt(0));
  }, [pathname, router, openAt]);

  // Resume after a redirect-to-home that *started* the tour from elsewhere.
  useEffect(() => {
    if (pathname !== "/") return;
    let pending = false;
    try {
      pending = sessionStorage.getItem(TOUR_PENDING_KEY) === "1";
      if (pending) sessionStorage.removeItem(TOUR_PENDING_KEY);
    } catch {
      pending = false;
    }
    if (!pending) return;
    const t = window.setTimeout(() => openAt(0), 120);
    return () => window.clearTimeout(t);
  }, [pathname, openAt]);

  // Resume mid-tour after a navigation the tour itself triggered (into or
  // back out of the editor) — reads the index stashed right before the push.
  useEffect(() => {
    let resumeIndex: number | null = null;
    try {
      const raw = sessionStorage.getItem(TOUR_RESUME_INDEX_KEY);
      if (raw != null) {
        sessionStorage.removeItem(TOUR_RESUME_INDEX_KEY);
        resumeIndex = Number(raw);
      }
    } catch {
      resumeIndex = null;
    }
    if (resumeIndex == null || Number.isNaN(resumeIndex)) return;
    // Give the new route a beat to mount its data-tour targets.
    const t = window.setTimeout(() => openAt(resumeIndex as number), 150);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const closeTour = useCallback(() => {
    markSeen();
    setActive(false);
    setIndex(0);
  }, []);

  // When the active step needs a different route than the current one,
  // stash where to resume and navigate there instead of rendering the
  // overlay against a target that doesn't exist on this page.
  useEffect(() => {
    if (!active) return;
    const step = steps[index];
    if (!step || step.route === pathname) return;
    try {
      sessionStorage.setItem(TOUR_RESUME_INDEX_KEY, String(index));
    } catch {
      /* ignore */
    }
    setActive(false);
    router.push(step.route);
  }, [active, index, steps, pathname, router]);

  const goNext = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) {
        markSeen();
        setActive(false);
        return 0;
      }
      let next = i + 1;
      // Skip steps whose target is missing on the CURRENT route — a step
      // that needs a different route always gets its target once we navigate.
      while (next < steps.length) {
        const s = steps[next];
        if (s.route !== pathname || document.querySelector(s.selector)) break;
        next += 1;
      }
      if (next >= steps.length) {
        markSeen();
        setActive(false);
        return 0;
      }
      return next;
    });
  }, [steps, pathname]);

  const goBack = useCallback(() => {
    setIndex((i) => {
      let prev = i - 1;
      while (prev >= 0) {
        const s = steps[prev];
        if (s.route !== pathname || document.querySelector(s.selector)) break;
        prev -= 1;
      }
      return Math.max(0, prev);
    });
  }, [steps, pathname]);

  const value = useMemo(() => ({ startTour, active }), [startTour, active]);

  const step = active ? steps[index] : undefined;
  const showOverlay = active && !!step && step.route === pathname;

  return (
    <TourContext.Provider value={value}>
      {children}
      {showOverlay && step ? (
        <TourOverlay
          step={step}
          stepIndex={index}
          stepCount={steps.length}
          isFirst={index === 0}
          isLast={index === steps.length - 1}
          onBack={goBack}
          onNext={goNext}
          onSkip={closeTour}
        />
      ) : null}
    </TourContext.Provider>
  );
}

export function useTour() {
  const ctx = useContext(TourContext);
  if (!ctx) {
    throw new Error("useTour must be used within TourProvider");
  }
  return ctx;
}
