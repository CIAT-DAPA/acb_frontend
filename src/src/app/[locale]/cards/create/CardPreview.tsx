"use client";

import React, { useMemo } from "react";
import { useTranslations } from "next-intl";
import { CreateCardData, CARD_TYPES } from "../../../../types/card";
import { CreateTemplateData, Section } from "../../../../types/template";
import { TemplatePreview } from "../../templates/create/TemplatePreview";

interface CardPreviewProps {
  data: CreateCardData;
}

export function CardPreview({ data }: CardPreviewProps) {
  const t = useTranslations("CreateCard.preview");

  // Convertir CardData a TemplateData para reutilizar TemplatePreview
  const templateData = useMemo((): CreateTemplateData => {
    // Crear una sección a partir del contenido de la card
    const section: Section = {
      section_id: "card_section",
      display_name: data.card_name || t("untitled"),
      background_url: data.content.background_url
        ? [data.content.background_url]
        : [],
      order: 0,
      icon_url: "",
      blocks: data.content.blocks,
      style_config: {
        background_color: data.content.background_color,
        background_image: data.content.background_url,
        // Aplicar padding y gap del content style_config
        padding: data.content.style_config?.padding,
        gap: data.content.style_config?.gap,
      },
      header_config: data.content.header_config,
      footer_config: data.content.footer_config,
    };

    return {
      master: {
        template_name: `${CARD_TYPES[data.card_type]?.icon} ${
          data.card_name || t("untitled")
        }`,
        description: `Card de tipo: ${CARD_TYPES[data.card_type]?.label}`,
        status: data.status || "active",
        log: data.log || {
          created_at: new Date().toISOString(),
          creator_user_id: "",
          creator_first_name: null,
          creator_last_name: null,
        },
        access_config: data.access_config,
      },
      version: {
        version_num: 1,
        commit_message: "Card preview",
        log: data.log || {
          created_at: new Date().toISOString(),
          creator_user_id: "",
          creator_first_name: null,
          creator_last_name: null,
        },
        content: {
          style_config: {
            font: "Arial",
            primary_color: "#000000",
            secondary_color: "#666666",
            background_color: "#ffffff",
          },
          sections: [section],
        },
      },
    };
  }, [data, t]);

  // Reutilizar el TemplatePreview con los datos convertidos
  return <TemplatePreview data={templateData} selectedSectionIndex={0} />;
}
