"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateBulletinData } from "../../../../../types/bulletin";

interface BasicInfoStepProps {
  bulletinData: CreateBulletinData;
  onUpdate: (updater: (prev: CreateBulletinData) => CreateBulletinData) => void;
}

export function BasicInfoStep({
  bulletinData,
  onUpdate,
}: BasicInfoStepProps) {
  const t = useTranslations("CreateBulletin");

  const handleNameChange = (value: string) => {
    onUpdate((prev) => ({
      ...prev,
      master: {
        ...prev.master,
        bulletin_name: value,
      },
    }));
  };

  const isValid = bulletinData.master.bulletin_name.trim().length > 0;

  return (
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
  );
}
