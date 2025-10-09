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
        icon_url: "",
        blocks: [],
      },
      status: "active",
      log: {
        created_at: new Date().toISOString(),
        creator_user_id: "",
        creator_first_name: null,
        creator_last_name: null,
      },
    },
    errors: {},
    isValid: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Actualizar creator_user_id cuando userInfo esté disponible
  useEffect(() => {
    if (userInfo?.sub && !creationState.data.log?.creator_user_id) {
      setCreationState((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          log: {
            created_at: new Date().toISOString(),
            creator_user_id: userInfo.sub!,
            creator_first_name: userInfo.given_name || null,
            creator_last_name: userInfo.family_name || null,
          },
        },
      }));
    }
  }, [userInfo, creationState.data.log?.creator_user_id]);

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

      // Validar grupos si es privado
      if (
        data.access_config.access_type === "private" &&
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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/cards"
                className="p-2 text-[#283618] hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-[#283618]">
                  {isEditMode ? t("titleEdit") : t("title")}
                </h1>
                <p className="text-sm text-[#283618]/60">{t("subtitle")}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Form Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              {/* Stepper */}
              <Stepper
                steps={steps}
                currentStepIndex={getCurrentStepIndex()}
                onStepClick={handleStepChange}
              />

              {/* Step Content */}
              <div className="mt-8">
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
              </div>

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

          {/* Preview Section */}
          <div className="lg:sticky lg:top-24 h-fit">
            <CardPreview data={creationState.data} />
          </div>
        </div>
      </div>
    </div>
  );
}
