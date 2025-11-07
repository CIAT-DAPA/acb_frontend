import React from "react";
import { Field } from "../../../../../../types/template";

interface DateRangeInputProps {
  field?: Field;
  value: { start_date: string; end_date: string };
  onChange: (value: { start_date: string; end_date: string }) => void;
  disabled?: boolean;
}

export function DateRangeInput({
  field,
  value,
  onChange,
  disabled = false,
}: DateRangeInputProps) {
  const startDateLabel =
    (field?.type === "date_range" && field.field_config.start_date_label) ||
    "Fecha de inicio";
  const endDateLabel =
    (field?.type === "date_range" && field.field_config.end_date_label) ||
    "Fecha de fin";
  const startDateDescription =
    field?.type === "date_range" && field.field_config.start_date_description;
  const endDateDescription =
    field?.type === "date_range" && field.field_config.end_date_description;

  const handleStartDateChange = (newStartDate: string) => {
    onChange({
      start_date: newStartDate,
      end_date: value?.end_date || "",
    });
  };

  const handleEndDateChange = (newEndDate: string) => {
    onChange({
      start_date: value?.start_date || "",
      end_date: newEndDate,
    });
  };

  return (
    <div className="space-y-4">
      {/* Start Date */}
      <div>
        <label className="block text-sm font-medium text-[#283618] mb-1">
          {startDateLabel}
        </label>
        <input
          type="date"
          value={value?.start_date || ""}
          onChange={(e) => handleStartDateChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {startDateDescription && (
          <p className="text-xs text-[#606c38] mt-1">{startDateDescription}</p>
        )}
      </div>

      {/* End Date */}
      <div>
        <label className="block text-sm font-medium text-[#283618] mb-1">
          {endDateLabel}
        </label>
        <input
          type="date"
          value={value?.end_date || ""}
          onChange={(e) => handleEndDateChange(e.target.value)}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100 disabled:cursor-not-allowed"
        />
        {endDateDescription && (
          <p className="text-xs text-[#606c38] mt-1">{endDateDescription}</p>
        )}
      </div>
    </div>
  );
}
