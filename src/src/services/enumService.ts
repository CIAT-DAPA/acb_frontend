// Servicio para obtener enumeraciones (enums) desde la API
import { BaseAPIService } from "./apiConfig";

// ============================================
// RESPONSE TYPES
// ============================================

/**
 * Estructura de un valor de enum con su label
 */
export interface EnumValue {
  value: string;
  label: string;
}

/**
 * Respuesta de la API para enums
 * Formato: { enums: { EnumName: ["value1", "value2", ...] } }
 */
interface EnumAPIResponse {
  enums: Record<string, string[]>;
}

/**
 * Respuesta de la API para enums con labels
 * Formato: { enums: { EnumName: [{ value: "...", label: "..." }, ...] } }
 */
interface EnumAPIResponseWithLabels {
  enums: Record<string, Array<{ value: string; label: string }>>;
}

// ============================================
// ENUM SERVICE
// ============================================

export class EnumAPIService extends BaseAPIService {
  /**
   * Obtener los valores de un enum específico
   * @param enumName - Nombre del enum a obtener (ej: "CardType")
   * @param includeLabels - Si se deben incluir labels legibles
   * @returns Array de valores del enum con sus labels
   */
  static async getEnum(
    enumName: string,
    includeLabels: boolean = true
  ): Promise<EnumValue[]> {
    try {
      const params: Record<string, string> = {
        names: enumName,
      };

      if (includeLabels) {
        params.include_labels = "true";
      }

      if (includeLabels) {
        // Respuesta con labels: { enums: { EnumName: [{ value, label }, ...] } }
        const response = await this.get<EnumAPIResponseWithLabels>(
          "/meta/enums",
          params
        );

        if (response.enums && response.enums[enumName]) {
          return response.enums[enumName];
        }
      } else {
        // Respuesta sin labels: { enums: { EnumName: ["value1", "value2", ...] } }
        const response = await this.get<EnumAPIResponse>("/meta/enums", params);

        if (response.enums && response.enums[enumName]) {
          // Convertir array de strings a array de EnumValue
          return response.enums[enumName].map((value) => ({
            value,
            label: value,
          }));
        }
      }

      throw new Error(`No se encontró el enum ${enumName}`);
    } catch (error) {
      console.error(`Error fetching enum ${enumName}:`, error);
      throw error;
    }
  }

  /**
   * Obtener los tipos de cards disponibles (sin labels, solo valores)
   * Los labels se deben traducir en el componente usando next-intl
   * @returns Array de tipos de cards con value = label
   */
  static async getCardTypes(): Promise<EnumValue[]> {
    return this.getEnum("CardType", false);
  }

  /**
   * Obtener múltiples enums en una sola llamada
   * @param enumNames - Array de nombres de enums a obtener
   * @param includeLabels - Si se deben incluir labels legibles
   * @returns Objeto con los enums solicitados
   */
  static async getMultipleEnums(
    enumNames: string[],
    includeLabels: boolean = true
  ): Promise<Record<string, EnumValue[]>> {
    try {
      const params: Record<string, string> = {
        names: enumNames.join(","),
      };

      if (includeLabels) {
        params.include_labels = "true";
      }

      const result: Record<string, EnumValue[]> = {};

      if (includeLabels) {
        const response = await this.get<EnumAPIResponseWithLabels>(
          "/meta/enums",
          params
        );

        if (response.enums) {
          for (const enumName of enumNames) {
            if (response.enums[enumName]) {
              result[enumName] = response.enums[enumName];
            }
          }
        }
      } else {
        const response = await this.get<EnumAPIResponse>("/meta/enums", params);

        if (response.enums) {
          for (const enumName of enumNames) {
            if (response.enums[enumName]) {
              result[enumName] = response.enums[enumName].map((value) => ({
                value,
                label: value,
              }));
            }
          }
        }
      }

      return result;
    } catch (error) {
      console.error("Error fetching multiple enums:", error);
      throw error;
    }
  }
}
