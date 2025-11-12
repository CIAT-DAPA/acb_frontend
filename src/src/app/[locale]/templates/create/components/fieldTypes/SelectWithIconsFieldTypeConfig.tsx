"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus } from "lucide-react";
import {
  btnOutlineSecondary,
  inputXsClass,
  labelClass,
  labelXsClass,
  helpTextClass,
  checkboxClass,
  iconContainerClass,
} from "@/app/[locale]/components/ui";
import { VisualResourceSelector } from "../VisualResourceSelector";

const IMAGE_ERROR_SRC = "/assets/img/imageNotFound.png";

interface SelectWithIconsFieldConfig {
  options: string[];
  icons_url: string[];
  allow_multiple?: boolean;
  show_label?: boolean;
}

export const SelectWithIconsFieldTypeConfig: React.FC<
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
    (currentField.field_config as SelectWithIconsFieldConfig) || {};
  const options = config.options || [];
  const iconsUrl = config.icons_url || [];

  const [showIconSelectorForIndex, setShowIconSelectorForIndex] = useState<
    number | null
  >(null);

  // Handlers simplificados
  const addOption = () => {
    updateFieldConfig({
      options: [...options, ""],
      icons_url: [...iconsUrl, ""],
    });
  };

  const removeOption = (index: number) => {
    updateFieldConfig({
      options: options.filter((_, i) => i !== index),
      icons_url: iconsUrl.filter((_, i) => i !== index),
    });
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    updateFieldConfig({
      options: newOptions,
      icons_url: iconsUrl.slice(0, newOptions.length),
    });
  };

  const updateIcon = (index: number, value: string) => {
    const newIconsUrl = [...iconsUrl];
    newIconsUrl[index] = value;
    updateFieldConfig({ icons_url: newIconsUrl });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = IMAGE_ERROR_SRC;
  };

  // Componente para checkbox con help text
  const CheckboxOption = ({
    checked,
    onChange,
    label,
    helpText,
  }: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    helpText: string;
  }) => (
    <div>
      <label className="flex items-center text-sm">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className={checkboxClass}
        />
        {label}
      </label>
      <p className={helpTextClass}>{helpText}</p>
    </div>
  );

  // Componente para mostrar icono seleccionado
  const SelectedIconDisplay = ({
    iconUrl,
    index,
    onChangeClick,
  }: {
    iconUrl: string;
    index: number;
    onChangeClick: () => void;
  }) => (
    <div className={`${iconContainerClass} bg-green-50 border-green-200`}>
      <img
        src={iconUrl}
        alt={`${t("selectWithIconsConfig.optionLabel")} ${index + 1}`}
        className="w-6 h-6 object-contain"
        onError={handleImageError}
      />
      <span className="text-xs text-green-700 flex-1 truncate">
        {t("selectWithIconsConfig.iconSelected")}
      </span>
      <button
        type="button"
        onClick={onChangeClick}
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        {t("selectWithIconsConfig.changeIcon")}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Permitir selección múltiple */}
      <CheckboxOption
        checked={config.allow_multiple || false}
        onChange={(checked) => updateFieldConfig({ allow_multiple: checked })}
        label={t("selectWithIconsConfig.allowMultiple")}
        helpText={t("selectWithIconsConfig.allowMultipleHelp")}
      />

      {/* Mostrar label junto al icono */}
      <CheckboxOption
        checked={config.show_label !== false}
        onChange={(checked) => updateFieldConfig({ show_label: checked })}
        label={t("selectWithIconsConfig.showLabel")}
        helpText={t("selectWithIconsConfig.showLabelHelp")}
      />

      {/* Opciones e iconos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className={labelClass}>
            {t("selectWithIconsConfig.optionsAndIcons")}
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
              className="grid grid-cols-12 gap-3 items-center p-3 border border-gray-200 rounded-md bg-gray-50"
            >
              {/* Opción */}
              <div className="col-span-5">
                <label className={labelXsClass}>
                  {t("selectWithIconsConfig.optionLabel")} {index + 1}
                </label>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className={inputXsClass}
                  placeholder={t("selectWithIconsConfig.optionPlaceholder")}
                />
              </div>

              {/* Selector de icono */}
              <div className="col-span-5">
                <label className={labelXsClass}>
                  {t("selectWithIconsConfig.iconUrl")}
                </label>
                <div className="flex items-center space-x-2">
                  {iconsUrl[index] ? (
                    <SelectedIconDisplay
                      iconUrl={iconsUrl[index]}
                      index={index}
                      onChangeClick={() => setShowIconSelectorForIndex(index)}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowIconSelectorForIndex(index)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 text-left text-gray-500"
                    >
                      {t("selectWithIconsConfig.selectIcon")}
                    </button>
                  )}
                </div>
              </div>

              {/* Preview del icono */}
              <div className="col-span-1 flex justify-center">
                {iconsUrl[index] && (
                  <img
                    src={iconsUrl[index]}
                    alt={`${t("selectWithIconsConfig.optionLabel")} ${
                      index + 1
                    }`}
                    className="w-6 h-6 object-contain"
                    onError={handleImageError}
                  />
                )}
              </div>

              {/* Eliminar */}
              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  disabled={options.length <= 1}
                  title={t("actions.remove")}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}

          {options.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm border border-gray-200 rounded-md bg-gray-50">
              {t("selectWithIconsConfig.noOptionsMessage")}
            </div>
          )}
        </div>
      </div>

      {/* Modal del selector de iconos */}
      <VisualResourceSelector
        isOpen={showIconSelectorForIndex !== null}
        onClose={() => setShowIconSelectorForIndex(null)}
        onSelect={(url) => {
          if (showIconSelectorForIndex !== null) {
            updateIcon(showIconSelectorForIndex, url);
          }
        }}
        title={`${t("selectWithIconsConfig.selectIconFor")} ${
          (showIconSelectorForIndex ?? 0) + 1
        }`}
        resourceType="icon"
        selectedUrl={
          showIconSelectorForIndex !== null
            ? iconsUrl[showIconSelectorForIndex]
            : undefined
        }
      />
    </div>
  );
};
