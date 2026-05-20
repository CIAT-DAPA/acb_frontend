import { BulletinAPIService } from "@/services/bulletinService";
import { normalizeAssetUrl } from "@/utils/assetUrl";
import {
  generateArticleSchema,
  generateBreadcrumbSchema,
} from "@/utils/seoUtils";

type BulletinPublicHeadProps = {
  params: {
    locale: string;
    templateSlug: string;
    bulletinSlug: string;
  };
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bulletin.aclimate.org";

function buildCanonicalUrl(
  locale: string,
  templateSlug: string,
  bulletinSlug: string,
) {
  return `${SITE_URL}/${locale}/${templateSlug}/${bulletinSlug}`;
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function toAbsoluteUrl(url?: string): string {
  if (!url) return "";

  const normalizedUrl = normalizeAssetUrl(url);
  if (!normalizedUrl) return "";

  if (
    normalizedUrl.startsWith("http://") ||
    normalizedUrl.startsWith("https://")
  ) {
    return normalizedUrl;
  }

  return `${SITE_URL}${normalizedUrl.startsWith("/") ? normalizedUrl : `/${normalizedUrl}`}`;
}

export default async function Head({ params }: BulletinPublicHeadProps) {
  const canonicalUrl = buildCanonicalUrl(
    params.locale,
    params.templateSlug,
    params.bulletinSlug,
  );

  let bulletinTitle = params.bulletinSlug;
  let description =
    "Consulta el boletín publicado con contenido actualizado y visor interactivo.";
  let publishedAt = new Date().toISOString();
  let modifiedAt = publishedAt;
  let imageUrl = "";

  try {
    const response = await BulletinAPIService.getBulletinBySlug(
      params.bulletinSlug,
    );

    if (response.success && response.data) {
      bulletinTitle = response.data.master.bulletin_name || bulletinTitle;
      description = response.data.master.description
        ? truncate(response.data.master.description, 160)
        : `Visualiza el boletín ${bulletinTitle}`;
      publishedAt = response.data.master.log?.created_at || publishedAt;
      modifiedAt = response.data.master.log?.updated_at || modifiedAt;
      imageUrl = toAbsoluteUrl(response.data.master.thumbnail_images?.[0]);
    }
  } catch {
    description = `Visualiza el boletín ${bulletinTitle}`;
  }

  const articleSchema = generateArticleSchema({
    title: bulletinTitle,
    description,
    author: "CIAT",
    url: canonicalUrl,
    datePublished: publishedAt,
    dateModified: modifiedAt,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE_URL },
    { name: "Boletines", url: `${SITE_URL}/${params.locale}/bulletins` },
    { name: bulletinTitle, url: canonicalUrl },
  ]);

  return (
    <>
      <title>{`${bulletinTitle} | Bulletin Builder`}</title>
      <meta name="description" content={description} />
      <meta name="robots" content="index,follow" />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="article" />
      <meta property="og:site_name" content="Bulletin Builder" />
      <meta property="og:title" content={bulletinTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}
      {imageUrl ? (
        <meta property="og:image:alt" content={bulletinTitle} />
      ) : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={bulletinTitle} />
      <meta name="twitter:description" content={description} />
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: articleSchema }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbSchema }}
      />
    </>
  );
}
