"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Trash2,
  Settings,
  GripVertical,
  Copy,
  FileText,
  Layout,
  Palette,
  Eye,
  Edit3,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  CreateTemplateData,
  Section,
  Block,
  Field,
} from "../../../../../types/template";
import { StyleConfig } from "../../../../../types/core";
import { FieldEditor } from "../components/FieldEditor";

interface SectionsStepProps {
  data: CreateTemplateData;
  errors: Record<string, string[]>;
  onDataChange: (
    updater: (prevData: CreateTemplateData) => CreateTemplateData
  ) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
  selectedSectionIndex?: number;
  onSectionSelect?: (index: number) => void;
}

interface BlockConfigurationProps {
  block: Block;
  sectionIndex: number;
  blockIndex: number;
  onUpdateBlock: (
    sectionIndex: number,
    blockIndex: number,
    updates: Partial<Block>
  ) => void;
  onEditField: (
    sectionIndex: number,
    blockIndex: number,
    fieldIndex: number
  ) => void;
}

interface FieldConfigurationProps {
  field: Field;
  fieldIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateField: (fieldIndex: number, updates: Partial<Field>) => void;
  onRemoveField: (fieldIndex: number) => void;
  getFieldConfigDefaults: (fieldType: string) => any;
}

function FieldConfiguration({
  field,
  fieldIndex,
  isExpanded,
  onToggleExpand,
  onUpdateField,
  onRemoveField,
  sectionIndex,
  blockIndex,
  onEditField,
}: FieldConfigurationProps & {
  sectionIndex: number;
  blockIndex: number;
  onEditField: (
    sectionIndex: number,
    blockIndex: number,
    fieldIndex: number
  ) => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header del campo */}
      <div className="flex items-center justify-between p-3 border-b border-gray-200">
        <div className="flex items-center space-x-3 flex-1">
          <div className="cursor-move text-[#283618]/50 hover:text-[#283618]">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h6 className="text-sm font-medium text-[#283618]">
                {field.display_name || "Sin nombre"}
              </h6>
              <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-medium">
                {FIELD_TYPES.find((t) => t.value === field.type)?.label ||
                  field.type}
              </span>
            </div>
            <div className="text-xs text-[#283618]/70">
              ID: {field.field_id} • Form: {field.form ? "✓" : "✗"} • Bulletin:{" "}
              {field.bulletin ? "✓" : "✗"}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onEditField(sectionIndex, blockIndex, fieldIndex)}
            className="p-1 text-[#bc6c25] hover:bg-orange-50 rounded transition-colors"
            title="Configurar campo completo"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemoveField(fieldIndex)}
            className="text-[#283618]/50 hover:text-red-600 p-1 rounded"
            title="Eliminar campo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vista resumida expandible */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h6 className="font-medium text-blue-900 mb-1">
                  Campo: {field.display_name}
                </h6>
                <p className="text-sm text-blue-700">
                  Tipo:{" "}
                  {FIELD_TYPES.find((t) => t.value === field.type)?.label ||
                    field.type}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  {field.bulletin
                    ? "✓ Se muestra en boletín"
                    : "○ No se muestra en boletín"}
                </p>
              </div>
              <button
                onClick={() =>
                  onEditField(sectionIndex, blockIndex, fieldIndex)
                }
                className="px-3 py-2 bg-[#bc6c25] text-white rounded-lg hover:bg-[#8b5220] transition-colors text-sm font-medium"
              >
                Configurar Campo
              </button>
            </div>
          </div>

          {/* Información básica del campo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium text-gray-700 mb-1">Configuración:</p>
              <p className="text-gray-600">
                {field.field_config ? "Configurado" : "Sin configurar"}
              </p>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <p className="font-medium text-gray-700 mb-1">Estilos:</p>
              <p className="text-gray-600">
                {field.style_config ? "Personalizados" : "Por defecto"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Tipos de campo disponibles con sus configuraciones
const FIELD_TYPES = [
  {
    value: "text",
    label: "Texto",
    description: "Campo de texto corto o largo",
  },
  {
    value: "text_with_icon",
    label: "Texto con Icono",
    description: "Texto que incluye selección de icono",
  },
  { value: "number", label: "Número", description: "Campo numérico" },
  { value: "date", label: "Fecha", description: "Selector de fecha" },
  {
    value: "date_range",
    label: "Rango de Fechas",
    description: "Selección de fecha inicial y final",
  },
  {
    value: "select",
    label: "Selección",
    description: "Lista desplegable de opciones",
  },
  {
    value: "select_with_icons",
    label: "Selección con Iconos",
    description: "Lista con iconos para cada opción",
  },
  {
    value: "select_background",
    label: "Selección de Fondo",
    description: "Lista con imágenes de fondo",
  },
  {
    value: "image_upload",
    label: "Subir Imagen",
    description: "Campo para cargar imágenes",
  },
  {
    value: "list",
    label: "Lista",
    description: "Lista de elementos dinámicos",
  },
  {
    value: "climate_data_puntual",
    label: "Datos Climáticos",
    description: "Datos climáticos puntuales",
  },
  {
    value: "algorithm",
    label: "Algoritmo",
    description: "Selección de algoritmo",
  },
  {
    value: "page_number",
    label: "Número de Página",
    description: "Numeración automática de páginas",
  },
  { value: "card", label: "Tarjeta", description: "Elemento tipo tarjeta" },
  {
    value: "background_url",
    label: "URL de Fondo",
    description: "URL de imagen de fondo",
  },
];

function BlockConfiguration({
  block,
  sectionIndex,
  blockIndex,
  onUpdateBlock,
  onEditField,
}: BlockConfigurationProps) {
  const [expandedField, setExpandedField] = useState<number | null>(null);

  const addField = () => {
    const newField: Field = {
      field_id: `field_${Date.now()}`,
      display_name: "Nuevo Campo",
      type: "text",
      form: true,
      bulletin: true,
      field_config: { subtype: "short" },
    };

    const updatedFields = [...block.fields, newField];
    onUpdateBlock(sectionIndex, blockIndex, { fields: updatedFields });
  };

  const updateField = (fieldIndex: number, updates: Partial<Field>) => {
    const updatedFields = [...block.fields];
    updatedFields[fieldIndex] = {
      ...updatedFields[fieldIndex],
      ...updates,
    } as Field;
    onUpdateBlock(sectionIndex, blockIndex, { fields: updatedFields });
  };

  const removeField = (fieldIndex: number) => {
    const updatedFields = block.fields.filter(
      (_, index) => index !== fieldIndex
    );
    onUpdateBlock(sectionIndex, blockIndex, { fields: updatedFields });
  };

  const getFieldConfigDefaults = (fieldType: string) => {
    switch (fieldType) {
      case "text":
        return { subtype: "short" };
      case "text_with_icon":
        return { subtype: "short", icon_options: [] };
      case "select":
        return { options: [], allow_multiple: false };
      case "select_with_icons":
        return { options: [], allow_multiple: false, icons_url: [] };
      case "select_background":
        return { options: [], allow_multiple: false, backgrounds_url: [] };
      case "date":
        return { date_format: "DD/MM/YYYY" };
      case "date_range":
        return {
          date_format: "DD/MM/YYYY",
          start_date_label: "Fecha inicio",
          start_date_description: "Seleccione la fecha de inicio",
          end_date_label: "Fecha fin",
          end_date_description: "Seleccione la fecha de fin",
        };
      case "image_upload":
        return {
          max_file_size: "5MB",
          allowed_formats: ["jpg", "jpeg", "png"],
        };
      case "list":
        return {
          max_items: 10,
          min_items: 1,
          item_schema: {
            item_name: {
              field_id: "item_name",
              display_name: "Nombre del elemento",
              type: "text",
              form: true,
              bulletin: true,
            },
            item_description: {
              field_id: "item_description",
              display_name: "Descripción",
              type: "text",
              form: true,
              bulletin: false,
            },
          },
        };
      case "climate_data_puntual":
        return { available_parameters: {} };
      case "algorithm":
        return { options: [] };
      case "page_number":
        return { format: "Página {page} de {total}", is_autogenerated: true };
      case "card":
        return { card_type: "default" };
      case "background_url":
        return { background_url: "" };
      default:
        return {};
    }
  };

  return (
    <div className="p-4 bg-gray-50 space-y-4">
      <div>
        <h5 className="text-md font-medium text-[#283618] mb-4">
          Configuración del Bloque
        </h5>

        {/* Nombre del bloque */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#283618] mb-1">
            Nombre del bloque
          </label>
          <input
            type="text"
            value={block.display_name}
            onChange={(e) =>
              onUpdateBlock(sectionIndex, blockIndex, {
                display_name: e.target.value,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm
                       focus:outline-none focus:ring-2 focus:ring-[#bc6c25] focus:border-[#bc6c25]"
            placeholder="Ingrese el nombre del bloque"
          />
          <p className="text-xs text-[#283618]/50 mt-1">
            Este nombre ayuda a identificar el bloque en la configuración
          </p>
        </div>
      </div>

      {/* Gestión de campos */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h6 className="text-sm font-medium text-[#283618]">
            Campos del Bloque ({block.fields.length})
          </h6>
          <button
            onClick={addField}
            className="inline-flex items-center px-3 py-1 border border-[#bc6c25] text-xs 
                       font-medium rounded text-[#283618] hover:bg-[#bc6c25]/5 
                       focus:outline-none focus:ring-1 focus:ring-[#bc6c25]"
          >
            <Plus className="w-3 h-3 mr-1" />
            Agregar Campo
          </button>
        </div>

        {block.fields.length === 0 ? (
          <div className="text-center py-8 bg-gray-100 rounded-lg border border-gray-200">
            <div className="text-[#283618]/70">
              <Edit3 className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No hay campos configurados</p>
              <p className="text-xs text-[#283618]/50 mt-1">
                Los campos definen qué información se recopiará en este bloque
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {block.fields.map((field, fieldIndex) => (
              <FieldConfiguration
                key={`${field.field_id}-${fieldIndex}`}
                field={field}
                fieldIndex={fieldIndex}
                isExpanded={expandedField === fieldIndex}
                onToggleExpand={() =>
                  setExpandedField(
                    expandedField === fieldIndex ? null : fieldIndex
                  )
                }
                onUpdateField={updateField}
                onRemoveField={removeField}
                getFieldConfigDefaults={getFieldConfigDefaults}
                sectionIndex={sectionIndex}
                blockIndex={blockIndex}
                onEditField={onEditField}
              />
            ))}
          </div>
        )}
      </div>

      {/* Información del bloque */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-gray-200">
        <div>
          <label className="block text-sm font-medium text-[#283618] mb-1">
            ID del Bloque
          </label>
          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm font-mono text-[#283618]/70">
            {block.block_id}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#283618] mb-1">
            Total de Campos
          </label>
          <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-sm text-[#283618]">
            {block.fields.length} campos configurados
          </div>
        </div>
      </div>
    </div>
  );
}

export function SectionsStep({
  data,
  errors,
  onDataChange,
  onErrorsChange,
  selectedSectionIndex = 0,
  onSectionSelect,
}: SectionsStepProps) {
  const t = useTranslations("CreateTemplate.sections");
  const [activeTab, setActiveTab] = useState<
    "overview" | "blocks" | "header" | "footer" | "style"
  >("overview");
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<{
    sectionIndex: number;
    blockIndex: number;
    fieldIndex: number;
  } | null>(null);

  // Manejar tecla Escape para cerrar el modal del editor de campos
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && editingField) {
        setEditingField(null);
      }
    };

    if (editingField) {
      document.addEventListener("keydown", handleEscapeKey);
      return () => {
        document.removeEventListener("keydown", handleEscapeKey);
      };
    }
  }, [editingField]);

  const addSection = useCallback(() => {
    const newSection: Section = {
      section_id: `section_${Date.now()}`,
      display_name: "Nueva Sección",
      background_url: [],
      order: data.version.content.sections.length + 1,
      icon_url: "",
      blocks: [],
    };

    onDataChange((prevData) => ({
      ...prevData,
      version: {
        ...prevData.version,
        content: {
          ...prevData.version.content,
          sections: [...prevData.version.content.sections, newSection],
        },
      },
    }));
  }, [data.version.content.sections.length, onDataChange]);

  const updateSection = useCallback(
    (sectionIndex: number, updates: Partial<Section>) => {
      onDataChange((prevData) => {
        const updatedSections = [...prevData.version.content.sections];
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          ...updates,
        };

        return {
          ...prevData,
          version: {
            ...prevData.version,
            content: {
              ...prevData.version.content,
              sections: updatedSections,
            },
          },
        };
      });
    },
    [onDataChange]
  );

  const removeSection = useCallback(
    (sectionIndex: number) => {
      onDataChange((prevData) => {
        const updatedSections = prevData.version.content.sections.filter(
          (_, index) => index !== sectionIndex
        );
        // Re-ordenar las secciones
        const reorderedSections = updatedSections.map((section, index) => ({
          ...section,
          order: index + 1,
        }));

        return {
          ...prevData,
          version: {
            ...prevData.version,
            content: {
              ...prevData.version.content,
              sections: reorderedSections,
            },
          },
        };
      });
    },
    [onDataChange]
  );

  const duplicateSection = useCallback(
    (sectionIndex: number) => {
      const sectionToDuplicate = data.version.content.sections[sectionIndex];
      const duplicatedSection: Section = {
        ...sectionToDuplicate,
        section_id: `${sectionToDuplicate.section_id}_copy_${Date.now()}`,
        display_name: `${sectionToDuplicate.display_name} (Copia)`,
        order: data.version.content.sections.length + 1,
      };

      onDataChange((prevData) => ({
        ...prevData,
        version: {
          ...prevData.version,
          content: {
            ...prevData.version.content,
            sections: [...prevData.version.content.sections, duplicatedSection],
          },
        },
      }));
    },
    [data.version.content.sections, onDataChange]
  );

  const addBlock = useCallback(
    (sectionIndex: number) => {
      const newBlock: Block = {
        block_id: `block_${Date.now()}`,
        display_name: "Nuevo Bloque",
        fields: [],
      };

      updateSection(sectionIndex, {
        blocks: [
          ...data.version.content.sections[sectionIndex].blocks,
          newBlock,
        ],
      });
    },
    [data.version.content.sections, updateSection]
  );

  const updateBlock = useCallback(
    (sectionIndex: number, blockIndex: number, updates: Partial<Block>) => {
      const updatedBlocks = [
        ...data.version.content.sections[sectionIndex].blocks,
      ];
      updatedBlocks[blockIndex] = { ...updatedBlocks[blockIndex], ...updates };

      updateSection(sectionIndex, { blocks: updatedBlocks });
    },
    [data.version.content.sections, updateSection]
  );

  const removeBlock = useCallback(
    (sectionIndex: number, blockIndex: number) => {
      const updatedBlocks = data.version.content.sections[
        sectionIndex
      ].blocks.filter((_, index) => index !== blockIndex);
      updateSection(sectionIndex, { blocks: updatedBlocks });
    },
    [data.version.content.sections, updateSection]
  );

  const currentSection = data.version.content.sections[selectedSectionIndex];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[#283618] mb-4">
          {t("title")}
        </h2>
        <p className="text-[#283618]/70">{t("description")}</p>
      </div>

      {/* Información importante */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Eye className="w-5 h-5 text-blue-600 mt-0.5" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-blue-900 mb-1">
              Estructura del Boletín
            </h3>
            <p className="text-xs text-blue-700">
              Cada sección será <strong>una página independiente</strong> en el
              boletín final. Configura cada sección con sus bloques, estilos y
              contenido específico.
            </p>
          </div>
        </div>
      </div>

      {/* Secciones vacías */}
      {data.version.content.sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-[#283618]/70">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium mb-2">{t("empty.title")}</h3>
            <p className="text-sm mb-4">{t("empty.description")}</p>
            <button
              onClick={addSection}
              className="inline-flex items-center px-4 py-2 border-2 border-[#bc6c25] text-sm 
                         font-medium rounded-md text-[#283618] hover:border-[#bc6c25]/50 
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bc6c25]"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("empty.addFirst")}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Pestañas de navegación entre secciones */}
          <div className="border-b border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-[#283618]">
                  Secciones ({data.version.content.sections.length})
                </span>
                <span className="text-xs text-[#283618]/70">
                  • Navegue entre páginas usando las pestañas
                </span>
              </div>
              <button
                onClick={addSection}
                className="inline-flex items-center px-3 py-1 border border-[#bc6c25] text-xs 
                           font-medium rounded text-[#283618] hover:bg-[#bc6c25]/5 
                           focus:outline-none focus:ring-1 focus:ring-[#bc6c25]"
              >
                <Plus className="w-3 h-3 mr-1" />
                Agregar Sección
              </button>
            </div>
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              {data.version.content.sections.map((section, index) => (
                <button
                  key={`tab-${section.section_id}-${index}`}
                  onClick={() => onSectionSelect?.(index)}
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                    selectedSectionIndex === index
                      ? "border-[#bc6c25] text-[#bc6c25]"
                      : "border-transparent text-[#283618]/70 hover:text-[#283618] hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                      {index + 1}
                    </span>
                    <span>
                      {section.display_name || `Sección ${index + 1}`}
                    </span>
                    {section.icon_url && (
                      <img src={section.icon_url} alt="" className="w-4 h-4" />
                    )}
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenido de la sección actual */}
          {currentSection && (
            <div className="bg-white rounded-lg border border-gray-200">
              {/* Header de la sección con información */}
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-xl font-semibold text-[#283618]">
                        {currentSection.display_name || "Sin nombre"}
                      </h3>
                    </div>
                    <div className="text-sm text-[#283618]/70 mt-1">
                      Página {currentSection.order} •{" "}
                      {currentSection.blocks.length} bloques • ID:{" "}
                      {currentSection.section_id}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => duplicateSection(selectedSectionIndex)}
                      className="text-[#283618]/50 hover:text-blue-600 p-1 rounded"
                      title="Duplicar sección"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => removeSection(selectedSectionIndex)}
                      className="text-[#283618]/50 hover:text-red-600 p-1 rounded"
                      title="Eliminar sección"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Pestañas de configuración */}
              <div className="px-6 pt-4">
                <div className="border-b border-gray-200">
                  <nav className="-mb-px flex space-x-8">
                    <button
                      onClick={() => setActiveTab("overview")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "overview"
                          ? "border-[#bc6c25] text-[#bc6c25]"
                          : "border-transparent text-[#283618]/70 hover:text-[#283618] hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4" />
                        <span>General</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab("blocks")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "blocks"
                          ? "border-[#bc6c25] text-[#bc6c25]"
                          : "border-transparent text-[#283618]/70 hover:text-[#283618] hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Layout className="w-4 h-4" />
                        <span>Bloques ({currentSection.blocks.length})</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab("header")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "header"
                          ? "border-[#bc6c25] text-[#bc6c25]"
                          : "border-transparent text-[#283618]/70 hover:text-[#283618] hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Layout className="w-4 h-4" />
                        <span>Header</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab("footer")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "footer"
                          ? "border-[#bc6c25] text-[#bc6c25]"
                          : "border-transparent text-[#283618]/70 hover:text-[#283618] hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Layout className="w-4 h-4" />
                        <span>Footer</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setActiveTab("style")}
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === "style"
                          ? "border-[#bc6c25] text-[#bc6c25]"
                          : "border-transparent text-[#283618]/70 hover:text-[#283618] hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Palette className="w-4 h-4" />
                        <span>Estilos</span>
                      </div>
                    </button>
                  </nav>
                </div>
              </div>

              {/* Contenido de las pestañas */}
              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    {/* Configuración básica */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-medium text-[#283618]">
                          Configuración General
                        </h3>
                        <div className="text-xs text-[#283618]/60 bg-blue-50 px-2 py-1 rounded">
                          💡 Edite aquí el nombre y configuración de la sección
                        </div>
                      </div>

                      {/* Nombre de la sección */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-[#283618] mb-1">
                          Nombre de la sección
                        </label>
                        <input
                          type="text"
                          value={currentSection.display_name}
                          onChange={(e) =>
                            updateSection(selectedSectionIndex, {
                              display_name: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm
                                     focus:outline-none focus:ring-2 focus:ring-[#bc6c25] focus:border-[#bc6c25]"
                          placeholder="Ingrese el nombre de la sección"
                        />
                        <p className="text-xs text-[#283618]/50 mt-1">
                          Este nombre aparecerá en la navegación y en el preview
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-[#283618] mb-1">
                            Orden de página
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={currentSection.order}
                            onChange={(e) =>
                              updateSection(selectedSectionIndex, {
                                order: parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm
                                       focus:outline-none focus:ring-2 focus:ring-[#bc6c25] focus:border-[#bc6c25]"
                          />
                          <p className="text-xs text-[#283618]/50 mt-1">
                            Define el orden de esta página en el boletín final
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#283618] mb-1">
                            URL del icono
                          </label>
                          <input
                            type="text"
                            value={currentSection.icon_url || ""}
                            onChange={(e) =>
                              updateSection(selectedSectionIndex, {
                                icon_url: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm
                                       focus:outline-none focus:ring-2 focus:ring-[#bc6c25] focus:border-[#bc6c25]"
                            placeholder="https://ejemplo.com/icono.png"
                          />
                          <p className="text-xs text-[#283618]/50 mt-1">
                            Icono opcional que aparecerá junto al nombre de la
                            sección
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Información de la sección */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-md font-medium text-[#283618] mb-2">
                        Información de la Sección
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-[#283618]/70">
                            ID de Sección:
                          </span>
                          <div className="font-mono text-xs bg-white px-2 py-1 rounded border mt-1">
                            {currentSection.section_id}
                          </div>
                        </div>
                        <div>
                          <span className="text-[#283618]/70">
                            Total de Bloques:
                          </span>
                          <div className="font-medium text-[#283618] mt-1">
                            {currentSection.blocks.length}
                          </div>
                        </div>
                        <div>
                          <span className="text-[#283618]/70">
                            Campos Totales:
                          </span>
                          <div className="font-medium text-[#283618] mt-1">
                            {currentSection.blocks.reduce(
                              (total, block) => total + block.fields.length,
                              0
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "blocks" && (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-[#283618]">
                        Bloques de Contenido
                      </h3>
                      <button
                        onClick={() => addBlock(selectedSectionIndex)}
                        className="inline-flex items-center px-3 py-2 border-2 border-[#bc6c25] text-sm 
                                   font-medium rounded-md text-[#283618] hover:border-[#bc6c25]/50 
                                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bc6c25]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Bloque
                      </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-blue-700 text-sm">
                        Los bloques organizan el contenido dentro de cada
                        página. Cada bloque puede contener múltiples campos con
                        diferentes tipos de información.
                      </p>
                    </div>

                    {currentSection.blocks.length === 0 ? (
                      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="text-[#283618]/70">
                          <div className="text-4xl mb-4">📦</div>
                          <h4 className="text-md font-medium mb-2">
                            No hay bloques
                          </h4>
                          <p className="text-sm mb-4">
                            Los bloques organizan el contenido dentro de cada
                            página.
                          </p>
                          <button
                            onClick={() => addBlock(selectedSectionIndex)}
                            className="inline-flex items-center px-3 py-2 border-2 border-[#bc6c25] text-sm 
                                       font-medium rounded-md text-[#283618] hover:border-[#bc6c25]/50"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Primer Bloque
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {currentSection.blocks.map((block, blockIndex) => (
                          <div
                            key={`${block.block_id}-${blockIndex}`}
                            className="border border-gray-200 rounded-lg bg-white"
                          >
                            <div className="flex items-center justify-between p-4 border-b border-gray-200">
                              <div className="flex items-center space-x-3 flex-1">
                                <div className="cursor-move text-[#283618]/50 hover:text-[#283618]">
                                  <GripVertical className="w-5 h-5" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <h4 className="text-lg font-medium text-[#283618]">
                                      {block.display_name || "Sin nombre"}
                                    </h4>
                                    {expandedBlock === blockIndex && (
                                      <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-medium">
                                        ⚙️ Configurando
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-sm text-[#283618]/70">
                                    ID: {block.block_id} • {block.fields.length}{" "}
                                    campos
                                    {expandedBlock === blockIndex && (
                                      <span className="ml-2 text-orange-600">
                                        • Edite el nombre abajo ↓
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() =>
                                    setExpandedBlock(
                                      expandedBlock === blockIndex
                                        ? null
                                        : blockIndex
                                    )
                                  }
                                  className={`p-1 rounded transition-colors ${
                                    expandedBlock === blockIndex
                                      ? "text-[#bc6c25] bg-[#bc6c25]/10"
                                      : "text-[#283618]/50 hover:text-[#283618]"
                                  }`}
                                  title={
                                    expandedBlock === blockIndex
                                      ? "Cerrar configuración"
                                      : "Configurar bloque"
                                  }
                                >
                                  <Settings className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() =>
                                    removeBlock(
                                      selectedSectionIndex,
                                      blockIndex
                                    )
                                  }
                                  className="text-[#283618]/50 hover:text-red-600 p-1 rounded"
                                  title="Eliminar bloque"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {expandedBlock === blockIndex && (
                              <BlockConfiguration
                                block={block}
                                sectionIndex={selectedSectionIndex}
                                blockIndex={blockIndex}
                                onUpdateBlock={updateBlock}
                                onEditField={(sectionIdx, blockIdx, fieldIdx) =>
                                  setEditingField({
                                    sectionIndex: sectionIdx,
                                    blockIndex: blockIdx,
                                    fieldIndex: fieldIdx,
                                  })
                                }
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "header" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-[#283618]">
                      Header de Sección
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-700 text-sm">
                        <strong>Header específico de sección:</strong> Se
                        muestra solo en esta página y reemplaza el header
                        global. Si no se configura, se usará el header global
                        definido en el paso anterior.
                      </p>
                    </div>
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-[#283618]/70">
                        <Layout className="w-8 h-8 mx-auto mb-4" />
                        <h4 className="text-md font-medium mb-2">
                          Configuración de Header
                        </h4>
                        <p className="text-sm mb-4">
                          Personaliza el header específico para esta sección
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-700 text-sm">
                          🚧 Esta funcionalidad será implementada en la próxima
                          iteración
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "footer" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-[#283618]">
                      Footer de Sección
                    </h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-blue-700 text-sm">
                        <strong>Footer específico de sección:</strong> Se
                        muestra solo en esta página y reemplaza el footer
                        global. Si no se configura, se usará el footer global
                        definido en el paso anterior.
                      </p>
                    </div>
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-[#283618]/70">
                        <Layout className="w-8 h-8 mx-auto mb-4" />
                        <h4 className="text-md font-medium mb-2">
                          Configuración de Footer
                        </h4>
                        <p className="text-sm mb-4">
                          Personaliza el footer específico para esta sección
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-700 text-sm">
                          🚧 Esta funcionalidad será implementada en la próxima
                          iteración
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "style" && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-[#283618]">
                      Estilos de Sección
                    </h3>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-700 text-sm">
                        <strong>Estilos específicos de sección:</strong> Estos
                        estilos afectan solo a esta página y sus bloques,
                        sobrescribiendo los estilos globales cuando sea
                        necesario.
                      </p>
                    </div>
                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <div className="text-[#283618]/70">
                        <Palette className="w-8 h-8 mx-auto mb-4" />
                        <h4 className="text-md font-medium mb-2">
                          Configuración de Estilos
                        </h4>
                        <p className="text-sm mb-4">
                          Personaliza colores, fuentes y layout para esta
                          sección
                        </p>
                        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-yellow-700 text-sm">
                          🚧 Esta funcionalidad será implementada en la próxima
                          iteración
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Editor de Campo Modal */}
      {editingField && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => setEditingField(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[#283618]">
                Configurar Campo -{" "}
                {
                  data.version.content.sections[editingField.sectionIndex]
                    ?.blocks[editingField.blockIndex]?.fields[
                    editingField.fieldIndex
                  ]?.display_name
                }
              </h2>
              <button
                onClick={() => setEditingField(null)}
                className="text-[#283618]/60 hover:text-[#283618] text-2xl leading-none"
                title="Cerrar editor"
              >
                ×
              </button>
            </div>

            <div className="overflow-y-auto max-h-[80vh]">
              <FieldEditor
                field={
                  data.version.content.sections[editingField.sectionIndex]
                    ?.blocks[editingField.blockIndex]?.fields[
                    editingField.fieldIndex
                  ] as Field
                }
                onFieldChange={(updatedField: Field) => {
                  onDataChange((prevData) => {
                    const newData = { ...prevData };
                    newData.version.content.sections[
                      editingField.sectionIndex
                    ].blocks[editingField.blockIndex].fields[
                      editingField.fieldIndex
                    ] = updatedField;
                    return newData;
                  });
                }}
                onClose={() => setEditingField(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
