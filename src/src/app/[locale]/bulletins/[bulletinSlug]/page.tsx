import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BulletinAPIService from "@/services/bulletinService";
import { normalizeAssetUrl } from "@/utils/assetUrl";
import { UnifiedBulletinPreview } from "@/app/[locale]/components/UnifiedBulletinPreview";
import type {
  CreateTemplateData,
  Field,
  Block,
  Section,
} from "@/types/template";

type BulletinPublicRouteProps = {
  params: {
    locale: string;
    bulletinSlug: string;
  };
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bulletin.aclimate.org";

const LOCALE_TEXT: Record<
  string,
  { home: string; bulletins: string; ogLocale: string; languageCode: string }
> = {
  es: {
    home: "Inicio",
    bulletins: "Boletines",
    ogLocale: "es_ES",
    languageCode: "es",
  },
  en: {
    home: "Home",
    bulletins: "Bulletins",
    ogLocale: "en_US",
    languageCode: "en",
  },
  vi: {
    home: "Trang chủ",
    bulletins: "Bản tin",
    ogLocale: "vi_VN",
    languageCode: "vi",
  },
};

type RepeatablePage = {
  header_config?: { fields?: Field[] };
  footer_config?: { fields?: Field[] };
  blocks?: Block[];
};

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

const decodeTextFieldValue = (value: unknown): unknown => {
  if (typeof value === "string" && value.trim() !== "") {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }
  return value;
};

const decodeObjectTextValues = (value: unknown): unknown => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const nextValue = { ...(value as Record<string, unknown>) };
  const textLikeKeys = ["text", "label", "title", "description", "value"];

  textLikeKeys.forEach((key) => {
    const currentValue = nextValue[key];
    if (typeof currentValue === "string") {
      nextValue[key] = decodeTextFieldValue(currentValue);
    }
  });

  return nextValue;
};

const decodeFields = (fields: Field[]) => {
  fields.forEach((field) => {
    if (field.type === "text") {
      field.value = decodeTextFieldValue(field.value) as Field["value"];
    } else if (field.type === "text_with_icon") {
      const decodedValue =
        typeof field.value === "string"
          ? decodeTextFieldValue(field.value)
          : decodeObjectTextValues(field.value);
      field.value = decodedValue as Field["value"];
    } else if (field.type === "list" && Array.isArray(field.value)) {
      field.value = field.value.map(
        (item: string | number | boolean | Date | Record<string, unknown>) => {
          if (typeof item === "string") {
            return decodeTextFieldValue(item);
          }
          return decodeObjectTextValues(item);
        },
      ) as Field["value"];
    }
  });
};

const decodeSectionFields = (section: Section) => {
  if (section.header_config?.fields) {
    decodeFields(section.header_config.fields);
  }

  if (section.footer_config?.fields) {
    decodeFields(section.footer_config.fields);
  }

  section.blocks?.forEach((block: Block) => {
    if (block.fields) {
      decodeFields(block.fields);
    }
  });

  const repeatablePages = (
    section as Section & {
      repeatable_pages?: RepeatablePage[];
    }
  ).repeatable_pages;

  repeatablePages?.forEach((page) => {
    if (page.header_config?.fields) {
      decodeFields(page.header_config.fields);
    }

    if (page.footer_config?.fields) {
      decodeFields(page.footer_config.fields);
    }

    page.blocks?.forEach((block: Block) => {
      if (block.fields) {
        decodeFields(block.fields);
      }
    });
  });
};

function buildCanonicalUrl(locale: string, bulletinSlug: string) {
  return `${SITE_URL}/${locale}/bulletins/${bulletinSlug}`;
}

function getSectionSummary(sections: Section[]): string[] {
  return sections
    .map((section) => section.display_name || "")
    .filter(Boolean)
    .slice(0, 12);
}

export async function generateMetadata({
  params,
}: BulletinPublicRouteProps): Promise<Metadata> {
  const localeText = LOCALE_TEXT[params.locale] || LOCALE_TEXT.es;
  const canonicalUrl = buildCanonicalUrl(params.locale, params.bulletinSlug);

  try {
    const response = await BulletinAPIService.getBulletinBySlug(
      params.bulletinSlug,
    );

    if (!response.success || !response.data) {
      return {
        title: "Bulletin builder",
        robots: { index: false, follow: false },
      };
    }

    const bulletinTitle =
      response.data.master.bulletin_name || params.bulletinSlug;
    const description = response.data.master.description
      ? truncate(response.data.master.description, 160)
      : `${localeText.home === "Home" ? "View" : localeText.home === "Trang chủ" ? "Xem" : "Visualiza"} ${bulletinTitle}`;
    const imageUrl = toAbsoluteUrl(response.data.master.thumbnail_images?.[0]);

    return {
      title: `${bulletinTitle} | Bulletin Builder`,
      description,
      alternates: {
        canonical: canonicalUrl,
        languages: {
          es: buildCanonicalUrl("es", params.bulletinSlug),
          en: buildCanonicalUrl("en", params.bulletinSlug),
          vi: buildCanonicalUrl("vi", params.bulletinSlug),
          "x-default": canonicalUrl,
        },
      },
      openGraph: {
        type: "article",
        locale: localeText.ogLocale,
        siteName: "Bulletin Builder",
        title: bulletinTitle,
        description,
        url: canonicalUrl,
        images: imageUrl ? [{ url: imageUrl, alt: bulletinTitle }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: bulletinTitle,
        description,
        images: imageUrl ? [imageUrl] : undefined,
      },
    };
  } catch {
    return {
      title: "Bulletin builder",
      robots: { index: false, follow: false },
    };
  }
}

export default async function BulletinPublicRoute({
  params,
}: BulletinPublicRouteProps) {
  const canonicalUrl = buildCanonicalUrl(params.locale, params.bulletinSlug);

  const response = await BulletinAPIService.getBulletinBySlug(
    params.bulletinSlug,
  );

  if (!response.success || !response.data) {
    notFound();
  }

  const {
    master: bulletinMaster,
    current_version: currentVersion,
    cards_metadata,
  } = response.data;

  if (!currentVersion.data || !currentVersion.data.sections) {
    notFound();
  }

  const templateDataFormatted: CreateTemplateData = {
    master: {
      template_name: bulletinMaster.bulletin_name || params.bulletinSlug,
      name_machine: bulletinMaster.name_machine || params.bulletinSlug,
      description: bulletinMaster.description || "",
      log: bulletinMaster.log || {
        created_at: new Date().toISOString(),
        creator_user_id: "",
        creator_first_name: null,
        creator_last_name: null,
      },
      status: "active",
      access_config: bulletinMaster.access_config || {
        access_type: "public",
        allowed_groups: [],
      },
      thumbnail_images: bulletinMaster.thumbnail_images || [],
    },
    version: {
      version_num: currentVersion.version_num || 1,
      log: currentVersion.log || {
        created_at: new Date().toISOString(),
        creator_user_id: "",
        creator_first_name: null,
        creator_last_name: null,
      },
      commit_message: currentVersion.commit_message || "",
      content: {
        style_config: currentVersion.data.style_config || {},
        header_config: currentVersion.data.header_config,
        sections: currentVersion.data.sections || [],
        footer_config: currentVersion.data.footer_config,
      },
    },
  };

  if (templateDataFormatted.version.content.header_config?.fields) {
    decodeFields(templateDataFormatted.version.content.header_config.fields);
  }
  if (templateDataFormatted.version.content.footer_config?.fields) {
    decodeFields(templateDataFormatted.version.content.footer_config.fields);
  }
  templateDataFormatted.version.content.sections?.forEach(
    (section: Section) => {
      decodeSectionFields(section);
    },
  );

  const sectionSummary = getSectionSummary(
    templateDataFormatted.version.content.sections,
  );

  return (
    <main className="bg-linear-to-b from-[#f8f9fa] to-white min-h-screen">
      <section className="mx-auto max-w-5xl px-4 py-8 md:py-12">
        <div className="rounded-3xl border border-[#283618]/10 bg-white/95 p-6 md:p-10 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-[#606c38]">
            Bulletin public
          </p>
          <h1 className="mt-3 text-3xl md:text-5xl font-bold text-[#283618]">
            {templateDataFormatted.master.template_name}
          </h1>
          {templateDataFormatted.master.description ? (
            <p className="mt-4 max-w-3xl text-base md:text-lg text-[#283618]/75">
              {templateDataFormatted.master.description}
            </p>
          ) : null}
          <div className="mt-6 flex flex-wrap gap-3 text-sm text-[#283618]/70">
            <span>Public bulletin</span>
            <span>•</span>
            <span>{sectionSummary.length} sections</span>
            <span>•</span>
            <a
              className="text-[#bc6c25] underline-offset-4 hover:underline"
              href={canonicalUrl}
            >
              Canonical URL
            </a>
          </div>
          {sectionSummary.length > 0 ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sectionSummary.map((sectionName) => (
                <div
                  key={sectionName}
                  className="rounded-2xl border border-[#283618]/10 bg-[#f8f9fa] px-4 py-3 text-sm font-medium text-[#283618]"
                >
                  {sectionName}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-2 pb-8 md:px-4 md:pb-12">
        <UnifiedBulletinPreview
          data={templateDataFormatted}
          variant="full-scroll"
          cardsMetadata={cards_metadata || {}}
          sectionOrder={templateDataFormatted.version.content.sections.map(
            (_, index) => index,
          )}
          allowSectionReorder={false}
          cardEmptyStateMode="select-card"
          scrollConfig={{
            orientation: "horizontal",
            expandAllPages: true,
            showSectionTitle: false,
          }}
        />
      </section>
    </main>
  );
}
