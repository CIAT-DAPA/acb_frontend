import { BaseAPIService } from "./apiConfig";
import {
  VisualResource,
  VisualResourceFileType,
  VisualResourceStatus,
} from "../types/visualResource";

// Interfaz para respuestas de la API
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
}

// Interfaces para requests específicos
interface CreateVisualResourceRequest {
  file_name: string;
  file_type: VisualResourceFileType;
  status?: VisualResourceStatus;
  access_config?: any;
}

interface UpdateVisualResourceRequest {
  file_name?: string;
  file_type?: VisualResourceFileType;
  status?: VisualResourceStatus;
  access_config?: any;
}

// Servicio para Visual Resources
export class VisualResourcesService extends BaseAPIService {
  private static readonly BASE_ENDPOINT = "/visual-resources";

  /**
   * GET /visual-resources/ - Get All Visual Resources
   */
  static async getAllVisualResources(): Promise<APIResponse<VisualResource[]>> {
    try {
      const data = await this.get<any>(this.BASE_ENDPOINT);
      const resources = data.resources || data.data || data;

      return {
        success: true,
        data: resources,
        total: data.total || resources.length,
      };
    } catch (error) {
      console.error("Error fetching visual resources:", error);
      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener los recursos visuales",
      };
    }
  }

  /**
   * POST /visual-resources/ - Create Visual Resource
   */
  static async createVisualResource(
    data: CreateVisualResourceRequest,
    file?: File
  ): Promise<APIResponse<VisualResource>> {
    try {
      // Si hay archivo, lo procesamos
      if (file) {
        // 1. Determinar la ruta donde se guardará el archivo
        const folderPath = this.getFolderPath(data.access_config);
        const fileName = this.generateFileName(file, data.file_name);
        const file_url = `${folderPath}${fileName}`;

        // 2. Subir el archivo al servidor
        const uploadSuccess = await this.uploadFileToServer(file, file_url);

        if (!uploadSuccess) {
          throw new Error("Error al subir el archivo al servidor");
        }

        // 3. Preparar el body para la API
        const apiBody = {
          file_url: file_url,
          file_name: data.file_name,
          file_type: data.file_type,
          status: data.status || "active",
          access_config: {
            access_type: data.access_config?.type || "public",
            allowed_groups:
              data.access_config?.type === "group"
                ? [data.access_config.group_name]
                : [],
          },
        };

        // 4. Llamar a la API
        const response = await this.post<any>(this.BASE_ENDPOINT, apiBody);

        return {
          success: true,
          data: response.resource || response.data || response,
        };
      } else {
        // Solo metadatos sin archivo - esto probablemente no debería ocurrir
        throw new Error("Se requiere un archivo para crear un recurso visual");
      }
    } catch (error) {
      console.error("Error creating visual resource:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al crear el recurso visual",
      };
    }
  }

  /**
   * Determinar la ruta de la carpeta según el tipo de acceso
   */
  private static getFolderPath(accessConfig?: any): string {
    let folderPath = "/assets/img/visualResources/";

    if (accessConfig?.type === "public") {
      folderPath += "public/";
    } else if (accessConfig?.type === "group" && accessConfig?.group_name) {
      folderPath += `${accessConfig.group_name}/`;
    } else {
      folderPath += "public/"; // Default a público
    }

    return folderPath;
  }

  /**
   * Generar nombre de archivo único
   */
  private static generateFileName(file: File, finalFileName?: string): string {
    const timestamp = new Date().getTime();

    if (finalFileName?.trim()) {
      // Si ya tenemos un nombre final, solo agregamos timestamp para evitar conflictos
      const nameParts = finalFileName.split(".");
      if (nameParts.length > 1) {
        const extension = nameParts.pop();
        const nameWithoutExt = nameParts.join(".");
        return `${timestamp}_${nameWithoutExt}.${extension}`;
      } else {
        return `${timestamp}_${finalFileName}`;
      }
    } else {
      // Fallback al nombre original del archivo
      const fileName = file.name || `unnamed_file_${timestamp}`;
      return `${timestamp}_${fileName}`;
    }
  }

  /**
   * Subir archivo al servidor
   */
  private static async uploadFileToServer(
    file: File,
    targetPath: string
  ): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetPath", targetPath);

      // Llamar al endpoint de Next.js para subir archivos físicamente
      const response = await fetch("/api/upload-visual-resource", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      return result && result.success;
    } catch (error) {
      console.error("Error uploading file to server:", error);
      return false;
    }
  }

  /**
   * PUT /visual-resources/{resource_id} - Update Visual Resource
   */
  static async updateVisualResource(
    resourceId: string,
    data: UpdateVisualResourceRequest
  ): Promise<APIResponse<VisualResource>> {
    try {
      const response = await this.put<any>(
        `${this.BASE_ENDPOINT}/${resourceId}`,
        data
      );
      return {
        success: true,
        data: response.resource || response.data || response,
      };
    } catch (error) {
      console.error("Error updating visual resource:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar el recurso visual",
      };
    }
  }

  /**
   * GET /visual-resources/{resource_id} - Get Visual Resource By Id
   */
  static async getVisualResourceById(
    resourceId: string
  ): Promise<APIResponse<VisualResource>> {
    try {
      const data = await this.get<any>(`${this.BASE_ENDPOINT}/${resourceId}`);
      return {
        success: true,
        data: data.resource || data.data || data,
      };
    } catch (error) {
      console.error("Error fetching visual resource:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener el recurso visual",
      };
    }
  }

  /**
   * GET /visual-resources/name/{name} - Get Visual Resources By Name
   */
  static async getVisualResourcesByName(
    name: string
  ): Promise<APIResponse<VisualResource[]>> {
    try {
      const endpoint = `${this.BASE_ENDPOINT}/name/${encodeURIComponent(name)}`;
      const data = await this.get<any>(endpoint);
      const resources = data.resources || data.data || data;

      return {
        success: true,
        data: resources,
        total: data.total || resources.length,
      };
    } catch (error) {
      console.error("Error fetching visual resources by name:", error);
      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener recursos por nombre",
      };
    }
  }

  /**
   * GET /visual-resources/status/{status} - Get Visual Resources By Status
   */
  static async getVisualResourcesByStatus(
    status: VisualResourceStatus
  ): Promise<APIResponse<VisualResource[]>> {
    try {
      const endpoint = `${this.BASE_ENDPOINT}/status/${status}`;
      const data = await this.get<any>(endpoint);
      const resources = data.resources || data.data || data;

      return {
        success: true,
        data: resources,
        total: data.total || resources.length,
      };
    } catch (error) {
      console.error("Error fetching visual resources by status:", error);
      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener recursos por estado",
      };
    }
  }

  /**
   * GET /visual-resources/type/{file_type} - Get Visual Resources By File Type
   */
  static async getVisualResourcesByType(
    fileType: VisualResourceFileType
  ): Promise<APIResponse<VisualResource[]>> {
    try {
      const endpoint = `${this.BASE_ENDPOINT}/type/${fileType}`;
      const data = await this.get<any>(endpoint);
      const resources = data.resources || data.data || data;

      return {
        success: true,
        data: resources,
        total: data.total || resources.length,
      };
    } catch (error) {
      console.error("Error fetching visual resources by type:", error);
      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener recursos por tipo",
      };
    }
  }

  /**
   * DELETE /visual-resources/{resource_id} - Delete Visual Resource
   */
  static async deleteVisualResource(resourceId: string): Promise<APIResponse> {
    try {
      await this.delete<void>(`${this.BASE_ENDPOINT}/${resourceId}`);
      return {
        success: true,
        message: "Recurso visual eliminado correctamente",
      };
    } catch (error) {
      console.error("Error deleting visual resource:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al eliminar el recurso visual",
      };
    }
  }

  /**
   * POST /visual-resources/upload - Upload Visual Resource with file
   * Método para subir archivos usando FormData
   */
  static async uploadVisualResource(
    file: File,
    metadata: CreateVisualResourceRequest
  ): Promise<APIResponse<VisualResource>> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("metadata", JSON.stringify(metadata));

      const response = await this.request<any>(`${this.BASE_ENDPOINT}`, {
        method: "POST",
        body: formData,
        headers: {},
      });

      return {
        success: true,
        data: response.resource || response.data || response,
      };
    } catch (error) {
      console.error("Error uploading visual resource:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al subir el recurso visual",
      };
    }
  }

  /**
   * GET /groups - Get Available Groups (endpoint asumido)
   * Método para obtener grupos disponibles
   */
  static async getAvailableGroups(): Promise<{
    success: boolean;
    data: string[];
  }> {
    try {
      const groups = await this.get<string[]>("/groups");
      return { success: true, data: groups };
    } catch (error) {
      console.error("Error fetching available groups:", error);
      return { success: false, data: [] };
    }
  }
}

// Exportar tipos útiles para uso en componentes
export type {
  CreateVisualResourceRequest,
  UpdateVisualResourceRequest,
  APIResponse,
};

// Helper functions para uso común
export const visualResourcesHelpers = {
  /**
   * Verifica si un tipo de archivo es válido
   */
  isValidFileType: (type: string): type is VisualResourceFileType => {
    return ["image", "icon"].includes(type);
  },

  /**
   * Verifica si un estado es válido
   */
  isValidStatus: (status: string): status is VisualResourceStatus => {
    return ["active", "archived"].includes(status);
  },

  /**
   * Obtiene la URL completa de un recurso visual
   */
  getResourceURL: (filePath: string): string => {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";
    return `${baseUrl}${filePath}`;
  },
};

export default VisualResourcesService;
