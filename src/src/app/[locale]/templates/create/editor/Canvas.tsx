import React, { useRef, useState, useEffect, useCallback } from "react";
import { CreateTemplateData } from "@/types/template";
import { EditorSelection, CanvasState } from "./types";
import { UnifiedBulletinPreview } from "@/app/[locale]/components/UnifiedBulletinPreview";
import * as ui from "../../../components/ui";
import { useTranslations } from "next-intl";
import { Layers, GripVertical, Move, ZoomIn, X } from "lucide-react";

type CanvasInteractionMode = "edit" | "review";

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
  interactionMode?: CanvasInteractionMode;
  renderAllPages?: boolean;
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
  interactionMode = "edit",
  renderAllPages = false,
}) => {
  const isReviewInteraction = interactionMode === "review";
  const shouldRenderAllPages = renderAllPages;
  const t = useTranslations("CreateTemplate.fieldEditor");
  const containerRef = useRef<HTMLDivElement>(null);
  const transformLayerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const introHasRunRef = useRef(false);
  const introCancelledRef = useRef(false);
  const introTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const hintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [canvasState, setCanvasState] = useState<CanvasState>({
    scale: 1,
    position: { x: 0, y: 0 },
  });
  const [introPhase, setIntroPhase] = useState<"overview" | "focus" | "idle">(
    "overview",
  );
  const [isCanvasVisible, setIsCanvasVisible] = useState(false);
  const [showNavigationHint, setShowNavigationHint] = useState(false);
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
  const paginationResetKey = JSON.stringify({
    bulletinHeight: data.version.content.style_config?.bulletin_height,

    sections: data.version.content.sections.map((section) => ({
      sectionId: section.section_id,
      styleConfig: section.style_config,
      headerConfig: section.header_config,
      footerConfig: section.footer_config,

      blocks: section.blocks?.map((block) => ({
        blockId: block.block_id,
        styleConfig: block.style_config,

        fields: block.fields?.map((field) => ({
          fieldId: field.field_id,
          type: field.type,
          bulletin: field.bulletin,
          value: field.value,
          styleConfig: field.style_config,

          maxItemsPerPage: (field.field_config as any)?.max_items_per_page,
        })),
      })),
    })),
  });

  const sectionPageCounts = data.version.content.sections.map(
    (section, sectionIndex) => {
      if (!shouldRenderAllPages) {
        return 1;
      }
      const estimatedCount = getSectionTotalPagesForReview(section);
      const resolvedCount = resolvedReviewPageCounts[sectionIndex] || 0;

      return Math.max(estimatedCount, resolvedCount, 1);
    },
  );

  useEffect(() => {
    if (!shouldRenderAllPages) {
      return;
    }

    setResolvedReviewPageCounts({});
  }, [shouldRenderAllPages, paginationResetKey]);

  useEffect(() => {
    if (onCanvasChange) {
      onCanvasChange();
    }
  }, [canvasState, onCanvasChange]);

  const clearIntroTimers = useCallback(() => {
    introTimersRef.current.forEach((timer) => clearTimeout(timer));
    introTimersRef.current = [];
  }, []);

  const cancelIntroAnimation = useCallback(() => {
    introCancelledRef.current = true;
    clearIntroTimers();
    setIntroPhase("idle");
    setIsCanvasVisible(true);
  }, [clearIntroTimers]);

  const getElementBounds = useCallback((element: HTMLElement) => {
    const transformLayer = transformLayerRef.current;

    if (!transformLayer) {
      return null;
    }

    let x = 0;
    let y = 0;
    let currentElement: HTMLElement | null = element;

    while (currentElement && currentElement !== transformLayer) {
      x += currentElement.offsetLeft;
      y += currentElement.offsetTop;
      currentElement = currentElement.offsetParent as HTMLElement | null;
    }

    if (currentElement !== transformLayer) {
      return null;
    }

    return {
      x,
      y,
      width: Math.max(element.offsetWidth, 1),
      height: Math.max(element.offsetHeight, 1),
    };
  }, []);

  const getCombinedBounds = useCallback(
    (elements: HTMLElement[]) => {
      const bounds = elements
        .map((element) => getElementBounds(element))
        .filter(
          (
            value,
          ): value is {
            x: number;
            y: number;
            width: number;
            height: number;
          } => Boolean(value),
        );

      if (bounds.length === 0) {
        return null;
      }

      const left = Math.min(...bounds.map((item) => item.x));
      const top = Math.min(...bounds.map((item) => item.y));
      const right = Math.max(...bounds.map((item) => item.x + item.width));
      const bottom = Math.max(...bounds.map((item) => item.y + item.height));

      return {
        x: left,
        y: top,
        width: Math.max(right - left, 1),
        height: Math.max(bottom - top, 1),
      };
    },
    [getElementBounds],
  );

  const createCenteredCanvasState = useCallback(
    (
      bounds: { x: number; y: number; width: number; height: number },
      padding: number,
      maxScale: number,
    ): CanvasState | null => {
      const container = containerRef.current;

      if (!container) {
        return null;
      }

      const viewportWidth = container.clientWidth;
      const viewportHeight = container.clientHeight;

      if (viewportWidth <= 0 || viewportHeight <= 0) {
        return null;
      }

      const availableWidth = Math.max(viewportWidth - padding * 2, 1);
      const availableHeight = Math.max(viewportHeight - padding * 2, 1);
      const fittedScale = Math.min(
        availableWidth / bounds.width,
        availableHeight / bounds.height,
        maxScale,
      );
      const scale = Math.min(Math.max(fittedScale, 0.1), 5);

      return {
        scale,
        position: {
          x: (viewportWidth - bounds.width * scale) / 2 - bounds.x * scale,
          y: (viewportHeight - bounds.height * scale) / 2 - bounds.y * scale,
        },
      };
    },
    [],
  );

  const getOverviewCanvasState = useCallback((): CanvasState | null => {
    const content = contentRef.current;

    if (!content) {
      return null;
    }

    const sectionElements = Array.from(
      content.querySelectorAll<HTMLElement>("[id^='template-section-']"),
    ).filter((element) => /^template-section-\d+$/.test(element.id));

    const targetElements =
      sectionElements.length > 0 ? sectionElements : [content];
    const bounds = getCombinedBounds(targetElements);

    if (!bounds) {
      return null;
    }

    // Include the section title/actions that sit above each section.
    const boundsWithLabels = {
      ...bounds,
      y: bounds.y - 48,
      height: bounds.height + 48,
    };

    return createCenteredCanvasState(boundsWithLabels, 52, 0.65);
  }, [createCenteredCanvasState, getCombinedBounds]);

  const getFirstSectionCanvasState = useCallback((): CanvasState | null => {
    const content = contentRef.current;

    if (!content) {
      return null;
    }

    const firstPage = content.querySelector<HTMLElement>(
      "#template-section-0-page-0",
    );
    const firstSection = content.querySelector<HTMLElement>(
      "#template-section-0",
    );
    const target = firstPage || firstSection || content;
    const bounds = getElementBounds(target);

    if (!bounds) {
      return null;
    }

    return createCenteredCanvasState(bounds, 64, 0.95);
  }, [createCenteredCanvasState, getElementBounds]);

  useEffect(() => {
    if (introHasRunRef.current) {
      return;
    }

    introCancelledRef.current = false;

    const content = contentRef.current;
    let resizeObserver: ResizeObserver | null = null;
    let stableLayoutTimer: ReturnType<typeof setTimeout> | null = null;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const startIntro = () => {
      if (introHasRunRef.current || introCancelledRef.current) {
        return;
      }

      const overviewState = getOverviewCanvasState();

      if (!overviewState) {
        return;
      }

      introHasRunRef.current = true;
      resizeObserver?.disconnect();

      setIntroPhase("overview");
      setCanvasState(overviewState);
      setIsCanvasVisible(true);
      setShowNavigationHint(true);

      const focusTimer = setTimeout(() => {
        if (introCancelledRef.current) {
          return;
        }

        const firstSectionState = getFirstSectionCanvasState();

        if (firstSectionState) {
          setIntroPhase("focus");
          setCanvasState(firstSectionState);
        }
      }, 1000);

      const finishTimer = setTimeout(() => {
        if (!introCancelledRef.current) {
          setIntroPhase("idle");
        }
      }, 2000);

      introTimersRef.current = [focusTimer, finishTimer];

      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }

      hintTimerRef.current = setTimeout(() => {
        setShowNavigationHint(false);
      }, 7000);
    };

    const scheduleIntro = () => {
      if (stableLayoutTimer) {
        clearTimeout(stableLayoutTimer);
      }

      stableLayoutTimer = setTimeout(startIntro, 260);
    };

    if (content && typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(scheduleIntro);
      resizeObserver.observe(content);

      if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
      }
    }

    scheduleIntro();
    fallbackTimer = setTimeout(startIntro, 1000);

    return () => {
      resizeObserver?.disconnect();

      if (stableLayoutTimer) {
        clearTimeout(stableLayoutTimer);
      }

      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
    };
  }, [getFirstSectionCanvasState, getOverviewCanvasState]);

  useEffect(() => {
    return () => {
      clearIntroTimers();

      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
    };
  }, [clearIntroTimers]);

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
      cancelIntroAnimation();

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
  }, [cancelIntroAnimation]);

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

  const handleElementClick = (
    type:
      | "section"
      | "block"
      | "field"
      | "list_item"
      | "list_item_field"
      | "card_item"
      | "card_block"
      | "card_field"
      | "header"
      | "footer"
      | "header_field"
      | "footer_field",
    id: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation();

    const clickedElement = event.currentTarget as HTMLElement;

    const reviewLabel = clickedElement.dataset.reviewLabel;

    const cardElement = clickedElement.closest<HTMLElement>("[data-card-id]");

    const cardBlockElement = clickedElement.closest<HTMLElement>(
      "[data-card-block-id]",
    );

    const cardFieldElement = clickedElement.closest<HTMLElement>(
      "[data-card-field-id]",
    );

    const select = (selection: EditorSelection) => {
      onSelect(selection, event.currentTarget.getBoundingClientRect());
    };

    if (interactionMode === "edit") {
      const nestedCardMatch = id.match(/^field-(\d+)-(\d+)-(\d+)-card-/);

      if (nestedCardMatch) {
        const sectionIndex = Number(nestedCardMatch[1]);
        const blockIndex = Number(nestedCardMatch[2]);
        const fieldIndex = Number(nestedCardMatch[3]);

        select({
          type: "field",
          id: `field-${sectionIndex}` + `-${blockIndex}` + `-${fieldIndex}`,
          sectionIndex,
          blockIndex,
          fieldIndex,
          schemaKey: undefined,
        });

        return;
      }
      const listSubfieldMatch = id.match(
        /^field-(\d+)-(\d+)-(\d+)-item-(\d+)-subfield-(.+)$/,
      );

      if (listSubfieldMatch) {
        const sectionIndex = Number(listSubfieldMatch[1]);
        const blockIndex = Number(listSubfieldMatch[2]);
        const fieldIndex = Number(listSubfieldMatch[3]);
        const itemIndex = Number(listSubfieldMatch[4]);
        const schemaKey = listSubfieldMatch[5];

        select({
          // El editor ya sabe editar fields usando schemaKey.
          type: "field",
          id,
          sectionIndex,
          blockIndex,
          fieldIndex,
          itemIndex,
          schemaKey,
        });

        return;
      }
      const listItemMatch = id.match(/^field-(\d+)-(\d+)-(\d+)-item-(\d+)$/);

      if (listItemMatch) {
        const sectionIndex = Number(listItemMatch[1]);
        const blockIndex = Number(listItemMatch[2]);
        const fieldIndex = Number(listItemMatch[3]);

        select({
          type: "field",
          id: `field-${sectionIndex}` + `-${blockIndex}` + `-${fieldIndex}`,
          sectionIndex,
          blockIndex,
          fieldIndex,
          schemaKey: undefined,
        });

        return;
      }
    }

    const cardListItemFieldMatch = id.match(
      /^field-(\d+)-(\d+)-(\d+)-card-(\d+)-block-(\d+)-field-(\d+)-item-(\d+)-subfield-(.+)$/,
    );

    if (cardListItemFieldMatch) {
      select({
        type: "list_item_field",
        id,

        // Field padre del boletín: el field tipo card
        sectionIndex: Number(cardListItemFieldMatch[1]),
        blockIndex: Number(cardListItemFieldMatch[2]),
        fieldIndex: Number(cardListItemFieldMatch[3]),

        // Ruta interna de la card
        cardIndex: Number(cardListItemFieldMatch[4]),
        cardId: cardElement?.dataset.cardId,

        cardBlockIndex: Number(cardListItemFieldMatch[5]),
        cardBlockId: cardBlockElement?.dataset.cardBlockId,

        cardFieldIndex: Number(cardListItemFieldMatch[6]),
        cardFieldId: cardFieldElement?.dataset.cardFieldId,

        // Ruta de la lista
        itemIndex: Number(cardListItemFieldMatch[7]),
        schemaKey: cardListItemFieldMatch[8],

        displayName: reviewLabel,
      });

      return;
    }

    const cardFieldMatch = id.match(
      /^field-(\d+)-(\d+)-(\d+)-card-(\d+)-block-(\d+)-field-(\d+)$/,
    );

    if (cardFieldMatch) {
      select({
        type: "card_field",
        id,

        sectionIndex: Number(cardFieldMatch[1]),
        blockIndex: Number(cardFieldMatch[2]),
        fieldIndex: Number(cardFieldMatch[3]),

        cardIndex: Number(cardFieldMatch[4]),
        cardId: clickedElement.dataset.cardId,

        cardBlockIndex: Number(cardFieldMatch[5]),
        cardBlockId: clickedElement.dataset.cardBlockId,

        cardFieldIndex: Number(cardFieldMatch[6]),
        cardFieldId: clickedElement.dataset.cardFieldId,

        displayName: reviewLabel,
      });

      return;
    }

    const cardBlockMatch = id.match(
      /^field-(\d+)-(\d+)-(\d+)-card-(\d+)-block-(\d+)$/,
    );

    if (cardBlockMatch) {
      select({
        type: "card_block",
        id,

        sectionIndex: Number(cardBlockMatch[1]),
        blockIndex: Number(cardBlockMatch[2]),
        fieldIndex: Number(cardBlockMatch[3]),

        cardIndex: Number(cardBlockMatch[4]),
        cardId: clickedElement.dataset.cardId,

        cardBlockIndex: Number(cardBlockMatch[5]),
        cardBlockId: clickedElement.dataset.cardBlockId,

        displayName: reviewLabel,
      });

      return;
    }

    const cardItemMatch = id.match(/^field-(\d+)-(\d+)-(\d+)-card-(\d+)$/);

    if (cardItemMatch) {
      select({
        type: "card_item",
        id,

        sectionIndex: Number(cardItemMatch[1]),
        blockIndex: Number(cardItemMatch[2]),
        fieldIndex: Number(cardItemMatch[3]),

        cardIndex: Number(cardItemMatch[4]),
        cardId: clickedElement.dataset.cardId,

        displayName: reviewLabel,
      });

      return;
    }

    const cardListItemMatch = id.match(
      /^field-(\d+)-(\d+)-(\d+)-card-(\d+)-block-(\d+)-field-(\d+)-item-(\d+)$/,
    );

    if (cardListItemMatch) {
      select({
        /*
         * También reutilizamos el tipo existente.
         */
        type: "list_item",
        id,

        sectionIndex: Number(cardListItemMatch[1]),
        blockIndex: Number(cardListItemMatch[2]),
        fieldIndex: Number(cardListItemMatch[3]),

        cardIndex: Number(cardListItemMatch[4]),
        cardId: cardElement?.dataset.cardId,

        cardBlockIndex: Number(cardListItemMatch[5]),
        cardBlockId: cardBlockElement?.dataset.cardBlockId,

        cardFieldIndex: Number(cardListItemMatch[6]),
        cardFieldId: cardFieldElement?.dataset.cardFieldId,

        itemIndex: Number(cardListItemMatch[7]),

        displayName: reviewLabel,
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

    const listItemFieldMatch = id.match(
      /^field-(\d+)-(\d+)-(\d+)-item-(\d+)-subfield-(.+)$/,
    );

    if (listItemFieldMatch) {
      select({
        type: "list_item_field",
        id,
        sectionIndex: Number(listItemFieldMatch[1]),
        blockIndex: Number(listItemFieldMatch[2]),
        fieldIndex: Number(listItemFieldMatch[3]),
        itemIndex: Number(listItemFieldMatch[4]),
        schemaKey: listItemFieldMatch[5],
      });

      return;
    }

    const listItemMatch = id.match(/^field-(\d+)-(\d+)-(\d+)-item-(\d+)$/);

    if (listItemMatch) {
      select({
        type: "list_item",
        id,
        sectionIndex: Number(listItemMatch[1]),
        blockIndex: Number(listItemMatch[2]),
        fieldIndex: Number(listItemMatch[3]),
        itemIndex: Number(listItemMatch[4]),
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
      onMouseDownCapture={cancelIntroAnimation}
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
        ref={transformLayerRef}
        style={{
          transform: `translate(${canvasState.position.x}px, ${canvasState.position.y}px) scale(${canvasState.scale})`,
          transformOrigin: "0 0",
          transition: isDragging
            ? "none"
            : introPhase === "focus"
              ? "transform 900ms cubic-bezier(0.22, 1, 0.36, 1)"
              : introPhase === "overview"
                ? "transform 450ms ease-out"
                : "transform 0.1s ease-out",
          opacity: isCanvasVisible ? 1 : 0,
          pointerEvents: isCanvasVisible ? "auto" : "none",
        }}
        className="relative w-auto h-auto min-w-full min-h-full p-20 origin-top-left transition-opacity duration-300"
      >
        <div ref={contentRef} className="flex gap-8 origin-top-left">
          {!data.version.content.sections ||
          data.version.content.sections.length === 0 ? (
            <div className="w-max bg-white shadow-xl">
              <UnifiedBulletinPreview
                data={data}
                variant="single"
                reviewMode={true}
                allowListItemSelection={isReviewInteraction}
                allowListSubfieldEditing={interactionMode === "edit"}
                allowCardElementSelection={isReviewInteraction}
                onElementClick={handleElementClick}
                selectedSectionIndex={0}
                selectedElementId={selection.id}
                commentCounts={isReviewInteraction ? commentCounts : undefined}
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
                        id={`template-section-${index}-page-${pageIndex}`}
                        className="w-max bg-white shadow-xl"
                      >
                        <UnifiedBulletinPreview
                          data={data}
                          variant="single"
                          reviewMode={true}
                          allowListItemSelection={isReviewInteraction}
                          allowListSubfieldEditing={interactionMode === "edit"}
                          allowCardElementSelection={isReviewInteraction}
                          onElementClick={handleElementClick}
                          selectedSectionIndex={index}
                          currentResolvedPageIndex={
                            shouldRenderAllPages ? pageIndex : undefined
                          }
                          hidePagination={shouldRenderAllPages}
                          selectedElementId={selection.id}
                          commentCounts={
                            isReviewInteraction ? commentCounts : undefined
                          }
                          resolvedSectionPageCounts={
                            shouldRenderAllPages ? sectionPageCounts : undefined
                          }
                          onResolvedPageCount={
                            shouldRenderAllPages && pageIndex === 0
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

      {showNavigationHint && (
        <div
          className="interactive-element absolute left-1/2 top-4 z-40 w-[min(92%,520px)] -translate-x-1/2 rounded-xl border border-[#283618]/15 bg-white/95 p-4 shadow-xl backdrop-blur-sm"
          role="status"
          aria-live="polite"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#283618]/10 text-[#283618]">
              <Move size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#283618]">
                {t("editor.canvasIntro.title")}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-[#606c38]">
                {t("editor.canvasIntro.message")}
              </p>

              <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[#bc6c25]">
                <ZoomIn size={14} />
                <span>{t("editor.canvasIntro.zoomHint")}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowNavigationHint(false)}
              className="rounded-md p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              aria-label={t("editor.canvasIntro.dismiss")}
              title={t("editor.canvasIntro.dismiss")}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Zoom Controls Overlay */}
      <div className="interactive-element absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2 flex gap-2">
        <button
          onClick={() => {
            cancelIntroAnimation();
            setCanvasState((state) => ({
              ...state,
              scale: Math.max(0.1, state.scale - 0.1),
            }));
          }}
          className="px-2 hover:bg-gray-100 rounded"
        >
          -
        </button>
        <span className="text-sm w-12 text-center">
          {Math.round(canvasState.scale * 100)}%
        </span>
        <button
          onClick={() => {
            cancelIntroAnimation();
            setCanvasState((state) => ({
              ...state,
              scale: Math.min(5, state.scale + 0.1),
            }));
          }}
          className="px-2 hover:bg-gray-100 rounded"
        >
          +
        </button>
      </div>
    </div>
  );
};
