"use client";

import React, { useState, useEffect } from "react";
import { X, Download, Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { DownloadFormat, QualityOption, PageSize } from "@/utils/downloadContentSimple";
import { downloadFromPreviewDomToImage } from "@/utils/downloadContentDomToImage";
import { CreateTemplateData } from "@/types/template";
import { TemplatePreview } from "@/app/[locale]/templates/create/TemplatePreview";
import { ContentService } from "@/services/contentService";
import { ContentType, NormalizedContent } from "@/types/content";

// Función helper para convertir contenido normalizado a CreateTemplateData
function convertToTemplateData(content: NormalizedContent): CreateTemplateData {
  return {
    master: {
      template_name: content.master.name,
      description: content.master.description || "",
      log: content.master.log,
      status: content.master.status as any,
      access_config: content.master.access_config,
      thumbnail_images: content.master.thumbnail_images || [],
    },
    version: {
      version_num: content.version.version_num,
      log: content.version.log,
      commit_message: content.version.commit_message,
      content: {
        sections: content.version.sections,
        header_config: content.version.header_config,
        footer_config: content.version.footer_config,
        style_config: content.version.style_config,
      },
    },
  };
}

export interface ExportConfig {
  format: DownloadFormat;
  quality: QualityOption;
  pageSize: PageSize;
  sectionsPerPage: number;
  selectedSections: number[]; // Empty = todas
  showMoreInfo: boolean;
  showDescription: boolean;
}

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (
    config: ExportConfig, 
    onSectionChange: (index: number) => void,
    onProgressUpdate: (current: number, message: string) => void
  ) => Promise<void>;
  totalSections?: number;
  contentName?: string;
  contentId?: string;
  contentType?: ContentType;
  templateData?: CreateTemplateData; // Datos del template para renderizar preview (opcional si se pasa contentId)
}

export function ExportModal({
  isOpen,
  onClose,
  onExport,
  totalSections: externalTotalSections,
  contentName: externalContentName,
  contentId,
  contentType,
  templateData: externalTemplateData,
}: ExportModalProps) {
  // Estado para contenido cargado dinámicamente
  const [loadedContent, setLoadedContent] = useState<NormalizedContent | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Determinar qué datos usar (externos o cargados)
  const templateData = externalTemplateData || (loadedContent ? convertToTemplateData(loadedContent) : undefined);
  const totalSections = externalTotalSections || templateData?.version.content.sections.length || 0;
  const contentName = externalContentName || loadedContent?.master.name || templateData?.master.template_name || "Contenido";

  // Estado del formulario
  const [config, setConfig] = useState<ExportConfig>({
    format: "pdf",
    quality: "high",
    pageSize: "auto",
    sectionsPerPage: 1,
    selectedSections: [], // Todas por defecto
    showMoreInfo: false,
    showDescription: false,
  });

  // Estado de exportación
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 100, message: "" });
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Estado para el preview que vamos a capturar
  const [currentPreviewSection, setCurrentPreviewSection] = useState(0);

  // Secciones disponibles
  const allSections = Array.from({ length: totalSections }, (_, i) => i);
  const [selectAll, setSelectAll] = useState(true);

  // Cargar contenido si se proporciona contentId y contentType
  useEffect(() => {
    const loadContent = async () => {
      // Si ya tenemos datos externos, no cargar nada
      if (externalTemplateData) {
        setLoadedContent(null);
        return;
      }

      // Si no hay ID o tipo, no hacer nada
      if (!contentId || !contentType || !isOpen) return;

      try {
        setLoadingContent(true);
        setLoadError(null);

        // Usar el servicio adaptador para cargar contenido normalizado
        const response = await ContentService.getContent(contentType, contentId);

        if (!response.success || !response.data) {
          throw new Error(
            response.message ||
              `No se pudo cargar ${ContentService.getContentTypeName(contentType)}`
          );
        }

        setLoadedContent(response.data);
      } catch (err) {
        console.error(`Error cargando ${contentType}:`, err);
        setLoadError(
          err instanceof Error
            ? err.message
            : `Error al cargar ${ContentService.getContentTypeName(contentType)}`
        );
      } finally {
        setLoadingContent(false);
      }
    };

    loadContent();
  }, [contentId, contentType, externalTemplateData, isOpen]);

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;
      
      // Prevenir scroll
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // Restaurar scroll
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);
  
  // Handlers
  const handleFormatChange = (format: DownloadFormat) => {
    setConfig({ ...config, format });
  };

  const handleQualityChange = (quality: QualityOption) => {
    setConfig({ ...config, quality });
  };

  const handlePageSizeChange = (pageSize: PageSize) => {
    setConfig({ ...config, pageSize });
  };

  const handleSectionsPerPageChange = (value: number) => {
    setConfig({ ...config, sectionsPerPage: value });
  };

  const handleSectionToggle = (index: number) => {
    const newSections = config.selectedSections.includes(index)
      ? config.selectedSections.filter((i) => i !== index)
      : [...config.selectedSections, index].sort((a, b) => a - b);
    
    setConfig({ ...config, selectedSections: newSections });
    setSelectAll(newSections.length === totalSections);
  };

  const handleSelectAllToggle = () => {
    if (selectAll) {
      setConfig({ ...config, selectedSections: [] });
    } else {
      setConfig({ ...config, selectedSections: allSections });
    }
    setSelectAll(!selectAll);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus("idle");
    setErrorMessage("");
    setProgress({ current: 0, total: 100, message: "Iniciando exportación..." });

    try {
      // Callback para actualizar el progreso durante la exportación
      const handleProgressUpdate = (current: number, message: string) => {
        setProgress({ current, total: 100, message });
      };

      // Pasar callbacks para sección y progreso
      await onExport(config, setCurrentPreviewSection, handleProgressUpdate);
      setExportStatus("success");
      setProgress({ current: 100, total: 100, message: "¡Exportación completada!" });
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
        resetModal();
      }, 2000);
    } catch (error) {
      console.error("Error en exportación:", error);
      setExportStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsExporting(false);
    }
  };

  // Nueva función para exportar con dom-to-image-more
  const handleExportWithDomToImage = async () => {
    setIsExporting(true);
    setExportStatus("idle");
    setErrorMessage("");
    setProgress({ current: 0, total: 100, message: "Iniciando exportación (dom-to-image)..." });

    try {
      const sectionsToExport = config.selectedSections.length > 0 
        ? config.selectedSections 
        : Array.from({ length: totalSections }, (_, i) => i);

      await downloadFromPreviewDomToImage({
        previewContainerId: "export-preview-download",
        contentName: contentName,
        format: config.format,
        totalSections: totalSections,
        sectionIndices: sectionsToExport,
        onSectionChange: setCurrentPreviewSection,
        quality: config.quality,
        pageSize: config.pageSize,
        sectionsPerPage: config.sectionsPerPage,
        onProgress: (current, total, message) => {
          setProgress({ current, total, message });
        },
      });

      setExportStatus("success");
      setProgress({ current: 100, total: 100, message: "¡Exportación completada con dom-to-image!" });
      
      // Cerrar modal después de 2 segundos
      setTimeout(() => {
        onClose();
        resetModal();
      }, 2000);
    } catch (error) {
      console.error("Error en exportación con dom-to-image:", error);
      setExportStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsExporting(false);
    }
  };

  const resetModal = () => {
    setConfig({
      format: "pdf",
      quality: "ultra",
      pageSize: "auto",
      sectionsPerPage: 1,
      selectedSections: [],
      showMoreInfo: false,
      showDescription: false,
    });
    setSelectAll(true);
    setCurrentPreviewSection(0);
    setProgress({ current: 0, total: 100, message: "" });
    setExportStatus("idle");
    setErrorMessage("");
    // Limpiar contenido cargado solo si no hay datos externos
    if (!externalTemplateData) {
      setLoadedContent(null);
      setLoadError(null);
    }
  };

  const handleClose = () => {
    if (!isExporting) {
      onClose();
      resetModal();
    }
  };

  // Navegación del preview
  const handlePreviousSection = () => {
    const sections = config.selectedSections.length > 0 ? config.selectedSections : allSections;
    const currentIndex = sections.indexOf(currentPreviewSection);
    if (currentIndex > 0) {
      setCurrentPreviewSection(sections[currentIndex - 1]);
    }
  };

  const handleNextSection = () => {
    const sections = config.selectedSections.length > 0 ? config.selectedSections : allSections;
    const currentIndex = sections.indexOf(currentPreviewSection);
    if (currentIndex < sections.length - 1) {
      setCurrentPreviewSection(sections[currentIndex + 1]);
    }
  };

  if (!isOpen) return null;

  const sectionsToExport = config.selectedSections.length > 0 
    ? config.selectedSections 
    : allSections;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col">
        {/* Header - Fixed (no hace scroll) */}
        <div className="flex-shrink-0 bg-white border-b border-[#283618]/10 p-6 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold text-[#283618]">Exportar Contenido</h2>
            <p className="text-sm text-[#283618]/60 mt-1">{contentName}</p>
            {contentId && (
              <p className="text-xs text-[#283618]/40 mt-0.5 font-mono">ID: {contentId}</p>
            )}
          </div>
          <button
            onClick={handleClose}
            disabled={isExporting || loadingContent}
            className="p-2 hover:bg-[#283618]/5 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6 text-[#283618]" />
          </button>
        </div>

        {/* Estado de carga del contenido */}
        {loadingContent && (
          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-[#ffaf68] mb-4" />
            <p className="text-[#283618] font-medium">
              Cargando contenido...
            </p>
          </div>
        )}

        {/* Estado de error al cargar */}
        {loadError && !loadingContent && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-[#283618] mb-2">Error</h3>
            <p className="text-[#283618]/70 text-center">{loadError}</p>
          </div>
        )}

        {/* Contenido - SOLO ESTA PARTE HACE SCROLL */}
        {!loadingContent && !loadError && (
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 py-4 scrollbar-thin">
          <div className="space-y-6">
          {/* Formato */}
          <div>
            <label className="block text-sm font-semibold text-[#283618] mb-3">
              Formato de Archivo
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["png", "jpg", "pdf"] as DownloadFormat[]).map((format) => (
                <button
                  key={format}
                  onClick={() => handleFormatChange(format)}
                  disabled={isExporting}
                  className={`py-3 px-4 rounded-lg font-semibold uppercase text-sm transition-colors ${
                    config.format === format
                      ? "bg-[#606c38] text-white"
                      : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                >
                  {format}
                </button>
              ))}
            </div>
          </div>

          {/* Calidad */}
          <div>
            <label className="block text-sm font-semibold text-[#283618] mb-3">
              Calidad de Imagen
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(["low", "medium", "high", "ultra"] as QualityOption[]).map((quality) => (
                <button
                  key={quality}
                  onClick={() => handleQualityChange(quality)}
                  disabled={isExporting}
                  className={`py-3 px-4 rounded-lg font-semibold capitalize text-sm transition-colors ${
                    config.quality === quality
                      ? "bg-[#606c38] text-white"
                      : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                  } disabled:opacity-50`}
                >
                  {quality}
                  <div className="text-xs font-normal mt-0.5 opacity-70">
                    {quality === "low" && "1x"}
                    {quality === "medium" && "1.5x"}
                    {quality === "high" && "2x"}
                    {quality === "ultra" && "3x"}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Configuración PDF */}
          {config.format === "pdf" && (
            <div className="border-2 border-[#283618]/10 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-[#283618]">Configuración PDF</h3>
              
              {/* Tamaño de página */}
              <div>
                <label className="block text-sm text-[#283618]/80 mb-2">
                  Tamaño de Página
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(["auto", "a4", "letter", "legal"] as PageSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => handlePageSizeChange(size)}
                      disabled={isExporting}
                      className={`py-2 px-3 rounded-lg font-medium uppercase text-xs transition-colors ${
                        config.pageSize === size
                          ? "bg-[#606c38] text-white"
                          : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                      } disabled:opacity-50`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Secciones por página */}
              <div>
                <label className="block text-sm text-[#283618]/80 mb-2">
                  Secciones por Página: {config.sectionsPerPage}
                </label>
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={config.sectionsPerPage}
                  onChange={(e) => handleSectionsPerPageChange(parseInt(e.target.value))}
                  disabled={isExporting}
                  className="w-full accent-[#ffaf68]"
                />
                <div className="flex justify-between text-xs text-[#283618]/60 mt-1">
                  <span>1 (una por página)</span>
                  <span>6 (grid 2x3)</span>
                </div>
              </div>
            </div>
          )}

          {/* Selector de secciones */}
          <div className="border-2 border-[#283618]/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#283618]">Opciones de Visualización</h3>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setConfig({ ...config, showDescription: !config.showDescription })}
                disabled={isExporting}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
                  config.showDescription
                    ? "bg-[#606c38] text-white"
                    : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                Mostrar Descripción
              </button>
              <button
                onClick={() => setConfig({ ...config, showMoreInfo: !config.showMoreInfo })}
                disabled={isExporting}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
                  config.showMoreInfo
                    ? "bg-[#606c38] text-white"
                    : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                Mostrar Más Info
              </button>
            </div>
            
            <p className="text-xs text-[#283618]/60 mt-2">
              Estas opciones agregan información adicional a cada sección exportada
            </p>
          </div>

          {/* Selector de secciones */}
          <div className="border-2 border-[#283618]/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[#283618]">Secciones a Exportar</h3>
              <button
                onClick={handleSelectAllToggle}
                disabled={isExporting}
                className="text-sm text-[#ffaf68] hover:text-[#ff9d4d] font-medium disabled:opacity-50"
              >
                {selectAll ? "Deseleccionar todas" : "Seleccionar todas"}
              </button>
            </div>
            
            <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2">
              {allSections.map((index) => (
                <button
                  key={index}
                  onClick={() => handleSectionToggle(index)}
                  disabled={isExporting}
                  className={`py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    (selectAll || config.selectedSections.includes(index))
                      ? "bg-[#606c38] text-white"
                      : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                  } disabled:opacity-50`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            
            <p className="text-xs text-[#283618]/60 mt-3">
              {sectionsToExport.length === totalSections
                ? `Todas las secciones (${totalSections})`
                : `${sectionsToExport.length} de ${totalSections} secciones seleccionadas`}
            </p>
          </div>

          {/* Preview del template para exportación COMPLEX */}
          {templateData && (
            <div className=" rounded-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[#283618] flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Preview en vivo
                </h3>
                
                {/* Navegación de secciones */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#283618]/60">
                    Sección {sectionsToExport.indexOf(currentPreviewSection) + 1} de {sectionsToExport.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handlePreviousSection}
                      disabled={isExporting || sectionsToExport.indexOf(currentPreviewSection) === 0}
                      className="p-1.5 rounded-lg bg-white border border-[#283618]/20 text-[#283618] hover:bg-[#606c38] hover:text-white hover:border-[#606c38] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#283618]"
                      title="Sección anterior"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNextSection}
                      disabled={isExporting || sectionsToExport.indexOf(currentPreviewSection) === sectionsToExport.length - 1}
                      className="p-1.5 rounded-lg bg-white border border-[#283618]/20 text-[#283618] hover:bg-[#606c38] hover:text-white hover:border-[#606c38] transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-[#283618]"
                      title="Siguiente sección"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div
                className="bg-white rounded-lg flex justify-center overflow-auto max-h-[500px] scrollbar-thin"
              >
                <div id="export-preview-download" className="w-fit">
                <TemplatePreview
                  data={templateData}
                  selectedSectionIndex={currentPreviewSection}
                  moreInfo={config.showMoreInfo}
                  description={config.showDescription}
                  forceGlobalHeader={false}
                />
                </div>
              </div>
              <p className="text-xs text-[#283618]/60 mt-2">
                Este preview se usará para generar la exportación
              </p>
            </div>
          )}
          </div>
        </div>
        )}

        {/* Footer - Fixed (no hace scroll) */}
        {!loadingContent && !loadError && (
        <div className="flex-shrink-0 bg-white border-t border-[#283618]/10 p-6 flex items-center justify-between rounded-b-xl">
          <div className="text-sm text-[#283618]/60">
            Formato: <span className="font-semibold uppercase">{config.format}</span> | 
            Secciones: <span className="font-semibold">{sectionsToExport.length}</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              disabled={isExporting}
              className="px-6 py-3 rounded-lg border-2 border-[#283618]/20 text-[#283618] hover:bg-[#283618]/5 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-3 rounded-lg bg-[#606c38] text-white hover:bg-[#606c38]/90 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {isExporting ? "Exportando..." : "Exportar (html2canvas)"}
            </button>
            <button
              onClick={handleExportWithDomToImage}
              disabled={isExporting}
              className="px-6 py-3 rounded-lg bg-[#ffaf68] text-white hover:bg-[#ff9d4d] transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-5 h-5" />
              {isExporting ? "Exportando..." : "Exportar (dom-to-image)"}
            </button>
          </div>
        </div>
        )}

        {/* Overlay de progreso - Aparece sobre todo el modal */}
        {isExporting && (
          <div className="absolute inset-0 bg-black/30 backdrop-blur rounded-xl flex items-center justify-center z-20">
            <div className="bg-[#ffffff] rounded-lg p-4 min-w-[400px] max-w-lg mx-4">
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-5 h-5 animate-spin text-[#ffaf68]" />
                <span className="text-sm font-medium text-[#283618]">
                  {progress.message}
                </span>
              </div>
              <div className="w-full bg-[#283618]/10 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-[#ffaf68] h-full transition-all duration-300"
                  style={{ width: `${progress.current}%` }}
                />
              </div>
              <p className="text-xs text-[#283618]/60 mt-2">
                {Math.round(progress.current)}% completado
              </p>
            </div>
          </div>
        )}

        {/* Overlay de éxito */}
        {exportStatus === "success" && (
          <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center z-20">
            <div className="bg-white rounded-xl shadow-2xl p-8 border-2 border-green-500 max-w-md w-full mx-4">
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mb-4" />
                <h3 className="text-2xl font-bold text-green-900 mb-2">
                  ¡Exportación exitosa!
                </h3>
                <p className="text-base text-green-700">
                  El archivo se descargó correctamente.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overlay de error */}
        {exportStatus === "error" && (
          <div className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center z-20">
            <div className="bg-white rounded-xl shadow-2xl p-8 border-2 border-red-500 max-w-md w-full mx-4">
              <div className="flex flex-col items-center text-center">
                <AlertCircle className="w-16 h-16 text-red-600 mb-4" />
                <h3 className="text-2xl font-bold text-red-900 mb-2">
                  Error en la exportación
                </h3>
                <p className="text-base text-red-700">
                  {errorMessage}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
