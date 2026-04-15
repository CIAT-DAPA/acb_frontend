import React, { useState, useEffect } from "react";
import { CreateTemplateData } from "@/types/template";
import { EditorSelection } from "./types";
import { slugify } from "@/utils/slugify";
import { TopBar } from "@/app/[locale]/templates/create/editor/TopBar";
import { Canvas } from "@/app/[locale]/templates/create/editor/Canvas";
import { RightPanel } from "@/app/[locale]/templates/create/editor/RightPanel";

function buildSelectionId(selection: EditorSelection): string | null {
  switch (selection.type) {
    case "template":
      return null;
    case "section":
      return typeof selection.sectionIndex === "number"
        ? `section-${selection.sectionIndex}`
        : selection.id;
    case "block":
      return typeof selection.sectionIndex === "number" &&
        typeof selection.blockIndex === "number"
        ? `block-${selection.sectionIndex}-${selection.blockIndex}`
        : selection.id;
    case "field": {
      if (
        typeof selection.sectionIndex !== "number" ||
        typeof selection.blockIndex !== "number" ||
        typeof selection.fieldIndex !== "number"
      ) {
        return selection.id;
      }

      const baseId = `field-${selection.sectionIndex}-${selection.blockIndex}-${selection.fieldIndex}`;
      return selection.schemaKey
        ? `${baseId}-subfield-${selection.schemaKey}`
        : baseId;
    }
    case "header":
      return selection.sectionIndex !== undefined && selection.sectionIndex >= 0
        ? `header-${selection.sectionIndex}`
        : "header-global";
    case "footer":
      return selection.sectionIndex !== undefined && selection.sectionIndex >= 0
        ? `footer-${selection.sectionIndex}`
        : "footer-global";
    case "header_field":
      return selection.sectionIndex !== undefined && selection.sectionIndex >= 0
        ? `header-${selection.sectionIndex}-${selection.fieldIndex}`
        : `header-global-${selection.fieldIndex}`;
    case "footer_field":
      return selection.sectionIndex !== undefined && selection.sectionIndex >= 0
        ? `footer-${selection.sectionIndex}-${selection.fieldIndex}`
        : `footer-global-${selection.fieldIndex}`;
    default:
      return selection.id;
  }
}

function remapSelectionAfterSectionMove(
  selection: EditorSelection,
  fromIndex: number,
  toIndex: number,
): EditorSelection {
  if (
    selection.type === "template" ||
    typeof selection.sectionIndex !== "number" ||
    selection.sectionIndex < 0 ||
    fromIndex === toIndex
  ) {
    return selection;
  }

  let nextSectionIndex = selection.sectionIndex;

  if (selection.sectionIndex === fromIndex) {
    nextSectionIndex = toIndex;
  } else if (
    fromIndex < toIndex &&
    selection.sectionIndex > fromIndex &&
    selection.sectionIndex <= toIndex
  ) {
    nextSectionIndex = selection.sectionIndex - 1;
  } else if (
    fromIndex > toIndex &&
    selection.sectionIndex >= toIndex &&
    selection.sectionIndex < fromIndex
  ) {
    nextSectionIndex = selection.sectionIndex + 1;
  }

  if (nextSectionIndex === selection.sectionIndex) {
    return selection;
  }

  const nextSelection = {
    ...selection,
    sectionIndex: nextSectionIndex,
  };

  return {
    ...nextSelection,
    id: buildSelectionId(nextSelection),
  };
}

function reorderSections(
  sections: CreateTemplateData["version"]["content"]["sections"],
  fromIndex: number,
  toIndex: number,
) {
  const nextSections = [...sections];
  const [movedSection] = nextSections.splice(fromIndex, 1);

  if (!movedSection) {
    return sections;
  }

  nextSections.splice(toIndex, 0, movedSection);

  return nextSections.map((section, index) => ({
    ...section,
    order: index,
  }));
}

interface EditorLayoutProps {
  data: CreateTemplateData;
  onUpdate: (updater: (prev: CreateTemplateData) => CreateTemplateData) => void;
  saving?: boolean;
  lastSaved?: Date | null;
  onBack: () => void;
  onSave: () => void;
  // Card specific props
  isCardMode?: boolean;
  cardType?: string;
  cardTags?: string[];
  onCardTypeChange?: (type: string) => void;
  onCardTagsChange?: (tags: string[]) => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  data,
  onUpdate,
  saving = false,
  lastSaved = null,
  onBack,
  onSave,
  isCardMode = false,
  cardType,
  cardTags,
  onCardTypeChange,
  onCardTagsChange,
}) => {
  const [selection, setSelection] = useState<EditorSelection>({
    type: "template",
    id: null,
  });

  // Handle global key events like Delete for selection
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selection.id &&
        selection.type !== "template"
      ) {
        // Delete logic handled in RightPanel for now or move to here
        // Keeping it safely in RightPanel button to avoid accidental deletes without confirmation for now
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selection]);

  const handleSelection = (sel: EditorSelection) => {
    setSelection(sel);
  };

  const deselectAll = () => {
    setSelection({ type: "template", id: null });
  };

  // Add Section Logic
  const handleAddSection = () => {
    onUpdate((prev) => ({
      ...prev,
      version: {
        ...prev.version,
        content: {
          ...prev.version.content,
          sections: [
            ...prev.version.content.sections,
            {
              section_id: crypto.randomUUID(),
              display_name: `Sección ${prev.version.content.sections.length + 1}`,
              order: prev.version.content.sections.length,
              blocks: [],
              background_url: [],
              icon_url: "",
              print: true,
            },
          ],
        },
      },
    }));
  };

  const handleMoveSection = (fromIndex: number, toIndex: number) => {
    const sectionsCount = data.version.content.sections.length;

    if (sectionsCount < 2 || fromIndex < 0 || fromIndex >= sectionsCount) {
      return;
    }

    const boundedToIndex = Math.min(Math.max(toIndex, 0), sectionsCount - 1);

    if (fromIndex === boundedToIndex) {
      return;
    }

    setSelection((previousSelection) =>
      remapSelectionAfterSectionMove(
        previousSelection,
        fromIndex,
        boundedToIndex,
      ),
    );

    onUpdate((prev) => ({
      ...prev,
      version: {
        ...prev.version,
        content: {
          ...prev.version.content,
          sections: reorderSections(
            prev.version.content.sections,
            fromIndex,
            boundedToIndex,
          ),
        },
      },
    }));
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] w-full bg-gray-100 overflow-hidden">
      <TopBar
        templateName={data.master.template_name}
        onNameChange={(name) =>
          onUpdate((prev) => ({
            ...prev,
            master: {
              ...prev.master,
              template_name: name,
              name_machine: slugify(name),
            },
          }))
        }
        saving={saving}
        lastSaved={lastSaved}
        onBack={onBack}
        onSave={onSave}
        isCardMode={isCardMode}
      />

      <div className="flex flex-1 overflow-hidden relative isolate">
        <div
          className="w-full h-full relative z-0"
          onClick={deselectAll} // Click on background deselects
        >
          <Canvas
            data={data}
            selection={selection}
            onSelect={handleSelection}
            onAddSection={handleAddSection}
            onMoveSection={handleMoveSection}
            isCardMode={isCardMode}
          />
        </div>

        {/* Right Panel - Force Overlay */}
        <div className="absolute top-0 right-0 h-full z-50 shadow-2xl bg-white border-l border-gray-200">
          <RightPanel
            selection={selection}
            data={data}
            onUpdate={onUpdate}
            onMoveSection={handleMoveSection}
            // @ts-ignore - Dynamic props for Card Mode
            isCardMode={isCardMode}
            cardType={cardType}
            cardTags={cardTags}
            onCardTypeChange={onCardTypeChange}
            onCardTagsChange={onCardTagsChange}
          />
        </div>
      </div>
    </div>
  );
};
