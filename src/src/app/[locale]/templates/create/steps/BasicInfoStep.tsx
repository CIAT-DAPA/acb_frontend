"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CreateTemplateData } from "../../../../../types/template";
import { ACCESS_TYPES } from "../../../../../types/core";
import GroupSelector from "../../../components/GroupSelector";
import { slugify, isValidSlug } from "../../../../../utils/slugify";

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
  const allowedGroups: string[] =
    data?.master?.access_config?.allowed_groups ?? [];
  
  // Estado para controlar si el name_machine está siendo editado manualmente
  const [isManualNameMachine, setIsManualNameMachine] = useState(false);

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
      const newName = e.target.value;
      updateMaster({ template_name: newName });

      // Auto-generar name_machine solo si no se ha editado manualmente
      if (!isManualNameMachine) {
        const newNameMachine = slugify(newName);
        updateMaster({ 
          template_name: newName,
          name_machine: newNameMachine 
        });
      }

      // Limpiar errores del campo
      if (errors.template_name) {
        onErrorsChange({
          ...errors,
          template_name: [],
        });
      }
    },
    [updateMaster, errors, onErrorsChange, isManualNameMachine]
  );

  const handleNameMachineChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newNameMachine = e.target.value;
      setIsManualNameMachine(true);
      updateMaster({ name_machine: newNameMachine });

      // Validar el formato
      if (newNameMachine && !isValidSlug(newNameMachine)) {
        onErrorsChange({
          ...errors,
          name_machine: [t("fields.nameMachine.errors.invalid", {
            default: "Solo se permiten letras minúsculas, números y guiones. No puede comenzar ni terminar con guión."
          })],
        });
      } else if (errors.name_machine) {
        onErrorsChange({
          ...errors,
          name_machine: [],
        });
      }
    },
    [updateMaster, errors, onErrorsChange, t]
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

        {/* Nombre máquina (slug) */}
        <div>
          <label
            htmlFor="name_machine"
            className="block text-sm font-medium text-[#283618]/70 mb-2"
          >
            {t("fields.nameMachine.label", { default: "Nombre Máquina" })} *
          </label>
          <input
            type="text"
            id="name_machine"
            value={data.master.name_machine || ""}
            onChange={handleNameMachineChange}
            className={`
              block w-full px-3 py-2 border rounded-md shadow-sm font-mono text-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              ${
                errors.name_machine?.length
                  ? "border-red-500"
                  : "border-gray-300"
              }
            `}
            placeholder={t("fields.nameMachine.placeholder", {
              default: "ej: boletin-agroclimatico-cafe-narino",
            })}
          />
          <p className="mt-1 text-xs text-[#283618]/50">
            {t("fields.nameMachine.help", {
              default: "Identificador único para URLs y APIs. Se genera automáticamente pero puedes editarlo.",
            })}
          </p>
          {errors.name_machine?.map((error, index) => (
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
            <GroupSelector
              selectedIds={allowedGroups}
              onChange={(newIds) =>
                updateMaster({ access_config: { ...data.master.access_config, allowed_groups: newIds } })
              }
              id="allowed_groups"
              label={t("fields.allowedGroups.label", {
                      default: "Grupos Permitidos",
                    })}
              placeholder={t("fields.allowedGroups.placeholder", { default: "Selecciona un grupo..." })}
              loadingText={t("fields.allowedGroups.loading", { default: "Cargando grupos..." })}
            />
          </div>
        )}
      </div>
    </div>
  );
}
