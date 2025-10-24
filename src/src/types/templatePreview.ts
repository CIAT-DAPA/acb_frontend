/**
 * Types y configuraciones para el sistema de preview de templates
 */

export type PreviewMode = 'carousel' | 'scroll' | 'grid';

export type CarouselOrientation = 'horizontal' | 'vertical';
export type ScrollOrientation = 'horizontal' | 'vertical';
export type ScrollSpacing = 'compact' | 'comfortable' | 'spacious';
export type ThumbnailSize = 'small' | 'medium' | 'large';

/**
 * Configuración para el modo Carousel
 */
export interface CarouselConfig {
  /** Orientación del carousel (default: 'horizontal') */
  orientation?: CarouselOrientation;
  /** Auto-reproducción (default: false) */
  autoPlay?: boolean;
  /** Intervalo de auto-play en ms (default: 3000) */
  autoPlayInterval?: number;
  /** Mostrar controles prev/next (default: true) */
  showControls?: boolean;
  /** Mostrar indicadores de página (default: true) */
  showIndicators?: boolean;
  /** Volver al inicio al llegar al final (default: true) */
  loop?: boolean;
  /** Habilitar gestos de swipe (default: true en móvil) */
  enableSwipe?: boolean;
}

/**
 * Configuración para el modo Scroll
 */
export interface ScrollConfig {
  /** Orientación del scroll (default: 'vertical') */
  orientation?: ScrollOrientation;
  /** Mostrar mini-navegador lateral (default: true) */
  showMiniNav?: boolean;
  /** Resaltar sección activa con scroll-spy (default: true) */
  highlightActive?: boolean;
  /** Espaciado entre secciones */
  spacing?: ScrollSpacing;
}

/**
 * Configuración para el modo Grid
 */
export interface GridConfig {
  /** Número de columnas (default: 3, responsive) */
  columns?: number;
  /** Tamaño de las miniaturas */
  thumbnailSize?: ThumbnailSize;
  /** Mostrar etiquetas de sección (default: true) */
  showLabels?: boolean;
  /** Handler al hacer click en una sección */
  onSectionClick?: (index: number) => void;
}

/**
 * Props principales para TemplateFullPreview
 */
export interface TemplateFullPreviewProps {
  /** Datos del template a previsualizar */
  data: any; // Usar CreateTemplateData del template.ts
  
  /** Modo de visualización */
  mode: PreviewMode;
  
  /** Configuración específica del modo Carousel */
  carouselConfig?: CarouselConfig;
  
  /** Configuración específica del modo Scroll */
  scrollConfig?: ScrollConfig;
  
  /** Configuración específica del modo Grid */
  gridConfig?: GridConfig;
  
  /** Permitir cambio de modo con botones toggle (default: false) */
  allowModeToggle?: boolean;
  
  /** Índice de sección inicial (default: 0) */
  initialSection?: number;
  
  /** Clase CSS adicional */
  className?: string;
}
