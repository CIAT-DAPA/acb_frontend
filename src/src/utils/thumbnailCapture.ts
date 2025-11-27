/**
 * Captura screenshots de las secciones del template preview usando html-to-image
 * Nota: Esta función espera que el preview muestre una sección a la vez
 * y necesita que externamente se cambie selectedSectionIndex antes de llamarla
 * @param previewContainerId ID del contenedor del preview
 * @param sectionCount Número total de secciones a capturar
 * @param onSectionChange Callback para cambiar de sección (recibe el índice)
 * @returns Array de Blobs con las imágenes capturadas (una por sección)
 */
export async function captureTemplateThumbnails(
  previewContainerId: string,
  sectionCount: number = 1,
  onSectionChange?: (index: number) => void,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<Blob[]> {
  const previewContainer = document.getElementById(previewContainerId);

  if (!previewContainer) {
    console.error(
      `❌ Preview container with id "${previewContainerId}" not found`
    );
    throw new Error(
      `Preview container with id "${previewContainerId}" not found`
    );
  }

  // Limitar a máximo 3 secciones para thumbnails
  const maxThumbnails = 3;
  const sectionsToCapture = Math.min(sectionCount, maxThumbnails);

  const thumbnails: Blob[] = [];

  // Iterar sobre cada sección (máximo 3)
  for (let i = 0; i < sectionsToCapture; i++) {
    // Reportar progreso
    if (onProgress) {
      onProgress(
        i,
        sectionsToCapture,
        `Generando thumbnail ${i + 1} de ${sectionsToCapture}...`
      );
    }

    // Si hay un callback, usarlo para cambiar de sección
    if (onSectionChange) {
      onSectionChange(i);
      // Dar tiempo para que React actualice el DOM
      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    try {
      const blob = await captureSingleElement(
        previewContainer,
        `section-${i}`,
        i
      );
      thumbnails.push(blob);
    } catch (error) {
      console.error(`❌ Error capturing section ${i + 1}:`, error);
      throw error;
    }
  }

  // Reportar finalización
  if (onProgress) {
    onProgress(
      sectionsToCapture,
      sectionsToCapture,
      "¡Thumbnails generados exitosamente!"
    );
  }

  return thumbnails;
}

/**
 * Captura un único elemento del DOM como imagen usando html-to-image
 * @param element Elemento HTML a capturar
 * @param elementId ID del elemento (para logs)
 * @param index Índice de la sección
 * @returns Blob con la imagen capturada
 */
async function captureSingleElement(
  element: HTMLElement,
  elementId: string,
  index: number = 0
): Promise<Blob> {
  try {
    // Importar html-to-image dinámicamente
    const { toPng } = await import("html-to-image");

    // Esperar a que todas las imágenes se carguen
    const images = element.querySelectorAll("img");
    if (images.length > 0) {
      await Promise.all(
        Array.from(images).map((img) => {
          if (img.complete && img.naturalHeight !== 0)
            return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = () => resolve(true);
            img.onerror = () => {
              console.warn("⚠️ Error cargando imagen:", img.src);
              resolve(false);
            };
            // Timeout de 5 segundos por imagen
            setTimeout(() => resolve(false), 5000);
          });
        })
      );
    }

    // Esperar a que las fuentes se carguen
    await document.fonts.ready;

    // Delay adicional para asegurar renderizado completo
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Capturar el elemento como PNG con calidad media (1.5x scale para thumbnails)
    const dataUrl = await toPng(element, {
      pixelRatio: 1.5, // Calidad media para thumbnails
      cacheBust: true,
      backgroundColor: "#ffffff",
    });

    // Convertir data URL a blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();

    return blob;
  } catch (error) {
    console.error(`❌ Error capturing ${elementId}:`, error);
    throw error;
  }
}

/**
 * Sube los thumbnails al servidor
 * IMPORTANTE: Esta función elimina automáticamente los thumbnails antiguos del template
 * antes de guardar los nuevos, asegurando que no queden archivos obsoletos.
 * @param thumbnails Array de Blobs con las imágenes
 * @param templateId ID del template
 * @returns Array de rutas a los thumbnails guardados
 */
export async function uploadThumbnails(
  thumbnails: Blob[],
  templateId: string
): Promise<string[]> {
  const formData = new FormData();

  thumbnails.forEach((blob, index) => {
    formData.append("files", blob, `section_${index}.png`);
  });

  formData.append("templateId", templateId);

  const response = await fetch("/api/save-thumbnail", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Upload failed:", errorText);
    throw new Error(
      `Failed to upload thumbnails: ${response.status} ${errorText}`
    );
  }

  const result = await response.json();

  if (!result.success) {
    console.error("❌ Upload unsuccessful:", result.error);
    throw new Error(result.error || "Failed to upload thumbnails");
  }

  return result.data.thumbnail_images;
}

/**
 * Proceso completo: capturar y subir thumbnails
 *
 * Esta función realiza el proceso completo de generación de thumbnails:
 * 1. Captura hasta 3 thumbnails de las secciones del template/bulletin/card
 * 2. Elimina automáticamente los thumbnails antiguos del mismo template
 * 3. Guarda los nuevos thumbnails en el servidor
 *
 * @param previewContainerId ID del contenedor del preview
 * @param templateId ID del template/bulletin/card
 * @param sectionCount Número de secciones a capturar (máximo 3)
 * @param onSectionChange Callback para cambiar de sección
 * @param onProgress Callback para reportar progreso (current, total, message)
 * @returns Array de rutas a los thumbnails guardados
 */
export async function generateAndUploadThumbnails(
  previewContainerId: string,
  templateId: string,
  sectionCount: number = 1,
  onSectionChange?: (index: number) => void,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<string[]> {
  try {
    if (onProgress) {
      onProgress(0, 100, "Preparando captura de thumbnails...");
    }

    // Dar tiempo para que las imágenes y estilos se carguen completamente
    await new Promise((resolve) => setTimeout(resolve, 500));

    const thumbnails = await captureTemplateThumbnails(
      previewContainerId,
      sectionCount,
      onSectionChange,
      (current, total, message) => {
        if (onProgress) {
          // Calcular progreso (50% para captura, 50% para subida)
          const captureProgress = Math.round((current / total) * 50);
          onProgress(captureProgress, 100, message);
        }
      }
    );

    if (onProgress) {
      onProgress(50, 100, "Subiendo thumbnails al servidor...");
    }

    const thumbnailPaths = await uploadThumbnails(thumbnails, templateId);

    if (onProgress) {
      onProgress(100, 100, "¡Thumbnails guardados exitosamente!");
    }

    return thumbnailPaths;
  } catch (error) {
    console.error("❌ Fatal error in generateAndUploadThumbnails:", error);
    throw error;
  }
}
