export type DecodedReviewFieldId = {
  parentFieldId: string;

  // Listas
  itemIndex?: number;
  itemFieldId?: string;

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

export function encodeReviewFieldId({
  parentFieldId,

  itemIndex,
  itemFieldId,

  cardIndex,
  cardId,
  cardBlockIndex,
  cardBlockId,
  cardFieldIndex,
  cardFieldId,
}: DecodedReviewFieldId): string {
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

      itemIndex: isValidIndex(itemIndex) ? itemIndex : undefined,

      itemFieldId: getOptionalString(itemFieldId),
    };

    return (
      `${parentFieldId}${CARD_MARKER}` +
      encodeURIComponent(JSON.stringify(cardPath))
    );
  }

  /*
   * Lista e ítems de lista.
   * Se mantiene el formato actual para no romper comentarios existentes.
   */
  if (!isValidIndex(itemIndex)) {
    return parentFieldId;
  }

  const itemTarget = `${parentFieldId}${ITEM_MARKER}${itemIndex}`;

  if (!itemFieldId) {
    return itemTarget;
  }

  return `${itemTarget}${SUBFIELD_MARKER}` + encodeURIComponent(itemFieldId);
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
        itemIndex: isValidIndex(parsedPath.itemIndex)
          ? parsedPath.itemIndex
          : undefined,

        itemFieldId: getOptionalString(parsedPath.itemFieldId),
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

  const subfieldMarkerIndex = nestedPath.indexOf(SUBFIELD_MARKER);

  const itemIndexText =
    subfieldMarkerIndex === -1
      ? nestedPath
      : nestedPath.slice(0, subfieldMarkerIndex);

  const itemIndex = Number(itemIndexText);

  if (!parentFieldId || !Number.isInteger(itemIndex) || itemIndex < 0) {
    return {
      parentFieldId: encodedFieldId,
    };
  }

  if (subfieldMarkerIndex === -1) {
    return {
      parentFieldId,
      itemIndex,
    };
  }

  const encodedItemFieldId = nestedPath.slice(
    subfieldMarkerIndex + SUBFIELD_MARKER.length,
  );

  let itemFieldId: string | undefined;

  try {
    itemFieldId = decodeURIComponent(encodedItemFieldId);
  } catch {
    itemFieldId = encodedItemFieldId;
  }

  return {
    parentFieldId,
    itemIndex,
    itemFieldId: itemFieldId || undefined,
  };
}
