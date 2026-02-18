import React from 'react';
import { HeaderFooterConfig, StyleConfig, Field } from '@/types/template';
import { FieldRenderer } from './FieldRenderer';

interface HeaderFooterRendererProps {
  config: HeaderFooterConfig;
  type: 'header' | 'footer';
  globalStyle?: StyleConfig;
}

export const HeaderFooterRenderer: React.FC<HeaderFooterRendererProps> = ({ config, type, globalStyle }) => {
    
  if (!config) return null;

  const styleConfig = config.style_config || {};

  const containerStyle: React.CSSProperties = {
    // Positioning
    width: '100%',
    
    // Background and Spacing
    backgroundColor: styleConfig.background_color || 'transparent',
    padding: styleConfig.padding || '1rem',
    height: styleConfig.height ? `${styleConfig.height}px` : 'auto',
    
    // Typography
    color: styleConfig.color || globalStyle?.color,
    fontFamily: styleConfig.font || globalStyle?.font,
    
    // Layout
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center', // Default alignment
    justifyContent: styleConfig.justify_content || 'space-between',
    gap: styleConfig.gap || '1rem',
    
    // Borders
    borderTopWidth: type === 'footer' ? (styleConfig.border_width || '1px') : undefined,
    borderBottomWidth: type === 'header' ? (styleConfig.border_width || '1px') : undefined,
    borderStyle: (styleConfig.border_style as any) || 'solid',
    borderColor: styleConfig.border_color || '#e5e7eb',
  };

  return (
    <div style={containerStyle} className="relative group">
       {/* Badge just for editor visual cue */}
       <div className="absolute top-0 right-0 bg-gray-100 text-[9px] px-1 text-gray-400 capitalize pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
           {type}
       </div>

      {(config.fields || []).map((field: Field, idx: number) => (
        <div key={field.field_id || idx} className="relative">
             <FieldRenderer 
                field={field} 
                globalStyles={{ 
                    ...globalStyle, 
                    ...styleConfig 
                }} 
             />
        </div>
      ))}
      
      {(!config.fields || config.fields.length === 0) && (
          <div className="w-full text-center text-xs text-gray-300 italic py-2">
              Empty {type}
          </div>
      )}
    </div>
  );
};
