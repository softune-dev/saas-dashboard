"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

type FieldShellProps = {
  label?: string;
  htmlFor: string;
  hint?: string;
  /** Rendered inline next to the label, right-aligned — used for the
   * AiGenerateButton on description-style fields. */
  labelExtra?: ReactNode;
  children: ReactNode;
};

export function FieldShell({ label, htmlFor, hint, labelExtra, children }: FieldShellProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label || labelExtra ? (
        <div className="flex items-center justify-between gap-2">
          {label ? (
            <label
              htmlFor={htmlFor}
              className="text-sm font-medium text-muted"
            >
              {label}
            </label>
          ) : <span />}
          {labelExtra}
        </div>
      ) : null}
      {children}
      {hint ? <p className="text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

const controlClass =
  "h-10 w-full rounded-md border border-border bg-search-bg px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-soft focus:border-primary focus:bg-surface";

const textareaClass =
  "min-h-[140px] w-full resize-y rounded-md border border-border bg-search-bg px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-soft focus:border-primary focus:bg-surface";

type SettingsInputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
};

export function SettingsInput({
  label,
  hint,
  id,
  className = "",
  ...props
}: SettingsInputProps) {
  const fieldId = id ?? props.name ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : "");

  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint}>
      <input id={fieldId} className={`${controlClass} ${className}`} {...props} />
    </FieldShell>
  );
}

type SettingsTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  labelExtra?: ReactNode;
};

export function SettingsTextarea({
  label,
  hint,
  labelExtra,
  id,
  className = "",
  ...props
}: SettingsTextareaProps) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint} labelExtra={labelExtra}>
      <textarea
        id={fieldId}
        className={`${textareaClass} ${className}`}
        {...props}
      />
    </FieldShell>
  );
}

type SettingsSelectProps = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  "children"
> & {
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
};

/** Custom listbox dropdown — same props as a native select so existing
 * onChange={(e) => e.target.value} call sites keep working. */
export function SettingsSelect({
  label,
  hint,
  id,
  options,
  className = "",
  value,
  defaultValue,
  onChange,
  disabled,
  name,
}: SettingsSelectProps) {
  const autoId = useId();
  const fieldId = id ?? name ?? label.toLowerCase().replace(/\s+/g, "-") ?? autoId;
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [uncontrolled, setUncontrolled] = useState(
    () => String(defaultValue ?? options[0]?.value ?? ""),
  );

  const selected = value !== undefined ? String(value) : uncontrolled;
  const selectedLabel =
    options.find((o) => o.value === selected)?.label ?? selected;

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const active = listRef.current?.querySelector<HTMLElement>("[data-active=true]");
    active?.scrollIntoView({ block: "nearest" });
  }, [open, selected]);

  function pick(next: string) {
    if (value === undefined) setUncontrolled(next);
    onChange?.({
      target: { value: next, name: name ?? "" },
    } as ChangeEvent<HTMLSelectElement>);
    setOpen(false);
  }

  return (
    <FieldShell label={label} htmlFor={fieldId} hint={hint}>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          id={fieldId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => !disabled && setOpen((v) => !v)}
          className={[
            "flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border bg-search-bg px-3 text-left text-sm text-foreground outline-none transition-colors",
            "hover:border-slate-300 focus:border-primary focus:bg-surface",
            disabled ? "cursor-not-allowed opacity-60" : "",
            open ? "border-primary bg-surface" : "",
            className,
          ].join(" ")}
        >
          <span className="min-w-0 truncate">{selectedLabel}</span>
          <ChevronDown
            className={[
              "size-4 shrink-0 text-muted transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
            strokeWidth={1.75}
          />
        </button>

        {open ? (
          <ul
            ref={listRef}
            role="listbox"
            aria-labelledby={fieldId}
            className="absolute top-[calc(100%+0.35rem)] right-0 left-0 z-40 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface py-1 shadow-lg"
          >
            {options.map((opt) => {
              const active = opt.value === selected;
              return (
                <li key={opt.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    data-active={active ? "true" : undefined}
                    onClick={() => pick(opt.value)}
                    className={[
                      "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors",
                      active
                        ? "bg-primary/8 font-medium text-primary"
                        : "text-foreground hover:bg-search-bg",
                    ].join(" ")}
                  >
                    <span className="min-w-0 truncate">{opt.label}</span>
                    {active ? (
                      <Check className="size-3.5 shrink-0" strokeWidth={2.25} />
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </FieldShell>
  );
}
