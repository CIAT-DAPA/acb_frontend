"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { slugify, isValidSlug } from "../../../../../utils/slugify";
import {
  CreateBulletinData,
  BulletinComment,
} from "../../../../../types/bulletin";
import { Field } from "../../../../../types/template";
import { BulletinAPIService } from "../../../../../services/bulletinService";
import {
  ListFieldEditor,
  TextInput,
  TextWithIconInput,
  NumberInput,
  DateInput,
  DateRangeInput,
  SelectInput,
  SearchableInput,
  ImageUploadInput,
  MoonCalendarInput,
} from "../components/fields";
import { ReviewCommentThread } from "../components/ReviewCommentThread";
import {
  BULLETIN_NAME_VALIDATION_ID,
  BULLETIN_SLUG_VALIDATION_ID,
  getListItemConstraintViolation,
} from "@/utils/bulletinRequiredFields";

interface BasicInfoStepProps {
  bulletinData: CreateBulletinData;
  onUpdate: (updater: (prev: CreateBulletinData) => CreateBulletinData) => void;
  existingSlugNames: string[];
  fieldComments?: Record<string, BulletinComment[]>;
  invalidFieldIds?: string[];
  onReplyToComment?: (commentId: string, text: string) => Promise<void>;
}

export function BasicInfoStep({
  bulletinData,
  onUpdate,
  existingSlugNames,
  fieldComments = {},
  invalidFieldIds = [],
  onReplyToComment,
}: BasicInfoStepProps) {
  const t = useTranslations("CreateBulletin");
  const tComments = useTranslations("CreateBulletin.comments");
  const tValidation = useTranslations("CreateBulletin.validation");
  const tHeader = useTranslations("CreateBulletin.headerFooter");
  const [touchedFieldIds, setTouchedFieldIds] = useState<Set<string>>(
    () => new Set(),
  );
  const invalidFieldIdSet = React.useMemo(
    () => new Set(invalidFieldIds),
    [invalidFieldIds],
  );

  const markFieldTouched = React.useCallback((fieldId?: string) => {
    if (!fieldId) return;

    setTouchedFieldIds((current) => {
      if (current.has(fieldId)) return current;

      const next = new Set(current);
      next.add(fieldId);
      return next;
    });
  }, []);

  const handleFieldBlur = React.useCallback(
    (fieldId?: string) => (event: React.FocusEvent<HTMLDivElement>) => {
      const nextFocusedElement = event.relatedTarget;

      if (
        nextFocusedElement instanceof Node &&
        event.currentTarget.contains(nextFocusedElement)
      ) {
        return;
      }

      markFieldTouched(fieldId);
    },
    [markFieldTouched],
  );

  const isFieldInvalid = (fieldId?: string) =>
    Boolean(
      fieldId && touchedFieldIds.has(fieldId) && invalidFieldIdSet.has(fieldId),
    );

  const getFieldValidationMessage = (field: Field | string) => {
    const fieldId = typeof field === "string" ? field : field.field_id;

    if (!isFieldInvalid(fieldId)) {
      return null;
    }

    if (typeof field !== "string") {
      const listViolation = getListItemConstraintViolation(field);

      if (listViolation?.type === "min") {
        return tValidation("listMinItems", {
          min: listViolation.limit,
          current: listViolation.actual,
        });
      }

      if (listViolation?.type === "max") {
        return tValidation("listMaxItems", {
          max: listViolation.limit,
          current: listViolation.actual,
        });
      }
    }

    return tValidation("requiredField");
  };

  const renderFieldValidationError = (field: Field | string) => {
    const message = getFieldValidationMessage(field);

    return message ? (
      <p className="mt-1 text-sm font-medium text-red-600">{message}</p>
    ) : null;
  };

  // Helper para normalizar valores de date_range
  const normalizeDateRangeValue = (
    value: any,
  ): {
    start_date: string;
    end_date: string;
    start_moon_phase?: string;
    end_moon_phase?: string;
  } => {
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      return {
        start_date: value.start_date || "",
        end_date: value.end_date || "",
        start_moon_phase: value.start_moon_phase,
        end_moon_phase: value.end_moon_phase,
      };
    }
    return {
      start_date: "",
      end_date: "",
    };
  };

  // Estado para controlar si el name_machine está siendo editado manualmente
  const [isManualNameMachine, setIsManualNameMachine] = useState(false);
  const [nameMachineError, setNameMachineError] = useState<string>("");

  // Validar name_machine cuando cambia (ya sea por edición manual o automática)
  useEffect(() => {
    const value = bulletinData.master.name_machine;
    if (value && !isValidSlug(value)) {
      setNameMachineError(t("basicInfo.fields.nameMachine.errors.invalid"));
    } else if (value && existingSlugNames.includes(value)) {
      setNameMachineError(t("basicInfo.fields.nameMachine.errors.duplicate"));
    } else {
      setNameMachineError("");
    }
  }, [bulletinData.master.name_machine, existingSlugNames, t]);

  const handleNameChange = (value: string) => {
    onUpdate((prev) => ({
      ...prev,
      master: {
        ...prev.master,
        bulletin_name: value,
      },
    }));

    // Auto-generar name_machine solo si no se ha editado manualmente
    if (!isManualNameMachine) {
      const newNameMachine = slugify(value);
      onUpdate((prev) => ({
        ...prev,
        master: {
          ...prev.master,
          bulletin_name: value,
          name_machine: newNameMachine,
        },
      }));
    }
  };

  const handleNameMachineChange = (value: string) => {
    setIsManualNameMachine(true);
    onUpdate((prev) => ({
      ...prev,
      master: {
        ...prev.master,
        name_machine: value,
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
                  idx === fieldIndex ? { ...field, value } : field,
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
              idx === fieldIndex ? { ...field, value } : field,
            ),
          },
        },
      },
    }));
  };

  const renderComments = (fieldId: string) => {
    const comments = fieldComments[fieldId];
    if (!comments || comments.length === 0) return null;

    return (
      <div className="mt-2 rounded-r-md border-l-4 border-yellow-400 bg-yellow-50 p-3 text-sm shadow-sm">
        <div className="mb-2 text-xs font-bold uppercase tracking-wide text-yellow-800">
          {tComments("title")}
        </div>

        <ReviewCommentThread comments={comments} onReply={onReplyToComment} />
      </div>
    );
  };

  const renderField = (field: Field, index: number, isHeader: boolean) => {
    const handleChange = isHeader
      ? handleHeaderFieldChange
      : handleFooterFieldChange;

    const fieldValue = field.value ?? "";

    switch (field.type) {
      case "list":
        const listValue = Array.isArray(fieldValue) ? fieldValue : [];
        return (
          <ListFieldEditor
            field={field}
            value={listValue}
            onChange={(value) => {
              markFieldTouched(field.field_id);
              handleChange(index, value);
            }}
          />
        );

      case "text":
        return (
          <TextInput
            field={field}
            value={fieldValue as string}
            onChange={(value) => handleChange(index, value)}
            maxLength={field.validation?.max_length}
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

      case "date_range":
        return (
          <DateRangeInput
            field={field}
            value={normalizeDateRangeValue(fieldValue)}
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
            maxLength={field.validation?.max_length}
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
            maxLength={field.validation?.max_length}
          />
        );
    }
  };

  // Filtrar solo los campos editables (form === true)
  const headerFields = bulletinData.version.data.header_config?.fields || [];
  const footerFields = bulletinData.version.data.footer_config?.fields || [];

  const editableHeaderFields = headerFields.filter(
    (field) => field.form === true,
  );
  const editableFooterFields = footerFields.filter(
    (field) => field.form === true,
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
        <div id={BULLETIN_NAME_VALIDATION_ID}>
          <label className="block text-sm font-medium text-[#283618] mb-2">
            {t("basicInfo.fields.name.label")}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={bulletinData.master.bulletin_name}
            onChange={(e) => handleNameChange(e.target.value)}
            onBlur={() => markFieldTouched(BULLETIN_NAME_VALIDATION_ID)}
            placeholder={t("basicInfo.fields.name.placeholder")}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#283618] ${
              isFieldInvalid(BULLETIN_NAME_VALIDATION_ID)
                ? "border-red-500 bg-red-50/40"
                : "border-[#283618]/20"
            }`}
            aria-invalid={isFieldInvalid(BULLETIN_NAME_VALIDATION_ID)}
          />
          {renderFieldValidationError(BULLETIN_NAME_VALIDATION_ID)}
          <p className="mt-1 text-xs text-[#283618]/60">
            {t("basicInfo.fields.name.helper")}
          </p>
        </div>

        {/* Machine Name */}
        <div id={BULLETIN_SLUG_VALIDATION_ID}>
          <label className="block text-sm font-medium text-[#283618] mb-2">
            {t("basicInfo.fields.nameMachine.label")}
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="text"
            value={bulletinData.master.name_machine || ""}
            onChange={(e) => handleNameMachineChange(e.target.value)}
            onBlur={() => markFieldTouched(BULLETIN_SLUG_VALIDATION_ID)}
            placeholder={t("basicInfo.fields.nameMachine.placeholder")}
            className={`w-full px-4 py-2 border rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#283618] ${
              (touchedFieldIds.has(BULLETIN_SLUG_VALIDATION_ID) &&
                nameMachineError) ||
              isFieldInvalid(BULLETIN_SLUG_VALIDATION_ID)
                ? "border-red-500 bg-red-50/40"
                : "border-[#283618]/20"
            }`}
            aria-invalid={Boolean(
              (touchedFieldIds.has(BULLETIN_SLUG_VALIDATION_ID) &&
                nameMachineError) ||
              isFieldInvalid(BULLETIN_SLUG_VALIDATION_ID),
            )}
          />
          <p className="mt-1 text-xs text-[#283618]/60">
            {t("basicInfo.fields.nameMachine.help")}
          </p>
          {touchedFieldIds.has(BULLETIN_SLUG_VALIDATION_ID) &&
          nameMachineError ? (
            <p className="mt-1 text-sm text-red-600">{nameMachineError}</p>
          ) : (
            renderFieldValidationError(BULLETIN_SLUG_VALIDATION_ID)
          )}
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
              <div
                key={originalIndex}
                id={`field-${field.field_id}`}
                onBlurCapture={handleFieldBlur(field.field_id)}
                className={
                  isFieldInvalid(field.field_id)
                    ? "rounded-lg border border-red-300 bg-red-50/40 p-3"
                    : undefined
                }
              >
                <label className="block text-sm font-medium text-[#283618] mb-2">
                  {field.label}
                  {field.validation?.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderField(field, originalIndex, true)}
                {renderFieldValidationError(field)}
                {renderComments(field.field_id)}
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
              <div
                key={originalIndex}
                id={`field-${field.field_id}`}
                onBlurCapture={handleFieldBlur(field.field_id)}
                className={
                  isFieldInvalid(field.field_id)
                    ? "rounded-lg border border-red-300 bg-red-50/40 p-3"
                    : undefined
                }
              >
                <label className="block text-sm font-medium text-[#283618] mb-2">
                  {field.label}
                  {field.validation?.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                {renderField(field, originalIndex, false)}
                {renderFieldValidationError(field)}
                {renderComments(field.field_id)}
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
