// Tipos basados en la documentación de MongoDB

export interface LogObject {
  created_at: string; // ISODate como string
  creator_user_id: string; // ObjectId como string
  updated_at: string; // ISODate como string
  updater_user_id: string; // ObjectId como string
}

export interface AccessConfig {
  access_type: 'public' | 'restricted' | 'private';
  allowed_groups?: string[]; // Array de ObjectIds como strings
}

export interface TemplateMaster {
  _id: string; // ObjectId como string
  template_name: string;
  description: string;
  log: LogObject;
  status: 'activa' | 'archivada' | 'borrador';
  current_version_id: string; // ObjectId como string
  access_config: AccessConfig;
}

// Tipo simplificado para la UI (similar al ItemCardProps)
export interface TemplateUIModel {
  id: string; // Mapeado desde _id
  name: string; // Mapeado desde template_name
  description: string;
  author: string; // Extraído del log.creator_user_id (por ahora simularemos)
  lastModified: string; // Mapeado desde log.updated_at (formateado)
  status: string; // Mapeado desde status
  image?: string; // Opcional para la UI
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

// Parámetros de consulta para obtener templates
export interface GetTemplatesParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'activa' | 'archivada' | 'borrador';
  sortBy?: 'name' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}