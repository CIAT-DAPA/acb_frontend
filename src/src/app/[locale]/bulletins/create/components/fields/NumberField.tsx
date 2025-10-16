"use client";

import React from "react";

interface NumberFieldProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  disabled?: boolean;
}

export function NumberField({
  value = 0,
  onChange,
  placeholder,
  min,
  max,
  disabled = false,
}: NumberFieldProps) {
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      placeholder={placeholder}
      className={inputClass}
      min={min}
      max={max}
      disabled={disabled}
    />
  );
}
