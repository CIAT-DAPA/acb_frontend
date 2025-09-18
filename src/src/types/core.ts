// Tipos básicos y compartidos en toda la aplicación

export interface LogObject {
  created_at: string; // ISODate como string
  creator_user_id: string; // ObjectId como string
  updated_at?: string; // ISODate como string (opcional para creación)
  updater_user_id?: string; // ObjectId como string (opcional para creación)
}

export interface AccessConfig {
  access_type: "public" | "restricted" | "private";
  allowed_groups?: string[]; // Array de ObjectIds como strings
}

// Configuración de estilos para cualquier elemento
export interface StyleConfig {
  font?: string;
  color?: string;
  background_color?: string;
  font_size?: number;
  font_weight?: string;
  text_align?: "left" | "center" | "right";
  padding?: string;
  margin?: string;
  primary_color?: string;
  secondary_color?: string;
  [key: string]: string | number | boolean | undefined; // Para propiedades adicionales
}

// Reglas de validación para campos
export interface ValidationRules {
  required?: boolean;
  max_length?: number;
  min_length?: number;
  min_value?: number;
  max_value?: number;
  decimal_places?: number;
}

// Estados comunes
export const TEMPLATE_STATUS = ["activa", "archivada", "borrador"] as const;
export const ACCESS_TYPES = ["public", "restricted", "private"] as const;
export const TEXT_ALIGN_OPTIONS = ["left", "center", "right"] as const;

export type TemplateStatus = (typeof TEMPLATE_STATUS)[number];
export type AccessType = (typeof ACCESS_TYPES)[number];
export type TextAlign = (typeof TEXT_ALIGN_OPTIONS)[number];
