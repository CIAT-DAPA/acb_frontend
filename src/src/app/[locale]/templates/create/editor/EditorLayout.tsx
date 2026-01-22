import React, { useState, useEffect } from "react";
import { CreateTemplateData } from "@/types/template";
import { EditorSelection } from "./types";
import { TopBar } from "@/app/[locale]/templates/create/editor/TopBar";
import { Canvas } from "@/app/[locale]/templates/create/editor/Canvas";
import { RightPanel } from "@/app/[locale]/templates/create/editor/RightPanel";

interface EditorLayoutProps {
  data: CreateTemplateData;
  onUpdate: (updater: (prev: CreateTemplateData) => CreateTemplateData) => void;
  saving?: boolean;
  lastSaved?: Date | null;
  onBack: () => void;
  onSave: () => void;
}

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  data,
  onUpdate,
  saving = false,
  lastSaved = null,
  onBack,
  onSave,
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
            },
          ],
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
            master: { ...prev.master, template_name: name },
          }))
        }
        saving={saving}
        lastSaved={lastSaved}
        onBack={onBack}
        onSave={onSave}
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
          />
        </div>

        {/* Right Panel - Force Overlay */}
        <div className="absolute top-0 right-0 h-full z-50 shadow-2xl bg-white border-l border-gray-200">
          <RightPanel selection={selection} data={data} onUpdate={onUpdate} />
        </div>
      </div>
    </div>
  );
};
