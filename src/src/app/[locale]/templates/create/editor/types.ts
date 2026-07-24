export type SelectionType =
  | "template"
  | "section"
  | "block"
  | "field"
  | "list_item"
  | "list_item_field"
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
}

export interface CanvasState {
  scale: number;
  position: { x: number; y: number };
}
