"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";
import { useTemplateAutosave } from "../../../../hooks/useTemplateAutosave";
import {
  Stepper,
  StepContent,
  StepNavigation,
  StepConfig,
} from "../../components/Stepper";
import {
  CreateTemplateData,
  TemplateCreationStep,
  TemplateCreationState,
} from "../../../../types/template";

import { BasicInfoStep } from "./steps/BasicInfoStep";
import { GeneralConfigStep } from "./steps/GeneralConfigStep";
import { HeaderFooterStep } from "./steps/HeaderFooterStep";
import { SectionsStep } from "./steps/SectionsStep";
import { TemplatePreview } from "./TemplatePreview";
import { AutosaveIndicator } from "../../components/AutosaveIndicator";
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
  const { userInfo } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const isEditMode = mode === "edit";

  // Estado del wizard
  const [creationState, setCreationState] = useState<TemplateCreationState>({
    currentStep: "basic-info",
    data: initialData || {
      master: {
        template_name: "",
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
          },
          sections: [],
        },
      },
    },
    errors: {},
    isValid: false,
  });

  // Estado para controlar qué sección se muestra en el preview
  const [selectedSectionIndex, setSelectedSectionIndex] = useState(0);

  // Estado para el modal de generación de thumbnails
  const [thumbnailModal, setThumbnailModal] = useState({
    isOpen: false,
    progress: 0,
    message: "",
    status: "loading" as "loading" | "success" | "error",
    errorMessage: "",
  });

  // Actualizar creator_user_id cuando userInfo esté disponible
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

  // Resetear la sección seleccionada cuando no existe o cambia el número de secciones
  useEffect(() => {
    const sectionsCount = creationState.data.version.content.sections.length;
    if (sectionsCount === 0) {
      setSelectedSectionIndex(0);
    } else if (selectedSectionIndex >= sectionsCount) {
      setSelectedSectionIndex(0);
    }
  }, [
    creationState.data.version.content.sections.length,
    selectedSectionIndex,
  ]);

  const [isLoading, setIsLoading] = useState(false);

  // Función para restaurar datos desde autoguardado
  const handleRestore = useCallback(
    (restoredData: CreateTemplateData, restoredStep: TemplateCreationStep) => {
      setCreationState((prev) => ({
        ...prev,
        data: restoredData,
        currentStep: restoredStep,
      }));
    },
    []
  );

  // Hook de autoguardado
  const { saveNow, clearAutosave, lastSaved } = useTemplateAutosave(
    creationState.data,
    creationState.currentStep,
    handleRestore,
    templateId // Pasar el templateId para generar key única en modo edit
  );

  // Configuración de pasos
  const steps: StepConfig[] = useMemo(
    () => [
      {
        id: "basic-info",
        title: t("steps.basicInfo.title"),
        description: t("steps.basicInfo.description"),
      },
      {
        id: "general-config",
        title: t("steps.generalConfig.title"),
        description: t("steps.generalConfig.description"),
      },
      {
        id: "header-footer",
        title: t("steps.headerFooter.title"),
        description: t("steps.headerFooter.description"),
      },
      {
        id: "sections",
        title: t("steps.sections.title"),
        description: t("steps.sections.description"),
      },
    ],
    [t]
  );

  const currentStepIndex = useMemo(() => {
    const stepIds: TemplateCreationStep[] = [
      "basic-info",
      "general-config",
      "header-footer",
      "sections",
    ];
    return stepIds.indexOf(creationState.currentStep);
  }, [creationState.currentStep]);

  // Función para actualizar los datos
  const updateData = useCallback(
    (updater: (prevData: CreateTemplateData) => CreateTemplateData) => {
      setCreationState((prev) => ({
        ...prev,
        data: updater(prev.data),
      }));
    },
    []
  );

  // Función para actualizar errores
  const updateErrors = useCallback((errors: Record<string, string[]>) => {
    setCreationState((prev) => ({
      ...prev,
      errors,
    }));
  }, []);

  // Validación por paso
  const validateCurrentStep = useCallback((): boolean => {
    const { currentStep, data } = creationState;

    switch (currentStep) {
      case "basic-info":
        return !!(
          data.master.template_name.trim() &&
          data.master.description.trim() &&
          (data.master.access_config?.access_type !== "restricted" ||
            (Array.isArray(data.master.access_config?.allowed_groups) &&
              data.master.access_config.allowed_groups.length > 0))
        );

      case "general-config":
        return !!data.version.content.style_config?.primary_color;

      case "header-footer":
        return true; // Opcional

      case "sections":
        return data.version.content.sections.length > 0;

      default:
        return false;
    }
  }, [creationState]);

  const isCurrentStepValid = validateCurrentStep();

  // Navegación entre pasos
  const goToStep = useCallback((step: TemplateCreationStep) => {
    setCreationState((prev) => ({
      ...prev,
      currentStep: step,
    }));
  }, []);

  const handleNext = useCallback(() => {
    const steps: TemplateCreationStep[] = [
      "basic-info",
      "general-config",
      "header-footer",
      "sections",
    ];
    const currentIndex = steps.indexOf(creationState.currentStep);
    if (currentIndex < steps.length - 1) {
      goToStep(steps[currentIndex + 1]);
    }
  }, [creationState.currentStep, goToStep]);

  const handlePrevious = useCallback(() => {
    const steps: TemplateCreationStep[] = [
      "basic-info",
      "general-config",
      "header-footer",
      "sections",
    ];
    const currentIndex = steps.indexOf(creationState.currentStep);
    if (currentIndex > 0) {
      goToStep(steps[currentIndex - 1]);
    }
  }, [creationState.currentStep, goToStep]);

  const handleStepClick = useCallback(
    (stepIndex: number) => {
      const steps: TemplateCreationStep[] = [
        "basic-info",
        "general-config",
        "header-footer",
        "sections",
      ];
      goToStep(steps[stepIndex]);
    },
    [goToStep]
  );

  // Finalizar creación o edición
  const handleFinish = useCallback(async () => {
    if (!isCurrentStepValid) return;

    setIsLoading(true);
    try {
      if (isEditMode && templateId) {
        // MODO EDICIÓN: Actualizar template existente
        const { log, ...masterDataWithoutLog } = creationState.data.master;

        // 1. Actualizar el template master
        const masterResponse = await TemplateAPIService.updateTemplate(
          templateId,
          masterDataWithoutLog
        );

        if (!masterResponse.success) {
          throw new Error(
            masterResponse.message || "Error al actualizar el template master"
          );
        }

        // 2. Crear una nueva versión del template
        const { log: versionLog, ...versionDataWithoutLog } =
          creationState.data.version;

        // Agregar version_num temporal (el backend lo recalcula automáticamente)
        const versionDataToSend = {
          ...versionDataWithoutLog,
          version_num: 1, // Valor temporal, el backend asigna el correcto
        };

        const versionResponse = await TemplateAPIService.createTemplateVersion(
          templateId,
          versionDataToSend
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message ||
              "Error al crear la nueva versión del template"
          );
        }

        // 3. Capturar y guardar thumbnails
        try {
          // Mostrar modal de carga
          setThumbnailModal({
            isOpen: true,
            progress: 0,
            message: "Preparando generación de thumbnails...",
            status: "loading",
            errorMessage: "",
          });

          const { generateAndUploadThumbnails } = await import(
            "../../../../utils/thumbnailCapture"
          );

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
              // Actualizar progreso en el modal
              setThumbnailModal((prev) => ({
                ...prev,
                progress: Math.round((current / total) * 100),
                message,
              }));
            }
          );

          // Actualizar modal a estado de éxito
          setThumbnailModal({
            isOpen: true,
            progress: 100,
            message: "¡Thumbnails generados exitosamente!",
            status: "success",
            errorMessage: "",
          });

          // 4. Actualizar el template con los thumbnails y section_count
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

          // Cerrar modal después de 1.5 segundos
          setTimeout(() => {
            setThumbnailModal((prev) => ({ ...prev, isOpen: false }));
          }, 1500);
        } catch (thumbnailError) {
          console.error("❌ ERROR capturando thumbnails:", thumbnailError);
          console.error(
            "❌ Error stack:",
            thumbnailError instanceof Error
              ? thumbnailError.stack
              : "No stack trace"
          );

          // Mostrar error en el modal
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

          // Cerrar modal después de 3 segundos
          setTimeout(() => {
            setThumbnailModal((prev) => ({ ...prev, isOpen: false }));
          }, 3000);

          // No fallar la operación completa si los thumbnails fallan
        }

        // Limpiar autoguardado después de éxito
        clearAutosave();

        // Mostrar toast de éxito
        showToast(
          t("updateSuccess") || "Plantilla actualizada exitosamente",
          "success",
          3000
        );

        // Redirigir a la página de templates después de un breve delay
        setTimeout(() => {
          router.push("/templates");
        }, 1000);
      } else {
        // MODO CREACIÓN: Crear nuevo template
        const { log, ...masterDataWithoutLog } = creationState.data.master;

        // 1. Crear el template master
        const masterResponse = await TemplateAPIService.createTemplate(
          masterDataWithoutLog
        );

        if (!masterResponse.success || !masterResponse.data) {
          throw new Error(
            masterResponse.message || "Error al crear el template master"
          );
        }

        const createdTemplate = masterResponse.data;

        // El backend devuelve 'id' en lugar de '_id'
        const newTemplateId =
          (createdTemplate as any).id || createdTemplate._id;

        // 2. Crear la versión del template usando el ID del template recién creado
        const { log: versionLog, ...versionDataWithoutLog } =
          creationState.data.version;

        // Agregar version_num temporal (el backend lo recalcula automáticamente)
        const versionDataToSend = {
          ...versionDataWithoutLog,
          version_num: 1, // Valor temporal, el backend asigna el correcto
        };

        const versionResponse = await TemplateAPIService.createTemplateVersion(
          newTemplateId,
          versionDataToSend
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || "Error al crear la versión del template"
          );
        }

        // 3. Capturar y guardar thumbnails
        try {
          // Mostrar modal de carga
          setThumbnailModal({
            isOpen: true,
            progress: 0,
            message: "Preparando generación de thumbnails...",
            status: "loading",
            errorMessage: "",
          });

          const { generateAndUploadThumbnails } = await import(
            "../../../../utils/thumbnailCapture"
          );

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
              // Actualizar progreso en el modal
              setThumbnailModal((prev) => ({
                ...prev,
                progress: Math.round((current / total) * 100),
                message,
              }));
            }
          );

          // Actualizar modal a estado de éxito
          setThumbnailModal({
            isOpen: true,
            progress: 100,
            message: "¡Thumbnails generados exitosamente!",
            status: "success",
            errorMessage: "",
          });

          // 4. Actualizar el template con los thumbnails y section_count
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

          // Cerrar modal después de 1.5 segundos
          setTimeout(() => {
            setThumbnailModal((prev) => ({ ...prev, isOpen: false }));
          }, 1500);
        } catch (thumbnailError) {
          console.error("❌ ERROR capturando thumbnails:", thumbnailError);
          console.error(
            "❌ Error stack:",
            thumbnailError instanceof Error
              ? thumbnailError.stack
              : "No stack trace"
          );

          // Mostrar error en el modal
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

          // Cerrar modal después de 3 segundos
          setTimeout(() => {
            setThumbnailModal((prev) => ({ ...prev, isOpen: false }));
          }, 3000);

          // No fallar la operación completa si los thumbnails fallan
        }

        // Limpiar autoguardado después de éxito
        clearAutosave();

        // Mostrar toast de éxito
        showToast(
          t("success") || "Plantilla creada exitosamente",
          "success",
          3000
        );

        // Redirigir a la página de templates después de un breve delay
        setTimeout(() => {
          router.push("/templates");
        }, 1000);
      }
    } catch (error) {
      console.error(
        isEditMode
          ? "Error actualizando plantilla:"
          : "Error creando plantilla:",
        error
      );

      // Mostrar toast de error con el mensaje específico
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error desconocido al crear la plantilla";

      showToast(`${t("error", { error: errorMessage })}`, "error", 6000);

      // NO redirigir, quedarse en el creador para que el usuario pueda corregir
    } finally {
      setIsLoading(false);
    }
  }, [
    creationState.data,
    isCurrentStepValid,
    isEditMode,
    templateId,
    t,
    clearAutosave,
    showToast,
    router,
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/templates"
            className="flex items-center gap-2 text-[#283618]/60 hover:text-[#283618] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t("backToTemplates")}</span>
          </Link>
        </div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#283618]">
                {isEditMode ? t("editTitle") : t("title")}
              </h1>
              <p className="mt-2 text-[#283618]/70">
                {isEditMode ? t("editSubtitle") : t("subtitle")}
              </p>
            </div>
            <AutosaveIndicator lastSaved={lastSaved} />
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <Stepper
            steps={steps}
            currentStepIndex={currentStepIndex}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Main Content */}
        <div className="flex gap-8">
          {/* Left Panel - Form */}
          <div className="flex-1 max-w-2xl">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <StepContent currentStep={currentStepIndex}>
                <BasicInfoStep
                  data={creationState.data}
                  errors={creationState.errors}
                  onDataChange={updateData}
                  onErrorsChange={updateErrors}
                />

                <GeneralConfigStep
                  data={creationState.data}
                  errors={creationState.errors}
                  onDataChange={updateData}
                  onErrorsChange={updateErrors}
                />

                <HeaderFooterStep
                  data={creationState.data}
                  errors={creationState.errors}
                  onDataChange={updateData}
                  onErrorsChange={updateErrors}
                />

                <SectionsStep
                  data={creationState.data}
                  errors={creationState.errors}
                  onDataChange={updateData}
                  onErrorsChange={updateErrors}
                  selectedSectionIndex={selectedSectionIndex}
                  onSectionSelect={setSelectedSectionIndex}
                />
              </StepContent>

              {/* Navigation */}
              <StepNavigation
                currentStep={currentStepIndex}
                totalSteps={steps.length}
                onNext={handleNext}
                onPrevious={handlePrevious}
                onFinish={handleFinish}
                isNextDisabled={!isCurrentStepValid}
                isLoading={isLoading}
                nextLabel={t("navigation.next")}
                previousLabel={t("navigation.previous")}
                finishLabel={
                  isEditMode ? t("navigation.update") : t("navigation.finish")
                }
              />
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 max-w-2xl">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-[#283618]">
                  {t("preview.title")}
                </h2>
                <p className="text-sm text-[#283618]/70">
                  {t("preview.subtitle")}
                </p>
              </div>

              <TemplatePreview
                data={creationState.data}
                selectedSectionIndex={selectedSectionIndex}
                moreInfo={true}
                description={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de generación de thumbnails */}
      <ThumbnailGenerationModal
        isOpen={thumbnailModal.isOpen}
        progress={thumbnailModal.progress}
        message={thumbnailModal.message}
        status={thumbnailModal.status}
        errorMessage={thumbnailModal.errorMessage}
      />
    </div>
  );
}
