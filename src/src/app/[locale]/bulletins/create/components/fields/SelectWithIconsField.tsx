"use client";

import React from "react";
import { useTranslations } from "next-intl";

interface SelectWithIconsFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  icons?: string[];
  placeholder?: string;
  disabled?: boolean;
}

export function resolveSelectedOptionIndex(
  value: string,
  options: string[] = [],
  icons: string[] = [],
): number {
  if (!value) return -1;

  const byOption = options.indexOf(value);
  if (byOption !== -1) return byOption;

  return icons.indexOf(value);
}

export function SelectWithIconsField({
  value = "",
  onChange,
  options = [],
  icons = [],
  placeholder,
  disabled = false,
}: SelectWithIconsFieldProps) {
  const t = useTranslations("TemplateForm");
  const finalPlaceholder = placeholder ?? t("selectOption");

  const selectedIndex = resolveSelectedOptionIndex(value, options, icons);
  const selectedOption = selectedIndex === -1 ? "" : options[selectedIndex];
  const selectedIcon = selectedIndex === -1 ? "" : icons[selectedIndex] || "";

  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  const select = (
    <select
      value={selectedOption}
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

  if (!selectedIcon) {
    return select;
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <img
        src={selectedIcon}
        alt=""
        aria-hidden="true"
        className={`h-[1em] w-auto max-w-[2em] shrink-0 object-contain ${
          disabled ? "opacity-50" : ""
        }`}
      />
      <div className="min-w-0 flex-1">{select}</div>
    </div>
  );
}
