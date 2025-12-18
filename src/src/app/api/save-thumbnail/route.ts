import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, readdir, unlink } from "fs/promises";
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

    // Eliminar solo los thumbnails antiguos (archivos), mantener el directorio
    try {
      const existingFiles = await readdir(uploadDir).catch(() => []);
      if (existingFiles.length > 0) {
        console.log(
          `🗑️ Deleting ${existingFiles.length} old thumbnail(s) from: ${uploadDir}`
        );
        for (const file of existingFiles) {
          const filePath = path.join(uploadDir, file);
          await unlink(filePath);
        }
        console.log("✅ Old thumbnails deleted");
      }
    } catch (cleanupError) {
      console.warn("⚠️ Error cleaning old thumbnails:", cleanupError);
      // Continuar incluso si hay error en la limpieza
    }

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

      // Guardar la ruta relativa usando el endpoint dinámico
      // En lugar de /assets/thumbnails/..., usamos /api/dynamic-assets/thumbnails/...
      const relativePath = `/api/dynamic-assets/thumbnails/${templateId}/${fileName}`;
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
