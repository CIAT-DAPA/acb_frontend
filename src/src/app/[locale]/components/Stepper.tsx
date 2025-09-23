"use client";

import React, { ReactNode } from "react";
import { CheckCircle } from "lucide-react";

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
      {/* Container for circles and lines */}
      <div className="flex items-center justify-between mb-4">
        {steps.map((step, index) => (
          <React.Fragment key={step.id}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <button
                onClick={() => onStepClick?.(index)}
                disabled={!onStepClick}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
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
            </div>

            {/* Connector Line - positioned to align with circle centers */}
            {index < steps.length - 1 && (
              <div className="flex-1 flex items-center px-4">
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

      {/* Step Titles - separated from circles for better alignment */}
      <div className="flex items-start justify-between">
        {steps.map((step, index) => (
          <React.Fragment key={`title-${step.id}`}>
            <div className="flex flex-col items-center max-w-24">
              <p
                className={`text-xs font-medium text-center leading-tight ${
                  index <= currentStepIndex
                    ? "text-[#283618]"
                    : "text-[#283618]/50"
                }`}
              >
                {step.title}
              </p>
            </div>
            {/* Invisible spacer to match the connector lines */}
            {index < steps.length - 1 && (
              <div className="flex-1 px-4">
                <div className="w-full h-0 opacity-0" />
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
          px-4 py-2 text-sm font-medium rounded-md transition-colors
          ${
            currentStep === 0 || isPreviousDisabled
              ? "text-[#283618]/50 cursor-not-allowed"
              : "border-2 border-[#bc6c25] text-[#283618] hover:border-[#bc6c25]/50 cursor-pointer"
          }
        `}
      >
        ← {previousLabel}
      </button>

      <div className="flex space-x-3">
        {isLastStep ? (
          <button
            type="button"
            onClick={onFinish}
            disabled={isNextDisabled || isLoading}
            className={`
              px-6 py-2 text-sm font-medium rounded-md transition-colors
              ${
                isNextDisabled || isLoading
                  ? "bg-gray-300 text-[#283618]/50 cursor-not-allowed"
                  : "bg-[#bc6c25] text-[#fefae0] hover:bg-[#bc6c25]/90 cursor-pointer"
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
              px-6 py-2 text-sm font-medium rounded-md transition-colors
              ${
                isNextDisabled || isLoading
                  ? "bg-gray-300 text-[#283618]/50 cursor-not-allowed"
                  : "bg-[#bc6c25] text-[#fefae0] hover:bg-[#bc6c25]/90 cursor-pointer"
              }
            `}
          >
            {nextLabel} →
          </button>
        )}
      </div>
    </div>
  );
}
