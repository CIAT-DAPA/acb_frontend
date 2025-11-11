"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { TextWithIconFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { VisualResourceSelector } from "../VisualResourceSelector";
import Image from "next/image";
import { btnOutlineSecondary } from "@/app/[locale]/components/ui";

// Constantes para clases CSS reutilizables
const INPUT_CLASS =
  "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500";
const LABEL_CLASS = "block text-sm font-medium text-[#283618]/70 mb-2";
const HELP_TEXT_CLASS = "text-xs text-[#283618]/50";
const ICON_CONTAINER_CLASS = "flex items-center space-x-2 p-2 rounded border";
const BUTTON_PRIMARY_CLASS = "px-4 py-2 text-sm rounded-md";

export const TextWithIconFieldTypeConfig: React.FC<
  BaseFieldTypeConfigProps
> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");
  const [showIconSelector, setShowIconSelector] = useState(false);
  const [showIconOptionsSelector, setShowIconOptionsSelector] = useState(false);
  const [editingIconIndex, setEditingIconIndex] = useState<number | null>(null);

  // Helper para obtener config tipada
  const fieldConfig = currentField.field_config as TextWithIconFieldConfig;
  const iconOptions = fieldConfig?.icon_options || [];

  // Handlers extraídos para reutilización
  const handleIconSelect = (url: string) => {
    updateFieldConfig({
      selected_icon: url,
      icon_options: [url],
    });
  };

  const handleIconOptionChange = (url: string) => {
    if (editingIconIndex !== null) {
      const newIcons = [...iconOptions];
      newIcons[editingIconIndex] = url;
      updateFieldConfig({ icon_options: newIcons });
    }
  };

  const handleRemoveIconOption = (index: number) => {
    const newIcons = iconOptions.filter((_, i) => i !== index);
    updateFieldConfig({ icon_options: newIcons });
  };

  const handleAddIconOption = () => {
    updateFieldConfig({ icon_options: [...iconOptions, ""] });
  };

  // Componente reutilizable para mostrar iconos seleccionados
  const SelectedIconDisplay = ({
    iconUrl,
    onChangeClick,
    altText = "Selected icon",
  }: {
    iconUrl: string;
    onChangeClick: () => void;
    altText?: string;
  }) => (
    <div className="space-y-2">
      <div className={`${ICON_CONTAINER_CLASS} bg-green-50 border-green-200`}>
        <Image
          src={iconUrl}
          alt={altText}
          width={32}
          height={32}
          className="object-contain"
        />
        <div className="flex-1">
          <span className="text-xs font-medium text-green-800 block">
            {t("value.selectedIcon")}
          </span>
        </div>
        <button
          type="button"
          onClick={onChangeClick}
          className={`${btnOutlineSecondary} text-xs`}
        >
          {t("textWithIconConfig.changeIcon")}
        </button>
      </div>
      <p className={HELP_TEXT_CLASS}>{t("value.iconHelp")}</p>
    </div>
  );

  // Componente para cada opción de icono en la lista
  const IconOptionItem = ({
    iconUrl,
    index,
  }: {
    iconUrl: string;
    index: number;
  }) => (
    <div className="flex items-center space-x-2">
      <div
        className={`${ICON_CONTAINER_CLASS} bg-gray-50 border-gray-200 flex-1`}
      >
        {iconUrl && (
          <Image
            src={iconUrl}
            alt={`Icon ${index + 1}`}
            width={24}
            height={24}
            className="object-contain"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = "/assets/img/imageNotFound.png";
            }}
          />
        )}
        <span className="text-sm text-[#283618]/70 truncate flex-1">
          {iconUrl || t("textWithIconConfig.noIconSelected")}
        </span>
      </div>
      <button
        type="button"
        onClick={() => {
          setEditingIconIndex(index);
          setShowIconOptionsSelector(true);
        }}
        className={`${btnOutlineSecondary} text-xs`}
      >
        {iconUrl
          ? t("textWithIconConfig.changeIcon")
          : t("textWithIconConfig.selectIcon")}
      </button>
      <button
        type="button"
        onClick={() => handleRemoveIconOption(index)}
        className={`${BUTTON_PRIMARY_CLASS} bg-red-100 text-red-700 hover:bg-red-200`}
      >
        {t("actions.remove")}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Input del valor - Solo cuando form es false */}
      {!currentField.form && (
        <div>
          <label className={LABEL_CLASS}>{t("value.label")}</label>
          <input
            type="text"
            value={
              typeof currentField.value === "string" ? currentField.value : ""
            }
            onChange={(e) => updateField({ value: e.target.value })}
            className={INPUT_CLASS}
            placeholder={t("value.placeholder")}
          />
          <p className={`mt-1 ${HELP_TEXT_CLASS}`}>{t("value.help")}</p>
        </div>
      )}

      {/* Input del tipo - Solo cuando form es true */}
      {currentField.form && (
        <div>
          <label className={LABEL_CLASS}>{t("textConfig.subtype")}</label>
          <select
            value={fieldConfig?.subtype || "short"}
            onChange={(e) => updateFieldConfig({ subtype: e.target.value })}
            className={INPUT_CLASS}
          >
            <option value="short">{t("textConfig.short")}</option>
            <option value="long">{t("textConfig.long")}</option>
          </select>
        </div>
      )}

      {/* Selector de icono para boletín - Solo cuando form es false */}
      {!currentField.form && (
        <div>
          <label className={LABEL_CLASS}>{t("value.iconLabel")}</label>

          {fieldConfig?.selected_icon ? (
            <SelectedIconDisplay
              iconUrl={fieldConfig.selected_icon}
              onChangeClick={() => setShowIconSelector(true)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowIconSelector(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {t("value.selectIcon")}
            </button>
          )}

          <VisualResourceSelector
            isOpen={showIconSelector}
            onClose={() => setShowIconSelector(false)}
            onSelect={handleIconSelect}
            title={t("value.iconLabel")}
            resourceType="icon"
            selectedUrl={fieldConfig?.selected_icon}
          />
        </div>
      )}

      {/* Opciones de iconos para el formulario - Solo mostrar cuando form es true */}
      {currentField.form && (
        <div>
          <label className={LABEL_CLASS}>
            {t("textWithIconConfig.iconOptions")}
          </label>
          <p className={`${HELP_TEXT_CLASS} mb-2`}>
            {t("textWithIconConfig.iconOptionsHelp")}
          </p>
          <div className="space-y-2">
            {iconOptions.map((iconUrl, index) => (
              <IconOptionItem key={index} iconUrl={iconUrl} index={index} />
            ))}
            <button
              type="button"
              onClick={handleAddIconOption}
              className={`${BUTTON_PRIMARY_CLASS} bg-blue-100 text-blue-700 hover:bg-blue-200`}
            >
              {t("textWithIconConfig.addIcon")}
            </button>
          </div>

          {/* Selector para las opciones de iconos */}
          <VisualResourceSelector
            isOpen={showIconOptionsSelector}
            onClose={() => {
              setShowIconOptionsSelector(false);
              setEditingIconIndex(null);
            }}
            onSelect={handleIconOptionChange}
            title={t("textWithIconConfig.iconSelectorTitle")}
            resourceType="icon"
            selectedUrl={
              editingIconIndex !== null
                ? iconOptions[editingIconIndex]
                : undefined
            }
          />
        </div>
      )}

      {/* Configuración de visualización del label - Disponible para form true y false */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showLabel"
          checked={fieldConfig?.showLabel ?? true}
          onChange={(e) => updateFieldConfig({ showLabel: e.target.checked })}
          className="w-4 h-4 text-[#bc6c25] border-gray-300 rounded focus:ring-[#bc6c25]"
        />
        <label htmlFor="showLabel" className={LABEL_CLASS}>
          {currentField.form
            ? t("textWithIconConfig.showLabelForm")
            : t("textWithIconConfig.showLabelPreview")}
        </label>
        <p className={HELP_TEXT_CLASS}>
          {currentField.form
            ? t("textWithIconConfig.showLabelFormHelp")
            : t("textWithIconConfig.showLabelPreviewHelp")}
        </p>
      </div>

      {/* Validaciones - Solo mostrar cuando form es true */}
      {currentField.form && (
        <div>
          <h4 className="text-sm font-medium text-[#283618] mb-2">
            {t("validation.title")}
          </h4>
          <p className={`${HELP_TEXT_CLASS} mb-3`}>
            {t("textWithIconConfig.validationsHelp")}
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS}>{t("validation.minLength")}</label>
              <input
                type="number"
                value={currentField.validation?.min_length || ""}
                onChange={(e) =>
                  updateValidation({
                    min_length: parseInt(e.target.value) || undefined,
                  })
                }
                className={INPUT_CLASS}
                placeholder="0"
              />
            </div>
            <div>
              <label className={LABEL_CLASS}>{t("validation.maxLength")}</label>
              <input
                type="number"
                value={currentField.validation?.max_length || ""}
                onChange={(e) =>
                  updateValidation({
                    max_length: parseInt(e.target.value) || undefined,
                  })
                }
                className={INPUT_CLASS}
                placeholder="255"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
