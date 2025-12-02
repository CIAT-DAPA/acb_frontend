"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateBulletinData } from "../../../../../types/bulletin";
import { Field } from "../../../../../types/template";
import {
  ListFieldEditor,
  TextInput,
  TextWithIconInput,
  NumberInput,
  DateInput,
  SelectInput,
  SearchableInput,
  ImageUploadInput,
  MoonCalendarInput,
} from "../components/fields";

interface BasicInfoStepProps {
  bulletinData: CreateBulletinData;
  onUpdate: (updater: (prev: CreateBulletinData) => CreateBulletinData) => void;
}

export function BasicInfoStep({ bulletinData, onUpdate }: BasicInfoStepProps) {
  const t = useTranslations("CreateBulletin");
  const tHeader = useTranslations("CreateBulletin.headerFooter");

  const handleNameChange = (value: string) => {
    onUpdate((prev) => ({
      ...prev,
      master: {
        ...prev.master,
        bulletin_name: value,
      },
    }));
  };

  const handleHeaderFieldChange = (fieldIndex: number, value: any) => {
    onUpdate((prev) => {
      const updatedData = {
        ...prev,
        version: {
          ...prev.version,
          data: {
            ...prev.version.data,
            header_config: {
              ...prev.version.data.header_config,
              fields: prev.version.data.header_config!.fields.map(
                (field, idx) =>
                  idx === fieldIndex ? { ...field, value } : field
              ),
            },
          },
        },
      };
      return updatedData;
    });
  };

  const handleFooterFieldChange = (fieldIndex: number, value: any) => {
    onUpdate((prev) => ({
      ...prev,
      version: {
        ...prev.version,
        data: {
          ...prev.version.data,
          footer_config: {
            ...prev.version.data.footer_config,
            fields: prev.version.data.footer_config!.fields.map((field, idx) =>
              idx === fieldIndex ? { ...field, value } : field
            ),
          },
        },
      },
    }));
  };

  const renderField = (field: Field, index: number, isHeader: boolean) => {
    const handleChange = isHeader
      ? handleHeaderFieldChange
      : handleFooterFieldChange;

    const fieldValue = field.value || "";

    switch (field.type) {
      case "list":
        const listValue = Array.isArray(fieldValue) ? fieldValue : [];
        return (
          <ListFieldEditor
            field={field}
            value={listValue}
            onChange={(value) => handleChange(index, value)}
          />
        );

      case "text":
        return (
          <TextInput
            field={field}
            value={fieldValue as string}
            onChange={(value) => handleChange(index, value)}
          />
        );

      case "number":
        return (
          <NumberInput
            field={field}
            value={fieldValue as number}
            onChange={(value) => handleChange(index, value)}
          />
        );

      case "date":
        return (
          <DateInput
            field={field}
            value={fieldValue as string}
            onChange={(value) => handleChange(index, value)}
          />
        );

      case "select":
        return (
          <SelectInput
            field={field}
            value={fieldValue as string}
            onChange={(value) => handleChange(index, value)}
          />
        );

      case "searchable":
        return (
          <SearchableInput
            field={field}
            value={fieldValue as string}
            onChange={(value) => handleChange(index, value)}
          />
        );

      case "text_with_icon":
        return (
          <TextWithIconInput
            field={field}
            value={fieldValue as string}
            onChange={(value) => handleChange(index, value)}
          />
        );

      case "image_upload":
        return (
          <ImageUploadInput
            field={field}
            value={fieldValue as string}
            onChange={(value) => handleChange(index, value)}
          />
        );

      case "moon_calendar":
        const moonCalendarValue =
          typeof fieldValue === "object" && fieldValue !== null
            ? fieldValue
            : {};
        return (
          <MoonCalendarInput
            field={field}
            value={moonCalendarValue as any}
            onChange={(value) => handleChange(index, value)}
          />
        );

      default:
        return (
          <input
            type="text"
            value={fieldValue as string}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={field.description || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          />
        );
    }
  };

  // Filtrar solo los campos editables (form === true)
  const headerFields = bulletinData.version.data.header_config?.fields || [];
  const footerFields = bulletinData.version.data.footer_config?.fields || [];

  const editableHeaderFields = headerFields.filter(
    (field) => field.form === true
  );
  const editableFooterFields = footerFields.filter(
    (field) => field.form === true
  );

  const isValid = bulletinData.master.bulletin_name.trim().length > 0;

  return (
    <div className="space-y-8">
      {/* Basic Info Section */}
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-[#283618] mb-2">
            {t("basicInfo.title")}
          </h2>
          <p className="text-sm text-[#283618]/70">
            {t("basicInfo.description")}
          </p>
        </div>

        {/* Bulletin Name */}
        <div>
          <label className="block text-sm font-medium text-[#283618] mb-2">
            {t("basicInfo.fields.name.label")}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={bulletinData.master.bulletin_name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder={t("basicInfo.fields.name.placeholder")}
            className="w-full px-4 py-2 border border-[#283618]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283618]"
          />
          <p className="mt-1 text-xs text-[#283618]/60">
            {t("basicInfo.fields.name.helper")}
          </p>
        </div>
      </div>

      {/* Header Fields Section */}
      {editableHeaderFields.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-[#283618]/20">
          <div>
            <h3 className="text-lg font-semibold text-[#283618] mb-2">
              {tHeader("headerTitle")}
            </h3>
            <p className="text-sm text-[#283618]/70">
              {tHeader("headerDescription")}
            </p>
          </div>

          {editableHeaderFields.map((field, index) => {
            const originalIndex = headerFields.findIndex((f) => f === field);
            return (
              <div key={originalIndex}>
                <label className="block text-sm font-medium text-[#283618] mb-2">
                  {field.label}
                  {field.validation?.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderField(field, originalIndex, true)}
                {field.description && (
                  <p className="mt-1 text-xs text-[#283618]/60">
                    {field.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Fields Section */}
      {editableFooterFields.length > 0 && (
        <div className="space-y-4 pt-6 border-t border-[#283618]/20">
          <div>
            <h3 className="text-lg font-semibold text-[#283618] mb-2">
              {tHeader("footerTitle")}
            </h3>
            <p className="text-sm text-[#283618]/70">
              {tHeader("footerDescription")}
            </p>
          </div>

          {editableFooterFields.map((field, index) => {
            const originalIndex = footerFields.findIndex((f) => f === field);
            return (
              <div key={originalIndex}>
                <label className="block text-sm font-medium text-[#283618] mb-2">
                  {field.label}
                  {field.validation?.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderField(field, originalIndex, false)}
                {field.description && (
                  <p className="mt-1 text-xs text-[#283618]/60">
                    {field.description}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
