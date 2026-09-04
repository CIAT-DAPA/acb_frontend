/**
 * Utilidades para los identificadores DOM de listas dentro del preview.
 *
 * El preview nombra los elementos de una lista encadenando tramos:
 *
 *   field-0-1-2                                    → el field lista
 *   field-0-1-2-item-3                             → un ítem de la lista
 *   field-0-1-2-item-3-subfield-nombre             → un subcampo del ítem
 *   field-0-1-2-item-3-subfield-sub-item-1         → un ítem de la sublista
 *   field-0-1-2-item-3-subfield-sub-item-1-subfield-detalle
 *
 * Cada tramo intermedio identifica el subcampo de tipo lista por el que se
 * desciende, así que la ruta completa puede tener cualquier profundidad.
 *
 * Se asume que las claves del item_schema no contienen la secuencia "-item-".
 * Las claves generadas por el editor tienen la forma `field_<timestamp>` y las
 * escritas a mano usan guion bajo, así que la suposición se cumple en la práctica.
 */

import type { ReviewListPathSegment } from "@/utils/reviewTarget";

/**
 * Profundidad máxima de listas anidadas admitida por los editores.
 *
 * 0 es la lista de primer nivel, así que con el valor 2 se pueden editar hasta
 * tres niveles de listas.
 */
export const MAX_LIST_NESTING_LEVEL = 2;

export type ListSubfieldSegment = {
  itemIndex: number;

  // Ausente en el último tramo cuando este apunta al ítem completo.
  schemaKey?: string;
};

const ITEM_TOKEN = "-item-";
const SUBFIELD_TOKEN = "-subfield-";

/**
 * Construye el identificador DOM de un elemento de lista a partir de su ruta.
 */
export function buildListSubfieldId(
  baseId: string,
  segments: ListSubfieldSegment[] | undefined,
): string {
  if (!segments || segments.length === 0) {
    return baseId;
  }

  return segments.reduce((id, segment) => {
    const withItem = `${id}${ITEM_TOKEN}${segment.itemIndex}`;

    return segment.schemaKey
      ? `${withItem}${SUBFIELD_TOKEN}${segment.schemaKey}`
      : withItem;
  }, baseId);
}

/**
 * Descompone la parte de la ruta que sigue al identificador del field.
 *
 * Devuelve un array vacío si el texto no empieza por un tramo de ítem válido.
 */
export function parseListSubfieldPath(tail: string): ListSubfieldSegment[] {
  const segments: ListSubfieldSegment[] = [];

  let rest = tail;

  while (rest.startsWith(ITEM_TOKEN)) {
    rest = rest.slice(ITEM_TOKEN.length);

    const subfieldTokenIndex = rest.indexOf(SUBFIELD_TOKEN);

    const itemIndexText =
      subfieldTokenIndex === -1 ? rest : rest.slice(0, subfieldTokenIndex);

    if (!/^\d+$/.test(itemIndexText)) {
      return segments;
    }

    const itemIndex = Number(itemIndexText);

    // Último tramo: apunta al ítem completo.
    if (subfieldTokenIndex === -1) {
      segments.push({ itemIndex });
      return segments;
    }

    const afterSubfield = rest.slice(subfieldTokenIndex + SUBFIELD_TOKEN.length);

    const nextItemTokenIndex = afterSubfield.indexOf(ITEM_TOKEN);

    const schemaKey =
      nextItemTokenIndex === -1
        ? afterSubfield
        : afterSubfield.slice(0, nextItemTokenIndex);

    if (!schemaKey) {
      segments.push({ itemIndex });
      return segments;
    }

    segments.push({ itemIndex, schemaKey });

    if (nextItemTokenIndex === -1) {
      return segments;
    }

    rest = afterSubfield.slice(nextItemTokenIndex);
  }

  return segments;
}

export type ParsedFieldListElementId = {
  sectionIndex: number;
  blockIndex: number;
  fieldIndex: number;
  baseId: string;
  segments: ListSubfieldSegment[];
};

const FIELD_ID_PATTERN = /^field-(\d+)-(\d+)-(\d+)(-item-.*)?$/;

/**
 * Interpreta un id `field-S-B-F` con su posible ruta de lista.
 */
export function parseFieldListElementId(
  id: string,
): ParsedFieldListElementId | null {
  const match = id.match(FIELD_ID_PATTERN);

  if (!match) {
    return null;
  }

  const sectionIndex = Number(match[1]);
  const blockIndex = Number(match[2]);
  const fieldIndex = Number(match[3]);

  return {
    sectionIndex,
    blockIndex,
    fieldIndex,
    baseId: `field-${sectionIndex}-${blockIndex}-${fieldIndex}`,
    segments: match[4] ? parseListSubfieldPath(match[4]) : [],
  };
}

/**
 * Recorre el árbol de item_schema siguiendo la ruta y devuelve el field hoja.
 *
 * `resolveSchema` recibe la clave de cada tramo y debe devolver la definición
 * correspondiente, o undefined si la ruta ya no existe en el esquema.
 */
export function getSchemaKeyPath(
  segments: ListSubfieldSegment[] | undefined,
): string[] {
  if (!segments) {
    return [];
  }

  return segments
    .map((segment) => segment.schemaKey)
    .filter((schemaKey): schemaKey is string => Boolean(schemaKey));
}

/**
 * Traduce la ruta del DOM a la ruta que usan los targets de revisión.
 *
 * Ambas describen lo mismo con nombres distintos: schemaKey en el editor,
 * itemFieldId en los comentarios.
 */
export function toReviewListPath(
  segments: ListSubfieldSegment[] | undefined,
): ReviewListPathSegment[] | undefined {
  if (!segments || segments.length === 0) {
    return undefined;
  }

  return segments.map((segment) =>
    segment.schemaKey
      ? { itemIndex: segment.itemIndex, itemFieldId: segment.schemaKey }
      : { itemIndex: segment.itemIndex },
  );
}

/**
 * Traduce la ruta de un target de revisión a la ruta del DOM.
 */
export function fromReviewListPath(
  segments: ReviewListPathSegment[] | undefined,
): ListSubfieldSegment[] | undefined {
  if (!segments || segments.length === 0) {
    return undefined;
  }

  return segments.map((segment) =>
    segment.itemFieldId
      ? { itemIndex: segment.itemIndex, schemaKey: segment.itemFieldId }
      : { itemIndex: segment.itemIndex },
  );
}
