"use client";

import React from "react";
import { useTranslations } from "next-intl";

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
  placeholder,
  disabled = false,
}: SelectWithIconsFieldProps) {
  const t = useTranslations("TemplateForm");
  const finalPlaceholder = placeholder ?? t("selectOption");

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <select
      value={value || ""}
      onChange={(event) => onChange(event.target.value)}
      className={inputClass}
      disabled={disabled}
      aria-label={finalPlaceholder}
    >
      <option value="">{finalPlaceholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}
