"use client";

import React from "react";

interface ClimateDataFieldProps {
  value: any;
  onChange: (value: any) => void;
  fieldConfig?: any;
  disabled?: boolean;
}

export function ClimateDataField({
  value = {},
  onChange,
  fieldConfig,
  disabled = false,
}: ClimateDataFieldProps) {
  const availableParams = fieldConfig?.available_parameters || {};
  const paramEntries = Object.entries(availableParams);

  // Si no hay parámetros configurados, mostrar un mensaje
  if (paramEntries.length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">
        No hay parámetros climáticos configurados
      </div>
    );
  }

  const handleParamChange = (paramKey: string, paramValue: string) => {
    const newValue = {
      ...value,
      [paramKey]: paramValue,
    };
    onChange(newValue);
  };

  const inputClass =
    "px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <div className="space-y-3">
      {paramEntries.map(([paramKey, paramConfig]: [string, any]) => {
        const showName = paramConfig.showName !== false;
        const currentValue = value[paramKey] || "";

        return (
          <div key={paramKey} className="flex flex-col gap-1">
            {showName && (
              <label className="text-sm font-medium text-gray-700">
                {paramConfig.label}
              </label>
            )}
            <div className="flex items-center gap-2">
              <input
                type={paramConfig.type === "number" ? "number" : "text"}
                value={currentValue}
                onChange={(e) => handleParamChange(paramKey, e.target.value)}
                placeholder={paramConfig.label}
                className={`flex-1 ${inputClass}`}
                disabled={disabled}
                step={paramConfig.type === "number" ? "any" : undefined}
              />
              {paramConfig.unit && (
                <span className="text-sm text-gray-600 min-w-[40px]">
                  {paramConfig.unit}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
