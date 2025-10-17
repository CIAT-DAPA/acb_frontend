// Tipos para la creación y manejo de boletines basados en la documentación MongoDB

import { LogObject, StyleConfig } from "./core";

// Importar los tipos de Field de template (que incluyen el atributo value)
import type { Field } from "./template";

// Tipo de estado del boletín
export type BulletinStatus = "draft" | "published";

// ============================================
// BULLETIN DATA STRUCTURES (Similar a Template pero con valores)
// ============================================

export interface BulletinBlock {
  block_id: string;
  display_name: string;
  icon_url?: string;
  style_config?: StyleConfig;
  fields: Field[]; // Los campos ahora tienen el atributo value lleno
}

export interface BulletinHeaderFooterConfig {
  style_config?: StyleConfig;
  fields: Field[]; // Campos con valores
}

export interface BulletinSection {
  section_id: string;
  display_name: string;
  background_url: string[];
  order: number;
  style_config?: StyleConfig;
  icon_url: string;
  header_config?: BulletinHeaderFooterConfig; // Header específico de la sección con valores
  footer_config?: BulletinHeaderFooterConfig; // Footer específico de la sección con valores
  blocks: BulletinBlock[];
}

export interface BulletinVersionData {
  style_config?: StyleConfig;
  header_config?: BulletinHeaderFooterConfig; // Header global con valores
  sections: BulletinSection[];
  footer_config?: BulletinHeaderFooterConfig; // Footer global con valores
}

// ============================================
// BULLETIN VERSION
// ============================================

export interface BulletinVersion {
  _id?: string;
  bulletin_master_id?: string;
  version_num: number;
  commit_message: string;
  previous_version_id?: string | null;
  log: LogObject;
  data: BulletinVersionData; // Note: En bulletins es "data", no "content"
}

// ============================================
// BULLETIN MASTER
// ============================================

export interface BulletinMaster {
  _id?: string;
  bulletin_name: string;
  log: LogObject;
  base_template_master_id: string; // Referencia al template master usado
  base_template_version_id: string; // Versión específica del template usada
  current_version_id?: string; // ID de la versión actual del boletín
  status: BulletinStatus;
}

// ============================================
// BULLETIN REVIEWS
// ============================================

export interface CommentTargetElement {
  section_id?: string;
  block_id?: string;
  field_id?: string;
}

export interface CommentReply {
  comment_id: string;
  bulletin_version_id: string;
  text: string;
  author_id: string;
  created_at: Date;
}

export interface Comment extends CommentReply {
  target_element?: CommentTargetElement; // Solo el comentario principal tiene target
  replies: CommentReply[]; // Array de respuestas recursivas
}

export interface BulletinReview {
  _id?: string;
  log: LogObject;
  bulletin_master_id: string;
  comments: Comment[];
}

// ============================================
// BULLETIN CREATION/EDIT TYPES
// ============================================

// Tipo para crear un nuevo boletín
export interface CreateBulletinData {
  master: Omit<BulletinMaster, "_id" | "current_version_id">;
  version: Omit<
    BulletinVersion,
    "_id" | "bulletin_master_id" | "previous_version_id"
  >;
}

// Tipo para los pasos del wizard de creación de boletín
export type BulletinCreationStep =
  | "select-template"
  | "basic-info"
  | `section-${number}`;

export interface BulletinCreationState {
  currentStep: BulletinCreationStep;
  currentSectionIndex: number; // Para trackear qué sección se está llenando
  selectedTemplateId?: string;
  selectedTemplateVersionId?: string;
  data: CreateBulletinData;
  errors: Record<string, string[]>;
  isValid: boolean;
}

// ============================================
// UTILITY TYPES
// ============================================

// Tipo helper para transformar un template a un bulletin inicial
export interface TemplateToBlankBulletinTransform {
  templateMasterId: string;
  templateVersionId: string;
  bulletinName: string;
  creatorUserId: string;
}

// Constantes para estados de boletín
export const BULLETIN_STATUSES = ["draft", "published"] as const;

export type BulletinStatusType = (typeof BULLETIN_STATUSES)[number];
