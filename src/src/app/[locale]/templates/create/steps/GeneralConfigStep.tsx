"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import { CreateTemplateData } from "../../../../../types/template";
import { StyleConfig } from "../../../../../types/core";

interface GeneralConfigStepProps {
  data: CreateTemplateData;
  errors: Record<string, string[]>;
  onDataChange: (
    updater: (prevData: CreateTemplateData) => CreateTemplateData
  ) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
}

// Fuentes disponibles
const AVAILABLE_FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
];

export function GeneralConfigStep({
  data,
  errors,
  onDataChange,
  onErrorsChange,
}: GeneralConfigStepProps) {
  const t = useTranslations("CreateTemplate.generalConfig");

  const updateStyleConfig = useCallback(
    (updates: Partial<StyleConfig>) => {
      onDataChange((prevData) => ({
        ...prevData,
        version: {
          ...prevData.version,
          content: {
            ...prevData.version.content,
            style_config: {
              ...prevData.version.content.style_config,
              ...updates,
            },
          },
        },
      }));
    },
    [onDataChange]
  );

  const handleCommitMessageChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onDataChange((prevData) => ({
        ...prevData,
        version: {
          ...prevData.version,
          commit_message: e.target.value,
        },
      }));
    },
    [onDataChange]
  );

  const currentStyleConfig = data.version.content.style_config || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#283618] mb-4">
          {t("title")}
        </h2>
        <p className="text-[#283618]/70">{t("description")}</p>
      </div>

      <div className="space-y-6">
        {/* Mensaje de Commit */}
        <div>
          <label
            htmlFor="commit_message"
            className="block text-sm font-medium text-[#283618]/70 mb-2"
          >
            {t("fields.commitMessage.label")}
          </label>
          <textarea
            id="commit_message"
            rows={2}
            value={data.version.commit_message}
            onChange={handleCommitMessageChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t("fields.commitMessage.placeholder")}
          />
        </div>

        {/* Dimensiones del Boletín */}
        <div>
          <h3 className="text-lg font-medium text-[#283618] mb-4">
            {t("dimensions.title", { default: "Dimensiones del Boletín" })}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="bulletin_width"
                className="block text-sm font-medium text-[#283618]/70 mb-2"
              >
                {t("dimensions.width.label", { default: "Ancho (px)" })}
              </label>
              <input
                type="number"
                id="bulletin_width"
                min="200"
                max="1200"
                value={currentStyleConfig.bulletin_width || 366}
                onChange={(e) =>
                  updateStyleConfig({
                    bulletin_width: parseInt(e.target.value) || 366,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label
                htmlFor="bulletin_height"
                className="block text-sm font-medium text-[#283618]/70 mb-2"
              >
                {t("dimensions.height.label", { default: "Alto (px)" })}
              </label>
              <input
                type="number"
                id="bulletin_height"
                min="200"
                max="1200"
                value={currentStyleConfig.bulletin_height || 638}
                onChange={(e) =>
                  updateStyleConfig({
                    bulletin_height: parseInt(e.target.value) || 638,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <p className="mt-2 text-xs text-[#283618]/50">
            {t("dimensions.help", {
              default:
                "Define el tamaño del boletín. Los valores por defecto son 638x366 píxeles.",
            })}
          </p>
        </div>

        {/* Estilos Globales */}
        <div>
          <h3 className="text-lg font-medium text-[#283618] mb-4">
            {t("styles.title")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fuente */}
            <div>
              <label
                htmlFor="font"
                className="block text-sm font-medium text-[#283618]/70 mb-2"
              >
                {t("styles.font.label")}
              </label>
              <select
                id="font"
                value={currentStyleConfig.font || "Arial"}
                onChange={(e) => updateStyleConfig({ font: e.target.value })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {AVAILABLE_FONTS.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Primario */}
            <div>
              <label
                htmlFor="primary_color"
                className="block text-sm font-medium text-[#283618]/70 mb-2"
              >
                {t("styles.primaryColor.label")}
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  id="primary_color"
                  value={currentStyleConfig.primary_color || "#000000"}
                  onChange={(e) =>
                    updateStyleConfig({ primary_color: e.target.value })
                  }
                  className="block w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={currentStyleConfig.primary_color || "#000000"}
                  onChange={(e) =>
                    updateStyleConfig({ primary_color: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#000000"
                />
              </div>
            </div>

            {/* Color Secundario */}
            <div>
              <label
                htmlFor="secondary_color"
                className="block text-sm font-medium text-[#283618]/70 mb-2"
              >
                {t("styles.secondaryColor.label")}
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  id="secondary_color"
                  value={currentStyleConfig.secondary_color || "#666666"}
                  onChange={(e) =>
                    updateStyleConfig({ secondary_color: e.target.value })
                  }
                  className="block w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={currentStyleConfig.secondary_color || "#666666"}
                  onChange={(e) =>
                    updateStyleConfig({ secondary_color: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#666666"
                />
              </div>
            </div>

            {/* Color de Fondo */}
            <div>
              <label
                htmlFor="background_color"
                className="block text-sm font-medium text-[#283618]/70 mb-2"
              >
                {t("styles.backgroundColor.label")}
              </label>
              <div className="flex space-x-2">
                <input
                  type="color"
                  id="background_color"
                  value={currentStyleConfig.background_color || "#ffffff"}
                  onChange={(e) =>
                    updateStyleConfig({ background_color: e.target.value })
                  }
                  className="block w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
                />
                <input
                  type="text"
                  value={currentStyleConfig.background_color || "#ffffff"}
                  onChange={(e) =>
                    updateStyleConfig({ background_color: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            {/* Tamaño de Fuente Base */}
            <div>
              <label
                htmlFor="font_size"
                className="block text-sm font-medium text-[#283618]/70 mb-2"
              >
                {t("styles.fontSize.label")}
              </label>
              <input
                type="number"
                id="font_size"
                min="8"
                max="72"
                value={currentStyleConfig.font_size || 16}
                onChange={(e) =>
                  updateStyleConfig({
                    font_size: parseInt(e.target.value) || 16,
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Alineación de Texto */}
            <div>
              <label
                htmlFor="text_align"
                className="block text-sm font-medium text-[#283618]/70 mb-2"
              >
                {t("styles.textAlign.label")}
              </label>
              <select
                id="text_align"
                value={currentStyleConfig.text_align || "left"}
                onChange={(e) =>
                  updateStyleConfig({
                    text_align: e.target.value as "left" | "center" | "right",
                  })
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="left">
                  {t("styles.textAlign.options.left")}
                </option>
                <option value="center">
                  {t("styles.textAlign.options.center")}
                </option>
                <option value="right">
                  {t("styles.textAlign.options.right")}
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Vista Previa de Estilos */}
        <div>
          <h3 className="text-lg font-medium text-[#283618] mb-4">
            {t("preview.title")}
          </h3>
          <div
            className="p-6 border rounded-lg"
            style={{
              fontFamily: currentStyleConfig.font || "Arial",
              color: currentStyleConfig.primary_color || "#000000",
              backgroundColor: currentStyleConfig.background_color || "#ffffff",
              fontSize: `${currentStyleConfig.font_size || 16}px`,
              textAlign:
                (currentStyleConfig.text_align as
                  | "left"
                  | "center"
                  | "right") || "left",
            }}
          >
            <h4
              className="text-xl font-bold mb-2"
              style={{ color: currentStyleConfig.primary_color }}
            >
              {t("preview.title")}
            </h4>
            <h5
              className="text-lg font-semibold mb-2"
              style={{ color: currentStyleConfig.secondary_color }}
            >
              {t("preview.subtitle")}
            </h5>
            <p className="mb-2">{t("preview.text")}</p>
            <p
              className="text-sm"
              style={{ color: currentStyleConfig.secondary_color }}
            >
              {t("preview.smallText")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
