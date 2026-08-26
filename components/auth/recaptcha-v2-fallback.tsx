"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { renderV2Checkbox, type V2WidgetHandle } from "@/lib/recaptcha";

export type RecaptchaV2FallbackHandle = { reset: () => void };

type RecaptchaV2FallbackProps = {
  onVerify: (token: string | null) => void;
};

/** The v2 checkbox challenge — only ever mounted after the backend has
 * actually responded with "please verify" (a RecaptchaChallengeRequiredError
 * from lib/api.ts), never rendered up-front. A normal login/add-account
 * never sees this; v3 alone is enough for the vast majority of attempts. */
export const RecaptchaV2Fallback = forwardRef<
  RecaptchaV2FallbackHandle,
  RecaptchaV2FallbackProps
>(function RecaptchaV2Fallback({ onVerify }, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<V2WidgetHandle | null>(null);

  useImperativeHandle(ref, () => ({
    reset: () => {
      widgetRef.current?.reset();
      onVerify(null);
    },
  }));

  useEffect(() => {
    let cancelled = false;
    if (!containerRef.current) return;
    renderV2Checkbox(containerRef.current, onVerify).then((handle) => {
      if (cancelled) return;
      widgetRef.current = handle;
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- render once
  }, []);

  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-border bg-search-bg p-3">
      <p className="text-xs text-muted">
        We couldn't automatically verify you're not a bot — please confirm below.
      </p>
      <div ref={containerRef} />
    </div>
  );
});
