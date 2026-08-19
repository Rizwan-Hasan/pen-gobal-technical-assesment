export type ThemePreference = "light" | "dark" | "system";

export const THEME_STORAGE_KEY = "sms-theme";

/**
 * Runs synchronously in <head> before first paint, so the register never
 * flashes light before switching to dark. Resolves "system" to a concrete
 * value and writes it to data-theme on <html>.
 */
export const themeInitScript = `(function(){try{var k="${THEME_STORAGE_KEY}",p=localStorage.getItem(k)||"system",d=p==="dark"||(p==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}})()`;

export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference !== "system") return preference;
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function applyTheme(preference: ThemePreference) {
  document.documentElement.setAttribute("data-theme", resolveTheme(preference));
}

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored;
    }
  } catch {
    // localStorage unavailable (private mode, blocked cookies) — fall through.
  }
  return "system";
}
