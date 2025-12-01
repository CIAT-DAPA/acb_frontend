"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

export const MoonCalendarFieldTypeConfig: React.FC<
  BaseFieldTypeConfigProps
> = ({ currentField, updateField, updateFieldConfig, updateValidation, t }) => {
  const configT = useTranslations(
    "CreateTemplate.fieldEditor.moonCalendarConfig"
  );

  return (
    <div className="text-sm text-gray-600 bg-gray-50 rounded-md">
      <p>{configT("noConfigNeeded")}</p>
      <p className="mt-2 text-xs">{configT("description")}</p>
    </div>
  );
};
