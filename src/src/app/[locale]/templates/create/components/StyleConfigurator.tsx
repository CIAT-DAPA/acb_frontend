"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { StyleConfig } from "@/types/core";
import { Image as ImageIcon, X } from "lucide-react";
import Image from "next/image";
import { VisualResourceSelector } from "./VisualResourceSelector";

// Fuentes disponibles
const AVAILABLE_FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Poppins",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Archivo Narrow",
];

// Mapeo de fuentes a variables CSS de Next.js
const FONT_CSS_VARS: Record<string, string> = {
  Poppins: "var(--font-poppins)",
  Roboto: "var(--font-roboto)",
  "Open Sans": "var(--font-open-sans)",
  Lato: "var(--font-lato)",
  Montserrat: "var(--font-montserrat)",
  "Archivo Narrow": "var(--font-archivo-narrow)",
  Arial: "Arial, sans-serif",
  Helvetica: "Helvetica, sans-serif",
  "Times New Roman": "'Times New Roman', serif",
  Georgia: "Georgia, serif",
};

export interface StyleConfiguratorProps {
  styleConfig: StyleConfig;
  onStyleChange: (updates: Partial<StyleConfig>) => void;
  enabledFields?: {
    // Configuración de colores
    primaryColor?: boolean;
    secondaryColor?: boolean;
    backgroundColor?: boolean;
    backgroundImage?: boolean;
    borderColor?: boolean;

    // Configuración de texto
    font?: boolean;
    fontSize?: boolean;
    fontWeight?: boolean;
    fontStyle?: boolean;
    textDecoration?: boolean;
    textAlign?: boolean;

    // Configuración de iconos
    iconSize?: boolean;
    iconUseOriginalColor?: boolean;

    // Configuración de espacios y bordes
    padding?: boolean;
    margin?: boolean;
    gap?: boolean;
    borderWidth?: boolean;
    borderRadius?: boolean;
    borderSides?: boolean; // Control de qué lados del borde mostrar

    // Configuración de dimensiones (solo para estilos globales)
    bulletinWidth?: boolean;
    bulletinHeight?: boolean;

    // Layout específico
    fieldsLayout?: boolean;
    justifyContent?: boolean; // Distribución de campos (justify-content)
    listStyleType?: boolean; // Estilo de bullet points para listas
    listItemsLayout?: boolean; // Layout de items dentro de la lista
  };
  title?: string;
  description?: string;
  showPreview?: boolean;
  inheritedStyles?: StyleConfig; // Para mostrar estilos heredados
  isFieldStyle?: boolean; // Si es estilo de campo individual
}

export function StyleConfigurator({
  styleConfig,
  onStyleChange,
  enabledFields = {},
  title,
  description,
  showPreview = false,
  inheritedStyles,
  isFieldStyle = false,
}: StyleConfiguratorProps) {
  const t = useTranslations(
    isFieldStyle
      ? "CreateTemplate.fieldEditor.styleConfig"
      : "CreateTemplate.generalConfig.styles"
  );
  const tGlobal = useTranslations("CreateTemplate.headerFooter.globalStyles");

  // Usar el namespace adecuado según el contexto
  const getLabel = (key: string, fallback: string = key) => {
    if (isFieldStyle) {
      return t(key);
    } else {
      return tGlobal(key);
    }
  };

  // Estado para el selector de recursos visuales
  const [showImageSelector, setShowImageSelector] = useState(false);

  // Constantes reutilizables
  const IMAGE_FALLBACK = "/assets/img/imageNotFound.png";
  const INPUT_BASE_CLASS =
    "block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
  const LABEL_CLASS = "block text-sm font-medium text-[#283618]/70 mb-2";
  const INHERITED_TEXT_CLASS = "text-xs text-[#283618]/50 mt-1";

  // Helper para construir URL completa de imagen
  const getBackgroundImageUrl = (imageUrl: string) => {
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const cleanUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${baseUrl}${cleanUrl}`;
  };

  // Helper para manejar cambios en border_sides
  const handleBorderSideChange = (side: string, checked: boolean) => {
    const currentSides = styleConfig.border_sides || "all";

    if (currentSides === "all") {
      const otherSides = ["top", "bottom", "left", "right"].filter(
        (s) => s !== side
      );
      onStyleChange({ border_sides: checked ? "all" : otherSides.join(",") });
      return;
    }

    const sides = currentSides
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    if (checked) {
      if (!sides.includes(side)) sides.push(side);
    } else {
      const index = sides.indexOf(side);
      if (index > -1) sides.splice(index, 1);
    }

    const hasAll = ["top", "bottom", "left", "right"].every((s) =>
      sides.includes(s)
    );

    if (hasAll && sides.length === 4) {
      onStyleChange({ border_sides: "all" });
    } else if (sides.length > 0) {
      onStyleChange({ border_sides: sides.join(",") });
    } else {
      onStyleChange({ border_sides: undefined });
    }
  };

  // Helper para verificar si un lado del borde está activo
  const isBorderSideActive = (side: string) => {
    return (
      !styleConfig.border_sides ||
      styleConfig.border_sides === "all" ||
      styleConfig.border_sides.includes(side)
    );
  };

  const renderColorField = (
    key: keyof StyleConfig,
    label: string,
    placeholder: string = "#000000"
  ) => (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={(styleConfig[key] as string) || placeholder}
          onChange={(e) => onStyleChange({ [key]: e.target.value })}
          className="block w-12 h-12 min-w-[48px] border border-gray-300 rounded-md cursor-pointer flex-shrink-0"
          title={t("colorPickerTitle")}
        />
        <input
          type="text"
          value={(styleConfig[key] as string) || placeholder}
          onChange={(e) => onStyleChange({ [key]: e.target.value })}
          className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
      </div>
      {inheritedStyles?.[key] && (
        <p className={INHERITED_TEXT_CLASS}>
          {t("inherited")}: {inheritedStyles[key]}
        </p>
      )}
    </div>
  );

  const renderNumberField = (
    key: keyof StyleConfig,
    label: string,
    min: number,
    max: number,
    placeholder?: string | number
  ) => (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        type="number"
        min={min}
        max={max}
        value={(styleConfig[key] as number) || ""}
        onChange={(e) =>
          onStyleChange({ [key]: parseInt(e.target.value) || undefined })
        }
        className={INPUT_BASE_CLASS}
        placeholder={placeholder?.toString()}
      />
      {inheritedStyles?.[key] && (
        <p className={INHERITED_TEXT_CLASS}>
          {t("inherited")}: {inheritedStyles[key]}
        </p>
      )}
    </div>
  );

  const renderBackgroundImageField = () => (
    <div>
      <label className="block text-sm font-medium text-[#283618]/70 mb-2">
        {getLabel("backgroundImage")}
      </label>

      {/* Preview actual */}
      <div className="mb-3">
        {styleConfig.background_image ? (
          <div className="relative w-full h-20 bg-gray-100 rounded-md overflow-hidden border">
            <Image
              src={styleConfig.background_image}
              alt={t("backgroundImagePreviewAlt")}
              fill
              className="object-contain"
              onError={(e) => {
                e.currentTarget.src = IMAGE_FALLBACK;
              }}
            />
            <button
              onClick={() => onStyleChange({ background_image: undefined })}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title={t("removeImage")}
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-full h-20 bg-gray-100 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
            <ImageIcon className="h-6 w-6 mr-2" />
            <span className="text-sm">{t("noBackgroundImage")}</span>
          </div>
        )}
      </div>

      {/* Botón para abrir selector */}
      <button
        type="button"
        onClick={() => setShowImageSelector(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        <ImageIcon className="h-4 w-4 inline mr-2" />
        {styleConfig.background_image ? t("changeImage") : t("selectImage")}
      </button>

      {/* Modal selector de imágenes */}
      <VisualResourceSelector
        isOpen={showImageSelector}
        onClose={() => setShowImageSelector(false)}
        onSelect={(url) => onStyleChange({ background_image: url })}
        title={t("selectBackgroundImageTitle")}
        resourceType="image"
        selectedUrl={styleConfig.background_image}
      />

      {inheritedStyles?.background_image && (
        <p className={INHERITED_TEXT_CLASS}>
          {t("inherited")}: {inheritedStyles.background_image}
        </p>
      )}
    </div>
  );

  const renderTextField = (
    key: keyof StyleConfig,
    label: string,
    placeholder?: string
  ) => (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <input
        type="text"
        value={(styleConfig[key] as string) || ""}
        onChange={(e) => onStyleChange({ [key]: e.target.value || undefined })}
        className={INPUT_BASE_CLASS}
        placeholder={placeholder}
      />
      {inheritedStyles?.[key] && (
        <p className={INHERITED_TEXT_CLASS}>
          {t("inherited")}: {inheritedStyles[key]}
        </p>
      )}
    </div>
  );

  const renderSelectField = (
    key: keyof StyleConfig,
    label: string,
    options: { value: string; label: string }[],
    defaultValue?: string
  ) => (
    <div>
      <label className={LABEL_CLASS}>{label}</label>
      <select
        value={(styleConfig[key] as string) || defaultValue || ""}
        onChange={(e) => onStyleChange({ [key]: e.target.value || undefined })}
        className={INPUT_BASE_CLASS}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {inheritedStyles?.[key] && (
        <p className={INHERITED_TEXT_CLASS}>
          {t("inherited")}: {inheritedStyles[key]}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Título y descripción */}
      {title && (
        <div>
          <h3 className="text-lg font-medium text-[#283618] mb-2">{title}</h3>
          {description && (
            <p className="text-sm text-[#283618]/70">{description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Configuración de Fuente */}
        {enabledFields.font && (
          <div>
            <label className={LABEL_CLASS}>{getLabel("font")}</label>
            <select
              value={styleConfig.font || "Arial"}
              onChange={(e) => onStyleChange({ font: e.target.value })}
              className={INPUT_BASE_CLASS}
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
            {inheritedStyles?.font && (
              <p className={INHERITED_TEXT_CLASS}>
                {t("inherited")}: {inheritedStyles.font}
              </p>
            )}
          </div>
        )}

        {/* Colores */}
        {enabledFields.primaryColor &&
          renderColorField("primary_color", getLabel("color"), "#000000")}

        {enabledFields.secondaryColor &&
          renderColorField(
            "secondary_color",
            getLabel("secondaryColor"),
            "#666666"
          )}

        {enabledFields.backgroundColor &&
          renderColorField(
            "background_color",
            getLabel("backgroundColor"),
            "#ffffff"
          )}

        {enabledFields.backgroundImage && renderBackgroundImageField()}

        {enabledFields.borderColor &&
          renderColorField("border_color", getLabel("borderColor"), "#000000")}

        {/* Configuración de texto */}
        {enabledFields.fontSize &&
          renderNumberField("font_size", getLabel("fontSize"), 8, 72, 16)}

        {enabledFields.iconSize &&
          renderNumberField("icon_size", getLabel("iconSize"), 8, 128, 24)}

        {enabledFields.iconUseOriginalColor && (
          <div>
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={styleConfig.icon_use_original_color || false}
                onChange={(e) =>
                  onStyleChange({ icon_use_original_color: e.target.checked })
                }
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
              />
              {getLabel("iconUseOriginalColor")}
            </label>
            <p className="text-xs text-[#283618]/50 mt-1">
              {getLabel("iconUseOriginalColorHelp")}
            </p>
            {inheritedStyles?.icon_use_original_color !== undefined && (
              <p className={INHERITED_TEXT_CLASS}>
                {t("inherited")}:{" "}
                {inheritedStyles.icon_use_original_color ? "Sí" : "No"}
              </p>
            )}
          </div>
        )}

        {enabledFields.fontWeight && (
          <div>
            <label className={LABEL_CLASS}>{getLabel("fontWeight")}</label>
            <select
              value={styleConfig.font_weight || "400"}
              onChange={(e) => onStyleChange({ font_weight: e.target.value })}
              className={INPUT_BASE_CLASS}
            >
              <option value="100">{t("fontWeightOptions.thin")}</option>
              <option value="200">{t("fontWeightOptions.extraLight")}</option>
              <option value="300">{t("fontWeightOptions.light")}</option>
              <option value="400">{t("fontWeightOptions.normal")}</option>
              <option value="500">{t("fontWeightOptions.medium")}</option>
              <option value="600">{t("fontWeightOptions.semiBold")}</option>
              <option value="700">{t("fontWeightOptions.bold")}</option>
              <option value="800">{t("fontWeightOptions.extraBold")}</option>
              <option value="900">{t("fontWeightOptions.black")}</option>
            </select>
            {inheritedStyles?.font_weight && (
              <p className={INHERITED_TEXT_CLASS}>
                {t("inherited")}: {inheritedStyles.font_weight}
              </p>
            )}
          </div>
        )}

        {enabledFields.fontStyle &&
          renderSelectField(
            "font_style",
            getLabel("fontStyle"),
            [
              { value: "normal", label: t("fontStyleOptions.normal") },
              { value: "italic", label: t("fontStyleOptions.italic") },
            ],
            "normal"
          )}

        {enabledFields.textDecoration &&
          renderSelectField(
            "text_decoration",
            getLabel("textDecoration"),
            [
              { value: "none", label: t("textDecorationOptions.none") },
              {
                value: "underline",
                label: t("textDecorationOptions.underline"),
              },
              {
                value: "line-through",
                label: t("textDecorationOptions.lineThrough"),
              },
            ],
            "none"
          )}

        {enabledFields.textAlign &&
          renderSelectField(
            "text_align",
            getLabel("textAlign"),
            [
              { value: "left", label: t("alignOptions.left") },
              { value: "center", label: t("alignOptions.center") },
              { value: "right", label: t("alignOptions.right") },
            ],
            "left"
          )}

        {/* Espaciado y bordes */}
        {enabledFields.padding &&
          renderTextField("padding", getLabel("padding"), "16px")}

        {enabledFields.margin &&
          renderTextField("margin", getLabel("margin"), "8px")}

        {enabledFields.gap && renderTextField("gap", getLabel("gap"), "8px")}

        {enabledFields.borderWidth &&
          renderTextField("border_width", getLabel("borderWidth"), "1px")}

        {enabledFields.borderRadius &&
          renderTextField("border_radius", getLabel("borderRadius"), "4px")}

        {/* Lados del borde */}
        {enabledFields.borderSides && (
          <div>
            <label className={LABEL_CLASS}>{getLabel("borderSides")}</label>
            <div className="space-y-2">
              {/* Checkboxes para cada lado */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { side: "top", label: getLabel("borderTop") },
                  { side: "bottom", label: getLabel("borderBottom") },
                  { side: "left", label: getLabel("borderLeft") },
                  { side: "right", label: getLabel("borderRight") },
                ].map(({ side, label }) => (
                  <label key={side} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={isBorderSideActive(side)}
                      onChange={(e) =>
                        handleBorderSideChange(side, e.target.checked)
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <p className="text-xs text-[#283618]/50 mt-1">
              {getLabel("borderSidesHelp")}
            </p>
            {inheritedStyles?.border_sides && (
              <p className={INHERITED_TEXT_CLASS}>
                {t("inherited")}: {inheritedStyles.border_sides}
              </p>
            )}
          </div>
        )}

        {/* Dimensiones del boletín (solo para estilos globales) */}
        {enabledFields.bulletinWidth &&
          renderNumberField(
            "bulletin_width",
            t("bulletinWidth"),
            200,
            1200,
            366
          )}

        {enabledFields.bulletinHeight &&
          renderNumberField(
            "bulletin_height",
            t("bulletinHeight"),
            200,
            1200,
            638
          )}

        {/* Layout de campos */}
        {enabledFields.fieldsLayout &&
          renderSelectField(
            "fields_layout",
            t("fieldsLayout"),
            [
              { value: "horizontal", label: t("layoutOptions.horizontal") },
              { value: "vertical", label: t("layoutOptions.vertical") },
            ],
            "vertical"
          )}

        {/* Distribución de campos (justify-content) */}
        {enabledFields.justifyContent &&
          renderSelectField(
            "justify_content",
            t("justifyContent"),
            [
              { value: "start", label: t("justifyOptions.start") },
              { value: "end", label: t("justifyOptions.end") },
              { value: "center", label: t("justifyOptions.center") },
              { value: "between", label: t("justifyOptions.between") },
              { value: "around", label: t("justifyOptions.around") },
              { value: "evenly", label: t("justifyOptions.evenly") },
            ],
            "start"
          )}

        {/* Estilo de lista */}
        {enabledFields.listStyleType &&
          renderSelectField(
            "list_style_type",
            t("listStyleType"),
            [
              { value: "disc", label: t("listStyleOptions.disc") },
              { value: "circle", label: t("listStyleOptions.circle") },
              { value: "square", label: t("listStyleOptions.square") },
              { value: "decimal", label: t("listStyleOptions.decimal") },
              { value: "none", label: t("listStyleOptions.none") },
            ],
            "disc"
          )}

        {/* Layout de items de lista */}
        {enabledFields.listItemsLayout &&
          renderSelectField(
            "list_items_layout",
            t("listItemsLayout"),
            [
              { value: "vertical", label: t("listLayoutOptions.vertical") },
              { value: "horizontal", label: t("listLayoutOptions.horizontal") },
              { value: "grid-2", label: t("listLayoutOptions.grid2") },
              { value: "grid-3", label: t("listLayoutOptions.grid3") },
            ],
            "vertical"
          )}
      </div>

      {/* Vista Previa */}
      {showPreview && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-[#283618] mb-3">
            {t("previewTitle")}
          </h4>
          <div
            className="p-6 border rounded-lg"
            style={{
              fontFamily: styleConfig.font
                ? FONT_CSS_VARS[styleConfig.font] || styleConfig.font
                : "Arial",
              color: styleConfig.primary_color || "#000000",
              backgroundColor: styleConfig.background_color || "#ffffff",
              backgroundImage: styleConfig.background_image
                ? `url("${getBackgroundImageUrl(
                    styleConfig.background_image
                  )}")`
                : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              fontSize: styleConfig.font_size
                ? `${styleConfig.font_size}px`
                : "16px",
              fontWeight: styleConfig.font_weight || "400",
              fontStyle: styleConfig.font_style || "normal",
              textDecoration: styleConfig.text_decoration || "none",
              textAlign:
                (styleConfig.text_align as "left" | "center" | "right") ||
                "left",
              padding: styleConfig.padding || "24px",
              ...(styleConfig.border_width && {
                border: `${styleConfig.border_width} solid ${
                  styleConfig.border_color || "#000000"
                }`,
                borderRadius: styleConfig.border_radius || "4px",
              }),
            }}
          >
            <h4
              className="text-xl font-bold mb-2"
              style={{
                color: styleConfig.primary_color,
                fontFamily: styleConfig.font
                  ? FONT_CSS_VARS[styleConfig.font] || styleConfig.font
                  : "Arial",
              }}
            >
              {t("previewMainTitle")}
            </h4>
            <h5
              className="text-lg font-semibold mb-2"
              style={{
                color: styleConfig.secondary_color,
                fontFamily: styleConfig.font
                  ? FONT_CSS_VARS[styleConfig.font] || styleConfig.font
                  : "Arial",
              }}
            >
              {t("previewSubtitle")}
            </h5>
            <p className="mb-2">{t("previewText")}</p>
            <p
              className="text-sm"
              style={{ color: styleConfig.secondary_color }}
            >
              {t("previewSmallText")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StyleConfigurator;
