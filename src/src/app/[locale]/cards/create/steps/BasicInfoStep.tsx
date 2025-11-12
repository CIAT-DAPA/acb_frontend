"use client";

import React, { useCallback, useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  CreateCardData,
  CardType,
  getCardTypeIcon,
  hasCardTypeTranslation,
} from "../../../../../types/card";
import { ACCESS_TYPES } from "../../../../../types/core";
import { GroupAPIService } from "../../../../../services/groupService";
import { EnumAPIService, EnumValue } from "../../../../../services/enumService";
import { Group } from "../../../../../types/groups";
import { Loader2 } from "lucide-react";
import GroupSelector from "../../../components/GroupSelector";

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
  const tCards = useTranslations("Cards");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [cardTypes, setCardTypes] = useState<EnumValue[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // Cargar tipos de cards al montar
  useEffect(() => {
    const loadCardTypes = async () => {
      setLoadingTypes(true);
      try {
        const types = await EnumAPIService.getCardTypes();
        setCardTypes(types);
      } catch (error) {
        console.error("Error loading card types:", error);
        setCardTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    };

    loadCardTypes();
  }, []);

  // Función helper para obtener el label traducido
  const getCardTypeLabel = (cardType: string): string => {
    if (hasCardTypeTranslation(cardType)) {
      return tCards(`cardTypes.${cardType}`);
    }
    return cardType;
  };

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
    (newIds: string[]) => {
      onDataChange((prevData) => ({
        ...prevData,
        access_config: {
          ...prevData.access_config,
          allowed_groups: newIds,
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
          {loadingTypes ? (
            <div className="flex items-center justify-center py-4 border border-gray-300 rounded-lg">
              <Loader2 className="h-5 w-5 animate-spin text-[#606c38]" />
              <span className="ml-2 text-sm text-[#283618]/60">
                Cargando tipos...
              </span>
            </div>
          ) : (
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
              {cardTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {getCardTypeIcon(type.value)} {getCardTypeLabel(type.value)}
                </option>
              ))}
            </select>
          )}
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

        {/* Grupos permitidos (solo si es restringido) */}
        {data.access_config.access_type === "restricted" && (
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
                <GroupSelector
                  selectedIds={data.access_config.allowed_groups || []}
                  onChange={handleGroupsChange}
                  id="allowed_groups"
                />
                {errors.allowed_groups && errors.allowed_groups.length > 0 && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.allowed_groups[0]}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
