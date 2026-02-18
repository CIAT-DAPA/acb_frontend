import React from 'react';
import { Block, StyleConfig } from '@/types/template';
import { EditorSelection } from './types';
import { CanvasField } from '@/app/[locale]/templates/create/editor/CanvasField';

interface CanvasBlockProps {
  block: Block;
  sectionIndex: number;
  blockIndex: number;
  isSelected: boolean;
  selection: EditorSelection;
  onSelect: (selection: EditorSelection) => void;
  sectionStyles?: StyleConfig; // Inherited from Section
  globalStyles?: StyleConfig; // Global context
}

export const CanvasBlock: React.FC<CanvasBlockProps> = ({
  block,
  sectionIndex,
  blockIndex,
  isSelected,
  selection,
  onSelect,
  sectionStyles,
  globalStyles
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      type: 'block',
      id: block.block_id || null,
      sectionIndex,
      blockIndex
    });
  };
  
  // Merge: Global -> Section -> Block (Block overrides section, Section overrides global)
  // Note: For simple preview, we can just let inheritance be handled by the renderer or merge here.
  // We'll pass the effective "Container Style" to the field. 
  // The immediate container for the field is the Block.
  // The Block inherits from Section.
  
  // Merging logic for block display
  const blockConfig = block.style_config || {};
  
  const blockStyles: React.CSSProperties = {
    backgroundColor: blockConfig.background_color || 'transparent',
    padding: blockConfig.padding || '1rem',
    borderRadius: blockConfig.border_radius || '0.25rem',
    borderWidth: blockConfig.border_width,
    borderColor: blockConfig.border_color,
    borderStyle: blockConfig.border_style as any,
  };
  
  // Prepare styles to pass down to children (Fields)
  // Fields should inherit from this Block's effective configuration
  const combinedBlockStyles: StyleConfig = {
      ...globalStyles,
      ...sectionStyles,
      ...blockConfig
  };

  return (
    <div
      onClick={handleClick}
      className={`
        relative border transition-colors
        ${isSelected ? 'border-blue-500 bg-blue-50/10' : 'border-transparent hover:border-gray-200'}
      `}
      style={blockStyles}
    >
        {/* Block Badge */}
         <div className={`
             absolute -top-3 -right-3 px-1.5 py-0.5 text-[10px] rounded uppercase font-bold tracking-wider
            ${isSelected ? 'bg-blue-100 text-blue-600 opacity-100' : 'opacity-0'}
            transition-all
            pointer-events-none
        `}>
            Block
        </div>

      <div className="flex flex-wrap gap-4">
        {block.fields?.map((field, fieldIndex) => (
          <CanvasField
            key={field.field_id || fieldIndex}
            field={field}
            sectionIndex={sectionIndex}
            blockIndex={blockIndex}
            fieldIndex={fieldIndex}
            isSelected={selection.type === 'field' && selection.sectionIndex === sectionIndex && selection.blockIndex === blockIndex && selection.fieldIndex === fieldIndex}
            onSelect={onSelect}
            parentStyles={combinedBlockStyles}
          />
        ))}
        {(!block.fields || block.fields.length === 0) && (
            <div className="w-full text-center text-xs text-gray-300 py-2 border border-dashed rounded bg-gray-50">
                No Fields
            </div>
        )}
      </div>
    </div>
  );
};
