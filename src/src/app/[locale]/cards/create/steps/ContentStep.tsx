"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateCardData } from "../../../../../types/card";
import { CardSectionsEditor } from "../components/CardSectionsEditor";

interface ContentStepProps {
  data: CreateCardData;
  errors: Record<string, string[]>;
  onDataChange: (updater: (prevData: CreateCardData) => CreateCardData) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
}

export function ContentStep({
  data,
  errors,
  onDataChange,
  onErrorsChange,
}: ContentStepProps) {
  const t = useTranslations("CreateCard.content");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#283618] mb-4">
          {t("title")}
        </h2>
        <p className="text-[#283618]/70">{t("description")}</p>
      </div>

      {/* Card-specific sections editor with only Blocks, Header, Footer tabs */}
      <CardSectionsEditor
        data={data}
        errors={errors}
        onDataChange={onDataChange}
        onErrorsChange={onErrorsChange}
      />
    </div>
  );
}
