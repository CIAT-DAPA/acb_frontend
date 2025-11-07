import { Role } from "@/types/roles";
import { BaseAPIService } from "./apiConfig";

// Interfaz para respuestas de la API
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// Interfaz para la respuesta de listado de roles
export interface GetRolesResponse {
  success: boolean;
  data: Role[];
  total: number;
  message?: string;
}

/**
 * Servicio para gestión de roles
 * Endpoints disponibles:
 * - GET /roles/ - Obtener todos los roles
 * - POST /roles/ - Crear un nuevo rol
 * - GET /roles/{role_id} - Obtener rol por ID
 * - PUT /roles/{role_id} - Actualizar rol
 * - GET /roles/name/{name} - Obtener roles por nombre
 */
export class RoleAPIService extends BaseAPIService {
  /**
   * Obtiene la lista de todos los roles
   * GET /roles/
   */
  static async getRoles(): Promise<GetRolesResponse> {
    try {
      const data = await this.get<any>("/roles/");
      const roles = data.roles || data.data || data;

      // Map API response to match Role interface
      const mappedRoles = Array.isArray(roles)
        ? roles.map((role: any) => ({
            ...role,
            _id: role.id || role._id, // Map 'id' to '_id'
          }))
        : [];

      return {
        success: true,
        data: mappedRoles,
        total: data.total || mappedRoles.length,
      };
    } catch (error) {
      console.error("Error fetching roles:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error ? error.message : "Error al obtener los roles",
      };
    }
  }

  /**
   * Obtiene un rol específico por ID
   * GET /roles/{role_id}
   */
  static async getRoleById(id: string): Promise<APIResponse<Role>> {
    try {
      const data = await this.get<any>(`/roles/${id}`);
      const role = data.role || data.data || data;

      // Map API response to match Role interface
      const mappedRole = {
        ...role,
        _id: role.id || role._id, // Map 'id' to '_id'
      };

      return {
        success: true,
        data: mappedRole,
      };
    } catch (error) {
      console.error("Error fetching role:", error);

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Error al obtener el rol",
      };
    }
  }

  /**
   * Crea un nuevo rol
   * POST /roles/
   */
  static async createRole(
    roleData: Omit<Role, "_id" | "log">
  ): Promise<APIResponse<Role>> {
    try {
      const data = await this.post<any>("/roles/", roleData);

      return {
        success: true,
        data: data.role || data.data || data,
        message: "Rol creado exitosamente",
      };
    } catch (error) {
      console.error("Error creating role:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Error al crear el rol",
      };
    }
  }

  /**
   * Actualiza un rol existente
   * PUT /roles/{role_id}
   */
  static async updateRole(
    id: string,
    roleData: Partial<Role>
  ): Promise<APIResponse<Role>> {
    try {
      const data = await this.put<any>(`/roles/${id}`, roleData);

      return {
        success: true,
        data: data.role || data.data || data,
        message: "Rol actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error updating role:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar el rol",
      };
    }
  }

  /**
   * Obtiene roles filtrados por nombre
   * GET /roles/name/{name}
   */
  static async getRolesByName(name: string): Promise<GetRolesResponse> {
    try {
      const data = await this.get<any>(
        `/roles/name/${encodeURIComponent(name)}`
      );
      const roles = data.roles || data.data || data;

      // Map API response to match Role interface
      const mappedRoles = Array.isArray(roles)
        ? roles.map((role: any) => ({
            ...role,
            _id: role.id || role._id,
          }))
        : [];

      return {
        success: true,
        data: mappedRoles,
        total: mappedRoles.length,
      };
    } catch (error) {
      console.error("Error fetching roles by name:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al buscar roles por nombre",
      };
    }
  }

  /**
   * Verifica si un rol tiene un permiso específico
   * Helper method para validaciones en el frontend
   */
  static hasPermission(
    role: Role,
    module: keyof Role["permissions"],
    operation: "c" | "r" | "u" | "d"
  ): boolean {
    try {
      return role.permissions[module]?.[operation] ?? false;
    } catch (error) {
      console.error("Error checking permission:", error);
      return false;
    }
  }

  /**
   * Calcula el total de permisos habilitados en un rol
   * Helper method para estadísticas
   */
  static getTotalPermissions(role: Role): number {
    try {
      let total = 0;
      Object.values(role.permissions).forEach((modulePermissions) => {
        Object.values(modulePermissions).forEach((value) => {
          if (value) total++;
        });
      });
      return total;
    } catch (error) {
      console.error("Error calculating total permissions:", error);
      return 0;
    }
  }

  /**
   * Obtiene una lista de módulos con permisos habilitados
   * Helper method para mostrar resumen de permisos
   */
  static getEnabledModules(role: Role): string[] {
    try {
      const enabledModules: string[] = [];
      Object.entries(role.permissions).forEach(([module, permissions]) => {
        const hasAnyPermission = Object.values(permissions).some(
          (value) => value
        );
        if (hasAnyPermission) {
          enabledModules.push(module);
        }
      });
      return enabledModules;
    } catch (error) {
      console.error("Error getting enabled modules:", error);
      return [];
    }
  }

  /**
   * Valida que un rol tenga la estructura de permisos correcta
   * Helper method para validación de formularios
   */
  static validateRolePermissions(permissions: Role["permissions"]): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    const requiredModules = [
      "bulletins_composer",
      "template_management",
      "dashboard_bulletins",
      "review",
      "card_management",
      "access_control",
      "external_integrations",
    ];

    // Verificar que todos los módulos requeridos estén presentes
    requiredModules.forEach((module) => {
      if (!(module in permissions)) {
        errors.push(`Falta el módulo de permisos: ${module}`);
      } else {
        const modulePerms = permissions[module as keyof typeof permissions];
        // Verificar que cada módulo tenga las 4 operaciones CRUD
        ["c", "r", "u", "d"].forEach((op) => {
          if (!(op in modulePerms)) {
            errors.push(
              `Falta la operación '${op}' en el módulo: ${module}`
            );
          }
        });
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
