"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CreateTemplateData } from "@/types/template";
import {
  ExportModal,
  ExportTechnicalConfig,
} from "@/app/[locale]/components/ExportModal";
import { UnifiedBulletinPreview } from "@/app/[locale]/components/UnifiedBulletinPreview";
import { filterTemplateDataForOutput } from "@/utils/sectionVisibility";

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

  const outputData = useMemo(
    () => filterTemplateDataForOutput(previewData),
    [previewData],
  );

  React.useEffect(() => {
    (window as any).__bulletinExportHandler = () => setIsModalOpen(true);

    return () => {
      delete (window as any).__bulletinExportHandler;
    };
  }, []);

  const getSectionTotalPages = (section: any): number => {
    let maxPages = 1;

    section.blocks?.forEach((block: any) => {
      if (block?.print === false) {
        return;
      }

      block.fields?.forEach((field: any) => {
        if (field?.bulletin === false || field?.print === false) {
          return;
        }

        if (field.type === "list") {
          const rawMax = field.field_config?.max_items_per_page;
          const maxItemsPerPage = rawMax ? Number(rawMax) : 0;
          const items = Array.isArray(field.value) ? field.value : [];

          if (items.length > 0 && maxItemsPerPage > 0) {
            maxPages = Math.max(
              maxPages,
              Math.ceil(items.length / maxItemsPerPage),
            );
          }
        }

        if (field.type === "card" && Array.isArray(field.value)) {
          if (field.value.length > 1) {
            maxPages = Math.max(maxPages, field.value.length);
          }
        }
      });
    });

    return maxPages;
  };

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
      <div className="bg-white rounded-lg p-6 shadow-sm border border-[#283618]/10">
        <h2 className="text-xl font-semibold text-[#283618] mb-2">
          {t("title")}
        </h2>
        <p className="text-[#606c38] text-sm">{t("description")}</p>
      </div>

      {outputData.version.content.sections.length === 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {t("noRenderableSections")}
        </div>
      )}

      <div
        id="bulletin-export-preview"
        className="bg-white rounded-lg shadow-sm border border-[#283618]/10 overflow-hidden"
      >
        <UnifiedBulletinPreview
          data={outputData}
          variant="full-scroll"
          cardEmptyStateMode="select-card"
          scrollConfig={{
            orientation: "horizontal",
            showMiniNav: true,
            highlightActive: true,
            spacing: "comfortable",
            expandAllPages: true,
          }}
          className="w-full"
        />
      </div>

      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        autoExport={true}
        exportConfig={exportConfig}
        sections={outputData.version.content.sections}
        totalSections={outputData.version.content.sections.length}
        contentName={bulletinName}
        templateData={outputData}
      />
    </div>
  );
}
