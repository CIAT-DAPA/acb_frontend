export type SelectionType = 'template' | 'section' | 'block' | 'field' | 'header' | 'footer' | 'header_field' | 'footer_field';

export interface EditorSelection {
  type: SelectionType;
  id: string | null;
  sectionIndex?: number;
  blockIndex?: number;
  fieldIndex?: number;
}

export interface CanvasState {
  scale: number;
  position: { x: number; y: number };
}
