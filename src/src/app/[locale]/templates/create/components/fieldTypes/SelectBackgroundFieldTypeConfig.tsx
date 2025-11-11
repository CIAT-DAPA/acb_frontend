"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus, Trash2 } from "lucide-react";
import { btnOutlineSecondary } from "@/app/[locale]/components/ui";
import { VisualResourceSelector } from "../VisualResourceSelector";
import Image from "next/image";

// Constantes CSS reutilizables
const INPUT_CLASS =
  "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm";
const LABEL_CLASS = "block text-sm font-medium text-[#283618]/70";
const LABEL_XS_CLASS = "block text-xs font-medium text-gray-700 mb-1";
const BUTTON_DANGER_CLASS =
  "px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors";

interface SelectBackgroundFieldConfig {
  options: string[];
  backgrounds_url: string[];
  allow_multiple?: boolean;
}

export const SelectBackgroundFieldTypeConfig: React.FC<
  BaseFieldTypeConfigProps
> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");

  // Helper para obtener config tipada
  const config =
    (currentField.field_config as SelectBackgroundFieldConfig) || {};
  const options = config.options || [];
  const backgroundsUrl = config.backgrounds_url || [];

  const [showBackgroundSelectorForIndex, setShowBackgroundSelectorForIndex] =
    useState<number | null>(null);

  // Handlers simplificados
  const addOption = () => {
    updateFieldConfig({
      options: [...options, ""],
      backgrounds_url: [...backgroundsUrl, ""],
    });
  };

  const removeOption = (index: number) => {
    updateFieldConfig({
      options: options.filter((_, i) => i !== index),
      backgrounds_url: backgroundsUrl.filter((_, i) => i !== index),
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    updateFieldConfig({
      options: newOptions,
      backgrounds_url: backgroundsUrl.slice(0, newOptions.length),
    });
  };

  const updateBackground = (index: number, value: string) => {
    const newBackgroundsUrl = [...backgroundsUrl];
    newBackgroundsUrl[index] = value;
    updateFieldConfig({ backgrounds_url: newBackgroundsUrl });
  };

  // Componente para preview de imagen de fondo
  const BackgroundPreview = ({
    backgroundUrl,
    index,
  }: {
    backgroundUrl: string;
    index: number;
  }) => {
    if (backgroundUrl) {
      return (
        <div className="relative w-full h-20 border border-gray-300 rounded-md overflow-hidden bg-gray-100">
          <Image
            src={backgroundUrl}
            alt={`${t("selectBackgroundConfig.backgroundLabel")} ${index + 1}`}
            fill
            className="object-cover"
          />
        </div>
      );
    }
    return (
      <div className="w-full h-20 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-50">
        <span className="text-xs text-gray-400">
          {t("selectBackgroundConfig.noImage")}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Opciones e imágenes de fondo */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={LABEL_CLASS}>
            {t("selectBackgroundConfig.optionsAndBackgrounds")}
          </label>
          <button
            type="button"
            onClick={addOption}
            className={`${btnOutlineSecondary} text-sm`}
          >
            <Plus className="w-4 h-4 mr-1" /> {t("actions.addOption")}
          </button>
        </div>

        <div className="space-y-3">
          {options.map((option, index) => (
            <div
              key={index}
              className="grid grid-cols-12 gap-3 items-start p-3 border border-gray-200 rounded-md bg-gray-50"
            >
              {/* Label de la opción */}
              <div className="col-span-4">
                <label className={LABEL_XS_CLASS}>
                  {t("selectBackgroundConfig.optionLabel")} {index + 1}
                </label>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className={INPUT_CLASS}
                  placeholder={t("selectBackgroundConfig.optionPlaceholder")}
                />
              </div>

              {/* Vista previa del fondo */}
              <div className="col-span-4">
                <label className={LABEL_XS_CLASS}>
                  {t("selectBackgroundConfig.backgroundImage")}
                </label>
                <BackgroundPreview
                  backgroundUrl={backgroundsUrl[index]}
                  index={index}
                />
              </div>

              {/* Botones de acción */}
              <div className="col-span-4 flex items-end justify-end gap-2 h-full pb-1">
                <button
                  type="button"
                  onClick={() => setShowBackgroundSelectorForIndex(index)}
                  className={`${btnOutlineSecondary} text-xs px-3 py-2 whitespace-nowrap`}
                >
                  {backgroundsUrl[index]
                    ? t("selectBackgroundConfig.change")
                    : t("selectBackgroundConfig.select")}
                </button>
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className={BUTTON_DANGER_CLASS}
                  title={t("actions.remove")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {options.length === 0 && (
            <div className="text-center py-8 text-gray-500 text-sm border-2 border-dashed border-gray-300 rounded-md">
              {t("selectBackgroundConfig.noOptionsMessage")}
            </div>
          )}
        </div>
      </div>

      {/* Modal del selector de imágenes de fondo */}
      <VisualResourceSelector
        isOpen={showBackgroundSelectorForIndex !== null}
        onClose={() => setShowBackgroundSelectorForIndex(null)}
        onSelect={(url) => {
          if (showBackgroundSelectorForIndex !== null) {
            updateBackground(showBackgroundSelectorForIndex, url);
          }
          setShowBackgroundSelectorForIndex(null);
        }}
        title={`${t("selectBackgroundConfig.selectBackgroundFor")} ${
          (showBackgroundSelectorForIndex ?? 0) + 1
        }`}
        resourceType="image"
        selectedUrl={
          showBackgroundSelectorForIndex !== null
            ? backgroundsUrl[showBackgroundSelectorForIndex]
            : undefined
        }
      />
    </div>
  );
};
