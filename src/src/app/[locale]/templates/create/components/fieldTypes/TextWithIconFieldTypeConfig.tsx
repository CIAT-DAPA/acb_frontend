"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { TextWithIconFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { VisualResourceSelector } from "../VisualResourceSelector";
import Image from "next/image";
import { btnOutlineSecondary } from "@/app/[locale]/components/ui";

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

  return (
    <div className="space-y-4">
      {/* Input del valor - Solo cuando form es false */}
      {!currentField.form && (
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("value.label")}
          </label>
          <input
            type="text"
            value={
              typeof currentField.value === "string" ? currentField.value : ""
            }
            onChange={(e) => updateField({ value: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder={t("value.placeholder")}
          />
          <p className="mt-1 text-xs text-[#283618]/50">{t("value.help")}</p>
        </div>
      )}

      {/* Input del tipo - Solo cuando form es true */}
      {currentField.form && (
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("textConfig.subtype")}
          </label>
          <select
            value={
              (currentField.field_config as TextWithIconFieldConfig)?.subtype ||
              "short"
            }
            onChange={(e) => updateFieldConfig({ subtype: e.target.value })}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="short">{t("textConfig.short")}</option>
            <option value="long">{t("textConfig.long")}</option>
          </select>
        </div>
      )}

      {/* Selector de icono para boletín - Solo cuando form es false */}
      {!currentField.form && (
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("value.iconLabel")}
          </label>

          {(currentField.field_config as TextWithIconFieldConfig)
            ?.selected_icon ? (
            <div className="space-y-2">
              <div className="flex items-center space-x-2 p-2 bg-green-50 rounded border border-green-200">
                <Image
                  src={
                    (currentField.field_config as TextWithIconFieldConfig)
                      ?.selected_icon || ""
                  }
                  alt="Selected icon"
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
                  onClick={() => setShowIconSelector(true)}
                  className={`${btnOutlineSecondary} text-xs`}
                >
                  Cambiar
                </button>
              </div>
              <p className="text-xs text-[#283618]/50">{t("value.iconHelp")}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowIconSelector(true)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              {t("value.selectIcon") || "Seleccionar Icono"}
            </button>
          )}

          <VisualResourceSelector
            isOpen={showIconSelector}
            onClose={() => setShowIconSelector(false)}
            onSelect={(url) => {
              updateFieldConfig({
                selected_icon: url,
                icon_options: [url],
              });
            }}
            title={t("value.iconLabel")}
            resourceType="icon"
            selectedUrl={
              (currentField.field_config as TextWithIconFieldConfig)
                ?.selected_icon
            }
          />
        </div>
      )}

      {/* Opciones de iconos para el formulario - Solo mostrar cuando form es true */}
      {currentField.form && (
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("textWithIconConfig.iconOptions")}
          </label>
          <p className="text-xs text-[#283618]/50 mb-2">
            Estas son las opciones de iconos que el usuario podrá elegir cuando
            llene el formulario.
          </p>
          <div className="space-y-2">
            {(
              (currentField.field_config as TextWithIconFieldConfig)
                ?.icon_options || []
            ).map((iconUrl, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="flex items-center space-x-2 p-2 bg-gray-50 rounded border border-gray-200 flex-1">
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
                    {iconUrl ||
                      t("textWithIconConfig.noIconSelected") ||
                      "No icon selected"}
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
                  {iconUrl ? "Cambiar" : "Seleccionar"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newIcons = (
                      (currentField.field_config as TextWithIconFieldConfig)
                        ?.icon_options || []
                    ).filter((_, i) => i !== index);
                    updateFieldConfig({ icon_options: newIcons });
                  }}
                  className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                  {t("actions.remove")}
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const currentIcons =
                  (currentField.field_config as TextWithIconFieldConfig)
                    ?.icon_options || [];
                updateFieldConfig({ icon_options: [...currentIcons, ""] });
              }}
              className="px-4 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
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
            onSelect={(url) => {
              if (editingIconIndex !== null) {
                const newIcons = [
                  ...((currentField.field_config as TextWithIconFieldConfig)
                    ?.icon_options || []),
                ];
                newIcons[editingIconIndex] = url;
                updateFieldConfig({ icon_options: newIcons });
              }
            }}
            title="Seleccionar Icono para Opción"
            resourceType="icon"
            selectedUrl={
              editingIconIndex !== null
                ? (currentField.field_config as TextWithIconFieldConfig)
                    ?.icon_options?.[editingIconIndex]
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
          checked={
            (currentField.field_config as TextWithIconFieldConfig)?.showLabel ??
            true
          }
          onChange={(e) => updateFieldConfig({ showLabel: e.target.checked })}
          className="w-4 h-4 text-[#bc6c25] border-gray-300 rounded focus:ring-[#bc6c25]"
        />
        <label
          htmlFor="showLabel"
          className="text-sm font-medium text-[#283618]/70"
        >
          Mostrar label{" "}
          {currentField.form ? "en el formulario" : "en el preview"}
        </label>
        <p className="text-xs text-[#283618]/50">
          {currentField.form
            ? 'Si está activo, se mostrará "label: valor" en el boletín'
            : "Si está activo, se mostrará el label junto al valor en el boletín"}
        </p>
      </div>

      {/* Validaciones - Solo mostrar cuando form es true */}
      {currentField.form && (
        <div>
          <h4 className="text-sm font-medium text-[#283618] mb-2">
            {t("validation.title")}
          </h4>
          <p className="text-xs text-[#283618]/50 mb-3">
            Estas validaciones se aplicarán cuando el usuario llene el
            formulario.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("validation.minLength")}
              </label>
              <input
                type="number"
                value={currentField.validation?.min_length || ""}
                onChange={(e) =>
                  updateValidation({
                    min_length: parseInt(e.target.value) || undefined,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#283618]/70 mb-2">
                {t("validation.maxLength")}
              </label>
              <input
                type="number"
                value={currentField.validation?.max_length || ""}
                onChange={(e) =>
                  updateValidation({
                    max_length: parseInt(e.target.value) || undefined,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                placeholder="255"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
