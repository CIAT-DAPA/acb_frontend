"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { StyleConfig } from "@/types/core";
import { VisualResourcesService } from "@/services/visualResourcesService";
import { VisualResource } from "@/types/visualResource";
import { Loader2, X, Image as ImageIcon } from "lucide-react";
import Image from "next/image";

// Fuentes disponibles
const AVAILABLE_FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Georgia",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
];

// Opciones de peso de fuente
const FONT_WEIGHT_OPTIONS = [
  { value: "100", label: "Thin (100)" },
  { value: "200", label: "Extra Light (200)" },
  { value: "300", label: "Light (300)" },
  { value: "400", label: "Normal (400)" },
  { value: "500", label: "Medium (500)" },
  { value: "600", label: "Semi Bold (600)" },
  { value: "700", label: "Bold (700)" },
  { value: "800", label: "Extra Bold (800)" },
  { value: "900", label: "Black (900)" },
];

// Opciones de decoración de texto
const TEXT_DECORATION_OPTIONS = [
  { value: "none", label: "Ninguna" },
  { value: "underline", label: "Subrayado" },
  { value: "line-through", label: "Tachado" },
];

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

    // Configuración de espacios y bordes
    padding?: boolean;
    margin?: boolean;
    gap?: boolean;
    borderWidth?: boolean;
    borderRadius?: boolean;

    // Configuración de dimensiones (solo para estilos globales)
    bulletinWidth?: boolean;
    bulletinHeight?: boolean;

    // Layout específico
    fieldsLayout?: boolean;
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

  // Estado para las visual resources
  const [visualResources, setVisualResources] = useState<VisualResource[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [showImageSelector, setShowImageSelector] = useState(false);

  // Cargar visual resources cuando se habilita backgroundImage
  useEffect(() => {
    if (enabledFields.backgroundImage) {
      loadVisualResources();
    }
  }, [enabledFields.backgroundImage]);

  const loadVisualResources = async () => {
    setLoadingResources(true);
    try {
      const response = await VisualResourcesService.getAllVisualResources();
      if (response.success && response.data) {
        // Filtrar solo imágenes para usar como fondo
        const images = response.data.filter(
          (resource) => resource.file_type === "image"
        );
        setVisualResources(images);
      }
    } catch (error) {
      console.error("Error loading visual resources:", error);
    } finally {
      setLoadingResources(false);
    }
  };

  // Helper para construir URL completa de imagen
  const getBackgroundImageUrl = (imageUrl: string) => {
    // Si ya es una URL completa, devolverla tal como está
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // Si es una ruta relativa, construir URL completa
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const cleanUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${baseUrl}${cleanUrl}`;
  };

  const renderColorField = (
    key: keyof StyleConfig,
    label: string,
    placeholder: string = "#000000"
  ) => (
    <div>
      <label className="block text-sm font-medium text-[#283618]/70 mb-2">
        {label}
      </label>
      <div className="flex space-x-2">
        <input
          type="color"
          value={(styleConfig[key] as string) || placeholder}
          onChange={(e) => onStyleChange({ [key]: e.target.value })}
          className="block w-16 h-10 border border-gray-300 rounded-md cursor-pointer"
        />
        <input
          type="text"
          value={(styleConfig[key] as string) || placeholder}
          onChange={(e) => onStyleChange({ [key]: e.target.value })}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder={placeholder}
        />
      </div>
      {inheritedStyles?.[key] && (
        <p className="text-xs text-[#283618]/50 mt-1">
          Heredado: {inheritedStyles[key]}
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
      <label className="block text-sm font-medium text-[#283618]/70 mb-2">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        value={(styleConfig[key] as number) || ""}
        onChange={(e) =>
          onStyleChange({ [key]: parseInt(e.target.value) || undefined })
        }
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder?.toString()}
      />
      {inheritedStyles?.[key] && (
        <p className="text-xs text-[#283618]/50 mt-1">
          Heredado: {inheritedStyles[key]}
        </p>
      )}
    </div>
  );

  const renderBackgroundImageField = () => (
    <div>
      <label className="block text-sm font-medium text-[#283618]/70 mb-2">
        {getLabel("backgroundImage", "Imagen de Fondo")}
      </label>

      {/* Preview actual */}
      <div className="mb-3">
        {styleConfig.background_image ? (
          <div className="relative w-full h-20 bg-gray-100 rounded-md overflow-hidden border">
            <Image
              src={styleConfig.background_image}
              alt="Background preview"
              fill
              className="object-contain"
              onError={(e) => {
                e.currentTarget.src = "/assets/img/imageNotFound.png";
              }}
            />
            <button
              onClick={() => onStyleChange({ background_image: undefined })}
              className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              title="Quitar imagen"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <div className="w-full h-20 bg-gray-100 rounded-md border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-500">
            <ImageIcon className="h-6 w-6 mr-2" />
            <span className="text-sm">Sin imagen de fondo</span>
          </div>
        )}
      </div>

      {/* Botón para abrir selector */}
      <button
        type="button"
        onClick={() => setShowImageSelector(true)}
        className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        {loadingResources ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
            Cargando imágenes...
          </>
        ) : (
          <>
            <ImageIcon className="h-4 w-4 inline mr-2" />
            {styleConfig.background_image
              ? "Cambiar imagen"
              : "Seleccionar imagen"}
          </>
        )}
      </button>

      {/* Modal selector de imágenes */}
      {showImageSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">
                Seleccionar Imagen de Fondo
              </h3>
              <button
                onClick={() => setShowImageSelector(false)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {loadingResources ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  <span className="ml-2">Cargando imágenes...</span>
                </div>
              ) : visualResources.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {visualResources.map((resource) => (
                    <div
                      key={resource.id}
                      className="cursor-pointer group"
                      onClick={() => {
                        console.log(
                          "Selecting background image:",
                          resource.file_url
                        );
                        console.log("Resource details:", resource);
                        onStyleChange({ background_image: resource.file_url });
                        setShowImageSelector(false);
                      }}
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-transparent group-hover:border-blue-500 transition-colors">
                        <Image
                          src={resource.file_url}
                          alt={resource.file_name}
                          width={150}
                          height={150}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src =
                              "/assets/img/imageNotFound.png";
                          }}
                        />
                      </div>
                      <p className="text-xs text-center mt-1 truncate">
                        {resource.file_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No hay imágenes disponibles</p>
                  <p className="text-sm">
                    Sube imágenes en la sección de Recursos Visuales
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {inheritedStyles?.background_image && (
        <p className="text-xs text-[#283618]/50 mt-1">
          Heredado: {inheritedStyles.background_image}
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
      <label className="block text-sm font-medium text-[#283618]/70 mb-2">
        {label}
      </label>
      <input
        type="text"
        value={(styleConfig[key] as string) || ""}
        onChange={(e) => onStyleChange({ [key]: e.target.value || undefined })}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
      />
      {inheritedStyles?.[key] && (
        <p className="text-xs text-[#283618]/50 mt-1">
          Heredado: {inheritedStyles[key]}
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
      <label className="block text-sm font-medium text-[#283618]/70 mb-2">
        {label}
      </label>
      <select
        value={(styleConfig[key] as string) || defaultValue || ""}
        onChange={(e) => onStyleChange({ [key]: e.target.value || undefined })}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {inheritedStyles?.[key] && (
        <p className="text-xs text-[#283618]/50 mt-1">
          Heredado: {inheritedStyles[key]}
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
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {getLabel("font", "Fuente")}
            </label>
            <select
              value={styleConfig.font || "Arial"}
              onChange={(e) => onStyleChange({ font: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {AVAILABLE_FONTS.map((font) => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
            {inheritedStyles?.font && (
              <p className="text-xs text-[#283618]/50 mt-1">
                Heredado: {inheritedStyles.font}
              </p>
            )}
          </div>
        )}

        {/* Colores */}
        {enabledFields.primaryColor &&
          renderColorField(
            "primary_color",
            getLabel("color", "Color Primario"),
            "#000000"
          )}

        {enabledFields.secondaryColor &&
          renderColorField(
            "secondary_color",
            getLabel("secondaryColor", "Color Secundario"),
            "#666666"
          )}

        {enabledFields.backgroundColor &&
          renderColorField(
            "background_color",
            getLabel("backgroundColor", "Color de Fondo"),
            "#ffffff"
          )}

        {enabledFields.backgroundImage && renderBackgroundImageField()}

        {enabledFields.borderColor &&
          renderColorField(
            "border_color",
            getLabel("borderColor", "Color del Borde"),
            "#000000"
          )}

        {/* Configuración de texto */}
        {enabledFields.fontSize &&
          renderNumberField(
            "font_size",
            getLabel("fontSize", "Tamaño de Fuente (px)"),
            8,
            72,
            16
          )}

        {enabledFields.fontWeight && (
          <div>
            <label className="block text-sm font-medium text-[#283618]/70 mb-2">
              {getLabel("fontWeight", "Grosor del Texto")}
            </label>
            <select
              value={styleConfig.font_weight || "400"}
              onChange={(e) => onStyleChange({ font_weight: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {FONT_WEIGHT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {inheritedStyles?.font_weight && (
              <p className="text-xs text-[#283618]/50 mt-1">
                Heredado: {inheritedStyles.font_weight}
              </p>
            )}
          </div>
        )}

        {enabledFields.fontStyle &&
          renderSelectField(
            "font_style",
            getLabel("fontStyle", "Estilo del Texto"),
            [
              { value: "normal", label: "Normal" },
              { value: "italic", label: "Cursiva" },
            ],
            "normal"
          )}

        {enabledFields.textDecoration &&
          renderSelectField(
            "text_decoration",
            getLabel("textDecoration", "Decoración del Texto"),
            TEXT_DECORATION_OPTIONS,
            "none"
          )}

        {enabledFields.textAlign &&
          renderSelectField(
            "text_align",
            getLabel("textAlign", "Alineación del Texto"),
            [
              {
                value: "left",
                label: getLabel("alignOptions.left", "Izquierda"),
              },
              {
                value: "center",
                label: getLabel("alignOptions.center", "Centro"),
              },
              {
                value: "right",
                label: getLabel("alignOptions.right", "Derecha"),
              },
            ],
            "left"
          )}

        {/* Espaciado y bordes */}
        {enabledFields.padding &&
          renderTextField(
            "padding",
            getLabel("padding", "Padding (CSS)"),
            "16px"
          )}

        {enabledFields.margin &&
          renderTextField("margin", getLabel("margin", "Margin (CSS)"), "8px")}

        {enabledFields.gap &&
          renderTextField(
            "gap",
            getLabel("gap", "Espaciado entre Campos"),
            "8px"
          )}

        {enabledFields.borderWidth &&
          renderTextField(
            "border_width",
            getLabel("borderWidth", "Grosor del Borde"),
            "1px"
          )}

        {enabledFields.borderRadius &&
          renderTextField(
            "border_radius",
            getLabel("borderRadius", "Redondeado"),
            "4px"
          )}

        {/* Dimensiones del boletín (solo para estilos globales) */}
        {enabledFields.bulletinWidth &&
          renderNumberField(
            "bulletin_width",
            "Ancho del Boletín (px)",
            200,
            1200,
            366
          )}

        {enabledFields.bulletinHeight &&
          renderNumberField(
            "bulletin_height",
            "Alto del Boletín (px)",
            200,
            1200,
            638
          )}

        {/* Layout de campos */}
        {enabledFields.fieldsLayout &&
          renderSelectField(
            "fields_layout",
            "Organización de Campos",
            [
              { value: "horizontal", label: "Horizontal (lado a lado)" },
              { value: "vertical", label: "Vertical (uno debajo del otro)" },
            ],
            "vertical"
          )}
      </div>

      {/* Vista Previa */}
      {showPreview && (
        <div className="mt-6">
          <h4 className="text-md font-medium text-[#283618] mb-3">
            Vista Previa
          </h4>
          <div
            className="p-6 border rounded-lg"
            style={{
              fontFamily: styleConfig.font || "Arial",
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
              style={{ color: styleConfig.primary_color }}
            >
              Título Principal
            </h4>
            <h5
              className="text-lg font-semibold mb-2"
              style={{ color: styleConfig.secondary_color }}
            >
              Subtítulo de Ejemplo
            </h5>
            <p className="mb-2">
              Este es un texto de ejemplo que muestra cómo se verán los estilos
              aplicados.
            </p>
            <p
              className="text-sm"
              style={{ color: styleConfig.secondary_color }}
            >
              Texto pequeño para detalles adicionales.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default StyleConfigurator;
