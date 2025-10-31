"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Field } from "../../../../../../types/template";

interface SelectInputProps {
  field?: Field;
  value: string;
  onChange: (value: string) => void;
  options?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function SelectInput({
  field,
  value,
  onChange,
  options: optionsProp,
  placeholder,
  disabled = false,
}: SelectInputProps) {
  const t = useTranslations("TemplateForm");

  // Usar options de prop o extraer de field
  const options =
    optionsProp ||
    (field?.field_config && "options" in field.field_config
      ? field.field_config.options
      : []);

  const finalPlaceholder = placeholder || t("selectOption");
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
      disabled={disabled}
    >
      <option value="">{finalPlaceholder}</option>
      {options.map((opt: string, idx: number) => (
        <option key={idx} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  );
}
