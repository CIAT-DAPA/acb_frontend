/**
 * Convierte un texto a formato slug (machine name)
 * - Convierte a minúsculas
 * - Reemplaza espacios y guiones bajos con guiones
 * - Elimina caracteres especiales y acentos
 * - Elimina guiones múltiples consecutivos
 * - Elimina guiones al inicio y final
 *
 * @param text - Texto a convertir
 * @returns Texto en formato slug
 *
 * @example
 * slugify("Monthly Climate Bulletin") // "monthly-climate-bulletin"
 * slugify("Café en Nariño") // "cafe-en-narino"
 * slugify("Boletín_Agroclimático 2024") // "boletin-agroclimatico-2024"
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
      // Reemplazar espacios, guiones bajos y múltiples guiones con un solo guion
      .replace(/[\s_]+/g, "-")
      // Eliminar caracteres especiales excepto guiones y alfanuméricos
      .replace(/[^\w-]+/g, "")
      // Reemplazar múltiples guiones consecutivos con uno solo
      .replace(/--+/g, "-")
      // Eliminar guiones al inicio y final
      .replace(/^-+|-+$/g, "")
  );
}

/**
 * Valida si un string es un slug válido
 * - Solo minúsculas, números y guiones
 * - No comienza ni termina con guion
 * - No tiene guiones consecutivos
 *
 * @param slug - String a validar
 * @returns true si es un slug válido
 *
 * @example
 * isValidSlug("monthly-climate-bulletin") // true
 * isValidSlug("Monthly-Climate") // false (mayúsculas)
 * isValidSlug("-invalid-") // false (guiones al inicio/final)
 * isValidSlug("invalid--slug") // false (guiones consecutivos)
 */
export function isValidSlug(slug: string): boolean {
  const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  return slugPattern.test(slug);
}
