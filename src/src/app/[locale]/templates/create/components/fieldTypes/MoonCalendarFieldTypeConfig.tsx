"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { MoonCalendarFieldConfig } from "../../../../../../types/template";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { VisualResourceSelector } from "../VisualResourceSelector";
import Image from "next/image";
import {
  btnOutlineSecondary,
  inputClass,
  labelClass,
  helpTextClass,
  iconContainerClass,
} from "@/app/[locale]/components/ui";

export const MoonCalendarFieldTypeConfig: React.FC<
  BaseFieldTypeConfigProps
> = ({ currentField, updateField, updateFieldConfig, updateValidation, t }) => {
  const configT = useTranslations(
    "CreateTemplate.fieldEditor.moonCalendarConfig"
  );
  const [showIconSelector, setShowIconSelector] = useState(false);

  const fieldConfig =
    (currentField.field_config as MoonCalendarFieldConfig) || {};
  const titleIcon = fieldConfig.title_icon;
  const titleLabel = fieldConfig.title_label || "";

  const handleIconSelect = (url: string) => {
    updateFieldConfig({ title_icon: url });
    setShowIconSelector(false);
  };

  const handleLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFieldConfig({ title_label: e.target.value });
  };

  return (
    <div className="space-y-4">
      {/* Título del calendario */}
      <div>
        <label className={labelClass}>{configT("titleLabel")}</label>
        <input
          type="text"
          value={titleLabel}
          onChange={handleLabelChange}
          className={inputClass}
          placeholder={configT("titlePlaceholder")}
        />
        <p className={helpTextClass}>{configT("titleHelp")}</p>
      </div>

      {/* Icono del título */}
      <div>
        <label className={labelClass}>{configT("titleIcon")}</label>

        {titleIcon ? (
          <div className={`${iconContainerClass} bg-green-50 border-green-200`}>
            <Image
              src={titleIcon}
              alt="Title icon"
              width={32}
              height={32}
              className="object-contain"
            />
            <div className="flex-1">
              <span className="text-xs font-medium text-green-800 block">
                {configT("iconSelected")}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowIconSelector(true)}
              className={`${btnOutlineSecondary} text-xs`}
            >
              {configT("changeIcon")}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowIconSelector(true)}
            className={btnOutlineSecondary}
          >
            {configT("selectIcon")}
          </button>
        )}

        <p className={helpTextClass}>{configT("titleIconHelp")}</p>
      </div>

      {/* Selector de icono */}
      <VisualResourceSelector
        isOpen={showIconSelector}
        onSelect={handleIconSelect}
        onClose={() => setShowIconSelector(false)}
        resourceType="icon"
        title={configT("selectIconTitle")}
      />
    </div>
  );
};
