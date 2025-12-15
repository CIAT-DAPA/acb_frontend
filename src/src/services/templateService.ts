import { TemplateMaster, GetTemplatesResponse } from "@/types/api";
import { TemplateStatus } from "@/types/core";
import { TemplateVersion, TemplateWithCurrentVersion } from "@/types/template";
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

// Servicio principal para templates
export class TemplateAPIService extends BaseAPIService {
  /**
   * Obtiene la lista de templates con filtros opcionales
   */
  static async getTemplates(): Promise<GetTemplatesResponse> {
    try {
      const data = await this.get<any>("/templates/");
      const templates = data.templates || data.data || data;

      // Map API response to match TemplateMaster interface
      const mappedTemplates = templates.map((template: any) => ({
        ...template,
        _id: template.id || template._id, // Map 'id' to '_id'
      }));

      return {
        success: true,
        data: mappedTemplates,
        total: data.total || templates.length,
      };
    } catch (error) {
      console.error("Error fetching templates:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener las plantillas",
      };
    }
  }

  /**
   * Obtiene un template específico por ID
   */
  static async getTemplateById(
    id: string
  ): Promise<APIResponse<TemplateMaster>> {
    try {
      const data = await this.get<any>(`/templates/${id}`);
      const template = data.template || data.data || data;

      // Map API response to match TemplateMaster interface
      const mappedTemplate = {
        ...template,
        _id: template.id || template._id, // Map 'id' to '_id'
      };

      return {
        success: true,
        data: mappedTemplate,
      };
    } catch (error) {
      console.error("Error fetching template:", error);

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener la plantilla",
      };
    }
  }

  /**
   * Obtiene todos los slug names de templates existentes
   * GET /templates/slug_name
   */
  static async getAllSlugNames(): Promise<APIResponse<string[]>> {
    try {
      const data = await this.get<any>("/templates/slug_name");
      const slugNames = data.slug_names || data.data || data || [];

      return {
        success: true,
        data: slugNames,
      };
    } catch (error) {
      console.error("Error fetching template slug names:", error);
      return {
        success: false,
        data: [],
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener los nombres máquina",
      };
    }
  }

  /**
   * Crea un nuevo template
   */
  static async createTemplate(
    templateData: Omit<TemplateMaster, "_id" | "log" | "current_version_id">
  ): Promise<APIResponse<TemplateMaster>> {
    try {
      const data = await this.post<any>("/templates/", templateData);

      return {
        success: true,
        data: data.template || data.data || data,
      };
    } catch (error) {
      console.error("Error creating template:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al crear la plantilla",
      };
    }
  }

  /**
   * Actualiza un template existente
   */
  static async updateTemplate(
    id: string,
    templateData: Partial<TemplateMaster>
  ): Promise<APIResponse<TemplateMaster>> {
    try {
      const data = await this.put<any>(`/templates/${id}`, templateData);

      return {
        success: true,
        data: data.template || data.data || data,
      };
    } catch (error) {
      console.error("Error updating template:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar la plantilla",
      };
    }
  }

  /**
   * Obtiene templates filtrados por nombre
   */
  static async getTemplatesByName(name: string): Promise<GetTemplatesResponse> {
    try {
      const data = await this.get<any>(
        `/templates/name/${encodeURIComponent(name)}`
      );

      return {
        success: true,
        data: data.templates || data.data || data,
        total: (data.templates || data.data || data).length,
      };
    } catch (error) {
      console.error("Error fetching templates by name:", error);
      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener las plantillas por nombre",
      };
    }
  }

  /**
   * Obtiene templates filtrados por estado
   */
  static async getTemplatesByStatus(
    status: TemplateStatus
  ): Promise<GetTemplatesResponse> {
    try {
      const data = await this.get<any>(`/templates/status/${status}`);

      return {
        success: true,
        data: data.templates || data.data || data,
        total: (data.templates || data.data || data).length,
      };
    } catch (error) {
      console.error("Error fetching templates by status:", error);
      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener las plantillas por estado",
      };
    }
  }

  /**
   * Obtiene la versión actual de un template junto con la información del master
   * La respuesta del API tiene la estructura: { master: {...}, current_version: {...} }
   */
  static async getCurrentVersion(
    templateId: string
  ): Promise<APIResponse<TemplateWithCurrentVersion>> {
    try {
      const data = await this.get<any>(
        `/templates/${templateId}/current-version`
      );

      // La API devuelve { master, current_version }
      // Normalizar el master para tener _id en lugar de id
      const normalizedMaster: TemplateMaster = {
        ...data.master,
        _id: data.master.id || data.master._id,
      };

      const normalizedVersion: TemplateVersion = {
        ...data.current_version,
        _id: data.current_version.id || data.current_version._id,
      };

      return {
        success: true,
        data: {
          master: normalizedMaster,
          current_version: normalizedVersion,
        },
      };
    } catch (error) {
      console.error("Error fetching current version:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener la versión actual",
      };
    }
  }

  /**
   * Crea una nueva versión de un template
   */
  static async createTemplateVersion(
    templateId: string,
    versionData: any
  ): Promise<APIResponse> {
    try {
      console.log("Creating template version for template ID:", {
        template_master_id: templateId,
        ...versionData,
      });
      const data = await this.post<any>("/templates/versions", {
        template_master_id: templateId,
        ...versionData,
      });

      return {
        success: true,
        data: data.version || data.data || data,
      };
    } catch (error) {
      console.error("Error creating template version:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al crear la versión del template",
      };
    }
  }

  /**
   * Clona un template existente
   */
  static async cloneTemplate(
    templateId: string,
    newTemplateData?: Partial<TemplateMaster>
  ): Promise<APIResponse<TemplateMaster>> {
    try {
      const data = await this.post<any>(
        `/templates/${templateId}/clone`,
        newTemplateData || {}
      );

      return {
        success: true,
        data: data.template || data.data || data,
      };
    } catch (error) {
      console.error("Error cloning template:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al clonar la plantilla",
      };
    }
  }

  /**
   * Obtiene el historial de un template
   */
  static async getTemplateHistory(
    templateId: string
  ): Promise<APIResponse<any[]>> {
    try {
      const data = await this.get<any>(`/templates/${templateId}/history`);

      return {
        success: true,
        data: data.history || data.data || data,
      };
    } catch (error) {
      console.error("Error fetching template history:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener el historial del template",
      };
    }
  }

  /**
   * Obtiene información de un usuario por ID
   */
  static async getUserById(userId: string): Promise<APIResponse<any>> {
    try {
      const data = await this.get<any>(`/users/${userId}`);
      return {
        success: true,
        data: data.user || data.data || data,
      };
    } catch (error) {
      console.error("Error fetching user:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener información del usuario",
      };
    }
  }
}

export default TemplateAPIService;
