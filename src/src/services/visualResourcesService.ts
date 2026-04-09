import { BaseAPIService } from "./apiConfig";
import {
  VisualResource,
  VisualResourceFileType,
  VisualResourceStatus,
} from "../types/visualResource";
import { normalizeAssetUrl } from "@/utils/assetUrl";

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

  private static normalizeResource<T extends { file_url?: string }>(
    resource: T,
  ): T {
    if (!resource || typeof resource !== "object") {
      return resource;
    }

    return {
      ...resource,
      file_url:
        typeof resource.file_url === "string"
          ? normalizeAssetUrl(resource.file_url)
          : resource.file_url,
    };
  }

  private static normalizeResources<T extends { file_url?: string }>(
    resources: T[] = [],
  ): T[] {
    return resources.map((resource) => this.normalizeResource(resource));
  }

  /**
   * GET /visual-resources/ - Get All Visual Resources
   */
  static async getAllVisualResources(): Promise<APIResponse<VisualResource[]>> {
    try {
      const data = await this.get<any>(this.BASE_ENDPOINT);
      const resources = this.normalizeResources<VisualResource>(
        data.resources || data.data || data,
      );

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
    file?: File,
  ): Promise<APIResponse<VisualResource>> {
    try {
      // Si hay archivo, lo procesamos
      if (file) {
        // 1. Determinar la ruta donde se guardará el archivo
        const folderPath = this.getFolderPath(data.access_config);
        const fileName = this.generateFileName(file, data.file_name);
        const staticFileUrl = `${folderPath}${fileName}`;

        // 2. Subir el archivo al servidor
        const uploadedFileUrl = await this.uploadFileToServer(
          file,
          staticFileUrl,
        );

        if (!uploadedFileUrl) {
          throw new Error("Error al subir el archivo al servidor");
        }

        const file_url = normalizeAssetUrl(uploadedFileUrl);

        // 3. Preparar el body para la API
        const normalizedAccessType =
          data.access_config?.type === "group"
            ? "restricted"
            : data.access_config?.type || "public";

        const allowedGroups =
          normalizedAccessType === "restricted"
            ? Array.isArray(data.access_config?.allowed_groups)
              ? data.access_config.allowed_groups
              : data.access_config?.group_name
                ? [data.access_config.group_name]
                : []
            : [];

        const apiBody = {
          file_url: file_url,
          file_name: data.file_name,
          file_type: data.file_type,
          status: data.status || "active",
          access_config: {
            access_type: normalizedAccessType,
            allowed_groups: allowedGroups,
          },
        };

        // 4. Llamar a la API
        const response = await this.post<any>(
          this.BASE_ENDPOINT + "/",
          apiBody,
        );

        const createdResource = this.normalizeResource<VisualResource>(
          response.resource || response.data || response,
        );

        return {
          success: true,
          data: createdResource,
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

    const accessType =
      accessConfig?.type === "group" ? "restricted" : accessConfig?.type;

    if (accessType === "public") {
      folderPath += "public/";
    } else if (accessType === "restricted") {
      folderPath += "restricted/";
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
    targetPath: string,
  ): Promise<string | null> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("targetPath", targetPath);

      // Llamar al endpoint de Next.js para subir archivos físicamente
      const response = await fetch("/api/upload-visual-resource/", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        return null;
      }

      const result = await response.json();
      if (result && result.success) {
        return normalizeAssetUrl(result.path || targetPath);
      }

      return null;
    } catch (error) {
      console.error("Error uploading file to server:", error);
      return null;
    }
  }

  /**
   * PUT /visual-resources/{resource_id} - Update Visual Resource
   */
  static async updateVisualResource(
    resourceId: string,
    data: UpdateVisualResourceRequest,
  ): Promise<APIResponse<VisualResource>> {
    try {
      const response = await this.put<any>(
        `${this.BASE_ENDPOINT}/${resourceId}`,
        data,
      );
      return {
        success: true,
        data: this.normalizeResource<VisualResource>(
          response.resource || response.data || response,
        ),
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
    resourceId: string,
  ): Promise<APIResponse<VisualResource>> {
    try {
      const data = await this.get<any>(`${this.BASE_ENDPOINT}/${resourceId}`);
      return {
        success: true,
        data: this.normalizeResource<VisualResource>(
          data.resource || data.data || data,
        ),
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
    name: string,
  ): Promise<APIResponse<VisualResource[]>> {
    try {
      const endpoint = `${this.BASE_ENDPOINT}/name/${encodeURIComponent(name)}`;
      const data = await this.get<any>(endpoint);
      const resources = this.normalizeResources<VisualResource>(
        data.resources || data.data || data,
      );

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
    status: VisualResourceStatus,
  ): Promise<APIResponse<VisualResource[]>> {
    try {
      const endpoint = `${this.BASE_ENDPOINT}/status/${status}`;
      const data = await this.get<any>(endpoint);
      const resources = this.normalizeResources<VisualResource>(
        data.resources || data.data || data,
      );

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
    fileType: VisualResourceFileType,
  ): Promise<APIResponse<VisualResource[]>> {
    try {
      const endpoint = `${this.BASE_ENDPOINT}/type/${fileType}`;
      const data = await this.get<any>(endpoint);
      const resources = this.normalizeResources<VisualResource>(
        data.resources || data.data || data,
      );

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
   * DELETE /visual-resources/{resource_id} - Archive Visual Resource
   * Cambia el estado del recurso visual a "archived" en lugar de eliminarlo físicamente
   */
  static async deleteVisualResource(resourceId: string): Promise<APIResponse> {
    try {
      const response = await this.put<any>(
        `${this.BASE_ENDPOINT}/${resourceId}`,
        { status: "archived" },
      );
      return {
        success: true,
        data: response.resource || response.data || response,
        message: "Recurso visual archivado correctamente",
      };
    } catch (error) {
      console.error("Error archiving visual resource:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al archivar el recurso visual",
      };
    }
  }

  /**
   * POST /visual-resources/upload - Upload Visual Resource with file
   * Método para subir archivos usando FormData
   */
  static async uploadVisualResource(
    file: File,
    metadata: CreateVisualResourceRequest,
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
        data: this.normalizeResource<VisualResource>(
          response.resource || response.data || response,
        ),
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
    const normalizedUrl = normalizeAssetUrl(filePath);

    if (
      normalizedUrl.startsWith("http://") ||
      normalizedUrl.startsWith("https://")
    ) {
      return normalizedUrl;
    }

    if (typeof window !== "undefined") {
      return `${window.location.origin}${normalizedUrl}`;
    }

    return normalizedUrl;
  },
};

export default VisualResourcesService;
