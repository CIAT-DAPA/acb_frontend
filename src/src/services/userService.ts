import {
  User,
  CreateUserData,
  UpdateUserData,
  UserAPIResponse,
  UsersListAPIResponse,
  UserFilters,
  UserPaginationParams,
} from "@/types/user";
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

/**
 * Servicio para gestión de usuarios
 * Endpoints disponibles:
 * - POST /users/ - Crear un nuevo usuario
 * - GET /users/ - Obtener todos los usuarios
 * - PUT /users/{user_id} - Actualizar usuario
 * - GET /users/{user_id} - Obtener usuario por ID
 * - GET /users/ext-id/{ext_id} - Obtener usuario por ID externo
 * - GET /users/name/{name} - Obtener usuarios por nombre
 * - PUT /users/{user_id}/activate - Activar usuario
 * - PUT /users/{user_id}/deactivate - Desactivar usuario
 */
export class UserService extends BaseAPIService {
  private static readonly BASE_ENDPOINT = "/users";

  /**
   * POST /users/ - Crear un nuevo usuario
   * @param userData - Datos del usuario a crear
   * @returns Respuesta con el usuario creado
   */
  static async createUser(
    userData: CreateUserData
  ): Promise<APIResponse<User>> {
    try {
      const data = await this.post<any>(this.BASE_ENDPOINT, userData);

      return {
        success: true,
        data: data.user || data.data || data,
        message: "Usuario creado exitosamente",
      };
    } catch (error) {
      console.error("Error creating user:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Error al crear el usuario",
      };
    }
  }

  /**
   * GET /users/ - Obtener todos los usuarios
   * @param filters - Filtros opcionales de búsqueda
   * @param pagination - Parámetros de paginación
   * @returns Lista de usuarios con información de paginación
   */
  static async getAllUsers(
    filters?: UserFilters,
    pagination?: UserPaginationParams
  ): Promise<APIResponse<User[]>> {
    try {
      // Construir query params
      const params = new URLSearchParams();

      if (filters?.is_active !== undefined) {
        params.append("is_active", filters.is_active.toString());
      }
      if (filters?.search) {
        params.append("search", filters.search);
      }
      if (filters?.ext_id) {
        params.append("ext_id", filters.ext_id);
      }

      if (pagination?.page) {
        params.append("page", pagination.page.toString());
      }
      if (pagination?.limit) {
        params.append("limit", pagination.limit.toString());
      }
      if (pagination?.sortBy) {
        params.append("sort_by", pagination.sortBy);
      }
      if (pagination?.sortOrder) {
        params.append("sort_order", pagination.sortOrder);
      }

      const queryString = params.toString();
      const endpoint = queryString
        ? `${this.BASE_ENDPOINT}?${queryString}/`
        : this.BASE_ENDPOINT + "/";

      const data = await this.get<any>(endpoint);
      const users = data.users || data.data || data;

      return {
        success: true,
        data: Array.isArray(users) ? users : [],
        total: data.total || (Array.isArray(users) ? users.length : 0),
        page: data.page || pagination?.page || 1,
        limit: data.limit || pagination?.limit || 10,
      };
    } catch (error) {
      console.error("Error fetching users:", error);
      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener los usuarios",
      };
    }
  }

  /**
   * PUT /users/{user_id} - Actualizar un usuario
   * @param userId - ID del usuario a actualizar
   * @param userData - Datos a actualizar
   * @returns Respuesta con el usuario actualizado
   */
  static async updateUser(
    userId: string,
    userData: Partial<UpdateUserData>
  ): Promise<APIResponse<User>> {
    try {
      const data = await this.put<any>(
        `${this.BASE_ENDPOINT}/${userId}`,
        userData
      );

      return {
        success: true,
        data: data.user || data.data || data,
        message: "Usuario actualizado exitosamente",
      };
    } catch (error) {
      console.error("Error updating user:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar el usuario",
      };
    }
  }

  /**
   * GET /users/{user_id} - Obtener usuario por ID
   * @param userId - ID del usuario
   * @returns Usuario encontrado
   */
  static async getUserById(userId: string): Promise<APIResponse<User>> {
    try {
      const data = await this.get<any>(`${this.BASE_ENDPOINT}/${userId}`);

      return {
        success: true,
        data: data.user || data.data || data,
      };
    } catch (error) {
      console.error("Error fetching user by id:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener el usuario",
      };
    }
  }

  /**
   * GET /users/ext-id/{ext_id} - Obtener usuario por ID externo
   * @param extId - ID externo del usuario (del proveedor de autenticación)
   * @returns Usuario encontrado
   */
  static async getUserByExtId(extId: string): Promise<APIResponse<User>> {
    try {
      const data = await this.get<any>(`${this.BASE_ENDPOINT}/ext-id/${extId}`);

      return {
        success: true,
        data: data.user || data.data || data,
      };
    } catch (error) {
      console.error("Error fetching user by ext_id:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener el usuario por ID externo",
      };
    }
  }

  /**
   * GET /users/name/{name} - Obtener usuarios por nombre
   * @param name - Nombre o apellido a buscar
   * @returns Lista de usuarios que coinciden con el nombre
   */
  static async getUsersByName(name: string): Promise<APIResponse<User[]>> {
    try {
      const data = await this.get<any>(`${this.BASE_ENDPOINT}/name/${name}`);
      const users = data.users || data.data || data;

      return {
        success: true,
        data: Array.isArray(users) ? users : [],
        total: Array.isArray(users) ? users.length : 0,
      };
    } catch (error) {
      console.error("Error fetching users by name:", error);
      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al buscar usuarios por nombre",
      };
    }
  }

  /**
   * PUT /users/{user_id}/activate - Activar un usuario
   * @param userId - ID del usuario a activar
   * @returns Usuario activado
   */
  static async activateUser(userId: string): Promise<APIResponse<User>> {
    try {
      const data = await this.put<any>(
        `${this.BASE_ENDPOINT}/${userId}/activate`,
        {}
      );

      return {
        success: true,
        data: data.user || data.data || data,
        message: "Usuario activado exitosamente",
      };
    } catch (error) {
      console.error("Error activating user:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al activar el usuario",
      };
    }
  }

  /**
   * PUT /users/{user_id}/deactivate - Desactivar un usuario
   * @param userId - ID del usuario a desactivar
   * @returns Usuario desactivado
   */
  static async deactivateUser(userId: string): Promise<APIResponse<User>> {
    try {
      const data = await this.put<any>(
        `${this.BASE_ENDPOINT}/${userId}/deactivate`,
        {}
      );

      return {
        success: true,
        data: data.user || data.data || data,
        message: "Usuario desactivado exitosamente",
      };
    } catch (error) {
      console.error("Error deactivating user:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al desactivar el usuario",
      };
    }
  }

  /**
   * Método auxiliar para buscar usuarios con filtros avanzados
   * Combina búsqueda por nombre y otros filtros
   */
  static async searchUsers(
    searchTerm: string,
    filters?: Omit<UserFilters, "search">,
    pagination?: UserPaginationParams
  ): Promise<APIResponse<User[]>> {
    return this.getAllUsers(
      {
        ...filters,
        search: searchTerm,
      },
      pagination
    );
  }

  /**
   * Método auxiliar para obtener solo usuarios activos
   */
  static async getActiveUsers(
    pagination?: UserPaginationParams
  ): Promise<APIResponse<User[]>> {
    return this.getAllUsers(
      {
        is_active: true,
      },
      pagination
    );
  }

  /**
   * Método auxiliar para obtener solo usuarios inactivos
   */
  static async getInactiveUsers(
    pagination?: UserPaginationParams
  ): Promise<APIResponse<User[]>> {
    return this.getAllUsers(
      {
        is_active: false,
      },
      pagination
    );
  }
}
