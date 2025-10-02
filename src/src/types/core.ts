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
  background_image?: string; // URL de la imagen de fondo
  font_size?: number;
  font_weight?: string;
  font_style?: "normal" | "italic";
  text_decoration?: "none" | "underline" | "line-through";
  text_align?: "left" | "center" | "right";
  padding?: string;
  margin?: string;
  gap?: string; // Espaciado entre campos
  primary_color?: string;
  secondary_color?: string;
  border_color?: string;
  border_width?: string;
  border_radius?: string;
  bulletin_width?: number; // Ancho del boletín en píxeles
  bulletin_height?: number; // Alto del boletín en píxeles
  fields_layout?: "horizontal" | "vertical"; // Layout de los campos
  list_style_type?: "disc" | "circle" | "square" | "none"; // Estilo de bullet points para listas
  list_items_layout?: "vertical" | "horizontal" | "grid-2" | "grid-3"; // Layout de items dentro de la lista
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
export const FONT_WEIGHT_OPTIONS = [
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
] as const;
export const FONT_STYLE_OPTIONS = ["normal", "italic"] as const;
export const TEXT_DECORATION_OPTIONS = [
  "none",
  "underline",
  "line-through",
] as const;

export type TemplateStatus = (typeof TEMPLATE_STATUS)[number];
export type AccessType = (typeof ACCESS_TYPES)[number];
export type TextAlign = (typeof TEXT_ALIGN_OPTIONS)[number];
