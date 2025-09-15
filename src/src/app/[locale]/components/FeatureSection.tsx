"use client";

import { useTranslations } from "next-intl";
import { FileText, Download, GitBranch, Palette } from "lucide-react";
import { container } from "./ui";

export function FeaturesSection() {
  const t = useTranslations("Features");

  const features = [
    {
      icon: FileText,
      title: t("feature1.title"),
      description: t("feature1.description"),
    },
    {
      icon: Download,
      title: t("feature2.title"),
      description: t("feature2.description"),
    },
    {
      icon: GitBranch,
      title: t("feature3.title"),
      description: t("feature3.description"),
    },
    {
      icon: Palette,
      title: t("feature4.title"),
      description: t("feature4.description"),
    },
  ];
  return (
    <section className="bg-white py-10">
      <div className={`${container} mx-auto`}>
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-foreground">
            {t("title")}
            <span className="text-primary block">{t("titleHighlight")}</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="rounded-2xl border border-gray-200/70 bg-white p-6 md:p-8 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-100"
            >
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-lime-50 ring-1 ring-lime-100 flex items-center justify-center transition-colors">
                  <feature.icon className="h-6 w-6 text-[#283618]" />
                </div>
                <h3 className="text-lg font-semibold text-[#283618]">
                  {feature.title}
                </h3>
                <p className="text-[#283618] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
