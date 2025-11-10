"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CreateTemplateData } from "../../../../../types/template";
import { StyleConfig } from "../../../../../types/core";
import { StyleConfigurator } from "../components/StyleConfigurator";

// Dimensiones predefinidas para boletines
const PREDEFINED_DIMENSIONS = {
  a4: { width: 794, height: 1123, label: "A4 (794 x 1123 px)" },
  letter: { width: 816, height: 1056, label: "Letter (816 x 1056 px)" },
  android_compact: {
    width: 360,
    height: 640,
    label: "Android Compact (360 x 640 px)",
  },
  apple_16: { width: 375, height: 667, label: "Apple 16 (375 x 667 px)" },
  custom: { width: 638, height: 366, label: "Personalizado" },
} as const;

type DimensionPreset = keyof typeof PREDEFINED_DIMENSIONS;

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

  // Estado para el preset seleccionado
  const [selectedPreset, setSelectedPreset] =
    useState<DimensionPreset>("custom");

  // Detectar el preset inicial basado en las dimensiones actuales
  useEffect(() => {
    const currentWidth =
      data.version.content.style_config?.bulletin_width || 638;
    const currentHeight =
      data.version.content.style_config?.bulletin_height || 366;

    // Buscar si coincide con algún preset
    const matchingPreset = Object.entries(PREDEFINED_DIMENSIONS).find(
      ([key, dims]) =>
        key !== "custom" &&
        dims.width === currentWidth &&
        dims.height === currentHeight
    );

    if (matchingPreset) {
      setSelectedPreset(matchingPreset[0] as DimensionPreset);
    } else {
      setSelectedPreset("custom");
    }
  }, []);

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

  const handlePresetChange = useCallback(
    (preset: DimensionPreset) => {
      setSelectedPreset(preset);

      if (preset !== "custom") {
        const dimensions = PREDEFINED_DIMENSIONS[preset];
        updateStyleConfig({
          bulletin_width: dimensions.width,
          bulletin_height: dimensions.height,
        });
      }
    },
    [updateStyleConfig]
  );

  const handleManualDimensionChange = useCallback(
    (dimension: "width" | "height", value: number) => {
      updateStyleConfig({
        [dimension === "width" ? "bulletin_width" : "bulletin_height"]: value,
      });

      // Al cambiar manualmente, cambiar a custom
      setSelectedPreset("custom");
    },
    [updateStyleConfig]
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

          {/* Selector de Presets */}
          <div className="mb-6">
            <label
              htmlFor="dimension-preset"
              className="block text-sm font-medium text-[#283618]/70 mb-2"
            >
              {t("dimensions.preset.label", {
                default: "Formato Predefinido",
              })}
            </label>
            <select
              id="dimension-preset"
              value={selectedPreset}
              onChange={(e) =>
                handlePresetChange(e.target.value as DimensionPreset)
              }
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                       bg-white text-[#283618]"
            >
              {Object.entries(PREDEFINED_DIMENSIONS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-[#283618]/50">
              {t("dimensions.preset.help")}
            </p>
          </div>

          {/* Dimensiones Manuales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="bulletin_width"
                className="block text-sm font-medium text-[#283618]/70 mb-2"
              >
                {t("dimensions.width.label")}
              </label>
              <input
                type="number"
                id="bulletin_width"
                min="200"
                max="2000"
                value={currentStyleConfig.bulletin_width || 638}
                onChange={(e) =>
                  handleManualDimensionChange(
                    "width",
                    parseInt(e.target.value) || 638
                  )
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-[#606c38] focus:border-[#606c38]"
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
                max="2000"
                value={currentStyleConfig.bulletin_height || 366}
                onChange={(e) =>
                  handleManualDimensionChange(
                    "height",
                    parseInt(e.target.value) || 366
                  )
                }
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                         focus:outline-none focus:ring-2 focus:ring-[#606c38] focus:border-[#606c38]"
              />
            </div>
          </div>

          <p className="mt-3 text-xs text-[#283618]/50">
            {t("dimensions.help", {
              default:
                "Puedes modificar las dimensiones manualmente en cualquier momento.",
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
            // Deshabilitamos bulletinWidth y bulletinHeight aquí
            bulletinWidth: false,
            bulletinHeight: false,
          }}
          title={t("styles.title")}
          showPreview={true}
        />
      </div>
    </div>
  );
}
