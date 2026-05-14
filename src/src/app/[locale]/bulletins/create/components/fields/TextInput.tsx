"use client";

import React from "react";
import { Field } from "../../../../../../types/template";

interface TextInputProps {
  field?: Field;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLong?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

export function TextInput({
  field,
  value,
  onChange,
  placeholder,
  isLong: isLongProp,
  maxLength,
  disabled = false,
}: TextInputProps) {
  // Determinar si es texto largo desde field o prop directa
  const isLongText =
    isLongProp !== undefined
      ? isLongProp
      : field?.field_config &&
        "subtype" in field.field_config &&
        field.field_config.subtype === "long";

  const finalPlaceholder =
    placeholder || field?.description || field?.label || "";

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  return isLongText ? (
    <div>
      <textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={finalPlaceholder}
        className={`${inputClass} min-h-[100px]`}
        maxLength={maxLength}
        disabled={disabled}
      />
      {typeof maxLength === "number" && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {(typeof value === "string" ? value.length : 0) + " / " + maxLength}
        </div>
      )}
    </div>
  ) : (
    <div>
      <input
        type="text"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={finalPlaceholder}
        className={inputClass}
        maxLength={maxLength}
        disabled={disabled}
      />
      {typeof maxLength === "number" && (
        <div className="text-xs text-gray-500 mt-1 text-right">
          {(typeof value === "string" ? value.length : 0) + " / " + maxLength}
        </div>
      )}
    </div>
  );
}
