"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ScrollConfig } from "@/types/templatePreview";
import { CreateTemplateData } from "@/types/template";
import { Card } from "@/types/card";
import { TemplatePreview } from "../templates/create/TemplatePreview";

interface ScrollViewProps {
  data: CreateTemplateData;
  config?: ScrollConfig;
  initialSection?: number;
  cardsMetadata?: Record<string, Card>;
  cardsMetadataLoading?: boolean;
  renderForPrint?: boolean;
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
  cardsMetadata,
  cardsMetadataLoading = false,
  renderForPrint = false,
}: ScrollViewProps) {
  const t = useTranslations("ScrollView");

  const {
    orientation = "vertical",
    showMiniNav = true,
    showSectionTitle = true,
    highlightActive = true,
    spacing = "comfortable",
    expandAllPages = false,
  } = config;

  const isVertical = orientation === "vertical";

  const sections = useMemo(() => data.version.content.sections || [], [data]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(initialSection);
  const [sectionPageCounts, setSectionPageCounts] = useState<number[]>(() =>
    sections.map(() => 1),
  );
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  const bulletinWidth =
    Number(data.version.content.style_config?.bulletin_width) || 366;
  const bulletinHeight =
    Number(data.version.content.style_config?.bulletin_height) || 638;
  const isMobileViewport = viewportSize.width > 0 && viewportSize.width < 768;

  const mobilePreviewScale = useMemo(() => {
    if (!isMobileViewport || isVertical) {
      return 1;
    }

    const availableWidth = Math.max(viewportSize.width - 24, 1);
    const availableHeight = Math.max(viewportSize.height - 140, 1);

    return Math.min(
      availableWidth / bulletinWidth,
      availableHeight / bulletinHeight,
      1,
    );
  }, [
    isMobileViewport,
    isVertical,
    viewportSize.width,
    viewportSize.height,
    bulletinWidth,
    bulletinHeight,
  ]);

  useEffect(() => {
    setSectionPageCounts(sections.map(() => 1));
  }, [sections]);

  useEffect(() => {
    const updateViewportSize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateViewportSize();
    window.addEventListener("resize", updateViewportSize);

    return () => window.removeEventListener("resize", updateViewportSize);
  }, []);

  const handleResolvedPageCount = (sectionIndex: number, pageCount: number) => {
    setSectionPageCounts((previousCounts) => {
      if (previousCounts[sectionIndex] === pageCount) {
        return previousCounts;
      }

      const nextCounts = [...previousCounts];
      nextCounts[sectionIndex] = pageCount;
      return nextCounts;
    });
  };

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

  return (
    <div className="template-scroll-view relative flex gap-4 w-full h-full min-h-0">
      {/* Mini navegador lateral - Solo desktop */}
      {showMiniNav && (
        <div className="hidden md:flex md:flex-col md:h-fit md:gap-2 md:bg-white md:p-3 md:rounded-lg md:shadow-lg md:z-40 md:max-h-[70vh] md:overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-semibold text-[#283618]/70">
              {t("sectionsCount", { count: sections.length })}
            </div>
          </div>

          {sections.map((section, index) => (
            <button
              key={index}
              onClick={() => {
                scrollToSection(index);
              }}
              className={`
                ${isVertical ? "w-full" : "h-full"}
                px-2.5 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm transition-all text-left
                ${
                  activeSectionIndex === index
                    ? "bg-[#bc6c25] text-[#fefae0] font-semibold shadow-sm"
                    : "border border-[#bc6c25]/30 text-[#283618] hover:bg-[#bc6c25]/10 hover:border-[#bc6c25]"
                }
              `}
              aria-label={t("goToSection", { number: index + 1 })}
              aria-current={activeSectionIndex === index ? "true" : "false"}
            >
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="font-mono text-[10px] md:text-xs opacity-70">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="truncate text-xs md:text-sm">
                  {section.display_name || t("section", { number: index + 1 })}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Contenedor de scroll con todas las secciones */}
      <div
        ref={scrollContainerRef}
        data-export-scroll-container="true"
        className={`
          flex-1 w-full h-full min-h-0
          ${
            isVertical
              ? "overflow-y-auto max-h-[85vh] md:max-h-[80vh]"
              : "overflow-x-auto md:max-w-[80vw] overflow-y-hidden touch-pan-x snap-x snap-mandatory md:snap-none"
          }
          ${isVertical ? "flex-col" : "flex-row items-start"}
          flex ${spacingMap[spacing]} 
          p-2 md:p-4
          mx-2 md:mx-0
          my-10 md:my-0
          scrollbar-thin scrollbar-thumb-[#ffaf68] scrollbar-track-gray-100
        `}
      >
        {sections.map((section, sectionIndex) => {
          const pageCount = expandAllPages
            ? sectionPageCounts[sectionIndex] || 1
            : 1;

          const sharedPreviewProps = {
            data,
            selectedSectionIndex: sectionIndex,
            cardsMetadata,
            cardsMetadataLoading,
            resolvedSectionPageCounts: sectionPageCounts,
            onResolvedPageCount: (resolvedPageCount: number) =>
              handleResolvedPageCount(sectionIndex, resolvedPageCount),
          };

          return expandAllPages ? (
            // Modo expandido: SIEMPRE usar estructura multi-página para evitar
            // unmount/remount del TP[0] cuando el conteo cambia (causa flickering).
            // Con pageCount=1 inicial se renderiza 1 entrada; cuando sube a N se
            // agregan entradas sin desmontar la existente en pageIndex=0.
            <div
              key={sectionIndex}
              className={`flex gap-4 ${isVertical ? "flex-col" : ""}`}
              data-section-index={sectionIndex}
            >
              {Array.from({ length: pageCount }).map((_, pageIndex) => (
                <div
                  key={`${sectionIndex}-${pageIndex}`}
                  ref={(el) => {
                    if (pageIndex === 0) sectionRefs.current[sectionIndex] = el;
                  }}
                  data-section-index={sectionIndex}
                  data-page-index={pageIndex}
                  className={`
                    scroll-section shrink-0
                    ${isVertical ? "" : "snap-center md:snap-start"}
                    ${
                      highlightActive && activeSectionIndex === sectionIndex
                        ? "ring-2 md:ring-4 ring-[#ffaf68] ring-offset-2 md:ring-offset-4 rounded-lg"
                        : ""
                    }
                    transition-all duration-300
                  `}
                >
                  {showSectionTitle && (
                    <div className="mb-1.5 md:mb-2 px-1 md:px-2">
                      <h3 className="text-xs md:text-sm font-semibold text-[#283618]">
                        {section.display_name ||
                          t("section", { number: sectionIndex + 1 })}
                        {pageCount > 1 && (
                          <span className="text-xs ml-2 text-[#606c38]">
                            (
                            {t("page", {
                              current: pageIndex + 1,
                              total: pageCount,
                            })}
                            )
                          </span>
                        )}
                      </h3>
                    </div>
                  )}

                  {/* Preview de la página específica.
                      Solo pageIndex=0 reporta el conteo total para evitar
                      el bucle de feedback donde las páginas recién montadas
                      reportan 1 y colapsan el conteo. */}
                  {isMobileViewport && !isVertical ? (
                    <div
                      className="mx-auto"
                      style={{
                        width: `${bulletinWidth * mobilePreviewScale}px`,
                        height: `${bulletinHeight * mobilePreviewScale}px`,
                      }}
                    >
                      <div
                        style={{
                          width: `${bulletinWidth}px`,
                          height: `${bulletinHeight}px`,
                          transform: `scale(${mobilePreviewScale})`,
                          transformOrigin: "top left",
                        }}
                      >
                        <TemplatePreview
                          {...sharedPreviewProps}
                          renderForPrint={renderForPrint}
                          currentResolvedPageIndex={pageIndex}
                          hidePagination={true}
                          onResolvedPageCount={
                            pageIndex === 0
                              ? (resolvedPageCount: number) =>
                                  handleResolvedPageCount(
                                    sectionIndex,
                                    resolvedPageCount,
                                  )
                              : undefined
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <TemplatePreview
                      {...sharedPreviewProps}
                      renderForPrint={renderForPrint}
                      currentResolvedPageIndex={pageIndex}
                      hidePagination={true}
                      onResolvedPageCount={
                        pageIndex === 0
                          ? (resolvedPageCount: number) =>
                              handleResolvedPageCount(
                                sectionIndex,
                                resolvedPageCount,
                              )
                          : undefined
                      }
                    />
                  )}
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
              data-section-index={sectionIndex}
              data-page-index={0}
              className={`
                scroll-section shrink-0
                ${isVertical ? "" : "snap-center md:snap-start"}
                ${
                  highlightActive && activeSectionIndex === sectionIndex
                    ? "ring-2 md:ring-4 ring-[#ffaf68] ring-offset-2 md:ring-offset-4 rounded-lg"
                    : ""
                }
                transition-all duration-300
              `}
            >
              {showSectionTitle && (
                <div className="mb-1.5 md:mb-2 px-1 md:px-2">
                  <h3 className="text-xs md:text-sm font-semibold text-[#283618]">
                    {t("sectionNumber", { number: sectionIndex + 1 })}
                    {section.display_name && (
                      <span className="hidden md:inline">
                        : {section.display_name}
                      </span>
                    )}
                  </h3>
                </div>
              )}

              {/* Preview de la sección */}
              {isMobileViewport && !isVertical ? (
                <div
                  className="mx-auto"
                  style={{
                    width: `${bulletinWidth * mobilePreviewScale}px`,
                    height: `${bulletinHeight * mobilePreviewScale}px`,
                  }}
                >
                  <div
                    style={{
                      width: `${bulletinWidth}px`,
                      height: `${bulletinHeight}px`,
                      transform: `scale(${mobilePreviewScale})`,
                      transformOrigin: "top left",
                    }}
                  >
                    <TemplatePreview
                      {...sharedPreviewProps}
                      renderForPrint={renderForPrint}
                    />
                  </div>
                </div>
              ) : (
                <TemplatePreview
                  {...sharedPreviewProps}
                  renderForPrint={renderForPrint}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
