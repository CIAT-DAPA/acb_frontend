"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  CreateTemplateData,
  HeaderFooterConfig,
} from "../../../../../types/template";
import { HeaderFooterConfigurator } from "../components/HeaderFooterConfigurator";

interface HeaderFooterStepProps {
  data: CreateTemplateData;
  errors: Record<string, string[]>;
  onDataChange: (
    updater: (prevData: CreateTemplateData) => CreateTemplateData
  ) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
}

type ConfigType = "header" | "footer";

export function HeaderFooterStep({
  data,
  errors,
  onDataChange,
  onErrorsChange,
}: HeaderFooterStepProps) {
  const t = useTranslations("CreateTemplate.headerFooter");
  const [activeConfig, setActiveConfig] = useState<ConfigType>("header");

  const updateHeaderFooterConfig = useCallback(
    (type: ConfigType, updates: Partial<HeaderFooterConfig>) => {
      onDataChange((prevData) => ({
        ...prevData,
        version: {
          ...prevData.version,
          content: {
            ...prevData.version.content,
            [`${type}_config`]: {
              ...prevData.version.content[
                `${type}_config` as keyof typeof prevData.version.content
              ],
              ...updates,
            },
          },
        },
      }));
    },
    [onDataChange]
  );

  const currentConfig = (data.version.content[
    `${activeConfig}_config` as keyof typeof data.version.content
  ] as HeaderFooterConfig) || { fields: [] };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#283618] mb-4">
          {t("title")}
        </h2>
        <p className="text-[#283618]">{t("description")}</p>
      </div>

      {/* Pestañas */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveConfig("header")}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeConfig === "header"
                ? "border-[#bc6c25] text-[#bc6c25]"
                : "border-transparent text-[#283618]/50 hover:text-[#283618] hover:border-[#bc6c25]"
            }`}
          >
            {t("tabs.header")}
          </button>
          <button
            onClick={() => setActiveConfig("footer")}
            className={`py-2 px-1 border-b-2 font-medium text-sm cursor-pointer ${
              activeConfig === "footer"
                ? "border-[#bc6c25] text-[#bc6c25]"
                : "border-transparent text-[#283618]/50 hover:text-[#283618] hover:border-[#bc6c25]"
            }`}
          >
            {t("tabs.footer")}
          </button>
        </nav>
      </div>

      {/* Configurador reutilizable */}
      <HeaderFooterConfigurator
        config={currentConfig}
        configType={activeConfig}
        onConfigChange={(updates) =>
          updateHeaderFooterConfig(activeConfig, updates)
        }
        showTitle={true}
      />
    </div>
  );
}
