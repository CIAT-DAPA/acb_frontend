import React, { useMemo, useState } from "react";
import {
  CreateTemplateData,
  FIELD_TYPES,
  Field,
  Section,
  Block,
  HeaderFooterConfig,
} from "@/types/template";
import { EditorSelection } from "./types";
import { getFieldConfigDefaults } from "@/app/[locale]/templates/create/editor/utils";
import { Trash2, Move, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { StyleConfigurator } from "@/app/[locale]/templates/create/components/StyleConfigurator";
import * as ui from "../../../components/ui";
import { getFieldTypeComponent } from "../components/fieldTypes/FieldTypeRegistry";
import { ConfirmationModal } from "../../../components/ConfirmationModal";

const DIMENSION_PRESETS = [
  { label: "Custom", width: 0, height: 0 },
  { label: "A4 (Web - 794x1123)", width: 794, height: 1123 },
  { label: "Letter (Web - 816x1056)", width: 816, height: 1056 },
  { label: "Mobile (360x640)", width: 360, height: 640 },
  { label: "Story/Mobile HD (1080x1920)", width: 1080, height: 1920 },
  { label: "Post (1080x1080)", width: 1080, height: 1080 },
  { label: "Landscape HD (1920x1080)", width: 1920, height: 1080 },
];

interface RightPanelProps {
  selection: EditorSelection;
  data: CreateTemplateData;
  onUpdate: (updater: (prev: CreateTemplateData) => CreateTemplateData) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  selection,
  data,
  onUpdate,
}) => {
  const t = useTranslations("CreateTemplate");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Helper to get current object
  const currentObject = useMemo(() => {
    const sections = data.version.content.sections;
    if (
      selection.type === "section" &&
      typeof selection.sectionIndex === "number"
    ) {
      return sections[selection.sectionIndex];
    }
    if (
      selection.type === "block" &&
      typeof selection.sectionIndex === "number" &&
      typeof selection.blockIndex === "number"
    ) {
      return sections[selection.sectionIndex]?.blocks?.[selection.blockIndex];
    }
    if (
      selection.type === "field" &&
      typeof selection.sectionIndex === "number" &&
      typeof selection.blockIndex === "number" &&
      typeof selection.fieldIndex === "number"
    ) {
      return sections[selection.sectionIndex]?.blocks?.[selection.blockIndex]
        ?.fields?.[selection.fieldIndex];
    }

    // Header/Footer logic
    if (selection.type === "header") {
      const section =
        selection.sectionIndex! >= 0 ? sections[selection.sectionIndex!] : null;
      return (
        (section?.header_config?.fields?.length
          ? section.header_config
          : data.version.content.header_config) || {}
      );
    }
    if (selection.type === "footer") {
      const section =
        selection.sectionIndex! >= 0 ? sections[selection.sectionIndex!] : null;
      return (
        (section?.footer_config?.fields?.length
          ? section.footer_config
          : data.version.content.footer_config) || {}
      );
    }
    if (selection.type === "header_field") {
      const section =
        selection.sectionIndex! >= 0 ? sections[selection.sectionIndex!] : null;
      const config = section?.header_config?.fields?.length
        ? section.header_config
        : data.version.content.header_config;
      return config?.fields?.[selection.fieldIndex!];
    }
    if (selection.type === "footer_field") {
      const section =
        selection.sectionIndex! >= 0 ? sections[selection.sectionIndex!] : null;
      const config = section?.footer_config?.fields?.length
        ? section.footer_config
        : data.version.content.footer_config;
      return config?.fields?.[selection.fieldIndex!];
    }

    return null;
  }, [selection, data]);

  // Actions
  const updateField = (updates: Partial<Field>) => {
    onUpdate((prev) => {
      const newData = { ...prev };
      const field =
        newData.version.content.sections[selection.sectionIndex!].blocks[
          selection.blockIndex!
        ].fields[selection.fieldIndex!];
      Object.assign(field, updates);
      return newData;
    });
  };

  const updateHeaderField = (updates: Partial<Field>) => {
    onUpdate((prev) => {
      const newData = { ...prev };
      const sections = newData.version.content.sections;
      const section =
        selection.sectionIndex! >= 0 ? sections[selection.sectionIndex!] : null;

      let config = section?.header_config?.fields?.length
        ? section.header_config
        : newData.version.content.header_config;
      if (!config && section) {
        if (!section.header_config) section.header_config = { fields: [] };
        config = section.header_config;
      } else if (!config) {
        if (!newData.version.content.header_config)
          newData.version.content.header_config = { fields: [] };
        config = newData.version.content.header_config;
      }

      if (config && config.fields[selection.fieldIndex!]) {
        Object.assign(config.fields[selection.fieldIndex!], updates);
      }
      return newData;
    });
  };

  const updateFooterField = (updates: Partial<Field>) => {
    onUpdate((prev) => {
      const newData = { ...prev };
      const sections = newData.version.content.sections;
      const section =
        selection.sectionIndex! >= 0 ? sections[selection.sectionIndex!] : null;

      let config = section?.footer_config?.fields?.length
        ? section.footer_config
        : newData.version.content.footer_config;
      if (!config && section) {
        if (!section.footer_config) section.footer_config = { fields: [] };
        config = section.footer_config;
      } else if (!config) {
        if (!newData.version.content.footer_config)
          newData.version.content.footer_config = { fields: [] };
        config = newData.version.content.footer_config;
      }

      if (config && config.fields[selection.fieldIndex!]) {
        Object.assign(config.fields[selection.fieldIndex!], updates);
      }
      return newData;
    });
  };

  const handleUpdateField = (updates: Partial<Field>) => {
    if (selection.type === "header_field") updateHeaderField(updates);
    else if (selection.type === "footer_field") updateFooterField(updates);
    else updateField(updates);
  };

  const updateSection = (updates: Partial<Section>) => {
    onUpdate((prev) => {
      const newData = { ...prev };
      const section = newData.version.content.sections[selection.sectionIndex!];
      Object.assign(section, updates);
      return newData;
    });
  };

  const updateHeader = (updates: Partial<HeaderFooterConfig>) => {
    onUpdate((prev) => {
      const newData = { ...prev };
      const sections = newData.version.content.sections;
      const section =
        selection.sectionIndex! >= 0 ? sections[selection.sectionIndex!] : null;

      let config = section?.header_config?.fields?.length
        ? section.header_config
        : newData.version.content.header_config;
      if (!config) {
        if (!newData.version.content.header_config)
          newData.version.content.header_config = { fields: [] };
        config = newData.version.content.header_config;
      }
      Object.assign(config!, updates);
      return newData;
    });
  };

  const updateFooter = (updates: Partial<HeaderFooterConfig>) => {
    onUpdate((prev) => {
      const newData = { ...prev };
      const sections = newData.version.content.sections;
      const section =
        selection.sectionIndex! >= 0 ? sections[selection.sectionIndex!] : null;

      let config = section?.footer_config?.fields?.length
        ? section.footer_config
        : newData.version.content.footer_config;
      if (!config) {
        if (!newData.version.content.footer_config)
          newData.version.content.footer_config = { fields: [] };
        config = newData.version.content.footer_config;
      }
      Object.assign(config!, updates);
      return newData;
    });
  };

  const updateBlock = (updates: Partial<Block>) => {
    onUpdate((prev) => {
      const newData = { ...prev };
      const block =
        newData.version.content.sections[selection.sectionIndex!].blocks[
          selection.blockIndex!
        ];
      Object.assign(block, updates);
      return newData;
    });
  };

  const handleDelete = () => {
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    onUpdate((prev) => {
      const newData = structuredClone(prev);
      const sections = newData.version.content.sections;

      if (selection.type === "section") {
        sections.splice(selection.sectionIndex!, 1);
      } else if (selection.type === "block") {
        sections[selection.sectionIndex!].blocks.splice(
          selection.blockIndex!,
          1,
        );
      } else if (selection.type === "field") {
        sections[selection.sectionIndex!].blocks[
          selection.blockIndex!
        ].fields.splice(selection.fieldIndex!, 1);
      } else if (selection.type === "header_field") {
        const section =
          selection.sectionIndex! >= 0
            ? sections[selection.sectionIndex!]
            : null;
        const config = section?.header_config?.fields?.length
          ? section.header_config
          : newData.version.content.header_config;
        config?.fields.splice(selection.fieldIndex!, 1);
      } else if (selection.type === "footer_field") {
        const section =
          selection.sectionIndex! >= 0
            ? sections[selection.sectionIndex!]
            : null;
        const config = section?.footer_config?.fields?.length
          ? section.footer_config
          : newData.version.content.footer_config;
        config?.fields.splice(selection.fieldIndex!, 1);
      }

      return newData;
    });
  };

  const handleAddBlock = () => {
    onUpdate((prev) => {
      const newData = structuredClone(prev);
      const section = newData.version.content.sections[selection.sectionIndex!];
      if (!section.blocks) section.blocks = [];
      section.blocks.push({
        block_id: crypto.randomUUID(),
        display_name: "New Block",
        fields: [],
      });
      return newData;
    });
  };

  const handleAddField = () => {
    onUpdate((prev) => {
      const newData = structuredClone(prev);
      const block =
        newData.version.content.sections[selection.sectionIndex!].blocks[
          selection.blockIndex!
        ];
      if (!block.fields) block.fields = [];
      block.fields.push({
        field_id: `field_${Date.now()}`,
        display_name: "New Field",
        type: "text",
        form: true,
        bulletin: true,
        field_config: getFieldConfigDefaults("text"),
      });
      return newData;
    });
  };

  if (!selection.type || selection.type === "template") {
    return (
      <div className="w-[320px] min-w-[320px] p-4 h-full flex flex-col bg-white border-l border-gray-200 shadow-xl overflow-hidden">
        <h2 className="font-semibold mb-4 text-base shrink-0">
          Template Settings
        </h2>

        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              className="w-full text-sm border border-gray-200 rounded p-1.5"
              value={data.master.status}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  master: { ...prev.master, status: e.target.value as any },
                }))
              }
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Access Type
            </label>
            <select
              className="w-full text-sm border border-gray-200 rounded p-1.5"
              value={data.master.access_config.access_type}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  master: {
                    ...prev.master,
                    access_config: {
                      ...prev.master.access_config,
                      access_type: e.target.value as any,
                    },
                  },
                }))
              }
            >
              <option value="public">Public</option>
              <option value="restricted">Restricted</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              className="w-full text-sm border border-gray-200 rounded p-2 h-24 resize-none"
              value={data.master.description}
              onChange={(e) =>
                onUpdate((prev) => ({
                  ...prev,
                  master: { ...prev.master, description: e.target.value },
                }))
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Dimensions
            </label>

            <div className="mb-2">
              <select
                className="w-full text-sm border border-gray-200 rounded p-1.5"
                value={(() => {
                  const currentWidth =
                    data.version.content.style_config?.bulletin_width || 800;
                  const currentHeight =
                    data.version.content.style_config?.bulletin_height || 1200;
                  const match = DIMENSION_PRESETS.findIndex(
                    (p) =>
                      p.width === currentWidth && p.height === currentHeight,
                  );
                  return match >= 0 ? match : 0;
                })()}
                onChange={(e) => {
                  const preset = DIMENSION_PRESETS[parseInt(e.target.value)];
                  if (preset && preset.width > 0) {
                    onUpdate((prev) => ({
                      ...prev,
                      version: {
                        ...prev.version,
                        content: {
                          ...prev.version.content,
                          style_config: {
                            ...prev.version.content.style_config,
                            bulletin_width: preset.width,
                            bulletin_height: preset.height,
                          },
                        },
                      },
                    }));
                  }
                }}
              >
                {DIMENSION_PRESETS.map((preset, idx) => (
                  <option key={idx} value={idx}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="block text-[10px] text-gray-500 mb-0.5">
                  Width
                </span>
                <input
                  type="number"
                  className="w-full text-sm border border-gray-200 rounded p-1.5"
                  value={
                    data.version.content.style_config?.bulletin_width || 800
                  }
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      version: {
                        ...prev.version,
                        content: {
                          ...prev.version.content,
                          style_config: {
                            ...prev.version.content.style_config,
                            bulletin_width: parseInt(e.target.value) || 800,
                          },
                        },
                      },
                    }))
                  }
                />
              </div>
              <div>
                <span className="block text-[10px] text-gray-500 mb-0.5">
                  Height
                </span>
                <input
                  type="number"
                  className="w-full text-sm border border-gray-200 rounded p-1.5"
                  value={
                    data.version.content.style_config?.bulletin_height || 1200
                  }
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      version: {
                        ...prev.version,
                        content: {
                          ...prev.version.content,
                          style_config: {
                            ...prev.version.content.style_config,
                            bulletin_height: parseInt(e.target.value) || 1200,
                          },
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-xs uppercase font-bold text-gray-500 mb-2">
              Global Styles
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-gray-500">
                  Primary Color
                </label>
                <input
                  type="color"
                  className="w-full h-8 cursor-pointer border border-gray-200 rounded p-0"
                  value={
                    data.version.content.style_config?.primary_color ||
                    "#000000"
                  }
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      version: {
                        ...prev.version,
                        content: {
                          ...prev.version.content,
                          style_config: {
                            ...prev.version.content.style_config,
                            primary_color: e.target.value,
                          },
                        },
                      },
                    }))
                  }
                />
              </div>
              <div>
                <label className="block text-[10px] text-gray-500">
                  Background
                </label>
                <input
                  type="color"
                  className="w-full h-8 cursor-pointer border border-gray-200 rounded p-0"
                  value={
                    data.version.content.style_config?.background_color ||
                    "#ffffff"
                  }
                  onChange={(e) =>
                    onUpdate((prev) => ({
                      ...prev,
                      version: {
                        ...prev.version,
                        content: {
                          ...prev.version.content,
                          style_config: {
                            ...prev.version.content.style_config,
                            background_color: e.target.value,
                          },
                        },
                      },
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Common Header for Selection
  return (
    <div className="w-[320px] min-w-[320px] flex flex-col h-full bg-white border-l border-gray-200 shadow-xl overflow-hidden">
      <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white z-10">
        <div className="overflow-hidden">
          <span className="text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wide block w-max mb-1 bg-[#bc6c25]/10 text-[#bc6c25] border border-[#bc6c25]/20">
            {t(`fieldEditor.editor.selectionTypes.${selection.type}`) ||
              selection.type}
          </span>
          <h2
            className="font-medium text-sm truncate max-w-[200px]"
            title={(currentObject as any)?.display_name}
          >
            {(currentObject as any)?.display_name ||
              t("fieldEditor.editor.untitled")}
          </h2>
        </div>
        <button
          onClick={handleDelete}
          className={`p-2 rounded-md hover:bg-red-50 transition-colors shrink-0 ${ui.btnDangerIconClass}`}
        >
          <Trash2 size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        {/* Common Name/ID inputs */}
        <div className="space-y-3">
          {!["header", "footer"].includes(selection.type) && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("fieldEditor.editor.displayName")}
              </label>
              <input
                type="text"
                className="w-full text-sm border border-gray-200 rounded px-2 py-1.5 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                value={(currentObject as any)?.display_name || ""}
                onChange={(e) => {
                  if (selection.type === "section")
                    updateSection({ display_name: e.target.value });
                  else if (selection.type === "block")
                    updateBlock({ display_name: e.target.value });
                  else if (selection.type.includes("field"))
                    handleUpdateField({ display_name: e.target.value });
                }}
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t("fieldEditor.editor.id")}
            </label>
            <input
              type="text"
              disabled={true}
              className="w-full text-xs font-mono bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-gray-500 truncate"
              title={
                (currentObject as any)?.field_id ||
                (currentObject as any)?.block_id ||
                (currentObject as any)?.section_id ||
                selection.type
              }
              value={
                (currentObject as any)?.field_id ||
                (currentObject as any)?.block_id ||
                (currentObject as any)?.section_id ||
                selection.type
              }
            />
          </div>
        </div>

        {/* Section Specific */}
        {selection.type === "section" && (
          <div className="space-y-6">
            <div>
              <button
                onClick={handleAddBlock}
                className={`${ui.btnOutlineSecondary} w-full justify-center border-dashed`}
              >
                <Plus size={14} /> {t("fieldEditor.editor.addBlock")}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xs uppercase font-bold text-gray-500 mb-2">
                {t("fieldEditor.editor.styles.section")}
              </h3>
              <div className="pr-1">
                <StyleConfigurator
                  styleConfig={(currentObject as Section)?.style_config || {}}
                  onStyleChange={(updates: any) =>
                    updateSection({
                      style_config: {
                        ...((currentObject as Section)?.style_config || {}),
                        ...updates,
                      },
                    })
                  }
                  enabledFields={{
                    backgroundColor: true,
                    backgroundImage: true,
                    padding: true,
                    font: true,
                    primaryColor: true,
                  }}
                  singleColumn={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Header/Footer Specific */}
        {["header", "footer"].includes(selection.type) && (
          <div className="space-y-6">
            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xs uppercase font-bold text-gray-500 mb-2">
                {selection.type === "header"
                  ? t("fieldEditor.editor.styles.header")
                  : t("fieldEditor.editor.styles.footer")}
              </h3>
              <div className="pr-1">
                <StyleConfigurator
                  styleConfig={
                    (currentObject as HeaderFooterConfig)?.style_config || {}
                  }
                  onStyleChange={(updates: any) =>
                    selection.type === "header"
                      ? updateHeader({
                          style_config: {
                            ...((currentObject as HeaderFooterConfig)
                              ?.style_config || {}),
                            ...updates,
                          },
                        })
                      : updateFooter({
                          style_config: {
                            ...((currentObject as HeaderFooterConfig)
                              ?.style_config || {}),
                            ...updates,
                          },
                        })
                  }
                  enabledFields={{
                    backgroundColor: true,
                    backgroundImage: true,
                    padding: true,
                    gap: true,
                    fontSize: true,
                    primaryColor: true,
                    justifyContent: true,
                  }}
                  singleColumn={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Block Specific */}
        {selection.type === "block" && (
          <div className="space-y-6">
            <div>
              <button
                onClick={handleAddField}
                className={`${ui.btnOutlineSecondary} w-full justify-center border-dashed`}
              >
                <Plus size={14} /> {t("fieldEditor.editor.addField")}
              </button>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h3 className="text-xs uppercase font-bold text-gray-500 mb-2">
                {t("fieldEditor.editor.styles.block")}
              </h3>
              <div className="pr-1">
                <StyleConfigurator
                  styleConfig={(currentObject as Block)?.style_config || {}}
                  onStyleChange={(updates: any) =>
                    updateBlock({
                      style_config: {
                        ...((currentObject as Block)?.style_config || {}),
                        ...updates,
                      },
                    })
                  }
                  enabledFields={{
                    backgroundColor: true,
                    padding: true,
                    borderWidth: true,
                    borderColor: true,
                    borderRadius: true,
                  }}
                  singleColumn={true}
                />
              </div>
            </div>
          </div>
        )}

        {/* Field Specific (Includes header/footer fields) */}
        {selection.type.includes("field") && (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {t("fieldEditor.editor.fieldType")}
              </label>
              <select
                className={ui.selectClass}
                value={(currentObject as Field)?.type}
                onChange={(e) => {
                  const newType = e.target.value;
                  handleUpdateField({
                    type: newType as any,
                    field_config: getFieldConfigDefaults(newType),
                  });
                }}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label
                className={`${ui.imageCardClass} cursor-pointer hover:bg-gray-50 flex items-center gap-2`}
              >
                <input
                  type="checkbox"
                  checked={(currentObject as Field)?.form}
                  onChange={(e) =>
                    handleUpdateField({ form: e.target.checked })
                  }
                  className={ui.checkboxClass}
                />
                {t("fieldEditor.editor.visibility.form")}
              </label>
              <label
                className={`${ui.imageCardClass} cursor-pointer hover:bg-gray-50 flex items-center gap-2`}
              >
                <input
                  type="checkbox"
                  checked={(currentObject as Field)?.bulletin}
                  onChange={(e) =>
                    handleUpdateField({ bulletin: e.target.checked })
                  }
                  className={ui.checkboxClass}
                />
                {t("fieldEditor.editor.visibility.bulletin")}
              </label>
            </div>

            {/* Label/Description if Form is active */}
            {(currentObject as Field)?.form && (
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <div>
                  <label className={ui.labelClass}>
                    {t("fieldEditor.editor.formConfig.label")}
                  </label>
                  <input
                    type="text"
                    className={ui.inputClass}
                    value={(currentObject as Field)?.label || ""}
                    onChange={(e) =>
                      handleUpdateField({ label: e.target.value })
                    }
                    placeholder={t(
                      "fieldEditor.editor.formConfig.labelPlaceholder",
                    )}
                  />
                </div>
                <div>
                  <label className={ui.labelClass}>
                    {t("fieldEditor.editor.formConfig.description")}
                  </label>
                  <textarea
                    className={ui.inputClass}
                    rows={2}
                    value={(currentObject as Field)?.description || ""}
                    onChange={(e) =>
                      handleUpdateField({ description: e.target.value })
                    }
                    placeholder={t(
                      "fieldEditor.editor.formConfig.descriptionPlaceholder",
                    )}
                  />
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    checked={
                      (currentObject as Field)?.validation?.required || false
                    }
                    onChange={(e) => {
                      handleUpdateField({
                        validation: {
                          ...((currentObject as Field).validation || {}),
                          required: e.target.checked,
                        },
                      });
                    }}
                    className={ui.checkboxClass}
                  />
                  <span className="text-sm text-gray-700">
                    {t("fieldEditor.editor.formConfig.required")}
                  </span>
                </div>
              </div>
            )}

            {/* Bulletin Specifics: Default Value */}
            {(currentObject as Field)?.bulletin &&
              !["page_number", "text_with_icon", "image", "list"].includes(
                (currentObject as Field).type,
              ) && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                  <div>
                    <label className={ui.labelClass}>
                      {(currentObject as Field)?.form
                        ? t("fieldEditor.editor.bulletinConfig.defaultValue")
                        : t("fieldEditor.editor.bulletinConfig.contentValue")}
                    </label>
                    <input
                      type="text"
                      className={ui.inputClass}
                      value={((currentObject as Field)?.value as string) || ""}
                      onChange={(e) =>
                        handleUpdateField({ value: e.target.value })
                      }
                      placeholder={t(
                        "fieldEditor.editor.bulletinConfig.valuePlaceholder",
                      )}
                    />
                  </div>
                </div>
              )}

            {/* Configuration Specifics */}
            {((currentObject as Field)?.form ||
              ["page_number", "image", "text_with_icon", "list"].includes(
                (currentObject as Field).type,
              )) && (
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-gray-700">
                    {t("fieldEditor.editor.configuration")}
                  </label>
                </div>

                {(() => {
                  const FieldComponent = getFieldTypeComponent(
                    (currentObject as Field).type,
                  );
                  return (
                    <FieldComponent
                      currentField={currentObject as Field}
                      updateField={handleUpdateField}
                      updateFieldConfig={(updates: any) =>
                        handleUpdateField({
                          field_config: {
                            ...((currentObject as Field).field_config || {}),
                            ...updates,
                          },
                        })
                      }
                      updateValidation={(updates: any) =>
                        handleUpdateField({
                          validation: {
                            ...((currentObject as Field).validation || {}),
                            ...updates,
                          },
                        })
                      }
                      t={t}
                    />
                  );
                })()}
              </div>
            )}

            <div className="pt-4 border-t border-gray-100">
              <h3 className="text-xs uppercase font-bold text-gray-500 mb-2">
                {t("fieldEditor.editor.styles.field")}
              </h3>
              <div className="pr-1">
                <StyleConfigurator
                  styleConfig={(currentObject as Field)?.style_config || {}}
                  onStyleChange={(updates: any) =>
                    handleUpdateField({
                      style_config: {
                        ...((currentObject as Field)?.style_config || {}),
                        ...updates,
                      },
                      style_manually_edited: true,
                    })
                  }
                  enabledFields={{
                    font: true,
                    fontSize: true,
                    fontWeight: true,
                    primaryColor: true,
                    secondaryColor: true,
                    backgroundColor: true,
                    padding: true,
                    margin: true,
                    textAlign: true,
                    borderWidth: true,
                    borderColor: true,
                    borderRadius: true,
                    fontStyle: true,
                    textDecoration: true,
                  }}
                  isFieldStyle={true}
                  singleColumn={true}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title={
          t("fieldEditor.editor.deleteConfirm.title") || "Confirmar eliminación"
        }
        message={
          t("fieldEditor.editor.deleteConfirm.message") ||
          "¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer."
        }
        confirmLabel={
          t("fieldEditor.editor.deleteConfirm.confirm") || "Eliminar"
        }
        cancelLabel={t("fieldEditor.editor.deleteConfirm.cancel") || "Cancelar"}
        isDangerous={true}
      />
    </div>
  );
};
