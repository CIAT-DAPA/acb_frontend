"use client";

import React from "react";

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  isLong?: boolean;
  maxLength?: number;
  disabled?: boolean;
}

export function TextField({
  value = "",
  onChange,
  placeholder,
  isLong = false,
  maxLength,
  disabled = false,
}: TextFieldProps) {
  const inputClass =
    "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] text-sm disabled:bg-gray-100 disabled:cursor-not-allowed";

  if (isLong) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${inputClass} min-h-[100px]`}
        maxLength={maxLength}
        disabled={disabled}
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputClass}
      maxLength={maxLength}
      disabled={disabled}
    />
  );
}
