"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { DateFieldConfig, Field } from "../../../../../../types/template";
import {
  getLocaleDatePattern,
  getLocalizedMonthNames,
  getLocalizedWeekdayLabels,
  resolveAppLocale,
  toDateLocaleCode,
} from "@/utils/locale";

interface DateInputProps {
  field?: Field;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const parseLocalDate = (dateString: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateString);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsedDate = new Date(year, month - 1, day);

  if (
    parsedDate.getFullYear() !== year ||
    parsedDate.getMonth() !== month - 1 ||
    parsedDate.getDate() !== day
  ) {
    return null;
  }

  return parsedDate;
};

export function DateInput({
  field,
  value,
  onChange,
  disabled = false,
}: DateInputProps) {
  const hookLocale = useLocale();
  const pathname = usePathname();
  const localeCode = toDateLocaleCode(resolveAppLocale(pathname, hookLocale));
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const config = (field?.field_config as DateFieldConfig | undefined) || {};
  const configuredDateFormat = config.date_format?.trim();
  const dateLabel = field?.label || "Date";
  const datePlaceholder =
    configuredDateFormat || getLocaleDatePattern(localeCode);
  const monthNames = getLocalizedMonthNames(localeCode, "long");
  const weekDayLabels = getLocalizedWeekdayLabels(localeCode, "short");

  const capitalizeLocalizedValue = (text: string): string => {
    if (!text) {
      return text;
    }

    return text.charAt(0).toLocaleUpperCase(localeCode) + text.slice(1);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const parsedValue = parseLocalDate(value);

    if (parsedValue) {
      setCurrentMonth(
        new Date(parsedValue.getFullYear(), parsedValue.getMonth(), 1),
      );
    }
  }, [value]);

  const formatDate = (dateString: string): string => {
    if (!dateString) {
      return "";
    }

    const date = parseLocalDate(dateString);

    if (!date) {
      return dateString;
    }

    // Preserve the previous locale-based numeric display for legacy fields
    // that do not have a date_format stored yet.
    if (!configuredDateFormat) {
      return date.toLocaleDateString(localeCode, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    const shortYear = String(year).slice(-2);

    const dayName = capitalizeLocalizedValue(
      date.toLocaleDateString(localeCode, { weekday: "long" }),
    );
    const monthName = capitalizeLocalizedValue(
      date.toLocaleDateString(localeCode, { month: "long" }),
    );

    switch (configuredDateFormat) {
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;

      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;

      case "DD-MM-YYYY":
        return `${day}-${month}-${year}`;

      case "dddd, DD - MM":
        return `${dayName}, ${day} - ${month}`;

      case "DD, MMMM YYYY":
        return `${day}, ${monthName} ${year}`;

      case "DD de MMMM":
        return new Intl.DateTimeFormat(localeCode, {
          day: "2-digit",
          month: "long",
        }).format(date);

      case "MMMM":
        return monthName;

      case "MMMM/YY":
        return `${monthName}/${shortYear}`;

      case "YYYY-MM-DD":
      default:
        return `${year}-${month}-${day}`;
    }
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1),
    );
  };

  const handleDayClick = (day: number) => {
    if (disabled) {
      return;
    }

    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );

    const dateString = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1,
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    // Always persist an unambiguous ISO local date. date_format only controls
    // how that value is presented to the user.
    onChange(dateString);
    setIsOpen(false);
  };

  const isSelected = (day: number) => {
    const dateString = `${currentMonth.getFullYear()}-${String(
      currentMonth.getMonth() + 1,
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    return dateString === value;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelected(day);

      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDayClick(day)}
          disabled={disabled}
          className={`
            h-10 w-10 flex items-center justify-center text-sm font-medium transition-all rounded-full
            ${
              selected
                ? "bg-[#283618] text-white hover:bg-[#283618]/90"
                : "text-gray-700 hover:bg-gray-100"
            }
            ${disabled ? "cursor-not-allowed opacity-60" : ""}
          `}
        >
          {day}
        </button>,
      );
    }

    return days;
  };

  const openPicker = () => {
    if (!disabled) {
      setIsOpen(true);
    }
  };

  const currentMonthLabel = capitalizeLocalizedValue(
    monthNames[currentMonth.getMonth()] || "",
  );

  return (
    <div className="space-y-4 relative" ref={containerRef}>
      <div
        className={`relative p-2 border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm transition-colors ${
          disabled
            ? "bg-gray-100 cursor-not-allowed"
            : "hover:bg-gray-50 cursor-pointer"
        } ${isOpen && !disabled ? "bg-[#bc6c25]/10" : ""}`}
        onClick={openPicker}
      >
        <div className="flex items-center gap-2 mb-1">
          <CalendarIcon className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {dateLabel}
          </span>
        </div>
        <div
          className={`text-base font-normal ${
            value ? "text-gray-900" : "text-gray-400"
          }`}
        >
          {value ? formatDate(value) : datePlaceholder}
        </div>
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-50 mt-2 p-4 bg-white rounded-lg shadow-xl border border-gray-200 w-[320px]">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-900">
              {currentMonthLabel} {currentMonth.getFullYear()}
            </span>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {weekDayLabels.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-y-1">{renderCalendar()}</div>
        </div>
      )}
    </div>
  );
}
