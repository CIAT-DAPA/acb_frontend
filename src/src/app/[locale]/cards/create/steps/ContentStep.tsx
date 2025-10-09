"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateCardData } from "../../../../../types/card";
import { CreateTemplateData } from "../../../../../types/template";
import { SectionsStep } from "../../../templates/create/steps/SectionsStep";

interface ContentStepProps {
  data: CreateCardData;
  errors: Record<string, string[]>;
  onDataChange: (updater: (prevData: CreateCardData) => CreateCardData) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
}

export function ContentStep({
  data,
  errors,
  onDataChange,
  onErrorsChange,
}: ContentStepProps) {
  const t = useTranslations("CreateCard.content");

  // Convert CardData to TemplateData (single section)
  const templateData = React.useMemo((): CreateTemplateData => {
    const section = {
      section_id: "card_section",
      display_name: data.card_name,
      background_url: data.content.background_url
        ? [data.content.background_url]
        : [],
      icon_url: data.content.icon_url || "",
      blocks: data.content.blocks,
      order: 0,
    };

    // Default log object for template
    const defaultLog = {
      created_at: new Date().toISOString(),
      creator_user_id: "",
      creator_first_name: null,
      creator_last_name: null,
      updated_at: new Date().toISOString(),
      updater_user_id: "",
      updater_first_name: null,
      updater_last_name: null,
    };

    return {
      master: {
        template_name: data.card_name,
        description: "",
        log: data.log || defaultLog,
        status: "active",
        access_config: data.access_config,
        thumbnail_images: [],
      },
      version: {
        commit_message: "Card initial version",
        content: {
          sections: [section],
        },
        log: data.log || defaultLog,
      },
    };
  }, [data]);

  // Handle updates from SectionsStep and convert back to CardData
  const handleTemplateDataChange = React.useCallback(
    (updater: (prevData: CreateTemplateData) => CreateTemplateData) => {
      const updatedTemplateData = updater(templateData);
      const updatedSection = updatedTemplateData.version.content.sections[0];

      onDataChange((prevCardData) => ({
        ...prevCardData,
        content: {
          blocks: updatedSection.blocks,
          background_url: updatedSection.background_url[0] || "",
          icon_url: updatedSection.icon_url || "",
        },
      }));
    },
    [templateData, onDataChange]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#283618] mb-4">
          {t("title")}
        </h2>
        <p className="text-[#283618]/70">{t("description")}</p>
      </div>

      {/* Reuse SectionsStep with single section */}
      <SectionsStep
        data={templateData}
        errors={errors}
        onDataChange={handleTemplateDataChange}
        onErrorsChange={onErrorsChange}
        selectedSectionIndex={0}
      />
    </div>
  );
}
