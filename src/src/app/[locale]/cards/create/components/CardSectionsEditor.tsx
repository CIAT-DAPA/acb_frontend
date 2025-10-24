"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Plus,
  Trash2,
  GripVertical,
  Layout,
  FileText,
  BookOpen,
  Settings,
  Palette,
  Edit3,
  Image as ImageIcon,
  X,
} from "lucide-react";
import { CreateCardData } from "../../../../../types/card";
import {
  Block,
  Field,
  TextField,
  HeaderFooterConfig,
} from "../../../../../types/template";
import { FieldEditor } from "../../../templates/create/components/FieldEditor";
import { StyleConfigurator } from "../../../templates/create/components/StyleConfigurator";
import { HeaderFooterConfigurator } from "../../../templates/create/components/HeaderFooterConfigurator";
import { VisualResourceSelector } from "../../../templates/create/components/VisualResourceSelector";
import {
  btnPrimary,
  btnOutlineSecondary,
  btnOutlinePrimary,
} from "../../../components/ui";

interface CardSectionsEditorProps {
  data: CreateCardData;
  errors: Record<string, string[]>;
  onDataChange: (updater: (prevData: CreateCardData) => CreateCardData) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
}

interface BlockConfigurationProps {
  block: Block;
  blockIndex: number;
  onUpdateBlock: (blockIndex: number, updates: Partial<Block>) => void;
  onEditField: (blockIndex: number, fieldIndex: number) => void;
  onFieldDragStart: (blockIndex: number, fieldIndex: number) => void;
  onFieldDragEnd: () => void;
  onFieldDragOver: (e: React.DragEvent) => void;
  onFieldDrop: (blockIndex: number, fieldIndex: number) => void;
}

interface FieldConfigurationProps {
  field: Field;
  fieldIndex: number;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onUpdateField: (fieldIndex: number, updates: Partial<Field>) => void;
  onRemoveField: (fieldIndex: number) => void;
  blockIndex: number;
  onEditField: (blockIndex: number, fieldIndex: number) => void;
}

// Component for individual field display
function FieldConfiguration({
  field,
  fieldIndex,
  blockIndex,
  onEditField,
  onRemoveField,
}: FieldConfigurationProps) {
  const t = useTranslations("CreateTemplate.headerFooter");

  return (
    <div className="border rounded-lg p-4 transition-all duration-200 border-gray-200 bg-gray-50 hover:shadow-md hover:border-gray-300">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          {/* Drag handle */}
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
            onClick={() => onEditField(blockIndex, fieldIndex)}
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

// Helper function to get default field config based on field type
function getFieldConfigDefaults(fieldType: string): any {
  switch (fieldType) {
    case "text":
      return { subtype: "short" };
    case "select":
      return { options: [] };
    case "multiselect":
      return { options: [] };
    case "date":
      return { dateType: "single" };
    case "file":
      return { fileTypes: [], maxSize: 10 };
    case "location":
      return { locationType: "point" };
    case "numeric":
      return { numericType: "integer", min: undefined, max: undefined };
    case "boolean":
      return {};
    case "climateData":
      return { dataSource: "api", parameters: {} };
    case "list":
      return { itemType: "text", minItems: 0, maxItems: undefined };
    default:
      return {};
  }
}

// Component for block configuration (replicated from SectionsStep)
function BlockConfiguration({
  block,
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
    const newField: TextField = {
      field_id: `field_${Date.now()}`,
      display_name: "Nuevo Campo",
      type: "text",
      form: true,
      bulletin: true,
      field_config: getFieldConfigDefaults("text"),
    };

    const updatedFields = [...block.fields, newField];
    onUpdateBlock(blockIndex, { fields: updatedFields });
  };

  const removeField = (fieldIndex: number) => {
    const updatedFields = block.fields.filter(
      (_, index) => index !== fieldIndex
    );
    onUpdateBlock(blockIndex, { fields: updatedFields });
  };

  return (
    <div className="p-4 bg-gray-50 space-y-4">
      <div>
        <h5 className="text-md font-medium text-[#283618] mb-4">
          Configuración del Bloque
        </h5>

        {/* Block name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-[#283618] mb-1">
            Nombre del bloque
          </label>
          <input
            type="text"
            value={block.display_name}
            onChange={(e) =>
              onUpdateBlock(blockIndex, {
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

        {/* Block styles */}
        <div className="mb-4">
          <h6 className="text-sm font-medium text-[#283618] mb-2 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Estilos del Bloque
          </h6>
          <StyleConfigurator
            styleConfig={block.style_config || {}}
            onStyleChange={(updates) => {
              onUpdateBlock(blockIndex, {
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
            description="Los estilos del bloque se aplicarán al contenedor que agrupa los campos. Usa 'Padding' para el espacio interno del bloque y 'Gap' para el espacio entre los campos dentro del bloque."
            showPreview={false}
          />
        </div>
      </div>

      {/* Fields management */}
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
                onDragStart={() => onFieldDragStart(blockIndex, fieldIndex)}
                onDragEnd={onFieldDragEnd}
                onDragOver={onFieldDragOver}
                onDrop={() => onFieldDrop(blockIndex, fieldIndex)}
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
                  onUpdateField={() => {}}
                  onRemoveField={removeField}
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

export function CardSectionsEditor({
  data,
  errors,
  onDataChange,
  onErrorsChange,
}: CardSectionsEditorProps) {
  const t = useTranslations("CreateCard.content");
  const [activeTab, setActiveTab] = useState<"blocks" | "header" | "footer">(
    "blocks"
  );
  const [expandedBlock, setExpandedBlock] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<{
    blockIndex: number;
    fieldIndex: number;
  } | null>(null);
  const [showBackgroundSelector, setShowBackgroundSelector] = useState(false);

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<{
    blockIndex: number;
    fieldIndex: number;
  } | null>(null);

  // ============================================
  // BLOCKS MANAGEMENT
  // ============================================

  const handleAddBlock = useCallback(() => {
    onDataChange((prevData) => ({
      ...prevData,
      content: {
        ...prevData.content,
        blocks: [
          ...prevData.content.blocks,
          {
            block_id: `block_${Date.now()}`,
            display_name: `Bloque ${prevData.content.blocks.length + 1}`,
            fields: [],
          },
        ],
      },
    }));

    // Clear blocks errors
    if (errors.blocks) {
      onErrorsChange({
        ...errors,
        blocks: [],
      });
    }
  }, [onDataChange, errors, onErrorsChange]);

  const handleRemoveBlock = useCallback(
    (blockIndex: number) => {
      onDataChange((prevData) => ({
        ...prevData,
        content: {
          ...prevData.content,
          blocks: prevData.content.blocks.filter((_, i) => i !== blockIndex),
        },
      }));
    },
    [onDataChange]
  );

  const handleUpdateBlock = useCallback(
    (blockIndex: number, updates: Partial<Block>) => {
      onDataChange((prevData) => ({
        ...prevData,
        content: {
          ...prevData.content,
          blocks: prevData.content.blocks.map((block, i) =>
            i === blockIndex ? { ...block, ...updates } : block
          ),
        },
      }));
    },
    [onDataChange]
  );

  // ============================================
  // FIELDS MANAGEMENT
  // ============================================

  const handleAddField = useCallback(
    (blockIndex: number) => {
      const newField: TextField = {
        field_id: `field_${Date.now()}`,
        display_name: `Campo ${
          data.content.blocks[blockIndex].fields.length + 1
        }`,
        type: "text",
        form: true,
        bulletin: true,
      };

      onDataChange((prevData) => ({
        ...prevData,
        content: {
          ...prevData.content,
          blocks: prevData.content.blocks.map((block, i) =>
            i === blockIndex
              ? {
                  ...block,
                  fields: [...block.fields, newField] as Field[],
                }
              : block
          ),
        },
      }));
    },
    [data.content.blocks, onDataChange]
  );

  const handleRemoveField = useCallback(
    (blockIndex: number, fieldIndex: number) => {
      onDataChange((prevData) => ({
        ...prevData,
        content: {
          ...prevData.content,
          blocks: prevData.content.blocks.map((block, i) =>
            i === blockIndex
              ? {
                  ...block,
                  fields: block.fields.filter(
                    (_, fi) => fi !== fieldIndex
                  ) as Field[],
                }
              : block
          ),
        },
      }));

      // Close field editor if we're editing this field
      if (
        editingField &&
        editingField.blockIndex === blockIndex &&
        editingField.fieldIndex === fieldIndex
      ) {
        setEditingField(null);
      }
    },
    [editingField, onDataChange]
  );

  const handleUpdateField = useCallback(
    (blockIndex: number, fieldIndex: number, updates: Partial<Field>) => {
      onDataChange((prevData) => ({
        ...prevData,
        content: {
          ...prevData.content,
          blocks: prevData.content.blocks.map((block, i) =>
            i === blockIndex
              ? {
                  ...block,
                  fields: block.fields.map((field, fi) =>
                    fi === fieldIndex ? { ...field, ...updates } : field
                  ) as Field[],
                }
              : block
          ),
        },
      }));
    },
    [onDataChange]
  );

  // ============================================
  // DRAG AND DROP
  // ============================================

  const handleBlockDragStart = useCallback((blockIndex: number) => {
    setDraggedItem({ blockIndex, fieldIndex: -1 });
  }, []);

  const handleBlockDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleBlockDrop = useCallback(
    (targetBlockIndex: number) => {
      if (draggedItem === null || draggedItem.fieldIndex !== -1) return;

      onDataChange((prevData) => {
        const blocks = [...prevData.content.blocks];
        const [draggedBlock] = blocks.splice(draggedItem.blockIndex, 1);
        blocks.splice(targetBlockIndex, 0, draggedBlock);

        return {
          ...prevData,
          content: {
            ...prevData.content,
            blocks,
          },
        };
      });

      setDraggedItem(null);
    },
    [draggedItem, onDataChange]
  );

  const handleFieldDragStart = useCallback(
    (blockIndex: number, fieldIndex: number) => {
      setDraggedItem({ blockIndex, fieldIndex });
    },
    []
  );

  const handleFieldDrop = useCallback(
    (targetBlockIndex: number, targetFieldIndex: number) => {
      if (draggedItem === null || draggedItem.blockIndex !== targetBlockIndex)
        return;

      onDataChange((prevData) => {
        const block = prevData.content.blocks[targetBlockIndex];
        const fields = [...block.fields];
        const [draggedFieldData] = fields.splice(draggedItem.fieldIndex, 1);
        fields.splice(targetFieldIndex, 0, draggedFieldData);

        return {
          ...prevData,
          content: {
            ...prevData.content,
            blocks: prevData.content.blocks.map((b, i) =>
              i === targetBlockIndex ? { ...b, fields: fields as Field[] } : b
            ),
          },
        };
      });

      setDraggedItem(null);
    },
    [draggedItem, onDataChange]
  );

  // ============================================
  // HEADER/FOOTER MANAGEMENT
  // ============================================

  const handleHeaderChange = useCallback(
    (updates: Partial<HeaderFooterConfig>) => {
      onDataChange((prevData) => ({
        ...prevData,
        content: {
          ...prevData.content,
          header_config: {
            ...(prevData.content.header_config || { fields: [] }),
            ...updates,
          },
        },
      }));
    },
    [onDataChange]
  );

  const handleFooterChange = useCallback(
    (updates: Partial<HeaderFooterConfig>) => {
      onDataChange((prevData) => ({
        ...prevData,
        content: {
          ...prevData.content,
          footer_config: {
            ...(prevData.content.footer_config || { fields: [] }),
            ...updates,
          },
        },
      }));
    },
    [onDataChange]
  );

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex space-x-8">
          {/* Blocks Tab */}
          <button
            onClick={() => setActiveTab("blocks")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer
              ${
                activeTab === "blocks"
                  ? "border-[#bc6c25] text-[#bc6c25]"
                  : "border-transparent text-[#283618]/70 hover:text-[#283618] hover:border-gray-300"
              }
            `}
          >
            <Layout className="h-5 w-5" />
            {t("tabs.blocks")}
          </button>

          {/* Header Tab */}
          <button
            onClick={() => setActiveTab("header")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer
              ${
                activeTab === "header"
                  ? "border-[#bc6c25] text-[#bc6c25]"
                  : "border-transparent text-[#283618]/70 hover:text-[#283618] hover:border-gray-300"
              }
            `}
          >
            <Layout className="h-5 w-5" />
            {t("tabs.header")}
          </button>

          {/* Footer Tab */}
          <button
            onClick={() => setActiveTab("footer")}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors cursor-pointer
              ${
                activeTab === "footer"
                  ? "border-[#bc6c25] text-[#bc6c25]"
                  : "border-transparent text-[#283618]/70 hover:text-[#283618] hover:border-gray-300"
              }
            `}
          >
            <Layout className="h-5 w-5" />
            {t("tabs.footer")}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* BLOCKS TAB */}
        {activeTab === "blocks" && (
          <div className="space-y-6">
            {/* Background Settings */}
            <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-[#283618] flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Fondo del Card
              </h3>

              {/* Background Image */}
              <div>
                <label className="block text-sm font-medium text-[#283618] mb-2">
                  Imagen de Fondo
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={data.content.background_url || ""}
                    readOnly
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-[#283618]/70"
                    placeholder="Ninguna imagen seleccionada"
                  />
                  <button
                    type="button"
                    onClick={() => setShowBackgroundSelector(true)}
                    className={btnOutlineSecondary}
                  >
                    <ImageIcon className="h-4 w-4" />
                    Seleccionar
                  </button>
                  {data.content.background_url && (
                    <button
                      type="button"
                      onClick={() =>
                        onDataChange((prevData) => ({
                          ...prevData,
                          content: {
                            ...prevData.content,
                            background_url: undefined,
                          },
                        }))
                      }
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#283618]/60 mt-1">
                  Selecciona una imagen de los recursos visuales para usar como
                  fondo
                </p>
              </div>

              {/* Background Color */}
              <div>
                <label
                  htmlFor="background_color"
                  className="block text-sm font-medium text-[#283618] mb-2"
                >
                  Color de Fondo
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="background_color"
                    value={data.content.background_color || "#ffffff"}
                    onChange={(e) =>
                      onDataChange((prevData) => ({
                        ...prevData,
                        content: {
                          ...prevData.content,
                          background_color: e.target.value,
                        },
                      }))
                    }
                    className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={data.content.background_color || "#ffffff"}
                    onChange={(e) =>
                      onDataChange((prevData) => ({
                        ...prevData,
                        content: {
                          ...prevData.content,
                          background_color: e.target.value,
                        },
                      }))
                    }
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#606c38] focus:border-transparent"
                    placeholder="#ffffff"
                  />
                  {data.content.background_color && (
                    <button
                      type="button"
                      onClick={() =>
                        onDataChange((prevData) => ({
                          ...prevData,
                          content: {
                            ...prevData.content,
                            background_color: undefined,
                          },
                        }))
                      }
                      className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-300"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-[#283618]/60 mt-1">
                  El color se aplicará si no hay imagen de fondo seleccionada
                </p>
              </div>

              {/* Padding */}
              <div>
                <label
                  htmlFor="content_padding"
                  className="block text-sm font-medium text-[#283618] mb-2"
                >
                  Padding (Espacio Interno)
                </label>
                <input
                  type="text"
                  id="content_padding"
                  value={data.content.style_config?.padding || ""}
                  onChange={(e) =>
                    onDataChange((prevData) => ({
                      ...prevData,
                      content: {
                        ...prevData.content,
                        style_config: {
                          ...prevData.content.style_config,
                          padding: e.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#606c38] focus:border-transparent"
                  placeholder="Ej: 16px, 1rem, 10px 20px"
                />
                <p className="text-xs text-[#283618]/60 mt-1">
                  Espacio interno entre el borde del card y su contenido
                </p>
              </div>

              {/* Gap */}
              <div>
                <label
                  htmlFor="content_gap"
                  className="block text-sm font-medium text-[#283618] mb-2"
                >
                  Gap (Espacio entre Bloques)
                </label>
                <input
                  type="text"
                  id="content_gap"
                  value={data.content.style_config?.gap || ""}
                  onChange={(e) =>
                    onDataChange((prevData) => ({
                      ...prevData,
                      content: {
                        ...prevData.content,
                        style_config: {
                          ...prevData.content.style_config,
                          gap: e.target.value,
                        },
                      },
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#606c38] focus:border-transparent"
                  placeholder="Ej: 16px, 1rem, 20px"
                />
                <p className="text-xs text-[#283618]/60 mt-1">
                  Espacio entre los bloques del card
                </p>
              </div>
            </div>

            {/* Blocks */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[#283618]">
                  {t("blocks")} <span className="text-red-500">*</span>
                </h3>
                <button
                  onClick={handleAddBlock}
                  className={btnOutlineSecondary}
                >
                  <Plus className="h-4 w-4" />
                  <span>{t("addBlock")}</span>
                </button>
              </div>

              {errors.blocks && errors.blocks.length > 0 && (
                <p className="text-red-500 text-sm">{errors.blocks[0]}</p>
              )}

              {data.content.blocks.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <p className="text-[#283618]/60">{t("noBlocks")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {data.content.blocks.map((block, blockIndex) => (
                    <div
                      key={blockIndex}
                      draggable
                      onDragStart={() => handleBlockDragStart(blockIndex)}
                      onDragOver={handleBlockDragOver}
                      onDrop={() => handleBlockDrop(blockIndex)}
                      className="bg-white border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200"
                    >
                      {/* Block Header - Always Visible */}
                      <div className="flex items-center justify-between p-4 border-b border-gray-200">
                        <div className="flex items-center gap-3 flex-1">
                          <GripVertical className="h-5 w-5 text-gray-400 cursor-move" />
                          <div>
                            <h4 className="font-medium text-[#283618]">
                              {block.display_name || "Sin nombre"}
                            </h4>
                            <p className="text-xs text-[#283618]/60">
                              ID: {block.block_id} • {block.fields.length}{" "}
                              campo(s)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setExpandedBlock(
                                expandedBlock === blockIndex ? null : blockIndex
                              )
                            }
                            className={`p-1 rounded transition-colors ${
                              expandedBlock === blockIndex
                                ? "text-[#bc6c25] bg-[#bc6c25]/10"
                                : "text-[#283618]/50 hover:text-[#283618]"
                            }`}
                            title={
                              expandedBlock === blockIndex
                                ? "Contraer configuración"
                                : "Expandir configuración"
                            }
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveBlock(blockIndex)}
                            className="text-[#283618]/50 hover:text-red-600 p-1 rounded"
                            title={t("removeBlock")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Block Configuration - Only when expanded */}
                      {expandedBlock === blockIndex && (
                        <BlockConfiguration
                          block={block}
                          blockIndex={blockIndex}
                          onUpdateBlock={handleUpdateBlock}
                          onEditField={(blockIdx, fieldIdx) =>
                            setEditingField({
                              blockIndex: blockIdx,
                              fieldIndex: fieldIdx,
                            })
                          }
                          onFieldDragStart={handleFieldDragStart}
                          onFieldDragEnd={() => {}}
                          onFieldDragOver={handleBlockDragOver}
                          onFieldDrop={handleFieldDrop}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* HEADER TAB */}
        {activeTab === "header" && (
          <div>
            <HeaderFooterConfigurator
              config={data.content.header_config || { fields: [] }}
              configType="header"
              onConfigChange={handleHeaderChange}
            />
          </div>
        )}

        {/* FOOTER TAB */}
        {activeTab === "footer" && (
          <div>
            <HeaderFooterConfigurator
              config={data.content.footer_config || { fields: [] }}
              configType="footer"
              onConfigChange={handleFooterChange}
            />
          </div>
        )}
      </div>

      {/* Field Editor Modal */}
      {editingField !== null && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingField(null)}
        >
          <div
            className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-semibold text-[#283618]">
                Editar Campo
              </h2>
              <button
                onClick={() => setEditingField(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="px-6 py-4">
              <FieldEditor
                field={
                  data.content.blocks[editingField.blockIndex].fields[
                    editingField.fieldIndex
                  ]
                }
                onFieldChange={(updatedField) => {
                  handleUpdateField(
                    editingField.blockIndex,
                    editingField.fieldIndex,
                    updatedField
                  );
                  setEditingField(null);
                }}
                onClose={() => setEditingField(null)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Background Image Selector Modal */}
      <VisualResourceSelector
        isOpen={showBackgroundSelector}
        onClose={() => setShowBackgroundSelector(false)}
        onSelect={(resourceUrl) => {
          onDataChange((prevData) => ({
            ...prevData,
            content: {
              ...prevData.content,
              background_url: resourceUrl,
            },
          }));
        }}
        title="Seleccionar Imagen de Fondo"
        resourceType="image"
        selectedUrl={data.content.background_url}
        gridColumns={4}
      />
    </div>
  );
}
