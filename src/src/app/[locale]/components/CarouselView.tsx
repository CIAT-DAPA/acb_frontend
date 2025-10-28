"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { CarouselConfig } from "@/types/templatePreview";
import { CreateTemplateData } from "@/types/template";
import { TemplatePreview } from "../templates/create/TemplatePreview";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from "lucide-react";

interface CarouselViewProps {
  data: CreateTemplateData;
  config?: CarouselConfig;
  initialSection?: number;
}

/**
 * Vista de carousel para navegar entre secciones una a la vez
 * Soporta orientación horizontal/vertical, auto-play y gestos swipe
 * Componente genérico que funciona con templates y bulletins
 */
export function CarouselView({
  data,
  config = {},
  initialSection = 0,
}: CarouselViewProps) {
  // Configuración con defaults
  const {
    orientation = "horizontal",
    autoPlay = false,
    autoPlayInterval = 3000,
    showControls = true,
    showIndicators = true,
    loop = true,
    enableSwipe = true,
    itemsPerView = 1,
    gap = "1rem",
  } = config;

  const sections = data.version.content.sections || [];
  const totalSections = sections.length;

  const [currentSection, setCurrentSection] = useState(
    Math.min(initialSection, totalSections - 1)
  );
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  
  // Refs para swipe detection
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number>(0);
  const touchStartY = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const touchEndY = useRef<number>(0);

  // Navegación
  const goToNext = useCallback(() => {
    setCurrentSection((prev) => {
      if (prev >= totalSections - 1) {
        return loop ? 0 : prev;
      }
      return prev + 1;
    });
  }, [totalSections, loop]);

  const goToPrevious = useCallback(() => {
    setCurrentSection((prev) => {
      if (prev <= 0) {
        return loop ? totalSections - 1 : prev;
      }
      return prev - 1;
    });
  }, [totalSections, loop]);

  const goToSection = useCallback((index: number) => {
    if (index >= 0 && index < totalSections) {
      setCurrentSection(index);
    }
  }, [totalSections]);

  // Auto-play
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      goToNext();
    }, autoPlayInterval);

    return () => clearInterval(interval);
  }, [isAutoPlaying, autoPlayInterval, goToNext]);

  // Pausar auto-play al hacer hover
  const handleMouseEnter = () => {
    if (autoPlay) setIsAutoPlaying(false);
  };

  const handleMouseLeave = () => {
    if (autoPlay) setIsAutoPlaying(true);
  };

  // Swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!enableSwipe) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!enableSwipe) return;
    touchEndX.current = e.touches[0].clientX;
    touchEndY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (!enableSwipe) return;

    const deltaX = touchStartX.current - touchEndX.current;
    const deltaY = touchStartY.current - touchEndY.current;
    const minSwipeDistance = 50; // px

    if (orientation === "horizontal") {
      if (Math.abs(deltaX) > minSwipeDistance) {
        if (deltaX > 0) {
          goToNext(); // Swipe left
        } else {
          goToPrevious(); // Swipe right
        }
      }
    } else {
      if (Math.abs(deltaY) > minSwipeDistance) {
        if (deltaY > 0) {
          goToNext(); // Swipe up
        } else {
          goToPrevious(); // Swipe down
        }
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (orientation === "horizontal") {
        if (e.key === "ArrowLeft") goToPrevious();
        if (e.key === "ArrowRight") goToNext();
      } else {
        if (e.key === "ArrowUp") goToPrevious();
        if (e.key === "ArrowDown") goToNext();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [orientation, goToNext, goToPrevious]);

  const isHorizontal = orientation === "horizontal";
  const PrevIcon = isHorizontal ? ChevronLeft : ChevronUp;
  const NextIcon = isHorizontal ? ChevronRight : ChevronDown;

  // Calcular qué secciones mostrar (máximo el número de secciones disponibles)
  const effectiveItemsPerView = Math.min(itemsPerView, totalSections);
  const visibleSections = [];
  for (let i = 0; i < effectiveItemsPerView; i++) {
    const index = (currentSection + i) % totalSections;
    if (currentSection + i < totalSections || loop) {
      visibleSections.push(index);
    }
  }

  return (
    <div
      ref={containerRef}
      className="carousel-view relative w-full overflow-hidden"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Preview de la(s) sección(es) actual(es) */}
      <div 
        className={`carousel-content w-full flex ${isHorizontal ? 'flex-row' : 'flex-col'} items-center justify-center`}
        style={{ gap }}
      >
        {itemsPerView === 1 ? (
          // Modo tradicional: una sola sección
          <TemplatePreview
            data={data}
            selectedSectionIndex={currentSection}
          />
        ) : (
          // Modo múltiple: varias secciones
          visibleSections.map((sectionIndex) => (
            <div 
              key={sectionIndex}
              className="flex-shrink-0"
              style={{ 
                width: isHorizontal ? `calc((100% - ${gap} * ${effectiveItemsPerView - 1}) / ${effectiveItemsPerView})` : '100%',
                height: !isHorizontal ? `calc((100% - ${gap} * ${effectiveItemsPerView - 1}) / ${effectiveItemsPerView})` : 'auto'
              }}
            >
              <TemplatePreview
                data={data}
                selectedSectionIndex={sectionIndex}
              />
            </div>
          ))
        )}
      </div>

      {/* Controles de navegación - Ocultos en móvil, visibles en tablet+ */}
      {showControls && (
        <>
          {/* Botón anterior */}
          <button
            onClick={goToPrevious}
            disabled={!loop && currentSection === 0}
            className={`
              hidden md:flex
              absolute ${isHorizontal ? "left-2 md:left-4 top-1/2 -translate-y-1/2" : "top-2 md:top-4 left-1/2 -translate-x-1/2"}
              bg-white/90 hover:bg-white p-2 md:p-2.5 rounded-full shadow-lg
              transition-all disabled:opacity-30 disabled:cursor-not-allowed
              items-center justify-center
              z-10
            `}
            aria-label="Sección anterior"
          >
            <PrevIcon className="w-4 h-4 md:w-5 md:h-5 text-[#283618]" />
          </button>

          {/* Botón siguiente */}
          <button
            onClick={goToNext}
            disabled={!loop && currentSection === totalSections - 1}
            className={`
              hidden md:flex
              absolute ${isHorizontal ? "right-2 md:right-4 top-1/2 -translate-y-1/2" : "bottom-2 md:bottom-4 left-1/2 -translate-x-1/2"}
              bg-white/90 hover:bg-white p-2 md:p-2.5 rounded-full shadow-lg
              transition-all disabled:opacity-30 disabled:cursor-not-allowed
              items-center justify-center
              z-10
            `}
            aria-label="Sección siguiente"
          >
            <NextIcon className="w-4 h-4 md:w-5 md:h-5 text-[#283618]" />
          </button>
        </>
      )}

      {/* Indicadores */}
      {showIndicators && (
        <div
          className={`
            absolute ${isHorizontal ? "bottom-2 md:bottom-4 left-1/2 -translate-x-1/2 flex-row" : "right-2 md:right-4 top-1/2 -translate-y-1/2 flex-col"}
            flex gap-1.5 md:gap-2 bg-white/80 px-3 md:px-4 py-1.5 md:py-2 rounded-full shadow-md
            z-10
          `}
        >
          {sections.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSection(index)}
              className={`
                w-1.5 h-1.5 md:w-2 md:h-2
                rounded-full transition-all
                ${
                  index === currentSection
                    ? "bg-[#ffaf68] scale-125"
                    : "bg-[#283618]/30 hover:bg-[#283618]/50"
                }
              `}
              aria-label={`Ir a sección ${index + 1}`}
              aria-current={index === currentSection ? "true" : "false"}
            />
          ))}
        </div>
      )}

      {/* Contador de secciones - Más compacto en móvil */}
      <div className="absolute top-2 md:top-4 right-2 md:right-4 bg-white/90 px-2 md:px-3 py-1 rounded-full text-xs md:text-sm text-[#283618] shadow-md z-10">
        {currentSection + 1} / {totalSections}
      </div>
    </div>
  );
}
