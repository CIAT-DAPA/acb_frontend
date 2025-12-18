import React, { useState, useRef, useEffect } from "react";
import { Field, DateRangeFieldConfig } from "../../../../../../types/template";
import { useTranslations } from "next-intl";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface DateRangeInputProps {
  field?: Field;
  value: {
    start_date: string;
    end_date: string;
    start_moon_phase?: string;
    end_moon_phase?: string;
  };
  onChange: (value: {
    start_date: string;
    end_date: string;
    start_moon_phase?: string;
    end_moon_phase?: string;
  }) => void;
  disabled?: boolean;
}

export function DateRangeInput({
  field,
  value,
  onChange,
  disabled = false,
}: DateRangeInputProps) {
  const t = useTranslations("CreateTemplate.fieldEditor.dateRangeConfig");
  const containerRef = useRef<HTMLDivElement>(null);

  const [isOpen, setIsOpen] = useState(false);
  const [selecting, setSelecting] = useState<"start" | "end">("start");
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fieldConfig = (
    field?.type === "date_range" ? field.field_config : {}
  ) as DateRangeFieldConfig;
  const showMoonPhases = fieldConfig.show_moon_phases || false;

  const startDateLabel = fieldConfig.start_date_label || "Start date";
  const endDateLabel = fieldConfig.end_date_label || "End date";
  const startDateDescription = fieldConfig.start_date_description;
  const endDateDescription = fieldConfig.end_date_description;

  // Close calendar when clicking outside
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

  // Initialize current month based on value
  useEffect(() => {
    if (value?.start_date) {
      const [year, month] = value.start_date.split("-").map(Number);
      setCurrentMonth(new Date(year, month - 1, 1));
    }
  }, []); // Run once on mount

  const handleStartMoonPhaseChange = (phase: string) => {
    onChange({
      ...value,
      start_moon_phase: phase,
    });
  };

  const handleEndMoonPhaseChange = (phase: string) => {
    onChange({
      ...value,
      end_moon_phase: phase,
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    const [year, month, day] = dateString.split("-").map(Number);
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Calendar Logic
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    // 0 = Sunday, 1 = Monday, ...
    let day = new Date(year, month, 1).getDay();
    // Adjust to make Monday = 0, Sunday = 6 (if we want Monday start)
    // Or keep Sunday = 0. Let's use Sunday = 0 for standard calendar view
    return day;
  };

  const handlePrevMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
    );
  };

  const handleDayClick = (day: number) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    // Format as YYYY-MM-DD
    const dateString = `${selectedDate.getFullYear()}-${String(
      selectedDate.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

    if (selecting === "start") {
      onChange({
        ...value,
        start_date: dateString,
        // If new start date is after end date, clear end date
        end_date:
          value.end_date && dateString > value.end_date ? "" : value.end_date,
      });
      setSelecting("end");
    } else {
      // Selecting end date
      if (dateString < value.start_date) {
        // If clicked date is before start date, treat it as new start date
        onChange({
          ...value,
          start_date: dateString,
          end_date: "",
        });
        setSelecting("end");
      } else {
        onChange({
          ...value,
          end_date: dateString,
        });
        setIsOpen(false); // Close after selecting range
        setSelecting("start"); // Reset for next time
      }
    }
  };

  const isSelected = (day: number) => {
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const dateString = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateString === value.start_date || dateString === value.end_date;
  };

  const isInRange = (day: number) => {
    if (!value.start_date || !value.end_date) return false;
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    const dateString = `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return dateString > value.start_date && dateString < value.end_date;
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // Empty cells for days before start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-10 w-10" />);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const selected = isSelected(day);
      const inRange = isInRange(day);
      const isStart =
        value.start_date ===
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
          2,
          "0"
        )}`;
      const isEnd =
        value.end_date ===
        `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
          2,
          "0"
        )}`;

      days.push(
        <button
          key={day}
          onClick={() => handleDayClick(day)}
          className={`
            h-10 w-10 flex items-center justify-center text-sm font-medium transition-all relative
            ${
              selected
                ? "bg-[#283618] text-white hover:bg-[#283618]/90 z-10"
                : "text-gray-700 hover:bg-gray-100"
            }
            ${inRange ? "bg-[#bc6c25]/20 text-[#283618]" : ""}
            ${isStart ? "rounded-l-full" : ""}
            ${isEnd ? "rounded-r-full" : ""}
            ${!inRange && !selected ? "rounded-full" : ""}
          `}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const monthNames = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Date Range Container */}
      <div className="flex border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm relative">
        {/* Start Date Section */}
        <div
          className={`relative flex-1 p-2 border-r border-gray-200 cursor-pointer transition-colors group ${
            selecting === "start" && isOpen
              ? "bg-[#bc6c25]/10"
              : "hover:bg-gray-50"
          }`}
          onClick={() => {
            setIsOpen(true);
            setSelecting("start");
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {startDateLabel}
            </span>
          </div>
          <div
            className={`text-lg font-normal ${
              value?.start_date ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {value?.start_date ? formatDate(value.start_date) : "DD/MM/YYYY"}
          </div>
        </div>

        {/* End Date Section */}
        <div
          className={`relative flex-1 p-2 cursor-pointer transition-colors group ${
            selecting === "end" && isOpen
              ? "bg-[#bc6c25]/10"
              : "hover:bg-gray-50"
          }`}
          onClick={() => {
            setIsOpen(true);
            setSelecting("end");
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <CalendarIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {endDateLabel}
            </span>
          </div>
          <div
            className={`text-lg font-normal ${
              value?.end_date ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {value?.end_date ? formatDate(value.end_date) : "DD/MM/YYYY"}
          </div>
        </div>
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-white rounded-lg shadow-xl border border-gray-200 w-[320px]">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-gray-100 rounded-full text-gray-600"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Week Days */}
          <div className="grid grid-cols-7 mb-2">
            {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"].map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs font-medium text-gray-400"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1">{renderCalendar()}</div>
        </div>
      )}

      {/* Descriptions */}
      {(startDateDescription || endDateDescription) && (
        <div className="flex gap-4 text-xs text-[#606c38]">
          <div className="flex-1">{startDateDescription}</div>
          <div className="flex-1">{endDateDescription}</div>
        </div>
      )}

      {/* Moon Phases */}
      {showMoonPhases && (
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-[#283618] mb-1">
              {t("startMoonPhase")}
            </label>
            <select
              value={value?.start_moon_phase || "llena"}
              onChange={(e) => handleStartMoonPhaseChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="llena">🌕 {t("moonPhases.full")}</option>
              <option value="nueva">🌑 {t("moonPhases.new")}</option>
              <option value="cuartoCreciente">
                🌓 {t("moonPhases.waxingCrescent")}
              </option>
              <option value="cuartoMenguante">
                🌗 {t("moonPhases.waningCrescent")}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#283618] mb-1">
              {t("endMoonPhase")}
            </label>
            <select
              value={value?.end_moon_phase || "llena"}
              onChange={(e) => handleEndMoonPhaseChange(e.target.value)}
              disabled={disabled}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
            >
              <option value="llena">🌕 {t("moonPhases.full")}</option>
              <option value="nueva">🌑 {t("moonPhases.new")}</option>
              <option value="cuartoCreciente">
                🌓 {t("moonPhases.waxingCrescent")}
              </option>
              <option value="cuartoMenguante">
                🌗 {t("moonPhases.waningCrescent")}
              </option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
