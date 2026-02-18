import React from 'react';
import { Field, StyleConfig } from '@/types/template';
import { EditorSelection } from './types';
import { FieldRenderer } from './renderers/FieldRenderer';
import { Calendar, Image as ImageIcon, Type, List, ChevronDown, AlignLeft } from 'lucide-react';

interface CanvasFieldProps {
  field: Field;
  sectionIndex: number;
  blockIndex: number;
  fieldIndex: number;
  isSelected: boolean;
  onSelect: (selection: EditorSelection) => void;
  parentStyles?: StyleConfig;
}

export const CanvasField: React.FC<CanvasFieldProps> = ({
  field,
  sectionIndex,
  blockIndex,
  fieldIndex,
  isSelected,
  onSelect,
  parentStyles
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      type: 'field',
      id: field.field_id || null,
      sectionIndex,
      blockIndex,
      fieldIndex
    });
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative group min-w-[50px]
        ${isSelected ? 'ring-2 ring-blue-500 rounded z-10' : 'hover:ring-1 hover:ring-blue-300 rounded'}
      `}
    >
      {/* On Hover/Select Header */}
      <div className={`
         absolute -top-3 left-0 z-20 text-[9px] bg-blue-100 text-blue-700 px-1 rounded
         ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
         pointer-events-none transition-opacity
      `}>
          {field.display_name}
      </div>

      <FieldRenderer field={field} globalStyles={parentStyles} />
      
    </div>
  );
};

