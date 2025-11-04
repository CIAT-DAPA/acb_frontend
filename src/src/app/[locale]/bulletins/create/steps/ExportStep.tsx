"use client";

import React, { useRef } from "react";
import { useTranslations } from "next-intl";
import { CreateTemplateData } from "@/types/template";
import { ContentFullPreview } from "@/app/[locale]/components/ContentFullPreview";
import { Download } from "lucide-react";
import html2canvas from "html2canvas";
import { useToast } from "@/components/Toast";

interface ExportStepProps {
  previewData: CreateTemplateData;
  bulletinName: string;
}

export function ExportStep({ previewData, bulletinName }: ExportStepProps) {
  const t = useTranslations("CreateBulletin.export");
  const { showToast } = useToast();
  const previewRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExport = async () => {
    if (!previewRef.current) {
      showToast("No se pudo encontrar el contenido para exportar", "error");
      return;
    }

    setIsExporting(true);
    try {
      // Obtener todas las secciones del preview
      const sectionElements =
        previewRef.current.querySelectorAll(".scroll-section");

      if (sectionElements.length === 0) {
        showToast("No se encontraron secciones para exportar", "error");
        return;
      }

      // Exportar cada sección como imagen
      const exportPromises = Array.from(sectionElements).map(
        async (section, index) => {
          const canvas = await html2canvas(section as HTMLElement, {
            backgroundColor: "#ffffff",
            scale: 2, // Mayor calidad
            logging: false,
            useCORS: true,
          });

          // Convertir a blob y descargar
          return new Promise<void>((resolve) => {
            canvas.toBlob(
              (blob) => {
                if (blob) {
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement("a");
                  link.href = url;
                  link.download = `${bulletinName}-seccion-${index + 1}.jpg`;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  URL.revokeObjectURL(url);
                }
                resolve();
              },
              "image/jpeg",
              0.95
            );
          });
        }
      );

      await Promise.all(exportPromises);
      showToast(
        `${sectionElements.length} ${
          sectionElements.length === 1
            ? "sección exportada"
            : "secciones exportadas"
        } exitosamente`,
        "success"
      );
    } catch (error) {
      console.error("Error al exportar:", error);
      showToast("Error al exportar el boletín", "error");
    } finally {
      setIsExporting(false);
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
        <button
          onClick={handleExport}
          disabled={isExporting}
          className={`
            flex items-center gap-2 px-6 py-3 rounded-lg font-medium
            transition-all duration-200 shadow-sm
            ${
              isExporting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-[#283618] hover:bg-[#606c38] text-white hover:shadow-md"
            }
          `}
        >
          <Download
            className={`w-5 h-5 ${isExporting ? "animate-bounce" : ""}`}
          />
          {isExporting ? t("exporting") : t("exportButton")}
        </button>
      </div>

      {/* Preview completo en modo scroll horizontal con páginas expandidas */}
      <div
        ref={previewRef}
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
            expandAllPages: true, // Nueva prop para expandir todas las páginas
          }}
          allowModeToggle={false}
          className="w-full"
        />
      </div>
    </div>
  );
}
