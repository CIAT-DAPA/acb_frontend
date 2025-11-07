import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const maxDuration = 60; // Máximo 60 segundos para la ejecución

export async function POST(request: NextRequest) {
  let browser;

  try {
    const body = await request.json();
    const {
      html,
      width = 1200,
      height = 1600,
      format = "png",
      quality = 90,
      deviceScaleFactor = 1,
      baseUrl,
    } = body;

    if (!html) {
      return NextResponse.json(
        { error: "HTML content is required" },
        { status: 400 }
      );
    }

    // Obtener la URL base para resolver URLs relativas
    const resolvedBaseUrl =
      baseUrl ||
      request.headers.get("origin") ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    // Asegurar que quality sea un entero válido entre 0 y 100
    const qualityInt = Math.min(
      100,
      Math.max(0, parseInt(String(quality)) || 90)
    );

    // Asegurar que las dimensiones sean enteros válidos
    const widthInt = Math.max(1, parseInt(String(width)) || 1200);
    const heightInt = Math.max(1, parseInt(String(height)) || 1600);

    // deviceScaleFactor debe ser un número válido (1, 1.5, 2, o 3)
    const scaleFactor = Math.min(
      3,
      Math.max(1, Number(deviceScaleFactor) || 1)
    );

    // Iniciar el navegador
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();

    page.on("console", (msg) => {
      const type = msg.type();
      const text = msg.text();
      if (type === "log") console.log("🌐 BROWSER:", text);
      else if (type === "error") console.error("🌐 BROWSER ERROR:", text);
      else if (type === "warn") console.warn("🌐 BROWSER WARNING:", text);
    });

    // Establecer el viewport con las dimensiones exactas
    await page.setViewport({
      width: widthInt,
      height: heightInt,
      deviceScaleFactor: scaleFactor,
    });

    // Establecer el contenido HTML con baseURL para resolver URLs relativas
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    // Esperar a que las fuentes se carguen
    await page.evaluateHandle("document.fonts.ready");

    // Esperar un poco más para que las imágenes se rendericen (puede que se carguen con JS)
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Convertir URLs relativas a absolutas MANUALMENTE (img tags Y background-image)
    const imagesProcessed = await page.evaluate(async (baseUrl: string) => {
      const images = Array.from(document.images);

      // 1. Convertir <img> tags
      images.forEach((img, index) => {
        const originalSrc = img.getAttribute("src");

        if (originalSrc && originalSrc.startsWith("/")) {
          const newSrc = `${baseUrl}${originalSrc}`;

          img.setAttribute("src", newSrc);
        } else if (
          originalSrc &&
          !originalSrc.startsWith("http://") &&
          !originalSrc.startsWith("https://") &&
          !originalSrc.startsWith("data:")
        ) {
          const newSrc = `${baseUrl}/${originalSrc}`;
          img.setAttribute("src", newSrc);
        }
      });

      // 2. Convertir background-image en estilos inline
      const elementsWithBackground = Array.from(
        document.querySelectorAll('[style*="background"]')
      );

      elementsWithBackground.forEach((el: Element, index) => {
        const htmlEl = el as HTMLElement;
        const style = htmlEl.getAttribute("style");

        if (style && style.includes("url(")) {
          // Buscar todas las urls en el style
          const urlRegex = /url\(["']?([^"')]+)["']?\)/g;
          let match;
          let newStyle = style;

          while ((match = urlRegex.exec(style)) !== null) {
            const originalUrl = match[1];

            if (originalUrl.startsWith("/")) {
              const absoluteUrl = baseUrl + originalUrl;
              newStyle = newStyle.replace(match[0], `url("${absoluteUrl}")`);
            } else if (
              !originalUrl.startsWith("http://") &&
              !originalUrl.startsWith("https://") &&
              !originalUrl.startsWith("data:")
            ) {
              const absoluteUrl = baseUrl + "/" + originalUrl;
              newStyle = newStyle.replace(match[0], `url("${absoluteUrl}")`);
            }
          }

          if (newStyle !== style) {
            htmlEl.setAttribute("style", newStyle);
          }
        }
      });

      // Ahora esperar a que todas las imágenes se carguen
      const imagePromises = images.map((img, index) => {
        return new Promise<{ success: boolean; src: string }>((resolve) => {
          const imgSrc = img.src || "no-src";

          if (img.complete && img.naturalHeight !== 0) {
            resolve({ success: true, src: imgSrc });
          } else {
            const timeout = setTimeout(() => {
              console.error(
                `❌ TIMEOUT imagen ${index + 1}: ${imgSrc} (no cargó en 8s)`
              );
              resolve({ success: false, src: imgSrc });
            }, 8000); // Aumentado a 8 segundos para dar más tiempo

            img.onload = () => {
              clearTimeout(timeout);
              resolve({ success: true, src: imgSrc });
            };

            img.onerror = (error) => {
              clearTimeout(timeout);
              console.error(
                `❌ ERROR cargando imagen ${index + 1}: ${imgSrc}`,
                error
              );
              resolve({ success: false, src: imgSrc });
            };
          }
        });
      });

      const results = await Promise.all(imagePromises);
      const successCount = results.filter((r) => r.success).length;
      const failedImages = results.filter((r) => !r.success);

      if (failedImages.length > 0) {
        console.error("❌ Imágenes que fallaron:");
        failedImages.forEach((img, i) => {
          console.error(`  ${i + 1}. ${img.src}`);
        });
      }

      return {
        total: images.length,
        loaded: successCount,
        failed: failedImages.length,
        failedUrls: failedImages.map((i) => i.src),
      };
    }, resolvedBaseUrl);

    if (imagesProcessed.failed > 0) {
      console.warn(
        `⚠️ ${imagesProcessed.failed} imágenes no se cargaron correctamente`
      );
      console.warn("URLs fallidas:", imagesProcessed.failedUrls);
    }

    // Dar un pequeño tiempo adicional para asegurar que todo se renderice correctamente
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Capturar el screenshot
    const screenshotOptions: any = {
      type: format === "jpg" ? "jpeg" : "png",
      fullPage: false,
      omitBackground: false,
    };

    if (format === "jpg") {
      screenshotOptions.quality = qualityInt;
    }

    const screenshot = await page.screenshot(screenshotOptions);

    await browser.close();

    // Devolver la imagen como respuesta SIN forzar descarga (inline)
    return new NextResponse(screenshot, {
      headers: {
        "Content-Type": format === "jpg" ? "image/jpeg" : "image/png",
        "Content-Disposition": `inline; filename="bulletin.${format}"`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch (error) {
    console.error("❌ Error al exportar con Puppeteer:", error);

    if (browser) {
      await browser.close().catch(() => {});
    }

    return NextResponse.json(
      {
        error: "Error al generar la imagen",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
