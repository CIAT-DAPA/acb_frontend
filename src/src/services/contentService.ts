// Servicio adaptador para unificar el acceso a Templates y Bulletins
// Proporciona una interfaz común para trabajar con ambos tipos de contenido

import { TemplateAPIService } from "./templateService";
import { BulletinAPIService } from "./bulletinService";
import {
  ContentType,
  NormalizedContent,
  NormalizedMaster,
  NormalizedVersion,
} from "@/types/content";

// Interfaz para respuestas de la API
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * Servicio adaptador que normaliza Templates y Bulletins
 * a una estructura común para facilitar el trabajo con ambos
 */
export class ContentService {
  /**
   * Obtiene contenido normalizado (template o bulletin) por ID
   * @param type - Tipo de contenido ("template" o "bulletin")
   * @param id - ID del contenido a cargar
   * @returns Contenido normalizado o error
   */
  static async getContent(
    type: ContentType,
    id: string
  ): Promise<APIResponse<NormalizedContent>> {
    try {
      if (type === "template") {
        return await this.getTemplateAsNormalized(id);
      } else {
        return await this.getBulletinAsNormalized(id);
      }
    } catch (error) {
      console.error(`Error loading ${type}:`, error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : `Error al cargar ${type === "template" ? "la plantilla" : "el boletín"}`,
      };
    }
  }

  /**
   * Obtiene un template y lo normaliza a la estructura común
   * @private
   */
  private static async getTemplateAsNormalized(
    id: string
  ): Promise<APIResponse<NormalizedContent>> {
    // Obtener master y version en una sola llamada
    const response = await TemplateAPIService.getCurrentVersion(id);

    // Validar respuesta
    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || "Template no encontrado",
      };
    }

    const { master, current_version: version } = response.data;

    // Validar que la versión tenga contenido
    if (!version.content || !version.content.sections) {
      return {
        success: false,
        message: "El template no tiene secciones definidas",
      };
    }

    // Normalizar a estructura común
    const normalizedMaster: NormalizedMaster = {
      id: master._id!,
      name: master.template_name,
      description: master.description,
      status: master.status,
      log: master.log,
      access_config: master.access_config,
      thumbnail_images: (master as any).thumbnail_images,
    };

    const normalizedVersion: NormalizedVersion = {
      version_num: version.version_num || 1,
      commit_message: version.commit_message || "Versión inicial",
      log: version.log,
      sections: version.content.sections,
      header_config: version.content.header_config,
      footer_config: version.content.footer_config,
      style_config: version.content.style_config,
    };

    return {
      success: true,
      data: {
        master: normalizedMaster,
        version: normalizedVersion,
        contentType: "template",
      },
    };
  }

  /**
   * Obtiene un bulletin y lo normaliza a la estructura común
   * @private
   */
  private static async getBulletinAsNormalized(
    id: string
  ): Promise<APIResponse<NormalizedContent>> {
    // Obtener master y version en una sola llamada
    const response = await BulletinAPIService.getCurrentVersion(id);

    // Validar respuesta
    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || "Boletín no encontrado",
      };
    }

    const { master, current_version: version } = response.data;

    // Validar que la versión tenga datos
    if (!version.data || !version.data.sections) {
      return {
        success: false,
        message: "El boletín no tiene secciones definidas",
      };
    }

    // Normalizar a estructura común
    const normalizedMaster: NormalizedMaster = {
      id: master._id!,
      name: master.bulletin_name,
      description: master.description, // Ahora los bulletins también pueden tener description
      status: master.status,
      log: master.log,
      access_config: master.access_config,
      thumbnail_images: master.thumbnail_images, // Ahora los bulletins también tienen thumbnails
      // Propiedades específicas de Bulletin
      base_template_master_id: master.base_template_master_id,
      base_template_version_id: master.base_template_version_id,
    };

    const normalizedVersion: NormalizedVersion = {
      version_num: version.version_num,
      commit_message: version.commit_message,
      log: version.log,
      sections: version.data.sections, // 👈 Nota: .data en lugar de .content
      header_config: version.data.header_config,
      footer_config: version.data.footer_config,
      style_config: version.data.style_config,
    };

    return {
      success: true,
      data: {
        master: normalizedMaster,
        version: normalizedVersion,
        contentType: "bulletin",
      },
    };
  }

  /**
   * Convierte contenido normalizado de vuelta al formato específico
   * Útil para guardar cambios
   */
  static denormalizeContent(
    content: NormalizedContent
  ): { master: any; version: any } {
    if (content.contentType === "template") {
      return {
        master: {
          _id: content.master.id,
          template_name: content.master.name,
          description: content.master.description || "",
          status: content.master.status,
          log: content.master.log,
          access_config: content.master.access_config,
          thumbnail_images: content.master.thumbnail_images || [],
        },
        version: {
          version_num: content.version.version_num,
          commit_message: content.version.commit_message,
          log: content.version.log,
          content: {
            sections: content.version.sections,
            header_config: content.version.header_config,
            footer_config: content.version.footer_config,
            style_config: content.version.style_config,
          },
        },
      };
    } else {
      return {
        master: {
          _id: content.master.id,
          bulletin_name: content.master.name,
          description: content.master.description, // Incluir description si existe
          status: content.master.status,
          log: content.master.log,
          access_config: content.master.access_config,
          thumbnail_images: content.master.thumbnail_images, // Incluir thumbnails si existen
          base_template_master_id: content.master.base_template_master_id,
          base_template_version_id: content.master.base_template_version_id,
        },
        version: {
          version_num: content.version.version_num,
          commit_message: content.version.commit_message,
          log: content.version.log,
          data: {
            // 👈 Nota: .data en lugar de .content
            sections: content.version.sections,
            header_config: content.version.header_config,
            footer_config: content.version.footer_config,
            style_config: content.version.style_config,
          },
        },
      };
    }
  }

  /**
   * Helper para obtener el nombre del tipo de contenido en español
   */
  static getContentTypeName(type: ContentType): string {
    return type === "template" ? "Plantilla" : "Boletín";
  }

  /**
   * Helper para obtener el endpoint base según el tipo
   */
  static getContentRoute(type: ContentType): string {
    return type === "template" ? "templates" : "bulletins";
  }
}
