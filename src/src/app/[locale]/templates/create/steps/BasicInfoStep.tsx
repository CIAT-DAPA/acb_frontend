"use client";

import React, { useCallback } from "react";
import { useTranslations } from "next-intl";
import { CreateTemplateData } from "../../../../../types/template";
import { ACCESS_TYPES } from "../../../../../types/core";

interface BasicInfoStepProps {
  data: CreateTemplateData;
  errors: Record<string, string[]>;
  onDataChange: (
    updater: (prevData: CreateTemplateData) => CreateTemplateData
  ) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
}

export function BasicInfoStep({
  data,
  errors,
  onDataChange,
  onErrorsChange,
}: BasicInfoStepProps) {
  const t = useTranslations("CreateTemplate.basicInfo");

  const updateMaster = useCallback(
    (updates: Partial<typeof data.master>) => {
      onDataChange((prevData) => ({
        ...prevData,
        master: {
          ...prevData.master,
          ...updates,
        },
      }));
    },
    [onDataChange]
  );

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      updateMaster({ template_name: e.target.value });

      // Limpiar errores del campo
      if (errors.template_name) {
        onErrorsChange({
          ...errors,
          template_name: [],
        });
      }
    },
    [updateMaster, errors, onErrorsChange]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      updateMaster({ description: e.target.value });

      // Limpiar errores del campo
      if (errors.description) {
        onErrorsChange({
          ...errors,
          description: [],
        });
      }
    },
    [updateMaster, errors, onErrorsChange]
  );

  const handleAccessTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const accessType = e.target.value as (typeof ACCESS_TYPES)[number];
      updateMaster({
        access_config: {
          ...data.master.access_config,
          access_type: accessType,
          allowed_groups:
            accessType === "public"
              ? []
              : data.master.access_config.allowed_groups,
        },
      });
    },
    [updateMaster, data.master.access_config]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#283618] mb-4">
          {t("title", { default: "Información Básica" })}
        </h2>
        <p className="text-[#283618]/70">
          {t("description", {
            default: "Define los datos principales de tu plantilla",
          })}
        </p>
      </div>

      <div className="space-y-4">
        {/* Nombre de la plantilla */}
        <div>
          <label
            htmlFor="template_name"
            className="block text-sm font-medium text-[#283618]/70 mb-2"
          >
            {t("fields.name.label", { default: "Nombre de la Plantilla" })} *
          </label>
          <input
            type="text"
            id="template_name"
            value={data.master.template_name}
            onChange={handleNameChange}
            className={`
              block w-full px-3 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${
                errors.template_name?.length
                  ? "border-red-500"
                  : "border-gray-300"
              }
            `}
            placeholder={t("fields.name.placeholder", {
              default: "Ej: Boletín Agroclimático de Café - Nariño",
            })}
          />
          {errors.template_name?.map((error, index) => (
            <p key={index} className="mt-1 text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>

        {/* Descripción */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-[#283618]/70 mb-2"
          >
            {t("fields.description.label", { default: "Descripción" })} *
          </label>
          <textarea
            id="description"
            rows={3}
            value={data.master.description}
            onChange={handleDescriptionChange}
            className={`
              block w-full px-3 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${
                errors.description?.length
                  ? "border-red-500"
                  : "border-gray-300"
              }
            `}
            placeholder={t("fields.description.placeholder", {
              default: "Describe el propósito y alcance de esta plantilla...",
            })}
          />
          {errors.description?.map((error, index) => (
            <p key={index} className="mt-1 text-sm text-red-600">
              {error}
            </p>
          ))}
        </div>

        {/* Tipo de Acceso */}
        <div>
          <label
            htmlFor="access_type"
            className="block text-sm font-medium text-[#283618]/70 mb-2"
          >
            {t("fields.accessType.label", { default: "Tipo de Acceso" })}
          </label>
          <select
            id="access_type"
            value={data.master.access_config.access_type}
            onChange={handleAccessTypeChange}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="public">
              {t("fields.accessType.options.public", { default: "Público" })}
            </option>
            <option value="restricted">
              {t("fields.accessType.options.restricted", {
                default: "Restringido",
              })}
            </option>
          </select>
          <p className="mt-1 text-xs text-[#283618]/50">
            {data.master.access_config.access_type === "public"
              ? t("fields.accessType.help.public", {
                  default: "Visible para todos los usuarios",
                })
              : t("fields.accessType.help.restricted", {
                  default: "Solo visible para grupos específicos",
                })}
          </p>
        </div>

        {/* Grupos permitidos (solo si es restringido) */}
        {data.master.access_config.access_type === "restricted" && (
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {t("fields.allowedGroups.label", {
                default: "Grupos Permitidos",
              })}
            </label>
            <div className="border border-gray-300 rounded-md p-3 bg-gray-50">
              <p className="text-sm text-[#283618]/50">
                {t("fields.allowedGroups.placeholder", {
                  default:
                    "Funcionalidad de selección de grupos estará disponible próximamente",
                })}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
