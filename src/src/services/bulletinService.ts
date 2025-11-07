import { BulletinMaster, BulletinVersion, BulletinStatus, BulletinWithCurrentVersion } from "@/types/bulletin";
import { BaseAPIService } from "./apiConfig";

// Interfaz para respuestas de la API
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// Interfaz para la respuesta de lista de bulletins
interface GetBulletinsResponse {
  success: boolean;
  data: BulletinMaster[];
  total: number;
  message?: string;
}

// Servicio principal para bulletins
export class BulletinAPIService extends BaseAPIService {
  /**
   * Obtiene la lista de bulletins con filtros opcionales
   * GET /bulletins/
   */
  static async getBulletins(): Promise<GetBulletinsResponse> {
    try {
      const data = await this.get<any>("/bulletins/");
      const bulletins = data.bulletins || data.data || data;

      // Map API response to match BulletinMaster interface
      const mappedBulletins = bulletins.map((bulletin: any) => ({
        ...bulletin,
        _id: bulletin.id || bulletin._id, // Map 'id' to '_id'
      }));

      return {
        success: true,
        data: mappedBulletins,
        total: data.total || bulletins.length,
      };
    } catch (error) {
      console.error("Error fetching bulletins:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener los boletines",
      };
    }
  }

  /**
   * Obtiene un bulletin específico por ID
   * GET /bulletins/{bulletin_id}
   */
  static async getBulletinById(
    id: string
  ): Promise<APIResponse<BulletinMaster>> {
    try {
      const data = await this.get<any>(`/bulletins/${id}`);
      const bulletin = data.bulletin || data.data || data;

      // Map API response to match BulletinMaster interface
      const mappedBulletin = {
        ...bulletin,
        _id: bulletin.id || bulletin._id, // Map 'id' to '_id'
      };

      return {
        success: true,
        data: mappedBulletin,
      };
    } catch (error) {
      console.error("Error fetching bulletin:", error);

      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener el boletín",
      };
    }
  }

  /**
   * Crea un nuevo bulletin
   * POST /bulletins/
   */
  static async createBulletin(
    bulletinData: Omit<BulletinMaster, "_id" | "log" | "current_version_id">
  ): Promise<APIResponse<BulletinMaster>> {
    try {
      const data = await this.post<any>("/bulletins/", bulletinData);

      return {
        success: true,
        data: data.bulletin || data.data || data,
      };
    } catch (error) {
      console.error("Error creating bulletin:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al crear el boletín",
      };
    }
  }

  /**
   * Actualiza un bulletin existente
   * PUT /bulletins/{bulletin_id}
   */
  static async updateBulletin(
    id: string,
    bulletinData: Partial<BulletinMaster>
  ): Promise<APIResponse<BulletinMaster>> {
    try {
      const data = await this.put<any>(`/bulletins/${id}`, bulletinData);

      return {
        success: true,
        data: data.bulletin || data.data || data,
      };
    } catch (error) {
      console.error("Error updating bulletin:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar el boletín",
      };
    }
  }

  /**
   * Obtiene bulletins filtrados por nombre
   * GET /bulletins/name/{name}
   */
  static async getBulletinsByName(name: string): Promise<GetBulletinsResponse> {
    try {
      const data = await this.get<any>(
        `/bulletins/name/${encodeURIComponent(name)}`
      );

      return {
        success: true,
        data: data.bulletins || data.data || data,
        total: (data.bulletins || data.data || data).length,
      };
    } catch (error) {
      console.error("Error fetching bulletins by name:", error);
      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener los boletines por nombre",
      };
    }
  }

  /**
   * Obtiene bulletins filtrados por estado
   * GET /bulletins/status/{status}
   */
  static async getBulletinsByStatus(
    status: BulletinStatus
  ): Promise<GetBulletinsResponse> {
    try {
      const data = await this.get<any>(`/bulletins/status/${status}`);

      return {
        success: true,
        data: data.bulletins || data.data || data,
        total: (data.bulletins || data.data || data).length,
      };
    } catch (error) {
      console.error("Error fetching bulletins by status:", error);
      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener los boletines por estado",
      };
    }
  }

  /**
   * Obtiene la versión actual de un bulletin junto con la información del master
   * La respuesta del API tiene la estructura: { master: {...}, current_version: {...} }
   * GET /bulletins/{bulletin_id}/current-version
   */
  static async getCurrentVersion(
    bulletinId: string
  ): Promise<APIResponse<BulletinWithCurrentVersion>> {
    try {
      const data = await this.get<any>(
        `/bulletins/${bulletinId}/current-version`
      );

      // La API devuelve { master, current_version }
      // Normalizar el master para tener _id en lugar de id
      const normalizedMaster: BulletinMaster = {
        ...data.master,
        _id: data.master.id || data.master._id,
      };

      const normalizedVersion: BulletinVersion = {
        ...data.current_version,
        _id: data.current_version.id || data.current_version._id,
      };


      return {
        success: true,
        data: {
          master: normalizedMaster,
          current_version: normalizedVersion,
        },
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
   * Crea una nueva versión de un bulletin
   * POST /bulletins/versions
   */
  static async createBulletinVersion(
    bulletinId: string,
    versionData: Omit<BulletinVersion, "_id" | "bulletin_master_id" | "previous_version_id" | "log">
  ): Promise<APIResponse<BulletinVersion>> {
    try {
      console.log("Creating bulletin version for bulletin ID:", {
        bulletin_master_id: bulletinId,
        ...versionData,
      });
      const data = await this.post<any>("/bulletins/versions", {
        bulletin_master_id: bulletinId,
        ...versionData,
      });

      return {
        success: true,
        data: data.version || data.data || data,
      };
    } catch (error) {
      console.error("Error creating bulletin version:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al crear la versión del boletín",
      };
    }
  }

  /**
   * Obtiene el historial de versiones de un bulletin
   * GET /bulletins/{bulletin_id}/history
   */
  static async getBulletinHistory(
    bulletinId: string
  ): Promise<APIResponse<BulletinVersion[]>> {
    try {
      const data = await this.get<any>(`/bulletins/${bulletinId}/history`);

      return {
        success: true,
        data: data.history || data.data || data,
      };
    } catch (error) {
      console.error("Error fetching bulletin history:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener el historial del boletín",
      };
    }
  }

  /**
   * Obtiene una versión específica de un bulletin por su ID
   * GET /bulletins/version/{version_id}
   */
  static async getVersionById(
    versionId: string
  ): Promise<APIResponse<BulletinVersion>> {
    try {
      const data = await this.get<any>(`/bulletins/version/${versionId}`);

      return {
        success: true,
        data: data.version || data.data || data,
      };
    } catch (error) {
      console.error("Error fetching bulletin version:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener la versión del boletín",
      };
    }
  }

  /**
   * Clona un bulletin existente (útil para crear uno nuevo basado en otro)
   */
  static async cloneBulletin(
    bulletinId: string,
    newBulletinData?: Partial<BulletinMaster>
  ): Promise<APIResponse<BulletinMaster>> {
    try {
      const data = await this.post<any>(
        `/bulletins/${bulletinId}/clone`,
        newBulletinData || {}
      );

      return {
        success: true,
        data: data.bulletin || data.data || data,
      };
    } catch (error) {
      console.error("Error cloning bulletin:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al clonar el boletín",
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
   * Exporta un bulletin a PDF (método auxiliar para futuras implementaciones)
   */
  static async exportBulletinToPDF(bulletinId: string): Promise<APIResponse<Blob>> {
    try {
      const data = await this.get<Blob>(`/bulletins/${bulletinId}/export/pdf`, {
        responseType: "blob",
      });

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("Error exporting bulletin to PDF:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al exportar el boletín a PDF",
      };
    }
  }

  /**
   * Exporta un bulletin a imagen (método auxiliar para futuras implementaciones)
   */
  static async exportBulletinToImage(
    bulletinId: string,
    format: "png" | "jpg" = "png"
  ): Promise<APIResponse<Blob>> {
    try {
      const data = await this.get<Blob>(
        `/bulletins/${bulletinId}/export/image?format=${format}`,
        { responseType: "blob" }
      );

      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error("Error exporting bulletin to image:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al exportar el boletín a imagen",
      };
    }
  }
}

export default BulletinAPIService;
