// Tipos para la gestión de grupos basados en la documentación MongoDB

import { LogObject } from "./core";

// ============================================
// GROUP
// ============================================

/**
 * Asociación de un usuario con un rol dentro de un grupo
 */
export interface GroupUserRole {
  user_id: string; // Referencia al ID del usuario
  role_id: string; // Referencia al ID del rol
  role_name?: string; // Nombre del rol (opcional, para conveniencia)
  user_first_name?: string; // Nombre del usuario (opcional, para conveniencia)
  user_last_name?: string; // Apellido del usuario (opcional, para conveniencia)
}

/**
 * Grupo que organiza usuarios por afiliación (principalmente geografía)
 */
export interface Group {
  _id?: string;
  group_name: string; // Nombre del grupo (ej: "Colombia", "Vietnam")
  country: string; // Código del país en formato ISO 2 (ej: "CO", "VN")
  description: string; // Breve descripción del grupo
  users_access: GroupUserRole[]; // Array de usuarios con sus roles en este grupo
  log: LogObject; // Metadatos de auditoría
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Respuesta de la API para operaciones con grupos
 */
export interface GroupAPIResponse {
  success: boolean;
  message?: string;
  data?: Group;
}

/**
 * Respuesta de la API para listados de grupos
 */
export interface GroupsListAPIResponse {
  success: boolean;
  message?: string;
  data?: Group[];
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
 * Datos para crear o actualizar un grupo
 */
export interface CreateGroupData {
  group_name: string;
  country: string;
  description: string;
  users_access: GroupUserRole[];
}

/**
 * Estado de validación de un grupo
 */
export interface GroupValidationState {
  isValid: boolean;
  errors: {
    group_name?: string;
    country?: string;
    description?: string;
    users_access?: string;
  };
}

// ============================================
// EXTENDED TYPES
// ============================================

/**
 * Información extendida del grupo con datos calculados
 */
export interface GroupWithStats extends Group {
  usersCount: number; // Número de usuarios en el grupo
  rolesCount: number; // Número de roles únicos en el grupo
}

/**
 * Filtros para búsqueda de grupos
 */
export interface GroupFilters {
  country?: string;
  search?: string; // Búsqueda por nombre o descripción
}

/**
 * Opciones de ordenamiento para grupos
 */
export type GroupSortBy = "group_name" | "country" | "created_at" | "updated_at";

/**
 * Parámetros de consulta para listados de grupos
 */
export interface GroupQueryParams {
  page?: number;
  limit?: number;
  sortBy?: GroupSortBy;
  sortOrder?: "asc" | "desc";
  filters?: GroupFilters;
}
