// Tipos para la gestión de cards basados en la documentación MongoDB
// Las cards son contenido predefinido que puede ser insertado en los boletines

import { LogObject, AccessConfig } from "./core";
import { Field, Block } from "./template";

// ============================================
// CARD TYPES
// ============================================

/**
 * Tipos de cards disponibles para categorización
 */
export type CardType =
  | "pest_or_disease"
  | "crop_info"
  | "recommendation"
  | "weather_alert"
  | "general";

/**
 * Contenido de una card con estructura flexible
 */
export interface CardContent {
  background_url?: string; // URL de imagen de fondo para la card
  icon_url?: string; // URL de icono para la card
  blocks: Block[]; // Array de bloques, misma estructura que en templates
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
  card_type: CardType; // Tipo de card para filtrado y categorización
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
 * Tipos de cards disponibles con sus labels
 */
export const CARD_TYPES: Record<CardType, { label: string; icon: string }> = {
  pest_or_disease: {
    label: "Plaga o Enfermedad",
    icon: "🐛",
  },
  crop_info: {
    label: "Información de Cultivo",
    icon: "🌾",
  },
  recommendation: {
    label: "Recomendación",
    icon: "💡",
  },
  weather_alert: {
    label: "Alerta Climática",
    icon: "⚠️",
  },
  general: {
    label: "General",
    icon: "📄",
  },
};

/**
 * Array de tipos de cards para selectores
 */
export const CARD_TYPE_OPTIONS: CardType[] = [
  "pest_or_disease",
  "crop_info",
  "recommendation",
  "weather_alert",
  "general",
];

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
