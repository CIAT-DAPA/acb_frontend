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
   * Guarda el token de Keycloak en el almacenamiento local
   */
  static saveKeycloakToken(token: string): void {
    if (typeof window === "undefined") return;
    localStorage.setItem("keycloak_token", token);
    // También guardarlo con el nombre genérico para compatibilidad
    localStorage.setItem("auth_token", token);
  }

  /**
   * Obtiene el token de Keycloak del almacenamiento
   */
  static getKeycloakToken(): string | null {
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("keycloak_token") ||
      localStorage.getItem("auth_token")
    );
  }

  /**
   * Valida un token de Keycloak
   */
  static async validateToken(
    token?: string
  ): Promise<APIResponse<TokenValidationResponse>> {
    try {
      const tokenToValidate = token || this.getKeycloakToken();

      if (!tokenToValidate) {
        return {
          success: false,
          message: "No hay token para validar",
        };
      }

      // Asegurarse de que el token esté disponible para las peticiones
      if (token) {
        this.saveKeycloakToken(token);
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
      if (
        error instanceof Error &&
        (error.message.includes("401") || error.message.includes("403"))
      ) {
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
   * Obtiene el token actual del almacenamiento (método legacy)
   */
  static getStoredToken(): string | null {
    return this.getKeycloakToken();
  }

  /**
   * Limpia todos los tokens del almacenamiento local
   */
  private static clearToken(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem("auth_token");
    localStorage.removeItem("keycloak_token");
  }

  /**
   * Limpia los tokens (método público para logout)
   */
  static clearAllTokens(): void {
    this.clearToken();
  }
}

export default AuthAPIService;
