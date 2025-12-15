"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TemplateAPIService } from "@/services/templateService";
import { CreateTemplateData } from "@/types/template";
import { TemplatePreview } from "../templates/create/TemplatePreview";
import { TemplateModal } from "./TemplateModal";
import { Loader2, Edit, Copy, Trash2 } from "lucide-react";

interface TemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: string;
  templateData?: CreateTemplateData;
  showActions?: boolean;
  showNavigation?: boolean;
  onEdit?: (templateId: string) => void;
  onClone?: (templateId: string) => void;
  onDelete?: (templateId: string) => void;
  locale?: string;
}

/**
 * Modal especializado para previsualizar templates
 * Puede recibir el ID del template (lo carga automáticamente) o los datos directamente
 */
export function TemplatePreviewModal({
  isOpen,
  onClose,
  templateId,
  templateData: externalData,
  showActions = false,
  showNavigation = true,
  onEdit,
  onClone,
  onDelete,
  locale = "es",
}: TemplatePreviewModalProps) {
  const t = useTranslations("TemplatePreviewModal");
  const router = useRouter();
  const [templateData, setTemplateData] = useState<CreateTemplateData | null>(
    externalData || null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);

  // Cargar template si se proporciona ID
  useEffect(() => {
    const loadTemplate = async () => {
      // Si ya tenemos datos externos, no cargar
      if (externalData) {
        setTemplateData(externalData);
        return;
      }

      // Si no hay ID, no hacer nada
      if (!templateId || !isOpen) return;

      try {
        setLoading(true);
        setError(null);

        // Obtener el template master
        // Obtener el template master y su versión actual en una sola llamada
        const response = await TemplateAPIService.getCurrentVersion(templateId);

        if (!response.success || !response.data) {
          throw new Error(t("errors.templateNotFound"));
        }

        const { master: templateMaster, current_version: currentVersion } = response.data;

        // Validar que la versión tenga contenido
        if (!currentVersion.content || !currentVersion.content.sections) {
          throw new Error(t("errors.noSections"));
        }

        // Convertir al formato CreateTemplateData
        const formattedData: CreateTemplateData = {
          master: {
            template_name:
              templateMaster.template_name || t("defaults.noName"),
            name_machine: templateMaster.name_machine || "",
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
            commit_message: currentVersion.commit_message || t("defaults.initialVersion"),
            content: {
              style_config: currentVersion.content.style_config || {},
              header_config: currentVersion.content.header_config,
              sections: currentVersion.content.sections || [],
              footer_config: currentVersion.content.footer_config,
            },
          },
        };

        setTemplateData(formattedData);
      } catch (err) {
        console.error("Error cargando template:", err);
        setError(
          err instanceof Error ? err.message : t("errors.loadingError")
        );
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, externalData, isOpen]);

  // Reset al cerrar
  const handleClose = () => {
    setCurrentSectionIndex(0);
    if (!externalData) {
      setTemplateData(null);
    }
    onClose();
  };

  // Handlers para acciones
  const handleEdit = () => {
    const id = templateId || (templateData as any)?._id;
    if (id) {
      onEdit?.(id);
      router.push(`/${locale}/templates/${id}/edit`);
    }
  };

  const handleClone = () => {
    const id = templateId || (templateData as any)?._id;
    if (id) {
      onClone?.(id);
    }
  };

  const handleDelete = () => {
    const id = templateId || (templateData as any)?._id;
    if (id) {
      onDelete?.(id);
    }
  };

  // Calcular datos para el modal
  const sections = templateData?.version?.content?.sections || [];
  const totalSections = sections.length;
  const currentSection = sections[currentSectionIndex];

  return (
    <TemplateModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        templateData?.master?.template_name ||
        t("section", { number: currentSectionIndex + 1 })
      }
      subtitle={
        currentSection?.display_name
          ? `${currentSection.display_name} (${currentSectionIndex + 1}/${totalSections})`
          : !loading ? t("sectionOf", { current: currentSectionIndex + 1, total: totalSections }) : t("loadingShort")
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
          <p className="text-[#283618] font-medium">{t("loading")}</p>
        </div>
      )}

      {/* Estado de error */}
      {error && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-[#283618] mb-2">{t("errorTitle")}</h3>
          <p className="text-[#283618]/70 text-center">{error}</p>
        </div>
      )}

      {/* Preview del template */}
      {!loading && !error && templateData && (
        <div className="space-y-4">
          {/* Preview de la sección actual */}
          <div>
            <TemplatePreview
              data={templateData}
              selectedSectionIndex={currentSectionIndex}
            />
          </div>

          {/* Botones de acción opcionales */}
          {showActions && (
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              {onEdit && (
                <button
                  onClick={handleEdit}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ffaf68] text-white rounded-lg hover:bg-[#ff9d4d] transition-colors font-medium text-sm"
                >
                  <Edit className="w-4 h-4" />
                  {t("actions.edit")}
                </button>
              )}
              {onClone && (
                <button
                  onClick={handleClone}
                  className="flex items-center gap-2 px-4 py-2 bg-[#283618] text-white rounded-lg hover:bg-[#3a4a22] transition-colors font-medium text-sm"
                >
                  <Copy className="w-4 h-4" />
                  {t("actions.clone")}
                </button>
              )}
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm"
                >
                  <Trash2 className="w-4 h-4" />
                  {t("actions.delete")}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </TemplateModal>
  );
}
