"use client";

import React from "react";
import {
  Field,
  SelectBackgroundFieldConfig,
} from "../../../../../../types/template";
import { Check } from "lucide-react";

interface SelectBackgroundFieldProps {
  field: Field;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SelectBackgroundField({
  field,
  value,
  onChange,
  disabled = false,
}: SelectBackgroundFieldProps) {
  const config = field.field_config as SelectBackgroundFieldConfig;
  const options = config?.options || [];
  const backgroundsUrl = config?.backgrounds_url || [];

  // Función para obtener la URL completa de la imagen
  const getBackgroundUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }
    // Si es una ruta relativa, agregar el prefijo del servidor
    return url.startsWith("/") ? url : `/${url}`;
  };

  return (
    <div className="space-y-2">
      {/* Label */}
      {field.label && (
        <label className="block text-sm font-medium text-gray-700">
          {field.label}
          {field.validation?.required && (
            <span className="text-red-500 ml-1">*</span>
          )}
        </label>
      )}

      {/* Description */}
      {field.description && (
        <p className="text-sm text-gray-500">{field.description}</p>
      )}

      {/* Grid de opciones con miniaturas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {options.map((option, index) => {
          const backgroundUrl = backgroundsUrl[index] || "";
          const isSelected = value === option;

          return (
            <button
              key={option}
              type="button"
              onClick={() => !disabled && onChange(option)}
              disabled={disabled}
              className={`relative rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                isSelected
                  ? "border-[#283618] shadow-lg ring-2 ring-[#283618]/20"
                  : "border-gray-300 hover:border-[#606c38]"
              } ${
                disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
              }`}
            >
              {/* Imagen de fondo */}
              <div className="aspect-video relative">
                {backgroundUrl ? (
                  <img
                    src={getBackgroundUrl(backgroundUrl)}
                    alt={option}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // Fallback si la imagen no carga
                      (e.target as HTMLImageElement).src =
                        "/assets/img/imageNotFound.png";
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Sin imagen</span>
                  </div>
                )}

                {/* Overlay de selección */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[#283618]/20 flex items-center justify-center">
                    <div className="bg-[#283618] rounded-full p-2">
                      <Check className="text-white" size={20} />
                    </div>
                  </div>
                )}
              </div>

              {/* Nombre de la opción */}
              <div
                className={`p-2 text-center text-sm font-medium ${
                  isSelected
                    ? "bg-[#283618] text-white"
                    : "bg-gray-50 text-gray-700"
                }`}
              >
                {option}
              </div>
            </button>
          );
        })}
      </div>

      {/* Mensaje de error si no hay opciones */}
      {options.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          No hay opciones de fondo disponibles
        </p>
      )}

      {/* Valor actual (solo para debug si es necesario) */}
      {value && <input type="hidden" name={field.field_id} value={value} />}
    </div>
  );
}
