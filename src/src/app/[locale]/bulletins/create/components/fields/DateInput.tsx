"use client";

import React, { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Field } from "../../../../../../types/template";
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

  const dateLabel = field?.label || "Date";
  const datePlaceholder = getLocaleDatePattern(localeCode);
  const monthNames = getLocalizedMonthNames(localeCode, "long");
  const weekDayLabels = getLocalizedWeekdayLabels(localeCode, "short");

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
    if (value) {
      const [year, month] = value.split("-").map(Number);
      if (Number.isFinite(year) && Number.isFinite(month)) {
        setCurrentMonth(new Date(year, month - 1, 1));
      }
    }
  }, [value]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString(localeCode, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
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
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
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
