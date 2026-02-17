import React, { useRef, useState, useEffect } from "react";
import { CreateTemplateData } from "@/types/template";
import { EditorSelection, CanvasState } from "./types";
import { TemplatePreview } from "../TemplatePreview";
import * as ui from "../../../components/ui";
import { useTranslations } from "next-intl";

interface CanvasProps {
  data: CreateTemplateData;
  selection: EditorSelection;
  onSelect: (selection: EditorSelection) => void;
  onUpdateSection?: any;
  onUpdate?: any;
  onAddSection?: () => void;
  globalStyleConfig?: any;
  sections?: any;
  isCardMode?: boolean;
}

export const Canvas: React.FC<CanvasProps> = ({
  data,
  selection,
  onSelect,
  onAddSection,
  isCardMode = false,
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
  const spacePressed = useRef(false);

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

    // Header Global Container
    if (id === "header-global") {
      onSelect({
        type: "header",
        id: null,
        sectionIndex: -1, // Global
      });
      return;
    }

    // Header Global Field
    const headerGlobalFieldMatch = id.match(/^header-global-(\d+)$/);
    if (headerGlobalFieldMatch) {
      onSelect({
        type: "header_field",
        id: null,
        sectionIndex: -1,
        fieldIndex: parseInt(headerGlobalFieldMatch[1]),
      });
      return;
    }

    // Header Section Field (Priority: check this first because it matches header-(\d+) prefix logic if not careful, but regex is strict)
    const headerFieldMatch = id.match(/^header-(\d+)-(\d+)$/);
    if (headerFieldMatch) {
      onSelect({
        type: "header_field",
        id: null,
        sectionIndex: parseInt(headerFieldMatch[1]),
        fieldIndex: parseInt(headerFieldMatch[2]),
      });
      return;
    }

    // Header Section Container
    const headerSectionMatch = id.match(/^header-(\d+)$/);
    if (headerSectionMatch) {
      onSelect({
        type: "header",
        id: null,
        sectionIndex: parseInt(headerSectionMatch[1]),
      });
      return;
    }

    // Footer Global Container
    if (id === "footer-global") {
      onSelect({
        type: "footer",
        id: null,
        sectionIndex: -1, // Global
      });
      return;
    }

    // Footer Global Field
    const footerGlobalFieldMatch = id.match(/^footer-global-(\d+)$/);
    if (footerGlobalFieldMatch) {
      onSelect({
        type: "footer_field",
        id: null,
        sectionIndex: -1,
        fieldIndex: parseInt(footerGlobalFieldMatch[1]),
      });
      return;
    }

    // Footer Section Field
    const footerFieldMatch = id.match(/^footer-(\d+)-(\d+)$/);
    if (footerFieldMatch) {
      onSelect({
        type: "footer_field",
        id: null,
        sectionIndex: parseInt(footerFieldMatch[1]),
        fieldIndex: parseInt(footerFieldMatch[2]),
      });
      return;
    }

    // Footer Section Container
    const footerSectionMatch = id.match(/^footer-(\d+)$/);
    if (footerSectionMatch) {
      onSelect({
        type: "footer",
        id: null,
        sectionIndex: parseInt(footerSectionMatch[1]),
      });
      return;
    }

    // Pattern checks for generated IDs
    const fieldSubmatch = id.match(/^field-(\d+)-(\d+)-(\d+)-subfield-(.+)$/);
    if (fieldSubmatch) {
      onSelect({
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
      onSelect({
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
      onSelect({
        type: "block",
        id: id,
        sectionIndex: parseInt(blockMatch[1]),
        blockIndex: parseInt(blockMatch[2]),
      });
      return;
    }

    const sectionMatch = id.match(/^section-(\d+)$/);
    if (sectionMatch) {
      onSelect({
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
        onSelect({ type: "section", id, sectionIndex: sIdx });
        return;
      }

      for (let bIdx = 0; bIdx < section.blocks.length; bIdx++) {
        const block = section.blocks[bIdx];
        if (block.block_id === id || (block as any)._id === id) {
          onSelect({ type: "block", id, sectionIndex: sIdx, blockIndex: bIdx });
          return;
        }

        if (block.fields) {
          for (let fIdx = 0; fIdx < block.fields.length; fIdx++) {
            const field = block.fields[fIdx];
            if (field.field_id === id || (field as any)._id === id) {
              onSelect({
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
              />
            </div>
          ) : (
            data.version.content.sections.map((section, index) => (
              <div
                key={index}
                id={`template-section-${index}`}
                className="w-max bg-white shadow-xl relative group-section"
              >
                {/* Selection Indicator */}
                {selection.type === "section" &&
                  selection.sectionIndex === index && (
                    <div className="absolute -inset-2 border-2 border-blue-500 rounded-lg pointer-events-none z-10" />
                  )}

                <TemplatePreview
                  data={data}
                  reviewMode={true}
                  onElementClick={handleElementClick}
                  selectedSectionIndex={index}
                  hidePagination={true}
                  selectedElementId={selection.id}
                />

                <div
                  className="absolute -top-8 left-0 text-sm font-bold text-gray-500 cursor-pointer hover:text-blue-600 hover:underline"
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
