"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateTemplateData } from "@/types/template";
import {
  ExportModal,
  ExportTechnicalConfig,
} from "@/app/[locale]/components/ExportModal";
import { ContentFullPreview } from "@/app/[locale]/components/ContentFullPreview";

interface ExportStepProps {
  previewData: CreateTemplateData;
  bulletinName: string;
  onExport: () => void;
}

export function ExportStep({
  previewData,
  bulletinName,
  onExport,
}: ExportStepProps) {
  const t = useTranslations("CreateBulletin.export");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  // Exponer la función handleExport para que pueda ser llamada desde el padre
  React.useEffect(() => {
    // Guardar la función de exportación en una referencia global
    (window as any).__bulletinExportHandler = () => setIsModalOpen(true);
  }, []);

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

  // Configuración técnica para el export modal en modo auto
  const exportConfig: ExportTechnicalConfig = {
    containerSelector: "#bulletin-export-preview .flex.gap-8",
    itemSelectorTemplate: (sectionIndex: number, pageIndex: number) =>
      `[data-section-index="${sectionIndex}"][data-page-index="${pageIndex}"]`,
    getExportElement: (previewElement: Element) =>
      previewElement.querySelector("#template-preview-container > div"),
    getSectionPages: getSectionTotalPages,
  };

  return (
    <div className="space-y-6">
      {/* Header con título y descripción */}
      <div className="bg-white rounded-lg p-6 shadow-sm border border-[#283618]/10">
        <h2 className="text-xl font-semibold text-[#283618] mb-2">
          {t("title")}
        </h2>
        <p className="text-[#606c38] text-sm">{t("description")}</p>
      </div>

      {/* Preview completo en modo scroll horizontal con páginas expandidas */}
      <div
        id="bulletin-export-preview"
        className="bg-white rounded-lg shadow-sm border border-[#283618]/10 overflow-hidden"
      >
        <ContentFullPreview
          data={previewData}
          mode="scroll"
          scrollConfig={{
            orientation: "horizontal",
            showMiniNav: true,
            highlightActive: true,
            spacing: "comfortable",
            expandAllPages: true,
          }}
          allowModeToggle={false}
          className="w-full"
        />
      </div>

      {/* Modal de exportación en modo auto-export */}
      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        autoExport={true}
        exportConfig={exportConfig}
        sections={previewData.version.content.sections}
        totalSections={previewData.version.content.sections.length}
        contentName={bulletinName}
        templateData={previewData}
      />
    </div>
  );
}
