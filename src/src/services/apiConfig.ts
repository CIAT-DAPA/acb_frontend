// Configuración base para las APIs
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
  TIMEOUT: 10000, // 10 segundos
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
} as const;

// Función utilitaria para crear URLs con parámetros
export const buildURL = (
  endpoint: string,
  params?: Record<string, string | number | boolean>
): string => {
  const url = new URL(endpoint, API_CONFIG.BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
};

// Función utilitaria para manejar respuestas de fetch
export const handleFetchResponse = async <T = any>(
  response: Response
): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage: string;

    try {
      const errorJson = JSON.parse(errorText);
      errorMessage =
        errorJson.message ||
        errorJson.detail ||
        `HTTP ${response.status}: ${response.statusText}`;
    } catch {
      errorMessage =
        errorText || `HTTP ${response.status}: ${response.statusText}`;
    }

    throw new Error(errorMessage);
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response.text() as Promise<T>;
};

// Función para crear opciones de fetch con headers por defecto
export const createFetchOptions = (options: RequestInit = {}): RequestInit => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

  const headers = new Headers(API_CONFIG.DEFAULT_HEADERS);

  // Agregar token de autorización si existe
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Merge con headers personalizados
  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => headers.set(key, value));
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => headers.set(key, value));
    } else {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (value !== undefined) headers.set(key, value);
      });
    }
  }

  return {
    ...options,
    headers,
    signal: options.signal || AbortSignal.timeout(API_CONFIG.TIMEOUT),
  };
};

// Clase base para servicios de API
export abstract class BaseAPIService {
  protected static async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_CONFIG.BASE_URL}${endpoint}`;
    const fetchOptions = createFetchOptions(options);

    try {
      const response = await fetch(url, fetchOptions);
      return await handleFetchResponse<T>(response);
    } catch (error) {
      console.error(`API Error - ${options.method || "GET"} ${url}:`, error);
      throw error;
    }
  }

  protected static async get<T = any>(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<T> {
    const url = params ? buildURL(endpoint, params) : endpoint;
    return this.request<T>(url, { method: "GET" });
  }

  protected static async post<T = any>(
    endpoint: string,
    data?: any
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected static async put<T = any>(
    endpoint: string,
    data?: any
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  protected static async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}
