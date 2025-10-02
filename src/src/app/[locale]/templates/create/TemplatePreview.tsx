"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { CreateTemplateData, Field } from "../../../../types/template";
import { StyleConfig } from "../../../../types/core";
import { getEffectiveFieldStyles } from "../../../../utils/styleInheritance";

interface TemplatePreviewProps {
  data: CreateTemplateData;
  selectedSectionIndex?: number;
}

export function TemplatePreview({
  data,
  selectedSectionIndex = 0,
}: TemplatePreviewProps) {
  const t = useTranslations("CreateTemplate.preview");

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
    // Si ya es una URL completa, devolverla tal como está
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      return imageUrl;
    }

    // Si es una ruta relativa, construir URL completa
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const cleanUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;
    return `${baseUrl}${cleanUrl}`;
  };

  // Helper function to format dates according to field configuration
  const formatDateValue = (date: Date | string, format: string): string => {
    let dateObj: Date;

    if (typeof date === "string") {
      dateObj = new Date(date);
    } else {
      dateObj = date;
    }

    if (isNaN(dateObj.getTime())) {
      return "Fecha inválida";
    }

    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getFullYear();
    const dayName = dateObj.toLocaleDateString("es-ES", { weekday: "long" });
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
      return value.toLocaleDateString();
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
      backgroundColor: effectiveStyles.background_color,
      backgroundImage: effectiveStyles.background_image
        ? `url("${getBackgroundImageUrl(effectiveStyles.background_image)}")`
        : undefined,
      backgroundSize: "contain",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      padding: effectiveStyles.padding,
      margin: effectiveStyles.margin,
      gap: effectiveStyles.gap,
      ...(effectiveStyles.border_width && {
        border: `${effectiveStyles.border_width} solid ${
          effectiveStyles.border_color || "#000000"
        }`,
      }),
      ...(effectiveStyles.border_radius && {
        borderRadius: effectiveStyles.border_radius,
      }),
    };

    switch (field.type) {
      case "text":
        // Para text, si form es false y tiene valor, mostrarlo. Si form es true, mostrar placeholder
        const textValue =
          !field.form && field.value
            ? renderFieldValue(field.value)
            : field.display_name || field.label || "Campo de texto";

        return (
          <div key={key} style={fieldStyles}>
            {textValue}
          </div>
        );

      case "text_with_icon":
        // Para text_with_icon, si form es false, mostrar el value. Si form es true, mostrar placeholder
        const textWithIconValue =
          !field.form && field.value
            ? renderFieldValue(field.value)
            : field.form
            ? field.display_name || field.label || "Texto con icono"
            : field.display_name || field.label || "Texto con icono";

        // Obtener el icono seleccionado o el primer icono disponible como fallback
        const selectedIcon =
          (field.field_config as any)?.selected_icon ||
          (field.field_config?.icon_options &&
          field.field_config.icon_options.length > 0
            ? field.field_config.icon_options[0]
            : null);

        return (
          <div key={key} style={fieldStyles} className="flex items-center">
            {selectedIcon ? (
              selectedIcon.startsWith("http") ||
              selectedIcon.startsWith("/") ? (
                <img
                  src={selectedIcon}
                  alt="Icon"
                  className="w-6 h-6 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <span className="text-lg">{selectedIcon}</span>
              )
            ) : (
              <span className="text-lg">📄</span>
            )}
            <span>{textWithIconValue}</span>
          </div>
        );

      case "select_with_icons":
        // Si form es false, mostrar el icono seleccionado (si existe valor)
        // Si form es true, mostrar un icono por defecto
        let iconToShow = null;

        if (!field.form && field.value) {
          // Buscar el icono correspondiente al valor seleccionado
          const options = (field.field_config as any)?.options || [];
          const selectedOption = options.find(
            (opt: any) => opt.value === field.value
          );
          if (selectedOption && selectedOption.icon_url) {
            iconToShow = selectedOption.icon_url;
          }
        } else if (field.form) {
          // Mostrar icono por defecto cuando es form
          const options = (field.field_config as any)?.options || [];
          if (options.length > 0 && options[0].icon_url) {
            iconToShow = options[0].icon_url;
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

        return (
          <div
            key={key}
            style={fieldStyles}
            className={`flex items-center ${justifyClass}`}
          >
            {iconToShow ? (
              <img
                src={iconToShow}
                alt="Selected icon"
                className="w-8 h-8 object-contain"
                style={{
                  color: effectiveStyles.primary_color || fieldStyles.color,
                }}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <span className="text-2xl">❓</span>
            )}
          </div>
        );

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

        // Formatear las fechas si existen, sino mostrar el formato
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

        // Mapeo de estilos CSS de lista
        const bulletStyles: { [key: string]: string } = {
          disc: "•",
          circle: "○",
          square: "■",
          none: "",
        };

        // Determinar clases CSS para el layout de items
        const getItemLayoutClasses = () => {
          switch (listItemsLayout) {
            case "horizontal":
              return "flex flex-wrap gap-4";
            case "grid-2":
              return "grid grid-cols-2 gap-1 w-full";
            case "grid-3":
              return "grid grid-cols-3 gap-1 w-full";
            case "vertical":
            default:
              return "space-y-1";
          }
        };

        // Estilos para cada item de la lista (no para el contenedor general)
        const listItemStyles: React.CSSProperties = {
          backgroundColor: effectiveStyles.background_color || undefined,
          backgroundImage: effectiveStyles.background_image
            ? `url("${getBackgroundImageUrl(
                effectiveStyles.background_image
              )}")`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: effectiveStyles.primary_color || undefined,
          borderColor: effectiveStyles.border_color || undefined,
          borderWidth: effectiveStyles.border_width
            ? `${effectiveStyles.border_width}px`
            : undefined,
          borderStyle: effectiveStyles.border_width ? "solid" : undefined,
          borderRadius: effectiveStyles.border_radius
            ? `${effectiveStyles.border_radius}px`
            : undefined,
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

        return (
          <div key={key}>
            <div className={showBullets ? "pl-4 space-y-2" : "space-y-2"}>
              {/* Renderizar elementos basados en item_schema */}
              {[1, 2].map((itemIndex) => (
                <div
                  key={itemIndex}
                  className="flex items-start gap-2 w-full"
                  style={listItemStyles}
                >
                  {showBullets && (
                    <span
                      className="text-sm mt-1 flex-shrink-0"
                      style={{
                        color:
                          effectiveStyles.primary_color || fieldStyles.color,
                      }}
                    >
                      {bulletStyles[listStyleType]}
                    </span>
                  )}
                  <div className={`flex-1 min-w-0 ${getItemLayoutClasses()}`}>
                    {field.field_config?.item_schema &&
                    Object.keys(field.field_config.item_schema).length > 0 ? (
                      Object.entries(field.field_config.item_schema).map(
                        ([fieldKey, itemField], fieldIndex) => (
                          <div key={fieldIndex} className="min-w-0">
                            {renderField(
                              {
                                ...itemField,
                                value: itemField.value || undefined,
                              } as Field,
                              `${itemIndex}-${fieldIndex}`,
                              containerStyle,
                              "horizontal"
                            )}
                          </div>
                        )
                      )
                    ) : (
                      <div className="text-sm">
                        Elemento de lista {itemIndex}
                      </div>
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

        return (
          <div key={key} className="flex flex-col gap-4" style={fieldStyles}>
            {paramEntries.length > 0 ? (
              paramEntries.map(([paramKey, paramConfig]: [string, any]) => {
                // Por defecto showName es true si no está definido
                const showName = paramConfig.showName !== false;
                return (
                  <div key={paramKey} className="text-sm">
                    {showName && `${paramConfig.label}: `}
                    {paramConfig.type === "number" ? "25" : "Valor"}{" "}
                    {paramConfig.unit}
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

  return (
    <div className="h-full">
      {/* Información de la plantilla */}
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

      {/* Preview del documento */}
      <div className="border-2 border-gray-300 rounded-lg overflow-hidden inline-block">
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
          {/* Header Global */}
          {headerConfig &&
            headerConfig.fields &&
            headerConfig.fields.length > 0 && (
              <div
                className={`pb-4 w-full px-4 pt-4 ${
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
                  ...(headerConfig.style_config?.border_width && {
                    border: `${headerConfig.style_config.border_width} solid ${
                      headerConfig.style_config.border_color || "#000000"
                    }`,
                  }),
                  ...(headerConfig.style_config?.border_radius && {
                    borderRadius: headerConfig.style_config.border_radius,
                  }),
                }}
              >
                {headerConfig.fields.map((field, index) =>
                  renderField(
                    field,
                    index,
                    headerConfig.style_config,
                    headerConfig.style_config?.fields_layout || "horizontal"
                  )
                )}
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
            sections.length > 0 &&
            sections[selectedSectionIndex] && (
              <>
                {(() => {
                  const section = sections[selectedSectionIndex];
                  const sectionIndex = selectedSectionIndex;

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
                    backgroundImage: section.style_config?.background_image
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
                    ...(section.style_config?.border_width && {
                      border: `${section.style_config.border_width} solid ${
                        section.style_config.border_color || "#000000"
                      }`,
                    }),
                    ...(section.style_config?.border_radius && {
                      borderRadius: section.style_config.border_radius,
                    }),
                  };

                  return (
                    <div style={sectionStyles} className="h-full">
                      {/* Header de sección */}
                      {section.header_config &&
                        section.header_config.fields &&
                        section.header_config.fields.length > 0 && (
                          <div
                            className="mb-4 p-3 bg-gray-50 rounded w-full"
                            style={{
                              textAlign:
                                (section.header_config.style_config
                                  ?.text_align as
                                  | "left"
                                  | "center"
                                  | "right") || "left",
                            }}
                          >
                            <div className="text-xs text-[#283618]/50 mb-1">
                              HEADER DE SECCIÓN
                            </div>
                            {section.header_config.fields.map((field, index) =>
                              renderField(
                                field,
                                `sh-${sectionIndex}-${index}`,
                                section.header_config?.style_config
                              )
                            )}
                          </div>
                        )}

                      {/* Bloques de la sección */}
                      <div className="space-y-6 w-full">
                        {section.blocks.length === 0 ? (
                          <div className="text-sm text-[#283618]/50 italic pl-4">
                            No hay bloques en esta sección
                          </div>
                        ) : (
                          section.blocks.map((block, blockIndex) => {
                            // Obtener estilos del bloque
                            const blockStyles: React.CSSProperties = {
                              backgroundColor:
                                block.style_config?.background_color ||
                                undefined,
                              color:
                                block.style_config?.primary_color || undefined,
                              padding: block.style_config?.padding
                                ? `${block.style_config.padding}px`
                                : "16px",
                              margin: block.style_config?.margin
                                ? `${block.style_config.margin}px`
                                : undefined,
                              borderColor:
                                block.style_config?.border_color || "#e5e7eb",
                              borderWidth: block.style_config?.border_width
                                ? `${block.style_config.border_width}px`
                                : "1px",
                              borderStyle: "solid",
                              borderRadius: block.style_config?.border_radius
                                ? `${block.style_config.border_radius}px`
                                : "8px",
                              gap: block.style_config?.gap
                                ? `${block.style_config.gap}px`
                                : "8px",
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
                                className="w-full"
                                style={blockStyles}
                              >
                                {/* Campos del bloque */}
                                <div
                                  className={fieldsContainerClass}
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
                  );
                })()}
              </>
            )
          )}

          {/* Footer Global */}
          {footerConfig &&
            footerConfig.fields &&
            footerConfig.fields.length > 0 && (
              <div
                className={`pt-4 w-full px-4 pb-4 ${
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
                  ...(footerConfig.style_config?.border_width && {
                    border: `${footerConfig.style_config.border_width} solid ${
                      footerConfig.style_config.border_color || "#000000"
                    }`,
                  }),
                  ...(footerConfig.style_config?.border_radius && {
                    borderRadius: footerConfig.style_config.border_radius,
                  }),
                }}
              >
                {footerConfig.fields.map((field, index) =>
                  renderField(
                    field,
                    `footer-${index}`,
                    footerConfig.style_config,
                    footerConfig.style_config?.fields_layout || "horizontal"
                  )
                )}
              </div>
            )}
        </div>
      </div>

      {/* Información adicional */}
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
    </div>
  );
}
