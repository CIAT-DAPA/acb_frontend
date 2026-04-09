const HTTP_PREFIXES = ["http://", "https://", "data:", "blob:"];
const DYNAMIC_ASSET_PREFIX = "/api/dynamic-assets/";

/**
 * Converts legacy/static asset paths to the dynamic assets endpoint.
 * Keeps absolute URLs untouched.
 */
export function normalizeAssetUrl(url?: string | null): string {
  if (!url) return "";

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return "";

  if (HTTP_PREFIXES.some((prefix) => trimmedUrl.startsWith(prefix))) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith(DYNAMIC_ASSET_PREFIX)) {
    return trimmedUrl;
  }

  if (trimmedUrl.startsWith("api/dynamic-assets/")) {
    return `/${trimmedUrl}`;
  }

  const withLeadingSlash = trimmedUrl.startsWith("/")
    ? trimmedUrl
    : `/${trimmedUrl}`;

  if (withLeadingSlash.startsWith("/assets/")) {
    return withLeadingSlash.replace("/assets/", DYNAMIC_ASSET_PREFIX);
  }

  if (
    withLeadingSlash.startsWith("/img/") ||
    withLeadingSlash.startsWith("/thumbnails/")
  ) {
    return `${DYNAMIC_ASSET_PREFIX}${withLeadingSlash.slice(1)}`;
  }

  return withLeadingSlash;
}

/**
 * Creates an absolute URL for browser fetch/download flows.
 */
export function toAbsoluteAssetUrl(url?: string | null): string {
  const normalizedUrl = normalizeAssetUrl(url);
  if (!normalizedUrl) return "";

  if (HTTP_PREFIXES.some((prefix) => normalizedUrl.startsWith(prefix))) {
    return normalizedUrl;
  }

  if (typeof window === "undefined") {
    return normalizedUrl;
  }

  return `${window.location.origin}${normalizedUrl}`;
}
