// Tipos genéricos para manejar Templates y Bulletins de manera unificada

import { LogObject, AccessConfig, StyleConfig } from "./core";
import { Section, HeaderFooterConfig } from "./template";
import { BulletinSection, BulletinHeaderFooterConfig } from "./bulletin";

/**
 * Tipo de contenido soportado
 */
export type ContentType = "template" | "bulletin";

/**
 * Estructura normalizada de Master (Template o Bulletin)
 * Unifica las propiedades comunes entre TemplateMaster y BulletinMaster
 */
export interface NormalizedMaster {
  id: string;
  name: string;
  description?: string; // Opcional - Ambos pueden tener description
  status: string;
  log: LogObject;
  access_config: AccessConfig;
  thumbnail_images?: string[]; // Opcional - Ambos pueden tener thumbnails
  // Propiedades específicas de Bulletin (opcionales)
  base_template_master_id?: string;
  base_template_version_id?: string;
}

/**
 * Estructura normalizada de Version (Template o Bulletin)
 * Unifica las propiedades comunes entre TemplateVersion y BulletinVersion
 */
export interface NormalizedVersion {
  version_num: number;
  commit_message: string;
  log: LogObject;
  sections: Section[] | BulletinSection[];
  header_config?: HeaderFooterConfig | BulletinHeaderFooterConfig;
  footer_config?: HeaderFooterConfig | BulletinHeaderFooterConfig;
  style_config?: StyleConfig;
}

/**
 * Estructura normalizada completa de contenido
 * Combina Master + Version de forma genérica
 */
export interface NormalizedContent {
  master: NormalizedMaster;
  version: NormalizedVersion;
  contentType: ContentType; // Para saber qué tipo de contenido es
}

/**
 * Props comunes para acciones en contenidos
 */
export interface ContentActions {
  onEdit?: (id: string) => void;
  onClone?: (id: string) => void;
  onDelete?: (id: string) => void;
  // Acciones específicas de Bulletin
  onPublish?: (id: string) => void;
  onSendToReview?: (id: string) => void;
  onDownloadPDF?: (id: string) => void;
}

/**
 * Configuración de acciones visibles según el tipo de contenido
 */
export interface ContentActionsConfig {
  edit?: boolean;
  clone?: boolean;
  delete?: boolean;
  // Específicas de Bulletin
  publish?: boolean;
  sendToReview?: boolean;
  downloadPDF?: boolean;
}

/**
 * Helper para determinar qué acciones están disponibles según el tipo
 */
export function getAvailableActions(
  contentType: ContentType,
  status?: string
): ContentActionsConfig {
  if (contentType === "template") {
    return {
      edit: true,
      clone: true,
      delete: true,
      publish: false,
      sendToReview: false,
      downloadPDF: false,
    };
  } else {
    // Bulletin
    const isDraft = status === "draft";
    return {
      edit: isDraft,
      clone: true,
      delete: isDraft,
      publish: isDraft,
      sendToReview: isDraft,
      downloadPDF: !isDraft, // Solo si está publicado
    };
  }
}
