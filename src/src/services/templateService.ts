import {
  TemplateMaster,
  TemplateUIModel,
  GetTemplatesResponse,
  GetTemplatesParams,
} from "@/types/api";
import { TemplateStatus } from "@/types/core";
import { BaseAPIService } from "./apiConfig";

// Datos mock de usuarios (mantenemos para el mapeo temporal)
const MOCK_USERS: Record<string, string> = {
  "66b44a30e8d7f3e1f2b3c4d6": "Ana García",
  "66b44a30e8d7f3e1f2b3c4d8": "Carlos Rodríguez",
  "66a33b20d7c6e2f1e3b4c5d7": "María López",
  "66e9a4c3e5d7a2b1c9f0e8d6": "Juan Pérez",
  "66f8b5d4f6e8b3c2d0a1f9e7": "Laura Martínez",
};

// Datos mock de templates (para fallback durante desarrollo)
const MOCK_TEMPLATES: TemplateMaster[] = [
  {
    _id: "66b44a30e8d7f3e1f2b3c4d5",
    template_name: "Boletín Agroclimático de Café - Nariño",
    description:
      "Plantilla estándar para boletines de café en la región de Nariño, enfocada en clima y recomendaciones.",
    log: {
      created_at: "2025-07-01T10:00:00Z",
      creator_user_id: "66b44a30e8d7f3e1f2b3c4d6",
      updated_at: "2025-08-14T15:00:00Z",
      updater_user_id: "66b44a30e8d7f3e1f2b3c4d8",
    },
    status: "activa",
    current_version_id: "66b44a30e8d7f3e1f2b3c4d7",
    access_config: {
      access_type: "restricted",
      allowed_groups: ["66b44a30e8d7f3e1f2b3c4da", "66c5e7b8c2d1e2f3a4b5c6d7"],
    },
  },
  // Agregar más datos mock según necesites...
];

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
  const authorName = template.log?.creator_user_id
    ? MOCK_USERS[template.log.creator_user_id] || "Usuario Desconocido"
    : "Usuario Desconocido";

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

      // Fallback a datos mock en desarrollo
      if (process.env.NODE_ENV === "development") {
        console.warn("Usando datos mock como fallback");
        return this.getMockTemplates(params);
      }

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

      if (process.env.NODE_ENV === "development") {
        console.warn("Usando datos mock como fallback");
        const template = MOCK_TEMPLATES.find((t) => t._id === id);

        if (!template) {
          return { success: false, message: "Plantilla no encontrada" };
        }

        return { success: true, data: template };
      }

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
   * Convierte templates de la API al formato de UI
   */
  static mapTemplatesToUI(templates: TemplateMaster[]): TemplateUIModel[] {
    return templates.map(mapToUIModel);
  }

  /**
   * Método privado para obtener datos mock con filtros aplicados
   */
  private static getMockTemplates(
    params: GetTemplatesParams = {}
  ): GetTemplatesResponse {
    let filteredTemplates = [...MOCK_TEMPLATES];

    // Aplicar filtros mock
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      filteredTemplates = filteredTemplates.filter(
        (template) =>
          template.template_name.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm)
      );
    }

    if (params.status) {
      filteredTemplates = filteredTemplates.filter(
        (template) => template.status === params.status
      );
    }

    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTemplates = filteredTemplates.slice(startIndex, endIndex);

    return {
      success: true,
      data: paginatedTemplates,
      total: filteredTemplates.length,
      page,
      limit,
    };
  }
}

export default TemplateAPIService;
