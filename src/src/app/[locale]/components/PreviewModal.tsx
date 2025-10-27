"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ContentService } from "@/services/contentService";
import {
  ContentType,
  NormalizedContent,
  ContentActions,
  getAvailableActions,
} from "@/types/content";
import { TemplatePreview } from "../templates/create/TemplatePreview";
import { TemplateModal } from "./TemplateModal";
import { Loader2, Edit, Copy, Trash2, Send, FileText, Download } from "lucide-react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentType: ContentType;
  contentId?: string;
  contentData?: any; // CreateTemplateData | CreateBulletinData
  showActions?: boolean;
  showNavigation?: boolean;
  actions?: ContentActions;
  locale?: string;
}

/**
 * Modal genérico para previsualizar Templates y Bulletins
 * Unifica la lógica de preview para ambos tipos de contenido
 */
export function PreviewModal({
  isOpen,
  onClose,
  contentType,
  contentId,
  contentData: externalData,
  showActions = false,
  showNavigation = true,
  actions,
  locale = "es",
}: PreviewModalProps) {
  const router = useRouter();
  const [content, setContent] = useState<NormalizedContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Cargar contenido si se proporciona ID
  useEffect(() => {
    const loadContent = async () => {
      // Si ya tenemos datos externos, usarlos directamente
      if (externalData) {
        // Convertir a formato normalizado si es necesario
        // Por ahora asumimos que externalData ya está en formato correcto
        setContent(externalData);
        return;
      }

      // Si no hay ID, no hacer nada
      if (!contentId || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        // Usar el servicio adaptador para cargar contenido normalizado
        const response = await ContentService.getContent(contentType, contentId);

        if (!response.success || !response.data) {
          throw new Error(
            response.message ||
              `No se pudo cargar ${ContentService.getContentTypeName(contentType)}`
          );
        }

        setContent(response.data);
      } catch (err) {
        console.error(`Error cargando ${contentType}:`, err);
        setError(
          err instanceof Error
            ? err.message
            : `Error al cargar ${ContentService.getContentTypeName(contentType)}`
        );
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [contentId, contentType, externalData, isOpen]);

  // Reset al cerrar
  const handleClose = () => {
    setCurrentSectionIndex(0);
    if (!externalData) {
      setContent(null);
    }
    onClose();
  };

  // Handlers para acciones
  const handleEdit = () => {
    const id = contentId || content?.master.id;
    if (id) {
      actions?.onEdit?.(id);
      const route = ContentService.getContentRoute(contentType);
      router.push(`/${locale}/${route}/${id}/edit`);
    }
  };

  const handleClone = () => {
    const id = contentId || content?.master.id;
    if (id) {
      actions?.onClone?.(id);
    }
  };

  const handleDelete = () => {
    const id = contentId || content?.master.id;
    if (id) {
      actions?.onDelete?.(id);
    }
  };

  const handlePublish = () => {
    const id = contentId || content?.master.id;
    if (id) {
      actions?.onPublish?.(id);
    }
  };

  const handleSendToReview = () => {
    const id = contentId || content?.master.id;
    if (id) {
      actions?.onSendToReview?.(id);
    }
  };

  const handleDownloadPDF = () => {
    const id = contentId || content?.master.id;
    if (id) {
      actions?.onDownloadPDF?.(id);
    }
  };

  // Calcular datos para el modal
  const sections = content?.version?.sections || [];
  const totalSections = sections.length;
  const currentSection = sections[currentSectionIndex];

  // Determinar qué acciones están disponibles
  const availableActions = content
    ? getAvailableActions(contentType, content.master.status)
    : {};

  // Convertir contenido normalizado a formato compatible con TemplatePreview
  const previewData = content
    ? {
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
      }
    : null;

  return (
    <TemplateModal
      isOpen={isOpen}
      onClose={handleClose}
      title={content?.master?.name || `Sección ${currentSectionIndex + 1}`}
      subtitle={
        currentSection?.display_name
          ? `${currentSection.display_name} (${currentSectionIndex + 1}/${totalSections})`
          : !loading
          ? `Sección ${currentSectionIndex + 1} de ${totalSections}`
          : "Cargando..."
      }
      showNavigation={showNavigation && totalSections > 1}
      currentIndex={currentSectionIndex}
      totalItems={totalSections}
      onPrevious={() =>
        setCurrentSectionIndex((prev) => Math.max(0, prev - 1))
      }
      onNext={() =>
        setCurrentSectionIndex((prev) => Math.min(totalSections - 1, prev + 1))
      }
    >
      {/* Estado de carga */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-12 h-12 animate-spin text-[#ffaf68] mb-4" />
          <p className="text-[#283618] font-medium">
            Cargando {ContentService.getContentTypeName(contentType)}...
          </p>
        </div>
      )}

      {/* Estado de error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-[#283618] mb-2">Error</h3>
          <p className="text-[#283618]/70 text-center">{error}</p>
        </div>
      )}

      {/* Preview del contenido */}
      {!loading && !error && previewData && (
        <div className="space-y-4">
          {/* Preview de la sección actual */}
          <div>
            <TemplatePreview
              data={previewData as any}
              selectedSectionIndex={currentSectionIndex}
            />
          </div>

          {/* Botones de acción opcionales */}
          {showActions && (
            <div className="flex flex-wrap gap-3 justify-end pt-4 border-t border-gray-200">
              {/* Editar */}
              {availableActions.edit && actions?.onEdit && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffaf68] text-white rounded-lg hover:bg-[#ff9d4d] transition-colors font-medium text-sm"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
              )}

              {/* Clonar */}
              {availableActions.clone && actions?.onClone && (
                <button
                  onClick={handleClone}
                  className="flex items-center gap-2 px-4 py-2 bg-[#283618] text-white rounded-lg hover:bg-[#3a4a22] transition-colors font-medium text-sm"
                  title="Clonar"
                >
                  <Copy className="w-4 h-4" />
                  Clonar
                </button>
              )}

              {/* Publicar (solo bulletins) */}
              {availableActions.publish && actions?.onPublish && (
                <button
                  onClick={handlePublish}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                  title="Publicar"
                >
                  <FileText className="w-4 h-4" />
                  Publicar
                </button>
              )}

              {/* Enviar a revisión (solo bulletins) */}
              {availableActions.sendToReview && actions?.onSendToReview && (
                <button
                  onClick={handleSendToReview}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                  title="Enviar a revisión"
                >
                  <Send className="w-4 h-4" />
                  Enviar a revisión
                </button>
              )}

              {/* Descargar PDF (solo bulletins publicados) */}
              {availableActions.downloadPDF && actions?.onDownloadPDF && (
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-sm"
                  title="Descargar PDF"
                >
                  <Download className="w-4 h-4" />
                  Descargar PDF
                </button>
              )}

              {/* Eliminar */}
              {availableActions.delete && actions?.onDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </TemplateModal>
  );
}
