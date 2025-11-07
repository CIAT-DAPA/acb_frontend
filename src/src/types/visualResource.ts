import { AccessConfig, LogObject } from "./core";

// Enums y tipos para recursos visuales
export const VISUAL_RESOURCE_FILE_TYPES = ["image", "icon"] as const;
export const VISUAL_RESOURCE_STATUS = ["active", "archived"] as const;

export type VisualResourceFileType =
  (typeof VISUAL_RESOURCE_FILE_TYPES)[number];
export type VisualResourceStatus = (typeof VISUAL_RESOURCE_STATUS)[number];

// Interfaz para recursos visuales
export interface VisualResource {
  id: string;
  file_url: string;
  file_name: string;
  file_type: VisualResourceFileType;
  status: VisualResourceStatus;
  access_config: AccessConfig;
  log: LogObject;
}
