import { Group, GroupUserRole } from "@/types/groups";
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

// Interfaz para la respuesta de listado de grupos
export interface GetGroupsResponse {
  success: boolean;
  data: Group[];
  total: number;
  message?: string;
}

// Interfaz para agregar usuario a grupo
export interface AddUserToGroupPayload {
  user_id: string;
  role_id: string;
}

// Interfaz para actualizar rol de usuario en grupo
export interface UpdateUserRolePayload {
  user_id: string;
  role_id: string;
}

// Interfaz para remover usuario de grupo
export interface RemoveUserFromGroupPayload {
  user_id: string;
}

// Interfaz para respuesta de grupos y roles de un usuario
export interface UserGroupsRolesResponse {
  success: boolean;
  data: Array<{
    group_id: string;
    group_name: string;
    role_id: string;
    role_name: string;
  }>;
  message?: string;
}

/**
 * Servicio para gestión de grupos
 * Endpoints disponibles:
 * - GET /groups/ - Listar todos los grupos
 * - POST /groups/ - Crear grupo
 * - GET /groups/by-country/{country_code} - Obtener grupos por país
 * - GET /groups/by-user/{user_id} - Obtener grupos de un usuario
 * - GET /groups/{group_id} - Obtener grupo por ID
 * - PUT /groups/{group_id} - Actualizar grupo
 * - DELETE /groups/{group_id} - Eliminar grupo
 * - POST /groups/{group_id}/add-user - Agregar usuario a grupo
 * - POST /groups/{group_id}/remove-user - Remover usuario de grupo
 * - POST /groups/{group_id}/update-user-role - Actualizar rol de usuario
 * - GET /groups/{group_id}/users - Listar usuarios en grupo
 * - GET /groups/user/{user_id}/groups-roles - Listar grupos y roles de usuario
 * - GET /groups/{group_id}/user/{user_id}/has-role/{role_id} - Verificar si usuario tiene rol
 */
export class GroupAPIService extends BaseAPIService {
  /**
   * Obtiene la lista de todos los grupos
   * GET /groups/
   */
  static async getGroups(): Promise<GetGroupsResponse> {
    try {
      const data = await this.get<any>("/groups/");
      const groups = data.groups || data.data || data;

      // Map API response to match Group interface
      const mappedGroups = Array.isArray(groups)
        ? groups.map((group: any) => ({
            ...group,
            _id: group.id || group._id, // Map 'id' to '_id'
          }))
        : [];

      return {
        success: true,
        data: mappedGroups,
        total: data.total || mappedGroups.length,
      };
    } catch (error) {
      console.error("Error fetching groups:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener los grupos",
      };
    }
  }

  /**
   * Crea un nuevo grupo
   * POST /groups/
   */
  static async createGroup(
    groupData: Omit<Group, "_id" | "log">
  ): Promise<APIResponse<Group>> {
    try {
      const data = await this.post<any>("/groups/", groupData);

      return {
        success: true,
        data: data.group || data.data || data,
        message: "Grupo creado exitosamente",
      };
    } catch (error) {
      console.error("Error creating group:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Error al crear el grupo",
      };
    }
  }

  /**
   * Obtiene grupos filtrados por código de país
   * GET /groups/by-country/{country_code}
   */
  static async getGroupsByCountry(
    countryCode: string
  ): Promise<GetGroupsResponse> {
    try {
      const data = await this.get<any>(`/groups/by-country/${countryCode}`);
      const groups = data.groups || data.data || data;

      // Map API response to match Group interface
      const mappedGroups = Array.isArray(groups)
        ? groups.map((group: any) => ({
            ...group,
            _id: group.id || group._id,
          }))
        : [];

      return {
        success: true,
        data: mappedGroups,
        total: mappedGroups.length,
      };
    } catch (error) {
      console.error("Error fetching groups by country:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al buscar grupos por país",
      };
    }
  }

  /**
   * Obtiene los grupos de un usuario específico
   * GET /groups/by-user/{user_id}
   */
  static async getGroupsByUser(userId: string): Promise<GetGroupsResponse> {
    try {
      const data = await this.get<any>(`/groups/by-user/${userId}`);
      const groups = data.groups || data.data || data;

      // Map API response to match Group interface
      const mappedGroups = Array.isArray(groups)
        ? groups.map((group: any) => ({
            ...group,
            _id: group.id || group._id,
          }))
        : [];

      return {
        success: true,
        data: mappedGroups,
        total: mappedGroups.length,
      };
    } catch (error) {
      console.error("Error fetching groups by user:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener grupos del usuario",
      };
    }
  }

  /**
   * Obtiene un grupo específico por ID
   * GET /groups/{group_id}
   */
  static async getGroupById(id: string): Promise<APIResponse<Group>> {
    try {
      const data = await this.get<any>(`/groups/${id}`);
      const group = data.group || data.data || data;

      // Map API response to match Group interface
      const mappedGroup = {
        ...group,
        _id: group.id || group._id, // Map 'id' to '_id'
      };

      return {
        success: true,
        data: mappedGroup,
      };
    } catch (error) {
      console.error("Error fetching group:", error);

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Error al obtener el grupo",
      };
    }
  }

  /**
   * Actualiza un grupo existente
   * PUT /groups/{group_id}
   */
  static async updateGroup(
    id: string,
    groupData: Partial<Group>
  ): Promise<APIResponse<Group>> {
    try {
      const data = await this.put<any>(`/groups/${id}`, groupData);

      return {
        success: true,
        data: data.group || data.data || data,
        message: "Grupo actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error updating group:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar el grupo",
      };
    }
  }

  /**
   * Elimina un grupo
   * DELETE /groups/{group_id}
   */
  static async deleteGroup(id: string): Promise<APIResponse<void>> {
    try {
      await this.delete(`/groups/${id}`);

      return {
        success: true,
        message: "Grupo eliminado exitosamente",
      };
    } catch (error) {
      console.error("Error deleting group:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al eliminar el grupo",
      };
    }
  }

  /**
   * Agrega un usuario a un grupo con un rol específico
   * POST /groups/{group_id}/add-user
   */
  static async addUserToGroup(
    groupId: string,
    payload: AddUserToGroupPayload
  ): Promise<APIResponse<Group>> {
    try {
      const data = await this.post<any>(
        `/groups/${groupId}/add-user`,
        payload
      );

      return {
        success: true,
        data: data.group || data.data || data,
        message: "Usuario agregado al grupo exitosamente",
      };
    } catch (error) {
      console.error("Error adding user to group:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al agregar usuario al grupo",
      };
    }
  }

  /**
   * Remueve un usuario de un grupo
   * POST /groups/{group_id}/remove-user
   */
  static async removeUserFromGroup(
    groupId: string,
    payload: RemoveUserFromGroupPayload
  ): Promise<APIResponse<Group>> {
    try {
      const data = await this.post<any>(
        `/groups/${groupId}/remove-user`,
        payload
      );

      return {
        success: true,
        data: data.group || data.data || data,
        message: "Usuario removido del grupo exitosamente",
      };
    } catch (error) {
      console.error("Error removing user from group:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al remover usuario del grupo",
      };
    }
  }

  /**
   * Actualiza el rol de un usuario en un grupo
   * POST /groups/{group_id}/update-user-role
   */
  static async updateUserRoleInGroup(
    groupId: string,
    payload: UpdateUserRolePayload
  ): Promise<APIResponse<Group>> {
    try {
      const data = await this.post<any>(
        `/groups/${groupId}/update-user-role`,
        payload
      );

      return {
        success: true,
        data: data.group || data.data || data,
        message: "Rol de usuario actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error updating user role in group:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar rol del usuario",
      };
    }
  }

  /**
   * Obtiene la lista de usuarios en un grupo
   * GET /groups/{group_id}/users
   */
  static async getUsersInGroup(
    groupId: string
  ): Promise<APIResponse<GroupUserRole[]>> {
    try {
      const data = await this.get<any>(`/groups/${groupId}/users`);
      const users = data.users || data.users_access || data.data || [];

      return {
        success: true,
        data: users,
        total: users.length,
      };
    } catch (error) {
      console.error("Error fetching users in group:", error);

      return {
        success: false,
        data: [],
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener usuarios del grupo",
      };
    }
  }

  /**
   * Obtiene los grupos y roles de un usuario
   * GET /groups/user/{user_id}/groups-roles
   */
  static async getUserGroupsAndRoles(
    userId: string
  ): Promise<UserGroupsRolesResponse> {
    try {
      const data = await this.get<any>(`/groups/user/${userId}/groups-roles`);
      const groupsRoles = data.groups_roles || data.data || [];

      return {
        success: true,
        data: groupsRoles,
      };
    } catch (error) {
      console.error("Error fetching user groups and roles:", error);

      return {
        success: false,
        data: [],
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener grupos y roles del usuario",
      };
    }
  }

  /**
   * Verifica si un usuario tiene un rol específico en un grupo
   * GET /groups/{group_id}/user/{user_id}/has-role/{role_id}
   */
  static async userHasRoleInGroup(
    groupId: string,
    userId: string,
    roleId: string
  ): Promise<APIResponse<{ has_role: boolean }>> {
    try {
      const data = await this.get<any>(
        `/groups/${groupId}/user/${userId}/has-role/${roleId}`
      );

      return {
        success: true,
        data: {
          has_role: data.has_role || data.data?.has_role || false,
        },
      };
    } catch (error) {
      console.error("Error checking user role in group:", error);

      return {
        success: false,
        data: { has_role: false },
        message:
          error instanceof Error
            ? error.message
            : "Error al verificar rol del usuario",
      };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Verifica si un usuario es miembro de un grupo
   */
  static isUserInGroup(group: Group, userId: string): boolean {
    try {
      return group.users_access.some((user) => user.user_id === userId);
    } catch (error) {
      console.error("Error checking if user is in group:", error);
      return false;
    }
  }

  /**
   * Obtiene el rol de un usuario en un grupo
   */
  static getUserRoleInGroup(
    group: Group,
    userId: string
  ): string | null {
    try {
      const userRole = group.users_access.find(
        (user) => user.user_id === userId
      );
      return userRole?.role_id || null;
    } catch (error) {
      console.error("Error getting user role in group:", error);
      return null;
    }
  }

  /**
   * Cuenta el número de usuarios en un grupo
   */
  static getUserCount(group: Group): number {
    try {
      return group.users_access?.length || 0;
    } catch (error) {
      console.error("Error counting users in group:", error);
      return 0;
    }
  }

  /**
   * Obtiene los IDs únicos de roles en un grupo
   */
  static getUniqueRolesInGroup(group: Group): string[] {
    try {
      const roleIds = group.users_access.map((user) => user.role_id);
      return [...new Set(roleIds)];
    } catch (error) {
      console.error("Error getting unique roles in group:", error);
      return [];
    }
  }

  /**
   * Cuenta cuántos usuarios tienen un rol específico en un grupo
   */
  static countUsersWithRole(group: Group, roleId: string): number {
    try {
      return group.users_access.filter((user) => user.role_id === roleId)
        .length;
    } catch (error) {
      console.error("Error counting users with role:", error);
      return 0;
    }
  }

  /**
   * Valida que los datos de un grupo sean correctos
   */
  static validateGroupData(groupData: Partial<Group>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (groupData.group_name && groupData.group_name.trim().length === 0) {
      errors.push("El nombre del grupo no puede estar vacío");
    }

    if (groupData.country) {
      // Validar código ISO 2
      if (groupData.country.length !== 2) {
        errors.push("El código de país debe tener 2 caracteres (ISO 2)");
      }
      if (!/^[A-Z]{2}$/.test(groupData.country)) {
        errors.push("El código de país debe estar en mayúsculas (ej: CO, VN)");
      }
    }

    if (
      groupData.description &&
      groupData.description.trim().length === 0
    ) {
      errors.push("La descripción no puede estar vacía");
    }

    if (groupData.users_access) {
      groupData.users_access.forEach((user, index) => {
        if (!user.user_id || user.user_id.trim().length === 0) {
          errors.push(`Usuario en posición ${index}: user_id no puede estar vacío`);
        }
        if (!user.role_id || user.role_id.trim().length === 0) {
          errors.push(`Usuario en posición ${index}: role_id no puede estar vacío`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Formatea un grupo con estadísticas adicionales
   */
  static getGroupWithStats(group: Group) {
    return {
      ...group,
      usersCount: this.getUserCount(group),
      rolesCount: this.getUniqueRolesInGroup(group).length,
    };
  }
}
