import React, { useRef, useState, useEffect } from "react";
import { CreateTemplateData } from "@/types/template";
import { EditorSelection, CanvasState } from "./types";
import { TemplatePreview } from "../TemplatePreview";
import * as ui from "../../../components/ui";
import { useTranslations } from "next-intl";
import { Layers, GripVertical } from "lucide-react";

interface CanvasProps {
  data: CreateTemplateData;
  selection: EditorSelection;
  onSelect: (selection: EditorSelection, rect?: DOMRect) => void;
  onUpdateSection?: any;
  onUpdate?: any;
  onAddSection?: () => void;
  onMoveSection?: (fromIndex: number, toIndex: number) => void;
  globalStyleConfig?: any;
  sections?: any;
  isCardMode?: boolean;
  onCanvasChange?: () => void;
  commentCounts?: Record<string, number>;
  renderAllPagesInReview?: boolean;
}

const normalizeCardFieldValue = (value: unknown): any[] => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined || value === "") {
    return [];
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    const tryParseArrayLikeString = (candidate: string): any[] | null => {
      const looksLikeJson =
        (candidate.startsWith("{") && candidate.endsWith("}")) ||
        (candidate.startsWith("[") && candidate.endsWith("]"));

      if (!looksLikeJson) {
        return null;
      }

      try {
        const parsed = JSON.parse(candidate);
        return Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return null;
      }
    };

    const directParsed = tryParseArrayLikeString(trimmed);
    if (directParsed) {
      return directParsed;
    }

    try {
      const decodedValue = decodeURIComponent(trimmed);
      if (decodedValue !== trimmed) {
        const decodedParsed = tryParseArrayLikeString(decodedValue);
        if (decodedParsed) {
          return decodedParsed;
        }
      }
    } catch {
      // Ignore malformed URI component values and keep raw value fallback.
    }

    return [trimmed];
  }

  if (typeof value === "object") {
    const valueObject = value as Record<string, any>;

    if (Array.isArray(valueObject.selectedCards)) {
      return valueObject.selectedCards;
    }

    if (Array.isArray(valueObject.selected_cards)) {
      return valueObject.selected_cards;
    }

    if (Array.isArray(valueObject.cards)) {
      return valueObject.cards;
    }

    return [valueObject];
  }

  return [value];
};

const getSectionTotalPagesForReview = (
  section: CreateTemplateData["version"]["content"]["sections"][number],
): number => {
  let totalPages = 1;

  section.blocks?.forEach((block) => {
    block.fields?.forEach((field) => {
      if (!field.bulletin) {
        return;
      }

      if (field.type === "list") {
        const rawMax = (field.field_config as any)?.max_items_per_page;
        const maxItemsPerPage = rawMax ? Number(rawMax) : 0;
        const items = Array.isArray(field.value) ? field.value : [];

        if (items.length > 0 && maxItemsPerPage > 0) {
          totalPages = Math.max(
            totalPages,
            Math.ceil(items.length / maxItemsPerPage),
          );
        }
      }

      if (field.type === "card") {
        const cards = normalizeCardFieldValue(field.value);
        if (cards.length > 1) {
          totalPages = Math.max(totalPages, cards.length);
        }
      }
    });
  });

  return totalPages;
};

export const Canvas: React.FC<CanvasProps> = ({
  data,
  selection,
  onSelect,
  onAddSection,
  onMoveSection,
  isCardMode = false,
  onCanvasChange,
  commentCounts,
  renderAllPagesInReview = false,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor");
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    // ... existing code ...

    scale: 1,
    position: { x: 0, y: 0 },
  });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
  const [draggedSectionIndex, setDraggedSectionIndex] = useState<number | null>(
    null,
  );
  const [dragOverSectionIndex, setDragOverSectionIndex] = useState<
    number | null
  >(null);
  const [resolvedReviewPageCounts, setResolvedReviewPageCounts] = useState<
    Record<number, number>
  >({});
  const spacePressed = useRef(false);
  const reviewSectionsResetKey = data.version.content.sections
    .map((section) => section.section_id || "")
    .join("|");

  const sectionPageCounts = data.version.content.sections.map(
    (section, sectionIndex) => {
      if (!renderAllPagesInReview) {
        return 1;
      }

      const estimatedCount = getSectionTotalPagesForReview(section);
      const resolvedCount = resolvedReviewPageCounts[sectionIndex] || 0;

      return Math.max(estimatedCount, resolvedCount, 1);
    },
  );

  useEffect(() => {
    if (!renderAllPagesInReview) {
      return;
    }

    setResolvedReviewPageCounts({});
  }, [renderAllPagesInReview, reviewSectionsResetKey]);

  useEffect(() => {
    if (onCanvasChange) {
      onCanvasChange();
    }
  }, [canvasState, onCanvasChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (e.code === "Space" && !e.repeat && !isInput) {
        spacePressed.current = true;
        // Update cursor if needed, but CSS "active" state handles drag
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") spacePressed.current = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Handle Wheel with non-passive listener to prevent browser zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheelNative = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const zoomSensitivity = 0.001;

        setCanvasState((prev) => {
          const newScale = Math.min(
            Math.max(0.1, prev.scale - e.deltaY * zoomSensitivity),
            5,
          );
          return {
            ...prev,
            scale: newScale,
          };
        });
      } else {
        // Pan
        // Prevent default browser history navigation or scrolling
        e.preventDefault();

        setCanvasState((prev) => ({
          ...prev,
          position: {
            x: prev.position.x - e.deltaX,
            y: prev.position.y - e.deltaY,
          },
        }));
      }
    };

    container.addEventListener("wheel", handleWheelNative, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheelNative);
    };
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Enable dragging on space key hold or middle mouse button
    const isMiddleClick = e.button === 1;
    // Space check is done via ref

    // Also allow dragging if clicking on empty areas (the container itself or background divs)
    // We check if the target is NOT an interactive element (input, button, or specific react components we marked)
    const target = e.target as HTMLElement;
    const isInteractive =
      target.closest("button") ||
      target.closest("input") ||
      target.closest(".interactive-element");

    if (!isInteractive || isMiddleClick || spacePressed.current) {
      setIsDragging(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      e.preventDefault(); // Always prevent default (text selection) when panning
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;

      setCanvasState((prev) => ({
        ...prev,
        position: {
          x: prev.position.x + dx,
          y: prev.position.y + dy,
        },
      }));
      setLastMousePos({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleSectionDragStart = (
    e: React.DragEvent<HTMLButtonElement>,
    sectionIndex: number,
  ) => {
    if (!onMoveSection) {
      return;
    }

    e.stopPropagation();
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(sectionIndex));
    setDraggedSectionIndex(sectionIndex);
    setDragOverSectionIndex(sectionIndex);
  };

  const handleSectionDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    sectionIndex: number,
  ) => {
    if (draggedSectionIndex === null || !onMoveSection) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (dragOverSectionIndex !== sectionIndex) {
      setDragOverSectionIndex(sectionIndex);
    }
  };

  const handleSectionDrop = (
    e: React.DragEvent<HTMLDivElement>,
    sectionIndex: number,
  ) => {
    if (draggedSectionIndex === null || !onMoveSection) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    if (draggedSectionIndex !== sectionIndex) {
      onMoveSection(draggedSectionIndex, sectionIndex);
    }

    setDraggedSectionIndex(null);
    setDragOverSectionIndex(null);
  };

  const handleSectionDragEnd = () => {
    setDraggedSectionIndex(null);
    setDragOverSectionIndex(null);
  };

  // Center canvas initially
  useEffect(() => {
    // Reset to a safe known "good" position where checking top-left is guaranteed to show content
    // We start at x=100, y=50 to give some breathing room but ensure first section is visible
    setCanvasState({
      scale: 0.8,
      position: { x: 100, y: 50 },
    });
  }, []);

  const handleElementClick = (
    type:
      | "section"
      | "block"
      | "field"
      | "header"
      | "footer"
      | "header_field"
      | "footer_field",
    id: string,
    e: React.MouseEvent,
  ) => {
    e.stopPropagation();

    // Helper to call onSelect with rect
    const select = (selection: EditorSelection) => {
      onSelect(selection, e.currentTarget.getBoundingClientRect());
    };

    // Header Global Container
    if (id === "header-global") {
      select({
        type: "header",
        id: id,
        sectionIndex: -1, // Global
      });
      return;
    }

    // Header Global Field
    const headerGlobalFieldMatch = id.match(/^header-global-(\d+)$/);
    if (headerGlobalFieldMatch) {
      select({
        type: "header_field",
        id: id,
        sectionIndex: -1,
        fieldIndex: parseInt(headerGlobalFieldMatch[1]),
      });
      return;
    }

    // Header Section Field (Priority: check this first because it matches header-(\d+) prefix logic if not careful, but regex is strict)
    const headerFieldMatch = id.match(/^header-(\d+)-(\d+)$/);
    if (headerFieldMatch) {
      select({
        type: "header_field",
        id: id,
        sectionIndex: parseInt(headerFieldMatch[1]),
        fieldIndex: parseInt(headerFieldMatch[2]),
      });
      return;
    }

    // Header Section Container
    const headerSectionMatch = id.match(/^header-(\d+)$/);
    if (headerSectionMatch) {
      select({
        type: "header",
        id: id,
        sectionIndex: parseInt(headerSectionMatch[1]),
      });
      return;
    }

    // Footer Global Container
    if (id === "footer-global") {
      select({
        type: "footer",
        id: id,
        sectionIndex: -1, // Global
      });
      return;
    }

    // Footer Global Field
    const footerGlobalFieldMatch = id.match(/^footer-global-(\d+)$/);
    if (footerGlobalFieldMatch) {
      select({
        type: "footer_field",
        id: id,
        sectionIndex: -1,
        fieldIndex: parseInt(footerGlobalFieldMatch[1]),
      });
      return;
    }

    // Footer Section Field
    const footerFieldMatch = id.match(/^footer-(\d+)-(\d+)$/);
    if (footerFieldMatch) {
      select({
        type: "footer_field",
        id: id,
        sectionIndex: parseInt(footerFieldMatch[1]),
        fieldIndex: parseInt(footerFieldMatch[2]),
      });
      return;
    }

    // Footer Section Container
    const footerSectionMatch = id.match(/^footer-(\d+)$/);
    if (footerSectionMatch) {
      select({
        type: "footer",
        id: id,
        sectionIndex: parseInt(footerSectionMatch[1]),
      });
      return;
    }

    // Pattern checks for generated IDs
    const fieldSubmatch = id.match(/^field-(\d+)-(\d+)-(\d+)-subfield-(.+)$/);
    if (fieldSubmatch) {
      select({
        type: "field",
        id: id,
        sectionIndex: parseInt(fieldSubmatch[1]),
        blockIndex: parseInt(fieldSubmatch[2]),
        fieldIndex: parseInt(fieldSubmatch[3]),
        schemaKey: fieldSubmatch[4],
      });
      return;
    }

    const fieldMatch = id.match(/^field-(\d+)-(\d+)-(\d+)$/);
    if (fieldMatch) {
      select({
        type: "field",
        id: id,
        sectionIndex: parseInt(fieldMatch[1]),
        blockIndex: parseInt(fieldMatch[2]),
        fieldIndex: parseInt(fieldMatch[3]),
        schemaKey: undefined, // Explicitly clear schemaKey
      });
      return;
    }

    const blockMatch = id.match(/^block-(\d+)-(\d+)$/);
    if (blockMatch) {
      select({
        type: "block",
        id: id,
        sectionIndex: parseInt(blockMatch[1]),
        blockIndex: parseInt(blockMatch[2]),
      });
      return;
    }

    const sectionMatch = id.match(/^section-(\d+)$/);
    if (sectionMatch) {
      select({
        type: "section",
        id: id,
        sectionIndex: parseInt(sectionMatch[1]),
      });
      return;
    }

    // Fallback: search by ID in data
    const sections = data?.version?.content?.sections || [];
    for (let sIdx = 0; sIdx < sections.length; sIdx++) {
      const section = sections[sIdx];
      if (section.section_id === id || (section as any)._id === id) {
        select({ type: "section", id, sectionIndex: sIdx });
        return;
      }

      for (let bIdx = 0; bIdx < section.blocks.length; bIdx++) {
        const block = section.blocks[bIdx];
        if (block.block_id === id || (block as any)._id === id) {
          select({ type: "block", id, sectionIndex: sIdx, blockIndex: bIdx });
          return;
        }

        if (block.fields) {
          for (let fIdx = 0; fIdx < block.fields.length; fIdx++) {
            const field = block.fields[fIdx];
            if (field.field_id === id || (field as any)._id === id) {
              select({
                type: "field",
                id,
                sectionIndex: sIdx,
                blockIndex: bIdx,
                fieldIndex: fIdx,
              });
              return;
            }
          }
        }
      }
    }

    console.warn("Element ID not found in mapping:", id);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-hidden bg-[#e5e5e5] relative cursor-grab select-none canvas-bg"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ touchAction: "none", cursor: isDragging ? "grabbing" : "grab" }}
    >
      {/* Infinite Grid Background Effect */}
      <div
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: "radial-gradient(circle, #000 1px, transparent 1px)",
          backgroundSize: `${20 * canvasState.scale}px ${20 * canvasState.scale}px`,
          backgroundPosition: `${canvasState.position.x}px ${canvasState.position.y}px`,
        }}
      />

      <div
        style={{
          transform: `translate(${canvasState.position.x}px, ${canvasState.position.y}px) scale(${canvasState.scale})`,
          transformOrigin: "0 0",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
        className="w-auto h-auto min-w-full min-h-full p-20 origin-top-left"
      >
        <div className="flex gap-8 origin-top-left">
          {!data.version.content.sections ||
          data.version.content.sections.length === 0 ? (
            <div className="w-max bg-white shadow-xl">
              <TemplatePreview
                data={data}
                reviewMode={true}
                onElementClick={handleElementClick}
                selectedSectionIndex={0}
                selectedElementId={selection.id}
                commentCounts={commentCounts}
              />
            </div>
          ) : (
            data.version.content.sections.map((section, index) => (
              <div
                key={index}
                id={`template-section-${index}`}
                className={`relative group-section transition-all ${
                  draggedSectionIndex === index ? "opacity-60" : ""
                } ${
                  dragOverSectionIndex === index &&
                  draggedSectionIndex !== null &&
                  draggedSectionIndex !== index
                    ? "ring-2 ring-[#bc6c25] ring-offset-4"
                    : ""
                }`}
                onDragOver={(e) => handleSectionDragOver(e, index)}
                onDrop={(e) => handleSectionDrop(e, index)}
              >
                {/* Selection Indicator */}
                {selection.type === "section" &&
                  selection.sectionIndex === index && (
                    <div className="absolute -inset-2 border-2 border-blue-500 rounded-lg pointer-events-none z-10" />
                  )}

                <div className="flex flex-col gap-6">
                  {Array.from(
                    {
                      length: sectionPageCounts[index] || 1,
                    },
                    (_, pageIndex) => (
                      <div
                        key={`section-${index}-page-${pageIndex}`}
                        className="w-max bg-white shadow-xl"
                      >
                        <TemplatePreview
                          data={data}
                          reviewMode={true}
                          onElementClick={handleElementClick}
                          selectedSectionIndex={index}
                          currentResolvedPageIndex={
                            renderAllPagesInReview ? pageIndex : undefined
                          }
                          hidePagination={true}
                          selectedElementId={selection.id}
                          commentCounts={commentCounts}
                          resolvedSectionPageCounts={sectionPageCounts}
                          onResolvedPageCount={
                            renderAllPagesInReview && pageIndex === 0
                              ? (pageCount) => {
                                  const normalizedPageCount = Number.isFinite(
                                    pageCount,
                                  )
                                    ? Math.max(Math.floor(pageCount), 1)
                                    : 1;

                                  setResolvedReviewPageCounts(
                                    (previousCounts) => {
                                      if (
                                        previousCounts[index] ===
                                        normalizedPageCount
                                      ) {
                                        return previousCounts;
                                      }

                                      return {
                                        ...previousCounts,
                                        [index]: normalizedPageCount,
                                      };
                                    },
                                  );
                                }
                              : undefined
                          }
                        />
                      </div>
                    ),
                  )}
                </div>

                <div className="absolute -top-10 left-0 flex items-center gap-2">
                  {onMoveSection && (
                    <button
                      type="button"
                      draggable
                      title={t("editor.dragToReorder")}
                      aria-label={t("editor.dragToReorder")}
                      className="interactive-element inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:border-[#bc6c25] hover:text-[#bc6c25] cursor-grab active:cursor-grabbing"
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      onDragStart={(e) => handleSectionDragStart(e, index)}
                      onDragEnd={handleSectionDragEnd}
                    >
                      <GripVertical size={14} />
                    </button>
                  )}

                  <div
                    className="text-sm font-bold text-gray-500 cursor-pointer hover:text-blue-600 hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect({
                        type: "section",
                        id: section.section_id || null,
                        sectionIndex: index,
                      });
                    }}
                  >
                    {section.display_name ||
                      `${t("editor.selectionTypes.section")} ${index + 1}`}
                  </div>

                  {section.blocks.some((block) =>
                    block.fields.some((field) => field.type === "card"),
                  ) && (
                    <div className="interactive-element relative inline-flex items-center group">
                      <button
                        type="button"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#bc6c25] bg-[#bc6c25]/10 text-[#bc6c25] cursor-help outline-none transition-colors hover:bg-[#bc6c25]/20 focus-visible:ring-2 focus-visible:ring-[#bc6c25]/40"
                        aria-label={t("editor.sectionHasCardsTooltip")}
                        aria-describedby={`section-card-tooltip-${index}`}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Layers size={16} />
                      </button>

                      <div
                        id={`section-card-tooltip-${index}`}
                        role="tooltip"
                        className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 text-sm shadow-xl opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                      >
                        <p className="text-[#283618] leading-snug">
                          {t("editor.sectionHasCardsTooltip")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Add Section Button */}
          {!isCardMode && onAddSection && (
            <div className="flex items-center min-h-[600px] px-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAddSection();
                }}
                className={`${ui.btnPrimary} whitespace-nowrap shadow-lg`}
              >
                {t("editor.addSection")}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Zoom Controls Overlay */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2 flex gap-2">
        <button
          onClick={() =>
            setCanvasState((s) => ({ ...s, scale: s.scale - 0.1 }))
          }
          className="px-2 hover:bg-gray-100 rounded"
        >
          -
        </button>
        <span className="text-sm w-12 text-center">
          {Math.round(canvasState.scale * 100)}%
        </span>
        <button
          onClick={() =>
            setCanvasState((s) => ({ ...s, scale: s.scale + 0.1 }))
          }
          className="px-2 hover:bg-gray-100 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
};
