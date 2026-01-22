"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";
import { useTemplateAutosave } from "../../../../hooks/useTemplateAutosave";
import {
  CreateTemplateData,
  TemplateCreationState,
  TemplateCreationStep,
} from "../../../../types/template";

import { EditorLayout } from "./editor/EditorLayout";
import { ThumbnailGenerationModal } from "../../components/ThumbnailGenerationModal";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TemplateAPIService } from "../../../../services/templateService";
import { useToast } from "../../../../components/Toast";

interface CreateTemplatePageProps {
  mode?: "create" | "edit";
  templateId?: string;
  initialData?: CreateTemplateData;
}

export default function CreateTemplatePage({
  mode = "create",
  templateId,
  initialData,
}: CreateTemplatePageProps) {
  const t = useTranslations("CreateTemplate");
  const locale = useLocale();
  const { userInfo } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const isEditMode = mode === "edit";

  const [creationState, setCreationState] = useState<TemplateCreationState>({
    currentStep: "sections",
    data: initialData || {
      master: {
        template_name: "",
        name_machine: "",
        description: "",
        status: "active",
        log: {
          created_at: new Date().toISOString(),
          creator_user_id: "",
          creator_first_name: null,
          creator_last_name: null,
        },
        access_config: {
          access_type: "public",
          allowed_groups: [],
        },
      },
      version: {
        version_num: 1,
        commit_message: isEditMode ? "Versión actualizada" : "Versión inicial",
        log: {
          created_at: new Date().toISOString(),
          creator_user_id: "",
          creator_first_name: null,
          creator_last_name: null,
        },
        content: {
          style_config: {
            font: "Arial",
            primary_color: "#000000",
            secondary_color: "#666666",
            background_color: "#ffffff",
            bulletin_width: 800,
            bulletin_height: 1200,
          },
          sections:
            initialData &&
            "version" in initialData &&
            (initialData as any).version &&
            (initialData as any).version.content &&
            (initialData as any).version.content.sections &&
            (initialData as any).version.content.sections.length > 0
              ? (initialData as any).version.content.sections
              : [
                  {
                    section_id: crypto.randomUUID(),
                    display_name: "Sección 1",
                    blocks: [],
                    order: 0,
                  },
                ],
        },
      },
    },
    errors: {},
    isValid: true,
  });

  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);

  const [thumbnailModal, setThumbnailModal] = useState({
    isOpen: false,
    progress: 0,
    message: "",
    status: "loading" as "loading" | "success" | "error",
    errorMessage: "",
  });

  useEffect(() => {
    if (
      userInfo?.sub &&
      (!creationState.data.master.log.creator_user_id ||
        !creationState.data.version.log.creator_user_id)
    ) {
      setCreationState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          master: {
            ...prev.data.master,
            log: {
              ...prev.data.master.log,
              creator_user_id: userInfo.sub!,
            },
          },
          version: {
            ...prev.data.version,
            log: {
              ...prev.data.version.log,
              creator_user_id: userInfo.sub!,
            },
          },
        },
      }));
    }
  }, [
    userInfo?.sub,
    creationState.data.master.log.creator_user_id,
    creationState.data.version.log.creator_user_id,
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleRestore = useCallback(
    (restoredData: CreateTemplateData, restoredStep: TemplateCreationStep) => {
      console.log(
        "Restoring data...",
        restoredData.version.content.sections.length,
        "sections",
      );
      setCreationState((prev) => ({
        ...prev,
        data: restoredData,
      }));
    },
    [],
  );

  // If initialData loads later (in Edit mode), we need to ensure it updates state if we haven't touched it yet
  useEffect(() => {
    if (
      initialData &&
      !creationState.data.master.template_name &&
      initialData.master.template_name
    ) {
      console.log(
        "Syncing initialData to state",
        initialData.version.content.sections.length,
      );
      setCreationState((prev) => ({
        ...prev,
        data: initialData,
      }));
    }
  }, [initialData]);

  const { saveNow, clearAutosave, lastSaved } = useTemplateAutosave(
    creationState.data,
    creationState.currentStep,
    handleRestore,
    templateId,
  );

  const updateData = useCallback(
    (updater: (prevData: CreateTemplateData) => CreateTemplateData) => {
      setCreationState((prev) => ({
        ...prev,
        data: updater(prev.data),
      }));
    },
    [],
  );

  const handleFinish = useCallback(async () => {
    if (!creationState.data.master.template_name) {
      showToast("Template Name is required", "error");
      return;
    }

    setIsLoading(true);
    try {
      if (isEditMode && templateId) {
        const { log, ...masterDataWithoutLog } = creationState.data.master;

        const masterResponse = await TemplateAPIService.updateTemplate(
          templateId,
          masterDataWithoutLog,
        );

        if (!masterResponse.success) {
          throw new Error(
            masterResponse.message || "Error al actualizar el template master",
          );
        }

        const { log: versionLog, ...versionDataWithoutLog } =
          creationState.data.version;

        const versionDataToSend = {
          ...versionDataWithoutLog,
          version_num: 1,
        };

        const versionResponse = await TemplateAPIService.createTemplateVersion(
          templateId,
          versionDataToSend,
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message ||
              "Error al crear la nueva versión del template",
          );
        }

        try {
          setThumbnailModal({
            isOpen: true,
            progress: 0,
            message: "Preparando generación de thumbnails...",
            status: "loading",
            errorMessage: "",
          });

          const { generateAndUploadThumbnails } =
            await import("../../../../utils/thumbnailCapture");

          const sectionCount =
            creationState.data.version.content.sections.length || 1;

          const thumbnailPaths = await generateAndUploadThumbnails(
            "template-preview-container",
            templateId,
            sectionCount,
            (index: number) => {
              setSelectedSectionIndex(index);
            },
            (current: number, total: number, message: string) => {
              setThumbnailModal((prev) => ({
                ...prev,
                progress: Math.round((current / total) * 100),
                message,
              }));
            },
          );

          setThumbnailModal({
            isOpen: true,
            progress: 100,
            message: "¡Thumbnails generados exitosamente!",
            status: "success",
            errorMessage: "",
          });

          if (thumbnailPaths.length > 0) {
            const sectionCount =
              creationState.data.version.content.sections.length;
            await TemplateAPIService.updateTemplate(templateId, {
              thumbnail_images: thumbnailPaths,
              section_count: sectionCount,
            } as any);
          } else {
            console.warn("⚠️ No thumbnails were generated");
          }

          setTimeout(() => {
            setThumbnailModal((prev) => ({ ...prev, isOpen: false }));
          }, 1500);
        } catch (thumbnailError) {
          console.error("❌ ERROR capturando thumbnails:", thumbnailError);
          setThumbnailModal({
            isOpen: true,
            progress: 0,
            message: "Error al generar thumbnails",
            status: "error",
            errorMessage:
              thumbnailError instanceof Error
                ? thumbnailError.message
                : "Error desconocido",
          });
          setTimeout(() => {
            setThumbnailModal((prev) => ({ ...prev, isOpen: false }));
          }, 3000);
        }

        clearAutosave();
        showToast(
          t("updateSuccess") || "Plantilla actualizada exitosamente",
          "success",
          3000,
        );
        setTimeout(() => {
          router.push("/templates");
        }, 1000);
      } else {
        const { log, ...masterDataWithoutLog } = creationState.data.master;

        const masterResponse =
          await TemplateAPIService.createTemplate(masterDataWithoutLog);

        if (!masterResponse.success || !masterResponse.data) {
          throw new Error(
            masterResponse.message || "Error al crear el template master",
          );
        }

        const createdTemplate = masterResponse.data;
        const newTemplateId =
          (createdTemplate as any).id || createdTemplate._id;

        const { log: versionLog, ...versionDataWithoutLog } =
          creationState.data.version;

        const versionDataToSend = {
          ...versionDataWithoutLog,
          version_num: 1,
        };

        const versionResponse = await TemplateAPIService.createTemplateVersion(
          newTemplateId,
          versionDataToSend,
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || "Error al crear la versión del template",
          );
        }

        try {
          setThumbnailModal({
            isOpen: true,
            progress: 0,
            message: "Preparando generación de thumbnails...",
            status: "loading",
            errorMessage: "",
          });

          const { generateAndUploadThumbnails } =
            await import("../../../../utils/thumbnailCapture");

          const sectionCount =
            creationState.data.version.content.sections.length || 1;

          const thumbnailPaths = await generateAndUploadThumbnails(
            "template-preview-container",
            newTemplateId,
            sectionCount,
            (index: number) => {
              setSelectedSectionIndex(index);
            },
            (current: number, total: number, message: string) => {
              setThumbnailModal((prev) => ({
                ...prev,
                progress: Math.round((current / total) * 100),
                message,
              }));
            },
          );

          setThumbnailModal({
            isOpen: true,
            progress: 100,
            message: "¡Thumbnails generados exitosamente!",
            status: "success",
            errorMessage: "",
          });

          if (thumbnailPaths.length > 0) {
            const sectionCount =
              creationState.data.version.content.sections.length;
            await TemplateAPIService.updateTemplate(newTemplateId, {
              thumbnail_images: thumbnailPaths,
              section_count: sectionCount,
            } as any);
          } else {
            console.warn("⚠️ No thumbnails were generated");
          }

          setTimeout(() => {
            setThumbnailModal((prev) => ({ ...prev, isOpen: false }));
          }, 1500);
        } catch (thumbnailError) {
          console.error("❌ ERROR capturando thumbnails:", thumbnailError);
          setThumbnailModal({
            isOpen: true,
            progress: 0,
            message: "Error al generar thumbnails",
            status: "error",
            errorMessage:
              thumbnailError instanceof Error
                ? thumbnailError.message
                : "Error desconocido",
          });
          setTimeout(() => {
            setThumbnailModal((prev) => ({ ...prev, isOpen: false }));
          }, 3000);
        }

        clearAutosave();
        showToast(
          t("success") || "Plantilla creada exitosamente",
          "success",
          3000,
        );
        setTimeout(() => {
          router.push(`/${locale}/templates`);
        }, 1000);
      }
    } catch (error) {
      console.error(
        isEditMode
          ? "Error actualizando plantilla:"
          : "Error creando plantilla:",
        error,
      );
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al crear la plantilla";
      showToast(`${t("error", { error: errorMessage })}`, "error", 6000);
    } finally {
      setIsLoading(false);
    }
  }, [
    creationState.data,
    isEditMode,
    templateId,
    t,
    clearAutosave,
    showToast,
    router,
  ]);

  const handleBack = () => {
    router.push(`/${locale}/templates`);
  };

  return (
    <>
      <div id="template-preview-container" className="h-full w-full">
        <EditorLayout
          data={creationState.data}
          onUpdate={updateData}
          onSave={handleFinish}
          onBack={handleBack}
          saving={isLoading}
          lastSaved={lastSaved}
        />
      </div>

      <ThumbnailGenerationModal
        isOpen={thumbnailModal.isOpen}
        progress={thumbnailModal.progress}
        message={thumbnailModal.message}
        status={thumbnailModal.status}
        errorMessage={thumbnailModal.errorMessage}
      />
    </>
  );
}
