"use client";

import React, { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import {
  helpTextClass,
  inputClass,
  labelClass,
  selectClass,
} from "@/app/[locale]/components/ui";
import { resolveAppLocale, toDateLocaleCode } from "@/utils/locale";
import {
  DEFAULT_DATE_FORMAT,
  formatDateWithPattern,
} from "@/utils/dateFormat";

const CUSTOM_OPTION = "__custom__";

interface DateFormatSelectorProps {
  value?: string;
  presets: readonly string[];
  onChange: (format: string) => void;
  label?: string; // Por defecto, "Formato de fecha"
}

export function DateFormatSelector({
  value,
  presets,
  onChange,
  label,
}: DateFormatSelectorProps) {
  const t = useTranslations("CreateTemplate.fieldEditor.dateConfig");
  const hookLocale = useLocale();
  const pathname = usePathname();
  const localeCode = toDateLocaleCode(resolveAppLocale(pathname, hookLocale));

  const currentFormat = value || DEFAULT_DATE_FORMAT;
  const isPreset = presets.includes(currentFormat);

  const [isCustom, setIsCustom] = useState(!isPreset);

  const previewDate = new Date();
  const previewText = formatDateWithPattern(
    previewDate,
    currentFormat,
    localeCode,
  );

  return (
    <div className="space-y-2">
      <div>
        <label className={labelClass}>{label ?? t("format")}</label>
        <select
          value={isCustom ? CUSTOM_OPTION : currentFormat}
          onChange={(e) => {
            if (e.target.value === CUSTOM_OPTION) {
              setIsCustom(true);
              return;
            }

            setIsCustom(false);
            onChange(e.target.value);
          }}
          className={selectClass}
        >
          {presets.map((format) => (
            <option key={format} value={format}>
              {format}
            </option>
          ))}
          <option value={CUSTOM_OPTION}>{t("custom")}</option>
        </select>
      </div>

      {isCustom && (
        <div>
          <label className={labelClass}>{t("customFormat")}</label>
          <input
            type="text"
            value={currentFormat}
            onChange={(e) => onChange(e.target.value)}
            placeholder="[Ngày] DD/MM/YYYY"
            className={inputClass}
          />
          <p className={helpTextClass}>{t("customFormatHelp")}</p>
        </div>
      )}

      <p className={helpTextClass}>
        {t("preview")}: <span className="font-medium">{previewText}</span>
      </p>
    </div>
  );
}
