"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

// CSS Constants
const CONTAINER_CLASS =
  "bg-gray-50 border border-gray-200 rounded-lg p-6 text-center";
const ICON_CONTAINER_CLASS =
  "w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2";
const TITLE_CLASS = "text-sm font-medium text-gray-700";
const MESSAGE_CLASS = "text-sm text-gray-600 mb-2";
const HELP_TEXT_CLASS = "text-xs text-gray-500";

export const DefaultFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.defaultConfig");

  return (
    <div className={CONTAINER_CLASS}>
      <div className="mb-3">
        <div className={ICON_CONTAINER_CLASS}>🔧</div>
        <h3 className={TITLE_CLASS}>
          {t("title", { type: currentField.type })}
        </h3>
      </div>
      <p className={MESSAGE_CLASS}>{t("message")}</p>
      <p className={HELP_TEXT_CLASS}>{t("helpText")}</p>
    </div>
  );
};
