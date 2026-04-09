import React from "react";
import { Field, StyleConfig } from "@/types/template";
import { getEffectiveFieldStyles } from "@/utils/styleInheritance";
import { SmartIcon } from "@/app/[locale]/components/AdaptiveSvgIcon";
import { useTranslations } from "next-intl";

// Mapeo de fuentes a variables CSS de Next.js (copied from TemplatePreview)
const FONT_CSS_VARS: Record<string, string> = {
  Poppins: "var(--font-poppins)",
  Roboto: "var(--font-roboto)",
  "Open Sans": "var(--font-open-sans)",
  Lato: "var(--font-lato)",
  Montserrat: "var(--font-montserrat)",
  "Archivo Light": "var(--font-archivo-light)",
  "Archivo Narrow": "var(--font-archivo-narrow)",
  Arial: "Arial, sans-serif",
  Helvetica: "Helvetica, sans-serif",
  "Times New Roman": "'Times New Roman', serif",
  Georgia: "Georgia, serif",
};

function getFontFamily(font?: string): string {
  if (!font) return "Arial";
  return FONT_CSS_VARS[font] || font;
}

function getResolvedFontWeight(
  font?: string,
  fontWeight?: string | number,
): string | number {
  if (
    fontWeight !== undefined &&
    fontWeight !== null &&
    `${fontWeight}` !== ""
  ) {
    return fontWeight;
  }
  if (font === "Archivo Light") return "300";
  return fontWeight || "400";
}

function getBorderStyles(
  styleConfig: StyleConfig | undefined,
): React.CSSProperties {
  const styles: React.CSSProperties = {};
  if (!styleConfig?.border_width) {
    if (styleConfig?.border_radius) {
      styles.borderRadius = styleConfig.border_radius;
    }
    return styles;
  }

  const borderValue = `${styleConfig.border_width} ${styleConfig.border_style || "solid"} ${styleConfig.border_color || "#000000"}`;
  const borderSides = styleConfig.border_sides || "all";

  if (borderSides === "all") {
    styles.border = borderValue;
  } else {
    const sides = borderSides.split(",").map((s) => s.trim());
    if (sides.includes("top")) styles.borderTop = borderValue;
    if (sides.includes("bottom")) styles.borderBottom = borderValue;
    if (sides.includes("left")) styles.borderLeft = borderValue;
    if (sides.includes("right")) styles.borderRight = borderValue;
  }

  if (styleConfig.border_radius) {
    styles.borderRadius = styleConfig.border_radius;
  }

  return styles;
}

interface FieldRendererProps {
  field: Field;
  globalStyles?: StyleConfig; // Renaming to represent container/inherited styles
}

export const FieldRenderer: React.FC<FieldRendererProps> = ({
  field,
  globalStyles = {},
}) => {
  // Default global styles if not provided
  const defaultGlobalStyles = {
    fontFamily: "Arial, sans-serif",
    color: "#000000",
    fontSize: "16px",
    lineHeight: "normal",
    textAlign: "left" as const,
  };

  // We don't just merge, we use the helper to properly inherit
  const effectiveStyles = getEffectiveFieldStyles(field, globalStyles);

  // Fallback for visual properties if not present in effectiveStyles (e.g. from defaults)
  const contextStyles = { ...defaultGlobalStyles, ...globalStyles };
  const resolvedFieldFont =
    effectiveStyles.font || (globalStyles as StyleConfig).font;

  const fieldStyles: React.CSSProperties = {
    color:
      effectiveStyles.primary_color ||
      effectiveStyles.color ||
      contextStyles.color,
    fontSize: effectiveStyles.font_size
      ? `${effectiveStyles.font_size}px`
      : undefined, // Let it inherit if not set, or use default
    fontWeight: getResolvedFontWeight(
      resolvedFieldFont,
      effectiveStyles.font_weight,
    ) as any,
    lineHeight: effectiveStyles.line_height || "normal",
    fontStyle: effectiveStyles.font_style || "normal",
    textDecoration: effectiveStyles.text_decoration || "none",
    textAlign: (effectiveStyles.text_align as any) || "left",
    fontFamily: effectiveStyles.font
      ? getFontFamily(effectiveStyles.font)
      : contextStyles.fontFamily,
    backgroundColor: effectiveStyles.background_color || "transparent",
    padding: effectiveStyles.padding,
    margin: effectiveStyles.margin,
    overflow: "hidden", // Prevent overflow
    ...getBorderStyles(effectiveStyles),
  };

  const renderTextContent = () => {
    const text =
      field.value && typeof field.value === "string"
        ? field.value
        : field.display_name || "Text Field";
    return <span>{text}</span>;
  };

  if (field.type === "text") {
    const showTextLabel = (field.field_config as any)?.showLabel ?? false;
    const displayTextLabel = showTextLabel
      ? field.label || field.display_name
      : null;

    return (
      <div
        style={{
          ...fieldStyles,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {displayTextLabel && <span>{displayTextLabel}:</span>}
        {renderTextContent()}
      </div>
    );
  }

  if (field.type === "text_with_icon") {
    const iconSize = effectiveStyles.icon_size || 24;
    const useOriginalColor = effectiveStyles.icon_use_original_color === true;
    // Mock logic for icon
    const iconUrl =
      (field.field_config as any)?.selected_icon ||
      (field.field_config as any)?.icon_options?.[0];

    return (
      <div
        style={{
          ...fieldStyles,
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
      >
        {iconUrl ? (
          <SmartIcon
            src={iconUrl}
            style={{ width: `${iconSize}px` }}
            color={useOriginalColor ? undefined : fieldStyles.color}
            preserveOriginalColors={useOriginalColor}
          />
        ) : (
          <span style={{ fontSize: `${iconSize}px` }}>📄</span>
        )}
        <span>
          {field.label ? `${field.label}: ` : ""}
          {renderTextContent()}
        </span>
      </div>
    );
  }

  if (field.type === "image" || field.type === "image_upload") {
    return (
      <div
        style={{
          ...fieldStyles,
          minHeight: "100px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f3f4f6",
          border: "1px dashed #ccc",
        }}
      >
        <span className="text-gray-400 text-xs">Image Preview</span>
      </div>
    );
  }

  // Default fallback
  return (
    <div style={fieldStyles} className="opacity-70">
      {field.display_name} ({field.type})
    </div>
  );
};
