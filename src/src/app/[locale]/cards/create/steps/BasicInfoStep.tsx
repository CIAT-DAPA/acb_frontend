"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  CreateCardData,
  CARD_TYPES,
  CardType,
} from "../../../../../types/card";
import { ACCESS_TYPES } from "../../../../../types/core";
import { GroupAPIService } from "../../../../../services/groupService";
import { Group } from "../../../../../types/groups";
import { Loader2 } from "lucide-react";

interface BasicInfoStepProps {
  data: CreateCardData;
  errors: Record<string, string[]>;
  onDataChange: (updater: (prevData: CreateCardData) => CreateCardData) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
}

export function BasicInfoStep({
  data,
  errors,
  onDataChange,
  onErrorsChange,
}: BasicInfoStepProps) {
  const t = useTranslations("CreateCard.basicInfo");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);

  // Cargar grupos disponibles
  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await GroupAPIService.getGroups();
        if (response.success) {
          setGroups(response.data);
        }
      } catch (error) {
        console.error("Error loading groups:", error);
      } finally {
        setLoadingGroups(false);
      }
    };

    loadGroups();
  }, []);

  const handleNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onDataChange((prevData) => ({
        ...prevData,
        card_name: e.target.value,
      }));

      // Limpiar errores del campo
      if (errors.card_name) {
        onErrorsChange({
          ...errors,
          card_name: [],
        });
      }
    },
    [onDataChange, errors, onErrorsChange]
  );

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      onDataChange((prevData) => ({
        ...prevData,
        card_type: e.target.value as CardType,
      }));

      // Limpiar errores del campo
      if (errors.card_type) {
        onErrorsChange({
          ...errors,
          card_type: [],
        });
      }
    },
    [onDataChange, errors, onErrorsChange]
  );

  const handleAccessTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const accessType = e.target.value as (typeof ACCESS_TYPES)[number];
      onDataChange((prevData) => ({
        ...prevData,
        access_config: {
          ...prevData.access_config,
          access_type: accessType,
          allowed_groups:
            accessType === "public"
              ? []
              : prevData.access_config.allowed_groups || [],
        },
      }));
    },
    [onDataChange, data.access_config]
  );

  const handleGroupsChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOptions = Array.from(e.target.selectedOptions).map(
        (option) => option.value
      );

      onDataChange((prevData) => ({
        ...prevData,
        access_config: {
          ...prevData.access_config,
          allowed_groups: selectedOptions,
        },
      }));

      // Limpiar errores del campo
      if (errors.allowed_groups) {
        onErrorsChange({
          ...errors,
          allowed_groups: [],
        });
      }
    },
    [onDataChange, errors, onErrorsChange]
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#283618] mb-4">
          {t("title")}
        </h2>
        <p className="text-[#283618]/70">{t("description")}</p>
      </div>

      <div className="space-y-4">
        {/* Nombre de la card */}
        <div>
          <label
            htmlFor="card_name"
            className="block text-sm font-medium text-[#283618] mb-2"
          >
            {t("name")} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="card_name"
            value={data.card_name}
            onChange={handleNameChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#606c38] focus:border-transparent ${
              errors.card_name && errors.card_name.length > 0
                ? "border-red-500"
                : "border-gray-300"
            }`}
            placeholder={t("namePlaceholder")}
          />
          {errors.card_name && errors.card_name.length > 0 && (
            <p className="text-red-500 text-sm mt-1">{errors.card_name[0]}</p>
          )}
        </div>

        {/* Tipo de card */}
        <div>
          <label
            htmlFor="card_type"
            className="block text-sm font-medium text-[#283618] mb-2"
          >
            {t("type")} <span className="text-red-500">*</span>
          </label>
          <select
            id="card_type"
            value={data.card_type}
            onChange={handleTypeChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#606c38] focus:border-transparent ${
              errors.card_type && errors.card_type.length > 0
                ? "border-red-500"
                : "border-gray-300"
            }`}
          >
            {Object.entries(CARD_TYPES).map(([type, { label, icon }]) => (
              <option key={type} value={type}>
                {icon} {label}
              </option>
            ))}
          </select>
          {errors.card_type && errors.card_type.length > 0 && (
            <p className="text-red-500 text-sm mt-1">{errors.card_type[0]}</p>
          )}
          <p className="text-sm text-[#283618]/60 mt-1">{t("typeHelp")}</p>
        </div>

        {/* Tipo de acceso */}
        <div>
          <label
            htmlFor="access_type"
            className="block text-sm font-medium text-[#283618] mb-2"
          >
            {t("accessType")} <span className="text-red-500">*</span>
          </label>
          <select
            id="access_type"
            value={data.access_config.access_type}
            onChange={handleAccessTypeChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#606c38] focus:border-transparent"
          >
            {ACCESS_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`accessTypes.${type}`)}
              </option>
            ))}
          </select>
          <p className="text-sm text-[#283618]/60 mt-1">
            {t("accessTypeHelp")}
          </p>
        </div>

        {/* Grupos permitidos (solo si es privado) */}
        {data.access_config.access_type === "private" && (
          <div>
            <label
              htmlFor="allowed_groups"
              className="block text-sm font-medium text-[#283618] mb-2"
            >
              {t("allowedGroups")} <span className="text-red-500">*</span>
            </label>
            {loadingGroups ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-[#606c38]" />
                <span className="ml-2 text-sm text-[#283618]/60">
                  {t("loadingGroups")}
                </span>
              </div>
            ) : (
              <>
                <select
                  id="allowed_groups"
                  multiple
                  value={data.access_config.allowed_groups || []}
                  onChange={handleGroupsChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#606c38] focus:border-transparent min-h-[120px] ${
                    errors.allowed_groups && errors.allowed_groups.length > 0
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  {groups.map((group) => (
                    <option key={group._id} value={group._id}>
                      {group.group_name}
                    </option>
                  ))}
                </select>
                {errors.allowed_groups && errors.allowed_groups.length > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.allowed_groups[0]}
                  </p>
                )}
                <p className="text-sm text-[#283618]/60 mt-1">
                  {t("allowedGroupsHelp")}
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
