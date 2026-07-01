"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CreateTemplateData, Field, Block, Section } from "@/types/template";
import { Card } from "@/types/card";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import {
  ExportModal,
  ExportTechnicalConfig,
} from "@/app/[locale]/components/ExportModal";
import { useTranslations } from "next-intl";
import { UnifiedBulletinPreview } from "@/app/[locale]/components/UnifiedBulletinPreview";
import { btnPrimary } from "../../components/ui";

// Función para decodificar valores de campos de texto
const decodeTextFieldValue = (value: any): any => {
  if (typeof value === "string" && value.trim() !== "") {
    try {
      return decodeURIComponent(value);
    } catch (e) {
      return value;
    }
  }
  return value;
};

const decodeObjectTextValues = (value: any): any => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const nextValue = { ...value } as Record<string, any>;
  const textLikeKeys = ["text", "label", "title", "description", "value"];

  textLikeKeys.forEach((key) => {
    if (typeof nextValue[key] === "string") {
      nextValue[key] = decodeTextFieldValue(nextValue[key]);
    }
  });

  return nextValue;
};

// Función para decodificar todos los campos de texto en una estructura
const decodeFields = (fields: Field[]) => {
  fields.forEach((field) => {
    if (field.type === "text") {
      field.value = decodeTextFieldValue(field.value);
    } else if (field.type === "text_with_icon") {
      field.value =
        typeof field.value === "string"
          ? decodeTextFieldValue(field.value)
          : decodeObjectTextValues(field.value);
    } else if (field.type === "list" && Array.isArray(field.value)) {
      field.value = field.value.map((item: any) => {
        if (typeof item === "string") {
          return decodeTextFieldValue(item);
        }
        return decodeObjectTextValues(item);
      });
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

  (section as any).repeatable_pages?.forEach((page: any) => {
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

type BulletinPublicClientProps = {
  initialTemplateData: CreateTemplateData;
  initialCardsMetadata: Record<string, Card>;
  locale: string;
  templateSlug: string;
  bulletinSlug: string;
};

/**
 * Página de preview independiente para boletines con URLs amigables
 * Permite visualizar cualquier boletín publicado mediante su name_machine y el de su template
 *
 * Ruta: /[locale]/[templateSlug]/[bulletinSlug]
 * Ejemplo: /es/boletin-agroclimatico-cafe/boletin-enero-2025
 */
export default function BulletinPublicClient({
  initialTemplateData,
  initialCardsMetadata,
  locale,
  templateSlug,
  bulletinSlug,
}: BulletinPublicClientProps) {
  const router = useRouter();
  const t = useTranslations("CreateBulletin.bulletinPreview");

  const [templateData] = useState<CreateTemplateData | null>(
    initialTemplateData,
  );
  const [cardsMetadata] = useState<Record<string, Card>>(initialCardsMetadata);

  const [sectionOrder, setSectionOrder] = useState<number[]>(() =>
    initialTemplateData.version.content.sections.map((_, index) => index),
  );

  const [loading] = useState(false);
  const [error] = useState<string | null>(null);

  // Estados para el sistema de exportación
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Función helper para calcular el número total de páginas de una sección
  const getSectionTotalPages = (section: any): number => {
    // Buscar si hay algún field de tipo list o card que requiera paginación
    for (const block of section.blocks) {
      for (const field of block.fields) {
        // Detectar paginación para listas
        if (field.type === "list" && field.field_config) {
          const maxItemsPerPage = field.field_config.max_items_per_page;
          const items = Array.isArray(field.value) ? field.value : [];

          if (maxItemsPerPage && items.length > maxItemsPerPage) {
            return Math.ceil(items.length / maxItemsPerPage);
          }
        }

        // Detectar paginación para cards (cada card es una página)
        if (field.type === "card" && Array.isArray(field.value)) {
          const cards = field.value;
          if (cards.length > 1) {
            return cards.length; // Una card por página
          }
        }
      }
    }

    return 1; // Por defecto, 1 página si no hay paginación
  };

  // Handler para exportación
  const exportConfig: ExportTechnicalConfig = {
    containerSelector: "#export-preview-download .flex.gap-4",
    itemSelectorTemplate: (sectionIndex: number, pageIndex: number) =>
      `[data-section-index="${sectionIndex}"][data-page-index="${pageIndex}"]`,
    getExportElement: (previewElement: Element) =>
      previewElement.querySelector("#template-preview-container > div"),
    getSectionPages: getSectionTotalPages,
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#ffaf68] mx-auto mb-4" />
          <p className="text-[#283618] text-lg font-medium">{t("loading")}</p>
          <p className="text-[#283618]/60 text-sm mt-2">
            {t("loadingWithSlug", { slug: bulletinSlug })}
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !templateData) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-[#283618] mb-2">
            {t("errorTitle")}
          </h2>
          <p className="text-[#283618]/70 mb-6">{error || t("errorMessage")}</p>
          <p className="text-sm text-[#283618]/50 mb-6">
            {t("errorSlug", { templateSlug, bulletinSlug })}
          </p>
          <button
            onClick={() => router.push(`/${locale}/bulletins`)}
            className="px-6 py-3 bg-[#ffaf68] text-white rounded-lg hover:bg-[#ff9d4d] transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-5 h-5" />
            {t("backToBulletins")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-linear-to-b from-[#f8f9fa] to-white md:h-dvh md:overflow-hidden md:flex md:flex-col">
      {/* Header con botón de regreso y exportación */}
      <div className="hidden md:block bg-white border-b border-[#283618]/10 sticky top-0 z-40 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 md:h-16">
            <button
              onClick={() => router.push(`/${locale}/bulletins`)}
              className="flex items-center gap-2 text-[#283618] hover:text-[#606c38] transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">{t("backToBulletins")}</span>
            </button>

            <h1 className="text-lg sm:text-xl font-bold text-[#283618] truncate px-4">
              {templateData.master.template_name}
            </h1>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className={btnPrimary}
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">{t("exportButton")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="py-0 px-2 md:flex-1 md:min-h-0 md:py-8 md:px-4">
        <div className="max-w-7xl mx-auto h-auto md:h-full">
          <UnifiedBulletinPreview
            data={templateData}
            variant="full-scroll"
            cardsMetadata={cardsMetadata}
            sectionOrder={sectionOrder}
            allowSectionReorder={true}
            onSectionOrderChange={setSectionOrder}
            cardEmptyStateMode="select-card"
            scrollConfig={{
              orientation: "horizontal",
              expandAllPages: true,
              showSectionTitle: false,
            }}
          />
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        sections={templateData.version.content.sections}
        contentName={templateData.master.template_name}
        sectionOrder={sectionOrder}
        hideSectionOrderControls={true}
        exportConfig={exportConfig}
        templateData={templateData}
        autoExport={true}
      />
    </div>
  );
}
