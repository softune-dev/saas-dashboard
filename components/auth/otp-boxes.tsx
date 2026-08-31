"use client";

import { useRef, type ClipboardEvent, type KeyboardEvent } from "react";

export const OTP_LENGTH = 6;

export function emptyOtpDigits(): string[] {
  return Array.from({ length: OTP_LENGTH }, () => "");
}

type OtpBoxesProps = {
  value: string[];
  onChange: (digits: string[]) => void;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function OtpBoxes({
  value,
  onChange,
  disabled,
  autoFocus = true,
}: OtpBoxesProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  function focusAt(index: number) {
    inputsRef.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]?.focus();
  }

  function fillFrom(raw: string, from = 0): string[] {
    const chars = raw.replace(/\D/g, "");
    if (chars.length >= OTP_LENGTH) return chars.slice(0, OTP_LENGTH).split("");
    const next = [...value];
    for (let i = 0; i < chars.length && from + i < OTP_LENGTH; i++) {
      next[from + i] = chars[i]!;
    }
    return next;
  }

  function emit(next: string[], nextFocus?: number) {
    onChange(next);
    if (next.join("").length === OTP_LENGTH) return;
    if (nextFocus !== undefined) focusAt(nextFocus);
  }

  function handleChange(index: number, raw: string) {
    const cleaned = raw.replace(/\D/g, "");
    if (!cleaned) {
      const next = [...value];
      next[index] = "";
      onChange(next);
      return;
    }
    if (cleaned.length > 1) {
      emit(fillFrom(cleaned, index), index + cleaned.length);
      return;
    }
    const next = [...value];
    next[index] = cleaned;
    emit(next, index + 1);
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[index]) {
        const next = [...value];
        next[index] = "";
        onChange(next);
        return;
      }
      if (index > 0) {
        const next = [...value];
        next[index - 1] = "";
        onChange(next);
        focusAt(index - 1);
      }
      return;
    }
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      focusAt(index - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focusAt(index + 1);
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>) {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    emit(fillFrom(pasted), pasted.length);
  }

  return (
    <div className="flex gap-2" role="group" aria-label="6-digit verification code">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          id={index === 0 ? "otp" : undefined}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          autoFocus={autoFocus && index === 0}
          maxLength={index === 0 ? OTP_LENGTH : 1}
          pattern="[0-9]*"
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.currentTarget.select()}
          className="h-12 min-w-0 flex-1 rounded-lg border border-border bg-search-bg text-center font-mono text-xl font-semibold text-foreground outline-none transition-colors focus:border-primary focus:bg-surface disabled:opacity-60 sm:h-14 sm:text-2xl"
        />
      ))}
    </div>
  );
}
