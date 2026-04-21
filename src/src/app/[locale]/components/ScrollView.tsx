"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ArrowDown, ArrowUp, GripVertical } from "lucide-react";
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
  sectionOrder?: number[];
  allowSectionReorder?: boolean;
  onSectionOrderChange?: (order: number[]) => void;
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
  sectionOrder,
  allowSectionReorder = false,
  onSectionOrderChange,
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
  const orderedSectionIndexes = useMemo(() => {
    const naturalOrder = sections.map((_, index) => index);

    if (!sectionOrder || sectionOrder.length === 0) {
      return naturalOrder;
    }

    const validUniqueOrder = sectionOrder.filter(
      (index, position) =>
        index >= 0 &&
        index < sections.length &&
        sectionOrder.indexOf(index) === position,
    );

    const missingIndexes = naturalOrder.filter(
      (index) => !validUniqueOrder.includes(index),
    );

    return [...validUniqueOrder, ...missingIndexes];
  }, [sectionOrder, sections]);
  const [activeSectionIndex, setActiveSectionIndex] = useState(initialSection);
  const [sectionPageCounts, setSectionPageCounts] = useState<number[]>(() =>
    sections.map(() => 1),
  );
  const [draggedOrderIndex, setDraggedOrderIndex] = useState<number | null>(
    null,
  );
  const [dragOverOrderIndex, setDragOverOrderIndex] = useState<number | null>(
    null,
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

  const moveSectionInOrder = (fromIndex: number, toIndex: number) => {
    if (
      !allowSectionReorder ||
      !onSectionOrderChange ||
      fromIndex === toIndex ||
      toIndex < 0 ||
      toIndex >= orderedSectionIndexes.length
    ) {
      return;
    }

    const nextOrder = [...orderedSectionIndexes];
    const [movedSection] = nextOrder.splice(fromIndex, 1);
    nextOrder.splice(toIndex, 0, movedSection);
    onSectionOrderChange(nextOrder);
  };

  const handleResetSectionOrder = () => {
    if (!allowSectionReorder || !onSectionOrderChange) {
      return;
    }

    onSectionOrderChange(sections.map((_, index) => index));
  };

  const handleSectionDragStart = (
    orderIndex: number,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    if (!allowSectionReorder || !onSectionOrderChange) return;

    setDraggedOrderIndex(orderIndex);
    setDragOverOrderIndex(orderIndex);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", String(orderIndex));
  };

  const handleSectionDragOver = (
    orderIndex: number,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    if (!allowSectionReorder || draggedOrderIndex === null) {
      return;
    }

    event.preventDefault();
    event.dataTransfer.dropEffect = "move";

    if (dragOverOrderIndex !== orderIndex) {
      setDragOverOrderIndex(orderIndex);
    }
  };

  const handleSectionDrop = (
    orderIndex: number,
    event: React.DragEvent<HTMLDivElement>,
  ) => {
    event.preventDefault();

    if (!allowSectionReorder || !onSectionOrderChange) {
      return;
    }

    const transferValue = Number.parseInt(
      event.dataTransfer.getData("text/plain"),
      10,
    );
    const fromIndex =
      draggedOrderIndex !== null && draggedOrderIndex >= 0
        ? draggedOrderIndex
        : transferValue;

    if (Number.isNaN(fromIndex) || fromIndex < 0) {
      setDraggedOrderIndex(null);
      setDragOverOrderIndex(null);
      return;
    }

    moveSectionInOrder(fromIndex, orderIndex);
    setDraggedOrderIndex(null);
    setDragOverOrderIndex(null);
  };

  const handleSectionDragEnd = () => {
    setDraggedOrderIndex(null);
    setDragOverOrderIndex(null);
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

          {allowSectionReorder && onSectionOrderChange && (
            <button
              onClick={handleResetSectionOrder}
              className="text-xs text-[#bc6c25] hover:text-[#a55a1f] text-left"
            >
              {t("resetOrder")}
            </button>
          )}

          {allowSectionReorder && onSectionOrderChange && (
            <p className="text-[11px] text-[#283618]/55 leading-tight mb-1">
              {t("reorderHint")}
            </p>
          )}

          {orderedSectionIndexes.map((sectionIndex, orderIndex) => {
            const section = sections[sectionIndex];
            const canMoveUp = orderIndex > 0;
            const canMoveDown = orderIndex < orderedSectionIndexes.length - 1;

            return (
              <div
                key={`${sectionIndex}-${orderIndex}`}
                draggable={allowSectionReorder && Boolean(onSectionOrderChange)}
                onDragStart={(event) =>
                  handleSectionDragStart(orderIndex, event)
                }
                onDragOver={(event) => handleSectionDragOver(orderIndex, event)}
                onDrop={(event) => handleSectionDrop(orderIndex, event)}
                onDragEnd={handleSectionDragEnd}
                className={`rounded transition-colors ${
                  dragOverOrderIndex === orderIndex &&
                  draggedOrderIndex !== orderIndex
                    ? "bg-[#bc6c25]/10"
                    : ""
                }`}
              >
                <div className="w-full flex items-center gap-1">
                  {allowSectionReorder && onSectionOrderChange && (
                    <span className="opacity-45 px-1 cursor-grab">
                      <GripVertical className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <button
                    onClick={() => {
                      scrollToSection(orderIndex);
                    }}
                    className={`
                      flex-1 min-w-0 w-full
                      px-2.5 md:px-3 py-1.5 md:py-2 rounded text-xs md:text-sm transition-all text-left
                      ${
                        activeSectionIndex === orderIndex
                          ? "bg-[#bc6c25] text-[#fefae0] font-semibold shadow-sm"
                          : "border border-[#bc6c25]/30 text-[#283618] hover:bg-[#bc6c25]/10 hover:border-[#bc6c25]"
                      }
                    `}
                    aria-label={t("goToSection", { number: orderIndex + 1 })}
                    aria-current={
                      activeSectionIndex === orderIndex ? "true" : "false"
                    }
                  >
                    <div className="w-full flex items-center gap-1.5 md:gap-2">
                      <span className="font-mono text-[10px] md:text-xs opacity-70">
                        {String(orderIndex + 1).padStart(2, "0")}
                      </span>
                      <span className="flex-1 min-w-0 truncate text-xs md:text-sm">
                        {section?.display_name ||
                          t("section", { number: orderIndex + 1 })}
                      </span>
                    </div>
                  </button>

                  {allowSectionReorder && onSectionOrderChange && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          moveSectionInOrder(orderIndex, orderIndex - 1);
                        }}
                        disabled={!canMoveUp}
                        className="p-1 rounded border border-[#bc6c25]/40 hover:bg-[#bc6c25]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={t("moveUp")}
                        title={t("moveUp")}
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          moveSectionInOrder(orderIndex, orderIndex + 1);
                        }}
                        disabled={!canMoveDown}
                        className="p-1 rounded border border-[#bc6c25]/40 hover:bg-[#bc6c25]/10 disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label={t("moveDown")}
                        title={t("moveDown")}
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
        {orderedSectionIndexes.map((sectionIndex, orderIndex) => {
          const section = sections[sectionIndex];
          const pageCount = expandAllPages
            ? sectionPageCounts[sectionIndex] || 1
            : 1;

          const sharedPreviewProps = {
            data,
            selectedSectionIndex: sectionIndex,
            sectionOrder: orderedSectionIndexes,
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
              key={`${sectionIndex}-${orderIndex}`}
              className={`flex gap-4 ${isVertical ? "flex-col" : ""}`}
              data-section-index={sectionIndex}
            >
              {Array.from({ length: pageCount }).map((_, pageIndex) => (
                <div
                  key={`${sectionIndex}-${pageIndex}`}
                  ref={(el) => {
                    if (pageIndex === 0) sectionRefs.current[orderIndex] = el;
                  }}
                  data-section-index={sectionIndex}
                  data-page-index={pageIndex}
                  className={`
                    scroll-section shrink-0
                    ${isVertical ? "" : "snap-center md:snap-start"}
                    ${
                      highlightActive && activeSectionIndex === orderIndex
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
                          t("section", { number: orderIndex + 1 })}
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
              key={`${sectionIndex}-${orderIndex}`}
              ref={(el) => {
                sectionRefs.current[orderIndex] = el;
              }}
              data-section-index={sectionIndex}
              data-page-index={0}
              className={`
                scroll-section shrink-0
                ${isVertical ? "" : "snap-center md:snap-start"}
                ${
                  highlightActive && activeSectionIndex === orderIndex
                    ? "ring-2 md:ring-4 ring-[#ffaf68] ring-offset-2 md:ring-offset-4 rounded-lg"
                    : ""
                }
                transition-all duration-300
              `}
            >
              {showSectionTitle && (
                <div className="mb-1.5 md:mb-2 px-1 md:px-2">
                  <h3 className="text-xs md:text-sm font-semibold text-[#283618]">
                    {t("sectionNumber", { number: orderIndex + 1 })}
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
