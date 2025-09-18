"use client";

import React, { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Plus, Trash2, Settings, GripVertical, Copy } from "lucide-react";
import {
  CreateTemplateData,
  Section,
  Block,
  Field,
} from "../../../../../types/template";

interface SectionsStepProps {
  data: CreateTemplateData;
  errors: Record<string, string[]>;
  onDataChange: (
    updater: (prevData: CreateTemplateData) => CreateTemplateData
  ) => void;
  onErrorsChange: (errors: Record<string, string[]>) => void;
}

export function SectionsStep({
  data,
  errors,
  onDataChange,
  onErrorsChange,
}: SectionsStepProps) {
  const t = useTranslations("CreateTemplate.sections");
  const [expandedSection, setExpandedSection] = useState<number | null>(null);

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

  const addFieldToBlock = useCallback(
    (sectionIndex: number, blockIndex: number) => {
      const newField: Field = {
        field_id: `field_${Date.now()}`,
        display_name: "Nuevo Campo",
        type: "text",
        form: true,
        bulletin: true,
        field_config: { subtype: "short" },
      };

      const updatedBlocks = [
        ...data.version.content.sections[sectionIndex].blocks,
      ];
      updatedBlocks[blockIndex] = {
        ...updatedBlocks[blockIndex],
        fields: [...updatedBlocks[blockIndex].fields, newField],
      };

      updateSection(sectionIndex, { blocks: updatedBlocks });
    },
    [data.version.content.sections, updateSection]
  );

  const moveSection = useCallback(
    (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;

      onDataChange((prevData) => {
        const sections = [...prevData.version.content.sections];
        const [movedSection] = sections.splice(fromIndex, 1);
        sections.splice(toIndex, 0, movedSection);

        // Re-ordenar
        const reorderedSections = sections.map((section, index) => ({
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t("title", { default: "Secciones del Template" })}
        </h2>
        <p className="text-gray-600">
          {t("description", {
            default:
              "Define las secciones principales de tu plantilla. Cada sección puede tener múltiples bloques y campos.",
          })}
        </p>
      </div>

      {/* Información y botón agregar */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {t("info", { default: "Total de secciones" })}:{" "}
          {data.version.content.sections.length}
        </div>
        <button
          onClick={addSection}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("addSection", { default: "Agregar Sección" })}
        </button>
      </div>

      {/* Lista de secciones */}
      {data.version.content.sections.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-gray-500">
            <div className="text-6xl mb-4">📄</div>
            <h3 className="text-lg font-medium mb-2">
              {t("empty.title", { default: "No hay secciones" })}
            </h3>
            <p className="text-sm mb-4">
              {t("empty.description", {
                default:
                  "Agrega tu primera sección para comenzar a estructurar tu plantilla",
              })}
            </p>
            <button
              onClick={addSection}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("empty.addFirst", { default: "Agregar Primera Sección" })}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {data.version.content.sections.map((section, sectionIndex) => (
            <div
              key={`${section.section_id}-${sectionIndex}`}
              className="border border-gray-200 rounded-lg bg-white"
            >
              {/* Header de la sección */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="cursor-move text-gray-400 hover:text-gray-600">
                    <GripVertical className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <input
                      type="text"
                      value={section.display_name}
                      onChange={(e) =>
                        updateSection(sectionIndex, {
                          display_name: e.target.value,
                        })
                      }
                      className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
                      placeholder="Nombre de la sección"
                    />
                    <div className="text-sm text-gray-500">
                      ID: {section.section_id} | Orden: {section.order} |
                      Bloques: {section.blocks.length}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setExpandedSection(
                        expandedSection === sectionIndex ? null : sectionIndex
                      )
                    }
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => duplicateSection(sectionIndex)}
                    className="text-gray-400 hover:text-blue-600"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeSection(sectionIndex)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contenido expandido de la sección */}
              {expandedSection === sectionIndex && (
                <div className="p-4 space-y-4">
                  {/* Configuración básica de la sección */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("section.sectionId", { default: "ID de Sección" })}
                      </label>
                      <input
                        type="text"
                        value={section.section_id}
                        onChange={(e) =>
                          updateSection(sectionIndex, {
                            section_id: e.target.value,
                          })
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t("section.iconUrl", { default: "URL del Icono" })}
                      </label>
                      <input
                        type="url"
                        value={section.icon_url}
                        onChange={(e) =>
                          updateSection(sectionIndex, {
                            icon_url: e.target.value,
                          })
                        }
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 text-sm"
                        placeholder="https://ejemplo.com/icono.png"
                      />
                    </div>
                  </div>

                  {/* Bloques de la sección */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-md font-medium text-gray-900">
                        {t("section.blocks", { default: "Bloques" })} (
                        {section.blocks.length})
                      </h4>
                      <button
                        onClick={() => addBlock(sectionIndex)}
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        {t("section.addBlock", { default: "Agregar Bloque" })}
                      </button>
                    </div>

                    {section.blocks.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-500 text-sm">
                          {t("section.noBlocks", {
                            default: "No hay bloques en esta sección",
                          })}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {section.blocks.map((block, blockIndex) => (
                          <div
                            key={`${block.block_id}-${blockIndex}`}
                            className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  value={block.display_name}
                                  onChange={(e) =>
                                    updateBlock(sectionIndex, blockIndex, {
                                      display_name: e.target.value,
                                    })
                                  }
                                  className="font-medium text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 text-sm"
                                  placeholder="Nombre del bloque"
                                />
                                <div className="text-xs text-gray-500">
                                  ID: {block.block_id} | Campos:{" "}
                                  {block.fields.length}
                                </div>
                              </div>
                              <div className="flex space-x-1">
                                <button
                                  onClick={() =>
                                    addFieldToBlock(sectionIndex, blockIndex)
                                  }
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  + Campo
                                </button>
                                <button
                                  onClick={() =>
                                    removeBlock(sectionIndex, blockIndex)
                                  }
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>

                            {/* Lista simple de campos */}
                            {block.fields.length > 0 && (
                              <div className="text-xs text-gray-600">
                                <span className="font-medium">Campos:</span>
                                {block.fields.map((field, fieldIndex) => (
                                  <span
                                    key={fieldIndex}
                                    className="ml-2 inline-block bg-white px-2 py-1 rounded border"
                                  >
                                    {field.display_name} ({field.type})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
