"use client";

import React from "react";
import { PreviewMode } from "@/types/templatePreview";
import { LayoutGrid, List, Layers } from "lucide-react";

interface TemplateModeToggleProps {
  currentMode: PreviewMode;
  onModeChange: (mode: PreviewMode) => void;
  className?: string;
}

/**
 * Botones para cambiar entre los diferentes modos de visualización
 */
export function TemplateModeToggle({
  currentMode,
  onModeChange,
  className = "",
}: TemplateModeToggleProps) {
  const modes: Array<{ value: PreviewMode; label: string; icon: React.ReactNode }> = [
    { value: "carousel", label: "Carrusel", icon: <Layers className="w-full h-full" /> },
    { value: "scroll", label: "Lista", icon: <List className="w-full h-full" /> },
    { value: "grid", label: "Grilla", icon: <LayoutGrid className="w-full h-full" /> },
  ];

  return (
    <div className={`flex gap-1.5 md:gap-2 ${className}`}>
      {modes.map(({ value, label, icon }) => (
        <button
          key={value}
          onClick={() => onModeChange(value)}
          className={`
            flex items-center gap-1.5 md:gap-2 px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg transition-all
            ${
              currentMode === value
                ? "bg-[#ffaf68] text-white shadow-md"
                : "bg-white text-[#283618] hover:bg-[#ffaf68]/10 border border-[#283618]/20"
            }
          `}
          aria-label={`Cambiar a modo ${label}`}
          aria-pressed={currentMode === value}
        >
          <span className="w-3.5 h-3.5 md:w-4 md:h-4">{icon}</span>
          <span className="text-xs md:text-sm font-medium">{label}</span>
        </button>
      ))}
    </div>
  );
}
