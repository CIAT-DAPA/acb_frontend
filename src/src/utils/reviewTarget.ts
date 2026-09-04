/**
 * Un tramo de la ruta dentro de una lista.
 *
 * Las listas anidadas encadenan varios tramos: cada uno indica el ítem y, salvo
 * el último, el subcampo de tipo lista por el que se sigue descendiendo.
 */
export type ReviewListPathSegment = {
  itemIndex: number;
  itemFieldId?: string;
};

export type DecodedReviewFieldId = {
  parentFieldId: string;

  // Listas
  itemIndex?: number;
  itemFieldId?: string;

  /*
   * Ruta completa para listas anidadas.
   *
   * itemIndex e itemFieldId siguen reflejando el primer tramo para no romper el
   * código que solo contempla un nivel de anidamiento.
   */
  listPath?: ReviewListPathSegment[];

  // Cards
  cardIndex?: number;
  cardId?: string;

  cardBlockIndex?: number;
  cardBlockId?: string;

  cardFieldIndex?: number;
  cardFieldId?: string;
};

const ITEM_MARKER = "::item::";
const SUBFIELD_MARKER = "::subfield::";
const CARD_MARKER = "::card::";

const isValidIndex = (value: unknown): value is number =>
  typeof value === "number" && Number.isInteger(value) && value >= 0;

const getOptionalString = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() !== "" ? value : undefined;

/**
 * Normaliza la ruta de lista a partir de listPath o del par itemIndex/itemFieldId.
 *
 * Descarta los tramos inválidos y todo lo que venga después del primer tramo sin
 * itemFieldId, porque ese tramo ya identifica la hoja de la ruta.
 */
const normalizeListPath = ({
  listPath,
  itemIndex,
  itemFieldId,
}: Pick<
  DecodedReviewFieldId,
  "listPath" | "itemIndex" | "itemFieldId"
>): ReviewListPathSegment[] => {
  const rawSegments =
    Array.isArray(listPath) && listPath.length > 0
      ? listPath
      : isValidIndex(itemIndex)
        ? [{ itemIndex, itemFieldId }]
        : [];

  const segments: ReviewListPathSegment[] = [];

  for (const segment of rawSegments) {
    if (!segment || !isValidIndex(segment.itemIndex)) {
      break;
    }

    const segmentFieldId = getOptionalString(segment.itemFieldId);

    // Se omite itemFieldId cuando no aplica para que la ruta serializada a JSON
    // y la reconstruida desde el texto tengan exactamente la misma forma.
    segments.push(
      segmentFieldId
        ? { itemIndex: segment.itemIndex, itemFieldId: segmentFieldId }
        : { itemIndex: segment.itemIndex },
    );

    if (!segmentFieldId) {
      break;
    }
  }

  return segments;
};

/**
 * Serializa la ruta de lista al formato `::item::N::subfield::X`.
 */
const encodeListPath = (segments: ReviewListPathSegment[]): string =>
  segments
    .map((segment) => {
      const itemTarget = `${ITEM_MARKER}${segment.itemIndex}`;

      if (!segment.itemFieldId) {
        return itemTarget;
      }

      return (
        `${itemTarget}${SUBFIELD_MARKER}` +
        encodeURIComponent(segment.itemFieldId)
      );
    })
    .join("");

/**
 * Reconstruye la ruta de lista desde el texto que sigue al field padre.
 */
const decodeListPath = (encodedPath: string): ReviewListPathSegment[] => {
  const segments: ReviewListPathSegment[] = [];

  let rest = encodedPath;

  while (rest !== "") {
    const subfieldMarkerIndex = rest.indexOf(SUBFIELD_MARKER);

    const itemIndexText =
      subfieldMarkerIndex === -1 ? rest : rest.slice(0, subfieldMarkerIndex);

    const itemIndex = Number(itemIndexText);

    if (!isValidIndex(itemIndex)) {
      break;
    }

    // Último tramo: apunta al ítem completo, no a un subcampo.
    if (subfieldMarkerIndex === -1) {
      segments.push({ itemIndex });
      break;
    }

    const afterSubfield = rest.slice(
      subfieldMarkerIndex + SUBFIELD_MARKER.length,
    );

    const nextItemMarkerIndex = afterSubfield.indexOf(ITEM_MARKER);

    const encodedItemFieldId =
      nextItemMarkerIndex === -1
        ? afterSubfield
        : afterSubfield.slice(0, nextItemMarkerIndex);

    let itemFieldId: string;

    try {
      itemFieldId = decodeURIComponent(encodedItemFieldId);
    } catch {
      itemFieldId = encodedItemFieldId;
    }

    segments.push({
      itemIndex,
      itemFieldId: itemFieldId || undefined,
    });

    if (nextItemMarkerIndex === -1) {
      break;
    }

    rest = afterSubfield.slice(nextItemMarkerIndex + ITEM_MARKER.length);
  }

  return segments;
};

export function encodeReviewFieldId({
  parentFieldId,

  itemIndex,
  itemFieldId,
  listPath,

  cardIndex,
  cardId,
  cardBlockIndex,
  cardBlockId,
  cardFieldIndex,
  cardFieldId,
}: DecodedReviewFieldId): string {
  const listSegments = normalizeListPath({ listPath, itemIndex, itemFieldId });
  /*
   * Card completa, bloque interno o field interno.
   *
   * Se guarda todo bajo el field_id del field padre de tipo card.
   */
  if (isValidIndex(cardIndex)) {
    const cardPath = {
      cardIndex,
      cardId: getOptionalString(cardId),

      cardBlockIndex: isValidIndex(cardBlockIndex) ? cardBlockIndex : undefined,

      cardBlockId: getOptionalString(cardBlockId),

      cardFieldIndex: isValidIndex(cardFieldIndex) ? cardFieldIndex : undefined,

      cardFieldId: getOptionalString(cardFieldId),

      itemIndex: listSegments[0]?.itemIndex,

      itemFieldId: listSegments[0]?.itemFieldId,

      // Solo se guarda cuando hay listas anidadas dentro de la card.
      listPath: listSegments.length > 1 ? listSegments : undefined,
    };

    return (
      `${parentFieldId}${CARD_MARKER}` +
      encodeURIComponent(JSON.stringify(cardPath))
    );
  }

  /*
   * Lista e ítems de lista.
   * Con un solo nivel el resultado es idéntico al formato anterior, así que los
   * comentarios ya guardados siguen resolviéndose.
   */
  if (listSegments.length === 0) {
    return parentFieldId;
  }

  return `${parentFieldId}${encodeListPath(listSegments)}`;
}

export function decodeReviewFieldId(
  encodedFieldId?: string | null,
): DecodedReviewFieldId | null {
  if (!encodedFieldId) {
    return null;
  }

  /*
   * Intentar primero decodificar una ruta interna de card.
   */
  const cardMarkerIndex = encodedFieldId.indexOf(CARD_MARKER);

  if (cardMarkerIndex !== -1) {
    const parentFieldId = encodedFieldId.slice(0, cardMarkerIndex);

    const encodedCardPath = encodedFieldId.slice(
      cardMarkerIndex + CARD_MARKER.length,
    );

    if (!parentFieldId) {
      return {
        parentFieldId: encodedFieldId,
      };
    }

    try {
      const parsedPath = JSON.parse(
        decodeURIComponent(encodedCardPath),
      ) as Record<string, unknown>;

      if (!isValidIndex(parsedPath.cardIndex)) {
        return {
          parentFieldId,
        };
      }

      return {
        parentFieldId,

        cardIndex: parsedPath.cardIndex,
        cardId: getOptionalString(parsedPath.cardId),

        cardBlockIndex: isValidIndex(parsedPath.cardBlockIndex)
          ? parsedPath.cardBlockIndex
          : undefined,

        cardBlockId: getOptionalString(parsedPath.cardBlockId),

        cardFieldIndex: isValidIndex(parsedPath.cardFieldIndex)
          ? parsedPath.cardFieldIndex
          : undefined,

        cardFieldId: getOptionalString(parsedPath.cardFieldId),

        /*
         * Ruta opcional de lista dentro del field de card.
         */
        ...(() => {
          const segments = normalizeListPath({
            listPath: parsedPath.listPath as
              | ReviewListPathSegment[]
              | undefined,
            itemIndex: parsedPath.itemIndex as number | undefined,
            itemFieldId: parsedPath.itemFieldId as string | undefined,
          });

          return {
            itemIndex: segments[0]?.itemIndex,
            itemFieldId: segments[0]?.itemFieldId,
            listPath: segments.length > 0 ? segments : undefined,
          };
        })(),
      };
    } catch {
      // Si la ruta está dañada, al menos conservar el field padre.
      return {
        parentFieldId,
      };
    }
  }

  /*
   * Formato existente para listas.
   */
  const itemMarkerIndex = encodedFieldId.indexOf(ITEM_MARKER);

  // Es un field normal o una lista completa.
  if (itemMarkerIndex === -1) {
    return {
      parentFieldId: encodedFieldId,
    };
  }

  const parentFieldId = encodedFieldId.slice(0, itemMarkerIndex);

  const nestedPath = encodedFieldId.slice(itemMarkerIndex + ITEM_MARKER.length);

  const segments = decodeListPath(nestedPath);

  if (!parentFieldId || segments.length === 0) {
    return {
      parentFieldId: encodedFieldId,
    };
  }

  return {
    parentFieldId,
    itemIndex: segments[0].itemIndex,
    itemFieldId: segments[0].itemFieldId,
    listPath: segments,
  };
}
