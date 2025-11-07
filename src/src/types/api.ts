// Tipos específicos para la comunicación con la API

import { LogObject, AccessConfig, TemplateStatus } from "./core";
import { VisualResource } from "./visualResource";

export interface TemplateMaster {
  _id: string; // ObjectId como string
  template_name: string;
  description: string;
  log: LogObject;
  status: TemplateStatus;
  current_version_id: string; // ObjectId como string
  access_config: AccessConfig;
}

// Respuesta de la API para obtener templates
export interface GetTemplatesResponse {
  success: boolean;
  data: TemplateMaster[];
  total: number;
  page?: number;
  limit?: number;
  message?: string;
}

// Respuesta de la API para obtener recursos visuales
export interface GetVisualResourcesResponse {
  success: boolean;
  data: VisualResource[];
  total: number;
  page?: number;
  limit?: number;
  message?: string;
}
