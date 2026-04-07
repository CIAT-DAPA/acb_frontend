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
import { CardAPIService } from "./cardService";

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
    id: string,
  ): Promise<APIResponse<NormalizedContent>> {
    try {
      if (type === "template") {
        return await this.getTemplateAsNormalized(id);
      } else if (type === "bulletin") {
        return await this.getBulletinAsNormalized(id);
      } else {
        return await this.getCardAsNormalized(id);
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
    id: string,
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
    id: string,
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

  private static async getCardAsNormalized(
    id: string,
  ): Promise<APIResponse<NormalizedContent>> {
    // Obtener card por ID
    const response = await CardAPIService.getCardById(id);

    // Validar respuesta
    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || "Tarjeta no encontrada",
      };
    }

    const card = response.data;

    // Validar que la card tenga contenido
    if (!card.content || !card.content.blocks) {
      return {
        success: false,
        message: "La tarjeta no tiene contenido definido",
      };
    }

    // Normalizar a estructura común siguiendo el patrón de CardPreview
    // Convertir Card a la misma estructura que usa CardPreview para TemplatePreview
    const normalizedMaster: NormalizedMaster = {
      id: card._id!,
      name: card.card_name,
      description: card.card_type, // Tipo de card como descripción
      status: card.status,
      log: card.log,
      access_config: card.access_config,
      thumbnail_images: card.thumbnail_images,
    };

    // Crear una sección a partir del contenido de la card (igual que CardPreview)
    const section: any = {
      section_id: "card_section",
      display_name: card.card_name,
      background_url: card.content.background_url
        ? [card.content.background_url]
        : [],
      order: 0,
      icon_url: "",
      blocks: card.content.blocks,
      style_config: {
        background_color: card.content.background_color,
        background_image: card.content.background_url,
        // Aplicar padding y gap del content style_config
        padding: card.content.style_config?.padding,
        gap: card.content.style_config?.gap,
      },
      header_config: card.content.header_config,
      footer_config: card.content.footer_config,
    };

    const normalizedVersion: NormalizedVersion = {
      version_num: 1,
      commit_message: "Card preview",
      log: card.log,
      sections: [section], // Una sola sección con todo el contenido
      header_config: card.content.header_config,
      footer_config: card.content.footer_config,
      style_config: card.content.style_config || {
        font: "Arial",
        primary_color: "#000000",
        secondary_color: "#666666",
        background_color: "#ffffff",
      },
    };

    return {
      success: true,
      data: {
        master: normalizedMaster,
        version: normalizedVersion,
        contentType: "card",
      },
    };
  }

  /**
   * Convierte contenido normalizado de vuelta al formato específico
   * Útil para guardar cambios
   */
  static denormalizeContent(content: NormalizedContent): {
    master: any;
    version: any;
  } {
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
    } else if (content.contentType === "bulletin") {
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
    } else {
      // card
      return {
        master: {
          _id: content.master.id,
          card_name: content.master.name,
          tags: Array.isArray((content.master as any).tags)
            ? (content.master as any).tags
            : [],
          card_type: content.master.description || "", // Recuperar el tipo desde description
          status: content.master.status,
          log: content.master.log,
          access_config: content.master.access_config,
          thumbnail_images: content.master.thumbnail_images || [],
          templates_master_ids: [], // Se debería pasar como parámetro adicional si se necesita
          content: {
            blocks: (content.version.sections[0] as any)?.blocks || [],
            header_config: content.version.header_config,
            footer_config: content.version.footer_config,
            style_config: content.version.style_config,
          },
        },
        version: null, // Cards no tienen versionamiento
      };
    }
  }

  /**
   * Helper para obtener el nombre del tipo de contenido en español
   */
  static getContentTypeName(type: ContentType): string {
    switch (type) {
      case "template":
        return "Plantilla";
      case "bulletin":
        return "Boletín";
      case "card":
        return "Tarjeta";
      default:
        return "Contenido";
    }
  }

  /**
   * Helper para obtener el endpoint base según el tipo
   */
  static getContentRoute(type: ContentType): string {
    switch (type) {
      case "template":
        return "templates";
      case "bulletin":
        return "bulletins";
      case "card":
        return "cards";
      default:
        return "";
    }
  }
}
