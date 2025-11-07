// Tipos para la gestión de roles basados en la documentación MongoDB

import { LogObject, PermissionModule, CRUDOperation } from "./core";

// ============================================
// CRUD OPERATIONS
// ============================================

/**
 * Operaciones CRUD que definen los permisos
 * - c: Create (crear nuevos documentos)
 * - r: Read (leer o ver documentos)
 * - u: Update (actualizar documentos existentes)
 * - d: Delete (borrar documentos)
 */
export interface CRUDPermissions {
  c: boolean; // Create
  r: boolean; // Read
  u: boolean; // Update
  d: boolean; // Delete
}

// ============================================
// PERMISSIONS
// ============================================

/**
 * Permisos funcionales del rol
 * Cada clave representa un módulo del frontend
 */
export interface RolePermissions {
  bulletins_composer: CRUDPermissions; // Permisos para crear y editar boletines
  template_management: CRUDPermissions; // Permisos para gestionar plantillas
  dashboard_bulletins: CRUDPermissions; // Permisos para ver el listado de boletines
  review: CRUDPermissions; // Permisos para gestionar el proceso de revisión
  card_management: CRUDPermissions; // Permisos para gestionar cards o contenidos reutilizables
  access_control: CRUDPermissions; // Permisos para gestionar usuarios, roles y grupos
  external_integrations: CRUDPermissions; // Permisos para gestionar integraciones externas
}

// ============================================
// ROLE
// ============================================

/**
 * Define un rol en la plataforma con sus permisos específicos
 */
export interface Role {
  _id?: string;
  role_name: string; // Nombre del rol (ej: "admin", "editor", "revisor")
  description: string; // Descripción de las responsabilidades del rol
  permissions: RolePermissions; // Permisos funcionales usando modelo CRUD
  log: LogObject; // Información de auditoría
}

// ============================================
// API RESPONSE TYPES
// ============================================

/**
 * Respuesta de la API para operaciones con roles
 */
export interface RoleAPIResponse {
  success: boolean;
  message?: string;
  data?: Role;
}

/**
 * Respuesta de la API para listados de roles
 */
export interface RolesListAPIResponse {
  success: boolean;
  message?: string;
  data?: Role[];
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
 * Datos para crear o actualizar un rol
 */
export interface CreateRoleData {
  role_name: string;
  description: string;
  permissions: RolePermissions;
}

/**
 * Estado de validación de un rol
 */
export interface RoleValidationState {
  isValid: boolean;
  errors: {
    role_name?: string;
    description?: string;
    permissions?: string;
  };
}

// ============================================
// PERMISSION UTILITIES
// ============================================

/**
 * Tipo para los nombres de módulos de permisos
 */

/**
 * Tipo para las operaciones CRUD
 */
// PermissionModule and CRUDOperation se importan desde `core.ts` para
// mantener una única fuente de verdad para los nombres de módulos/acciones.

/**
 * Helper para verificar si un rol tiene un permiso específico
 */
export interface PermissionCheck {
  module: PermissionModule;
  operation: CRUDOperation;
}

/**
 * Información extendida del rol con contadores útiles
 */
export interface RoleWithStats extends Role {
  totalPermissions: number; // Total de permisos habilitados
  usersCount?: number; // Número de usuarios con este rol (opcional)
}

// ============================================
// EXTENDED TYPES
// ============================================

/**
 * Filtros para búsqueda de roles
 */
export interface RoleFilters {
  role_name?: string;
  search?: string; // Búsqueda por nombre o descripción
  hasPermission?: PermissionCheck; // Filtrar por permiso específico
}

/**
 * Opciones de ordenamiento para roles
 */
export type RoleSortBy = "role_name" | "created_at" | "updated_at";

/**
 * Parámetros de consulta para listados de roles
 */
export interface RoleQueryParams {
  page?: number;
  limit?: number;
  sortBy?: RoleSortBy;
  sortOrder?: "asc" | "desc";
  filters?: RoleFilters;
}
