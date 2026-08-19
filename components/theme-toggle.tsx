"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  applyTheme,
  readThemePreference,
  THEME_STORAGE_KEY,
  type ThemePreference,
} from "@/lib/theme";
import { cn } from "@/lib/utils";

const options: Array<{
  value: ThemePreference;
  label: string;
  Icon: typeof Sun;
}> = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "system", label: "Match system", Icon: Monitor },
  { value: "dark", label: "Dark", Icon: Moon },
];

/**
 * localStorage is the store; the toggle just reads it. useSyncExternalStore
 * keeps the server's "system" guess and the browser's real preference from
 * colliding during hydration.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("storage", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onChange);
  };
}

function setPreference(next: ThemePreference) {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Preference just won't persist; the page still switches.
  }
  applyTheme(next);
  for (const listener of listeners) listener();
}

export function ThemeToggle({ className }: { className?: string }) {
  const preference = useSyncExternalStore(
    subscribe,
    readThemePreference,
    () => "system" as ThemePreference,
  );

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  return (
    <div
      role="group"
      aria-label="Appearance"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border border-line bg-surface p-0.5",
        className,
      )}
    >
      {options.map(({ value, label, Icon }) => {
        const active = preference === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setPreference(value)}
            aria-pressed={active}
            title={label}
            className={cn(
              "grid size-7 place-items-center rounded-full transition-colors",
              active
                ? "bg-brand text-on-brand"
                : "text-ink-faint hover:bg-elevated hover:text-ink",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}
