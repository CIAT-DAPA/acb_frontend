import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import JSZip from "jszip";
import { ContentService } from "@/services/contentService";
import { ContentType, NormalizedContent } from "@/types/content";

/**
 * Opciones de calidad para la captura
 */
export type QualityOption = "low" | "medium" | "high" | "ultra";

/**
 * Tamaños de página PDF
 */
export type PageSize = "auto" | "a4" | "letter" | "legal";

/**
 * Formatos de descarga disponibles
 */
export type DownloadFormat = "png" | "jpg" | "pdf" | "json";

/**
 * Configuración de descarga
 */
export interface DownloadConfig {
  contentId?: string; // ID del contenido (si no se pasa data)
  contentData?: NormalizedContent; // Data del contenido (si no se pasa id)
  contentType: ContentType;
  format: DownloadFormat;
  sectionIndices?: number[]; // Secciones específicas (undefined = todas)
  quality?: QualityOption;
  pageSize?: PageSize;
  sectionsPerPage?: number; // Para PDF: cuántas secciones por página
  filename?: string; // Nombre del archivo (sin extensión)
  onProgress?: (current: number, total: number, message: string) => void;
}

/**
 * Mapeo de calidad a scale de html2canvas
 */
const QUALITY_SCALE: Record<QualityOption, number> = {
  low: 1,
  medium: 1.5,
  high: 2,
  ultra: 3,
};

/**
 * Dimensiones de páginas PDF en mm
 */
const PAGE_DIMENSIONS: Record<Exclude<PageSize, "auto">, [number, number]> = {
  a4: [210, 297],
  letter: [216, 279],
  legal: [216, 356],
};

/**
 * Función principal de descarga
 */
export async function downloadContent(config: DownloadConfig): Promise<void> {
  const {
    contentId,
    contentData,
    contentType,
    format,
    sectionIndices,
    quality = "high",
    pageSize = "auto",
    sectionsPerPage = 1,
    filename,
    onProgress,
  } = config;

  try {
    // 1. Obtener o validar datos del contenido
    onProgress?.(0, 100, "Cargando datos...");
    let content: NormalizedContent;

    if (contentData) {
      content = contentData;
    } else if (contentId) {
      const response = await ContentService.getContent(contentType, contentId);
      if (!response.success || !response.data) {
        throw new Error(response.message || "No se pudo cargar el contenido");
      }
      content = response.data;
    } else {
      throw new Error("Se requiere contentId o contentData");
    }

    // 2. Generar nombre de archivo
    const finalFilename =
      filename || generateFilename(content.master.name, format);

    // 3. Descarga según formato
    if (format === "json" && contentType === "template") {
      await downloadAsJSON(content, finalFilename);
    } else if (format === "pdf") {
      await downloadAsPDF(content, {
        filename: finalFilename,
        sectionIndices,
        quality,
        pageSize,
        sectionsPerPage,
        onProgress,
      });
    } else {
      // png o jpg
      await downloadAsImages(content, {
        filename: finalFilename,
        format,
        sectionIndices,
        quality,
        onProgress,
      });
    }

    onProgress?.(100, 100, "¡Descarga completada!");
  } catch (error) {
    console.error("Error en downloadContent:", error);
    throw error;
  }
}

/**
 * Descarga como JSON (solo templates)
 */
async function downloadAsJSON(
  content: NormalizedContent,
  filename: string
): Promise<void> {
  const jsonData = JSON.stringify(content, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Descarga como imágenes (PNG/JPG)
 */
async function downloadAsImages(
  content: NormalizedContent,
  options: {
    filename: string;
    format: "png" | "jpg";
    sectionIndices?: number[];
    quality: QualityOption;
    onProgress?: (current: number, total: number, message: string) => void;
  }
): Promise<void> {
  const { filename, format, sectionIndices, quality, onProgress } = options;

  // Determinar qué secciones capturar
  const sections = content.version.sections;
  const indicesToCapture = sectionIndices || sections.map((_, i) => i);

  onProgress?.(
    10,
    100,
    `Capturando ${indicesToCapture.length} sección(es)...`
  );

  // Capturar secciones
  const blobs = await captureSections(content, indicesToCapture, quality, (current, total) => {
    const progress = 10 + (current / total) * 70; // 10-80%
    onProgress?.(progress, 100, `Capturando sección ${current}/${total}...`);
  });

  // Convertir a formato deseado si es JPG
  const finalBlobs =
    format === "jpg"
      ? await Promise.all(blobs.map((blob) => convertToJPG(blob)))
      : blobs;

  // Descargar
  if (finalBlobs.length === 1) {
    // Una sola imagen: descarga directa
    onProgress?.(90, 100, "Preparando descarga...");
    downloadBlob(finalBlobs[0], `${filename}.${format}`);
  } else {
    // Múltiples imágenes: crear ZIP
    onProgress?.(80, 100, "Creando archivo ZIP...");
    const zip = new JSZip();

    finalBlobs.forEach((blob, index) => {
      const sectionName = getSectionName(content, indicesToCapture[index]);
      zip.file(`${filename}_${sectionName}.${format}`, blob);
    });

    const zipBlob = await zip.generateAsync({ type: "blob" });
    onProgress?.(95, 100, "Descargando ZIP...");
    downloadBlob(zipBlob, `${filename}.zip`);
  }
}

/**
 * Descarga como PDF
 */
async function downloadAsPDF(
  content: NormalizedContent,
  options: {
    filename: string;
    sectionIndices?: number[];
    quality: QualityOption;
    pageSize: PageSize;
    sectionsPerPage: number;
    onProgress?: (current: number, total: number, message: string) => void;
  }
): Promise<void> {
  const {
    filename,
    sectionIndices,
    quality,
    pageSize,
    sectionsPerPage,
    onProgress,
  } = options;

  // Determinar qué secciones capturar
  const sections = content.version.sections;
  const indicesToCapture = sectionIndices || sections.map((_, i) => i);

  onProgress?.(
    10,
    100,
    `Capturando ${indicesToCapture.length} sección(es)...`
  );

  // Capturar todas las secciones como imágenes
  const blobs = await captureSections(content, indicesToCapture, quality, (current, total) => {
    const progress = 10 + (current / total) * 60; // 10-70%
    onProgress?.(progress, 100, `Capturando sección ${current}/${total}...`);
  });

  onProgress?.(70, 100, "Generando PDF...");

  // Convertir blobs a data URLs
  const imageDataUrls = await Promise.all(
    blobs.map((blob) => blobToDataURL(blob))
  );

  // Crear PDF
  const pdf = await createPDF(imageDataUrls, {
    pageSize,
    sectionsPerPage,
    onProgress: (progress) => {
      const pdfProgress = 70 + progress * 0.25; // 70-95%
      onProgress?.(pdfProgress, 100, "Generando PDF...");
    },
  });

  onProgress?.(95, 100, "Descargando PDF...");
  pdf.save(`${filename}.pdf`);
}

/**
 * Captura múltiples secciones renderizándolas temporalmente
 */
async function captureSections(
  content: NormalizedContent,
  sectionIndices: number[],
  quality: QualityOption,
  onProgress?: (current: number, total: number) => void
): Promise<Blob[]> {
  const blobs: Blob[] = [];
  const scale = QUALITY_SCALE[quality];

  for (let i = 0; i < sectionIndices.length; i++) {
    const sectionIndex = sectionIndices[i];
    onProgress?.(i + 1, sectionIndices.length);

    // Renderizar sección temporalmente
    const blob = await captureSection(content, sectionIndex, scale);
    blobs.push(blob);
  }

  return blobs;
}

/**
 * Captura una sección específica renderizándola fuera de vista
 */
async function captureSection(
  content: NormalizedContent,
  sectionIndex: number,
  scale: number
): Promise<Blob> {
  // Crear wrapper invisible
  const wrapper = document.createElement("div");
  wrapper.id = "download-preview-wrapper";
  wrapper.style.position = "absolute";
  wrapper.style.left = "-9999px";
  wrapper.style.top = "0";
  wrapper.style.width = "800px"; // Ancho fijo para consistencia
  wrapper.style.backgroundColor = "#ffffff";

  // Crear contenedor para el preview
  const previewContainer = document.createElement("div");
  previewContainer.id = "download-preview-container";
  previewContainer.className = "template-preview-container";

  // Renderizar el contenido de la sección
  // Aquí necesitaríamos renderizar el componente TemplatePreview
  // Por ahora, crearemos un placeholder HTML simple
  const section = content.version.sections[sectionIndex];
  previewContainer.innerHTML = renderSectionHTML(section);

  wrapper.appendChild(previewContainer);
  document.body.appendChild(wrapper);

  // Esperar a que se renderice
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    // Capturar con html2canvas (reutilizando lógica de thumbnails)
    const canvas = await html2canvas(previewContainer, {
      backgroundColor: "#ffffff",
      scale,
      useCORS: true,
      allowTaint: false,
      foreignObjectRendering: false,
      ignoreElements: (element) => {
        return element.tagName === "STYLE" || element.tagName === "LINK";
      },
    });

    // Convertir a blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        },
        "image/png"
      );
    });

    return blob;
  } finally {
    // Limpiar
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper);
    }
  }
}

/**
 * Renderiza una sección como HTML simple (placeholder)
 * TODO: Usar ReactDOM.render para renderizar el componente real
 */
function renderSectionHTML(section: any): string {
  // Por ahora, un placeholder simple
  // En la implementación real, usaremos ReactDOM para renderizar TemplatePreview
  return `
    <div style="padding: 20px; min-height: 400px;">
      <h2>${section.display_name || section.section_name || "Sección"}</h2>
      <p>Contenido de la sección</p>
    </div>
  `;
}

/**
 * Crea un PDF a partir de imágenes
 */
async function createPDF(
  imageDataUrls: string[],
  options: {
    pageSize: PageSize;
    sectionsPerPage: number;
    onProgress?: (progress: number) => void;
  }
): Promise<jsPDF> {
  const { pageSize, sectionsPerPage, onProgress } = options;

  // Determinar dimensiones de la primera imagen para auto-size
  let pdfWidth: number;
  let pdfHeight: number;
  let orientation: "portrait" | "landscape" = "portrait";

  if (pageSize === "auto" && imageDataUrls.length > 0) {
    const img = await loadImage(imageDataUrls[0]);
    // Convertir píxeles a mm (aproximado: 96 DPI)
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

    // Layout de imágenes en la página
    await layoutImagesOnPage(pdf, imagesInPage, pdfWidth, pdfHeight, sectionsPerPage);

    onProgress?.((pageIndex + 1) / totalPages);
  }

  return pdf;
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
  const padding = 5; // mm de padding

  for (let i = 0; i < images.length; i++) {
    const img = await loadImage(images[i]);
    const col = i % cols;
    const row = Math.floor(i / cols);

    // Calcular posición
    const x = col * cellWidth + padding;
    const y = row * cellHeight + padding;

    // Calcular tamaño manteniendo aspect ratio
    const availableWidth = cellWidth - padding * 2;
    const availableHeight = cellHeight - padding * 2;

    const aspectRatio = img.width / img.height;
    let finalWidth = availableWidth;
    let finalHeight = availableWidth / aspectRatio;

    if (finalHeight > availableHeight) {
      finalHeight = availableHeight;
      finalWidth = availableHeight * aspectRatio;
    }

    // Centrar en la celda
    const offsetX = (availableWidth - finalWidth) / 2;
    const offsetY = (availableHeight - finalHeight) / 2;

    pdf.addImage(
      images[i],
      "PNG",
      x + offsetX,
      y + offsetY,
      finalWidth,
      finalHeight
    );
  }
}

/**
 * Helpers
 */

function generateFilename(name: string, format: DownloadFormat): string {
  const date = new Date().toISOString().split("T")[0];
  const safeName = name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  return `${safeName}_${date}`;
}

function getSectionName(content: NormalizedContent, index: number): string {
  const section = content.version.sections[index];
  const name = (section as any).display_name || (section as any).section_name || `seccion_${index + 1}`;
  return name.replace(/[^a-z0-9]/gi, "_").toLowerCase();
}

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

  // Fondo blanco para JPG
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
