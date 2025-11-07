"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import { CreateTemplateData } from "../../../../../types/template";
import { StyleConfig } from "../../../../../types/core";
import { StyleConfigurator } from "../components/StyleConfigurator";

interface GeneralConfigStepProps {
  data: CreateTemplateData;
  errors: Record<string, string[]>;
  onDataChange: (
    updater: (prevData: CreateTemplateData) => CreateTemplateData
  ) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
}

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
        <StyleConfigurator
          styleConfig={currentStyleConfig}
          onStyleChange={updateStyleConfig}
          enabledFields={{
            font: true,
            primaryColor: true,
            secondaryColor: true,
            backgroundColor: true,
            backgroundImage: true,
            fontSize: true,
            textAlign: true,
            bulletinWidth: true,
            bulletinHeight: true,
          }}
          title={t("styles.title")}
          showPreview={true}
        />
      </div>
    </div>
  );
}
