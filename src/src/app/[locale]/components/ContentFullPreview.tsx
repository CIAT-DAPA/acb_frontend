"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { TemplateFullPreviewProps, PreviewMode } from "@/types/templatePreview";
import { CreateTemplateData } from "@/types/template";
import { CarouselView } from "./CarouselView";
import { ScrollView } from "./ScrollView";
import { GridView } from "./GridView";
import { ModeToggle } from "./ModeToggle";

/**
 * Componente principal de preview que soporta 3 modos de visualización:
 * - Carousel: navegación de sección en sección (horizontal/vertical)
 * - Scroll: todas las secciones en lista scrollable
 * - Grid: miniaturas de todas las secciones en grilla
 * 
 * Componente genérico que funciona con templates y bulletins
 */
interface ContentFullPreviewProps extends Omit<TemplateFullPreviewProps, 'data'> {
  data: CreateTemplateData;
}

export function ContentFullPreview({
  data,
  mode: initialMode,
  carouselConfig,
  scrollConfig,
  gridConfig,
  allowModeToggle = false,
  initialSection = 0,
  className = "",
}: ContentFullPreviewProps) {
  const t = useTranslations("ContentFullPreview");
  
  // Estado del modo actual (permite cambio dinámico si allowModeToggle=true)
  const [currentMode, setCurrentMode] = useState<PreviewMode>(initialMode);

  // Validación básica
  if (!data || !data.version || !data.version.content) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>{t("errors.invalidData")}</p>
      </div>
    );
  }

  const sections = data.version.content.sections || [];

  if (sections.length === 0) {
    return (
      <div className="p-8 text-center text-[#283618]/50">
        <div className="text-4xl mb-4">📄</div>
        <p>{t("noSections")}</p>
      </div>
    );
  }

  return (
    <div className={`content-full-preview flex flex-col min-h-0 ${className}`}>
      {/* Toggle de modos (si está habilitado) */}
      {allowModeToggle && (
        <ModeToggle
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          className="mb-4"
        />
      )}

      {/* Renderizado condicional según el modo activo - Con optimización de scroll */}
      <div className="flex-1 min-h-0">
        {currentMode === "carousel" && (
          <CarouselView
            data={data}
            config={carouselConfig}
            initialSection={initialSection}
          />
        )}

        {currentMode === "scroll" && (
          <ScrollView
            data={data}
            config={scrollConfig}
            initialSection={initialSection}
          />
        )}

        {currentMode === "grid" && (
          <GridView
            data={data}
            config={gridConfig}
            initialSection={initialSection}
          />
        )}
      </div>
    </div>
  );
}
