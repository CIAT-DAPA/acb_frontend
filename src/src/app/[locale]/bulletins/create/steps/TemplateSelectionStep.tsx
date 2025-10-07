"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { TemplateMaster } from "../../../../../types/template";
import { TemplateAPIService } from "../../../../../services/templateService";
import { Loader2, FileText, Search } from "lucide-react";
import Image from "next/image";

interface TemplateSelectionStepProps {
  selectedTemplateId?: string;
  onSelectTemplate: (templateId: string) => void;
}

export function TemplateSelectionStep({
  selectedTemplateId,
  onSelectTemplate,
}: TemplateSelectionStepProps) {
  const t = useTranslations("CreateBulletin");
  const [templates, setTemplates] = useState<TemplateMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await TemplateAPIService.getTemplates();
      if (response.success) {
        // Filtrar solo templates activos
        const activeTemplates = response.data.filter(
          (t) => t.status === "active"
        );
        setTemplates(activeTemplates);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter((template) =>
    template.template_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#283618] mb-2">
          {t("selectTemplate.title")}
        </h2>
        <p className="text-sm text-[#283618]/70">
          {t("selectTemplate.description")}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-[#283618]/40" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t("selectTemplate.searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2 border border-[#283618]/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffaf68]"
        />
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#ffaf68]" />
        </div>
      )}

      {/* Templates Grid */}
      {!loading && (
        <div className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto">
          {filteredTemplates.map((template) => (
            <button
              key={template._id}
              onClick={() => onSelectTemplate(template._id!)}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                selectedTemplateId === template._id
                  ? "border-[#283618] bg-[#283618]/10"
                  : "border-[#283618]/20 hover:border-[#283618]/50"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="w-20 h-28 bg-gray-100 rounded flex-shrink-0 relative overflow-hidden">
                  {template.thumbnail_images && template.thumbnail_images[0] ? (
                    <Image
                      src={template.thumbnail_images[0]}
                      alt={template.template_name}
                      fill
                      className="object-contain"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="h-8 w-8 text-[#283618]/30" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-[#283618] mb-1">
                    {template.template_name}
                  </h3>
                  <p className="text-sm text-[#283618]/70 mb-2">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-[#283618]/60">
                    <span className="px-2 py-1 bg-[#283618]/10 rounded">
                      {template.status}
                    </span>
                    <span className="px-2 py-1 bg-[#283618]/10 rounded">
                      {template.access_config.access_type}
                    </span>
                  </div>
                </div>

                {/* Selected indicator */}
                {selectedTemplateId === template._id && (
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 rounded-full bg-[#283618] flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filteredTemplates.length === 0 && (
        <div className="text-center py-12 text-[#283618]/50">
          <FileText className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>{t("selectTemplate.noTemplates")}</p>
        </div>
      )}
    </div>
  );
}
