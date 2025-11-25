"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { CreateTemplateData } from "@/types/template";
import { PreviewMode } from "@/types/templatePreview";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import { ExportModal, ExportConfig } from "@/app/[locale]/components/ExportModal";
import BulletinAPIService from "@/services/bulletinService";
import { useTranslations } from "next-intl";
import { ScrollView } from "@/app/[locale]/components/ScrollView";

/**
 * Página de preview independiente para boletines
 * Permite visualizar cualquier boletin por su ID publicado
 * 
 * Ruta: /[locale]/bulletins/preview/[id]
 * Ejemplo: /es/bulletins/preview/68d2d1417194ce27a63033b2
 */
export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const bulletinId = params.id as string;
  const locale = params.locale as string;
  const t = useTranslations("CreateBulletin.export");

  const [templateData, setTemplateData] = useState<CreateTemplateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<PreviewMode>("carousel");
  const [scrollOrientation, setScrollOrientation] = useState<"vertical" | "horizontal">("vertical");
  const [gridColumns, setGridColumns] = useState<1 | 2 | 3 | 4 | 5 | 6>(3);
  const [gridThumbnailSize, setGridThumbnailSize] = useState<"small" | "medium" | "large">("medium");

  // Estados para el sistema de exportación
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const previewContainerId = "export-preview-download"; // ID del contenedor en ExportModal que contiene TemplatePreview

  useEffect(() => {
    const loadTemplate = async () => {
      if (!bulletinId) {
        setError("No se proporcionó un ID de boletin");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Obtener el template master y su versión actual en una sola llamada
        const response = await BulletinAPIService.getCurrentVersion(bulletinId);
        
        if (!response.success || !response.data) {
          throw new Error("Boletin no encontrado");
        }

        const { master: bulletinMaster, current_version: currentVersion } = response.data;

        // Validar que la versión tenga contenido
        if (!currentVersion.data || !currentVersion.data.sections) {
          throw new Error("El boletin no tiene secciones definidas");
        }
        
        // Convertir la respuesta del API al formato CreateTemplateData
        const templateDataFormatted: CreateTemplateData = {
          master: {
            template_name: bulletinMaster.bulletin_name || "Boletin sin nombre",
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
            commit_message: currentVersion.commit_message || "Versión inicial",
            content: {
              style_config: currentVersion.data.style_config || {},
              header_config: currentVersion.data.header_config,
              sections: currentVersion.data.sections || [],
              footer_config: currentVersion.data.footer_config,
            },
          },
        };

        setTemplateData(templateDataFormatted);
      } catch (err) {
        console.error("Error cargando boletin:", err);
        setError(
          err instanceof Error ? err.message : "Error al cargar el boletin"
        );
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [bulletinId]);

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
  const handleExport = async (
      config: ExportConfig,
      onSectionChange: (index: number) => void,
      onProgressUpdate: (current: number, message: string) => void
    ) => {
      const { serializeElementToHTML } = await import("@/utils/exportPuppeteer");
      const JSZip = (await import("jszip")).default;
  
      const totalSections = templateData?.version.content.sections.length;
      const sectionsToExport =
        config.selectedSections.length > 0
          ? config.selectedSections
          : Array.from({ length: totalSections || 0 }, (_, i) => i);
  
      try {
        const bulletinName = templateData?.master.template_name
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
          const section = templateData?.version.content.sections[sectionIndex];
  
          // Detectar cuántas páginas tiene esta sección
          const totalPages = getSectionTotalPages(section);
  
          // Exportar cada página de la sección
          for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
            imageCounter++;
  
            onProgressUpdate(
              imageCounter,
              `${t("sectionGenerating", { current: sectionIndex + 1 })}, ${t(
                "sectionPage"
              )} ${pageIndex + 1}/${totalPages}...`
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
          onProgressUpdate(sectionsToExport.length, t("toPdf"));
  
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
          onProgressUpdate(sectionsToExport.length, t("toZip"));
  
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
  
        onProgressUpdate(sectionsToExport.length, t("exportComplete"));
      } catch (error) {
        console.error("❌ Error al exportar:", error);
        throw error;
      }
    };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#ffaf68] mx-auto mb-4" />
          <p className="text-[#283618] text-lg font-medium">
            Cargando boletin...
          </p>
          <p className="text-[#283618]/60 text-sm mt-2">ID: {bulletinId}</p>
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
            Error al cargar boletin
          </h2>
          <p className="text-[#283618]/70 mb-6">
            {error || "No se pudo cargar el boletin con el ID proporcionado."}
          </p>
          <p className="text-sm text-[#283618]/50 mb-6">ID: {bulletinId}</p>
          <button
            onClick={() => router.push(`/${locale}/bulletins`)}
            className="px-6 py-3 bg-[#ffaf68] text-white rounded-lg hover:bg-[#ff9d4d] transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Boletines
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen'>
      {/* Header */}
      <div className='bg-white border-b border-[#283618]/10 shadow-sm top-0 z-10'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            {/* Título y navegación */}
            <div className='flex items-center gap-4'>
              <button
                onClick={() => router.push(`/${locale}/bulletins`)}
                className='p-2 hover:bg-[#f5f5dc] rounded-lg transition-colors'
                title='Volver a Boletines'
              >
                <ArrowLeft className='w-5 h-5 text-[#283618]' />
              </button>
              <div>
                <h1 className='text-2xl font-bold text-[#283618]'>
                  {templateData.master.template_name}
                </h1>
                <p className='text-sm text-[#283618]/60'>
                  Preview del Boletin •{' '}
                  {templateData.version.content.sections.length}{' '}
                  {templateData.version.content.sections.length === 1
                    ? 'sección'
                    : 'secciones'}
                </p>
              </div>
            </div>

            {/* Info del template */}
            <div className='hidden md:flex items-center gap-4'>
              {/* Botón de exportación */}
              <button
                onClick={() => setIsExportModalOpen(true)}
                className='flex items-center gap-2 px-4 py-2 bg-[#ffaf68] text-white rounded-lg hover:bg-[#ff9d4d] transition-colors shadow-md hover:shadow-lg'
                title='Exportar template'
              >
                <Download className='w-4 h-4' />
                <span className='font-medium'>Exportar</span>
              </button>

              <div className='text-right'>
                <p className='text-xs text-[#283618]/50'>ID del boletin</p>
                <p className='text-sm font-mono text-[#283618]/70'>
                  {bulletinId}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className='container mx-auto px-0 py-4 md:py-0 md:px-4 '>
        <div className='bg-white md:rounded-xl md:shadow-lg pb-6 md:p-6'>
          {/* Info y controles - Oculto en móvil para dar más espacio */}
          <div className='md:block pb-6 border-b border-[#283618]/10'>
            <div className='bg-white rounded-lg shadow p-4'>
              <h3 className='text-sm font-semibold text-[#283618] mb-2'>
                Descripción
              </h3>
              <p className='text-[#283618]/70 text-sm'>
                {templateData.master.description || 'Sin descripción'}
              </p>
            </div>
          </div>

          {/* Componente de Preview - Sin padding en móvil */}
          <div className='w-full' id="bulletin-export-preview">
            <ScrollView
              data={templateData}
              config={{
                orientation: "vertical",
                showMiniNav: true,
                highlightActive: true,
                spacing: 'comfortable',
                expandAllPages: true,
              }}
            />
          </div>
        </div>
      </div>

      {/* Modal de exportación */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        totalSections={templateData.version.content.sections.length}
        contentName={templateData.master.template_name}
        templateData={templateData}
      />

      {/* Botón flotante de exportación (móvil) */}
      <button
        onClick={() => setIsExportModalOpen(true)}
        className='md:hidden fixed bottom-6 right-6 w-14 h-14 bg-[#ffaf68] text-white rounded-full shadow-lg hover:bg-[#ff9d4d] transition-all hover:scale-110 flex items-center justify-center z-40'
        title='Exportar'
      >
        <Download className='w-6 h-6' />
      </button>
    </div>
  );
}
