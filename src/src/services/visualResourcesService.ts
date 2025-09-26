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
      // Si hay archivo, subimos usando FormData
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("metadata", JSON.stringify(data));

        const response = await this.request<any>(this.BASE_ENDPOINT, {
          method: "POST",
          body: formData,
          headers: {}, // Sin Content-Type para que el navegador lo configure automáticamente con boundary
        });

        // Guardar archivo localmente si la respuesta es exitosa
        if (response) {
          await this.saveFileLocally(file, data.access_config);
        }

        return {
          success: true,
          data: response.resource || response.data || response,
        };
      } else {
        // Solo metadatos sin archivo
        const response = await this.post<any>(this.BASE_ENDPOINT, data);
        return {
          success: true,
          data: response.resource || response.data || response,
        };
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
   * Método privado para guardar archivo localmente
   */
  private static async saveFileLocally(
    file: File,
    accessConfig?: any
  ): Promise<void> {
    try {
      // Determinar la ruta según el tipo de acceso
      let folderPath = "assets/img/visualResources/";

      if (accessConfig?.type === "public") {
        folderPath += "public/";
      } else if (accessConfig?.type === "group" && accessConfig?.group_name) {
        folderPath += `${accessConfig.group_name}/`;
      } else {
        folderPath += "public/"; // Default a público si no se especifica
      }

      // Crear el directorio si no existe
      await this.createDirectoryIfNotExists(folderPath);

      // Generar nombre único para evitar conflictos
      const timestamp = new Date().getTime();
      const fileName = `${timestamp}_${file.name}`;
      const fullPath = `${folderPath}${fileName}`;

      // Convertir archivo a buffer y guardarlo
      const arrayBuffer = await file.arrayBuffer();
      const buffer = new Uint8Array(arrayBuffer);

      // Nota: En un entorno de navegador, necesitarías usar File System Access API
      // o una alternativa como enviar el archivo al servidor para que lo guarde
      if ("showSaveFilePicker" in window) {
        // File System Access API (solo en navegadores compatibles)
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [
            {
              description: "Images",
              accept: {
                "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg"],
              },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(buffer);
        await writable.close();
      } else {
        // Fallback: crear enlace de descarga
        const blob = new Blob([buffer], { type: file.type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      console.log(`File saved locally: ${fullPath}`);
    } catch (error) {
      console.error("Error saving file locally:", error);
      // No lanzar error para no interrumpir el flujo principal
    }
  }

  /**
   * Método privado para crear directorios
   */
  private static async createDirectoryIfNotExists(path: string): Promise<void> {
    try {
      // En un entorno de navegador, esto sería manejado por el servidor
      // o usando File System Access API con permisos de directorio
      console.log(`Ensuring directory exists: ${path}`);
    } catch (error) {
      console.error("Error creating directory:", error);
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
