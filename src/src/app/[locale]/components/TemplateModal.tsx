"use client";

import React, { ReactNode, useEffect } from "react";
import { X } from "lucide-react";

interface TemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  showNavigation?: boolean;
  currentIndex?: number;
  totalItems?: number;
  onPrevious?: () => void;
  onNext?: () => void;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "4xl" | "full";
}

/**
 * Modal reutilizable para mostrar contenido en pantalla completa
 * Con soporte para navegación entre items y personalización
 */
export function TemplateModal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  showNavigation = false,
  currentIndex,
  totalItems,
  onPrevious,
  onNext,
  maxWidth = "4xl",
}: TemplateModalProps) {
  if (!isOpen) return null;

  const maxWidthMap = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "4xl": "max-w-4xl",
    full: "max-w-full",
  };

  const isFirstItem = currentIndex === 0;
  const isLastItem = currentIndex === (totalItems ?? 1) - 1;

  // Prevenir scroll del body cuando el modal está abierto
  useEffect(() => {
    if (isOpen) {
      // Guardar el scroll actual
      const scrollY = window.scrollY;
      
      // Prevenir scroll
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";

      return () => {
        // Restaurar scroll
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.width = "";
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl w-auto ${maxWidthMap[maxWidth]} max-w-[95vw] max-h-[97vh] relative shadow-2xl flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botón cerrar - Fixed en la esquina superior derecha */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition-colors z-10 border border-[#283618]/10"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5 text-[#283618]" />
        </button>

        {/* Header con título - Fixed (no hace scroll) */}
        <div className="p-6 py-4 flex-shrink-0">
          <h2 className="text-2xl font-bold text-[#283618] pr-12">{title}</h2>
          {subtitle && (
            <p className="text-sm text-[#283618]/60 mt-1">{subtitle}</p>
          )}
        </div>

        {/* Contenido del modal - SOLO ESTA PARTE HACE SCROLL */}
        <div className="px-6 py-4 flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
          <div className="overflow-x-auto flex justify-center scrollbar-thin">
            <div className="w-fit h-fit">
              {children}
            </div>
          </div>
        </div>

        {/* Footer con navegación (opcional) - Fixed (no hace scroll) */}
        {showNavigation && (
          <div className="p-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl flex-shrink-0">
            <button
              onClick={onPrevious}
              disabled={isFirstItem}
              className="px-4 py-2 bg-[#283618] text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#ffaf68] transition-colors font-medium text-sm"
              aria-label="Anterior"
            >
              ← Anterior
            </button>

            <span className="text-sm text-[#283618]/70 font-medium">
              {(currentIndex ?? 0) + 1} / {totalItems ?? 1}
            </span>

            <button
              onClick={onNext}
              disabled={isLastItem}
              className="px-4 py-2 bg-[#283618] text-white rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#ffaf68] transition-colors font-medium text-sm"
              aria-label="Siguiente"
            >
              Siguiente →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
