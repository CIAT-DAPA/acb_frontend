// Tipos para la gestión de usuarios basados en la documentación de la API
// Los usuarios representan las personas que tienen acceso al sistema

import { LogObject } from "./core";

// ============================================
// USER TYPES
// ============================================

/**
 * Estado del usuario en el sistema
 */
export type UserStatus = "active" | "inactive";

/**
 * Documento principal de Usuario
 */
export interface User {
  id: string; // ID del usuario (puede ser ObjectId o UUID según el sistema)
  ext_id: string; // ID externo del usuario (por ejemplo, del proveedor de autenticación)
  is_active: boolean; // Estado activo/inactivo del usuario
  first_name: string; // Nombre del usuario
  last_name: string; // Apellido del usuario
  log: LogObject; // Metadatos de auditoría
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Respuesta de la API para operaciones con usuarios
 */
export interface UserAPIResponse {
  success: boolean;
  message?: string;
  data?: User;
}

/**
 * Respuesta de la API para listados de usuarios
 */
export interface UsersListAPIResponse {
  success: boolean;
  message?: string;
  data?: User[];
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
 * Datos para crear un nuevo usuario
 */
export interface CreateUserData {
  ext_id: string; // ID externo (requerido)
  first_name: string; // Nombre (requerido)
  last_name: string; // Apellido (requerido)
  is_active?: boolean; // Estado activo (opcional, por defecto true)
  log?: LogObject; // Log de creación (opcional, generado por el backend)
}

/**
 * Datos para actualizar un usuario existente
 */
export interface UpdateUserData extends Partial<CreateUserData> {
  id: string; // ID del usuario a actualizar (requerido)
}

/**
 * Filtros para búsqueda de usuarios
 */
export interface UserFilters {
  is_active?: boolean; // Filtrar por estado activo/inactivo
  search?: string; // Búsqueda por nombre o apellido
  ext_id?: string; // Filtrar por ID externo
}

/**
 * Parámetros de paginación para listado de usuarios
 */
export interface UserPaginationParams {
  page?: number; // Número de página (default: 1)
  limit?: number; // Cantidad de resultados por página (default: 10)
  sortBy?: "first_name" | "last_name" | "created_at"; // Campo para ordenar
  sortOrder?: "asc" | "desc"; // Orden ascendente o descendente
}

// ============================================
// UI STATE TYPES
// ============================================

/**
 * Estado de carga de usuarios en la UI
 */
export interface UserListState {
  users: User[];
  isLoading: boolean;
  error: string | null;
  filters: UserFilters;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Estado de edición de usuario en la UI
 */
export interface UserEditState {
  user: User | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
}
