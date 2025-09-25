"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { TextWithIconFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

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

  return (
    <div className="space-y-4">
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

      <div>
        <label className="block text-sm font-medium text-[#283618]/70 mb-2">
          {t("textWithIconConfig.iconOptions")}
        </label>
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
                placeholder="https://ejemplo.com/icono.svg"
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
  );
};
