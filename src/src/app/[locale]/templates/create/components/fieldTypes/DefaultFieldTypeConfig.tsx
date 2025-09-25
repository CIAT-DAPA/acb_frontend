"use client";

import React from "react";
import { BaseFieldTypeConfigProps } from "./BaseFieldTypeConfig";

export const DefaultFieldTypeConfig: React.FC<BaseFieldTypeConfigProps> = ({
  currentField,
  updateField,
  updateFieldConfig,
  updateValidation,
  t: fieldT,
}) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
      <div className="mb-3">
        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-2">
          🔧
        </div>
        <h3 className="text-sm font-medium text-gray-700">
          Configuración de tipo "{currentField.type}"
        </h3>
      </div>
      <p className="text-sm text-gray-600 mb-2">
        Este tipo de campo aún no tiene configuración específica implementada.
      </p>
      <p className="text-xs text-gray-500">
        Las propiedades generales (nombre, descripción, estilos) están
        disponibles en las otras secciones del editor.
      </p>
    </div>
  );
};
