/**
 * Exporta contenido HTML usando Puppeteer en el servidor
 */

export interface PuppeteerExportConfig {
  html: string;
  width: number;
  height: number;
  format: "png" | "jpg";
  quality: number;
  filename: string;
}

/**
 * Exporta HTML a imagen usando Puppeteer via API route
 */
export async function exportWithPuppeteer(
  config: PuppeteerExportConfig
): Promise<void> {
  console.log("🚀 Iniciando exportación con Puppeteer...");

  try {
    const response = await fetch("/api/export-bulletin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html: config.html,
        width: config.width,
        height: config.height,
        format: config.format,
        quality: config.quality,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.details || "Error al exportar");
    }

    console.log("✅ Imagen generada exitosamente");

    // Convertir la respuesta a blob
    const blob = await response.blob();

    // Crear URL temporal y descargar
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = config.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Liberar el objeto URL
    setTimeout(() => URL.revokeObjectURL(url), 100);

    console.log(`✅ Archivo descargado: ${config.filename}`);
  } catch (error) {
    console.error("❌ Error al exportar con Puppeteer:", error);
    throw error;
  }
}

/**
 * Serializa el HTML de un elemento incluyendo todos sus estilos
 */
export function serializeElementToHTML(element: HTMLElement): string {
  // Clonar el elemento para no modificar el original
  const clone = element.cloneNode(true) as HTMLElement;

  // Obtener todos los estilos computados del documento
  const styles = Array.from(document.styleSheets)
    .filter((sheet) => {
      try {
        // Verificar que podemos acceder a las reglas
        return sheet.cssRules !== null;
      } catch {
        return false;
      }
    })
    .map((sheet) => {
      try {
        return Array.from(sheet.cssRules)
          .map((rule) => rule.cssText)
          .join("\n");
      } catch {
        return "";
      }
    })
    .join("\n");

  // Obtener todos los links de fuentes (Google Fonts, etc.)
  const fontLinks = Array.from(
    document.querySelectorAll('link[rel="stylesheet"]')
  )
    .filter((link) => {
      const href = link.getAttribute("href");
      return (
        href &&
        (href.includes("fonts.googleapis.com") ||
          href.includes("fonts.gstatic.com"))
      );
    })
    .map((link) => link.outerHTML)
    .join("\n");

  // Construir el HTML completo con estilos y fuentes
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        ${fontLinks}
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            margin: 0;
            padding: 0;
            overflow: visible;
          }

          ${styles}
        </style>
      </head>
      <body>
        ${clone.outerHTML}
      </body>
    </html>
  `;

  return html;
}
