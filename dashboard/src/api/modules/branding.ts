import { getApiUrl } from "../config";

export interface BrandingSettings {
  app_name: string;
}

/** Loaded before i18n; request.ts imports i18n and would create a cycle here. */
export async function getBrandingSettings(): Promise<BrandingSettings> {
  const response = await fetch(getApiUrl("/settings/branding"), {
    cache: "no-store",
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error(`Branding settings: ${response.status}`);
  return response.json() as Promise<BrandingSettings>;
}
