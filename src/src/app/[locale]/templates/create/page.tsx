"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useState } from "react";

export default function CreateTemplate() {
  const t = useTranslations("Templates.Create");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "monthly",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica para crear la plantilla
    console.log("Creating template:", formData);
  };

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-8">
        <Link
          href="/templates"
          className="flex items-center space-x-2 text-[#ffaf68] hover:text-[#e09950] mr-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>{t("back")}</span>
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-[#283618] mb-2">
            {t("title")}
          </h1>
          <p className="text-[#283618]/70">{t("subtitle")}</p>
        </div>
      </div>

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="max-w-2xl bg-white rounded-lg border border-[#283618]/10 p-8"
      >
        {/* Template Name */}
        <div className="mb-6">
          <label className="block text-[#283618] font-medium mb-2">
            {t("name")}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-4 py-3 border border-[#283618]/20 rounded-lg focus:ring-2 focus:ring-[#ffaf68] focus:border-transparent"
            placeholder={t("namePlaceholder")}
            required
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-[#283618] font-medium mb-2">
            {t("description")}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            className="w-full px-4 py-3 border border-[#283618]/20 rounded-lg focus:ring-2 focus:ring-[#ffaf68] focus:border-transparent h-32"
            placeholder={t("descriptionPlaceholder")}
          />
        </div>

        {/* Category */}
        <div className="mb-8">
          <label className="block text-[#283618] font-medium mb-2">
            {t("category")}
          </label>
          <select
            value={formData.category}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, category: e.target.value }))
            }
            className="w-full px-4 py-3 border border-[#283618]/20 rounded-lg focus:ring-2 focus:ring-[#ffaf68] focus:border-transparent"
          >
            <option value="monthly">{t("categories.monthly")}</option>
            <option value="weekly">{t("categories.weekly")}</option>
            <option value="alerts">{t("categories.alerts")}</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            type="submit"
            className="flex items-center space-x-2 bg-[#ffaf68] text-white px-6 py-3 rounded-lg hover:bg-[#e09950] transition-colors"
          >
            <Save className="h-5 w-5" />
            <span>{t("create")}</span>
          </button>

          <Link
            href="/templates"
            className="flex items-center space-x-2 bg-[#283618]/10 text-[#283618] px-6 py-3 rounded-lg hover:bg-[#283618]/20 transition-colors"
          >
            <span>{t("cancel")}</span>
          </Link>
        </div>
      </form>
    </main>
  );
}
