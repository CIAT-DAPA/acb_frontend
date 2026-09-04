/**
 * Utilidades para el modo "embed" (incrustar el boletín en un iframe externo).
 *
 * Las rutas de embed viven en `/[locale]/embed/...` y se renderizan SIN el
 * chrome de la aplicación (Navbar, Footer, banner de cookies) y sin inicializar
 * Keycloak, para que puedan mostrarse dentro de un <iframe> de otro sitio.
 */

/** Segmento de ruta que identifica una vista embebible. */
export const EMBED_SEGMENT = "embed";

/**
 * Indica si un pathname corresponde a una vista embebible.
 * Acepta tanto `/es/embed/...` (con prefijo de locale) como `/embed/...`.
 */
export function isEmbedPathname(pathname?: string | null): boolean {
  if (!pathname) return false;

  return new RegExp(`(^|/)${EMBED_SEGMENT}(/|$)`).test(pathname);
}

/** Versión para usar fuera de React (por ejemplo, dentro de un provider). */
export function isEmbedWindow(): boolean {
  if (typeof window === "undefined") return false;

  return isEmbedPathname(window.location.pathname);
}
