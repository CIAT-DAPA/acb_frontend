// Configuración base para las APIs
export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000",
  TIMEOUT: 10000, // 10 segundos
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
} as const;

export class APIError<TDetail = unknown> extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly detail?: TDetail;
  readonly body?: unknown;

  constructor(options: {
    message: string;
    status: number;
    statusText: string;
    detail?: TDetail;
    body?: unknown;
  }) {
    super(options.message);
    this.name = "APIError";
    this.status = options.status;
    this.statusText = options.statusText;
    this.detail = options.detail;
    this.body = options.body;
  }
}

export const isAPIError = (error: unknown): error is APIError<unknown> => {
  if (error instanceof APIError) return true;

  if (!error || typeof error !== "object") return false;

  const candidate = error as Partial<APIError<unknown>>;
  return (
    candidate.name === "APIError" &&
    typeof candidate.message === "string" &&
    typeof candidate.status === "number"
  );
};

// Función utilitaria para crear URLs con parámetros
export const buildURL = (
  endpoint: string,
  params?: Record<string, string | number | boolean>,
): string => {
  const url = new URL(endpoint, API_CONFIG.BASE_URL);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }

  return url.toString();
};

const toReadableError = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;

        if (item && typeof item === "object") {
          const maybeMsg = (item as any).msg;
          const maybeLoc = (item as any).loc;

          if (typeof maybeMsg === "string") {
            if (Array.isArray(maybeLoc) && maybeLoc.length > 0) {
              return `${maybeLoc.join(".")}: ${maybeMsg}`;
            }
            return maybeMsg;
          }
        }

        try {
          return JSON.stringify(item);
        } catch {
          return String(item);
        }
      })
      .filter(Boolean)
      .join(" | ");
  }

  if (value && typeof value === "object") {
    const maybeMessage = (value as any).message;
    const maybeDetail = (value as any).detail;

    if (typeof maybeMessage === "string") return maybeMessage;
    if (maybeDetail !== undefined) return toReadableError(maybeDetail);

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }

  return "";
};

// Función utilitaria para manejar respuestas de fetch
export const handleFetchResponse = async <T = any>(
  response: Response,
): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    let parsedBody: unknown = errorText;

    if (errorText) {
      try {
        parsedBody = JSON.parse(errorText);
      } catch {
        parsedBody = errorText;
      }
    }

    const responseObject =
      parsedBody && typeof parsedBody === "object"
        ? (parsedBody as Record<string, unknown>)
        : undefined;

    const detail = responseObject?.detail ?? parsedBody;
    const errorMessage =
      toReadableError(responseObject?.message) ||
      toReadableError(detail) ||
      toReadableError(parsedBody) ||
      `HTTP ${response.status}: ${response.statusText}`;

    throw new APIError({
      message: errorMessage,
      status: response.status,
      statusText: response.statusText,
      detail,
      body: parsedBody,
    });
  }

  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }

  return response.text() as Promise<T>;
};

// Función para crear opciones de fetch con headers por defecto
export const createFetchOptions = (options: RequestInit = {}): RequestInit => {
  // Buscar el token en ambas ubicaciones (primero keycloak_token, luego auth_token)
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("keycloak_token") ||
        localStorage.getItem("auth_token")
      : null;

  // Para FormData, no establecer Content-Type (el navegador lo hace automáticamente)
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const headers = new Headers(isFormData ? {} : API_CONFIG.DEFAULT_HEADERS);

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
    options: RequestInit = {},
  ): Promise<T> {
    const url = endpoint.startsWith("http")
      ? endpoint
      : `${API_CONFIG.BASE_URL}${endpoint}`;
    const fetchOptions = createFetchOptions(options);

    try {
      const response = await fetch(url, fetchOptions);
      return await handleFetchResponse<T>(response);
    } catch (error) {
      // HTTP 4xx responses are expected application-level outcomes in flows
      // such as collaborative-review conflicts and session recovery. Logging
      // them with console.error makes Next.js show a development error overlay
      // even when the caller handles the APIError correctly.
      if (isAPIError(error) && error.status < 500) {
        console.warn(
          `API response - ${options.method || "GET"} ${url}:`,
          error.message,
        );
      } else {
        console.error(`API Error - ${options.method || "GET"} ${url}:`, error);
      }

      throw error;
    }
  }

  protected static async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
  ): Promise<T> {
    const url = params ? buildURL(endpoint, params) : endpoint;
    return this.request<T>(url, { method: "GET" });
  }

  protected static async post<T = any>(
    endpoint: string,
    data?: any,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  protected static async put<T = any>(
    endpoint: string,
    data?: any,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  protected static async patch<T = any>(
    endpoint: string,
    data?: any,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  protected static async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}
