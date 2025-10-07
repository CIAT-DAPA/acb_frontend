import html2canvas from "html2canvas";

/**
 * Captura screenshots de las secciones del template preview
 * @param previewContainerId ID del contenedor del preview
 * @returns Array de Blobs con las imágenes capturadas
 */
export async function captureTemplateThumbnails(
  previewContainerId: string
): Promise<Blob[]> {
  const previewContainer = document.getElementById(previewContainerId);

  if (!previewContainer) {
    throw new Error(`Preview container with id "${previewContainerId}" not found`);
  }

  const thumbnails: Blob[] = [];

  // Buscar todos los elementos de sección dentro del preview
  const sectionElements = previewContainer.querySelectorAll(
    '[data-section-preview]'
  );

  if (sectionElements.length === 0) {
    // Si no hay secciones específicas, capturar todo el preview
    const canvas = await html2canvas(previewContainer, {
      backgroundColor: "#ffffff",
      scale: 2, // Mayor calidad
      logging: false,
      useCORS: true,
    });

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to create blob from canvas"));
      }, "image/png");
    });

    thumbnails.push(blob);
  } else {
    // Capturar cada sección individualmente
    for (const section of Array.from(sectionElements)) {
      const canvas = await html2canvas(section as HTMLElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        logging: false,
        useCORS: true,
      });

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob from canvas"));
        }, "image/png");
      });

      thumbnails.push(blob);
    }
  }

  return thumbnails;
}

/**
 * Sube los thumbnails al servidor
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
    throw new Error("Failed to upload thumbnails");
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to upload thumbnails");
  }

  return result.data.thumbnail_images;
}

/**
 * Proceso completo: capturar y subir thumbnails
 * @param previewContainerId ID del contenedor del preview
 * @param templateId ID del template
 * @returns Array de rutas a los thumbnails guardados
 */
export async function generateAndUploadThumbnails(
  previewContainerId: string,
  templateId: string
): Promise<string[]> {
  console.log("📸 Capturing template thumbnails...");
  const thumbnails = await captureTemplateThumbnails(previewContainerId);

  console.log(`✅ Captured ${thumbnails.length} thumbnail(s)`);

  console.log("☁️ Uploading thumbnails...");
  const thumbnailPaths = await uploadThumbnails(thumbnails, templateId);

  console.log("✅ Thumbnails uploaded successfully:", thumbnailPaths);

  return thumbnailPaths;
}
