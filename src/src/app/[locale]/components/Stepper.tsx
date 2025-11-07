"use client";

import React, { ReactNode } from "react";
import { ArrowLeft, ArrowRight, CheckCircle } from "lucide-react";
import { btnPrimary, btnOutlineSecondary } from "./ui";

export interface StepConfig {
  id: string;
  title: string;
  description: string;
  isCompleted?: boolean;
  isActive?: boolean;
}

interface StepperProps {
  steps: StepConfig[];
  currentStepIndex: number;
  onStepClick?: (stepIndex: number) => void;
  className?: string;
}

export function Stepper({
  steps,
  currentStepIndex,
  onStepClick,
  className = "",
}: StepperProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="flex items-start justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Container - Circle and Label vertically aligned */}
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => onStepClick?.(index)}
                disabled={!onStepClick}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all flex-shrink-0
                  ${
                    index < currentStepIndex
                      ? "bg-[#283618]/70 border-[#283618]/70 text-[#fefae0]"
                      : index === currentStepIndex
                      ? "border-[#283618] bg-[#283618] text-[#fefae0]"
                      : "border-gray-300 bg-white text-[#283618]/50"
                  }
                  ${
                    onStepClick
                      ? "cursor-pointer hover:opacity-80"
                      : "cursor-default"
                  }
                `}
              >
                {index < currentStepIndex ? (
                  <CheckCircle size={20} />
                ) : (
                  <span className="text-sm font-semibold">{index + 1}</span>
                )}
              </button>

              {/* Step Label */}
              <p
                className={`text-xs font-medium text-center leading-tight max-w-24 ${
                  index <= currentStepIndex
                    ? "text-[#283618]"
                    : "text-[#283618]/50"
                }`}
              >
                {step.title}
              </p>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className="flex-1 flex items-start pt-5 px-4">
                <div
                  className={`
                    w-full h-0.5 transition-colors
                    ${index < currentStepIndex ? "bg-[#283618]" : "bg-gray-300"}
                  `}
                />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

interface StepContentProps {
  currentStep: number;
  children: ReactNode[];
  className?: string;
}

export function StepContent({
  currentStep,
  children,
  className = "",
}: StepContentProps) {
  return (
    <div className={`mt-8 ${className}`}>{children[currentStep] || null}</div>
  );
}

interface StepNavigationProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onFinish?: () => void;
  isNextDisabled?: boolean;
  isPreviousDisabled?: boolean;
  nextLabel?: string;
  previousLabel?: string;
  finishLabel?: string;
  isLoading?: boolean;
}

export function StepNavigation({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  onFinish,
  isNextDisabled = false,
  isPreviousDisabled = false,
  nextLabel = "Siguiente",
  previousLabel = "Anterior",
  finishLabel = "Finalizar",
  isLoading = false,
}: StepNavigationProps) {
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="flex justify-between pt-6 border-t border-gray-200">
      <button
        type="button"
        onClick={onPrevious}
        disabled={isPreviousDisabled || currentStep === 0}
        className={`
          ${btnOutlineSecondary}
          ${
            currentStep === 0 || isPreviousDisabled
              ? "opacity-50 cursor-not-allowed pointer-events-none"
              : ""
          }
        `}
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> {previousLabel}
      </button>

      <div className="flex space-x-3">
        {isLastStep ? (
          <button
            type="button"
            onClick={onFinish}
            disabled={isNextDisabled || isLoading}
            className={`
              ${btnPrimary}
              ${
                isNextDisabled || isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
          >
            {isLoading ? "Creando..." : finishLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={isNextDisabled || isLoading}
            className={`
              ${btnPrimary}
              ${
                isNextDisabled || isLoading
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            `}
          >
            {nextLabel} <ArrowRight className="w-4 h-4 ml-1" />
          </button>
        )}
      </div>
    </div>
  );
}
