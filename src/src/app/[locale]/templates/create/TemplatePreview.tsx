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

  // Helper function to render field values safely
  const renderFieldValue = (value: Field["value"]): string => {
    if (!value) return "";
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }
    if (value instanceof Date) {
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
      padding: effectiveStyles.padding,
      margin: effectiveStyles.margin,
      ...(effectiveStyles.border_width && {
        border: `${effectiveStyles.border_width} solid ${
          effectiveStyles.border_color || "#000000"
        }`,
      }),
      ...(effectiveStyles.border_radius && {
        borderRadius: effectiveStyles.border_radius,
      }),
    };

    // Debug temporal para verificar estilos
    if (effectiveStyles.border_width) {
      console.log("Field with border:", field.display_name, {
        border_width: effectiveStyles.border_width,
        border_color: effectiveStyles.border_color,
        finalBorder: `${effectiveStyles.border_width} solid ${
          effectiveStyles.border_color || "#000000"
        }`,
      });
    }

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

        return (
          <div
            key={key}
            style={fieldStyles}
            className="flex items-center gap-2"
          >
            {field.field_config?.icon_options &&
              field.field_config.icon_options.length > 0 && (
                <span className="text-lg">
                  {field.field_config.icon_options[0] || "📄"}
                </span>
              )}
            <span>{textWithIconValue}</span>
          </div>
        );

      case "date":
        return (
          <div key={key} style={fieldStyles}>
            <span className="text-sm text-[#283618]/70">
              {field.label || field.display_name}:
            </span>
            <span className="ml-2">
              {renderFieldValue(field.value) || "DD/MM/AAAA"}
            </span>
          </div>
        );

      case "date_range":
        return (
          <div key={key} style={fieldStyles}>
            <span className="text-sm text-[#283618]/70">
              {field.label || field.display_name}:
            </span>
            <span className="ml-2">
              {field.value &&
              typeof field.value === "object" &&
              "start_date" in field.value &&
              "end_date" in field.value
                ? `${field.value.start_date || "DD/MM/AAAA"} - ${
                    field.value.end_date || "DD/MM/AAAA"
                  }`
                : "DD/MM/AAAA - DD/MM/AAAA"}
            </span>
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
        return (
          <div key={key} style={fieldStyles}>
            <div className="font-medium mb-2">
              {field.label || field.display_name}
            </div>
            <div className="pl-4 space-y-1 text-sm">
              <div>• Elemento de lista 1</div>
              <div>• Elemento de lista 2</div>
            </div>
          </div>
        );

      case "climate_data_puntual":
        return (
          <div
            key={key}
            className={layout === "horizontal" ? "" : "mb-4"}
            style={fieldStyles}
          >
            <div className="font-medium mb-2">
              {field.label || field.display_name}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Temp. Max: 25°C</div>
              <div>Temp. Min: 15°C</div>
            </div>
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
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900">
          {data.master.template_name ||
            t("untitled", { default: "Plantilla Sin Título" })}
        </h3>
        <p className="text-sm text-blue-700 mt-1">
          {data.master.description ||
            t("noDescription", { default: "Sin descripción" })}
        </p>
        <div className="text-xs text-blue-600 mt-2">
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
          }}
        >
          {/* Header Global */}
          {headerConfig &&
            headerConfig.fields &&
            headerConfig.fields.length > 0 && (
              <div
                className={`pb-4 mb-6 w-full px-4 pt-4 ${
                  headerConfig.style_config?.fields_layout === "vertical"
                    ? "flex flex-col"
                    : "flex items-center"
                }`}
                style={{
                  backgroundColor:
                    headerConfig.style_config?.background_color ||
                    "transparent",
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

          {/* Secciones - Cada sección es una página independiente */}
          <div className="flex-1 px-4 flex flex-col">
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
              <div className="flex-1 flex flex-col">
                {/* Mostrar la sección seleccionada */}
                {sections.length > 0 && sections[selectedSectionIndex] && (
                  <div className="section-preview w-full flex-1">
                    {(() => {
                      const section = sections[selectedSectionIndex];
                      const sectionIndex = selectedSectionIndex;
                      return (
                        <>
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
                                {section.header_config.fields.map(
                                  (field, index) =>
                                    renderField(
                                      field,
                                      `sh-${sectionIndex}-${index}`,
                                      section.header_config?.style_config
                                    )
                                )}
                              </div>
                            )}

                          {/* Título de la sección */}
                          <div className="flex items-center mb-4">
                            {section.icon_url && (
                              <img
                                src={section.icon_url}
                                alt=""
                                className="w-6 h-6 mr-3"
                              />
                            )}
                            <h2
                              className="text-xl font-bold"
                              style={{
                                color: styleConfig?.primary_color || "#000",
                              }}
                            >
                              {section.display_name}
                            </h2>
                            <span className="ml-2 text-sm text-[#283618]/50">
                              (#{section.order})
                            </span>
                          </div>

                          {/* Bloques de la sección */}
                          <div className="space-y-6 w-full">
                            {section.blocks.length === 0 ? (
                              <div className="text-sm text-[#283618]/50 italic pl-4">
                                No hay bloques en esta sección
                              </div>
                            ) : (
                              section.blocks.map((block, blockIndex) => (
                                <div
                                  key={`preview-block-${sectionIndex}-${blockIndex}`}
                                  className="border-l-4 border-gray-200 pl-4 w-full"
                                >
                                  <h3
                                    className="font-semibold mb-3 text-lg"
                                    style={{
                                      color:
                                        styleConfig?.secondary_color || "#666",
                                    }}
                                  >
                                    {block.display_name}
                                  </h3>

                                  {/* Campos del bloque */}
                                  <div className="space-y-2">
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
                                            section.style_config // Los campos en bloques heredan del estilo de la sección
                                          )
                                        )
                                    )}
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Global */}
          {footerConfig &&
            footerConfig.fields &&
            footerConfig.fields.length > 0 && (
              <div
                className={`pt-4 mt-8 w-full px-4 pb-4 ${
                  footerConfig.style_config?.fields_layout === "vertical"
                    ? "flex flex-col"
                    : "flex items-center"
                }`}
                style={{
                  backgroundColor:
                    footerConfig.style_config?.background_color ||
                    "transparent",
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
