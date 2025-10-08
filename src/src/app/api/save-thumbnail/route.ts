import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const templateId = formData.get("templateId") as string;

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { success: false, error: "Template ID is required" },
        { status: 400 }
      );
    }

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "assets",
      "thumbnails",
      templateId
    );

    // Crear el directorio si no existe
    await mkdir(uploadDir, { recursive: true });

    const savedFiles: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generar nombre de archivo único
      const timestamp = Date.now();
      const fileName = `section_${i}_${timestamp}.png`;
      const filePath = path.join(uploadDir, fileName);

      // Guardar el archivo
      await writeFile(filePath, buffer);

      // Guardar la ruta relativa desde public
      const relativePath = `/assets/thumbnails/${templateId}/${fileName}`;
      savedFiles.push(relativePath);
    }

    return NextResponse.json({
      success: true,
      data: {
        thumbnail_images: savedFiles,
      },
    });
  } catch (error) {
    console.error("Error saving thumbnails:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save thumbnails",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
