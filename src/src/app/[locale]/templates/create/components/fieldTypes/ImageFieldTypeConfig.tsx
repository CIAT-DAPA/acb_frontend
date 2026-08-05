"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import {
  btnOutlineSecondary,
  labelClass,
  helpTextClass,
  infoBoxClass,
  imageCardClass,
  imagePreviewLargeClass,
  btnDangerIconClass,
} from "@/app/[locale]/components/ui";
import { VisualResourceSelector } from "../VisualResourceSelector";
import { normalizeAssetUrl } from "@/utils/assetUrl";

interface ImageFieldConfig {
  show_label?: boolean;
  label_text?: string;
  max_height?: number;
}

export const ImageFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.imageConfig");

  const config = (currentField.field_config as ImageFieldConfig) || {};
  const showLabel = config.show_label ?? false;
  const labelText = config.label_text || "";
  const configuredMaxHeight = Number(config.max_height);
  const maxHeight =
    Number.isFinite(configuredMaxHeight) && configuredMaxHeight > 0
      ? configuredMaxHeight
      : "";

  // This selector is used only for a static image when form=false.
  const [showValueSelector, setShowValueSelector] = useState(false);

  const handleShowLabelChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updateFieldConfig({ show_label: event.target.checked });
  };

  const handleLabelTextChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    updateFieldConfig({ label_text: event.target.value });
  };

  const handleMaxHeightChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const rawValue = event.target.value;

    if (rawValue === "") {
      updateFieldConfig({ max_height: undefined });
      return;
    }

    const parsedValue = Number(rawValue);
    if (!Number.isFinite(parsedValue)) return;

    updateFieldConfig({
      max_height: Math.max(1, Math.round(parsedValue)),
    });
  };

  return (
    <div className="space-y-4">
      {!currentField.form && (
        <div className={infoBoxClass}>
          <label className={labelClass}>{t("predefinedImageLabel")}</label>
          <p className={helpTextClass}>{t("predefinedImageHelp")}</p>

          {currentField.value ? (
            <div className={imageCardClass}>
              <div className={imagePreviewLargeClass}>
                <img
                  src={normalizeAssetUrl(currentField.value as string)}
                  alt={t("predefinedImageAlt")}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = "/assets/img/imageNotFound.png";
                  }}
                />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block truncate text-xs text-gray-600">
                  {currentField.value as string}
                </span>
                <button
                  type="button"
                  onClick={() => setShowValueSelector(true)}
                  className={`${btnOutlineSecondary} mt-1`}
                >
                  {t("changeImage")}
                </button>
              </div>

              <button
                type="button"
                onClick={() => updateField({ value: undefined })}
                className={btnDangerIconClass}
                title={t("deleteValue")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowValueSelector(true)}
              className={btnOutlineSecondary}
            >
              + {t("selectPredefinedImage")}
            </button>
          )}
        </div>
      )}

      <div>
        <label className="flex cursor-pointer items-center space-x-2">
          <input
            type="checkbox"
            checked={showLabel}
            onChange={handleShowLabelChange}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className={labelClass}>{t("showLabel")}</span>
        </label>
        <p className={helpTextClass}>{t("showLabelHelp")}</p>

        {showLabel && (
          <div className="mt-3">
            <label className={labelClass}>{t("labelText")}</label>
            <input
              type="text"
              value={labelText}
              onChange={handleLabelTextChange}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("labelPlaceholder")}
            />
            <p className={helpTextClass}>{t("labelTextHelp")}</p>
          </div>
        )}
      </div>

      <div>
        <label className={labelClass}>{t("maxHeightLabel")}</label>
        <div className="relative mt-1">
          <input
            type="number"
            min={1}
            step={1}
            value={maxHeight}
            onChange={handleMaxHeightChange}
            className="w-full rounded-md border border-gray-300 px-3 py-2 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t("maxHeightPlaceholder")}
          />
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-gray-500">
            px
          </span>
        </div>
        <p className={helpTextClass}>{t("maxHeightHelp")}</p>
      </div>

      {/*
        No field_config.images selector is rendered when form=true.
        The bulletin editor uses ImageInput to upload from the computer.
      */}

      <VisualResourceSelector
        isOpen={showValueSelector}
        onClose={() => setShowValueSelector(false)}
        onSelect={(url) => {
          updateField({ value: url });
          setShowValueSelector(false);
        }}
        title={t("selectPredefinedImageTitle")}
        resourceType="image"
        selectedUrl={currentField.value as string | undefined}
      />
    </div>
  );
};
