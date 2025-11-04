"use client";

import React, { useState, useEffect, useRef } from "react";
import { ScrollConfig } from "@/types/templatePreview";
import { CreateTemplateData } from "@/types/template";
import { TemplatePreview } from "../templates/create/TemplatePreview";
import { List, X } from "lucide-react";

interface ScrollViewProps {
  data: CreateTemplateData;
  config?: ScrollConfig;
  initialSection?: number;
}

/**
 * Vista de scroll para ver todas las secciones en lista scrollable
 * Soporta orientación horizontal/vertical, mini-nav y scroll-spy
 * Componente genérico que funciona con templates y bulletins
 * Optimizado con flex-col y min-h-0 para scroll correcto
 */
export function ScrollView({
  data,
  config = {},
  initialSection = 0,
}: ScrollViewProps) {
  const {
    orientation = "vertical",
    showMiniNav = true,
    highlightActive = true,
    spacing = "comfortable",
    expandAllPages = false,
  } = config;

  const sections = data.version.content.sections || [];
  const [activeSectionIndex, setActiveSectionIndex] = useState(initialSection);
  const [isNavOpen, setIsNavOpen] = useState(false); // Estado del mini-nav colapsable
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Mapeo de spacing a valores CSS
  const spacingMap = {
    compact: "gap-4",
    comfortable: "gap-8",
    spacious: "gap-12",
  };

  // Scroll to section cuando se hace click en mini-nav
  const scrollToSection = (index: number) => {
    const sectionElement = sectionRefs.current[index];
    if (sectionElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      const containerRect = container.getBoundingClientRect();
      const sectionRect = sectionElement.getBoundingClientRect();

      if (orientation === "vertical") {
        const scrollTop =
          sectionElement.offsetTop -
          container.offsetTop -
          (containerRect.height / 2 - sectionRect.height / 2);
        container.scrollTo({ top: scrollTop, behavior: "smooth" });
      } else {
        const scrollLeft =
          sectionElement.offsetLeft -
          container.offsetLeft -
          (containerRect.width / 2 - sectionRect.width / 2);
        container.scrollTo({ left: scrollLeft, behavior: "smooth" });
      }

      setActiveSectionIndex(index);
    }
  };

  // Scroll-spy: detectar qué sección está visible
  useEffect(() => {
    if (!highlightActive || !scrollContainerRef.current) return;

    const container = scrollContainerRef.current;

    const handleScroll = () => {
      const containerRect = container.getBoundingClientRect();
      const centerPoint =
        orientation === "vertical"
          ? containerRect.top + containerRect.height / 2
          : containerRect.left + containerRect.width / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      sectionRefs.current.forEach((section, index) => {
        if (!section) return;

        const sectionRect = section.getBoundingClientRect();
        const sectionCenter =
          orientation === "vertical"
            ? sectionRect.top + sectionRect.height / 2
            : sectionRect.left + sectionRect.width / 2;

        const distance = Math.abs(centerPoint - sectionCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setActiveSectionIndex(closestIndex);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, [highlightActive, orientation]);

  // Scroll a sección inicial al montar
  useEffect(() => {
    if (initialSection > 0 && initialSection < sections.length) {
      setTimeout(() => scrollToSection(initialSection), 100);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const isVertical = orientation === "vertical";

  return (
    <div className="template-scroll-view relative flex gap-4 w-full">
      {/* Botón flotante para abrir mini-nav (visible en móvil) */}
      {showMiniNav && !isNavOpen && (
        <button
          onClick={() => setIsNavOpen(true)}
          className="
            md:hidden fixed bottom-4 left-4 z-20
            bg-white/80 backdrop-blur-sm hover:bg-white
            p-2.5 rounded-full shadow-lg
            transition-all border border-[#283618]/10
          "
          aria-label="Abrir navegador de secciones"
        >
          <List className="w-5 h-5 text-[#283618]" />
        </button>
      )}

      {/* Mini navegador lateral - Colapsable en móvil */}
      {showMiniNav && (
        <>
          {/* Overlay para cerrar en móvil */}
          {isNavOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-30"
              onClick={() => setIsNavOpen(false)}
            />
          )}

          {/* Panel del navegador */}
          <div
            className={`
              flex-col h-fit
              flex gap-2 bg-white p-3 rounded-lg shadow-lg z-40
              
              // En móvil: panel flotante deslizable desde fuera de la pantalla
              md:static md:top-4
              fixed top-20 left-0 right-0 mx-4
              
              // Animación de entrada/salida en móvil
              transition-transform duration-300 ease-in-out
              ${
                isNavOpen
                  ? "translate-y-0"
                  : "-translate-y-[calc(100%+6rem)] md:translate-y-0"
              }
              
              // Scroll interno si hay muchas secciones
              max-h-[60vh] md:max-h-[70vh] overflow-y-auto
            `}
          >
            {/* Header con título y botón cerrar (solo móvil) */}
            <div className="flex items-center justify-between mb-2 md:mb-1">
              <div className="text-xs md:text-xs font-semibold text-[#283618]/70">
                Secciones ({sections.length})
              </div>
              <button
                onClick={() => setIsNavOpen(false)}
                className="md:hidden p-1 hover:bg-[#283618]/5 rounded transition-colors"
                aria-label="Cerrar navegador"
              >
                <X className="w-4 h-4 text-[#283618]" />
              </button>
            </div>

            {/* Lista de secciones */}
            {sections.map((section, index) => (
              <button
                key={index}
                onClick={() => {
                  scrollToSection(index);
                  setIsNavOpen(false); // Cerrar en móvil después de seleccionar
                }}
                className={`
                  ${isVertical ? "w-full" : "h-full"}
                  px-2.5 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm transition-all text-left
                  ${
                    activeSectionIndex === index
                      ? "bg-[#ffaf68] text-white font-medium shadow-sm"
                      : "bg-[#283618]/5 text-[#283618] hover:bg-[#283618]/10"
                  }
                `}
                aria-label={`Ir a sección ${index + 1}`}
                aria-current={activeSectionIndex === index ? "true" : "false"}
              >
                <div className="flex items-center gap-1.5 md:gap-2">
                  <span className="font-mono text-[10px] md:text-xs opacity-70">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="truncate text-xs md:text-sm">
                    {section.display_name || `Sección ${index + 1}`}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Contenedor de scroll con todas las secciones */}
      <div
        ref={scrollContainerRef}
        className={`
          flex-1 w-full
          ${
            isVertical
              ? "overflow-y-auto max-h-[85vh] md:max-h-[80vh]"
              : "overflow-x-auto md:max-w-[80vw] overflow-y-hidden"
          }
          ${isVertical ? "flex-col" : "flex-row"}
          flex ${spacingMap[spacing]} 
          p-2 md:p-4
          mx-2 md:mx-0
          scrollbar-thin scrollbar-thumb-[#ffaf68] scrollbar-track-gray-100
        `}
      >
        {sections.map((section, sectionIndex) => {
          // Calcular el número de páginas para esta sección
          const getSectionPageCount = () => {
            if (!expandAllPages) return 1;

            let maxPages = 1;
            section.blocks?.forEach((block: any) => {
              block.fields?.forEach((field: any) => {
                if (field.type === "card" && Array.isArray(field.value)) {
                  maxPages = Math.max(maxPages, field.value.length);
                } else if (
                  field.type === "list" &&
                  Array.isArray(field.value)
                ) {
                  const itemsPerPage =
                    field.field_config?.max_items_per_page || 5;
                  const pageCount = Math.ceil(
                    field.value.length / itemsPerPage
                  );
                  maxPages = Math.max(maxPages, pageCount);
                }
              });
            });
            return maxPages;
          };

          const pageCount = getSectionPageCount();

          return expandAllPages && pageCount > 1 ? (
            // Modo expandido: mostrar todas las páginas de la sección
            <div key={sectionIndex} className="flex gap-4">
              {Array.from({ length: pageCount }).map((_, pageIndex) => (
                <div
                  key={`${sectionIndex}-${pageIndex}`}
                  ref={(el) => {
                    if (pageIndex === 0) sectionRefs.current[sectionIndex] = el;
                  }}
                  className={`
                    scroll-section flex-shrink-0
                    ${
                      highlightActive && activeSectionIndex === sectionIndex
                        ? "ring-2 md:ring-4 ring-[#ffaf68] ring-offset-2 md:ring-offset-4 rounded-lg"
                        : ""
                    }
                    transition-all duration-300
                  `}
                >
                  {/* Título de sección con número de página */}
                  <div className="mb-1.5 md:mb-2 px-1 md:px-2">
                    <h3 className="text-xs md:text-sm font-semibold text-[#283618]">
                      {section.display_name || `Sección ${sectionIndex + 1}`}
                      <span className="text-xs ml-2 text-[#606c38]">
                        (Página {pageIndex + 1}/{pageCount})
                      </span>
                    </h3>
                  </div>

                  {/* Preview de la página específica */}
                  <TemplatePreview
                    data={data}
                    selectedSectionIndex={sectionIndex}
                    currentPageIndex={pageIndex}
                    hidePagination={true}
                  />
                </div>
              ))}
            </div>
          ) : (
            // Modo normal: una sección
            <div
              key={sectionIndex}
              ref={(el) => {
                sectionRefs.current[sectionIndex] = el;
              }}
              className={`
                scroll-section flex-shrink-0
                ${
                  highlightActive && activeSectionIndex === sectionIndex
                    ? "ring-2 md:ring-4 ring-[#ffaf68] ring-offset-2 md:ring-offset-4 rounded-lg"
                    : ""
                }
                transition-all duration-300
              `}
            >
              {/* Título de sección - Más compacto en móvil */}
              <div className="mb-1.5 md:mb-2 px-1 md:px-2">
                <h3 className="text-xs md:text-sm font-semibold text-[#283618]">
                  Sección {sectionIndex + 1}
                  {section.display_name && (
                    <span className="hidden md:inline">
                      : {section.display_name}
                    </span>
                  )}
                </h3>
              </div>

              {/* Preview de la sección */}
              <TemplatePreview
                data={data}
                selectedSectionIndex={sectionIndex}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
