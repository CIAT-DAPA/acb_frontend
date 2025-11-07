"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";
import { Plus, Trash2 } from "lucide-react";
import { btnOutlineSecondary } from "@/app/[locale]/components/ui";
import { VisualResourceSelector } from "../VisualResourceSelector";

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
  const t = useTranslations("CreateTemplate.fieldEditor");

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
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            Imagen Predefinida (Value)
          </label>
          <p className="text-xs text-[#283618]/50 mb-3">
            Como este campo no se muestra en el formulario (form = false), debes
            especificar la imagen que se mostrará directamente en el boletín
          </p>

          {currentField.value ? (
            <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-white">
              {/* Preview de la imagen */}
              <div className="flex-shrink-0 w-20 h-20 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center">
                <img
                  src={currentField.value as string}
                  alt="Imagen predefinida"
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
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-1"
                >
                  Cambiar imagen
                </button>
              </div>

              {/* Botón eliminar */}
              <button
                type="button"
                onClick={() => updateField({ value: undefined })}
                className="flex-shrink-0 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                title="Eliminar valor predefinido"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowValueSelector(true)}
              className="w-full px-4 py-3 text-sm border-2 border-dashed border-gray-300 rounded hover:bg-white hover:border-blue-400 text-gray-600 hover:text-blue-600 transition-colors"
            >
              + Seleccionar imagen predefinida
            </button>
          )}
        </div>
      )}

      {/* Lista de imágenes (solo cuando form es true) */}
      {currentField.form && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="block text-sm font-medium text-[#283618]/70">
              Imágenes Disponibles
            </label>
            <button
              type="button"
              onClick={addImage}
              className={`${btnOutlineSecondary} text-sm flex items-center`}
            >
              <Plus className="w-4 h-4 mr-1" /> Agregar Imagen
            </button>
          </div>

          <p className="text-xs text-[#283618]/50 mb-3">
            Agrega las imágenes que el usuario podrá seleccionar para este campo
          </p>

          <div className="space-y-3">
            {images.map((imageUrl, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border border-gray-200 rounded-md bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {/* Preview de la imagen */}
                <div className="flex-shrink-0 w-16 h-16 bg-white border border-gray-200 rounded overflow-hidden flex items-center justify-center">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={`Imagen ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/img/imageNotFound.png";
                      }}
                    />
                  ) : (
                    <span className="text-gray-400 text-xs">Sin imagen</span>
                  )}
                </div>

                {/* Información y botones */}
                <div className="flex-1 min-w-0">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Imagen {index + 1}
                  </label>
                  {imageUrl ? (
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-600 truncate flex-1">
                        {imageUrl}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowImageSelectorForIndex(index)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Cambiar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowImageSelectorForIndex(index)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded hover:bg-white text-left text-gray-500"
                    >
                      Seleccionar imagen
                    </button>
                  )}
                </div>

                {/* Botón eliminar */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="flex-shrink-0 text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded transition-colors"
                  title="Eliminar imagen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}

            {images.length === 0 && (
              <div className="text-center py-8 text-gray-500 text-sm border border-gray-200 rounded-md bg-gray-50">
                <p className="mb-2">No hay imágenes configuradas</p>
                <p className="text-xs">
                  Haz clic en "Agregar Imagen" para comenzar
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Vista previa de galería (solo cuando form es true) */}
      {currentField.form && images.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-[#283618]/70 mb-2">
            Vista Previa de la Galería
          </label>
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
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "/assets/img/imageNotFound.png";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-gray-400 text-xs">Sin imagen</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#283618]/50 mt-3 text-center">
              El usuario podrá seleccionar una de estas imágenes
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
        title={`Seleccionar Imagen ${(showImageSelectorForIndex ?? 0) + 1}`}
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
        title="Seleccionar Imagen Predefinida"
        resourceType="image"
        selectedUrl={currentField.value as string | undefined}
      />
    </div>
  );
};
