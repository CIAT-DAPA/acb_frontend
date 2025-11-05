"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { TemplateAPIService } from "@/services/templateService";
import { CreateTemplateData } from "@/types/template";
import { ContentFullPreview } from "@/app/[locale]/components/ContentFullPreview";
import { PreviewMode } from "@/types/templatePreview";
import { ArrowLeft, Loader2, Download } from "lucide-react";
import { ExportModal, ExportConfig } from "@/app/[locale]/components/ExportModal";

/**
 * Página de preview independiente para templates
 * Permite visualizar cualquier template por su ID con todos los modos de preview disponibles
 * 
 * Ruta: /[locale]/templates/preview/[id]
 * Ejemplo: /es/templates/preview/68d2d1417194ce27a63033b2
 */
export default function TemplatePreviewPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = params.id as string;
  const locale = params.locale as string;

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
      if (!templateId) {
        setError("No se proporcionó un ID de template");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Obtener el template master y su versión actual en una sola llamada
        const response = await TemplateAPIService.getCurrentVersion(templateId);
        
        if (!response.success || !response.data) {
          throw new Error("Template no encontrado");
        }

        const { master: templateMaster, current_version: currentVersion } = response.data;

        // Validar que la versión tenga contenido
        if (!currentVersion.content || !currentVersion.content.sections) {
          throw new Error("El template no tiene secciones definidas");
        }
        
        // Convertir la respuesta del API al formato CreateTemplateData
        const templateDataFormatted: CreateTemplateData = {
          master: {
            template_name: templateMaster.template_name || "Template sin nombre",
            description: templateMaster.description || "",
            log: templateMaster.log || {
              created_at: new Date().toISOString(),
              creator_user_id: "",
              creator_first_name: null,
              creator_last_name: null,
            },
            status: templateMaster.status || "draft",
            access_config: templateMaster.access_config || {
              access_type: "public",
              allowed_groups: [],
            },
            thumbnail_images: (templateMaster as any).thumbnail_images || [],
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
              style_config: currentVersion.content.style_config || {},
              header_config: currentVersion.content.header_config,
              sections: currentVersion.content.sections || [],
              footer_config: currentVersion.content.footer_config,
            },
          },
        };

        setTemplateData(templateDataFormatted);
      } catch (err) {
        console.error("Error cargando template:", err);
        setError(
          err instanceof Error ? err.message : "Error al cargar el template"
        );
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId]);

  // Handler para exportación
  const handleExport = async (
    config: ExportConfig, 
    onSectionChange: (index: number) => void,
    onProgressUpdate: (current: number, message: string) => void
  ) => {
    // La exportación ahora se maneja internamente en ExportModal con Puppeteer
    // No se necesita lógica adicional aquí
    console.log("🚀 Exportación iniciada desde ExportModal");
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f5dc] to-[#fff8e7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#ffaf68] mx-auto mb-4" />
          <p className="text-[#283618] text-lg font-medium">
            Cargando template...
          </p>
          <p className="text-[#283618]/60 text-sm mt-2">ID: {templateId}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !templateData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f5f5dc] to-[#fff8e7] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-2xl font-bold text-[#283618] mb-2">
            Error al cargar template
          </h2>
          <p className="text-[#283618]/70 mb-6">
            {error || "No se pudo cargar el template"}
          </p>
          <p className="text-sm text-[#283618]/50 mb-6">ID: {templateId}</p>
          <button
            onClick={() => router.push(`/${locale}/templates`)}
            className="px-6 py-3 bg-[#ffaf68] text-white rounded-lg hover:bg-[#ff9d4d] transition-colors flex items-center gap-2 mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-[#f5f5dc] to-[#fff8e7]'>
      {/* Header */}
      <div className='bg-white border-b border-[#283618]/10 shadow-sm top-0 z-10'>
        <div className='container mx-auto px-4 py-4'>
          <div className='flex items-center justify-between'>
            {/* Título y navegación */}
            <div className='flex items-center gap-4'>
              <button
                onClick={() => router.push(`/${locale}/templates`)}
                className='p-2 hover:bg-[#f5f5dc] rounded-lg transition-colors'
                title='Volver a Templates'
              >
                <ArrowLeft className='w-5 h-5 text-[#283618]' />
              </button>
              <div>
                <h1 className='text-2xl font-bold text-[#283618]'>
                  {templateData.master.template_name}
                </h1>
                <p className='text-sm text-[#283618]/60'>
                  Preview del Template •{' '}
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
                <p className='text-xs text-[#283618]/50'>ID del Template</p>
                <p className='text-sm font-mono text-[#283618]/70'>
                  {templateId}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-xs text-[#283618]/50'>Estado</p>
                <p className='text-sm font-medium text-[#283618] capitalize'>
                  {templateData.master.status}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className='container mx-auto px-0 md:px-4 py-4 md:py-8'>
        <div className='bg-white md:rounded-xl md:shadow-lg pt-6 pb-6 md:p-6'>
          {/* Info y controles - Oculto en móvil para dar más espacio */}
          <div className='hidden md:block mb-6 pb-6 border-b border-[#283618]/10'>
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
              <div>
                <h2 className='text-lg font-semibold text-[#283618] mb-1'>
                  Vista de Preview
                </h2>
                <p className='text-sm text-[#283618]/60'>
                  Cambia entre los diferentes modos de visualización usando el
                  toggle
                </p>
              </div>

              {/* Botones de orientación para pruebas (solo modo scroll) */}
              
                <div className='flex gap-2 items-center'>
                  <span className='text-xs text-[#283618]/60 font-medium'>
                    Orientación:
                  </span>
                  <button
                    onClick={() => setScrollOrientation('vertical')}
                    className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${
                          scrollOrientation === 'vertical'
                            ? 'bg-[#606c38] text-white'
                            : 'bg-white text-[#283618] border border-gray-200 hover:bg-gray-50'
                        }
                      `}
                  >
                    Vertical
                  </button>
                  <button
                    onClick={() => setScrollOrientation('horizontal')}
                    className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${
                          scrollOrientation === 'horizontal'
                            ? 'bg-[#606c38] text-white'
                            : 'bg-white text-[#283618] border border-gray-200 hover:bg-gray-50'
                        }
                      `}
                  >
                    Horizontal
                  </button>
                </div>

              {/* Botones de configuración para grilla (solo modo grid) */}
              
                <div className='flex gap-4 items-center'>
                  {/* Tamaño de thumbnails */}
                  <div className='flex gap-2 items-center'>
                    <span className='text-xs text-[#283618]/60 font-medium'>
                      Tamaño:
                    </span>
                    <button
                      onClick={() => setGridThumbnailSize('small')}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${
                          gridThumbnailSize === 'small'
                            ? 'bg-[#606c38] text-white'
                            : 'bg-white text-[#283618] border border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      S
                    </button>
                    <button
                      onClick={() => setGridThumbnailSize('medium')}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${
                          gridThumbnailSize === 'medium'
                            ? 'bg-[#606c38] text-white'
                            : 'bg-white text-[#283618] border border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      M
                    </button>
                    <button
                      onClick={() => setGridThumbnailSize('large')}
                      className={`
                        px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                        ${
                          gridThumbnailSize === 'large'
                            ? 'bg-[#606c38] text-white'
                            : 'bg-white text-[#283618] border border-gray-200 hover:bg-gray-50'
                        }
                      `}
                    >
                      L
                    </button>
                  </div>

                  {/* Número de columnas */}
                  <div className='flex gap-2 items-center'>
                    <span className='text-xs text-[#283618]/60 font-medium'>
                      Columnas:
                    </span>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <button
                        key={num}
                        onClick={() => setGridColumns(num as 1 | 2 | 3 | 4 | 5 | 6)}
                        className={`
                          px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all min-w-[32px]
                          ${
                            gridColumns === num
                              ? 'bg-[#606c38] text-white'
                              : 'bg-white text-[#283618] border border-gray-200 hover:bg-gray-50'
                          }
                        `}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              
            </div>
          </div>

          {/* Componente de Preview - Sin padding en móvil */}
          <div className='w-full'>
            <ContentFullPreview
              data={templateData}
              mode={selectedMode}
              allowModeToggle={true}
              carouselConfig={{
                orientation: scrollOrientation,
                autoPlay: true,
                autoPlayInterval: 5000,
                showControls: true,
                showIndicators: true,
                loop: true,
                enableSwipe: true,
                itemsPerView: gridColumns,
              }}
              scrollConfig={{
                orientation: scrollOrientation,
                showMiniNav: true,
                highlightActive: true,
                spacing: 'comfortable',
              }}
              gridConfig={{
                columns: gridColumns,
                thumbnailSize: gridThumbnailSize,
                showLabels: true,
              }}
            />
          </div>
        </div>

        {/* Información adicional del template */}
        <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='bg-white rounded-lg shadow p-4'>
            <h3 className='text-sm font-semibold text-[#283618] mb-2'>
              Descripción
            </h3>
            <p className='text-[#283618]/70 text-sm'>
              {templateData.master.description || 'Sin descripción'}
            </p>
          </div>
          <div className='bg-white rounded-lg shadow p-4'>
            <h3 className='text-sm font-semibold text-[#283618] mb-2'>
              Versión
            </h3>
            <p className='text-[#283618]/70'>
              v{templateData.version.version_num || 1}
            </p>
          </div>
          <div className='bg-white rounded-lg shadow p-4'>
            <h3 className='text-sm font-semibold text-[#283618] mb-2'>
              Acceso
            </h3>
            <p className='text-[#283618]/70 capitalize'>
              {templateData.master.access_config.access_type}
            </p>
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
        contentId={templateId}
        contentType="template"
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
