"use client";

import React, { useState } from "react";
import { GridConfig } from "@/types/templatePreview";
import { CreateTemplateData } from "@/types/template";
import { TemplatePreview } from "../templates/create/TemplatePreview";
import { TemplateModal } from "@/app/[locale]/components/TemplateModal";

interface GridViewProps {
  data: CreateTemplateData;
  config?: GridConfig;
  initialSection?: number;
}

/**
 * Vista de grilla para ver miniaturas de todas las secciones
 * Muestra mini-renders de cada sección en una grilla responsiva
 * Componente genérico que funciona con templates y bulletins
 */
export function GridView({
  data,
  config = {},
  initialSection = 0,
}: GridViewProps) {
  const {
    columns = 3,
    thumbnailSize = "medium",
    showLabels = true,
    onSectionClick,
  } = config;

  const sections = data.version.content.sections || [];
  const [selectedSection, setSelectedSection] = useState<number | null>(null);

  // Mapeo de tamaños de thumbnail
  const sizeMap = {
    small: "scale-[0.25]",
    medium: "scale-[0.35]",
    large: "scale-[0.5]",
  };

  const containerSizeMap = {
    small: "h-40",
    medium: "h-56",
    large: "h-80",
  };

  // Grilla responsiva según columnas
  const gridColsMap: Record<number, string> = {
    1: "grid-cols-1",
    2: "grid-cols-1 md:grid-cols-2",
    3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
    5: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5",
    6: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6",
  };

  const handleThumbnailClick = (index: number) => {
    setSelectedSection(index);
    onSectionClick?.(index);
  };

  const closeModal = () => {
    setSelectedSection(null);
  };

  return (
    <div className="template-grid-view">
      {/* Grilla de thumbnails */}
      <div className={`grid ${gridColsMap[columns] || gridColsMap[3]} gap-6`}>
        {sections.map((section, index) => (
          <div
            key={index}
            className="thumbnail-card group cursor-pointer"
            onClick={() => handleThumbnailClick(index)}
          >
            {/* Label de sección */}
            {showLabels && (
              <div className="mb-2 px-2">
                <h3 className="text-sm font-semibold text-[#283618] group-hover:text-[#ffaf68] transition-colors">
                  Sección {index + 1}
                </h3>
                {section.display_name && (
                  <p className="text-xs text-[#283618]/60 truncate">
                    {section.display_name}
                  </p>
                )}
              </div>
            )}

            {/* Thumbnail (mini-render escalado) */}
            <div
              className={`
                ${containerSizeMap[thumbnailSize]} w-full
                relative overflow-hidden rounded-lg border-2 border-[#283618]/10
                group-hover:border-[#ffaf68] group-hover:shadow-lg
                transition-all duration-300 bg-gray-50
                flex items-center justify-center
              `}
            >
              <div
                className={`
                  ${sizeMap[thumbnailSize]}
                  pointer-events-none
                `}
              >
                <TemplatePreview data={data} selectedSectionIndex={index} />
              </div>

              {/* Overlay al hover */}
              <div className="absolute inset-0 bg-[#ffaf68]/0 group-hover:bg-[#ffaf68]/10 transition-colors" />
              
              {/* Indicador de click */}
              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-white px-2 py-1 rounded text-xs font-medium text-[#283618] shadow-md">
                  Click para ampliar
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de vista completa */}
      <TemplateModal
        isOpen={selectedSection !== null}
        onClose={closeModal}
        title={`Sección ${(selectedSection ?? 0) + 1}`}
        subtitle={
          selectedSection !== null && sections[selectedSection]?.display_name
            ? sections[selectedSection].display_name
            : undefined
        }
        showNavigation={true}
        currentIndex={selectedSection ?? 0}
        totalItems={sections.length}
        onPrevious={() =>
          setSelectedSection((prev) => Math.max(0, (prev ?? 0) - 1))
        }
        onNext={() =>
          setSelectedSection((prev) =>
            Math.min(sections.length - 1, (prev ?? 0) + 1)
          )
        }
      >
        {selectedSection !== null && (
          <TemplatePreview data={data} selectedSectionIndex={selectedSection} />
        )}
      </TemplateModal>
    </div>
  );
}
