import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";

/**
 * VERSIÓN SIMPLIFICADA que usa el preview YA RENDERIZADO
 * Esta es más simple y confiable porque reutiliza el componente TemplatePreview existente
 */

export type QualityOption = "low" | "medium" | "high" | "ultra";
export type PageSize = "auto" | "a4" | "letter" | "legal";
export type DownloadFormat = "png" | "jpg" | "pdf";

export interface SimpleDownloadConfig {
  previewContainerId: string; // ID del contenedor del preview (debe estar renderizado)
  contentName: string; // Nombre del contenido para el archivo
  format: DownloadFormat;
  totalSections: number; // Número total de secciones
  sectionIndices?: number[]; // Secciones específicas (undefined = todas)
  onSectionChange: (index: number) => void; // Callback para cambiar de sección
  quality?: QualityOption;
  pageSize?: PageSize;
  sectionsPerPage?: number;
  onProgress?: (current: number, total: number, message: string) => void;
}

const QUALITY_SCALE: Record<QualityOption, number> = {
  low: 1,
  medium: 1.5,
  high: 2,
  ultra: 3,
};

const PAGE_DIMENSIONS: Record<Exclude<PageSize, "auto">, [number, number]> = {
  a4: [210, 297],
  letter: [216, 279],
  legal: [216, 356],
};

/**
 * Descarga contenido desde un preview ya renderizado
 */
export async function downloadFromPreview(
  config: SimpleDownloadConfig
): Promise<void> {
  const {
    previewContainerId,
    contentName,
    format,
    totalSections,
    sectionIndices,
    onSectionChange,
    quality = "high",
    pageSize = "auto",
    sectionsPerPage = 1,
    onProgress,
  } = config;

  try {
    // Determinar qué secciones capturar
    const indicesToCapture = sectionIndices || Array.from({ length: totalSections }, (_, i) => i);

    onProgress?.(0, 100, "Iniciando captura...");

    // Capturar secciones
    const blobs = await captureSectionsFromPreview(
      previewContainerId,
      indicesToCapture,
      onSectionChange,
      QUALITY_SCALE[quality],
      (current, total) => {
        const progress = (current / total) * 70; // 0-70%
        onProgress?.(progress, 100, `Capturando sección ${current}/${total}...`);
      }
    );

    // Generar nombre de archivo
    const date = new Date().toISOString().split("T")[0];
    const safeName = contentName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const filename = `${safeName}_${date}`;

    // Descargar según formato
    if (format === "pdf") {
      onProgress?.(70, 100, "Generando PDF...");
      await downloadAsPDF(blobs, filename, pageSize, sectionsPerPage, (progress) => {
        const pdfProgress = 70 + progress * 25; // 70-95%
        onProgress?.(pdfProgress, 100, "Generando PDF...");
      });
    } else {
      // Convertir a JPG si es necesario
      const finalBlobs = format === "jpg" 
        ? await Promise.all(blobs.map((blob) => convertToJPG(blob)))
        : blobs;

      if (finalBlobs.length === 1) {
        // Descarga directa
        onProgress?.(90, 100, "Descargando...");
        downloadBlob(finalBlobs[0], `${filename}.${format}`);
      } else {
        // Crear ZIP
        onProgress?.(80, 100, "Creando ZIP...");
        const zip = new JSZip();
        finalBlobs.forEach((blob, index) => {
          zip.file(`${filename}_seccion_${indicesToCapture[index] + 1}.${format}`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        onProgress?.(95, 100, "Descargando ZIP...");
        downloadBlob(zipBlob, `${filename}.zip`);
      }
    }

    onProgress?.(100, 100, "¡Descarga completada!");
  } catch (error) {
    console.error("Error en downloadFromPreview:", error);
    throw error;
  }
}

/**
 * Captura múltiples secciones desde el preview renderizado
 * Cambia la sección visible y captura cada una
 */
async function captureSectionsFromPreview(
  containerId: string,
  sectionIndices: number[],
  onSectionChange: (index: number) => void,
  scale: number,
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> {
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error(`Container con id "${containerId}" no encontrado`);
  }

  // Buscar el template-preview-container (el div interno con dimensiones fijas)
  const templatePreviewContainer = container.querySelector("#template-preview-container") as HTMLElement;
  
  if (!templatePreviewContainer) {
    throw new Error(
      `No se encontró el contenedor de preview dentro de #${containerId}. ` +
      `Asegúrate de que TemplatePreview esté renderizado dentro del modal.`
    );
  }

  console.log("✅ Encontrado contenedor de preview con dimensiones:", {
    width: templatePreviewContainer.offsetWidth,
    height: templatePreviewContainer.offsetHeight
  });

  const blobs: Blob[] = [];

  for (let i = 0; i < sectionIndices.length; i++) {
    const sectionIndex = sectionIndices[i];

    // Cambiar a la sección
    onSectionChange(sectionIndex);

    // Esperar a que React actualice el DOM
    await new Promise((resolve) => setTimeout(resolve, 500));

    const blob = await captureSingleElement(templatePreviewContainer, scale);
    blobs.push(blob);

    onProgress?.(i + 1, sectionIndices.length);
  }

  return blobs;
}

/**
 * Captura un elemento con html2canvas (basado en tu código de thumbnails)
 */
async function captureSingleElement(
  element: HTMLElement,
  scale: number
): Promise<Blob> {
  // Crear wrapper oculto CON dimensiones explícitas
  const wrapper = document.createElement("div");
  wrapper.style.position = "absolute";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.width = element.offsetWidth + "px";
  wrapper.style.height = element.offsetHeight + "px"; // ✅ AGREGAR ALTURA
  wrapper.style.overflow = "hidden";

  // Clonar elemento
  const clone = element.cloneNode(true) as HTMLElement;
  
  // ✅ Aplicar dimensiones explícitas al clon para preservar el layout
  clone.style.width = element.offsetWidth + "px";
  clone.style.height = element.offsetHeight + "px";

  // ✅ Copiar estilos computados importantes al clon
  function copyComputedStylesToClone(original: HTMLElement, cloned: HTMLElement) {
    const computedStyle = window.getComputedStyle(original);
    
    // Estilos críticos para preservar el layout de Tailwind
    const criticalStyles = [
      // Flexbox layout
      'display', 'flex-direction', 'justify-content', 'align-items', 'align-content', 'align-self',
      'flex', 'flex-grow', 'flex-shrink', 'flex-basis', 'flex-wrap',
      'gap', 'row-gap', 'column-gap',
      // Spacing
      'margin-top', 'margin-bottom', 'margin-left', 'margin-right',
      'padding-top', 'padding-bottom', 'padding-left', 'padding-right',
      'box-shadow', 'padding', 'margin',
      // Text alignment and typography
      'text-align', 'vertical-align', 'line-height', 'letter-spacing', 'word-spacing',
      'text-indent', 'white-space', 'text-transform',
      // Position and transform
      'position', 'top', 'bottom', 'left', 'right', 'transform',
    ];

    criticalStyles.forEach(prop => {
      const value = computedStyle.getPropertyValue(prop);
      if (value && value !== 'normal' && value !== 'none') {
        cloned.style.setProperty(prop, value, 'important');
      }
    });

    // Recursivamente aplicar a todos los hijos
    const originalChildren = original.children;
    const clonedChildren = cloned.children;
    
    for (let i = 0; i < originalChildren.length; i++) {
      if (originalChildren[i] instanceof HTMLElement && clonedChildren[i] instanceof HTMLElement) {
        copyComputedStylesToClone(
          originalChildren[i] as HTMLElement,
          clonedChildren[i] as HTMLElement
        );
      }
    }
  }

  // Copiar estilos computados antes de limpiar colores
  copyComputedStylesToClone(element, clone);

  // Limpiar estilos problemáticos (lab/lch/oklab)
  const allElements = clone.querySelectorAll("*");
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

  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  await new Promise((resolve) => setTimeout(resolve, 100));

  let canvas: HTMLCanvasElement;

  try {
    canvas = await html2canvas(clone, {
      backgroundColor: "#ffffff",
      scale,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      ignoreElements: (element) => {
        return element.tagName === "STYLE" || element.tagName === "LINK";
      },
    });
  } finally {
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("Failed to create blob"));
    }, "image/png");
  });
}

/**
 * Genera PDF a partir de blobs
 */
async function downloadAsPDF(
  blobs: Blob[],
  filename: string,
  pageSize: PageSize,
  sectionsPerPage: number,
  onProgress?: (progress: number) => void
): Promise<void> {
  // Convertir blobs a data URLs
  const imageDataUrls = await Promise.all(blobs.map((blob) => blobToDataURL(blob)));

  // Determinar dimensiones
  let pdfWidth: number;
  let pdfHeight: number;
  let orientation: "portrait" | "landscape" = "portrait";

  if (pageSize === "auto" && imageDataUrls.length > 0) {
    const img = await loadImage(imageDataUrls[0]);
    pdfWidth = (img.width / 96) * 25.4;
    pdfHeight = (img.height / 96) * 25.4;
    orientation = pdfWidth > pdfHeight ? "landscape" : "portrait";
  } else {
    const dimensions = PAGE_DIMENSIONS[pageSize as Exclude<PageSize, "auto">];
    [pdfWidth, pdfHeight] = dimensions;
  }

  const pdf = new jsPDF({
    orientation,
    unit: "mm",
    format: pageSize === "auto" ? [pdfWidth, pdfHeight] : pageSize,
  });

  // Agrupar imágenes por página
  const totalPages = Math.ceil(imageDataUrls.length / sectionsPerPage);

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    if (pageIndex > 0) {
      pdf.addPage();
    }

    const startIdx = pageIndex * sectionsPerPage;
    const endIdx = Math.min(startIdx + sectionsPerPage, imageDataUrls.length);
    const imagesInPage = imageDataUrls.slice(startIdx, endIdx);

    await layoutImagesOnPage(pdf, imagesInPage, pdfWidth, pdfHeight, sectionsPerPage);

    onProgress?.((pageIndex + 1) / totalPages);
  }

  pdf.save(`${filename}.pdf`);
}

/**
 * Distribuye imágenes en una página PDF manteniendo proporciones
 */
async function layoutImagesOnPage(
  pdf: jsPDF,
  images: string[],
  pageWidth: number,
  pageHeight: number,
  sectionsPerPage: number
): Promise<void> {
  const cols = sectionsPerPage === 1 ? 1 : sectionsPerPage === 2 ? 2 : 2;
  const rows = Math.ceil(sectionsPerPage / cols);

  const cellWidth = pageWidth / cols;
  const cellHeight = pageHeight / rows;
  const padding = 5;

  for (let i = 0; i < images.length; i++) {
    const img = await loadImage(images[i]);
    const col = i % cols;
    const row = Math.floor(i / cols);

    const x = col * cellWidth + padding;
    const y = row * cellHeight + padding;

    const availableWidth = cellWidth - padding * 2;
    const availableHeight = cellHeight - padding * 2;

    const aspectRatio = img.width / img.height;
    let finalWidth = availableWidth;
    let finalHeight = availableWidth / aspectRatio;

    if (finalHeight > availableHeight) {
      finalHeight = availableHeight;
      finalWidth = availableHeight * aspectRatio;
    }

    const offsetX = (availableWidth - finalWidth) / 2;
    const offsetY = (availableHeight - finalHeight) / 2;

    pdf.addImage(images[i], "PNG", x + offsetX, y + offsetY, finalWidth, finalHeight);
  }
}

// Helpers
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function convertToJPG(pngBlob: Blob): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  const img = await createImageBitmap(pngBlob);

  canvas.width = img.width;
  canvas.height = img.height;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Failed to convert to JPG"));
      },
      "image/jpeg",
      0.95
    );
  });
}

async function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}
