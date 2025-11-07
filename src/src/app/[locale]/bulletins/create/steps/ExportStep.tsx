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
      // Para PDF, generamos PNG de alta calidad y luego convertimos
      const imageFormat = config.format === "pdf" ? "png" : config.format;
      const finalFormat = config.format;

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

          // Pequeño delay para asegurar que la sección esté renderizada
          await new Promise((resolve) => setTimeout(resolve, 300));

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

          // Esperar a que todas las imágenes dentro del contenedor se carguen
          const images = templatePreviewContainer.querySelectorAll("img");
          if (images.length > 0) {
            await Promise.all(
              Array.from(images).map((img) => {
                if (img.complete) return Promise.resolve();
                return new Promise((resolve) => {
                  img.onload = () => resolve(true);
                  img.onerror = () => resolve(false);
                  // Timeout de 5 segundos por imagen
                  setTimeout(() => resolve(false), 5000);
                });
              })
            );
          }

          // Serializar el HTML con estilos
          const html = serializeElementToHTML(
            templatePreviewContainer as HTMLElement
          );

          // Obtener dimensiones del elemento
          const rect = templatePreviewContainer.getBoundingClientRect();
          const width = Math.round(rect.width);
          const height = Math.round(rect.height);

          // Calcular deviceScaleFactor según la calidad seleccionada
          let deviceScaleFactor = 1;
          switch (config.quality) {
            case "low":
              deviceScaleFactor = 1;
              break;
            case "medium":
              deviceScaleFactor = 1.5;
              break;
            case "high":
              deviceScaleFactor = 2;
              break;
            case "ultra":
              deviceScaleFactor = 3;
              break;
          }

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
              format: imageFormat,
              quality: qualityNumber,
              deviceScaleFactor, // Enviar el factor de escala
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
              ? `seccion_${sectionIndex + 1}_pagina_${
                  pageIndex + 1
                }.${imageFormat}`
              : sectionsToExport.length > 1
              ? `seccion_${sectionIndex + 1}.${imageFormat}`
              : `${bulletinName}.${imageFormat}`;

          zip.file(filename, blob);
        }
      }

      // Si el formato es PDF, convertir las imágenes a PDF
      if (finalFormat === "pdf") {
        onProgressUpdate(sectionsToExport.length, "Convirtiendo a PDF...");

        // Importar jsPDF dinámicamente
        const { jsPDF } = await import("jspdf");

        // Crear documento PDF
        const pdf = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: "a4",
        });

        let isFirstPage = true;

        // Obtener todos los archivos del ZIP
        const files = Object.keys(zip.files).sort();

        for (const filename of files) {
          const file = zip.files[filename];
          const blob = await file.async("blob");

          // Convertir blob a data URL
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });

          // Crear imagen para obtener dimensiones
          const img = await new Promise<HTMLImageElement>((resolve) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.src = dataUrl;
          });

          // Calcular dimensiones para ajustar a la página
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgRatio = img.width / img.height;
          const pageRatio = pdfWidth / pdfHeight;

          let finalWidth = pdfWidth;
          let finalHeight = pdfHeight;

          if (imgRatio > pageRatio) {
            // Imagen más ancha
            finalHeight = pdfWidth / imgRatio;
          } else {
            // Imagen más alta
            finalWidth = pdfHeight * imgRatio;
          }

          // Agregar nueva página si no es la primera
          if (!isFirstPage) {
            pdf.addPage();
          }
          isFirstPage = false;

          // Agregar imagen al PDF
          pdf.addImage(
            dataUrl,
            imageFormat.toUpperCase(),
            0,
            0,
            finalWidth,
            finalHeight
          );
        }

        // Descargar el PDF
        pdf.save(`${bulletinName}.pdf`);
      } else {
        // Generar el archivo ZIP para imágenes
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
      }

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
