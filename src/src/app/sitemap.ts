import type { MetadataRoute } from "next";
import { TemplateAPIService } from "@/services/templateService";
import BulletinAPIService from "@/services/bulletinService";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bulletin.aclimate.org";

export const dynamic = "force-dynamic";

const LOCALIZED_LOCALES = ["es", "en", "vi"] as const;

function toAbsoluteUrl(pathname: string): string {
  return `${SITE_URL}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function parseDate(value?: string | Date): Date | undefined {
  if (!value) return undefined;

  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];

  for (const locale of LOCALIZED_LOCALES) {
    entries.push({
      url: toAbsoluteUrl(`/${locale}/bulletins`),
      changeFrequency: "daily",
      priority: 0.7,
    });
  }

  try {
    const publishedResponse =
      await BulletinAPIService.getBulletinsByStatus("published");

    if (!publishedResponse.success || !publishedResponse.data.length) {
      return entries;
    }

    const publicBulletins = publishedResponse.data.filter(
      (bulletin) => bulletin.access_config?.access_type === "public",
    );

    const templateIds = Array.from(
      new Set(
        publicBulletins
          .map((bulletin) => bulletin.base_template_master_id)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    const templateSlugMap = new Map<string, string>();

    await Promise.all(
      templateIds.map(async (templateId) => {
        const templateResponse =
          await TemplateAPIService.getTemplateById(templateId);

        if (templateResponse.success && templateResponse.data?.name_machine) {
          templateSlugMap.set(templateId, templateResponse.data.name_machine);
        }
      }),
    );

    for (const bulletin of publicBulletins) {
      const templateSlug = templateSlugMap.get(
        bulletin.base_template_master_id,
      );

      if (!templateSlug || !bulletin.name_machine) {
        continue;
      }

      const lastModified = parseDate(
        bulletin.log?.updated_at || bulletin.log?.created_at,
      );

      for (const locale of LOCALIZED_LOCALES) {
        entries.push({
          url: toAbsoluteUrl(
            `/${locale}/${templateSlug}/${bulletin.name_machine}`,
          ),
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
