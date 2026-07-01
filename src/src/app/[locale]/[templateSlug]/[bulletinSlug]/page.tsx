import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BulletinAPIService from "@/services/bulletinService";
import BulletinPublicClient from "./BulletinPublicClient";
import {
  buildBulletinDescription,
  bulletinToTemplateData,
  extractBulletinText,
  safeDecode,
} from "@/utils/publicBulletin";
import { normalizeAssetUrl } from "@/utils/assetUrl";
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
} from "@/utils/seoUtils";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bulletin.aclimate.org";

const LOCALES = ["es", "en", "vi"] as const;

const OG_LOCALES: Record<string, string> = {
  es: "es_ES",
  en: "en_US",
  vi: "vi_VN",
};

type PageProps = {
  params: Promise<{
    locale: string;
    templateSlug: string;
    bulletinSlug: string;
  }>;
};

function buildCanonicalUrl(
  locale: string,
  templateSlug: string,
  bulletinSlug: string,
) {
  return `${SITE_URL}/${locale}/${templateSlug}/${bulletinSlug}`;
}

function toAbsoluteAssetUrl(url?: string): string | undefined {
  if (!url) return undefined;

  const normalizedUrl = normalizeAssetUrl(url);

  if (!normalizedUrl) return undefined;

  if (
    normalizedUrl.startsWith("http://") ||
    normalizedUrl.startsWith("https://")
  ) {
    return normalizedUrl;
  }

  return `${SITE_URL}${
    normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`
  }`;
}

async function getPublishedBulletin(bulletinSlug: string) {
  const response = await BulletinAPIService.getBulletinBySlug(bulletinSlug);

  if (!response.success || !response.data) {
    return null;
  }

  if (response.data.master.status !== "published") {
    return null;
  }

  if (!response.data.current_version?.data?.sections?.length) {
    return null;
  }

  return response.data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, templateSlug, bulletinSlug } = await params;

  const canonicalUrl = buildCanonicalUrl(locale, templateSlug, bulletinSlug);
  const bulletin = await getPublishedBulletin(bulletinSlug);

  if (!bulletin) {
    return {
      title: "Bulletin not found | Bulletin Builder",
      robots: {
        index: false,
        follow: false,
      },
      alternates: {
        canonical: canonicalUrl,
      },
    };
  }

  const title =
    safeDecode(bulletin.master.bulletin_name) || "Agroclimatic Bulletin";

  const description = buildBulletinDescription(bulletin);
  const imageUrl = toAbsoluteAssetUrl(bulletin.master.thumbnail_images?.[0]);

  return {
    metadataBase: new URL(SITE_URL),
    title: `${title} | Bulletin Builder`,
    description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: canonicalUrl,
      languages: {
        es: buildCanonicalUrl("es", templateSlug, bulletinSlug),
        en: buildCanonicalUrl("en", templateSlug, bulletinSlug),
        vi: buildCanonicalUrl("vi", templateSlug, bulletinSlug),
        "x-default": buildCanonicalUrl("en", templateSlug, bulletinSlug),
      },
    },
    openGraph: {
      type: "article",
      siteName: "Bulletin Builder",
      locale: OG_LOCALES[locale] || "en_US",
      title,
      description,
      url: canonicalUrl,
      images: imageUrl
        ? [
            {
              url: imageUrl,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: imageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: imageUrl ? [imageUrl] : undefined,
    },
  };
}

export default async function PublicBulletinPage({ params }: PageProps) {
  const { locale, templateSlug, bulletinSlug } = await params;

  const bulletin = await getPublishedBulletin(bulletinSlug);

  if (!bulletin) {
    notFound();
  }

  const title =
    safeDecode(bulletin.master.bulletin_name) || "Agroclimatic Bulletin";

  const description = buildBulletinDescription(bulletin);
  const canonicalUrl = buildCanonicalUrl(locale, templateSlug, bulletinSlug);

  const templateData = bulletinToTemplateData(bulletin, bulletinSlug);
  const cardsMetadata = bulletin.cards_metadata || {};

  const publishedAt =
    bulletin.master.log?.created_at || new Date().toISOString();

  const modifiedAt =
    bulletin.master.log?.updated_at ||
    bulletin.current_version.log?.updated_at ||
    publishedAt;

  const articleSchema = generateArticleSchema({
    title,
    description,
    author: "CIAT",
    url: canonicalUrl,
    datePublished: publishedAt,
    dateModified: modifiedAt,
    inLanguage: locale,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    {
      name: "Home",
      url: SITE_URL,
    },
    {
      name: "Bulletins",
      url: `${SITE_URL}/${locale}/bulletins`,
    },
    {
      name: title,
      url: canonicalUrl,
    },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleSchema }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbSchema }}
      />

      <h1 className="sr-only">{title}</h1>

      <BulletinPublicClient
        initialTemplateData={templateData}
        initialCardsMetadata={cardsMetadata}
        locale={locale}
        templateSlug={templateSlug}
        bulletinSlug={bulletinSlug}
      />
    </>
  );
}
