import { 
  TemplateMaster, 
  TemplateUIModel, 
  GetTemplatesResponse, 
  GetTemplatesParams 
} from '@/types/api';

// Datos mock basados en la documentación de MongoDB
const MOCK_TEMPLATES: TemplateMaster[] = [
  {
    _id: "66b44a30e8d7f3e1f2b3c4d5",
    template_name: "Boletín Agroclimático de Café - Nariño",
    description: "Plantilla estándar para boletines de café en la región de Nariño, enfocada en clima y recomendaciones.",
    log: {
      created_at: "2025-07-01T10:00:00Z",
      creator_user_id: "66b44a30e8d7f3e1f2b3c4d6",
      updated_at: "2025-08-14T15:00:00Z",
      updater_user_id: "66b44a30e8d7f3e1f2b3c4d8"
    },
    status: "activa",
    current_version_id: "66b44a30e8d7f3e1f2b3c4d7",
    access_config: {
      access_type: "restricted",
      allowed_groups: [
        "66b44a30e8d7f3e1f2b3c4da",
        "66c5e7b8c2d1e2f3a4b5c6d7"
      ]
    }
  },
  {
    _id: "66c5f1a9d3e4b2c1a9f8e7d6",
    template_name: "Reporte Semanal Arroz - Valle del Cauca",
    description: "Plantilla para reportes semanales de arroz con análisis de precipitación y temperatura para el Valle del Cauca.",
    log: {
      created_at: "2025-06-15T14:30:00Z",
      creator_user_id: "66a33b20d7c6e2f1e3b4c5d7",
      updated_at: "2025-07-22T09:15:00Z",
      updater_user_id: "66a33b20d7c6e2f1e3b4c5d7"
    },
    status: "activa",
    current_version_id: "66c5f1a9d3e4b2c1a9f8e7d8",
    access_config: {
      access_type: "public",
      allowed_groups: []
    }
  },
  {
    _id: "66d7e2b1f4a5c3d2b0e9f8e7",
    template_name: "Alertas Climáticas Tempranas",
    description: "Plantilla para alertas climáticas urgentes que requieren atención inmediata de los agricultores.",
    log: {
      created_at: "2025-05-20T08:45:00Z",
      creator_user_id: "66b44a30e8d7f3e1f2b3c4d6",
      updated_at: "2025-08-10T16:20:00Z",
      updater_user_id: "66e55c40e9f8d4e2f4c5d6e8"
    },
    status: "activa",
    current_version_id: "66d7e2b1f4a5c3d2b0e9f8e9",
    access_config: {
      access_type: "restricted",
      allowed_groups: [
        "66b44a30e8d7f3e1f2b3c4da"
      ]
    }
  },
  {
    _id: "66e8f3c2a5b6d4e3c1f0e9f8",
    template_name: "Boletín Mensual Maíz - Cundinamarca",
    description: "Plantilla mensual especializada en cultivos de maíz para la región de Cundinamarca con análisis de suelos.",
    log: {
      created_at: "2025-04-10T11:20:00Z",
      creator_user_id: "66a33b20d7c6e2f1e3b4c5d7",
      updated_at: "2025-06-05T13:40:00Z",
      updater_user_id: "66a33b20d7c6e2f1e3b4c5d7"
    },
    status: "borrador",
    current_version_id: "66e8f3c2a5b6d4e3c1f0e9f9",
    access_config: {
      access_type: "private",
      allowed_groups: []
    }
  }
];

// Mock de usuarios para simular nombres de autores
const MOCK_USERS: { [key: string]: string } = {
  "66b44a30e8d7f3e1f2b3c4d6": "CIAT - Equipo Clima",
  "66a33b20d7c6e2f1e3b4c5d7": "Usuario Regional",
  "66e55c40e9f8d4e2f4c5d6e8": "CIAT - Alertas"
};

// Función para convertir fecha ISO a formato legible
const formatDate = (isoDate: string): string => {
  return new Date(isoDate).toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

// Función para mapear TemplateMaster a TemplateUIModel
const mapToUIModel = (template: TemplateMaster): TemplateUIModel => {
  const authorName = MOCK_USERS[template.log.creator_user_id] || "Usuario Desconocido";
  
  // Asignar imágenes de ejemplo basadas en el nombre del template
  let image: string | undefined;
  if (template.template_name.toLowerCase().includes('café')) {
    image = '/assets/img/temp1.jpg';
  } else if (template.template_name.toLowerCase().includes('arroz')) {
    image = '/assets/img/bol2.jpg';
  } else if (template.template_name.toLowerCase().includes('maíz')) {
    image = '/assets/img/temp1.jpg';
  }
  // Si no hay imagen específica, se usará la imagen por defecto en el componente

  return {
    id: template._id,
    name: template.template_name,
    description: template.description,
    author: authorName,
    lastModified: formatDate(template.log.updated_at),
    status: template.status,
    image
  };
};

// Clase de servicio para la API
export class TemplateAPIService {
  private static baseURL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  
  /**
   * Obtiene la lista de templates con filtros opcionales
   */
  static async getTemplates(params: GetTemplatesParams = {}): Promise<GetTemplatesResponse> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      // En producción, esta sería la llamada real a la API:
      // const response = await fetch(`${this.baseURL}/templates`, {
      //   method: 'GET',
      //   headers: { 'Content-Type': 'application/json' },
      //   ...
      // });
      // return response.json();

      // Por ahora simulamos la respuesta
      let filteredTemplates = [...MOCK_TEMPLATES];

      // Aplicar filtro de búsqueda
      if (params.search) {
        const searchTerm = params.search.toLowerCase();
        filteredTemplates = filteredTemplates.filter(template =>
          template.template_name.toLowerCase().includes(searchTerm) ||
          template.description.toLowerCase().includes(searchTerm)
        );
      }

      // Aplicar filtro de status
      if (params.status) {
        filteredTemplates = filteredTemplates.filter(template =>
          template.status === params.status
        );
      }

      // Aplicar ordenamiento
      if (params.sortBy) {
        filteredTemplates.sort((a, b) => {
          let aValue: string;
          let bValue: string;

          switch (params.sortBy) {
            case 'name':
              aValue = a.template_name;
              bValue = b.template_name;
              break;
            case 'created_at':
              aValue = a.log.created_at;
              bValue = b.log.created_at;
              break;
            case 'updated_at':
              aValue = a.log.updated_at;
              bValue = b.log.updated_at;
              break;
            default:
              aValue = a.template_name;
              bValue = b.template_name;
          }

          const comparison = aValue.localeCompare(bValue);
          return params.sortOrder === 'desc' ? -comparison : comparison;
        });
      }

      // Aplicar paginación
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
        limit
      };

    } catch (error) {
      console.error('Error fetching templates:', error);
      return {
        success: false,
        data: [],
        total: 0,
        message: 'Error al obtener las plantillas'
      };
    }
  }

  /**
   * Obtiene un template específico por ID
   */
  static async getTemplateById(id: string): Promise<{ success: boolean; data?: TemplateMaster; message?: string }> {
    // Simular delay de red
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      // En producción:
      // const response = await fetch(`${this.baseURL}/templates/${id}`);
      // return response.json();

      const template = MOCK_TEMPLATES.find(t => t._id === id);
      
      if (!template) {
        return {
          success: false,
          message: 'Plantilla no encontrada'
        };
      }

      return {
        success: true,
        data: template
      };

    } catch (error) {
      console.error('Error fetching template:', error);
      return {
        success: false,
        message: 'Error al obtener la plantilla'
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