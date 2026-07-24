type DecodedReviewFieldId = {
  parentFieldId: string;
  itemIndex?: number;
  itemFieldId?: string;
};

const ITEM_MARKER = "::item::";
const SUBFIELD_MARKER = "::subfield::";

export function encodeReviewFieldId({
  parentFieldId,
  itemIndex,
  itemFieldId,
}: DecodedReviewFieldId): string {
  if (typeof itemIndex !== "number" || itemIndex < 0) {
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
    // Si el formato no es válido, tratarlo como un field normal
    // para no romper comentarios existentes.
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
