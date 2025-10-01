"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TextWithIconFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { VisualResourcesService } from "../../../../../../services/visualResourcesService";
import { VisualResource } from "../../../../../../types/visualResource";

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
  const [availableIcons, setAvailableIcons] = useState<VisualResource[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(false);

  // Cargar iconos disponibles cuando form es false
  useEffect(() => {
    const loadIcons = async () => {
      if (!currentField.form) {
        setLoadingIcons(true);
        try {
          const response = await VisualResourcesService.getAllVisualResources();
          if (response.success && response.data) {
            const icons = response.data.filter(
              (resource) =>
                resource.file_type === "icon" && resource.status === "active"
            );
            setAvailableIcons(icons);
          }
        } catch (error) {
          console.error("Error loading icons:", error);
        } finally {
          setLoadingIcons(false);
        }
      }
    };

    loadIcons();
  }, [currentField.form]);

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

      {/* Selector de icono para boletín - Solo cuando form es false */}
      {!currentField.form && (
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            {t("value.iconLabel")}
          </label>
          {loadingIcons ? (
            <div className="text-sm text-[#283618]/50">
              {t("value.loadingIcons")}
            </div>
          ) : availableIcons.length === 0 ? (
            <div className="text-sm text-amber-600">
              {t("value.noIconsAvailable")}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Grid de iconos seleccionables */}
              <div className="grid grid-cols-4 gap-3 max-h-64 overflow-y-auto p-2 border border-gray-300 rounded-md">
                {availableIcons.map((icon) => {
                  const isSelected =
                    (currentField.field_config as TextWithIconFieldConfig)
                      ?.selected_icon === icon.file_url;
                  return (
                    <button
                      key={icon.id}
                      type="button"
                      onClick={() => {
                        // Cuando form es false, actualizar selected_icon y también icon_options con solo este icono
                        updateFieldConfig({
                          selected_icon: icon.file_url,
                          icon_options: [icon.file_url],
                        });
                      }}
                      className={`
                        flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all
                        ${
                          isSelected
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-400 hover:bg-gray-50"
                        }
                      `}
                      title={icon.file_name}
                    >
                      <img
                        src={icon.file_url}
                        alt={icon.file_name}
                        className="w-12 h-12 object-contain mb-1"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "/assets/img/imageNotFound.png";
                        }}
                      />
                      <span className="text-xs text-[#283618]/70 text-center truncate w-full">
                        {icon.file_name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {(currentField.field_config as TextWithIconFieldConfig)
                ?.selected_icon && (
                <div className="flex items-center space-x-2 p-2 bg-green-50 rounded border border-green-200">
                  <img
                    src={
                      (currentField.field_config as TextWithIconFieldConfig)
                        ?.selected_icon
                    }
                    alt="Selected icon"
                    className="w-8 h-8 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                  <div>
                    <span className="text-xs font-medium text-green-800 block">
                      {t("value.selectedIcon")}
                    </span>
                    <span className="text-xs text-green-700">
                      {
                        availableIcons.find(
                          (icon) =>
                            icon.file_url ===
                            (
                              currentField.field_config as TextWithIconFieldConfig
                            )?.selected_icon
                        )?.file_name
                      }
                    </span>
                  </div>
                </div>
              )}
              <p className="text-xs text-[#283618]/50">{t("value.iconHelp")}</p>
            </div>
          )}
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
                <input
                  type="url"
                  value={iconUrl}
                  onChange={(e) => {
                    const newIcons = [
                      ...((currentField.field_config as TextWithIconFieldConfig)
                        ?.icon_options || []),
                    ];
                    newIcons[index] = e.target.value;
                    updateFieldConfig({ icon_options: newIcons });
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder={t("textWithIconConfig.iconUrlPlaceholder")}
                />
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
        </div>
      )}

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
