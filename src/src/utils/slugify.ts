/**
 * Convierte un texto a formato slug (machine name)
 * - Convierte a minúsculas
 * - Reemplaza espacios y guiones con guiones bajos
 * - Elimina caracteres especiales y acentos
 * - Elimina guiones bajos múltiples consecutivos
 * - Elimina guiones bajos al inicio y final
 *
 * @param text - Texto a convertir
 * @returns Texto en formato slug
 *
 * @example
 * slugify("Monthly Climate Bulletin") // "monthly_climate_bulletin"
 * slugify("Café en Nariño") // "cafe_en_narino"
 * slugify("Boletín_Agroclimático 2024") // "boletin_agroclimatico_2024"
 */
export function slugify(text: string): string {
  return (
    text
      .toString()
      .toLowerCase()
      .trim()
      // Reemplazar caracteres acentuados
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      // Reemplazar espacios, guiones y múltiples guiones bajos con un solo guion bajo
      .replace(/[\s-]+/g, "_")
      // Eliminar caracteres especiales excepto guiones bajos y alfanuméricos
      .replace(/[^\w]+/g, "")
      // Reemplazar múltiples guiones bajos consecutivos con uno solo
      .replace(/__+/g, "_")
      // Eliminar guiones bajos al inicio y final
      .replace(/^_+|_+$/g, "")
  );
}

/**
 * Valida si un string es un slug válido
 * - Solo minúsculas, números y guiones bajos
 * - No comienza ni termina con guion bajo
 * - No tiene guiones bajos consecutivos
 *
 * @param slug - String a validar
 * @returns true si es un slug válido
 *
 * @example
 * isValidSlug("monthly_climate_bulletin") // true
 * isValidSlug("Monthly_Climate") // false (mayúsculas)
 * isValidSlug("_invalid_") // false (guiones bajos al inicio/final)
 * isValidSlug("invalid__slug") // false (guiones bajos consecutivos)
 */
export function isValidSlug(slug: string): boolean {
  const slugPattern = /^[a-z0-9]+(?:_[a-z0-9]+)*$/;
  return slugPattern.test(slug);
}
