/**
 * Utilidades para mejorar SEO y structured data
 */

export interface BulletinSchemaData {
  title: string;
  description?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  url: string;
}

/**
 * Limpiar meta tags duplicados de charset
 */
function cleanupDuplicateCharset(): void {
  if (typeof document === "undefined") return;

  const charsetMetas = document.querySelectorAll(
    "meta[charset], meta[charSet]",
  );
  const charsetArray = Array.from(charsetMetas);

  // Mantener solo el primero, eliminar los demás
  if (charsetArray.length > 1) {
    for (let i = 1; i < charsetArray.length; i++) {
      charsetArray[i].remove();
    }
  }
}

/**
 * Genera un schema JSON-LD para artículos/noticias (usado para boletines)
 */
export function generateArticleSchema(data: BulletinSchemaData): string {
  const schema = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: data.title,
    description: data.description || data.title,
    author: data.author
      ? {
          "@type": "Organization",
          name: data.author,
        }
      : undefined,
    datePublished: data.datePublished || new Date().toISOString(),
    dateModified: data.dateModified || new Date().toISOString(),
    url: data.url,
    inLanguage: "es",
    publisher: {
      "@type": "Organization",
      name: "CIAT",
      logo: {
        "@type": "ImageObject",
        url: "https://bulletinbuilder.ciat.cgiar.org/assets/logo.png",
      },
    },
  };

  // Remover propiedades undefined
  return JSON.stringify(schema, (key, value) => {
    if (value === undefined) return undefined;
    return value;
  });
}

/**
 * Genera un schema JSON-LD para organización
 */
export function generateOrganizationSchema(): string {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Bulletin Builder",
    description: "Platform for creating agroclimatic bulletins",
    url: "https://bulletinbuilder.ciat.cgiar.org",
    logo: "https://bulletinbuilder.ciat.cgiar.org/assets/logo.png",
    sameAs: [
      "https://www.facebook.com/ciat",
      "https://twitter.com/ciat",
      "https://www.linkedin.com/company/ciat",
    ],
  });
}

/**
 * Genera un schema JSON-LD para breadcrumb navigation
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url: string }>,
): string {
  const breadcrumbList = items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: item.url,
  }));

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbList,
  });
}

/**
 * Inyectar un schema JSON-LD en el head del documento
 */
export function injectSchema(schemaJson: string): void {
  if (typeof document === "undefined") return;

  // Limpiar duplicados de charset
  cleanupDuplicateCharset();

  // Limpiar scripts JSON-LD anteriores del tipo NewsArticle o BreadcrumbList
  const existingScripts = document.querySelectorAll(
    'script[type="application/ld+json"]',
  );
  existingScripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || "{}");
      if (
        data["@type"] === "NewsArticle" ||
        data["@type"] === "BreadcrumbList"
      ) {
        script.remove();
      }
    } catch {
      // Si no es válido JSON, ignorar
    }
  });

  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = schemaJson;
  document.head.appendChild(script);
}

/**
 * Actualizar o crear una meta tag
 */
export function setMetaTag(
  name: string,
  content: string,
  property: boolean = false,
): void {
  if (typeof document === "undefined") return;

  // Limpiar duplicados de charset en la primera llamada
  cleanupDuplicateCharset();

  // Evitar duplicar charset (ya viene del layout)
  if (name === "charset" || name === "charSet") {
    return;
  }

  const attr = property ? "property" : "name";
  let meta = document.querySelector(`meta[${attr}="${name}"]`);

  // Si ya existe el meta tag con el mismo atributo y valor, actualizar solo el content
  // Esto evita crear duplicados
  if (meta) {
    meta.setAttribute("content", content);
    return;
  }

  // Crear nuevo meta tag
  meta = document.createElement("meta");
  meta.setAttribute(attr, name);
  meta.setAttribute("content", content);

  // Insertar después del viewport meta tag
  const viewportMeta = document.querySelector('meta[name="viewport"]');
  if (viewportMeta) {
    // Insertar como el siguiente hermano después del viewport
    const nextElement = viewportMeta.nextElementSibling;
    if (nextElement) {
      viewportMeta.parentNode?.insertBefore(meta, nextElement);
    } else {
      viewportMeta.parentNode?.appendChild(meta);
    }
  } else {
    document.head.appendChild(meta);
  }
}

/**
 * Establecer múltiples meta tags a la vez
 */
export function setMetaTags(tags: Record<string, string>): void {
  Object.entries(tags).forEach(([key, value]) => {
    setMetaTag(key, value);
  });
}

/**
 * Generar URL canónica
 */
export function setCanonicalUrl(url: string): void {
  if (typeof document === "undefined") return;

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    document.head.appendChild(canonical);
  }
  canonical.setAttribute("href", url);
}
