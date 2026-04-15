/**
 * Utilidad genérica para exportar contenido visual a imágenes (PNG/JPG) o PDF
 * Funciona con cualquier componente React/HTML que esté renderizado en el DOM
 */

import type { jsPDF as JsPdfType } from "jspdf";

export interface ExportContentOptions {
  // Configuración de exportación
  format: "png" | "jpg" | "pdf";
  quality: number; // 0-100
  qualityLevel: "low" | "medium" | "high" | "ultra"; // Mapea a escala
  selectedSections: number[]; // Array de índices de secciones a exportar (vacío = todas)
  pageSize?: string; // "auto" | "a4" | "letter" | "legal" - Solo para PDF
  exportTarget?: "mobile" | "print";
  printGrid?: "1x1" | "2x1" | "2x2" | "3x2";
  printPaperSize?:
    | "pliego"
    | "medio_pliego"
    | "cuarto_pliego"
    | "octavo_pliego";

  // Selectores DOM
  containerSelector: string; // Selector del contenedor principal (ej: "#bulletin-export-preview .flex.gap-8")
  itemSelectorTemplate: (sectionIndex: number, pageIndex: number) => string; // Template para selector de cada item
  getExportElement: (previewElement: Element) => Element | null; // Función para obtener el elemento a exportar

  // Datos del contenido
  sections: unknown[]; // Array de secciones del contenido
  contentName: string; // Nombre del archivo a exportar

  // Funciones helper
  getSectionPages: (section: unknown) => number; // Función para calcular páginas de una sección

  // Callbacks de progreso
  onSectionChange?: (index: number) => void; // Se llama al cambiar de sección
  onProgressUpdate: (current: number, message: string) => void; // Actualización de progreso

  // Traducciones (opcionales con defaults en español)
  translations?: {
    sectionGenerating?: (current: number) => string;
    sectionPage?: string;
    toPdf?: string;
    toZip?: string;
    composingPrintLayout?: string;
    exportComplete?: string;
  };
}

// Traducciones por defecto
const defaultTranslations = {
  sectionGenerating: (current: number) => `Generando sección ${current}`,
  sectionPage: "Página",
  toPdf: "Convirtiendo a PDF...",
  toZip: "Generando archivo ZIP...",
  composingPrintLayout: "Componiendo páginas de impresión...",
  exportComplete: "¡Exportación completada!",
};

const PRINT_GRID_MAP: Record<string, { columns: number; rows: number }> = {
  "1x1": { columns: 1, rows: 1 },
  "2x1": { columns: 2, rows: 1 },
  "2x2": { columns: 2, rows: 2 },
  "3x2": { columns: 3, rows: 2 },
};

const PRINT_PAPER_SIZE_MM: Record<string, [number, number]> = {
  pliego: [700, 1000],
  medio_pliego: [500, 700],
  cuarto_pliego: [350, 500],
  octavo_pliego: [250, 350],
};

type CapturedImage = {
  dataUrl: string;
  width: number;
  height: number;
};

const PX_TO_MM = 0.2645833333;

const isTransparentBackgroundColor = (color: string | null | undefined) => {
  if (!color) {
    return true;
  }

  const normalized = color.trim().toLowerCase();

  return (
    normalized === "transparent" ||
    normalized === "rgba(0, 0, 0, 0)" ||
    normalized === "rgba(0,0,0,0)"
  );
};

const hasVisibleBackground = (styles: CSSStyleDeclaration | null) => {
  if (!styles) {
    return false;
  }

  const hasBackgroundImage =
    Boolean(styles.backgroundImage) && styles.backgroundImage !== "none";
  const hasBackgroundColor = !isTransparentBackgroundColor(
    styles.backgroundColor,
  );

  return hasBackgroundImage || hasBackgroundColor;
};

const extractBackgroundImageUrl = (
  backgroundImage: string | null | undefined,
) => {
  if (!backgroundImage || backgroundImage === "none") {
    return null;
  }

  const urlMatch = backgroundImage.match(/url\((['"]?)(.*?)\1\)/i);

  if (!urlMatch || !urlMatch[2]) {
    return null;
  }

  return urlMatch[2];
};

const loadImageElement = (imageUrl: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error(`No se pudo cargar imagen: ${imageUrl}`));
    image.src = imageUrl;
  });

const composeBackgroundCaptureFromStyles = async (
  styles: CSSStyleDeclaration,
  width: number,
  height: number,
): Promise<CapturedImage | null> => {
  const safeWidth = Math.max(Math.round(width), 1);
  const safeHeight = Math.max(Math.round(height), 1);

  const canvas = document.createElement("canvas");
  canvas.width = safeWidth;
  canvas.height = safeHeight;

  const context = canvas.getContext("2d");
  if (!context) {
    return null;
  }

  const hasBgColor = !isTransparentBackgroundColor(styles.backgroundColor);
  const backgroundImageUrl = extractBackgroundImageUrl(styles.backgroundImage);

  if (!hasBgColor && !backgroundImageUrl) {
    return null;
  }

  if (hasBgColor) {
    context.fillStyle = styles.backgroundColor;
    context.fillRect(0, 0, safeWidth, safeHeight);
  }

  if (backgroundImageUrl) {
    try {
      const image = await loadImageElement(backgroundImageUrl);
      const drawRect = resolveCoverDrawRect(
        {
          dataUrl: "",
          width: image.naturalWidth || image.width,
          height: image.naturalHeight || image.height,
        },
        safeWidth,
        safeHeight,
      );

      context.drawImage(
        image,
        drawRect.x,
        drawRect.y,
        drawRect.width,
        drawRect.height,
      );
    } catch (error) {
      console.warn("⚠️ No se pudo dibujar imagen de fondo en canvas:", error);
    }
  }

  try {
    const dataUrl = canvas.toDataURL("image/png");

    return {
      dataUrl,
      width: safeWidth,
      height: safeHeight,
    };
  } catch (error) {
    console.warn("⚠️ No se pudo convertir canvas de fondo a PNG:", error);
    return null;
  }
};

const buildBackgroundCaptureElement = (
  sizeSourceElement: HTMLElement,
  styleSourceElement: HTMLElement,
) => {
  const sourceRect = sizeSourceElement.getBoundingClientRect();
  const sourceStyles = window.getComputedStyle(styleSourceElement);

  const backgroundElement = document.createElement("div");
  backgroundElement.style.position = "fixed";
  backgroundElement.style.left = "-10000px";
  backgroundElement.style.top = "0";
  backgroundElement.style.width = `${Math.max(sourceRect.width, 1)}px`;
  backgroundElement.style.height = `${Math.max(sourceRect.height, 1)}px`;
  backgroundElement.style.margin = "0";
  backgroundElement.style.padding = "0";
  backgroundElement.style.overflow = "hidden";

  backgroundElement.style.backgroundColor = sourceStyles.backgroundColor;
  backgroundElement.style.backgroundImage = sourceStyles.backgroundImage;
  backgroundElement.style.backgroundSize = sourceStyles.backgroundSize;
  backgroundElement.style.backgroundPosition = sourceStyles.backgroundPosition;
  backgroundElement.style.backgroundRepeat = sourceStyles.backgroundRepeat;
  backgroundElement.style.backgroundAttachment =
    sourceStyles.backgroundAttachment;
  backgroundElement.style.backgroundOrigin = sourceStyles.backgroundOrigin;
  backgroundElement.style.backgroundClip = sourceStyles.backgroundClip;

  return backgroundElement;
};

const clearSectionBackgroundForPrint = (sectionElement: HTMLElement | null) => {
  if (!sectionElement) {
    return () => undefined;
  }

  const originalStyles = {
    background: sectionElement.style.background,
    backgroundColor: sectionElement.style.backgroundColor,
    backgroundImage: sectionElement.style.backgroundImage,
  };

  sectionElement.style.background = "transparent";
  sectionElement.style.backgroundColor = "transparent";
  sectionElement.style.backgroundImage = "none";

  return () => {
    sectionElement.style.background = originalStyles.background;
    sectionElement.style.backgroundColor = originalStyles.backgroundColor;
    sectionElement.style.backgroundImage = originalStyles.backgroundImage;
  };
};

const clearElementDecorationForPrint = (element: HTMLElement | null) => {
  if (!element) {
    return () => undefined;
  }

  const originalStyles = {
    background: element.style.background,
    backgroundColor: element.style.backgroundColor,
    backgroundImage: element.style.backgroundImage,
    border: element.style.border,
    borderTop: element.style.borderTop,
    borderRight: element.style.borderRight,
    borderBottom: element.style.borderBottom,
    borderLeft: element.style.borderLeft,
    boxShadow: element.style.boxShadow,
  };

  element.style.background = "transparent";
  element.style.backgroundColor = "transparent";
  element.style.backgroundImage = "none";
  element.style.border = "none";
  element.style.borderTop = "none";
  element.style.borderRight = "none";
  element.style.borderBottom = "none";
  element.style.borderLeft = "none";
  element.style.boxShadow = "none";

  return () => {
    element.style.background = originalStyles.background;
    element.style.backgroundColor = originalStyles.backgroundColor;
    element.style.backgroundImage = originalStyles.backgroundImage;
    element.style.border = originalStyles.border;
    element.style.borderTop = originalStyles.borderTop;
    element.style.borderRight = originalStyles.borderRight;
    element.style.borderBottom = originalStyles.borderBottom;
    element.style.borderLeft = originalStyles.borderLeft;
    element.style.boxShadow = originalStyles.boxShadow;
  };
};

const resolveCoverDrawRect = (
  image: CapturedImage,
  targetWidth: number,
  targetHeight: number,
) => {
  const imageRatio = image.width / Math.max(image.height, 1);
  const targetRatio = targetWidth / Math.max(targetHeight, 1);

  if (imageRatio > targetRatio) {
    const drawHeight = targetHeight;
    const drawWidth = drawHeight * imageRatio;
    return {
      x: (targetWidth - drawWidth) / 2,
      y: 0,
      width: drawWidth,
      height: drawHeight,
    };
  }

  const drawWidth = targetWidth;
  const drawHeight = drawWidth / Math.max(imageRatio, 1e-6);
  return {
    x: 0,
    y: (targetHeight - drawHeight) / 2,
    width: drawWidth,
    height: drawHeight,
  };
};

const paintPrintPageBackground = (
  pdf: JsPdfType,
  pageWidth: number,
  pageHeight: number,
  backgroundImage?: CapturedImage | null,
) => {
  if (backgroundImage) {
    pdf.addImage(backgroundImage.dataUrl, "PNG", 0, 0, pageWidth, pageHeight);
    return;
  }

  // Base claro + patrón repetitivo para toda la página impresa.
  pdf.setFillColor(250, 248, 242);
  pdf.rect(0, 0, pageWidth, pageHeight, "F");

  pdf.setDrawColor(236, 232, 221);
  pdf.setLineWidth(0.12);

  for (let y = 0; y <= pageHeight; y += 14) {
    pdf.line(0, y, pageWidth, y);
  }

  for (
    let diagonalStart = -pageHeight;
    diagonalStart <= pageWidth;
    diagonalStart += 24
  ) {
    pdf.line(diagonalStart, 0, diagonalStart + pageHeight, pageHeight);
  }
};

const resolveFullWidthBannerLayout = (
  image: CapturedImage,
  pageWidth: number,
  pageHeight: number,
  maxHeightRatio: number,
) => {
  const naturalWidthMm = Math.max(image.width * PX_TO_MM, 1);
  const naturalHeightMm = Math.max(image.height * PX_TO_MM, 1);
  const maxAllowedHeight = Math.max(pageHeight * maxHeightRatio, 1);

  // Mantener el contenido en tamaño original siempre que quepa en la página.
  const contentScale =
    naturalWidthMm > pageWidth ? pageWidth / naturalWidthMm : 1;
  const drawWidth = naturalWidthMm * contentScale;
  const drawHeight = naturalHeightMm * contentScale;

  // Franja a ancho completo, sin deformar el contenido interno.
  const bandHeight = Math.min(Math.max(drawHeight, 1), maxAllowedHeight);
  const drawX = (pageWidth - drawWidth) / 2;
  const drawY = (bandHeight - drawHeight) / 2;

  return {
    bandWidth: pageWidth,
    bandHeight,
    drawX,
    drawY,
    drawWidth,
    drawHeight,
  };
};

/**
 * Exporta contenido visual a imagen o PDF
 */
export async function exportContent(
  options: ExportContentOptions,
): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const { toPng, toJpeg } = await import("html-to-image");

  // Merge traducciones
  const t = { ...defaultTranslations, ...options.translations };

  const isPrintTarget = options.exportTarget === "print";

  // Determinar secciones a exportar
  const totalSections = options.sections.length;
  const selectedSectionsToExport =
    options.selectedSections.length > 0
      ? options.selectedSections
      : Array.from({ length: totalSections }, (_, i) => i);
  const sectionsToExport = selectedSectionsToExport.filter((sectionIndex) => {
    if (!isPrintTarget) {
      return true;
    }

    const section = options.sections[sectionIndex] as
      | { print?: boolean }
      | undefined;
    return section?.print !== false;
  });

  try {
    if (sectionsToExport.length === 0) {
      throw new Error(
        "No hay secciones visibles para exportar con la configuración actual",
      );
    }

    const zip = new JSZip();

    // Para PDF, generamos PNG de alta calidad y luego convertimos
    const imageFormat =
      options.format === "pdf" || isPrintTarget ? "png" : options.format;
    const finalFormat = options.format;
    const printPageItems: CapturedImage[] = [];
    let printBackgroundImage: CapturedImage | null = null;
    let printHeaderImage: CapturedImage | null = null;
    let printHeaderBackgroundImage: CapturedImage | null = null;
    let printFooterImage: CapturedImage | null = null;
    let printFooterBackgroundImage: CapturedImage | null = null;
    const printHeaderImagesByPdfPage = new Map<number, CapturedImage>();
    const printFooterImagesByPdfPage = new Map<number, CapturedImage>();

    const applyPdfPaginationToFields = (
      rootElement: Element,
      currentPdfPage: number,
      totalPdfPages: number,
    ) => {
      const paginationFields = rootElement.querySelectorAll(
        '[data-page-number-field="true"]',
      );

      paginationFields.forEach((fieldElement) => {
        const format =
          fieldElement.getAttribute("data-page-number-format") ||
          "{page}/{total}";
        const value = format
          .replace("{page}", String(currentPdfPage))
          .replace("{total}", String(totalPdfPages));

        fieldElement.textContent = value;
      });
    };

    const dataUrlToImage = async (dataUrl: string): Promise<CapturedImage> => {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const tempImage = new Image();
        tempImage.onload = () => resolve(tempImage);
        tempImage.onerror = () => reject(new Error("No se pudo cargar imagen"));
        tempImage.src = dataUrl;
      });

      return {
        dataUrl,
        width: image.width,
        height: image.height,
      };
    };

    const captureElement = async (
      element: HTMLElement,
      forcePng = false,
      pixelRatio = 1,
    ) => {
      if (forcePng || imageFormat === "png") {
        return toPng(element, {
          pixelRatio,
          cacheBust: true,
        });
      }

      return toJpeg(element, {
        quality: options.quality / 100,
        pixelRatio,
        cacheBust: true,
      });
    };

    let currentStep = 0;

    // Notificar cambio inicial de sección
    if (options.onSectionChange) {
      options.onSectionChange(0);
    }

    // Esperar a que el contenedor se monte con todas las secciones expandidas
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Obtener el contenedor principal
    const scrollContainer = document.querySelector(options.containerSelector);

    if (!scrollContainer) {
      throw new Error(
        `No se encontró el contenedor: ${options.containerSelector}`,
      );
    }

    const getRenderedPageIndexes = (sectionIndex: number) => {
      const renderedPages = scrollContainer.querySelectorAll(
        `[data-section-index="${sectionIndex}"][data-page-index]`,
      );

      const uniquePageIndexes = new Set<number>();

      renderedPages.forEach((pageElement) => {
        const pageIndex = Number(pageElement.getAttribute("data-page-index"));

        if (!Number.isNaN(pageIndex)) {
          uniquePageIndexes.add(pageIndex);
        }
      });

      return Array.from(uniquePageIndexes).sort((left, right) => left - right);
    };

    const getRenderedSectionPages = (sectionIndex: number) => {
      return getRenderedPageIndexes(sectionIndex).length;
    };

    const isPreviewElementReady = (previewElement: Element | null) => {
      if (!previewElement) {
        return false;
      }

      const previewRoot = previewElement.querySelector(
        '[data-template-preview-root="true"]',
      );

      return previewRoot?.getAttribute("data-preview-ready") === "true";
    };

    const areRenderedSectionPagesReady = (sectionIndex: number) => {
      const renderedPages = Array.from(
        scrollContainer.querySelectorAll(
          `[data-section-index="${sectionIndex}"][data-page-index]`,
        ),
      );

      if (renderedPages.length === 0) {
        return false;
      }

      return renderedPages.every((pageElement) =>
        isPreviewElementReady(pageElement),
      );
    };

    const waitForRenderedPageReady = async (
      sectionIndex: number,
      pageIndex: number,
    ) => {
      for (let attempt = 0; attempt < 32; attempt++) {
        const previewElement = scrollContainer.querySelector(
          options.itemSelectorTemplate(sectionIndex, pageIndex),
        );

        if (isPreviewElementReady(previewElement)) {
          return previewElement;
        }

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      return scrollContainer.querySelector(
        options.itemSelectorTemplate(sectionIndex, pageIndex),
      );
    };

    const resolveSectionPageCounts = async () => {
      let previousSignature = "";
      let stableIterations = 0;
      let latestCounts = new Map<number, number>();

      for (let attempt = 0; attempt < 20; attempt++) {
        const nextCounts = new Map<number, number>();

        sectionsToExport.forEach((sectionIndex) => {
          const section = options.sections[sectionIndex];
          const renderedCount = getRenderedSectionPages(sectionIndex);
          const fallbackCount = options.getSectionPages(section);

          nextCounts.set(
            sectionIndex,
            renderedCount > 0 ? renderedCount : fallbackCount,
          );
        });

        const signature = sectionsToExport
          .map(
            (sectionIndex) => `${sectionIndex}:${nextCounts.get(sectionIndex)}`,
          )
          .join("|");
        const allRenderedPagesReady = sectionsToExport.every((sectionIndex) =>
          areRenderedSectionPagesReady(sectionIndex),
        );

        latestCounts = nextCounts;

        if (signature === previousSignature) {
          stableIterations += 1;

          if (allRenderedPagesReady && stableIterations >= 2) {
            return latestCounts;
          }
        } else {
          stableIterations = 0;
          previousSignature = signature;
        }

        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      return latestCounts;
    };

    const sectionPageCounts = await resolveSectionPageCounts();

    // PRE-CALCULAR: Total de páginas a exportar para progreso preciso
    let totalPagesToExport = 0;
    for (const sectionIndex of sectionsToExport) {
      const renderedPageCount = getRenderedPageIndexes(sectionIndex).length;
      totalPagesToExport +=
        renderedPageCount > 0
          ? renderedPageCount
          : sectionPageCounts.get(sectionIndex) || 1;
    }

    // Total de pasos = páginas + 1 paso de compresión/conversión final
    const totalSteps = totalPagesToExport + 1;
    const printItemsPerSheet = isPrintTarget
      ? (PRINT_GRID_MAP[options.printGrid || "2x2"]?.columns || 2) *
        (PRINT_GRID_MAP[options.printGrid || "2x2"]?.rows || 2)
      : 1;
    const totalPrintPdfPages =
      isPrintTarget && printItemsPerSheet > 0
        ? Math.ceil(totalPagesToExport / printItemsPerSheet)
        : 1;

    // Exportar cada sección (y sus páginas si tiene múltiples)
    for (let i = 0; i < sectionsToExport.length; i++) {
      const sectionIndex = sectionsToExport[i];

      if (options.onSectionChange) {
        options.onSectionChange(sectionIndex);
      }

      const renderedPageIndexes = getRenderedPageIndexes(sectionIndex);
      const fallbackPageCount = sectionPageCounts.get(sectionIndex) || 1;
      const pageIndexes =
        renderedPageIndexes.length > 0
          ? renderedPageIndexes
          : Array.from(
              { length: fallbackPageCount },
              (_, pageIndex) => pageIndex,
            );

      // Detectar cuántas páginas tiene esta sección
      const totalPages = pageIndexes.length;

      // Exportar cada página de la sección
      for (
        let pageOrderIndex = 0;
        pageOrderIndex < totalPages;
        pageOrderIndex++
      ) {
        const pageIndex = pageIndexes[pageOrderIndex];
        currentStep++;

        // Calcular porcentaje real basado en pasos totales
        const percentage = Math.round((currentStep / totalSteps) * 100);

        options.onProgressUpdate(
          percentage,
          `${t.sectionGenerating(sectionIndex + 1)}, ${t.sectionPage} ${
            pageOrderIndex + 1
          }/${totalPages}...`,
        );

        // Pequeño delay para asegurar que la sección esté renderizada
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Buscar el elemento de preview específico
        const previewElement = await waitForRenderedPageReady(
          sectionIndex,
          pageIndex,
        );

        if (!previewElement) {
          console.warn(
            `⚠️ No se encontró preview para sección ${
              sectionIndex + 1
            }, página ${pageOrderIndex + 1}`,
          );
          continue;
        }

        // Obtener el elemento a exportar
        const defaultExportElement = options.getExportElement(previewElement);
        const printSectionElement = previewElement.querySelector(
          "[data-section-preview]",
        );

        const exportElement = isPrintTarget
          ? printSectionElement || defaultExportElement
          : defaultExportElement;

        if (!exportElement) {
          console.warn(
            `⚠️ No se encontró elemento de exportación en sección ${
              sectionIndex + 1
            }, página ${pageOrderIndex + 1}`,
          );
          continue;
        }

        const currentPdfPageNumber = isPrintTarget
          ? Math.floor(printPageItems.length / printItemsPerSheet) + 1
          : 1;

        if (isPrintTarget) {
          applyPdfPaginationToFields(
            previewElement,
            currentPdfPageNumber,
            totalPrintPdfPages,
          );
        }

        if (isPrintTarget && !printBackgroundImage && defaultExportElement) {
          const pageSurfaceElement = defaultExportElement as HTMLElement;
          const sectionSurfaceElement =
            (printSectionElement as HTMLElement | null) || null;
          const sectionSurfaceStyles = sectionSurfaceElement
            ? window.getComputedStyle(sectionSurfaceElement)
            : null;

          const styleSourceElement = hasVisibleBackground(sectionSurfaceStyles)
            ? sectionSurfaceElement
            : pageSurfaceElement;

          if (styleSourceElement) {
            const styleSourceStyles =
              window.getComputedStyle(styleSourceElement);
            const pageRect = pageSurfaceElement.getBoundingClientRect();

            const composedBackground = await composeBackgroundCaptureFromStyles(
              styleSourceStyles,
              pageRect.width,
              pageRect.height,
            );

            if (composedBackground) {
              printBackgroundImage = composedBackground;
            }

            if (!printBackgroundImage) {
              const backgroundCaptureElement = buildBackgroundCaptureElement(
                pageSurfaceElement,
                styleSourceElement,
              );

              document.body.appendChild(backgroundCaptureElement);

              try {
                const backgroundDataUrl = await captureElement(
                  backgroundCaptureElement,
                  true,
                  1.5,
                );
                printBackgroundImage = await dataUrlToImage(backgroundDataUrl);
              } catch (backgroundCaptureError) {
                console.warn(
                  "⚠️ No se pudo capturar el fondo de página para impresión:",
                  backgroundCaptureError,
                );
              } finally {
                document.body.removeChild(backgroundCaptureElement);
              }
            }
          }
        }

        // Esperar a que todas las imágenes se carguen
        const images = exportElement.querySelectorAll("img");
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
                // Timeout de 8 segundos por imagen
                setTimeout(() => resolve(false), 8000);
              });
            }),
          );
        }

        // Esperar a que las fuentes se carguen
        await document.fonts.ready;

        // Delay adicional para asegurar renderizado completo
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Calcular escala según la calidad seleccionada
        let scale = 1;
        switch (options.qualityLevel) {
          case "low":
            scale = 1;
            break;
          case "medium":
            scale = 1.5;
            break;
          case "high":
            scale = 2;
            break;
          case "ultra":
            scale = 3;
            break;
        }

        let restoreSectionBackground: () => void = () => undefined;

        // En impresión quitamos el fondo de sección para que se vea solo
        // el fondo de página aplicado al PDF.
        const shouldClearSectionBackgroundForPrint = true;

        if (isPrintTarget && shouldClearSectionBackgroundForPrint) {
          restoreSectionBackground = clearSectionBackgroundForPrint(
            printSectionElement as HTMLElement | null,
          );
        }

        try {
          // Usar html-to-image para exportar
          const dataUrl = await captureElement(
            exportElement as HTMLElement,
            isPrintTarget,
            scale,
          );

          if (isPrintTarget) {
            const capturedPage = await dataUrlToImage(dataUrl);
            printPageItems.push(capturedPage);

            {
              const headerElement =
                (previewElement.querySelector(
                  `[data-review-id="header-${sectionIndex}"]`,
                ) as HTMLElement | null) ||
                (previewElement.querySelector(
                  '[data-review-id="header-global"]',
                ) as HTMLElement | null);

              if (headerElement) {
                if (!printHeaderBackgroundImage) {
                  const headerStyles = window.getComputedStyle(headerElement);
                  const headerRect = headerElement.getBoundingClientRect();
                  printHeaderBackgroundImage =
                    (await composeBackgroundCaptureFromStyles(
                      headerStyles,
                      headerRect.width,
                      headerRect.height,
                    )) || null;

                  if (!printHeaderBackgroundImage) {
                    const headerBackgroundCaptureElement =
                      buildBackgroundCaptureElement(
                        headerElement,
                        headerElement,
                      );

                    document.body.appendChild(headerBackgroundCaptureElement);
                    try {
                      const headerBackgroundDataUrl = await captureElement(
                        headerBackgroundCaptureElement,
                        true,
                        1.5,
                      );
                      printHeaderBackgroundImage = await dataUrlToImage(
                        headerBackgroundDataUrl,
                      );
                    } catch (headerBackgroundError) {
                      console.warn(
                        "⚠️ No se pudo capturar fondo del header:",
                        headerBackgroundError,
                      );
                    } finally {
                      document.body.removeChild(headerBackgroundCaptureElement);
                    }
                  }
                }

                if (!printHeaderImagesByPdfPage.has(currentPdfPageNumber)) {
                  const restoreHeaderDecoration =
                    clearElementDecorationForPrint(headerElement);
                  let headerImageForPage: CapturedImage;

                  try {
                    const headerDataUrl = await captureElement(
                      headerElement,
                      true,
                      1,
                    );
                    headerImageForPage = await dataUrlToImage(headerDataUrl);
                  } finally {
                    restoreHeaderDecoration();
                  }

                  printHeaderImagesByPdfPage.set(
                    currentPdfPageNumber,
                    headerImageForPage,
                  );

                  if (!printHeaderImage) {
                    printHeaderImage = headerImageForPage;
                  }
                }
              }
            }

            {
              const footerElement =
                (previewElement.querySelector(
                  `[data-review-id="footer-${sectionIndex}"]`,
                ) as HTMLElement | null) ||
                (previewElement.querySelector(
                  '[data-review-id="footer-global"]',
                ) as HTMLElement | null);

              if (footerElement) {
                if (!printFooterBackgroundImage) {
                  const footerStyles = window.getComputedStyle(footerElement);
                  const footerRect = footerElement.getBoundingClientRect();
                  printFooterBackgroundImage =
                    (await composeBackgroundCaptureFromStyles(
                      footerStyles,
                      footerRect.width,
                      footerRect.height,
                    )) || null;

                  if (!printFooterBackgroundImage) {
                    const footerBackgroundCaptureElement =
                      buildBackgroundCaptureElement(
                        footerElement,
                        footerElement,
                      );

                    document.body.appendChild(footerBackgroundCaptureElement);
                    try {
                      const footerBackgroundDataUrl = await captureElement(
                        footerBackgroundCaptureElement,
                        true,
                        1.5,
                      );
                      printFooterBackgroundImage = await dataUrlToImage(
                        footerBackgroundDataUrl,
                      );
                    } catch (footerBackgroundError) {
                      console.warn(
                        "⚠️ No se pudo capturar fondo del footer:",
                        footerBackgroundError,
                      );
                    } finally {
                      document.body.removeChild(footerBackgroundCaptureElement);
                    }
                  }
                }

                if (!printFooterImagesByPdfPage.has(currentPdfPageNumber)) {
                  const restoreFooterDecoration =
                    clearElementDecorationForPrint(footerElement);
                  let footerImageForPage: CapturedImage;

                  try {
                    const footerDataUrl = await captureElement(
                      footerElement,
                      true,
                      1,
                    );
                    footerImageForPage = await dataUrlToImage(footerDataUrl);
                  } finally {
                    restoreFooterDecoration();
                  }

                  printFooterImagesByPdfPage.set(
                    currentPdfPageNumber,
                    footerImageForPage,
                  );

                  if (!printFooterImage) {
                    printFooterImage = footerImageForPage;
                  }
                }
              }
            }

            continue;
          }

          // Convertir data URL a blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();

          // Agregar al ZIP con nombre descriptivo
          const filename =
            totalPages > 1
              ? `seccion_${sectionIndex + 1}_pagina_${
                  pageOrderIndex + 1
                }.${imageFormat}`
              : sectionsToExport.length > 1
                ? `seccion_${sectionIndex + 1}.${imageFormat}`
                : `${options.contentName}.${imageFormat}`;

          zip.file(filename, blob);
        } catch (error) {
          console.error(
            `Error al exportar sección ${sectionIndex + 1}, página ${
              pageOrderIndex + 1
            }:`,
            error,
          );
          throw error;
        } finally {
          restoreSectionBackground();
        }
      }
    }

    if (isPrintTarget) {
      currentStep++;
      options.onProgressUpdate(
        Math.round((currentStep / totalSteps) * 100),
        t.composingPrintLayout,
      );

      if (printPageItems.length === 0) {
        throw new Error("No se pudo capturar ninguna sección para impresión");
      }

      const { jsPDF } = await import("jspdf");
      const printGrid = PRINT_GRID_MAP[options.printGrid || "2x2"] || {
        columns: 2,
        rows: 2,
      };
      const paperSize =
        PRINT_PAPER_SIZE_MM[options.printPaperSize || "medio_pliego"] ||
        PRINT_PAPER_SIZE_MM.medio_pliego;
      const [paperWidth, paperHeight] = paperSize;
      const orientation = paperWidth > paperHeight ? "landscape" : "portrait";

      const pdf = new jsPDF({
        orientation,
        unit: "mm",
        format: paperSize,
      });

      const pagesCount = Math.ceil(
        printPageItems.length / (printGrid.columns * printGrid.rows),
      );

      for (let pageNumber = 0; pageNumber < pagesCount; pageNumber++) {
        if (pageNumber > 0) {
          pdf.addPage(paperSize, orientation);
        }

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const pageMargin = 12;
        const cellGap = 4;
        const pageNumberLabel = pageNumber + 1;
        const currentHeaderImage =
          printHeaderImagesByPdfPage.get(pageNumberLabel) || printHeaderImage;
        const currentFooterImage =
          printFooterImagesByPdfPage.get(pageNumberLabel) || printFooterImage;

        paintPrintPageBackground(
          pdf,
          pageWidth,
          pageHeight,
          printBackgroundImage,
        );

        let headerHeight = 0;
        if (currentHeaderImage) {
          const headerLayout = resolveFullWidthBannerLayout(
            currentHeaderImage,
            pageWidth,
            pageHeight,
            0.22,
          );

          headerHeight = headerLayout.bandHeight;

          if (printHeaderBackgroundImage) {
            pdf.addImage(
              printHeaderBackgroundImage.dataUrl,
              "PNG",
              0,
              0,
              headerLayout.bandWidth,
              headerLayout.bandHeight,
            );
          }

          pdf.addImage(
            currentHeaderImage.dataUrl,
            "PNG",
            headerLayout.drawX,
            headerLayout.drawY,
            headerLayout.drawWidth,
            headerLayout.drawHeight,
          );
        }

        let footerHeight = 0;
        if (currentFooterImage) {
          const footerLayout = resolveFullWidthBannerLayout(
            currentFooterImage,
            pageWidth,
            pageHeight,
            0.2,
          );
          const footerY = pageHeight - footerLayout.bandHeight;

          footerHeight = footerLayout.bandHeight;

          if (printFooterBackgroundImage) {
            pdf.addImage(
              printFooterBackgroundImage.dataUrl,
              "PNG",
              0,
              footerY,
              footerLayout.bandWidth,
              footerLayout.bandHeight,
            );
          }

          pdf.addImage(
            currentFooterImage.dataUrl,
            "PNG",
            footerLayout.drawX,
            footerY + footerLayout.drawY,
            footerLayout.drawWidth,
            footerLayout.drawHeight,
          );
        }

        const contentTop = headerHeight > 0 ? headerHeight + 4 : pageMargin;
        const contentBottom =
          footerHeight > 0
            ? pageHeight - footerHeight - 4
            : pageHeight - pageMargin;
        const contentHeight = Math.max(contentBottom - contentTop, 1);
        const contentWidth = pageWidth - pageMargin * 2;

        const cellWidth =
          (contentWidth - cellGap * (printGrid.columns - 1)) /
          printGrid.columns;
        const cellHeight =
          (contentHeight - cellGap * (printGrid.rows - 1)) / printGrid.rows;

        const pageStartIndex = pageNumber * printGrid.columns * printGrid.rows;

        for (
          let gridIndex = 0;
          gridIndex < printGrid.columns * printGrid.rows;
          gridIndex++
        ) {
          const currentItem = printPageItems[pageStartIndex + gridIndex];
          if (!currentItem) {
            break;
          }

          const row = Math.floor(gridIndex / printGrid.columns);
          const column = gridIndex % printGrid.columns;

          const slotX = pageMargin + column * (cellWidth + cellGap);
          const slotY = contentTop + row * (cellHeight + cellGap);

          const imageRatio = currentItem.width / currentItem.height;
          const cellRatio = cellWidth / cellHeight;

          let drawWidth = cellWidth;
          let drawHeight = cellHeight;

          if (imageRatio > cellRatio) {
            drawHeight = cellWidth / imageRatio;
          } else {
            drawWidth = cellHeight * imageRatio;
          }

          const drawX = slotX + (cellWidth - drawWidth) / 2;
          const drawY = slotY + (cellHeight - drawHeight) / 2;

          pdf.addImage(
            currentItem.dataUrl,
            "PNG",
            drawX,
            drawY,
            drawWidth,
            drawHeight,
          );
        }

        if (pagesCount > 1) {
          const microProgress = 99 + (pageNumber + 1) / pagesCount;
          options.onProgressUpdate(
            Math.round(Math.min(microProgress, 100)),
            `${t.composingPrintLayout} (${pageNumber + 1}/${pagesCount})`,
          );
        }
      }

      pdf.save(`${options.contentName}.pdf`);
      options.onProgressUpdate(100, t.exportComplete);
      return;
    }

    // Si el formato es PDF, convertir las imágenes a PDF
    if (finalFormat === "pdf") {
      // Incrementar paso final (compresión/conversión)
      currentStep++;
      const percentage = Math.round((currentStep / totalSteps) * 100);
      options.onProgressUpdate(percentage, t.toPdf);

      // Importar jsPDF dinámicamente
      const { jsPDF } = await import("jspdf");

      // Determinar el formato de página
      // Si es "auto", se ajustará al tamaño de cada imagen
      const useAutoSize = !options.pageSize || options.pageSize === "auto";
      const pageFormat = useAutoSize ? "a4" : options.pageSize;

      // Crear documento PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: pageFormat,
      });

      let isFirstPage = true;

      // Obtener todos los archivos del ZIP
      const files = Object.keys(zip.files).sort();

      for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
        const filename = files[fileIndex];
        const file = zip.files[filename];
        const blob = await file.async("blob");

        // Micro-progreso durante conversión a PDF (dentro del último paso)
        // Progreso va de 99% a 100% mientras se agregan imágenes
        if (files.length > 1) {
          const pdfMicroProgress = 99 + fileIndex / files.length;
          options.onProgressUpdate(
            Math.round(pdfMicroProgress),
            `${t.toPdf} (${fileIndex + 1}/${files.length})`,
          );
        }

        // Convertir blob a data URL
        const dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });

        // Crear imagen para obtener dimensiones
        const img = await new Promise<HTMLImageElement>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = dataUrl;
        });

        // Si es modo "auto", ajustar el tamaño de página a la imagen
        if (useAutoSize) {
          // Agregar nueva página con el tamaño exacto de la imagen
          if (!isFirstPage) {
            pdf.addPage([img.width, img.height], "portrait");
          } else {
            // Para la primera página, configurar el tamaño
            pdf.internal.pageSize.width = img.width;
            pdf.internal.pageSize.height = img.height;
          }

          // En modo auto, la imagen ocupa toda la página
          pdf.addImage(
            dataUrl,
            imageFormat.toUpperCase(),
            0,
            0,
            img.width,
            img.height,
          );
        } else {
          // Modo con tamaño de página fijo (a4, letter, legal)
          // Calcular dimensiones para ajustar a la página
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          const imgRatio = img.width / img.height;
          const pageRatio = pdfWidth / pdfHeight;

          let finalWidth = pdfWidth;
          let finalHeight = pdfHeight;

          if (imgRatio > pageRatio) {
            // Imagen más ancha
            finalHeight = pdfWidth / imgRatio;
          } else {
            // Imagen más alta
            finalWidth = pdfHeight * imgRatio;
          }

          // Agregar nueva página si no es la primera
          if (!isFirstPage) {
            pdf.addPage();
          }

          // Agregar imagen al PDF ajustada al tamaño de página
          pdf.addImage(
            dataUrl,
            imageFormat.toUpperCase(),
            0,
            0,
            finalWidth,
            finalHeight,
          );
        }

        isFirstPage = false;
      }

      // Descargar el PDF
      pdf.save(`${options.contentName}.pdf`);
    } else {
      // Generar el archivo ZIP para imágenes
      // Incrementar paso final (compresión)
      currentStep++;
      const percentage = Math.round((currentStep / totalSteps) * 100);
      options.onProgressUpdate(percentage, t.toZip);

      const zipBlob = await zip.generateAsync({ type: "blob" });

      // Descargar el ZIP
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${options.contentName}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    // Progreso final: 100% completado
    options.onProgressUpdate(100, t.exportComplete);
  } catch (error) {
    console.error("❌ Error al exportar:", error);
    throw error;
  }
}
