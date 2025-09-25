import {
  TemplateMaster,
  TemplateUIModel,
  GetTemplatesResponse,
  GetTemplatesParams,
} from "@/types/api";
import { TemplateStatus } from "@/types/core";
import { BaseAPIService } from "./apiConfig";

// Función para formatear fechas
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Función para mapear TemplateMaster a TemplateUIModel
const mapToUIModel = (template: TemplateMaster): TemplateUIModel => {
  // Obtener el nombre del autor desde los datos disponibles en el template
  let authorName = "Usuario Desconocido";

  // Si el template incluye información expandida del usuario, usarla
  if ((template as any).creator_info?.name) {
    authorName = (template as any).creator_info.name;
  } else if ((template as any).creator_info?.username) {
    authorName = (template as any).creator_info.username;
  } else if (template.log?.creator_user_id) {
    // Fallback mostrando los últimos 8 caracteres del ID
    authorName = `Usuario ${template.log.creator_user_id.slice(-8)}`;
  }

  // Asignar imágenes de ejemplo basadas en el nombre del template
  let image: string | undefined;
  if (template.template_name?.toLowerCase().includes("café")) {
    image = "/assets/img/temp1.jpg";
  } else if (template.template_name?.toLowerCase().includes("arroz")) {
    image = "/assets/img/bol2.jpg";
  } else if (template.template_name?.toLowerCase().includes("maíz")) {
    image = "/assets/img/temp1.jpg";
  }

  return {
    id: template._id,
    name: template.template_name || "Sin nombre",
    description: template.description || "Sin descripción",
    author: authorName,
    lastModified: formatDate(
      template.log?.updated_at ||
        template.log?.created_at ||
        new Date().toISOString()
    ),
    status: template.status || "inactiva",
    image,
  };
};

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
  static async getTemplates(
    params: GetTemplatesParams = {}
  ): Promise<GetTemplatesResponse> {
    try {
      const data = await this.get<any>("/templates/", params);

      return {
        success: true,
        data: data.templates || data.data || data,
        total: data.total || (data.templates || data.data || data).length,
        page: data.page || params.page || 1,
        limit: data.limit || params.limit || 10,
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

      return {
        success: true,
        data: data.template || data.data || data,
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
   * Obtiene la versión actual de un template
   */
  static async getCurrentVersion(templateId: string): Promise<APIResponse> {
    try {
      const data = await this.get<any>(
        `/templates/${templateId}/current-version`
      );

      return {
        success: true,
        data: data.version || data.data || data,
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
      const data = await this.post<any>("/templates/versions", {
        template_id: templateId,
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

  /**
   * Convierte templates de la API al formato de UI
   */
  static mapTemplatesToUI(templates: TemplateMaster[]): TemplateUIModel[] {
    return templates.map(mapToUIModel);
  }
}

export default TemplateAPIService;
