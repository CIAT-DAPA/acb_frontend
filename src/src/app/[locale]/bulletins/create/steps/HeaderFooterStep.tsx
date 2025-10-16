"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateBulletinData } from "../../../../../types/bulletin";
import { Field } from "../../../../../types/template";
import { ListFieldEditor } from "../components/fields";

interface HeaderFooterStepProps {
  bulletinData: CreateBulletinData;
  onUpdate: (updater: (prev: CreateBulletinData) => CreateBulletinData) => void;
}

export function HeaderFooterStep({
  bulletinData,
  onUpdate,
}: HeaderFooterStepProps) {
  const t = useTranslations("CreateBulletin.headerFooter");

  const handleHeaderFieldChange = (fieldIndex: number, value: any) => {
    onUpdate((prev) => ({
      ...prev,
      version: {
        ...prev.version,
        data: {
          ...prev.version.data,
          header_config: {
            ...prev.version.data.header_config,
            fields: prev.version.data.header_config!.fields.map((field, idx) =>
              idx === fieldIndex ? { ...field, value } : field
            ),
          },
        },
      },
    }));
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
        // Para campos de tipo lista, usar el editor especializado
        const listValue = Array.isArray(fieldValue) ? fieldValue : [];
        return (
          <ListFieldEditor
            field={field}
            value={listValue}
            onChange={(value) => handleChange(index, value)}
          />
        );

      case "text":
        const isLongText =
          "field_config" in field &&
          field.field_config &&
          "subtype" in field.field_config &&
          field.field_config.subtype === "long";

        return isLongText ? (
          <textarea
            value={fieldValue as string}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={field.description || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618] min-h-[100px]"
          />
        ) : (
          <input
            type="text"
            value={fieldValue as string}
            onChange={(e) => handleChange(index, e.target.value)}
            placeholder={field.description || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          />
        );

      case "number":
        return (
          <input
            type="number"
            value={fieldValue as number}
            onChange={(e) => handleChange(index, parseFloat(e.target.value))}
            placeholder={field.description || field.label}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          />
        );

      case "date":
        return (
          <input
            type="date"
            value={fieldValue as string}
            onChange={(e) => handleChange(index, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          />
        );

      case "select":
        const options =
          "field_config" in field &&
          field.field_config &&
          "options" in field.field_config
            ? field.field_config.options
            : [];

        return (
          <select
            value={fieldValue as string}
            onChange={(e) => handleChange(index, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#283618]"
          >
            <option value="">{t("selectOption")}</option>
            {options.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
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

  const headerFields = bulletinData.version.data.header_config?.fields || [];
  const footerFields = bulletinData.version.data.footer_config?.fields || [];

  // Filtrar solo los campos que tienen form: true (campos editables en el formulario)
  const editableHeaderFields = headerFields.filter(
    (field) => field.form === true
  );
  const editableFooterFields = footerFields.filter(
    (field) => field.form === true
  );

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-[#283618] mb-2">
          {t("title")}
        </h3>
        <p className="text-sm text-[#606c38] mb-4">{t("description")}</p>
      </div>

      {/* Header Configuration */}
      {editableHeaderFields.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold text-[#283618] mb-4">
            {t("headerSection")}
          </h4>
          <div className="space-y-4">
            {editableHeaderFields.map((field) => {
              // Encontrar el índice original del campo en el array completo
              const originalIndex = headerFields.findIndex(
                (f) => f.field_id === field.field_id
              );
              return (
                <div key={field.field_id}>
                  <label className="block text-sm font-medium text-[#283618] mb-1">
                    {field.display_name}
                  </label>
                  {renderField(field, originalIndex, true)}
                  {field.description && (
                    <p className="text-xs text-[#606c38] mt-1">
                      {field.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Configuration */}
      {editableFooterFields.length > 0 && (
        <div className="border-t pt-4">
          <h4 className="text-md font-semibold text-[#283618] mb-4">
            {t("footerSection")}
          </h4>
          <div className="space-y-4">
            {editableFooterFields.map((field) => {
              // Encontrar el índice original del campo en el array completo
              const originalIndex = footerFields.findIndex(
                (f) => f.field_id === field.field_id
              );
              return (
                <div key={field.field_id}>
                  <label className="block text-sm font-medium text-[#283618] mb-1">
                    {field.display_name}
                  </label>
                  {renderField(field, originalIndex, false)}
                  {field.description && (
                    <p className="text-xs text-[#606c38] mt-1">
                      {field.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editableHeaderFields.length === 0 &&
        editableFooterFields.length === 0 && (
          <div className="text-center py-8 text-[#606c38]">{t("noFields")}</div>
        )}
    </div>
  );
}
