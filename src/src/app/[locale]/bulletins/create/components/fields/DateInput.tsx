"use client";

import React from "react";
import { Field } from "../../../../../../types/template";

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
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  return (
    <input
      type="date"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={inputClass}
      disabled={disabled}
    />
  );
}
