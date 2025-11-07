"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateTemplateData } from "@/types/template";
import {
  ExportModal,
  ExportConfig,
} from "@/app/[locale]/components/ExportModal";
import { ContentFullPreview } from "@/app/[locale]/components/ContentFullPreview";
import { Download } from "lucide-react";
import * as ui from "@/app/[locale]/components/ui";

interface ExportStepProps {
  previewData: CreateTemplateData;
  bulletinName: string;
}

export function ExportStep({ previewData, bulletinName }: ExportStepProps) {
  const t = useTranslations("CreateBulletin.export");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

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

  const handleExport = async (
    config: ExportConfig,
    onSectionChange: (index: number) => void,
    onProgressUpdate: (current: number, message: string) => void
  ) => {
    const { serializeElementToHTML } = await import("@/utils/exportPuppeteer");
    const JSZip = (await import("jszip")).default;

    const totalSections = previewData.version.content.sections.length;
    const sectionsToExport =
      config.selectedSections.length > 0
        ? config.selectedSections
        : Array.from({ length: totalSections }, (_, i) => i);

    try {
      const zip = new JSZip();
      const format = config.format === "pdf" ? "png" : config.format;

      // Asegurar que quality sea un número entero válido
      const qualityNumber =
        typeof config.quality === "string"
          ? parseInt(config.quality, 10)
          : config.quality;

      let imageCounter = 0; // Contador global de imágenes exportadas

      // Cambiar al contenedor de preview primero
      onSectionChange(0);

      // Esperar a que el contenedor scroll se monte con todas las secciones expandidas
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Obtener el contenedor principal del scroll
      const scrollContainer = document.querySelector(
        "#bulletin-export-preview .flex.gap-8"
      );

      if (!scrollContainer) {
        throw new Error("No se encontró el contenedor de secciones");
      }

      // Exportar cada sección (y sus páginas si tiene múltiples)
      for (let i = 0; i < sectionsToExport.length; i++) {
        const sectionIndex = sectionsToExport[i];
        const section = previewData.version.content.sections[sectionIndex];

        // Detectar cuántas páginas tiene esta sección
        const totalPages = getSectionTotalPages(section);

        // Exportar cada página de la sección
        for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
          imageCounter++;

          onProgressUpdate(
            imageCounter,
            `Generando sección ${sectionIndex + 1}, página ${
              pageIndex + 1
            }/${totalPages}...`
          );

          // Buscar el elemento de preview específico usando data attributes
          const previewElement = scrollContainer.querySelector(
            `[data-section-index="${sectionIndex}"][data-page-index="${pageIndex}"]`
          );

          if (!previewElement) {
            console.warn(
              `⚠️ No se encontró preview para sección ${
                sectionIndex + 1
              }, página ${pageIndex + 1}`
            );
            continue;
          }

          // Buscar el contenedor del TemplatePreview (el div interno con el boletín)
          const templatePreviewContainer = previewElement.querySelector(
            "#template-preview-container > div"
          );

          if (!templatePreviewContainer) {
            console.warn(
              `⚠️ No se encontró TemplatePreview container en sección ${
                sectionIndex + 1
              }, página ${pageIndex + 1}`
            );
            continue;
          }

          // Serializar el HTML con estilos
          const html = serializeElementToHTML(
            templatePreviewContainer as HTMLElement
          );

          // Obtener dimensiones del elemento
          const rect = templatePreviewContainer.getBoundingClientRect();
          const width = Math.round(rect.width);
          const height = Math.round(rect.height);

          // Llamar a la API para generar la imagen
          const response = await fetch("/api/export-bulletin", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              html,
              width,
              height,
              format: format,
              quality: qualityNumber,
              baseUrl: window.location.origin, // Agregar URL base para resolver imágenes
            }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.details || "Error al generar imagen");
          }

          // Obtener el blob de la imagen
          const blob = await response.blob();

          // Agregar al ZIP con nombre descriptivo
          const filename =
            totalPages > 1
              ? `seccion_${sectionIndex + 1}_pagina_${pageIndex + 1}.${format}`
              : sectionsToExport.length > 1
              ? `seccion_${sectionIndex + 1}.${format}`
              : `${bulletinName}.${format}`;

          zip.file(filename, blob);
        }
      }

      // Generar el archivo ZIP
      onProgressUpdate(sectionsToExport.length, "Generando archivo ZIP...");

      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Descargar el ZIP
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${bulletinName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      onProgressUpdate(sectionsToExport.length, "¡Exportación completada!");
    } catch (error) {
      console.error("❌ Error al exportar:", error);
      throw error;
    }
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

      {/* Botón de exportación */}
      <div className="flex justify-center mb-4">
        <button onClick={() => setIsModalOpen(true)} className={ui.btnPrimary}>
          <Download className="w-5 h-5" />
          {t("exportButton")}
        </button>
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

      {/* Modal de exportación */}
      <ExportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExport={handleExport}
        totalSections={previewData.version.content.sections.length}
        contentName={bulletinName}
        templateData={previewData}
      />
    </div>
  );
}
