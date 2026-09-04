import type { ListSubfieldSegment } from "@/utils/listSubfieldPath";

export type SelectionType =
  | "template"
  | "section"
  | "block"
  | "field"
  | "list_item"
  | "list_item_field"
  | "card_item"
  | "card_block"
  | "card_field"
  | "header"
  | "footer"
  | "header_field"
  | "footer_field";

export interface EditorSelection {
  type: SelectionType;
  id: string | null;

  sectionIndex?: number;
  blockIndex?: number;
  fieldIndex?: number;

  // List selection
  itemIndex?: number;
  schemaKey?: string;

  /*
   * Ruta completa dentro de listas anidadas.
   *
   * itemIndex y schemaKey reflejan el primer tramo para mantener compatibilidad
   * con el código que solo contempla un nivel; schemaPath manda cuando hay más
   * de un nivel de anidamiento.
   */
  schemaPath?: ListSubfieldSegment[];


  cardIndex?: number;
  cardId?: string;

  cardBlockIndex?: number;
  cardBlockId?: string;

  cardFieldIndex?: number;
  cardFieldId?: string;

  // Nombre mostrado mientras se crea el comentario
  displayName?: string;
}

export interface CanvasState {
  scale: number;
  position: { x: number; y: number };
}
