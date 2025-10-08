import html2canvas from "html2canvas";

/**
 * Captura screenshots de las secciones del template preview
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
  onSectionChange?: (index: number) => void
): Promise<Blob[]> {
  console.log(`🔍 Looking for preview container: ${previewContainerId}`);
  const previewContainer = document.getElementById(previewContainerId);

  if (!previewContainer) {
    console.error(
      `❌ Preview container with id "${previewContainerId}" not found`
    );
    throw new Error(
      `Preview container with id "${previewContainerId}" not found`
    );
  }

  console.log(
    `✅ Preview container found, dimensions: ${previewContainer.offsetWidth}x${previewContainer.offsetHeight}`
  );
  console.log(`📋 Will capture ${sectionCount} section(s)`);

  const thumbnails: Blob[] = [];

  // Iterar sobre cada sección
  for (let i = 0; i < sectionCount; i++) {
    console.log(`📸 Capturing section ${i + 1}/${sectionCount}`);

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
      console.log(
        `✅ Section ${i + 1} captured successfully (${blob.size} bytes)`
      );
    } catch (error) {
      console.error(`❌ Error capturing section ${i + 1}:`, error);
      throw error;
    }
  }

  console.log(`🎉 All ${thumbnails.length} thumbnails captured successfully`);
  return thumbnails;
}

/**
 * Captura un único elemento del DOM como imagen
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
    console.log(`🎨 Starting capture for: ${elementId}`);
    console.log("🔍 Detecting problematic colors...");

    // Detectar qué elementos tienen colores problemáticos en el original
    const problematicElements: { el: Element; props: string[] }[] = [];
    const originalElements = element.querySelectorAll("*");

    originalElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        const computed = window.getComputedStyle(el);
        const problematicProps: string[] = [];

        // Revisar solo las propiedades más comunes
        [
          "color",
          "backgroundColor",
          "borderColor",
          "boxShadow",
          "textShadow",
        ].forEach((prop) => {
          const value = computed.getPropertyValue(prop);
          if (
            value &&
            (value.includes("lab") ||
              value.includes("lch") ||
              value.includes("oklab") ||
              value.includes("oklch"))
          ) {
            problematicProps.push(prop);
          }
        });

        if (problematicProps.length > 0) {
          problematicElements.push({ el, props: problematicProps });
        }
      }
    });

    console.log(
      `⚠️ Found ${problematicElements.length} elements with lab/lch/oklab colors`
    );

    // Crear wrapper
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "-9999px";
    wrapper.style.top = "0";
    wrapper.style.width = element.offsetWidth + "px";

    // Clonar el elemento
    const clonedContainer = element.cloneNode(true) as HTMLElement;

    // Limpiar estilos inline con colores problemáticos
    console.log("🧹 Sanitizing clone...");
    const allElements = clonedContainer.querySelectorAll("*");
    allElements.forEach((el) => {
      if (el instanceof HTMLElement) {
        const inlineStyle = el.getAttribute("style");
        if (
          inlineStyle &&
          (inlineStyle.includes("lab(") ||
            inlineStyle.includes("lch(") ||
            inlineStyle.includes("oklab(") ||
            inlineStyle.includes("oklch("))
        ) {
          const cleaned = inlineStyle
            .replace(/lab\([^)]+\)/gi, "rgb(0, 0, 0)")
            .replace(/lch\([^)]+\)/gi, "rgb(0, 0, 0)")
            .replace(/oklab\([^)]+\)/gi, "rgb(0, 0, 0)")
            .replace(/oklch\([^)]+\)/gi, "rgb(0, 0, 0)");
          el.setAttribute("style", cleaned);
        }
      }
    });

    wrapper.appendChild(clonedContainer);
    document.body.appendChild(wrapper);

    // Tiempo para que se renderice
    await new Promise((resolve) => setTimeout(resolve, 100));

    let canvas: HTMLCanvasElement;

    try {
      console.log("📸 Capturing with html2canvas using ignoreElements...");

      // SOLUCIÓN DEFINITIVA: Usar ignoreElements para que html2canvas ignore stylesheets
      // y solo use estilos inline (que ya limpiamos)
      canvas = await Promise.race([
        html2canvas(clonedContainer, {
          backgroundColor: "#ffffff",
          scale: 1.5,
          logging: true, // Activar temporalmente para ver qué pasa
          useCORS: true,
          allowTaint: false,
          foreignObjectRendering: false,
          // Ignorar todos los elementos <style> y <link> para evitar que lea CSS externo
          ignoreElements: (element) => {
            return element.tagName === "STYLE" || element.tagName === "LINK";
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("html2canvas timeout after 10 seconds")),
            10000
          )
        ),
      ]);

      console.log(`✅ Canvas created: ${canvas.width}x${canvas.height}`);
    } finally {
      // Remover el wrapper completo del DOM
      if (document.body.contains(wrapper)) {
        document.body.removeChild(wrapper);
        console.log("🧹 Wrapper removed from DOM");
      }
    }

    // Convertir canvas a blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log(`✅ Blob created for ${elementId}: ${blob.size} bytes`);
          resolve(blob);
        } else {
          console.error(`❌ Failed to create blob for ${elementId}`);
          reject(new Error(`Failed to create blob for ${elementId}`));
        }
      }, "image/png");
    });

    return blob;
  } catch (error) {
    console.error(`❌ Error capturing ${elementId}:`, error);
    throw error;
  }
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
  console.log(
    `📦 Preparing to upload ${thumbnails.length} thumbnail(s) for template ${templateId}`
  );
  const formData = new FormData();

  thumbnails.forEach((blob, index) => {
    console.log(`📎 Appending file ${index}: ${blob.size} bytes`);
    formData.append("files", blob, `section_${index}.png`);
  });

  formData.append("templateId", templateId);

  console.log("🌐 Sending POST request to /api/save-thumbnail...");
  const response = await fetch("/api/save-thumbnail", {
    method: "POST",
    body: formData,
  });

  console.log(`📡 Response status: ${response.status} ${response.statusText}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Upload failed:", errorText);
    throw new Error(
      `Failed to upload thumbnails: ${response.status} ${errorText}`
    );
  }

  const result = await response.json();
  console.log("📄 Response data:", result);

  if (!result.success) {
    console.error("❌ Upload unsuccessful:", result.error);
    throw new Error(result.error || "Failed to upload thumbnails");
  }

  console.log("✅ Thumbnails uploaded, paths:", result.data.thumbnail_images);
  return result.data.thumbnail_images;
}

/**
 * Proceso completo: capturar y subir thumbnails
 * @param previewContainerId ID del contenedor del preview
 * @param templateId ID del template
 * @param sectionCount Número de secciones a capturar
 * @param onSectionChange Callback para cambiar de sección
 * @returns Array de rutas a los thumbnails guardados
 */
export async function generateAndUploadThumbnails(
  previewContainerId: string,
  templateId: string,
  sectionCount: number = 1,
  onSectionChange?: (index: number) => void
): Promise<string[]> {
  try {
    console.log("📸 Capturing template thumbnails...");
    console.log(`   Container ID: ${previewContainerId}`);
    console.log(`   Template ID: ${templateId}`);
    console.log(`   Sections to capture: ${sectionCount}`);

    // Dar tiempo para que las imágenes y estilos se carguen completamente
    console.log("⏳ Waiting for render...");
    await new Promise((resolve) => setTimeout(resolve, 500));

    const thumbnails = await captureTemplateThumbnails(
      previewContainerId,
      sectionCount,
      onSectionChange
    );

    console.log(`✅ Captured ${thumbnails.length} thumbnail(s)`);

    console.log("☁️ Uploading thumbnails...");
    const thumbnailPaths = await uploadThumbnails(thumbnails, templateId);

    console.log("✅ Thumbnails uploaded successfully:", thumbnailPaths);

    return thumbnailPaths;
  } catch (error) {
    console.error("❌ Fatal error in generateAndUploadThumbnails:", error);
    throw error;
  }
}
