import { getBrandingSettings } from "./api/modules/branding";

const STORAGE_KEY = "octop:app-name";
const metaName = document.querySelector<HTMLMetaElement>(
  'meta[name="application-name"]',
)?.content;
const hasServerName = !!metaName && metaName !== "__OCTOP_APP_NAME__";

function cachedName(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

// The server owns the default. Cached branding keeps offline boots consistent.
export let appName = (hasServerName ? metaName : cachedName()) || "AI 助手";
export const brandLogo = "/logo.png";

export async function initBranding(): Promise<void> {
  if (!hasServerName) {
    try {
      const settings = await getBrandingSettings();
      if (settings.app_name.trim()) appName = settings.app_name;
    } catch {
      // Let the existing offline panel render with the last known name.
    }
  }
  try {
    localStorage.setItem(STORAGE_KEY, appName);
  } catch {
    // Branding still works when browser storage is unavailable.
  }
  document.title = appName;
  document
    .querySelectorAll(
      'meta[name="application-name"], meta[name="apple-mobile-web-app-title"]',
    )
    .forEach((meta) => meta.setAttribute("content", appName));
}

/** Replace display copy while preserving upstream links and executable names. */
export function brandText(value: string): string {
  return value.replace(/https?:\/\/[^\s<>]+|\b(?:Octop|OCTOP)\b/g, (match) =>
    match.startsWith("http") ? match : appName,
  );
}
