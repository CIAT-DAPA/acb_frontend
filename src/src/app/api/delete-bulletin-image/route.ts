import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "No image URL provided" },
        { status: 400 }
      );
    }

    // Only allow deletion of temporary images
    if (!imageUrl.includes("/bulletins/temp/")) {
      return NextResponse.json(
        { success: false, error: "Can only delete temporary images" },
        { status: 403 }
      );
    }

    // Determine the relative path within public/assets
    let relativePathInPublic = "";
    if (imageUrl.startsWith("/api/dynamic-assets/")) {
      relativePathInPublic = imageUrl.replace(
        "/api/dynamic-assets/",
        "/assets/"
      );
    } else if (imageUrl.startsWith("/assets/")) {
      relativePathInPublic = imageUrl;
    } else {
      relativePathInPublic = imageUrl;
    }

    const fullPath = path.join(process.cwd(), "public", relativePathInPublic);

    // Delete the file
    await unlink(fullPath);

    return NextResponse.json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting image:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
