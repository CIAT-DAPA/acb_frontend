"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";
import {
  Stepper,
  StepContent,
  StepNavigation,
  StepConfig,
} from "../../components/Stepper";
import {
  CreateCardData,
  CardCreationStep,
  CardCreationState,
} from "../../../../types/card";

import { BasicInfoStep } from "./steps/BasicInfoStep";
import { ContentStep } from "./steps/ContentStep";
import { CardPreview } from "./CardPreview";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CardAPIService } from "../../../../services/cardService";
import { useToast } from "../../../../components/Toast";

interface FormCardPageProps {
  mode?: "create" | "edit";
  cardId?: string;
  initialData?: CreateCardData;
}

export default function FormCardPage({
  mode = "create",
  cardId,
  initialData,
}: FormCardPageProps) {
  const t = useTranslations("CreateCard");
  const { userInfo } = useAuth();
  const router = useRouter();
  const { showToast } = useToast();
  const isEditMode = mode === "edit";

  // Estado del wizard
  const [creationState, setCreationState] = useState<CardCreationState>({
    currentStep: "basic-info",
    data: initialData || {
      card_name: "",
      card_type: "general",
      templates_master_ids: [],
      access_config: {
        access_type: "public",
        allowed_groups: [],
      },
      content: {
        background_url: "",
        blocks: [],
      },
      status: "active",
    },
    errors: {},
    isValid: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Función para actualizar datos
  const handleDataChange = useCallback(
    (updater: (prevData: CreateCardData) => CreateCardData) => {
      setCreationState((prev) => ({
        ...prev,
        data: updater(prev.data),
      }));
    },
    []
  );

  // Función para actualizar errores
  const handleErrorsChange = useCallback((errors: Record<string, string[]>) => {
    setCreationState((prev) => ({
      ...prev,
      errors,
    }));
  }, []);

  // Función para cambiar de paso
  const handleStepChange = useCallback((stepIndex: number) => {
    const steps: CardCreationStep[] = ["basic-info", "content"];
    setCreationState((prev) => ({
      ...prev,
      currentStep: steps[stepIndex],
    }));
  }, []);

  // Obtener índice del paso actual
  const getCurrentStepIndex = (): number => {
    const steps: CardCreationStep[] = ["basic-info", "content"];
    return steps.indexOf(creationState.currentStep);
  };

  // Validación del paso actual
  const validateCurrentStep = useCallback((): boolean => {
    const { currentStep, data } = creationState;
    const newErrors: Record<string, string[]> = {};

    if (currentStep === "basic-info") {
      // Validar nombre
      if (!data.card_name.trim()) {
        newErrors.card_name = [t("basicInfo.errors.nameRequired")];
      }

      // Validar tipo
      if (!data.card_type) {
        newErrors.card_type = [t("basicInfo.errors.typeRequired")];
      }

      // Validar grupos si es restringido
      if (
        data.access_config.access_type === "restricted" &&
        (!data.access_config.allowed_groups ||
          data.access_config.allowed_groups.length === 0)
      ) {
        newErrors.allowed_groups = [t("basicInfo.errors.groupsRequired")];
      }
    } else if (currentStep === "content") {
      // Validar que haya al menos un bloque
      if (data.content.blocks.length === 0) {
        newErrors.blocks = [t("content.errors.blocksRequired")];
      }
    }

    handleErrorsChange(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [creationState, t, handleErrorsChange]);

  // Función para avanzar al siguiente paso
  const handleNext = useCallback(() => {
    if (!validateCurrentStep()) {
      return;
    }

    const steps: CardCreationStep[] = ["basic-info", "content"];
    const currentIndex = steps.indexOf(creationState.currentStep);

    if (currentIndex < steps.length - 1) {
      handleStepChange(currentIndex + 1);
    }
  }, [creationState.currentStep, validateCurrentStep, handleStepChange]);

  // Función para retroceder al paso anterior
  const handleBack = useCallback(() => {
    const steps: CardCreationStep[] = ["basic-info", "content"];
    const currentIndex = steps.indexOf(creationState.currentStep);

    if (currentIndex > 0) {
      handleStepChange(currentIndex - 1);
    }
  }, [creationState.currentStep, handleStepChange]);

  // Función para guardar la card
  const handleSave = useCallback(async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsLoading(true);

    try {
      const response =
        isEditMode && cardId
          ? await CardAPIService.updateCard(cardId, creationState.data)
          : await CardAPIService.createCard(creationState.data);

      if (response.success) {
        showToast(
          isEditMode
            ? t("messages.updateSuccess")
            : t("messages.createSuccess"),
          "success",
          3000
        );
        router.push("/cards");
      } else {
        throw new Error(response.message || "Error al guardar la card");
      }
    } catch (error) {
      console.error("Error saving card:", error);
      showToast(
        t("messages.saveError", {
          error: error instanceof Error ? error.message : "Error desconocido",
        }),
        "error",
        5000
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    creationState.data,
    isEditMode,
    cardId,
    validateCurrentStep,
    t,
    router,
    showToast,
  ]);

  // Configuración de los pasos del stepper
  const steps: StepConfig[] = [
    {
      id: "basic-info",
      title: t("steps.basicInfo"),
      description: t("steps.basicInfoDesc"),
    },
    {
      id: "content",
      title: t("steps.content"),
      description: t("steps.contentDesc"),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/cards"
            className="flex items-center gap-2 text-[#283618]/60 hover:text-[#283618] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span>{t("backToCards")}</span>
          </Link>
        </div>
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#283618]">
                {isEditMode ? t("titleEdit") : t("title")}
              </h1>
              <p className="mt-2 text-[#283618]/70">{t("subtitle")}</p>
            </div>
          </div>
        </div>
        {/* Stepper */}
        <div className="mb-8">
          <Stepper
            steps={steps}
            currentStepIndex={getCurrentStepIndex()}
            onStepClick={handleStepChange}
          />
        </div>
        {/* Main Content */}
        <div className="flex gap-8">
          {/* Left Panel - Form */}
          <div className="flex-1 max-w-2xl">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <StepContent currentStep={getCurrentStepIndex()}>
                {creationState.currentStep === "basic-info" && (
                  <BasicInfoStep
                    data={creationState.data}
                    errors={creationState.errors}
                    onDataChange={handleDataChange}
                    onErrorsChange={handleErrorsChange}
                  />
                )}

                {creationState.currentStep === "content" && (
                  <ContentStep
                    data={creationState.data}
                    errors={creationState.errors}
                    onDataChange={handleDataChange}
                    onErrorsChange={handleErrorsChange}
                  />
                )}
              </StepContent>
              {/* Navigation */}
              <StepNavigation
                currentStep={getCurrentStepIndex()}
                totalSteps={steps.length}
                onNext={handleNext}
                onPrevious={handleBack}
                onFinish={handleSave}
                isLoading={isLoading}
                nextLabel={t("actions.next")}
                previousLabel={t("actions.back")}
                finishLabel={
                  isEditMode ? t("actions.update") : t("actions.create")
                }
              />
            </div>
          </div>

          {/* Right Panel - Preview Section */}
          <div className="lg:sticky lg:top-24 h-fit">
            <CardPreview data={creationState.data} />
          </div>
        </div>
      </div>
    </div>
  );
}
