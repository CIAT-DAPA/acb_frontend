"use client";

import React, { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import {
  CreateTemplateData,
  Field,
  Section,
  Block,
} from "../../../../types/template";
import { StyleConfig } from "../../../../types/core";
import { getEffectiveFieldStyles } from "../../../../utils/styleInheritance";
import { SmartIcon } from "../../components/AdaptiveSvgIcon";
import { Card } from "../../../../types/card";
import { CardAPIService } from "../../../../services/cardService";

/**
 * Helper function para generar estilos de borde según los lados seleccionados
 */
function getBorderStyles(
  styleConfig: StyleConfig | undefined
): React.CSSProperties {
  const styles: React.CSSProperties = {};

  if (!styleConfig?.border_width) {
    // Si hay border_radius sin border_width, aplicarlo igual
    if (styleConfig?.border_radius) {
      styles.borderRadius = styleConfig.border_radius;
    }
    return styles;
  }

  const borderValue = `${styleConfig.border_width} ${
    styleConfig.border_style || "solid"
  } ${styleConfig.border_color || "#000000"}`;
  const borderSides = styleConfig.border_sides || "all";

  if (borderSides === "all") {
    styles.border = borderValue;
  } else {
    // Aplicar bordes individuales según los lados seleccionados
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

interface TemplatePreviewProps {
  data: CreateTemplateData;
  selectedSectionIndex?: number;
  moreInfo?: boolean;
  description?: boolean;
  forceGlobalHeader?: boolean; // Forzar uso del header global en lugar del header de sección
}

export function TemplatePreview({
  data,
  selectedSectionIndex = 0,
  moreInfo = false,
  description = false,
  forceGlobalHeader = false,
}: TemplatePreviewProps) {
  const t = useTranslations("CreateTemplate.preview");
  const pathname = usePathname();
  const hookLocale = useLocale();

  // Extraer el locale actual del pathname como backup (igual que LanguageSelector)
  const pathnameLocale = pathname.split("/")[1];

  // Usar el locale del pathname si está disponible, sino el del hook
  const locale = ["es", "en"].includes(pathnameLocale)
    ? pathnameLocale
    : hookLocale;

  // Estado para almacenar las cards cargadas
  const [cardsCache, setCardsCache] = useState<Map<string, Card>>(new Map());

  // Estado para controlar la página actual (para paginación de listas)
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  // Cargar todas las cards necesarias
  useEffect(() => {
    const loadCards = async () => {
      try {
        const response = await CardAPIService.getCards();
        if (response.success && response.data) {
          const cache = new Map<string, Card>();
          response.data.forEach((card) => {
            if (card._id) {
              cache.set(card._id, card);
            }
          });
          setCardsCache(cache);
        }
      } catch (error) {
        console.error("Error loading cards:", error);
      }
    };

    loadCards();
  }, []);

  const styleConfig = data.version.content.style_config;
  const headerConfig = data.version.content.header_config;
  const footerConfig = data.version.content.footer_config;
  const sections = data.version.content.sections;

  // Estilos globales aplicados
  const globalStyles = {
    fontFamily: styleConfig?.font || "Arial",
    color: styleConfig?.primary_color || "#000000",
    fontSize: `${styleConfig?.font_size || 16}px`,
    backgroundColor: styleConfig?.background_color || "#ffffff",
    textAlign:
      (styleConfig?.text_align as "left" | "center" | "right") || "left",
  };

  // Helper para construir URL completa de imagen
  const getBackgroundImageUrl = (imageUrl: string) => {
    // Si ya es una URL completa, devolverla tal como está (codificada)
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      // Codificar espacios y caracteres especiales en la URL
      return imageUrl
        .split("/")
        .map((part, index) => {
          // No codificar el protocolo (http: o https:)
          if (index < 3) return part;
          return encodeURIComponent(part);
        })
        .join("/");
    }

    // Si es una ruta relativa, construir URL completa y codificar
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const cleanUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

    // Codificar cada parte del path (excepto las barras)
    const encodedPath = cleanUrl
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");

    return `${baseUrl}${encodedPath}`;
  };

  // Helper function to format dates according to field configuration
  const formatDateValue = (date: Date | string, format: string): string => {
    let dateObj: Date;

    if (typeof date === "string") {
      // Si la fecha viene en formato YYYY-MM-DD (del input date),
      // parsearlo como fecha local para evitar problemas de zona horaria
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const [year, month, day] = date.split("-").map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        dateObj = new Date(date);
      }
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) {
      return "Fecha inválida";
    }

    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getFullYear();

    // Usar el locale actual para el nombre del día
    const localeCode = locale === "es" ? "es-ES" : "en-US";
    const dayName = dateObj.toLocaleDateString(localeCode, { weekday: "long" });
    const dayNameCapitalized =
      dayName.charAt(0).toUpperCase() + dayName.slice(1);

    switch (format) {
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "DD-MM-YYYY":
        return `${day}-${month}-${year}`;
      case "dddd, DD - MM":
        return `${dayNameCapitalized}, ${day} - ${month}`;
      case "YYYY-MM-DD":
      default:
        return `${year}-${month}-${day}`;
    }
  };

  // Helper function to render field values safely
  const renderFieldValue = (value: Field["value"], field?: Field): string => {
    if (!value) return "";
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }
    if (value instanceof Date) {
      // Si es un campo de fecha y tiene configuración de formato, usarla
      if (field?.type === "date" && field.field_config?.date_format) {
        return formatDateValue(value, field.field_config.date_format);
      }
      const localeCode = locale === "es" ? "es-ES" : "en-US";
      return value.toLocaleDateString(localeCode);
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return "";
  };

  const renderField = (
    field: Field,
    key: string | number,
    containerStyle?: StyleConfig,
    layout: "vertical" | "horizontal" = "vertical"
  ) => {
    // Usar herencia de estilos
    const effectiveStyles = getEffectiveFieldStyles(field, containerStyle);

    const fieldStyles = {
      ...globalStyles,
      color: effectiveStyles.primary_color || globalStyles.color,
      fontSize: effectiveStyles.font_size
        ? `${effectiveStyles.font_size}px`
        : globalStyles.fontSize,
      fontWeight: effectiveStyles.font_weight || "400",
      fontStyle: effectiveStyles.font_style || "normal",
      textDecoration: effectiveStyles.text_decoration || "none",
      textAlign:
        (effectiveStyles.text_align as "left" | "center" | "right") ||
        globalStyles.textAlign,
      backgroundColor: effectiveStyles.background_color || "transparent",
      backgroundImage: effectiveStyles.background_image
        ? `url("${getBackgroundImageUrl(effectiveStyles.background_image)}")`
        : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      padding: effectiveStyles.padding,
      margin: effectiveStyles.margin,
      gap: effectiveStyles.gap,
      ...getBorderStyles(effectiveStyles),
    };

    switch (field.type) {
      case "text":
        // Mostrar el valor si existe, sino mostrar placeholder
        const textValue = field.value
          ? renderFieldValue(field.value)
          : field.display_name || field.label || "Campo de texto";

        return (
          <div key={key} style={fieldStyles}>
            {textValue}
          </div>
        );

      case "text_with_icon":
        // Verificar si el valor existe y no está vacío
        const hasValue =
          field.value !== null &&
          field.value !== undefined &&
          field.value !== "";
        const textWithIconValue = hasValue
          ? renderFieldValue(field.value)
          : field.label || "Texto con icono";

        // Obtener el icono seleccionado o el primer icono disponible como fallback
        const selectedIcon =
          (field.field_config as any)?.selected_icon ||
          (field.field_config?.icon_options &&
          field.field_config.icon_options.length > 0
            ? field.field_config.icon_options[0]
            : null);

        const iconSize = effectiveStyles.icon_size || 24;
        const useOriginalColor =
          effectiveStyles.icon_use_original_color === true;

        // Verificar si se debe mostrar el label
        const showTextLabel = (field.field_config as any)?.showLabel ?? true;

        // Si form=true y showLabel=true, mostrar "label: value"
        // Si form=false y showLabel=true, mostrar solo "label" antes del icono
        const displayLabel = showTextLabel
          ? field.label || field.display_name
          : null;

        return (
          <div
            key={key}
            style={fieldStyles}
            className="flex items-center gap-2"
          >
            {/* Icono - siempre se muestra (configurado desde el template) */}
            {selectedIcon ? (
              selectedIcon.startsWith("http") ||
              selectedIcon.startsWith("/") ? (
                <SmartIcon
                  src={selectedIcon}
                  style={{ width: `${iconSize}px` }}
                  color={useOriginalColor ? undefined : fieldStyles.color}
                  preserveOriginalColors={useOriginalColor}
                  alt="Icon"
                />
              ) : (
                <span style={{ fontSize: `${iconSize}px` }}>
                  {selectedIcon}
                </span>
              )
            ) : (
              <span style={{ fontSize: `${iconSize}px` }}>📄</span>
            )}

            {/* Label y valor */}
            {displayLabel && field.form ? (
              // Cuando form=true y showLabel=true: "label: value"
              <span>
                {displayLabel}: {textWithIconValue}
              </span>
            ) : (
              // Cuando form=false o showLabel=false
              <>
                {displayLabel && <span>{displayLabel}:</span>}
                <span>{textWithIconValue}</span>
              </>
            )}
          </div>
        );

      case "select_with_icons":
        // Mostrar el icono seleccionado si existe valor, sino mostrar placeholder
        let iconToShow = null;
        let labelToShow = null;

        const selectOptions = (field.field_config as any)?.options || [];
        const selectIconsUrl = (field.field_config as any)?.icons_url || [];

        if (field.value) {
          // Buscar el icono correspondiente al valor seleccionado
          const selectedIndex = selectOptions.findIndex(
            (opt: string) => opt === field.value
          );
          if (selectedIndex !== -1) {
            iconToShow = selectIconsUrl[selectedIndex] || null;
            labelToShow = selectOptions[selectedIndex];
          }
        } else {
          // Si no hay valor seleccionado, mostrar placeholder (primer icono)
          if (selectOptions.length > 0) {
            iconToShow = selectIconsUrl[0] || null;
            labelToShow = selectOptions[0];
          }
        }

        // Mapear text-align a justify-content
        const textAlign = effectiveStyles.text_align || "center";
        const justifyClass =
          textAlign === "left"
            ? "justify-start"
            : textAlign === "right"
            ? "justify-end"
            : "justify-center";

        const selectIconSize = effectiveStyles.icon_size || 32;
        const showLabel = (field.field_config as any)?.show_label !== false;
        const selectUseOriginalColor =
          effectiveStyles.icon_use_original_color === true;

        return (
          <div
            key={key}
            style={fieldStyles}
            className={`flex items-center gap-2 ${justifyClass}`}
          >
            {iconToShow ? (
              <SmartIcon
                src={iconToShow}
                style={{
                  width: `${selectIconSize}px`,
                  height: `${selectIconSize}px`,
                }}
                color={
                  selectUseOriginalColor
                    ? undefined
                    : effectiveStyles.primary_color || fieldStyles.color
                }
                preserveOriginalColors={selectUseOriginalColor}
                alt="Selected icon"
              />
            ) : (
              <span style={{ fontSize: `${selectIconSize}px` }}>❓</span>
            )}
            {showLabel && labelToShow && <span>{labelToShow}</span>}
          </div>
        );

      case "select_background":
        // Este campo no renderiza contenido visible, solo cambia el fondo de la sección
        // El fondo se aplica automáticamente a nivel de sección en el renderizado del contenedor
        return null;

      case "date":
        const dateFormat =
          (field.field_config as any)?.date_format || "DD/MM/YYYY";

        // Si no tiene valor, mostrar el patrón del formato
        const displayValue = field.value
          ? formatDateValue(field.value as Date | string, dateFormat)
          : dateFormat;

        return (
          <div key={key} style={fieldStyles}>
            {displayValue}
          </div>
        );

      case "date_range":
        const dateRangeFormat =
          (field.field_config as any)?.date_format || "DD/MM/YYYY";

        // Si el formato es DD-DD, MMMM YYYY, combinar en un solo formato
        const isRangeFormat = dateRangeFormat === "DD-DD, MMMM YYYY";

        if (isRangeFormat) {
          // Para formato de rango combinado: "15-26, Abril 2025"
          let rangeDisplay = "DD-DD, MMMM YYYY";

          if (
            field.value &&
            typeof field.value === "object" &&
            "start_date" in field.value &&
            "end_date" in field.value &&
            field.value.start_date &&
            field.value.end_date
          ) {
            // Parsear fechas como locales para evitar problemas de zona horaria
            const parseLocalDate = (dateStr: string | Date): Date => {
              if (typeof dateStr !== "string") return dateStr;
              if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
                const [year, month, day] = dateStr.split("-").map(Number);
                return new Date(year, month - 1, day);
              }
              return new Date(dateStr);
            };

            const startDateVal = parseLocalDate(
              field.value.start_date as string | Date
            );
            const endDateVal = parseLocalDate(
              field.value.end_date as string | Date
            );

            const startDay = startDateVal.getDate();
            const endDay = endDateVal.getDate();
            const localeCode = locale === "es" ? "es-ES" : "en-US";
            const month = endDateVal.toLocaleDateString(localeCode, {
              month: "long",
            });
            const year = endDateVal.getFullYear();

            rangeDisplay = `${startDay}-${endDay}, ${
              month.charAt(0).toUpperCase() + month.slice(1)
            } ${year}`;
          }

          return (
            <div key={key} style={fieldStyles}>
              {rangeDisplay}
            </div>
          );
        }

        // Para formatos normales: mostrar dos fechas separadas
        let startDateDisplay = dateRangeFormat;
        let endDateDisplay = dateRangeFormat;

        if (
          field.value &&
          typeof field.value === "object" &&
          "start_date" in field.value &&
          "end_date" in field.value
        ) {
          if (field.value.start_date) {
            startDateDisplay = formatDateValue(
              field.value.start_date as Date | string,
              dateRangeFormat
            );
          }
          if (field.value.end_date) {
            endDateDisplay = formatDateValue(
              field.value.end_date as Date | string,
              dateRangeFormat
            );
          }
        }

        return (
          <div key={key} style={fieldStyles}>
            {`${startDateDisplay} - ${endDateDisplay}`}
          </div>
        );

      case "page_number":
        const format = field.field_config?.format || "Página {page} de {total}";
        const pageNumber = format
          .replace("{page}", "1")
          .replace("{total}", "1");
        return (
          <div key={key} style={fieldStyles}>
            {pageNumber}
          </div>
        );

      case "list":
        const listStyleType = effectiveStyles.list_style_type || "disc";
        const showBullets = listStyleType !== "none";
        const listItemsLayout = effectiveStyles.list_items_layout || "vertical";
        const isNumbered = listStyleType === "decimal";

        // Mapeo de estilos CSS de lista
        const bulletStyles: { [key: string]: string } = {
          disc: "•",
          circle: "○",
          square: "■",
          decimal: "", // Los números se generan automáticamente
          none: "",
        };

        // Determinar clases CSS para el layout de items
        const getItemLayoutClasses = () => {
          switch (listItemsLayout) {
            case "horizontal":
              return "flex flex-wrap gap-4 items-center justify-between";
            case "grid-2":
              return "grid gap-1 w-full";
            case "grid-3":
              return "grid gap-1 w-full";
            case "vertical":
            default:
              return "space-y-1";
          }
        };

        // Determinar el estilo de grid columns según el layout
        const getGridColumnsStyle = (): React.CSSProperties | undefined => {
          switch (listItemsLayout) {
            case "grid-2":
              return { gridTemplateColumns: "auto auto" };
            case "grid-3":
              return { gridTemplateColumns: "auto auto auto" };
            default:
              return undefined;
          }
        };

        // Estilos para cada item de la lista
        const listItemStyles: React.CSSProperties = {
          backgroundColor: effectiveStyles.background_color || "transparent",
          backgroundImage: effectiveStyles.background_image
            ? `url("${getBackgroundImageUrl(
                effectiveStyles.background_image
              )}")`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: effectiveStyles.primary_color || undefined,
          ...getBorderStyles(effectiveStyles),
          padding: effectiveStyles.padding || undefined,
          margin: effectiveStyles.margin || undefined,
          fontSize: effectiveStyles.font_size
            ? `${effectiveStyles.font_size}px`
            : undefined,
          fontWeight: effectiveStyles.font_weight || undefined,
          fontStyle: effectiveStyles.font_style || undefined,
          textDecoration: effectiveStyles.text_decoration || undefined,
          textAlign:
            (effectiveStyles.text_align as "left" | "center" | "right") ||
            undefined,
          fontFamily: effectiveStyles.font || undefined,
        };

        // Obtener el array de items del valor del campo
        const listItems = Array.isArray(field.value) ? field.value : [];

        // Si no hay items, mostrar un item de ejemplo basado en el schema
        const itemsToRender = listItems.length > 0 ? listItems : [{}];

        // Para layout horizontal, el contenedor de items debe ser flex
        const itemsContainerClass =
          listItemsLayout === "horizontal"
            ? "flex flex-wrap gap-4 items-start"
            : "space-y-2";

        return (
          <div key={key}>
            <div className={itemsContainerClass}>
              {/* Renderizar elementos basados en el valor del campo */}
              {itemsToRender.map((item: any, itemIndex: number) => (
                <div
                  key={itemIndex}
                  className={
                    listItemsLayout === "horizontal"
                      ? "flex items-start gap-2"
                      : "flex items-start gap-2 w-full"
                  }
                  style={listItemStyles}
                >
                  {showBullets && (
                    <span
                      className="flex-shrink-0"
                      style={{
                        color:
                          effectiveStyles.primary_color || fieldStyles.color,
                        fontSize: effectiveStyles.font_size
                          ? `${effectiveStyles.font_size}px`
                          : undefined,
                      }}
                    >
                      {isNumbered
                        ? `${itemIndex + 1}.`
                        : bulletStyles[listStyleType]}
                    </span>
                  )}
                  <div
                    className={
                      listItemsLayout === "horizontal"
                        ? "flex gap-2 items-center"
                        : `flex-1 min-w-0 ${getItemLayoutClasses()}`
                    }
                    style={
                      listItemsLayout === "horizontal"
                        ? undefined
                        : getGridColumnsStyle()
                    }
                  >
                    {field.field_config?.item_schema &&
                    Object.keys(field.field_config.item_schema).length > 0 ? (
                      Object.entries(field.field_config.item_schema).map(
                        ([fieldKey, itemFieldSchema], fieldIndex) => {
                          // Obtener el valor del sub-field del item actual
                          const itemFieldValue = item[fieldKey];
                          const fieldSchema = itemFieldSchema as Field;

                          // Determinar si el campo debe expandirse (texto) o usar ancho natural (iconos, números, etc.)
                          const shouldExpand =
                            fieldSchema.type === "text" ||
                            fieldSchema.type === "text_with_icon";

                          // Para grid layouts: cada celda del grid contiene un flex interno
                          const isGridLayout =
                            listItemsLayout === "grid-2" ||
                            listItemsLayout === "grid-3";

                          // Determinar la alineación según la posición en el grid
                          let justifyClass = "";
                          if (isGridLayout) {
                            // En grid-2: índices impares (1, 3, 5...) van a la derecha
                            // En grid-3: índices 2, 5, 8... van a la derecha
                            const colsCount =
                              listItemsLayout === "grid-2" ? 2 : 3;
                            const colPosition = fieldIndex % colsCount;

                            if (colPosition === colsCount - 1) {
                              // Última columna: alinear a la derecha
                              justifyClass = "justify-end";
                            } else if (colPosition === 0) {
                              // Primera columna: alinear a la izquierda
                              justifyClass = "justify-start";
                            } else {
                              // Columnas del medio: centrar
                              justifyClass = "justify-center";
                            }
                          }

                          return (
                            <div
                              key={fieldIndex}
                              className={
                                isGridLayout
                                  ? `flex gap-1 items-center ${justifyClass} min-w-0`
                                  : shouldExpand
                                  ? "flex-1 min-w-[120px]"
                                  : "flex-shrink-0"
                              }
                            >
                              {renderField(
                                {
                                  ...fieldSchema,
                                  value: itemFieldValue,
                                } as Field,
                                `${itemIndex}-${fieldIndex}`,
                                containerStyle,
                                "horizontal"
                              )}
                            </div>
                          );
                        }
                      )
                    ) : (
                      <div className="text-sm">{JSON.stringify(item)}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case "climate_data_puntual":
        const availableParams =
          (field.field_config as any)?.available_parameters || {};
        const paramEntries = Object.entries(availableParams);
        const climateValue: { [key: string]: any } =
          typeof field.value === "object" &&
          field.value !== null &&
          !Array.isArray(field.value)
            ? (field.value as { [key: string]: any })
            : {};

        return (
          <div key={key} className="flex flex-col gap-4" style={fieldStyles}>
            {paramEntries.length > 0 ? (
              paramEntries.map(([paramKey, paramConfig]: [string, any]) => {
                // Por defecto showName es true si no está definido
                const showName = paramConfig.showName !== false;

                // Obtener el valor del parámetro o mostrar placeholder
                const paramValue = climateValue[paramKey];
                const displayValue =
                  paramValue !== undefined &&
                  paramValue !== null &&
                  paramValue !== ""
                    ? paramValue
                    : paramConfig.type === "number"
                    ? "-"
                    : "-";

                // Estilos individuales del parámetro
                const paramStyles: React.CSSProperties = {
                  color:
                    paramConfig.style_config?.primary_color ||
                    effectiveStyles.primary_color,
                  fontSize: paramConfig.style_config?.font_size
                    ? `${paramConfig.style_config.font_size}px`
                    : effectiveStyles.font_size
                    ? `${effectiveStyles.font_size}px`
                    : undefined,
                  fontWeight:
                    paramConfig.style_config?.font_weight ||
                    effectiveStyles.font_weight ||
                    undefined,
                };

                return (
                  <div key={paramKey} className="text-sm" style={paramStyles}>
                    {showName && `${paramConfig.label}: `}
                    {displayValue} {paramConfig.unit}
                  </div>
                );
              })
            ) : (
              <>
                <div className="text-sm">Temp. Max: 25°C</div>
                <div className="text-sm">Temp. Min: 15°C</div>
              </>
            )}
          </div>
        );

      case "image":
        // Mostrar la imagen si tiene valor (cuando form es false)
        const imageUrl = field.value as string | undefined;

        if (!imageUrl) {
          return (
            <div
              key={key}
              style={fieldStyles}
              className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded"
            >
              <span className="text-gray-400 text-sm">Sin imagen</span>
            </div>
          );
        }

        return (
          <div
            key={key}
            style={fieldStyles}
            className="flex items-center justify-center overflow-hidden"
          >
            <img
              src={imageUrl}
              alt={field.display_name || "Imagen"}
              className="max-w-full max-h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/img/imageNotFound.png";
              }}
            />
          </div>
        );

      case "card":
        // Obtener los IDs de cards disponibles desde field_config
        const availableCardIds =
          (field.field_config as any)?.available_cards || [];

        // Determinar qué card mostrar
        let cardIdToShow: string | null = null;

        if (field.value && typeof field.value === "string") {
          // Si hay un valor seleccionado (cuando el usuario llena el boletín), usar ese
          cardIdToShow = field.value;
        } else if (availableCardIds.length > 0) {
          // Si no hay valor (preview del template), mostrar el primer card disponible
          cardIdToShow = availableCardIds[0];
        }

        // Obtener la card del cache
        const cardToRender = cardIdToShow ? cardsCache.get(cardIdToShow) : null;

        if (!cardToRender) {
          return (
            <div
              key={key}
              style={fieldStyles}
              className="flex items-center justify-center bg-gray-100 border border-gray-300 rounded p-4"
            >
              <span className="text-gray-400 text-sm">
                {availableCardIds.length === 0
                  ? "No hay cards disponibles"
                  : "Cargando card..."}
              </span>
            </div>
          );
        }

        // Renderizar el contenido de la card
        const cardContent = cardToRender.content;
        const cardBackgroundUrl = cardContent.background_url;
        const cardBackgroundColor = cardContent.background_color;

        // Estilos del contenedor de la card
        const cardContainerStyles: React.CSSProperties = {
          ...fieldStyles,
          flex: 1, // Ocupar todo el espacio disponible
          display: "flex",
          flexDirection: "column",
          ...(cardBackgroundColor && { backgroundColor: cardBackgroundColor }),
          ...(cardBackgroundUrl && {
            backgroundImage: `url(${getBackgroundImageUrl(cardBackgroundUrl)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }),
        };

        // Aplicar estilos del card content si existen
        const cardContentStyleConfig = cardContent.style_config;
        if (cardContentStyleConfig) {
          if (cardContentStyleConfig.padding) {
            cardContainerStyles.padding = cardContentStyleConfig.padding;
          }
          if (cardContentStyleConfig.gap) {
            cardContainerStyles.gap = cardContentStyleConfig.gap;
          }
        }

        return (
          <div key={key} style={cardContainerStyles} className="flex flex-col">
            {/* Blocks del contenido de la card */}
            {/* Nota: El header y footer de la card se renderizan a nivel de section, no aquí */}
            {cardContent.blocks.map((block, blockIndex) => {
              // Combinar estilos del block con los del contenido de la card
              const blockStyleConfig = block.style_config || {};
              const contentStyleConfig = cardContentStyleConfig || {};

              // Usar los estilos del block con fallback a los del contenido
              const effectiveBlockStyles = {
                ...contentStyleConfig,
                ...blockStyleConfig,
              };

              const blockContainerStyles: React.CSSProperties = {
                display: "flex",
                flexDirection:
                  (block as any).layout === "horizontal" ? "row" : "column",
                gap: effectiveBlockStyles.gap
                  ? `${effectiveBlockStyles.gap}px`
                  : "8px",
                padding: effectiveBlockStyles.padding || undefined,
                backgroundColor:
                  effectiveBlockStyles.background_color || "transparent",
                ...getBorderStyles(block.style_config),
                // Agregar background_image si existe
                ...(effectiveBlockStyles.background_image && {
                  backgroundImage: `url(${getBackgroundImageUrl(
                    effectiveBlockStyles.background_image
                  )})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }),
              };

              return (
                <div
                  key={`card-block-${blockIndex}`}
                  style={blockContainerStyles}
                >
                  {block.fields.map((blockField, fieldIndex) => {
                    // Asegurar que el field tenga todas las propiedades necesarias
                    const safeField: Field = {
                      ...blockField,
                      style_manually_edited:
                        blockField.style_manually_edited ?? false,
                    } as Field;

                    // Renderizar cada field del block usando la función renderField existente
                    return renderField(
                      safeField,
                      `card-${cardIdToShow}-block-${blockIndex}-field-${fieldIndex}`,
                      block.style_config,
                      (block as any).layout || "vertical"
                    );
                  })}
                </div>
              );
            })}
          </div>
        );

      default:
        // Para cualquier otro tipo de campo, si form es false y tiene valor, mostrarlo
        const defaultValue =
          !field.form && field.value
            ? renderFieldValue(field.value)
            : `[${field.type}] ${field.display_name}`;

        return (
          <div key={key} style={fieldStyles}>
            {defaultValue}
          </div>
        );
    }
  };

  // Tipo para info de paginación
  type ListPaginationInfo = {
    blockIndex: number;
    fieldIndex: number;
    field: Field;
    maxItemsPerPage: number;
    totalItems: number;
    items: any[];
  };

  // Función para obtener info de paginación de una sección específica
  const getSectionPagination = (
    section: Section
  ): {
    totalPages: number;
    listFieldWithPagination?: ListPaginationInfo;
    paginatedSection: Section;
  } => {
    // Buscar si hay algún field de tipo list con max_items_per_page
    let foundInfo: ListPaginationInfo | undefined;

    for (let blockIndex = 0; blockIndex < section.blocks.length; blockIndex++) {
      const block = section.blocks[blockIndex];
      for (let fieldIndex = 0; fieldIndex < block.fields.length; fieldIndex++) {
        const field = block.fields[fieldIndex];
        if (field.type === "list" && field.field_config) {
          const maxItemsPerPage = (field.field_config as any)
            .max_items_per_page;
          const items = Array.isArray(field.value) ? field.value : [];

          if (maxItemsPerPage && items.length > maxItemsPerPage) {
            foundInfo = {
              blockIndex,
              fieldIndex,
              field,
              maxItemsPerPage,
              totalItems: items.length,
              items,
            };
            break;
          }
        }
      }
      if (foundInfo) break;
    }

    if (!foundInfo) {
      return { totalPages: 1, paginatedSection: section };
    }

    // Calcular total de páginas
    const totalPages = Math.ceil(
      foundInfo.totalItems / foundInfo.maxItemsPerPage
    );

    return {
      totalPages,
      listFieldWithPagination: foundInfo,
      paginatedSection: section,
    };
  };

  // Obtener la sección actual y su paginación
  const currentSection = sections[selectedSectionIndex];
  const paginationInfo = currentSection
    ? getSectionPagination(currentSection)
    : { totalPages: 1, paginatedSection: currentSection };

  // Crear la sección con los items de la página actual
  const getCurrentPageSection = (): Section | null => {
    if (!currentSection || !paginationInfo.listFieldWithPagination) {
      return currentSection;
    }

    const { listFieldWithPagination } = paginationInfo;
    const startIndex =
      currentPageIndex * listFieldWithPagination.maxItemsPerPage;
    const endIndex = Math.min(
      startIndex + listFieldWithPagination.maxItemsPerPage,
      listFieldWithPagination.totalItems
    );

    // Clonar la sección
    const clonedSection: Section = JSON.parse(JSON.stringify(currentSection));

    // Actualizar el list field con solo los items de esta página
    clonedSection.blocks[listFieldWithPagination.blockIndex].fields[
      listFieldWithPagination.fieldIndex
    ].value = listFieldWithPagination.items.slice(startIndex, endIndex);

    return clonedSection;
  };

  // Resetear página cuando cambie la sección
  useEffect(() => {
    setCurrentPageIndex(0);
  }, [selectedSectionIndex]);

  const sectionToRender = getCurrentPageSection();

  return (
    <div className="h-full">
      {/* Información de la plantilla */}
      {description && (
        <div className="mb-4 p-3 bg-[#bc6c25]/10 rounded-lg">
          <h3 className="font-semibold text-[#bc6c25]">
            {data.master.template_name ||
              t("untitled", { default: "Plantilla Sin Título" })}
          </h3>
          <p className="text-sm text-[#bc6c25] mt-1">
            {data.master.description ||
              t("noDescription", { default: "Sin descripción" })}
          </p>
          <div className="text-xs text-[#bc6c25] mt-2">
            Estado: {data.master.status} | Acceso:{" "}
            {data.master.access_config.access_type}
          </div>
        </div>
      )}

      {/* Preview del documento */}
      <div
        id="template-preview-container"
        className="border-2 border-gray-300 rounded-lg overflow-hidden flex justify-center"
      >
        <div
          className="bg-white flex flex-col"
          style={{
            ...globalStyles,
            width: `${styleConfig?.bulletin_width || 366}px`,
            height: `${styleConfig?.bulletin_height || 638}px`,
            padding: 0,
            overflow: "auto",
            backgroundImage: styleConfig?.background_image
              ? `url("${getBackgroundImageUrl(styleConfig.background_image)}")`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Header Global (solo cuando NO hay secciones) */}
          {sections.length === 0 &&
            headerConfig?.fields &&
            headerConfig.fields.length > 0 && (
              <div
                className={`w-full ${
                  headerConfig.style_config?.fields_layout === "vertical"
                    ? "flex flex-col"
                    : "flex items-center"
                }`}
                style={{
                  backgroundColor:
                    headerConfig.style_config?.background_color ||
                    "transparent",
                  backgroundImage: headerConfig.style_config?.background_image
                    ? `url("${getBackgroundImageUrl(
                        headerConfig.style_config.background_image
                      )}")`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  color:
                    headerConfig.style_config?.primary_color ||
                    globalStyles.color,
                  fontSize: headerConfig.style_config?.font_size
                    ? `${headerConfig.style_config.font_size}px`
                    : globalStyles.fontSize,
                  fontWeight: headerConfig.style_config?.font_weight || "400",
                  fontStyle: headerConfig.style_config?.font_style || "normal",
                  textDecoration:
                    headerConfig.style_config?.text_decoration || "none",
                  textAlign:
                    (headerConfig.style_config?.text_align as
                      | "left"
                      | "center"
                      | "right") || "center",
                  padding: headerConfig.style_config?.padding || "16px",
                  margin: headerConfig.style_config?.margin,
                  gap: headerConfig.style_config?.gap || "16px",
                  ...getBorderStyles(headerConfig.style_config),
                }}
              >
                {(() => {
                  return headerConfig.fields.map((field, index) =>
                    renderField(
                      field,
                      `header-global-${index}`,
                      headerConfig.style_config,
                      headerConfig.style_config?.fields_layout || "horizontal"
                    )
                  );
                })()}
              </div>
            )}

          {sections.length === 0 ? (
            <div className="text-center py-12 text-[#283618]/50 flex-1 flex items-center justify-center flex-col">
              <div className="text-4xl mb-4">📄</div>
              <p>
                {t("noSections", {
                  default: "No hay secciones configuradas",
                })}
              </p>
            </div>
          ) : (
            sectionToRender && (
              <>
                {(() => {
                  const section = sectionToRender;
                  const sectionIndex = selectedSectionIndex;

                  // Buscar campos de tipo select_background para aplicar el fondo seleccionado
                  let dynamicBackgroundUrl = null;
                  for (const block of section.blocks) {
                    for (const field of block.fields) {
                      if (field.type === "select_background") {
                        const bgOptions =
                          (field.field_config as any)?.options || [];
                        const bgUrls =
                          (field.field_config as any)?.backgrounds_url || [];

                        if (field.value) {
                          // Buscar el fondo correspondiente al valor seleccionado
                          const selectedIndex = bgOptions.findIndex(
                            (opt: string) => opt === field.value
                          );
                          if (selectedIndex !== -1 && bgUrls[selectedIndex]) {
                            dynamicBackgroundUrl = bgUrls[selectedIndex];
                            break;
                          }
                        } else {
                          // Si no hay valor, usar el primer fondo por defecto
                          if (bgUrls.length > 0) {
                            dynamicBackgroundUrl = bgUrls[0];
                            break;
                          }
                        }
                      }
                    }
                    if (dynamicBackgroundUrl) break;
                  }

                  // Estilos aplicados a la sección completa
                  const sectionStyles = {
                    fontFamily:
                      section.style_config?.font || globalStyles.fontFamily,
                    color:
                      section.style_config?.primary_color || globalStyles.color,
                    fontSize: section.style_config?.font_size
                      ? `${section.style_config.font_size}px`
                      : globalStyles.fontSize,
                    backgroundColor: section.style_config?.background_color,
                    backgroundImage: dynamicBackgroundUrl
                      ? `url("${getBackgroundImageUrl(dynamicBackgroundUrl)}")`
                      : section.style_config?.background_image
                      ? `url("${getBackgroundImageUrl(
                          section.style_config.background_image
                        )}")`
                      : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    fontWeight: section.style_config?.font_weight || "400",
                    fontStyle: section.style_config?.font_style || "normal",
                    textDecoration:
                      section.style_config?.text_decoration || "none",
                    textAlign:
                      (section.style_config?.text_align as
                        | "left"
                        | "center"
                        | "right") || "left",
                    padding: section.style_config?.padding,
                    margin: section.style_config?.margin,
                    ...getBorderStyles(section.style_config),
                  };

                  // Buscar si hay algún field de tipo "card" en los blocks de esta section
                  let cardHeaderConfig = null;
                  let cardFooterConfig = null;
                  let cardBackgroundColor = null;

                  for (const block of section.blocks) {
                    for (const field of block.fields) {
                      if (field.type === "card") {
                        const availableCardIds =
                          (field.field_config as any)?.available_cards || [];
                        let cardIdToShow: string | null = null;

                        if (field.value && typeof field.value === "string") {
                          cardIdToShow = field.value;
                        } else if (availableCardIds.length > 0) {
                          cardIdToShow = availableCardIds[0];
                        }

                        if (cardIdToShow) {
                          const card = cardsCache.get(cardIdToShow);
                          if (card) {
                            // Guardar el background color de la card
                            cardBackgroundColor = card.content.background_color;

                            // Si la card tiene header, usarlo
                            if (
                              card.content.header_config &&
                              (card.content.header_config as any).fields
                            ) {
                              cardHeaderConfig = card.content.header_config;
                            }
                            // Si la card tiene footer, usarlo
                            if (
                              card.content.footer_config &&
                              (card.content.footer_config as any).fields
                            ) {
                              cardFooterConfig = card.content.footer_config;
                            }
                            // Solo tomar el primer card encontrado
                            break;
                          }
                        }
                      }
                    }
                    if (cardHeaderConfig || cardFooterConfig) break;
                  }

                  // Determinar qué header usar: card > sección específica > global
                  const hasSectionHeader =
                    section.header_config?.fields &&
                    section.header_config.fields.length > 0;

                  const hasGlobalHeader =
                    headerConfig?.fields && headerConfig.fields.length > 0;

                  // Prioridad: card header > section header (si no forceGlobalHeader) > global header
                  const activeHeaderConfig = cardHeaderConfig
                    ? cardHeaderConfig
                    : forceGlobalHeader
                    ? hasGlobalHeader
                      ? headerConfig
                      : null
                    : hasSectionHeader
                    ? section.header_config
                    : hasGlobalHeader
                    ? headerConfig
                    : null;

                  // Determinar qué footer usar: card > sección específica (si no forceGlobalHeader) > global
                  const hasSectionFooter =
                    section.footer_config?.fields &&
                    section.footer_config.fields.length > 0;

                  const hasGlobalFooter =
                    footerConfig?.fields && footerConfig.fields.length > 0;

                  // Prioridad: card footer > section footer (si no forceGlobalHeader) > global footer
                  const activeFooterConfig = cardFooterConfig
                    ? cardFooterConfig
                    : forceGlobalHeader
                    ? hasGlobalFooter
                      ? footerConfig
                      : null
                    : hasSectionFooter
                    ? section.footer_config
                    : hasGlobalFooter
                    ? footerConfig
                    : null;

                  return (
                    <>
                      {/* Header con lógica de prioridad */}
                      {activeHeaderConfig && (
                        <div
                          className={`w-full ${
                            activeHeaderConfig.style_config?.fields_layout ===
                            "vertical"
                              ? "flex flex-col"
                              : "flex items-center"
                          }`}
                          style={{
                            backgroundColor:
                              activeHeaderConfig.style_config
                                ?.background_color || "transparent",
                            backgroundImage: activeHeaderConfig.style_config
                              ?.background_image
                              ? `url("${getBackgroundImageUrl(
                                  activeHeaderConfig.style_config
                                    .background_image
                                )}")`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            color:
                              activeHeaderConfig.style_config?.primary_color ||
                              globalStyles.color,
                            fontSize: activeHeaderConfig.style_config?.font_size
                              ? `${activeHeaderConfig.style_config.font_size}px`
                              : globalStyles.fontSize,
                            fontWeight:
                              activeHeaderConfig.style_config?.font_weight ||
                              "400",
                            fontStyle:
                              activeHeaderConfig.style_config?.font_style ||
                              "normal",
                            textDecoration:
                              activeHeaderConfig.style_config
                                ?.text_decoration || "none",
                            textAlign:
                              (activeHeaderConfig.style_config?.text_align as
                                | "left"
                                | "center"
                                | "right") || "center",
                            padding:
                              activeHeaderConfig.style_config?.padding ||
                              "16px",
                            margin: activeHeaderConfig.style_config?.margin,
                            gap: activeHeaderConfig.style_config?.gap || "16px",
                            ...getBorderStyles(activeHeaderConfig.style_config),
                          }}
                        >
                          {activeHeaderConfig.fields.map((field, index) =>
                            renderField(
                              field,
                              `header-${sectionIndex}-${index}`,
                              activeHeaderConfig.style_config,
                              activeHeaderConfig.style_config?.fields_layout ||
                                "horizontal"
                            )
                          )}
                        </div>
                      )}

                      {/* Sección con bloques - ocupa todo el espacio disponible */}
                      <div
                        data-section-preview={`section-${sectionIndex}`}
                        style={sectionStyles}
                        className="flex-1 overflow-auto flex flex-col"
                      >
                        {/* Bloques de la sección */}
                        <div className="space-y-1 w-full flex-1 flex flex-col">
                          {section.blocks.length === 0 ? (
                            <div className="text-sm text-[#283618]/50 italic pl-4">
                              No hay bloques en esta sección
                            </div>
                          ) : (
                            section.blocks.map((block, blockIndex) => {
                              // Verificar si el block contiene un field de tipo card
                              const hasCardField = block.fields.some(
                                (field) => field.type === "card"
                              );

                              // Obtener estilos del bloque
                              const blockStyles: React.CSSProperties = {
                                backgroundColor:
                                  block.style_config?.background_color ||
                                  undefined,
                                backgroundImage: block.style_config
                                  ?.background_image
                                  ? `url("${getBackgroundImageUrl(
                                      block.style_config.background_image
                                    )}")`
                                  : undefined,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                                backgroundRepeat: "no-repeat",
                                color:
                                  block.style_config?.primary_color ||
                                  undefined,
                                padding:
                                  block.style_config?.padding !== undefined
                                    ? block.style_config.padding
                                    : "16px",
                                margin:
                                  block.style_config?.margin !== undefined
                                    ? block.style_config.margin
                                    : undefined,
                                gap:
                                  block.style_config?.gap !== undefined
                                    ? block.style_config.gap
                                    : "8px",
                                ...getBorderStyles(block.style_config),
                                // Si tiene un card field, ocupar todo el espacio disponible
                                ...(hasCardField && {
                                  flex: 1,
                                  display: "flex",
                                  flexDirection: "column",
                                }),
                              };

                              // Determinar layout de campos
                              const fieldsLayout =
                                block.style_config?.fields_layout || "vertical";
                              const fieldsContainerClass =
                                fieldsLayout === "horizontal"
                                  ? "flex flex-wrap"
                                  : "flex flex-col";

                              return (
                                <div
                                  key={`preview-block-${sectionIndex}-${blockIndex}`}
                                  className={`w-full ${
                                    hasCardField ? "flex-1" : ""
                                  }`}
                                  style={blockStyles}
                                >
                                  {/* Campos del bloque */}
                                  <div
                                    className={`${fieldsContainerClass} ${
                                      hasCardField ? "flex-1" : ""
                                    }`}
                                    style={{
                                      gap: block.style_config?.gap
                                        ? `${block.style_config.gap}px`
                                        : "8px",
                                    }}
                                  >
                                    {block.fields.length === 0 ? (
                                      <div className="text-sm text-[#283618]/50 italic">
                                        No hay campos en este bloque
                                      </div>
                                    ) : (
                                      block.fields
                                        .filter((field) => field.bulletin) // Solo mostrar campos que van al boletín
                                        .map((field, fieldIndex) =>
                                          renderField(
                                            field,
                                            `preview-field-${sectionIndex}-${blockIndex}-${fieldIndex}`,
                                            block.style_config ||
                                              section.style_config, // Los campos heredan del bloque o de la sección
                                            fieldsLayout
                                          )
                                        )
                                    )}
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      {/* Footer con lógica de prioridad */}
                      {activeFooterConfig && (
                        <div
                          className={`w-full ${
                            activeFooterConfig.style_config?.fields_layout ===
                            "vertical"
                              ? "flex flex-col"
                              : "flex items-center"
                          }`}
                          style={{
                            backgroundColor:
                              activeFooterConfig.style_config
                                ?.background_color ||
                              cardBackgroundColor ||
                              "transparent",
                            backgroundImage: activeFooterConfig.style_config
                              ?.background_image
                              ? `url("${getBackgroundImageUrl(
                                  activeFooterConfig.style_config
                                    .background_image
                                )}")`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            color:
                              activeFooterConfig.style_config?.primary_color ||
                              globalStyles.color,
                            fontSize: activeFooterConfig.style_config?.font_size
                              ? `${activeFooterConfig.style_config.font_size}px`
                              : globalStyles.fontSize,
                            fontWeight:
                              activeFooterConfig.style_config?.font_weight ||
                              "400",
                            fontStyle:
                              activeFooterConfig.style_config?.font_style ||
                              "normal",
                            textDecoration:
                              activeFooterConfig.style_config
                                ?.text_decoration || "none",
                            textAlign:
                              (activeFooterConfig.style_config?.text_align as
                                | "left"
                                | "center"
                                | "right") || "center",
                            padding:
                              activeFooterConfig.style_config?.padding ||
                              "16px",
                            margin: activeFooterConfig.style_config?.margin,
                            gap: activeFooterConfig.style_config?.gap || "16px",
                            ...getBorderStyles(activeFooterConfig.style_config),
                          }}
                        >
                          {activeFooterConfig.fields.map((field, index) =>
                            renderField(
                              field,
                              `footer-${sectionIndex}-${index}`,
                              activeFooterConfig.style_config,
                              activeFooterConfig.style_config?.fields_layout ||
                                "horizontal"
                            )
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )
          )}

          {/* Footer Global (solo cuando NO hay secciones) */}
          {sections.length === 0 &&
            footerConfig?.fields &&
            footerConfig.fields.length > 0 && (
              <div
                className={`w-full ${
                  footerConfig.style_config?.fields_layout === "vertical"
                    ? "flex flex-col"
                    : "flex items-center"
                }`}
                style={{
                  backgroundColor:
                    footerConfig.style_config?.background_color ||
                    "transparent",
                  backgroundImage: footerConfig.style_config?.background_image
                    ? `url("${getBackgroundImageUrl(
                        footerConfig.style_config.background_image
                      )}")`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  color:
                    footerConfig.style_config?.primary_color ||
                    globalStyles.color,
                  fontSize: footerConfig.style_config?.font_size
                    ? `${footerConfig.style_config.font_size}px`
                    : globalStyles.fontSize,
                  fontWeight: footerConfig.style_config?.font_weight || "400",
                  fontStyle: footerConfig.style_config?.font_style || "normal",
                  textDecoration:
                    footerConfig.style_config?.text_decoration || "none",
                  textAlign:
                    (footerConfig.style_config?.text_align as
                      | "left"
                      | "center"
                      | "right") || "center",
                  padding: footerConfig.style_config?.padding || "16px",
                  margin: footerConfig.style_config?.margin,
                  gap: footerConfig.style_config?.gap || "16px",
                  ...getBorderStyles(footerConfig.style_config),
                }}
              >
                {footerConfig.fields.map((field, index) =>
                  renderField(
                    field,
                    `footer-global-${index}`,
                    footerConfig.style_config,
                    footerConfig.style_config?.fields_layout || "horizontal"
                  )
                )}
              </div>
            )}
        </div>
      </div>

      {/* Controles de paginación de lista */}
      {paginationInfo.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={() =>
              setCurrentPageIndex(Math.max(0, currentPageIndex - 1))
            }
            disabled={currentPageIndex === 0}
            className="px-4 py-2 bg-[#283618] text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#283618]/90 transition-colors"
          >
            ← Página Anterior
          </button>
          <span className="text-sm text-[#283618] font-medium">
            Página {currentPageIndex + 1} de {paginationInfo.totalPages}
          </span>
          <button
            onClick={() =>
              setCurrentPageIndex(
                Math.min(paginationInfo.totalPages - 1, currentPageIndex + 1)
              )
            }
            disabled={currentPageIndex === paginationInfo.totalPages - 1}
            className="px-4 py-2 bg-[#283618] text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#283618]/90 transition-colors"
          >
            Página Siguiente →
          </button>
        </div>
      )}

      {/* Información adicional */}
      {moreInfo && (
        <div className="mt-4 text-xs text-[#283618]/50 space-y-1">
          <div>Versión: {data.version.version_num}</div>
          <div>Mensaje: {data.version.commit_message}</div>
          <div>Secciones: {sections.length}</div>
          <div>
            Campos totales:{" "}
            {sections.reduce(
              (total, section) =>
                total +
                section.blocks.reduce(
                  (blockTotal, block) => blockTotal + block.fields.length,
                  0
                ),
              0
            ) +
              (headerConfig?.fields?.length || 0) +
              (footerConfig?.fields?.length || 0)}
          </div>
        </div>
      )}
    </div>
  );
}
