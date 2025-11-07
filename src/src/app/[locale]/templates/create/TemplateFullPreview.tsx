"use client";

import React, { useState } from "react";
import { TemplateFullPreviewProps, PreviewMode } from "@/types/templatePreview";
import { TemplateCarouselView } from "./components/TemplateCarouselView";
import { TemplateScrollView } from "./components/TemplateScrollView";
import { TemplateGridView } from "./components/TemplateGridView";
import { TemplateModeToggle } from "./components/TemplateModeToggle";

/**
 * Componente principal de preview que soporta 3 modos de visualización:
 * - Carousel: navegación de sección en sección (horizontal/vertical)
 * - Scroll: todas las secciones en lista scrollable
 * - Grid: miniaturas de todas las secciones en grilla
 */
export function TemplateFullPreview({
  data,
  mode: initialMode,
  carouselConfig,
  scrollConfig,
  gridConfig,
  allowModeToggle = false,
  initialSection = 0,
  className = "",
}: TemplateFullPreviewProps) {
  // Estado del modo actual (permite cambio dinámico si allowModeToggle=true)
  const [currentMode, setCurrentMode] = useState<PreviewMode>(initialMode);

  // Validación básica
  if (!data || !data.version || !data.version.content) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error: Datos de template inválidos</p>
      </div>
    );
  }

  const sections = data.version.content.sections || [];

  if (sections.length === 0) {
    return (
      <div className="p-8 text-center text-[#283618]/50">
        <div className="text-4xl mb-4">📄</div>
        <p>No hay secciones para previsualizar</p>
      </div>
    );
  }

  return (
    <div className={`template-full-preview ${className}`}>
      {/* Toggle de modos (si está habilitado) */}
      {allowModeToggle && (
        <TemplateModeToggle
          currentMode={currentMode}
          onModeChange={setCurrentMode}
          className="mb-4"
        />
      )}

      {/* Renderizado condicional según el modo activo */}
      {currentMode === "carousel" && (
        <TemplateCarouselView
          data={data}
          config={carouselConfig}
          initialSection={initialSection}
        />
      )}

      {currentMode === "scroll" && (
        <TemplateScrollView
          data={data}
          config={scrollConfig}
          initialSection={initialSection}
        />
      )}

      {currentMode === "grid" && (
        <TemplateGridView
          data={data}
          config={gridConfig}
          initialSection={initialSection}
        />
      )}
    </div>
  );
}
