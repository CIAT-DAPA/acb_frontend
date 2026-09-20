"use client";

import React from "react";
import { Field } from "../../../../../../types/template";
import { TextInput } from "./TextInput";
import { TextWithIconInput } from "./TextWithIconInput";
import { NumberInput } from "./NumberInput";
import { DateInput } from "./DateInput";
import { DateRangeInput } from "./DateRangeInput";
import { SelectInput } from "./SelectInput";
import { SearchableInput } from "./SearchableInput";
import { SelectBackgroundField } from "./SelectBackgroundField";
import { ImageInput } from "./ImageInput";
import { ImageUploadInput } from "./ImageUploadInput";
import { MoonCalendarInput } from "./MoonCalendarInput";
import { ClimateDataField } from "./ClimateDataField";

export type DateRangeValue = {
  start_date: string;
  end_date: string;
  start_moon_phase?: string;
  end_moon_phase?: string;
};

export const normalizeDateRangeValue = (value: unknown): DateRangeValue => {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    const range = value as Partial<DateRangeValue>;

    return {
      start_date: range.start_date || "",
      end_date: range.end_date || "",
      start_moon_phase: range.start_moon_phase,
      end_moon_phase: range.end_moon_phase,
    };
  }

  return { start_date: "", end_date: "" };
};

const SELF_CONTAINED_TYPES = new Set<Field["type"]>([
  "text",
  "text_with_icon",
  "number",
  "date",
  "date_range",
  "select",
  "searchable",
  "select_background",
  "image",
  "image_upload",
  "moon_calendar",
  "climate_data_puntual",
]);

export function supportsFieldValueInput(type: Field["type"]): boolean {
  return SELF_CONTAINED_TYPES.has(type);
}

interface FieldValueInputProps {
  field: Field;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
}

export function FieldValueInput({
  field,
  value,
  onChange,
  disabled = false,
}: FieldValueInputProps) {
  const fieldValue = value ?? "";

  switch (field.type) {
    case "text":
      return (
        <TextInput
          field={field}
          value={fieldValue as string}
          onChange={onChange}
          maxLength={field.validation?.max_length}
          disabled={disabled}
        />
      );

    case "text_with_icon":
      return (
        <TextWithIconInput
          field={field}
          value={fieldValue as string}
          onChange={onChange}
          maxLength={field.validation?.max_length}
          disabled={disabled}
        />
      );

    case "number":
      return (
        <NumberInput
          field={field}
          value={fieldValue as number}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "date":
      return (
        <DateInput
          field={field}
          value={fieldValue as string}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "date_range":
      return (
        <DateRangeInput
          field={field}
          value={normalizeDateRangeValue(fieldValue)}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "select":
      return (
        <SelectInput
          field={field}
          value={fieldValue as string}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "searchable":
      return (
        <SearchableInput
          field={field}
          value={fieldValue as string}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "select_background":
      return (
        <SelectBackgroundField
          field={field}
          value={fieldValue as string}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "image":
      return (
        <ImageInput
          field={field}
          value={fieldValue as string}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "image_upload":
      return (
        <ImageUploadInput
          field={field}
          value={fieldValue as string}
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "moon_calendar":
      return (
        <MoonCalendarInput
          field={field}
          value={
            typeof fieldValue === "object" && fieldValue !== null
              ? (fieldValue as Record<string, never>)
              : {}
          }
          onChange={onChange}
          disabled={disabled}
        />
      );

    case "climate_data_puntual":
      return (
        <ClimateDataField
          value={
            typeof fieldValue === "object" && fieldValue !== null
              ? fieldValue
              : {}
          }
          onChange={onChange}
          fieldConfig={field.field_config}
          disabled={disabled}
        />
      );

    default:
      return (
        <input
          type="text"
          value={fieldValue as string}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.description || field.label}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] disabled:bg-gray-100"
          maxLength={field.validation?.max_length}
          disabled={disabled}
        />
      );
  }
}
