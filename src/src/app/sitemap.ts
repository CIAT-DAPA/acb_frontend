import type { MetadataRoute } from "next";
import BulletinAPIService from "@/services/bulletinService";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bulletin.aclimate.org";

export const dynamic = "force-dynamic";

const LOCALES = ["es", "en", "vi"] as const;

function toAbsoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function parseDate(value?: string | Date | null): Date | undefined {
  if (!value) return undefined;

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  const addedUrls = new Set<string>();

  function addEntry(entry: MetadataRoute.Sitemap[number]) {
    if (addedUrls.has(entry.url)) return;

    addedUrls.add(entry.url);
    entries.push(entry);
  }

  addEntry({
    url: SITE_URL,
    changeFrequency: "weekly",
    priority: 1,
  });

  for (const locale of LOCALES) {
    addEntry({
      url: toAbsoluteUrl(`/${locale}/bulletins`),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  try {
    const publishedResponse =
      await BulletinAPIService.getBulletinsByStatus("published");

    console.log("SITEMAP publishedResponse", publishedResponse);

    if (!publishedResponse.success || !publishedResponse.data.length) {
      return entries;
    }

    for (const bulletin of publishedResponse.data) {
      const bulletinSlug = bulletin.name_machine;
      const templateSlug = bulletin.template_machine_name;

      if (!bulletinSlug || !templateSlug) {
        console.warn("Bulletin missing slug/templateSlug for sitemap", {
          bulletinName: bulletin.bulletin_name,
          bulletinSlug,
          templateSlug,
          baseTemplateMasterId: bulletin.base_template_master_id,
        });

        continue;
      }

      if (!bulletin.current_version_id) {
        console.warn("Published bulletin without current version skipped", {
          bulletinName: bulletin.bulletin_name,
          bulletinSlug,
          templateSlug,
        });

        continue;
      }

      const lastModified = parseDate(
        bulletin.log?.updated_at || bulletin.log?.created_at,
      );

      for (const locale of LOCALES) {
        addEntry({
          url: toAbsoluteUrl(`/${locale}/${templateSlug}/${bulletinSlug}`),
          lastModified,
          changeFrequency: "monthly",
          priority: 0.8,
        });
      }
    }
  } catch (error) {
    console.error("Error generating sitemap for bulletins:", error);
  }

  return entries;
}
