// Tipos para la gestión de cards basados en la documentación MongoDB
// Las cards son contenido predefinido que puede ser insertado en los boletines

import { LogObject, AccessConfig } from "./core";
import { Field, Block } from "./template";

// ============================================
// CARD TYPES
// ============================================

/**
 * Tipos de cards disponibles para categorización
 * Los tipos reales se obtienen dinámicamente desde la API
 */
export type CardType = string;

/**
 * Contenido de una card con estructura flexible
 */
export interface CardContent {
  background_url?: string; // URL de imagen de fondo para la card
  background_color?: string; // Color de fondo para la card (hex, rgb, etc.)
  blocks: Block[]; // Array de bloques, misma estructura que en templates
  header_config?: import("./template").HeaderFooterConfig; // Configuración opcional del encabezado
  footer_config?: import("./template").HeaderFooterConfig; // Configuración opcional del pie de página
  style_config?: import("./core").StyleConfig; // Configuración de estilos del contenido (padding, gap, etc.)
}

/**
 * Estado del card
 */
export type CardStatus = "active" | "archived";

/**
 * Documento principal de Card
 */
export interface Card {
  _id?: string; // ObjectId como string
  card_name: string; // Nombre de la card
  tags: string[]; // Etiquetas para clasificación y búsqueda
  card_type: CardType; // Tipo de card para filtrado y categorización
  thumbnail_images?: string[]; // Rutas a las imágenes de preview de la card
  templates_master_ids: string[]; // Array de ObjectIds de templates donde esta card es válida
  access_config: AccessConfig; // Nivel de acceso al recurso
  content: CardContent; // Estructura flexible del contenido
  status: CardStatus; // Estado de la card (active o archived)
  log: LogObject; // Metadatos de auditoría
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Respuesta de la API para operaciones con cards
 */
export interface CardAPIResponse {
  success: boolean;
  message?: string;
  data?: Card;
}

/**
 * Respuesta de la API para listados de cards
 */
export interface CardsListAPIResponse {
  success: boolean;
  message?: string;
  data?: Card[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ============================================
// FORM & UI TYPES
// ============================================

/**
 * Datos para crear o actualizar una card
 */
export interface CreateCardData {
  card_name: string;
  tags: string[];
  card_type: CardType;
  templates_master_ids: string[];
  access_config: AccessConfig;
  content: CardContent;
  status?: CardStatus; // Opcional al crear, por defecto "active"
  log?: LogObject; // Log de creación
}

/**
 * Datos para actualizar una card existente
 */
export interface UpdateCardData extends Partial<CreateCardData> {
  _id: string;
  status?: CardStatus; // Puede actualizarse a "archived"
}

/**
 * Estado de validación de una card
 */
export interface CardValidationState {
  isValid: boolean;
  errors: {
    card_name?: string;
    card_type?: string;
    templates_master_ids?: string;
    access_config?: string;
    content?: string;
  };
}

// ============================================
// EXTENDED TYPES
// ============================================

/**
 * Información extendida de la card con datos calculados
 */
export interface CardWithStats extends Card {
  templatesCount: number; // Número de templates donde esta card es válida
  blocksCount: number; // Número de bloques en el contenido
  fieldsCount: number; // Número total de campos en todos los bloques
}

/**
 * Filtros para búsqueda de cards
 */
export interface CardFilters {
  card_type?: CardType;
  template_master_id?: string; // Filtrar cards válidas para un template específico
  access_type?: "public" | "restricted" | "private";
  search?: string; // Búsqueda por nombre
}

/**
 * Opciones de ordenamiento para cards
 */
export type CardSortBy =
  | "card_name"
  | "card_type"
  | "created_at"
  | "updated_at";

/**
 * Parámetros de consulta para listados de cards
 */
export interface CardQueryParams {
  page?: number;
  limit?: number;
  sortBy?: CardSortBy;
  sortOrder?: "asc" | "desc";
  filters?: CardFilters;
}

// ============================================
// UTILITY TYPES
// ============================================

/**
 * Información resumida de una card para selectores
 */
export interface CardSummary {
  _id: string;
  card_name: string;
  tags?: string[];
  card_type: CardType;
  icon_url?: string;
}

/**
 * Opciones de cards disponibles para un template específico
 */
export interface CardOptions {
  template_master_id: string;
  available_cards: CardSummary[];
}

// ============================================
// CONSTANTS
// ============================================

/**
 * Iconos predeterminados para tipos de cards comunes
 * Se puede extender con más tipos según se agreguen en la API
 */
export const CARD_TYPE_ICONS: Record<string, string> = {
  pest_or_disease: "🐛",
  pest: "🐛",
  crop_info: "🌾",
  crop: "🌾",
  crops: "🌾",
  recommendation: "💡",
  alert: "⚠️",
};

/**
 * Orden preferido para mostrar los tipos de cards
 * Los tipos no listados se mostrarán al final alfabéticamente
 */
export const CARD_TYPE_DISPLAY_ORDER: string[] = [
  "crop_info",
  "crop",
  "crops",
  "pest_or_disease",
  "pest",
  "recommendation",
];

/**
 * Obtener el icono para un tipo de card
 * @param cardType - Tipo de card
 * @returns Emoji del icono o icono por defecto
 */
export const getCardTypeIcon = (cardType: string): string => {
  return CARD_TYPE_ICONS[cardType.toLowerCase()] || "📄";
};

/**
 * Tipos de cards que tienen traducciones disponibles
 */
export const TRANSLATABLE_CARD_TYPES = [
  "pest_or_disease",
  "pest",
  "crop_info",
  "crop",
  "crops",
  "recommendation",
  "alert",
];

/**
 * Tipos de card disponibles para selección en UI
 */
export const ACTIVE_CARD_TYPES = [
  "crop_info",
  "crop",
  "crops",
  "pest_or_disease",
  "pest",
  "recommendation",
  "alert",
];

/**
 * Verificar si un tipo de card está disponible para selección en UI
 */
export const isSelectableCardType = (cardType: string): boolean => {
  return ACTIVE_CARD_TYPES.includes(cardType.toLowerCase());
};

/**
 * Verificar si un tipo de card tiene traducción disponible
 * @param cardType - Tipo de card
 * @returns true si tiene traducción, false si no
 */
export const hasCardTypeTranslation = (cardType: string): boolean => {
  return TRANSLATABLE_CARD_TYPES.includes(cardType.toLowerCase());
};

// ============================================
// CARD CREATION WIZARD TYPES
// ============================================

/**
 * Pasos del wizard de creación de cards
 */
export type CardCreationStep = "basic-info" | "content";

/**
 * Estado del wizard de creación de cards
 */
export interface CardCreationState {
  currentStep: CardCreationStep;
  data: CreateCardData;
  errors: Record<string, string[]>;
  isValid: boolean;
}
