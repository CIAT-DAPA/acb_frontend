"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus, Trash2 } from "lucide-react";
import { btnOutlineSecondary } from "@/app/[locale]/components/ui";
import { VisualResourceSelector } from "../VisualResourceSelector";

// CSS Constants
const LABEL_CLASS = "block text-sm font-medium text-[#283618]/70 mb-2";
const HELP_TEXT_CLASS = "text-xs text-[#283618]/50 mb-3";
const INFO_BOX_CLASS = "p-4 bg-blue-50 border border-blue-200 rounded-md";
const IMAGE_CARD_CLASS =
  "flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-white";
const IMAGE_ITEM_CLASS =
  "flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors";
const IMAGE_PREVIEW_CLASS =
  "flex-shrink-0 w-16 h-16 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center";
const IMAGE_PREVIEW_LARGE_CLASS =
  "flex-shrink-0 w-20 h-20 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center";
const BUTTON_CHANGE_CLASS =
  "text-xs text-blue-600 hover:text-blue-800 font-medium";
const BUTTON_DELETE_CLASS =
  "flex-shrink-0 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors";
const BUTTON_SELECT_CLASS =
  "w-full px-4 py-3 text-sm border-2 border-dashed border-gray-300 rounded hover:bg-white hover:border-blue-400 text-gray-600 hover:text-blue-600 transition-colors";
const EMPTY_STATE_CLASS =
  "text-center py-8 text-gray-500 text-sm border border-gray-200 rounded-md bg-gray-50";

interface ImageFieldConfig {
  images: string[];
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

  // Estado para el selector de imágenes
  const [showImageSelectorForIndex, setShowImageSelectorForIndex] = useState<
    number | null
  >(null);

  // Estado para el selector de value (cuando form es false)
  const [showValueSelector, setShowValueSelector] = useState(false);

  const updateImages = (newImages: string[]) => {
    updateFieldConfig({ images: newImages });
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
        <div className={INFO_BOX_CLASS}>
          <label className={LABEL_CLASS}>{t("predefinedImageLabel")}</label>
          <p className={HELP_TEXT_CLASS}>{t("predefinedImageHelp")}</p>

          {currentField.value ? (
            <div className={IMAGE_CARD_CLASS}>
              {/* Preview de la imagen */}
              <div className={IMAGE_PREVIEW_LARGE_CLASS}>
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
                  className={`${BUTTON_CHANGE_CLASS} mt-1`}
                >
                  {t("changeImage")}
                </button>
              </div>

              {/* Botón eliminar */}
              <button
                type="button"
                onClick={() => updateField({ value: undefined })}
                className={BUTTON_DELETE_CLASS}
                title={t("deleteValue")}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowValueSelector(true)}
              className={BUTTON_SELECT_CLASS}
            >
              + {t("selectPredefinedImage")}
            </button>
          )}
        </div>
      )}

      {/* Lista de imágenes (solo cuando form es true) */}
      {currentField.form && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className={LABEL_CLASS}>{t("availableImagesLabel")}</label>
            <button
              type="button"
              onClick={addImage}
              className={`${btnOutlineSecondary} text-sm flex items-center`}
            >
              <Plus className="w-4 h-4 mr-1" /> {t("addImage")}
            </button>
          </div>

          <p className={HELP_TEXT_CLASS}>{t("availableImagesHelp")}</p>

          <div className="space-y-3">
            {images.map((imageUrl, index) => (
              <div key={index} className={IMAGE_ITEM_CLASS}>
                {/* Preview de la imagen */}
                <div className={IMAGE_PREVIEW_CLASS}>
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
                        className={BUTTON_CHANGE_CLASS}
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
                  className={BUTTON_DELETE_CLASS}
                  title={t("deleteImage")}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {images.length === 0 && (
              <div className={EMPTY_STATE_CLASS}>
                <p className="mb-2">{t("noImagesConfigured")}</p>
                <p className="text-xs">{t("clickAddImage")}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista previa de galería (solo cuando form es true) */}
      {currentField.form && images.length > 0 && (
        <div>
          <label className={LABEL_CLASS}>{t("galleryPreviewLabel")}</label>
          <div className="p-4 border border-gray-200 rounded-md bg-white">
            <div className="grid grid-cols-3 gap-3">
              {images.map((imageUrl, index) => (
                <div
                  key={index}
                  className="aspect-square border border-gray-200 rounded overflow-hidden hover:border-[#bc6c25] transition-colors cursor-pointer"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={t("previewNumber", { number: index + 1 })}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/img/imageNotFound.png";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400 text-xs">
                        {t("noImage")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#283618]/50 mt-3 text-center">
              {t("galleryPreviewHelp")}
            </p>
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
