"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus, Trash2 } from "lucide-react";
import {
  btnOutlineSecondary,
  labelClass,
  helpTextClass,
  infoBoxClass,
  imageCardClass,
  imageItemClass,
  imagePreviewClass,
  imagePreviewLargeClass,
  emptyStateClass,
  btnDangerIconClass,
} from "@/app/[locale]/components/ui";
import { VisualResourceSelector } from "../VisualResourceSelector";

interface ImageFieldConfig {
  images: string[];
  show_label?: boolean;
  label_text?: string;
}

export const ImageFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.imageConfig");

  const config = (currentField.field_config as ImageFieldConfig) || {};
  const images = config.images || [];
  const showLabel = config.show_label ?? false;
  const labelText = config.label_text || "";

  // Estado para el selector de imágenes
  const [showImageSelectorForIndex, setShowImageSelectorForIndex] = useState<
    number | null
  >(null);

  // Estado para el selector de value (cuando form es false)
  const [showValueSelector, setShowValueSelector] = useState(false);

  const updateImages = (newImages: string[]) => {
    updateFieldConfig({ images: newImages });
  };

  const handleShowLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFieldConfig({ show_label: e.target.checked });
  };

  const handleLabelTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFieldConfig({ label_text: e.target.value });
  };

  const addImage = () => {
    const newImages = [...images, ""];
    updateImages(newImages);
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    updateImages(newImages);
  };

  const updateImage = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    updateImages(newImages);
  };

  return (
    <div className="space-y-4">
      {/* Cuando form es false, mostrar selector de value */}
      {!currentField.form && (
        <div className={infoBoxClass}>
          <label className={labelClass}>{t("predefinedImageLabel")}</label>
          <p className={helpTextClass}>{t("predefinedImageHelp")}</p>

          {currentField.value ? (
            <div className={imageCardClass}>
              {/* Preview de la imagen */}
              <div className={imagePreviewLargeClass}>
                <img
                  src={currentField.value as string}
                  alt={t("predefinedImageAlt")}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/img/imageNotFound.png";
                  }}
                />
              </div>

              {/* Información */}
              <div className="flex-1 min-w-0">
                <span className="text-xs text-gray-600 truncate block">
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

              {/* Botón eliminar */}
              <button
                type="button"
                onClick={() => updateField({ value: undefined })}
                className={btnDangerIconClass}
                title={t("deleteValue")}
              >
                <Trash2 className="w-4 h-4" />
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

      {/* Configuración del label */}
      <div>
        <label className="flex items-center space-x-2 cursor-pointer">
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t("labelPlaceholder")}
            />
            <p className={helpTextClass}>{t("labelTextHelp")}</p>
          </div>
        )}
      </div>

      {/* Lista de imágenes (solo cuando form es true) */}
      {currentField.form && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={labelClass}>{t("availableImagesLabel")}</label>
            <button
              type="button"
              onClick={addImage}
              className={`${btnOutlineSecondary} text-sm flex items-center`}
            >
              <Plus className="w-4 h-4 mr-1" /> {t("addImage")}
            </button>
          </div>

          <p className={helpTextClass}>{t("availableImagesHelp")}</p>

          <div className="space-y-3">
            {images.map((imageUrl, index) => (
              <div key={index} className={imageItemClass}>
                {/* Preview de la imagen */}
                <div className={imagePreviewClass}>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={t("imageNumber", { number: index + 1 })}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/img/imageNotFound.png";
                      }}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">
                      {t("noImage")}
                    </span>
                  )}
                </div>

                {/* Información y botones */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("imageNumber", { number: index + 1 })}
                  </label>
                  {imageUrl ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 truncate flex-1">
                        {imageUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowImageSelectorForIndex(index)}
                        className={`${btnOutlineSecondary} text-sm`}
                      >
                        {t("change")}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowImageSelectorForIndex(index)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-white text-left text-gray-500"
                    >
                      {t("selectImage")}
                    </button>
                  )}
                </div>

                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className={btnDangerIconClass}
                  title={t("deleteImage")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {images.length === 0 && (
              <div className={emptyStateClass}>
                <p className="mb-2">{t("noImagesConfigured")}</p>
                <p className="text-xs">{t("clickAddImage")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal del selector de imágenes para field_config.images */}
      <VisualResourceSelector
        isOpen={showImageSelectorForIndex !== null}
        onClose={() => setShowImageSelectorForIndex(null)}
        onSelect={(url) => {
          if (showImageSelectorForIndex !== null) {
            updateImage(showImageSelectorForIndex, url);
          }
        }}
        title={t("selectImageTitle", {
          number: (showImageSelectorForIndex ?? 0) + 1,
        })}
        resourceType="image"
        selectedUrl={
          showImageSelectorForIndex !== null
            ? images[showImageSelectorForIndex]
            : undefined
        }
      />

      {/* Modal del selector de imagen para value (cuando form es false) */}
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
