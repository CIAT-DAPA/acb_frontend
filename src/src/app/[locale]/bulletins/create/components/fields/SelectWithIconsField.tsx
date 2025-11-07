"use client";

import React from "react";

interface SelectWithIconsFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function SelectWithIconsField({
  value = "",
  onChange,
  options = [],
  placeholder = "Seleccionar...",
  disabled = false,
}: SelectWithIconsFieldProps) {
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
      disabled={disabled}
    >
      <option value="">{placeholder}</option>
      {options.map((option: string) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
