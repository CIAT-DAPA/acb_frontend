"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreateTemplateData, Field, Block, Section } from "@/types/template";
import { Card } from "@/types/card";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import {
  ExportModal,
  ExportTechnicalConfig,
} from "@/app/[locale]/components/ExportModal";
import BulletinAPIService from "@/services/bulletinService";
import { TemplateAPIService } from "@/services/templateService";
import { useTranslations } from "next-intl";
import { ScrollView } from "@/app/[locale]/components/ScrollView";

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

// Función para decodificar todos los campos de texto en una estructura
const decodeFields = (fields: Field[]) => {
  fields.forEach((field) => {
    if (field.type === "text" || field.type === "text_with_icon") {
      field.value = decodeTextFieldValue(field.value);
    } else if (field.type === "list" && Array.isArray(field.value)) {
      field.value = field.value.map((item: any) => {
        if (typeof item === "string") {
          return decodeTextFieldValue(item);
        }
        return item;
      });
    }
  });
};

/**
 * Página de preview independiente para boletines con URLs amigables
 * Permite visualizar cualquier boletín publicado mediante su name_machine y el de su template
 *
 * Ruta: /[locale]/[templateSlug]/[bulletinSlug]
 * Ejemplo: /es/boletin-agroclimatico-cafe/boletin-enero-2025
 */
export default function BulletinPublicPage() {
  const params = useParams();
  const router = useRouter();
  const templateSlug = params.templateSlug as string;
  const bulletinSlug = params.bulletinSlug as string;
  const locale = params.locale as string;
  const t = useTranslations("CreateBulletin.bulletinPreview");

  const [templateData, setTemplateData] = useState<CreateTemplateData | null>(
    null
  );
  const [cardsMetadata, setCardsMetadata] = useState<Record<string, Card>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados para el sistema de exportación
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Estado para controlar la orientación según el tamaño de pantalla
  const [isDesktop, setIsDesktop] = useState(false);

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint de Tailwind
    };

    // Verificar inicialmente
    checkScreenSize();

    // Escuchar cambios de tamaño
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  useEffect(() => {
    const loadBulletin = async () => {
      if (!templateSlug || !bulletinSlug) {
        setError(t("errorNoId"));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Buscar el boletín por su slug
        const response = await BulletinAPIService.getBulletinBySlug(
          bulletinSlug
        );

        if (!response.success || !response.data) {
          throw new Error(t("errorNotFound"));
        }

        const {
          master: bulletinMaster,
          current_version: currentVersion,
          cards_metadata,
        } = response.data;

        // Validar que la versión tenga contenido
        if (!currentVersion.data || !currentVersion.data.sections) {
          throw new Error(t("errorNoSections"));
        }

        // Convertir la respuesta del API al formato CreateTemplateData
        const templateDataFormatted: CreateTemplateData = {
          master: {
            template_name:
              bulletinMaster.bulletin_name || t("untitledBulletin"),
            name_machine: bulletinMaster.name_machine || bulletinSlug,
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
            thumbnail_images: (bulletinMaster as any).thumbnail_images || [],
          },
          version: {
            version_num: currentVersion.version_num || 1,
            log: currentVersion.log || {
              created_at: new Date().toISOString(),
              creator_user_id: "",
              creator_first_name: null,
              creator_last_name: null,
            },
            commit_message:
              currentVersion.commit_message || t("initialVersion"),
            content: {
              style_config: currentVersion.data.style_config || {},
              header_config: currentVersion.data.header_config,
              sections: currentVersion.data.sections || [],
              footer_config: currentVersion.data.footer_config,
            },
          },
        };

        // Decodificar campos de texto
        if (templateDataFormatted.version.content.header_config?.fields) {
          decodeFields(
            templateDataFormatted.version.content.header_config.fields
          );
        }
        if (templateDataFormatted.version.content.footer_config?.fields) {
          decodeFields(
            templateDataFormatted.version.content.footer_config.fields
          );
        }
        templateDataFormatted.version.content.sections?.forEach(
          (section: Section) => {
            section.blocks?.forEach((block: Block) => {
              if (block.fields) {
                decodeFields(block.fields);
              }
            });
          }
        );

        setTemplateData(templateDataFormatted);
        setCardsMetadata(cards_metadata || {});
      } catch (err) {
        console.error("Error cargando boletín:", err);
        setError(err instanceof Error ? err.message : t("errorLoading"));
      } finally {
        setLoading(false);
      }
    };

    loadBulletin();
  }, [templateSlug, bulletinSlug]);

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
    containerSelector: "#bulletin-export-preview .flex.gap-8",
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
    <div className="min-h-screen bg-linear-to-b from-[#f8f9fa] to-white">
      {/* Header con botón de regreso y exportación */}
      <div className="bg-white border-b border-[#283618]/10 sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
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
              className="flex items-center gap-2 px-4 py-2 bg-[#ffaf68] text-white rounded-lg hover:bg-[#ff9d4d] transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline">{t("exportButton")}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <ScrollView
            data={templateData}
            cardsMetadata={cardsMetadata}
            config={{
              orientation: isDesktop ? "horizontal" : "vertical",
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
        exportConfig={exportConfig}
        templateData={templateData}
        autoExport={true}
      />
    </div>
  );
}
