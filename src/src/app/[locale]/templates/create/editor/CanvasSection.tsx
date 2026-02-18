import React from 'react';
import { Section, StyleConfig } from '@/types/template';
import { EditorSelection } from './types';
import { CanvasBlock } from '@/app/[locale]/templates/create/editor/CanvasBlock';
import { HeaderFooterRenderer } from '@/app/[locale]/templates/create/editor/renderers/HeaderFooterRenderer';

interface CanvasSectionProps {
  section: Section;
  index: number;
  isSelected: boolean;
  selection: EditorSelection;
  onSelect: (selection: EditorSelection) => void;
  globalStyleConfig?: StyleConfig;
}

export const CanvasSection: React.FC<CanvasSectionProps> = ({
  section,
  index,
  isSelected,
  selection,
  onSelect,
  globalStyleConfig
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect({
      type: 'section',
      id: section.section_id || null, // Fallback if no ID yet
      sectionIndex: index
    });
  };

  // Merge global styles with section styles (section overrides global)
  // Dimensions specifically come from global config as requested, but could be overridden if needed
  const styleConfig = {
      ...globalStyleConfig,
      ...(section.style_config || {})
  };
  
  // Use global bulletin dimensions from the merged config (or specifically from global if desired)
  // The user asked to take it from bulletin_height/width which are in the global config.
  const finalWidth = styleConfig.bulletin_width || 794; // A4 width at 96 DPI
  const finalHeight = styleConfig.bulletin_height || 1123; // A4 height at 96 DPI

  const width = `${finalWidth}px`;
  const minHeight = `${finalHeight}px`;

  const sectionStyles: React.CSSProperties = {
      // Dimensions
      width,
      minHeight,

      // Background
      backgroundColor: styleConfig.background_color || '#ffffff',
      
      // Typography
      fontFamily: styleConfig.font,
      color: styleConfig.color,  // Changed from section.color (which doesn't exist) to styleConfig.color
      fontSize: styleConfig.font_size ? `${styleConfig.font_size}px` : undefined,
      fontWeight: styleConfig.font_weight as any,
      fontStyle: styleConfig.font_style,
      textDecoration: styleConfig.text_decoration,
      textAlign: styleConfig.text_align,
      lineHeight: styleConfig.line_height,
      
      // Spacing & Borders
      padding: styleConfig.padding || '2rem',
      borderWidth: styleConfig.border_width,
      borderStyle: styleConfig.border_style as any,
      borderColor: styleConfig.border_color,
      borderRadius: styleConfig.border_radius,
  };
  
  // Handle Background Image
  // Priority: section.background_url > style_config.background_image
  const bgImage = (section.background_url && section.background_url.length > 0) 
      ? section.background_url[0] 
      : styleConfig.background_image;


  if (bgImage) {
      sectionStyles.backgroundImage = `url(${bgImage})`;
      sectionStyles.backgroundSize = 'cover';
      sectionStyles.backgroundPosition = 'center';
      sectionStyles.backgroundRepeat = 'no-repeat';
  }

  return (
    <div
      onClick={handleClick}
      className={`
        relative shadow-xl transition-all duration-200 shrink-0 flex flex-col
        ${isSelected ? 'ring-2 ring-blue-500 shadow-blue-200' : 'hover:ring-1 hover:ring-gray-300'}
      `}
      style={sectionStyles}
    >
      {/* Label/Handle for the Section - Figma style label on top */}
      <div className={`
        absolute -top-6 left-0 px-2 py-0.5 text-xs font-semibold select-none
        ${isSelected ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}
      `}>
        {section.display_name || `Section ${index + 1}`}
      </div>
      
      {/* SECTION HEADER */}
      {section.header_config && (
          <HeaderFooterRenderer 
            config={section.header_config} 
            type="header"
            globalStyle={styleConfig} 
          />
      )}
      
      <div className="flex-1 flex flex-col gap-4 relative">
        {section.blocks?.map((block, blockIndex) => (
          <CanvasBlock
            key={block.block_id || blockIndex}
            block={block}
            sectionIndex={index}
            blockIndex={blockIndex}
            isSelected={selection.type === 'block' && selection.sectionIndex === index && selection.blockIndex === blockIndex}
            selection={selection}
            onSelect={onSelect}
            sectionStyles={styleConfig}
            globalStyles={globalStyleConfig}
          />
        ))}

        {/* Empty state or Add Block area could go here */}
        {(!section.blocks || section.blocks.length === 0) && (
            <div className="flex-1 flex items-center justify-center border border-dashed border-gray-200 rounded text-gray-300 text-sm py-10 m-4">
                Empty Section
            </div>
        )}
      </div>

      {/* SECTION FOOTER */}
      {section.footer_config && (
          <HeaderFooterRenderer 
            config={section.footer_config} 
            type="footer" 
            globalStyle={styleConfig}
          />
      )}
    </div>
  );
};
