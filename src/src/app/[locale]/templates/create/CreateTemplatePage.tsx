"use client";

import React, { useState, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
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

// Componentes de paso (los crearemos después)
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { GeneralConfigStep } from "./steps/GeneralConfigStep";
import { HeaderFooterStep } from "./steps/HeaderFooterStep";
import { SectionsStep } from "./steps/SectionsStep";
import { TemplatePreview } from "./TemplatePreview";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface CreateTemplatePageProps {
  // Podríamos recibir props como grupos disponibles, usuario actual, etc.
  // Por ahora no necesitamos props específicos
}

export default function CreateTemplatePage({}: CreateTemplatePageProps) {
  const t = useTranslations("CreateTemplate");

  // Estado del wizard
  const [creationState, setCreationState] = useState<TemplateCreationState>({
    currentStep: "basic-info",
    data: {
      master: {
        template_name: "",
        description: "",
        status: "borrador",
        access_config: {
          access_type: "public",
          allowed_groups: [],
        },
      },
      version: {
        version_num: 1,
        commit_message: "Versión inicial",
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

  const [isLoading, setIsLoading] = useState(false);

  // Configuración de pasos
  const steps: StepConfig[] = useMemo(
    () => [
      {
        id: "basic-info",
        title: t("steps.basicInfo.title", { default: "Info Básica" }),
        description: t("steps.basicInfo.description", {
          default: "Nombre y descripción",
        }),
      },
      {
        id: "general-config",
        title: t("steps.generalConfig.title", { default: "Config General" }),
        description: t("steps.generalConfig.description", {
          default: "Estilos globales",
        }),
      },
      {
        id: "header-footer",
        title: t("steps.headerFooter.title", { default: "Header/Footer" }),
        description: t("steps.headerFooter.description", {
          default: "Encabezados y pie",
        }),
      },
      {
        id: "sections",
        title: t("steps.sections.title", { default: "Secciones" }),
        description: t("steps.sections.description", {
          default: "Contenido principal",
        }),
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
          data.master.template_name.trim() && data.master.description.trim()
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

  // Finalizar creación
  const handleFinish = useCallback(async () => {
    if (!isCurrentStepValid) return;

    setIsLoading(true);
    try {
      // Aquí iría la llamada a la API para crear la plantilla
      console.log("Creando plantilla:", creationState.data);

      // Simular API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Redirigir o mostrar mensaje de éxito
      alert(
        t("success.templateCreated", {
          default: "Plantilla creada exitosamente",
        })
      );
    } catch (error) {
      console.error("Error creando plantilla:", error);
      alert(
        t("error.createFailed", { default: "Error al crear la plantilla" })
      );
    } finally {
      setIsLoading(false);
    }
  }, [creationState.data, isCurrentStepValid, t]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {t("title", { default: "Crear Nueva Plantilla" })}
          </h1>
          <p className="mt-2 text-gray-600">
            {t("subtitle", {
              default:
                "Configura tu plantilla paso a paso con vista previa en tiempo real",
            })}
          </p>
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
                nextLabel={t("navigation.next", { default: "Siguiente" })}
                previousLabel={t("navigation.previous", {
                  default: "Anterior",
                })}
                finishLabel={t("navigation.finish", {
                  default: "Crear Plantilla",
                })}
              />
            </div>
          </div>

          {/* Right Panel - Preview */}
          <div className="flex-1 max-w-2xl">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8">
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t("preview.title", { default: "Vista Previa" })}
                </h2>
                <p className="text-sm text-gray-600">
                  {t("preview.subtitle", {
                    default: "Ve cómo queda tu plantilla en tiempo real",
                  })}
                </p>
              </div>

              <TemplatePreview data={creationState.data} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
