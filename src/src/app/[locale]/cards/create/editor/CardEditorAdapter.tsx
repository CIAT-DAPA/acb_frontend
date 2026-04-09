"use client";

import React, { useMemo, useCallback } from "react";
import { CreateCardData } from "@/types/card";
import { CreateTemplateData, Section } from "@/types/template";
import { EditorLayout } from "@/app/[locale]/templates/create/editor/EditorLayout";
import { useTranslations } from "next-intl";

interface CardEditorAdapterProps {
  data: CreateCardData;
  onUpdate: (updater: (prev: CreateCardData) => CreateCardData) => void;
  saving?: boolean;
  lastSaved?: Date | null;
  onBack: () => void;
  onSave: () => void;
}

export const CardEditorAdapter: React.FC<CardEditorAdapterProps> = ({
  data,
  onUpdate,
  saving,
  lastSaved,
  onBack,
  onSave,
}) => {
  const t = useTranslations("CreateCard");

  // Transform CreateCardData to CreateTemplateData
  const templateData = useMemo((): CreateTemplateData => {
    // Construct a single section from card content
    const cardSection: Section = {
      section_id: "card_section", // Fixed ID for the single card section
      display_name: data.card_name || data.card_type || t("untitled"),
      background_url: data.content.background_url
        ? [data.content.background_url]
        : [],
      order: 0,
      icon_url: "",
      blocks: data.content.blocks || [],
      header_config: data.content.header_config,
      footer_config: data.content.footer_config,
      style_config: {
        background_color: data.content.background_color,
        background_opacity: data.content.background_opacity,
        background_image: data.content.background_url,
        padding: data.content.style_config?.padding,
        gap: data.content.style_config?.gap,
        ...data.content.style_config,
      },
      // Store card-specific info in section metadata if needed
    };

    return {
      master: {
        template_name: data.card_name || "",
        name_machine: "", // Can be empty for editor
        description: "",
        status: data.status || "active",
        log: data.log || {
          created_at: "",
          creator_user_id: "",
          creator_first_name: "",
          creator_last_name: "",
        },
        access_config: data.access_config || {
          access_type: "public",
          allowed_groups: [],
        },
      },
      version: {
        version_num: 1,
        commit_message: "Card Editor",
        log: data.log || {
          created_at: "",
          creator_user_id: "",
          creator_first_name: "",
          creator_last_name: "",
        },
        content: {
          style_config: {
            // Map card global styles into template global styles for editor mode
            font: data.content.style_config?.font || "Arial",
            primary_color:
              data.content.style_config?.primary_color || "#000000",
            secondary_color:
              data.content.style_config?.secondary_color || "#666666",
            background_color:
              data.content.style_config?.background_color || "#ffffff",
            background_image: data.content.style_config?.background_image,
            font_size: data.content.style_config?.font_size,
            font_weight: data.content.style_config?.font_weight,
            line_height: data.content.style_config?.line_height,
            text_align: data.content.style_config?.text_align,
          },
          header_config: data.content.header_config,
          footer_config: data.content.footer_config,
          sections: [cardSection],
        },
      },
    };
  }, [data, t]);

  // Handle updates from EditorLayout (CreateTemplateData) -> CreateCardData
  const handleTemplateUpdate = useCallback(
    (updater: (prev: CreateTemplateData) => CreateTemplateData) => {
      const nextTemplate = updater(templateData);

      // We expect at least one section. If user added more, we might just take the first one
      // or warned them. For now, let's take the first section as the card content.
      const primarySection = nextTemplate.version.content.sections[0];

      if (!primarySection) return;

      onUpdate((prevCard) => {
        const syncedHeaderConfig =
          primarySection.header_config ||
          nextTemplate.version.content.header_config ||
          prevCard.content.header_config;

        const syncedFooterConfig =
          primarySection.footer_config ||
          nextTemplate.version.content.footer_config ||
          prevCard.content.footer_config;

        return {
          ...prevCard,
          card_name: nextTemplate.master.template_name,
          access_config:
            nextTemplate.master.access_config || prevCard.access_config,
          content: {
            ...prevCard.content,
            blocks: primarySection.blocks,
            header_config: syncedHeaderConfig,
            footer_config: syncedFooterConfig,
            background_url:
              primarySection.style_config?.background_image ||
              (primarySection.background_url &&
                primarySection.background_url[0]) ||
              "",
            background_color: primarySection.style_config?.background_color,
            background_opacity: primarySection.style_config?.background_opacity,
            style_config: {
              ...prevCard.content.style_config,
              ...nextTemplate.version.content.style_config,
              padding: primarySection.style_config?.padding,
              gap: primarySection.style_config?.gap,
              // Sync other style props
            },
          },
        };
      });
    },
    [templateData, onUpdate],
  );

  return (
    <div className="card-editor-adapter h-full w-full">
      <EditorLayout
        data={templateData}
        onUpdate={handleTemplateUpdate}
        saving={saving}
        lastSaved={lastSaved}
        onBack={onBack}
        onSave={onSave}
        isCardMode={true}
        cardType={data.card_type}
        cardTags={data.tags}
        onCardTypeChange={(type) =>
          onUpdate((prev) => ({ ...prev, card_type: type }))
        }
        onCardTagsChange={(tags) => onUpdate((prev) => ({ ...prev, tags }))}
      />
    </div>
  );
};
