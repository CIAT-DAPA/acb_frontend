/**
 * Utilidad genérica para exportar contenido visual a imágenes (PNG/JPG) o PDF
 * Funciona con cualquier componente React/HTML que esté renderizado en el DOM
 */

export interface ExportContentOptions {
  // Configuración de exportación
  format: "png" | "jpg" | "pdf";
  quality: number; // 0-100
  qualityLevel: "low" | "medium" | "high" | "ultra"; // Mapea a escala
  selectedSections: number[]; // Array de índices de secciones a exportar (vacío = todas)
  pageSize?: string; // "auto" | "a4" | "letter" | "legal" - Solo para PDF

  // Selectores DOM
  containerSelector: string; // Selector del contenedor principal (ej: "#bulletin-export-preview .flex.gap-8")
  itemSelectorTemplate: (sectionIndex: number, pageIndex: number) => string; // Template para selector de cada item
  getExportElement: (previewElement: Element) => Element | null; // Función para obtener el elemento a exportar

  // Datos del contenido
  sections: any[]; // Array de secciones del contenido
  contentName: string; // Nombre del archivo a exportar

  // Funciones helper
  getSectionPages: (section: any) => number; // Función para calcular páginas de una sección

  // Callbacks de progreso
  onSectionChange?: (index: number) => void; // Se llama al cambiar de sección
  onProgressUpdate: (current: number, message: string) => void; // Actualización de progreso

  // Traducciones (opcionales con defaults en español)
  translations?: {
    sectionGenerating?: (current: number) => string;
    sectionPage?: string;
    toPdf?: string;
    toZip?: string;
    exportComplete?: string;
  };
}

// Traducciones por defecto
const defaultTranslations = {
  sectionGenerating: (current: number) => `Generando sección ${current}`,
  sectionPage: "Página",
  toPdf: "Convirtiendo a PDF...",
  toZip: "Generando archivo ZIP...",
  exportComplete: "¡Exportación completada!",
};

/**
 * Exporta contenido visual a imagen o PDF
 */
export async function exportContent(
  options: ExportContentOptions
): Promise<void> {
  const JSZip = (await import("jszip")).default;
  const { toPng, toJpeg } = await import("html-to-image");

  // Merge traducciones
  const t = { ...defaultTranslations, ...options.translations };

  // Determinar secciones a exportar
  const totalSections = options.sections.length;
  const sectionsToExport =
    options.selectedSections.length > 0
      ? options.selectedSections
      : Array.from({ length: totalSections }, (_, i) => i);

  try {
    const zip = new JSZip();
    
    // Para PDF, generamos PNG de alta calidad y luego convertimos
    const imageFormat = options.format === "pdf" ? "png" : options.format;
    const finalFormat = options.format;

    // PRE-CALCULAR: Total de páginas a exportar para progreso preciso
    let totalPagesToExport = 0;
    for (const sectionIndex of sectionsToExport) {
      const section = options.sections[sectionIndex];
      totalPagesToExport += options.getSectionPages(section);
    }

    // Total de pasos = páginas + 1 paso de compresión/conversión final
    const totalSteps = totalPagesToExport + 1;
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
        `No se encontró el contenedor: ${options.containerSelector}`
      );
    }

    // Exportar cada sección (y sus páginas si tiene múltiples)
    for (let i = 0; i < sectionsToExport.length; i++) {
      const sectionIndex = sectionsToExport[i];
      const section = options.sections[sectionIndex];

      // Detectar cuántas páginas tiene esta sección
      const totalPages = options.getSectionPages(section);

      // Exportar cada página de la sección
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        currentStep++;

        // Calcular porcentaje real basado en pasos totales
        const percentage = Math.round((currentStep / totalSteps) * 100);

        options.onProgressUpdate(
          percentage,
          `${t.sectionGenerating(sectionIndex + 1)}, ${t.sectionPage} ${
            pageIndex + 1
          }/${totalPages}...`
        );

        // Pequeño delay para asegurar que la sección esté renderizada
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Buscar el elemento de preview específico
        const itemSelector = options.itemSelectorTemplate(
          sectionIndex,
          pageIndex
        );
        const previewElement = scrollContainer.querySelector(itemSelector);

        if (!previewElement) {
          console.warn(
            `⚠️ No se encontró preview para sección ${
              sectionIndex + 1
            }, página ${pageIndex + 1}`
          );
          continue;
        }

        // Obtener el elemento a exportar
        const exportElement = options.getExportElement(previewElement);

        if (!exportElement) {
          console.warn(
            `⚠️ No se encontró elemento de exportación en sección ${
              sectionIndex + 1
            }, página ${pageIndex + 1}`
          );
          continue;
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
            })
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

        try {
          // Usar html-to-image para exportar
          const dataUrl =
            imageFormat === "jpg"
              ? await toJpeg(exportElement as HTMLElement, {
                  quality: options.quality / 100,
                  pixelRatio: scale,
                  cacheBust: true,
                })
              : await toPng(exportElement as HTMLElement, {
                  pixelRatio: scale,
                  cacheBust: true,
                });

          // Convertir data URL a blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();

          // Agregar al ZIP con nombre descriptivo
          const filename =
            totalPages > 1
              ? `seccion_${sectionIndex + 1}_pagina_${
                  pageIndex + 1
                }.${imageFormat}`
              : sectionsToExport.length > 1
              ? `seccion_${sectionIndex + 1}.${imageFormat}`
              : `${options.contentName}.${imageFormat}`;

          zip.file(filename, blob);
        } catch (error) {
          console.error(
            `Error al exportar sección ${sectionIndex + 1}, página ${
              pageIndex + 1
            }:`,
            error
          );
          throw error;
        }
      }
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
        format: pageFormat as any,
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
          const pdfMicroProgress = 99 + (fileIndex / files.length);
          options.onProgressUpdate(
            Math.round(pdfMicroProgress),
            `${t.toPdf} (${fileIndex + 1}/${files.length})`
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
            img.height
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
            finalHeight
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
