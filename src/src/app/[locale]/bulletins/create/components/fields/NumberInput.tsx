"use client";

import React from "react";
import { Field } from "../../../../../../types/template";

interface NumberInputProps {
  field?: Field;
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function NumberInput({
  field,
  value,
  onChange,
  placeholder,
  min,
  max,
  disabled = false,
}: NumberInputProps) {
  const finalPlaceholder =
    placeholder || field?.description || field?.label || "";
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={finalPlaceholder}
      className={inputClass}
      min={min}
      max={max}
      disabled={disabled}
    />
  );
}
