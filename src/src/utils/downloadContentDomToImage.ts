import domtoimage from "dom-to-image-more";
import jsPDF from "jspdf";
import JSZip from "jszip";

/**
 * VERSIÓN USANDO DOM-TO-IMAGE-MORE
 * Usa SVG foreignObject para mejor preservación de estilos CSS (Tailwind, flexbox, etc.)
 */

export type QualityOption = "low" | "medium" | "high" | "ultra";
export type PageSize = "auto" | "a4" | "letter" | "legal";
export type DownloadFormat = "png" | "jpg" | "pdf";

export interface DomToImageDownloadConfig {
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

const QUALITY_VALUE: Record<QualityOption, number> = {
  low: 0.7,
  medium: 0.85,
  high: 0.95,
  ultra: 1.0,
};

const PAGE_DIMENSIONS: Record<Exclude<PageSize, "auto">, [number, number]> = {
  a4: [210, 297],
  letter: [216, 279],
  legal: [216, 356],
};

/**
 * Descarga contenido desde un preview ya renderizado usando dom-to-image-more
 */
export async function downloadFromPreviewDomToImage(
  config: DomToImageDownloadConfig
): Promise<void> {
  const {
    previewContainerId,
    contentName,
    format,
    totalSections,
    sectionIndices,
    onSectionChange,
    quality = "ultra",
    pageSize = "auto",
    sectionsPerPage = 1,
    onProgress,
  } = config;

  try {
    // Determinar qué secciones capturar
    const indicesToCapture = sectionIndices || Array.from({ length: totalSections }, (_, i) => i);

    onProgress?.(0, 100, "Iniciando captura...");

    // Capturar secciones
    const blobs = await captureSectionsWithDomToImage(
      previewContainerId,
      indicesToCapture,
      onSectionChange,
      QUALITY_VALUE[quality],
      format,
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
      if (blobs.length === 1) {
        // Descarga directa
        onProgress?.(90, 100, "Descargando...");
        downloadBlob(blobs[0], `${filename}.${format}`);
      } else {
        // Crear ZIP
        onProgress?.(80, 100, "Creando ZIP...");
        const zip = new JSZip();
        blobs.forEach((blob, index) => {
          zip.file(`${filename}_seccion_${indicesToCapture[index] + 1}.${format}`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: "blob" });
        onProgress?.(95, 100, "Descargando ZIP...");
        downloadBlob(zipBlob, `${filename}.zip`);
      }
    }

    onProgress?.(100, 100, "¡Descarga completada!");
  } catch (error) {
    console.error("Error en downloadFromPreviewDomToImage:", error);
    throw error;
  }
}

/**
 * Captura múltiples secciones usando dom-to-image-more
 */
async function captureSectionsWithDomToImage(
  containerId: string,
  sectionIndices: number[],
  onSectionChange: (index: number) => void,
  quality: number,
  format: DownloadFormat,
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> {
  const container = document.getElementById(containerId);

  if (!container) {
    throw new Error(`Container con id "${containerId}" no encontrado`);
  }

  // Buscar el template-preview-container
  const templatePreviewContainerWrapper = container.querySelector("#template-preview-container") as HTMLElement;
  
  if (!templatePreviewContainerWrapper) {
    throw new Error(
      `No se encontró #template-preview-container dentro de #${containerId}. ` +
      `Asegúrate de que TemplatePreview esté renderizado dentro del modal.`
    );
  }

  // Obtener el primer hijo directo (el div con bg-white y dimensiones fijas, SIN bordes)
  const templatePreviewContainer = templatePreviewContainerWrapper.querySelector(".bg-white") as HTMLElement;
  
  if (!templatePreviewContainer) {
    throw new Error(
      `No se encontró el div de contenido (bg-white) dentro de #template-preview-container.`
    );
  }

  console.log("✅ [dom-to-image] Encontrado contenedor de preview con dimensiones:", {
    width: templatePreviewContainer.offsetWidth,
    height: templatePreviewContainer.offsetHeight,
    classes: templatePreviewContainer.className
  });

  const blobs: Blob[] = [];

  for (let i = 0; i < sectionIndices.length; i++) {
    const sectionIndex = sectionIndices[i];

    // Cambiar a la sección
    onSectionChange(sectionIndex);

    // Esperar a que React actualice el DOM
    await new Promise((resolve) => setTimeout(resolve, 500));

    const blob = await captureElementWithDomToImage(
      templatePreviewContainer, 
      quality,
      format
    );
    blobs.push(blob);

    onProgress?.(i + 1, sectionIndices.length);
  }

  return blobs;
}

/**
 * Captura un elemento usando dom-to-image-more
 */
async function captureElementWithDomToImage(
  element: HTMLElement,
  quality: number,
  format: DownloadFormat
): Promise<Blob> {
  const width = element.offsetWidth;
  const height = element.offsetHeight;

  console.log(`📸 [dom-to-image] Capturando elemento de ${width}x${height}px`);

  // Guardar el scroll original y resetear a 0 para capturar desde arriba
  const originalScrollTop = element.scrollTop;
  const originalScrollLeft = element.scrollLeft;
  element.scrollTop = 0;
  element.scrollLeft = 0;

  // Esperar un momento para que se actualice el scroll
  await new Promise(resolve => setTimeout(resolve, 100));

  const options = {
    width,
    height,
    quality,
    bgcolor: "#ffffff",
    style: {
      // Asegurar que el elemento mantenga sus dimensiones
      width: `${width}px`,
      height: `${height}px`,
      margin: '0',
      padding: '0',
      overflow: 'visible', // Importante: hacer visible el contenido que está fuera
      transform: 'none',
      position: 'relative',
      border: 'none', // Eliminar cualquier borde del contenedor principal
      outline: 'none', // Eliminar outline
      boxShadow: 'none', // Eliminar sombras
    },
    // Cachear para mejor rendimiento
    cacheBust: false,
    // Filtro inteligente: solo quitar bordes que NO están en el diseño original
    filter: (node: Node) => {
      if (node instanceof HTMLElement) {
        // Obtener los estilos computados originales
        const computedStyle = window.getComputedStyle(node);
        const originalBorderStyle = computedStyle.borderStyle;
        const originalBorderWidth = computedStyle.borderWidth;
        
        // Solo quitar bordes si el elemento originalmente NO tiene bordes definidos
        if (originalBorderStyle === 'none' || originalBorderWidth === '0px') {
          // Este elemento NO debería tener borde, así que lo quitamos
          node.style.border = 'none';
          node.style.borderWidth = '0';
          node.style.borderStyle = 'none';
          node.style.outline = 'none';
          node.style.outlineWidth = '0';
        }
        // Si tiene bordes originales, los dejamos intactos
        
        // Para imágenes y SVGs, siempre quitar outline y boxShadow (que raramente son intencionales)
        if (node.tagName === 'IMG' || node.tagName === 'SVG') {
          node.style.outline = 'none';
          node.style.boxShadow = 'none';
          // Solo quitar border si no tenía uno original
          if (originalBorderStyle === 'none') {
            node.style.border = 'none';
          }
        }
      }
      return true;
    },
  };

  try {
    let blob: Blob;

    if (format === "jpg") {
      // Para JPG usamos toJpeg (devuelve dataURL)
      const dataUrl = await domtoimage.toJpeg(element, options);
      // Convertir dataURL a Blob
      const response = await fetch(dataUrl);
      blob = await response.blob();
    } else {
      // Para PNG usamos toBlob directamente
      blob = await domtoimage.toBlob(element, options);
    }

    console.log(`✅ [dom-to-image] Captura exitosa:`, {
      size: `${(blob.size / 1024).toFixed(2)} KB`,
      type: blob.type
    });

    // Restaurar scroll original
    element.scrollTop = originalScrollTop;
    element.scrollLeft = originalScrollLeft;

    return blob;
  } catch (error) {
    console.error("❌ [dom-to-image] Error en captura:", error);
    // Restaurar scroll incluso si hay error
    element.scrollTop = originalScrollTop;
    element.scrollLeft = originalScrollLeft;
    throw error;
  }
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

  onProgress?.(0.2);

  // Determinar dimensiones de la página
  let pdfWidth: number, pdfHeight: number;

  if (pageSize === "auto") {
    // Obtener dimensiones de la primera imagen
    const firstImage = await loadImage(imageDataUrls[0]);
    pdfWidth = (firstImage.width * 25.4) / 96; // px a mm
    pdfHeight = (firstImage.height * 25.4) / 96;
  } else {
    [pdfWidth, pdfHeight] = PAGE_DIMENSIONS[pageSize];
  }

  onProgress?.(0.4);

  // Crear PDF
  const pdf = new jsPDF({
    orientation: pdfWidth > pdfHeight ? "landscape" : "portrait",
    unit: "mm",
    format: [pdfWidth, pdfHeight],
  });

  // Agregar imágenes
  for (let i = 0; i < imageDataUrls.length; i++) {
    if (i > 0 && i % sectionsPerPage === 0) {
      pdf.addPage();
    }

    const img = await loadImage(imageDataUrls[i]);
    const imgWidth = pdfWidth;
    const imgHeight = (img.height * pdfWidth) / img.width;

    // Calcular posición Y si hay múltiples secciones por página
    const yPosition = (i % sectionsPerPage) * (pdfHeight / sectionsPerPage);

    pdf.addImage(
      imageDataUrls[i],
      "PNG",
      0,
      yPosition,
      imgWidth,
      imgHeight
    );

    onProgress?.((i + 1) / imageDataUrls.length);
  }

  // Descargar PDF
  pdf.save(`${filename}.pdf`);
  onProgress?.(1);
}

/**
 * Convierte Blob a Data URL
 */
function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Carga una imagen desde data URL
 */
function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = dataUrl;
  });
}

/**
 * Descarga un Blob como archivo
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
