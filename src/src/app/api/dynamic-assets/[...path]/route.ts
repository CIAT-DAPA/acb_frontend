import { NextRequest, NextResponse } from "next/server";
import { readFile, stat } from "fs/promises";
import path from "path";

// Simple mime type lookup to avoid external dependencies
const getMimeType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes: Record<string, string> = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
    ".ico": "image/x-icon",
    ".pdf": "application/pdf",
  };
  return mimeTypes[ext] || "application/octet-stream";
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParams } = await params;

    // Construir la ruta al archivo en public/assets
    // La URL es /api/dynamic-assets/thumbnails/123/image.png
    // pathParams será ['thumbnails', '123', 'image.png']
    // Queremos leer de: process.cwd() + /public/assets/thumbnails/123/image.png

    const filePath = path.join(
      process.cwd(),
      "public",
      "assets",
      ...pathParams
    );

    // Verificar que el archivo existe
    try {
      await stat(filePath);
    } catch (e) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Leer el archivo
    const fileBuffer = await readFile(filePath);

    // Determinar el tipo MIME
    const mimeType = getMimeType(filePath);

    // Retornar el archivo con los headers correctos
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=0, must-revalidate", // No cachear para ver cambios inmediatos
      },
    });
  } catch (error) {
    console.error("Error serving dynamic asset:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
