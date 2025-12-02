import { readdir, stat, unlink } from "fs/promises";
import path from "path";

/**
 * Script para limpiar imágenes temporales de boletines que tienen más de 24 horas
 * Puede ejecutarse como cron job o tarea programada
 */

const TEMP_DIR = path.join(
  process.cwd(),
  "public",
  "assets",
  "img",
  "bulletins",
  "temp"
);
const MAX_AGE_HOURS = 24;

async function cleanupOldTempImages() {
  console.log("🧹 Iniciando limpieza de imágenes temporales antiguas...");

  try {
    const files = await readdir(TEMP_DIR);
    const now = Date.now();
    let deletedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      // Saltar archivos .gitkeep
      if (file === ".gitkeep") {
        continue;
      }

      const filePath = path.join(TEMP_DIR, file);

      try {
        const stats = await stat(filePath);
        const ageInHours = (now - stats.mtimeMs) / (1000 * 60 * 60);

        if (ageInHours > MAX_AGE_HOURS) {
          await unlink(filePath);
          deletedCount++;
          console.log(
            `  ✓ Eliminado: ${file} (${ageInHours.toFixed(
              1
            )} horas de antigüedad)`
          );
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`  ✗ Error procesando ${file}:`, error);
      }
    }

    console.log(`\n📊 Resumen:`);
    console.log(`  - Archivos eliminados: ${deletedCount}`);
    console.log(`  - Archivos mantenidos: ${skippedCount}`);
    console.log(`✅ Limpieza completada\n`);
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  cleanupOldTempImages();
}

export { cleanupOldTempImages };
