"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";
import { Stepper, StepConfig } from "../../components/Stepper";
import {
  CreateBulletinData,
  BulletinCreationStep,
  BulletinCreationState,
} from "../../../../types/bulletin";
import {
  TemplateVersion,
  Section,
  Block,
  Field,
} from "../../../../types/template";

import { TemplateSelectionStep } from "./steps/TemplateSelectionStep";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { SectionStep } from "./steps/SectionStep";
import { ExportStep } from "./steps/ExportStep";
import { TemplatePreview } from "../../templates/create/TemplatePreview";
import { CreateTemplateData } from "../../../../types/template";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { TemplateAPIService } from "../../../../services/templateService";
import { BulletinAPIService } from "../../../../services/bulletinService";
import { useToast } from "../../../../components/Toast";
import { btnOutlineSecondary, btnPrimary } from "../../components/ui";

interface FormBulletinPageProps {
  mode?: "create" | "edit";
  bulletinId?: string;
  initialData?: CreateBulletinData;
}

export default function FormBulletinPage({
  mode = "create",
  bulletinId,
  initialData,
}: FormBulletinPageProps) {
  const t = useTranslations("CreateBulletin");
  const { userInfo } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const isEditMode = mode === "edit";

  // Estado de paginación del preview (para sincronizar con CardFieldInput)
  const [previewPageIndex, setPreviewPageIndex] = useState(0);

  // Estado del wizard
  const [creationState, setCreationState] = useState<BulletinCreationState>({
    currentStep: initialData ? "basic-info" : "select-template",
    currentSectionIndex: 0,
    selectedTemplateId: initialData?.master.base_template_master_id,
    selectedTemplateVersionId: initialData?.master.base_template_version_id,
    data: initialData || {
      master: {
        bulletin_name: "",
        status: "draft",
        log: {
          created_at: new Date().toISOString(),
          creator_user_id: "",
          creator_first_name: null,
          creator_last_name: null,
        },
        base_template_master_id: "",
        base_template_version_id: "",
        access_config: {
          access_type: "public",
          allowed_groups: [],
        },
      },
      version: {
        version_num: 1,
        commit_message: "",
        log: {
          created_at: new Date().toISOString(),
          creator_user_id: "",
          creator_first_name: null,
          creator_last_name: null,
        },
        data: {
          style_config: {},
          header_config: { fields: [] },
          footer_config: { fields: [] },
          sections: [],
        },
      },
    },
    errors: {},
    isValid: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Cargar template seleccionado y llenar estructura inicial
  const loadTemplateVersion = useCallback(
    async (templateId: string) => {
      setIsLoading(true);
      try {
        const response = await TemplateAPIService.getCurrentVersion(templateId);

        if (response.success && response.data) {
          const { current_version, master } = response.data;

          // Verificar que existe el content
          if (!current_version.content) {
            console.error(
              "Response does not have content property:",
              current_version
            );
            throw new Error(
              "La respuesta del template no tiene la estructura esperada"
            );
          }

          // Extraer información de la versión actual
          const versionId = current_version._id;
          const content = current_version.content;

          // Validar que versionId existe (es obligatorio)
          if (!versionId) {
            console.error("Template version ID is missing");
            throw new Error(
              "No se pudo obtener el ID de la versión del template"
            );
          }

          // Helper para inicializar el valor de un campo según su tipo
          const initializeFieldValue = (field: Field) => {
            if (field.type === "list") {
              // Para campos de tipo list, inicializar como array vacío
              return field.value || [];
            }
            if (field.type === "text" || field.type === "text_with_icon") {
              // Para campos de texto, inicializar como string vacío
              return field.value || "";
            }
            return field.value || null;
          };

          // Inicializar datos del boletín con la estructura del template
          setCreationState((prev) => ({
            ...prev,
            selectedTemplateId: templateId,
            selectedTemplateVersionId: versionId,
            data: {
              ...prev.data,
              master: {
                ...prev.data.master,
                base_template_master_id: templateId,
                base_template_version_id: versionId,
                access_config: master.access_config || {
                  access_type: "public",
                  allowed_groups: [],
                },
              },
              version: {
                ...prev.data.version,
                data: {
                  style_config: content.style_config,
                  header_config: content.header_config
                    ? {
                        ...content.header_config,
                        fields: content.header_config.fields.map(
                          (field: Field) => ({
                            ...field,
                            value: initializeFieldValue(field),
                          })
                        ),
                      }
                    : { fields: [] },
                  footer_config: content.footer_config
                    ? {
                        ...content.footer_config,
                        fields: content.footer_config.fields.map(
                          (field: Field) => ({
                            ...field,
                            value: initializeFieldValue(field),
                          })
                        ),
                      }
                    : { fields: [] },
                  sections: content.sections.map((section: Section) => ({
                    ...section,
                    header_config: section.header_config
                      ? {
                          ...section.header_config,
                          fields: section.header_config.fields.map(
                            (field: Field) => ({
                              ...field,
                              value: initializeFieldValue(field),
                            })
                          ),
                        }
                      : undefined,
                    footer_config: section.footer_config
                      ? {
                          ...section.footer_config,
                          fields: section.footer_config.fields.map(
                            (field: Field) => ({
                              ...field,
                              value: initializeFieldValue(field),
                            })
                          ),
                        }
                      : undefined,
                    blocks: section.blocks.map((block: Block) => ({
                      ...block,
                      fields: block.fields.map((field: Field) => ({
                        ...field,
                        value: initializeFieldValue(field),
                      })),
                    })),
                  })),
                },
              },
            },
          }));
        }
      } catch (error) {
        console.error("Error loading template version:", error);
        showToast(t("errorLoadingTemplate"), "error");
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, t]
  );

  // Función para actualizar datos del boletín
  const updateBulletinData = useCallback(
    (updater: (prev: CreateBulletinData) => CreateBulletinData) => {
      setCreationState((prev) => ({
        ...prev,
        data: updater(prev.data),
      }));
    },
    []
  );

  // Navegar a un paso específico
  const goToStep = useCallback((step: BulletinCreationStep) => {
    setCreationState((prev) => {
      // Extraer el índice de la sección si el paso es "section-N"
      let sectionIndex = prev.currentSectionIndex;
      if (step.startsWith("section-")) {
        const match = step.match(/section-(\d+)/);
        if (match) {
          sectionIndex = parseInt(match[1], 10);
        }
      }

      return {
        ...prev,
        currentStep: step,
        currentSectionIndex: sectionIndex,
      };
    });
  }, []);

  // Configuración de los pasos del stepper
  const stepConfigs = useMemo((): StepConfig[] => {
    const baseSteps: StepConfig[] = [];

    // En modo edición, no incluimos el paso de seleccionar template
    if (!isEditMode) {
      baseSteps.push({
        id: "select-template",
        title: t("selectTemplate.title"),
        description: t("selectTemplate.description"),
      });
    }

    baseSteps.push({
      id: "basic-info",
      title: t("basicInfo.title"),
      description: t("basicInfo.description"),
    });

    // Agregar un paso por cada sección
    const sectionSteps: StepConfig[] =
      creationState.data.version.data.sections.map((section, index) => ({
        id: `section-${index}`,
        title: section.display_name || `${t("section.title")} ${index + 1}`,
        description: t("section.description"),
      }));

    // Agregar paso de exportación al final
    const exportStep: StepConfig = {
      id: "export",
      title: t("export.title"),
      description: t("export.description"),
    };

    return [...baseSteps, ...sectionSteps, exportStep];
  }, [t, creationState.data.version.data.sections, isEditMode]);

  // Obtener índice del paso actual
  const currentStepIndex = useMemo(() => {
    return stepConfigs.findIndex(
      (step) => step.id === creationState.currentStep
    );
  }, [stepConfigs, creationState.currentStep]);

  // Validar paso actual
  const isCurrentStepValid = useMemo(() => {
    switch (creationState.currentStep) {
      case "select-template":
        return !!creationState.selectedTemplateId;
      case "basic-info":
        return creationState.data.master.bulletin_name.trim().length > 0;
      case "export":
        return true; // El paso de exportación siempre es válido
      default:
        // Para pasos de sección
        if (creationState.currentStep.startsWith("section-")) {
          return true; // Las secciones son opcionales
        }
        return false;
    }
  }, [
    creationState.currentStep,
    creationState.selectedTemplateId,
    creationState.data.master.bulletin_name,
  ]);

  // Navegación: siguiente paso
  const handleNext = useCallback(() => {
    if (!isCurrentStepValid) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepConfigs.length) {
      goToStep(stepConfigs[nextIndex].id as BulletinCreationStep);
    }
  }, [currentStepIndex, stepConfigs, goToStep, isCurrentStepValid]);

  // Navegación: paso anterior
  const handlePrevious = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(stepConfigs[prevIndex].id as BulletinCreationStep);
    }
  }, [currentStepIndex, stepConfigs, goToStep]);

  // Click en un paso del stepper
  const handleStepClick = useCallback(
    (stepIndex: number) => {
      // Solo permitir navegar a pasos si ya se seleccionó template
      if (stepIndex === 0 || creationState.selectedTemplateId) {
        goToStep(stepConfigs[stepIndex].id as BulletinCreationStep);
      }
    },
    [stepConfigs, goToStep, creationState.selectedTemplateId]
  );

  // Finalizar creación del boletín
  const handleFinish = useCallback(async () => {
    if (!isCurrentStepValid) return;

    setIsLoading(true);
    try {
      if (isEditMode && bulletinId) {
        // MODO EDICIÓN: Actualizar bulletin existente
        const { log: masterLog, ...masterDataWithoutLog } =
          creationState.data.master;

        // 1. Actualizar bulletin master
        const masterResponse = await BulletinAPIService.updateBulletin(
          bulletinId,
          masterDataWithoutLog
        );

        if (!masterResponse.success) {
          throw new Error(
            masterResponse.message || "Error al actualizar el boletín"
          );
        }

        const { log: versionLog, ...versionDataWithoutLog } =
          creationState.data.version;

        // 2. Crear nueva versión del boletín
        const versionResponse = await BulletinAPIService.createBulletinVersion(
          bulletinId,
          versionDataWithoutLog
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message ||
              "Error al crear la versión del boletín actualizado"
          );
        }

        showToast(t("updateSuccess"), "success");
      } else {
        // MODO CREACIÓN: Crear nuevo bulletin
        const { log: masterLog, ...masterDataWithoutLog } =
          creationState.data.master;

        const masterResponse = await BulletinAPIService.createBulletin(
          masterDataWithoutLog
        );

        if (!masterResponse.success || !masterResponse.data) {
          throw new Error(
            masterResponse.message || "Error al crear el boletín"
          );
        }

        const newBulletinId =
          (masterResponse.data as any).id || masterResponse.data._id;

        const { log: versionLog, ...versionDataWithoutLog } =
          creationState.data.version;

        // 2. Crear primera versión del boletín
        const versionResponse = await BulletinAPIService.createBulletinVersion(
          newBulletinId,
          versionDataWithoutLog
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || "Error al crear la versión del boletín"
          );
        }

        showToast(t("success"), "success");
      }

      // Redirigir a la lista de boletines
      router.push("/bulletins");
    } catch (error) {
      console.error("Error saving bulletin:", error);
      showToast(error instanceof Error ? error.message : t("error"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    isCurrentStepValid,
    creationState.data,
    showToast,
    t,
    router,
    isEditMode,
    bulletinId,
  ]);

  // Convertir bulletinData a CreateTemplateData para el preview
  const previewData = useMemo((): CreateTemplateData | null => {
    const headerFields = creationState.data.version.data.header_config?.fields;

    if (!creationState.selectedTemplateId) {
      return null;
    }

    // Determinar qué secciones mostrar según el paso actual
    let sectionsToShow = creationState.data.version.data.sections;

    // Si estamos en un paso de sección específica, mostrar solo esa sección
    if (creationState.currentStep.startsWith("section-")) {
      const currentSection =
        creationState.data.version.data.sections[
          creationState.currentSectionIndex
        ];
      if (currentSection) {
        sectionsToShow = [currentSection];
      }
    }

    return {
      master: {
        template_name:
          creationState.data.master.bulletin_name || "Vista previa",
        description: "",
        status: "active",
        log: creationState.data.master.log,
        access_config: {
          access_type: "public",
          allowed_groups: [],
        },
      },
      version: {
        version_num: 1,
        commit_message: "",
        log: creationState.data.version.log,
        content: {
          style_config: creationState.data.version.data.style_config || {},
          header_config: creationState.data.version.data.header_config,
          footer_config: creationState.data.version.data.footer_config,
          sections: sectionsToShow,
        },
      },
    };
  }, [creationState]);

  // Renderizar contenido del paso actual
  const renderStepContent = () => {
    switch (creationState.currentStep) {
      case "select-template":
        return (
          <TemplateSelectionStep
            onSelectTemplate={(templateId) => {
              loadTemplateVersion(templateId);
            }}
            selectedTemplateId={creationState.selectedTemplateId}
          />
        );

      case "basic-info":
        return (
          <BasicInfoStep
            bulletinData={creationState.data}
            onUpdate={updateBulletinData}
          />
        );

      case "export":
        return (
          <ExportStep
            previewData={previewData!}
            bulletinName={creationState.data.master.bulletin_name}
          />
        );

      default:
        // Pasos de sección
        if (creationState.currentStep.startsWith("section-")) {
          const sectionIndex = parseInt(
            creationState.currentStep.replace("section-", "")
          );

          return (
            <SectionStep
              bulletinData={creationState.data}
              sectionIndex={sectionIndex}
              onUpdate={updateBulletinData}
              currentPageIndex={previewPageIndex}
              onPageChange={setPreviewPageIndex}
            />
          );
        }
        return null;
    }
  };

  const isLastStep = currentStepIndex === stepConfigs.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/bulletins"
            className="inline-flex items-center gap-2 text-[#283618] hover:text-[#606c38] transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>{t("backToBulletins")}</span>
          </Link>
        </div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#283618]">
            {isEditMode ? "Editar Boletín" : t("title")}
          </h1>
          <p className="text-[#606c38] mt-2">
            {isEditMode ? "Edita la información del boletín" : t("subtitle")}
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <Stepper
            steps={stepConfigs}
            currentStepIndex={currentStepIndex}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Main Content: Form and Preview */}
        {creationState.currentStep === "export" ? (
          // Layout de ancho completo para el paso de exportación
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Step Content */}
            <div className="min-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#283618]"></div>
                </div>
              ) : (
                renderStepContent()
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 mt-6 border-t">
              <button
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className={`${btnOutlineSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />{" "}
                {t("navigation.previous")}
              </button>

              <button
                onClick={handleFinish}
                disabled={!isCurrentStepValid || isLoading}
                className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? t("navigation.creating") : t("navigation.finish")}
              </button>
            </div>
          </div>
        ) : (
          // Layout de dos columnas para los otros pasos
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Step Content */}
              <div className="min-h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#283618]"></div>
                  </div>
                ) : (
                  renderStepContent()
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 mt-6 border-t">
                <button
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                  className={`${btnOutlineSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />{" "}
                  {t("navigation.previous")}
                </button>

                {isLastStep ? (
                  <button
                    onClick={handleFinish}
                    disabled={!isCurrentStepValid || isLoading}
                    className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isLoading
                      ? t("navigation.creating")
                      : t("navigation.finish")}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    disabled={!isCurrentStepValid}
                    className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {t("navigation.next")}{" "}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8 self-start">
              <h3 className="text-xl font-semibold text-[#283618] mb-4">
                {t("preview.title")}
              </h3>
              {previewData ? (
                <div
                  id="bulletin-preview-container"
                  className="rounded-lg overflow-hidden"
                >
                  <TemplatePreview
                    data={previewData}
                    moreInfo={true}
                    description={true}
                    forceGlobalHeader={
                      creationState.currentStep === "basic-info"
                    }
                    currentPageIndex={previewPageIndex}
                    onPageChange={setPreviewPageIndex}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-[#606c38]">
                  {t("preview.selectTemplate")}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
