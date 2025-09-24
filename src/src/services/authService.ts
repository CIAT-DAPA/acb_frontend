import { BaseAPIService } from "./apiConfig";

// Interfaces para autenticación
export interface TokenValidationResponse {
  valid: boolean;
  user?: {
    id: string;
    username: string;
    email?: string;
    roles?: string[];
  };
  expires_at?: string;
}

// Interfaz para respuestas de la API
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

export class AuthAPIService extends BaseAPIService {
  /**
   * Valida un token de Keycloak
   */
  static async validateToken(
    token?: string
  ): Promise<APIResponse<TokenValidationResponse>> {
    try {
      const tokenToValidate = token || this.getStoredToken();

      if (!tokenToValidate) {
        return {
          success: false,
          message: "No hay token para validar",
        };
      }

      const data = await this.get<TokenValidationResponse>(
        "/auth/token/validate",
        undefined
      );

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Error validating token:", error);

      // Si el token es inválido, limpiarlo del storage
      if (error instanceof Error && error.message.includes("401")) {
        this.clearToken();
      }

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Error validando el token",
      };
    }
  }

  /**
   * Obtiene el token actual del almacenamiento
   */
  static getStoredToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("auth_token");
  }

  /**
   * Limpia el token del almacenamiento local
   */
  private static clearToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_token");
  }
}

export default AuthAPIService;
