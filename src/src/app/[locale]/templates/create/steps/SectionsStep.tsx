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
  Loader2,
} from "lucide-react";
import {
  CreateTemplateData,
  Section,
  Block,
  Field,
  HeaderFooterConfig,
} from "../../../../../types/template";
import { StyleConfig } from "../../../../../types/core";
import { FieldEditor } from "../components/FieldEditor";
import { StyleConfigurator } from "../components/StyleConfigurator";
import { HeaderFooterConfigurator } from "../components/HeaderFooterConfigurator";
import { SmartIcon } from "../../../components/AdaptiveSvgIcon";
import { btnOutlineSecondary } from "@/app/[locale]/components/ui";
import { VisualResourcesService } from "@/services/visualResourcesService";
import { VisualResource } from "@/types/visualResource";
import Image from "next/image";

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
  onFieldDragStart: (
    sectionIndex: number,
    blockIndex: number,
    fieldIndex: number
  ) => void;
  onFieldDragEnd: () => void;
  onFieldDragOver: (e: React.DragEvent) => void;
  onFieldDrop: (
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
  const t = useTranslations("CreateTemplate.headerFooter");

  return (
    <div className="border rounded-lg p-4 transition-all duration-200 border-gray-200 bg-gray-50 hover:shadow-md hover:border-gray-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {/* Icono de arrastre */}
          <div
            className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 rounded hover:bg-gray-200 transition-colors"
            title="Arrastra para reordenar"
          >
            <GripVertical className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-medium text-[#283618]">{field.display_name}</h4>
            <p className="text-sm text-[#283618]/50">
              {t("fields.type")}: {field.type}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onEditField(sectionIndex, blockIndex, fieldIndex)}
            className="text-[#283618]/50 hover:text-[#283618] cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemoveField(fieldIndex)}
            className="text-[#283618]/50 hover:text-red-600 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="text-sm text-[#283618] grid grid-cols-2 gap-2">
        <div>
          {t("fields.form")}:
          <span className={field.form ? "text-green-600" : "text-[#283618]/50"}>
            {field.form ? " Sí" : " No"}
          </span>
        </div>
        <div>
          {t("fields.bulletin")}:
          <span
            className={field.bulletin ? "text-green-600" : "text-[#283618]/50"}
          >
            {field.bulletin ? " Sí" : " No"}
          </span>
        </div>
      </div>
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
    value: "image",
    label: "Imagen",
    description: "Selector de imagen de fondo",
  },
];

function BlockConfiguration({
  block,
  sectionIndex,
  blockIndex,
  onUpdateBlock,
  onEditField,
  onFieldDragStart,
  onFieldDragEnd,
  onFieldDragOver,
  onFieldDrop,
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
      case "image":
        return { images: [] };
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

        {/* Estilos del bloque */}
        <div className="mb-4">
          <h6 className="text-sm font-medium text-[#283618] mb-2 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Estilos del Bloque
          </h6>
          <StyleConfigurator
            styleConfig={block.style_config || {}}
            onStyleChange={(updates) => {
              onUpdateBlock(sectionIndex, blockIndex, {
                style_config: { ...block.style_config, ...updates },
              });
            }}
            enabledFields={{
              primaryColor: true,
              backgroundColor: true,
              backgroundImage: true,
              borderColor: true,
              borderWidth: true,
              borderRadius: true,
              padding: true,
              margin: true,
              gap: true,
              fieldsLayout: true,
            }}
            title="Estilos del Bloque"
            description="Los estilos del bloque se aplicarán al contenedor que agrupa los campos"
            showPreview={false}
          />
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
            className={`${btnOutlineSecondary} text-sm`}
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
              <div
                key={`${field.field_id}-${fieldIndex}`}
                draggable
                onDragStart={() =>
                  onFieldDragStart(sectionIndex, blockIndex, fieldIndex)
                }
                onDragEnd={onFieldDragEnd}
                onDragOver={onFieldDragOver}
                onDrop={() => onFieldDrop(sectionIndex, blockIndex, fieldIndex)}
              >
                <FieldConfiguration
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
              </div>
            ))}
          </div>
        )}
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
    "overview" | "blocks" | "header" | "footer"
  >("overview");
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<{
    sectionIndex: number;
    blockIndex: number;
    fieldIndex: number;
  } | null>(null);

  // Estados para el selector de iconos
  const [availableIcons, setAvailableIcons] = useState<VisualResource[]>([]);
  const [loadingIcons, setLoadingIcons] = useState(false);
  const [showIconSelector, setShowIconSelector] = useState(false);

  // Estado para drag and drop de campos
  const [draggedItem, setDraggedItem] = useState<{
    sectionIndex: number;
    blockIndex: number;
    fieldIndex: number;
  } | null>(null);

  // Cargar iconos disponibles al montar el componente
  useEffect(() => {
    const loadIcons = async () => {
      setLoadingIcons(true);
      try {
        const response = await VisualResourcesService.getAllVisualResources();
        if (response.success && response.data) {
          const icons = response.data.filter(
            (resource) =>
              resource.file_type === "icon" && resource.status === "active"
          );
          setAvailableIcons(icons);
        }
      } catch (error) {
        console.error("Error loading icons:", error);
      } finally {
        setLoadingIcons(false);
      }
    };

    loadIcons();
  }, []);

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

  const updateSectionHeaderConfig = useCallback(
    (sectionIndex: number, updates: Partial<HeaderFooterConfig>) => {
      onDataChange((prevData) => {
        const updatedSections = [...prevData.version.content.sections];
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          header_config: {
            ...(updatedSections[sectionIndex].header_config || { fields: [] }),
            ...updates,
          },
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

  const updateSectionFooterConfig = useCallback(
    (sectionIndex: number, updates: Partial<HeaderFooterConfig>) => {
      onDataChange((prevData) => {
        const updatedSections = [...prevData.version.content.sections];
        updatedSections[sectionIndex] = {
          ...updatedSections[sectionIndex],
          footer_config: {
            ...(updatedSections[sectionIndex].footer_config || { fields: [] }),
            ...updates,
          },
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

  // Funciones para drag and drop de campos
  const handleFieldDragStart = useCallback(
    (sectionIndex: number, blockIndex: number, fieldIndex: number) => {
      setDraggedItem({ sectionIndex, blockIndex, fieldIndex });
    },
    []
  );

  const handleFieldDragEnd = useCallback(() => {
    setDraggedItem(null);
  }, []);

  const handleFieldDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleFieldDrop = useCallback(
    (
      targetSectionIndex: number,
      targetBlockIndex: number,
      targetFieldIndex: number
    ) => {
      if (!draggedItem) return;

      // Si es el mismo campo, no hacer nada
      if (
        draggedItem.sectionIndex === targetSectionIndex &&
        draggedItem.blockIndex === targetBlockIndex &&
        draggedItem.fieldIndex === targetFieldIndex
      ) {
        setDraggedItem(null);
        return;
      }

      // Obtener los bloques
      const sourceSection =
        data.version.content.sections[draggedItem.sectionIndex];
      const sourceBlock = sourceSection.blocks[draggedItem.blockIndex];
      const targetSection = data.version.content.sections[targetSectionIndex];
      const targetBlock = targetSection.blocks[targetBlockIndex];

      // Clonar arrays para no mutar el estado directamente
      const sourceFields = [...sourceBlock.fields];
      const targetFields =
        draggedItem.sectionIndex === targetSectionIndex &&
        draggedItem.blockIndex === targetBlockIndex
          ? sourceFields
          : [...targetBlock.fields];

      // Remover el campo del origen
      const [movedField] = sourceFields.splice(draggedItem.fieldIndex, 1);

      // Insertar el campo en el destino
      const insertIndex =
        draggedItem.sectionIndex === targetSectionIndex &&
        draggedItem.blockIndex === targetBlockIndex &&
        draggedItem.fieldIndex < targetFieldIndex
          ? targetFieldIndex - 1
          : targetFieldIndex;

      targetFields.splice(insertIndex, 0, movedField);

      // Actualizar el estado
      onDataChange((prevData) => {
        const updatedSections = [...prevData.version.content.sections];

        // Actualizar el bloque origen
        if (
          draggedItem.sectionIndex === targetSectionIndex &&
          draggedItem.blockIndex === targetBlockIndex
        ) {
          // Mismo bloque
          updatedSections[targetSectionIndex] = {
            ...targetSection,
            blocks: targetSection.blocks.map((block, idx) =>
              idx === targetBlockIndex
                ? { ...block, fields: targetFields }
                : block
            ),
          };
        } else {
          // Diferentes bloques
          updatedSections[draggedItem.sectionIndex] = {
            ...sourceSection,
            blocks: sourceSection.blocks.map((block, idx) =>
              idx === draggedItem.blockIndex
                ? { ...block, fields: sourceFields }
                : block
            ),
          };
          updatedSections[targetSectionIndex] = {
            ...targetSection,
            blocks: targetSection.blocks.map((block, idx) =>
              idx === targetBlockIndex
                ? { ...block, fields: targetFields }
                : block
            ),
          };
        }

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

      setDraggedItem(null);
    },
    [draggedItem, data.version.content.sections, onDataChange]
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

      {/* Secciones vacías */}
      {data.version.content.sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-[#283618]/70">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium mb-2">{t("empty.title")}</h3>
            <p className="text-sm mb-4">{t("empty.description")}</p>
            <button onClick={addSection} className={btnOutlineSecondary}>
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
              </div>
              <button
                onClick={addSection}
                className={`${btnOutlineSecondary} py-1 px-2 text-sm`}
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
                  className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                    selectedSectionIndex === index
                      ? "border-[#bc6c25] text-[#bc6c25]"
                      : "border-transparent text-[#283618]/70 hover:text-[#283618] hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="bg-[#bc6c25]/10 text-[#bc6c25] px-2 py-1 rounded text-xs font-medium">
                      {index + 1}
                    </span>
                    {section.icon_url && (
                      <SmartIcon src={section.icon_url} className="w-4 h-4" />
                    )}
                    <span>
                      {section.display_name || `Sección ${index + 1}`}
                    </span>
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
                      <h3 className="text-xl font-semibold text-[#283618] flex items-center gap-2">
                        {currentSection.icon_url && (
                          <SmartIcon
                            src={currentSection.icon_url}
                            className="w-5 h-5"
                            color="#283618"
                          />
                        )}
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
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
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
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
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
                      className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
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
                          Este nombre aparecerá en la navegación.
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
                            Icono de la Sección
                          </label>

                          {/* Preview del icono seleccionado */}
                          {currentSection.icon_url && (
                            <div className="mb-3 p-3 bg-gray-50 rounded-md border border-gray-200 flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <Image
                                  src={currentSection.icon_url}
                                  alt="Selected icon"
                                  width={32}
                                  height={32}
                                  className="object-contain"
                                />
                                <span className="text-sm text-gray-600">
                                  Icono seleccionado
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  updateSection(selectedSectionIndex, {
                                    icon_url: "",
                                  })
                                }
                                className="text-red-600 hover:text-red-800 text-sm"
                              >
                                Quitar
                              </button>
                            </div>
                          )}

                          {/* Botón para abrir selector */}
                          <button
                            type="button"
                            onClick={() => setShowIconSelector(true)}
                            disabled={loadingIcons}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bc6c25] disabled:opacity-50"
                          >
                            {loadingIcons ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                Cargando iconos...
                              </>
                            ) : (
                              <>
                                {currentSection.icon_url
                                  ? "Cambiar icono"
                                  : "Seleccionar icono"}
                              </>
                            )}
                          </button>

                          <p className="text-xs text-[#283618]/50 mt-1">
                            Icono opcional que aparecerá junto al nombre de la
                            sección
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Configuración de Estilos */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <StyleConfigurator
                        styleConfig={currentSection.style_config || {}}
                        onStyleChange={(updates: Partial<StyleConfig>) => {
                          updateSection(selectedSectionIndex, {
                            style_config: {
                              ...(currentSection.style_config || {}),
                              ...updates,
                            },
                          });
                        }}
                        enabledFields={{
                          primaryColor: true,
                          secondaryColor: true,
                          backgroundColor: true,
                          backgroundImage: true,
                          font: true,
                          fontSize: true,
                          fontWeight: true,
                          fontStyle: true,
                          textDecoration: true,
                          textAlign: true,
                          padding: true,
                          margin: true,
                          borderColor: true,
                          borderWidth: true,
                          borderRadius: true,
                        }}
                        title="Estilos de la Sección"
                        description="Estos estilos se aplicarán a todos los bloques y campos de esta sección, a menos que sean sobrescritos."
                        showPreview={false}
                        isFieldStyle={false}
                      />
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
                        className={`${btnOutlineSecondary} py-1 px-2 text-sm`}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar Bloque
                      </button>
                    </div>

                    <div className="bg-[#bc6c25]/10 border border-[#bc6c25] rounded-lg p-3">
                      <p className="text-[#bc6c25] text-sm">
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
                            className={btnOutlineSecondary}
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
                                  </div>
                                  <div className="text-sm text-[#283618]/70">
                                    ID: {block.block_id} • {block.fields.length}{" "}
                                    campos
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
                                onFieldDragStart={handleFieldDragStart}
                                onFieldDragEnd={handleFieldDragEnd}
                                onFieldDragOver={handleFieldDragOver}
                                onFieldDrop={handleFieldDrop}
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
                    <div>
                      <h3 className="text-lg font-medium text-[#283618] mb-2">
                        Header de Sección
                      </h3>
                      <p className="text-sm text-[#283618]/70 mb-4">
                        Configura un header específico para esta sección. Este
                        header reemplazará al header global únicamente en esta
                        página.
                      </p>
                    </div>

                    <div className="bg-[#bc6c25]/20 border border-[#bc6c25]/60 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg
                            className="w-5 h-5 text-[#bc6c25]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-[#bc6c25] text-sm">
                            <strong>Prioridad:</strong> Si configuras un header
                            aquí, tendrá prioridad sobre el header global del
                            template. Si no configuras nada, se usará el header
                            global automáticamente.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mostrar estado actual */}
                    {!currentSection.header_config ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-[#283618]">
                              Usando Header Global
                            </h4>
                            <button
                              onClick={() => {
                                // Copiar el header global a la sección
                                if (data.version.content.header_config) {
                                  updateSectionHeaderConfig(
                                    selectedSectionIndex,
                                    {
                                      ...data.version.content.header_config,
                                    }
                                  );
                                } else {
                                  // Si no hay global, crear uno vacío
                                  updateSectionHeaderConfig(
                                    selectedSectionIndex,
                                    { fields: [] }
                                  );
                                }
                              }}
                              className={`${btnOutlineSecondary} text-sm`}
                            >
                              Personalizar para esta sección
                            </button>
                          </div>
                          <p className="text-xs text-[#283618]/60">
                            Esta sección está usando el header global. Haz clic
                            en "Personalizar" para crear una versión específica
                            que puedes modificar independientemente.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Botón para restaurar al global */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "¿Estás seguro de eliminar la personalización y volver al header global?"
                                )
                              ) {
                                updateSection(selectedSectionIndex, {
                                  header_config: undefined,
                                });
                              }
                            }}
                            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Restaurar al global
                          </button>
                        </div>

                        {/* Configurador normal */}
                        <HeaderFooterConfigurator
                          config={currentSection.header_config}
                          configType="header"
                          onConfigChange={(updates) =>
                            updateSectionHeaderConfig(
                              selectedSectionIndex,
                              updates
                            )
                          }
                          showTitle={false}
                        />
                      </>
                    )}
                  </div>
                )}

                {activeTab === "footer" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-[#283618] mb-2">
                        Footer de Sección
                      </h3>
                      <p className="text-sm text-[#283618]/70 mb-4">
                        Configura un footer específico para esta sección. Este
                        footer reemplazará al footer global únicamente en esta
                        página.
                      </p>
                    </div>

                    <div className="bg-[#bc6c25]/20 border border-[#bc6c25]/60 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-0.5">
                          <svg
                            className="w-5 h-5 text-[#bc6c25]"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-[#bc6c25] text-sm">
                            <strong>Prioridad:</strong> Si configuras un footer
                            aquí, tendrá prioridad sobre el footer global del
                            template. Si no configuras nada, se usará el footer
                            global automáticamente.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mostrar estado actual */}
                    {!currentSection.footer_config ? (
                      <div className="space-y-4">
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium text-[#283618]">
                              Usando Footer Global
                            </h4>
                            <button
                              onClick={() => {
                                // Copiar el footer global a la sección
                                if (data.version.content.footer_config) {
                                  updateSectionFooterConfig(
                                    selectedSectionIndex,
                                    {
                                      ...data.version.content.footer_config,
                                    }
                                  );
                                } else {
                                  // Si no hay global, crear uno vacío
                                  updateSectionFooterConfig(
                                    selectedSectionIndex,
                                    { fields: [] }
                                  );
                                }
                              }}
                              className={`${btnOutlineSecondary} text-sm`}
                            >
                              Personalizar para esta sección
                            </button>
                          </div>
                          <p className="text-xs text-[#283618]/60">
                            Esta sección está usando el footer global. Haz clic
                            en "Personalizar" para crear una versión específica
                            que puedes modificar independientemente.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Botón para restaurar al global */}
                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              if (
                                confirm(
                                  "¿Estás seguro de eliminar la personalización y volver al footer global?"
                                )
                              ) {
                                updateSection(selectedSectionIndex, {
                                  footer_config: undefined,
                                });
                              }
                            }}
                            className="px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Restaurar al global
                          </button>
                        </div>

                        {/* Configurador normal */}
                        <HeaderFooterConfigurator
                          config={currentSection.footer_config}
                          configType="footer"
                          onConfigChange={(updates) =>
                            updateSectionFooterConfig(
                              selectedSectionIndex,
                              updates
                            )
                          }
                          showTitle={false}
                        />
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Selector de Iconos */}
      {showIconSelector && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setShowIconSelector(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium text-[#283618]">
                Seleccionar Icono para la Sección
              </h3>
              <button
                onClick={() => setShowIconSelector(false)}
                className="text-[#283618]/60 hover:text-[#283618] text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="p-4 max-h-96 overflow-y-auto">
              {loadingIcons ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-[#bc6c25]" />
                  <span className="ml-2">Cargando iconos...</span>
                </div>
              ) : availableIcons.length > 0 ? (
                <div className="grid grid-cols-4 gap-4">
                  {availableIcons.map((icon) => (
                    <div
                      key={icon.id}
                      className={`cursor-pointer p-4 border-2 rounded-lg hover:border-[#bc6c25] transition-colors ${
                        currentSection.icon_url === icon.file_url
                          ? "border-[#bc6c25] bg-[#bc6c25]/10"
                          : "border-gray-200"
                      }`}
                      onClick={() => {
                        updateSection(selectedSectionIndex, {
                          icon_url: icon.file_url,
                        });
                        setShowIconSelector(false);
                      }}
                    >
                      <div className="aspect-square bg-gray-50 rounded flex items-center justify-center mb-2">
                        <Image
                          src={icon.file_url}
                          alt={icon.file_name}
                          width={64}
                          height={64}
                          className="object-contain"
                        />
                      </div>
                      <p className="text-xs text-center text-gray-600 truncate">
                        {icon.file_name}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-2">No hay iconos disponibles</p>
                  <p className="text-sm">
                    Sube iconos en la sección de Recursos Visuales
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Editor de Campo Modal */}
      {editingField && (
        <div
          className="fixed inset-0 bg-black/75 flex items-center justify-center z-50"
          onClick={() => setEditingField(null)}
        >
          <div
            className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] shadow-2xl border border-gray-200"
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
