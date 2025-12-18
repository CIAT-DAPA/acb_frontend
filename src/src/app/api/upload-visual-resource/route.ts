import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const targetPath = formData.get("targetPath") as string;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file received" },
        { status: 400 }
      );
    }

    if (!targetPath) {
      return NextResponse.json(
        { success: false, error: "No target path provided" },
        { status: 400 }
      );
    }

    // Convertir el archivo a buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Construir la ruta completa del archivo
    // targetPath viene como "/assets/img/visualResources/public/filename.jpg"
    // Necesitamos convertirlo a "public/assets/img/visualResources/public/filename.jpg"
    const fullPath = path.join(process.cwd(), "public", targetPath);

    // Crear el directorio si no existe
    const dirPath = path.dirname(fullPath);
    await mkdir(dirPath, { recursive: true });

    // Escribir el archivo
    await writeFile(fullPath, buffer);

    // Construir la URL dinámica para servir el archivo inmediatamente
    // Reemplazamos /assets/ por /api/dynamic-assets/
    const dynamicPath = targetPath.startsWith("/assets/")
      ? targetPath.replace("/assets/", "/api/dynamic-assets/")
      : `/api/dynamic-assets${targetPath}`;

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      path: dynamicPath,
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to upload file",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
