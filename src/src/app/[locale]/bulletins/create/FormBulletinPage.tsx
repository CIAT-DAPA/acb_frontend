"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";
import { Stepper, StepConfig } from "../../components/Stepper";
import {
  CreateBulletinData,
  BulletinCreationStep,
  BulletinCreationState,
} from "../../../../types/bulletin";
import {
  TemplateVersion,
  Section,
  Block,
  Field,
} from "../../../../types/template";

import { TemplateSelectionStep } from "./steps/TemplateSelectionStep";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { SectionStep } from "./steps/SectionStep";
import { ExportStep } from "./steps/ExportStep";
import { TemplatePreview } from "../../templates/create/TemplatePreview";
import { CreateTemplateData } from "../../../../types/template";
import { ExportModal } from "../../components/ExportModal";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  CheckCircle,
  Copy,
  Check,
  Download,
} from "lucide-react";
import { TemplateAPIService } from "../../../../services/templateService";
import { BulletinAPIService } from "../../../../services/bulletinService";
import { useToast } from "../../../../components/Toast";
import { btnOutlineSecondary, btnPrimary } from "../../components/ui";
import { slugify, isValidSlug } from "../../../../utils/slugify";

// Funciones para codificar/decodificar valores de texto
const encodeTextFieldValue = (value: any): any => {
  if (typeof value === "string" && value.trim() !== "") {
    return encodeURIComponent(value);
  }
  return value;
};

const decodeTextFieldValue = (value: any): any => {
  if (typeof value === "string" && value.trim() !== "") {
    try {
      return decodeURIComponent(value);
    } catch (e) {
      // Si falla la decodificación, devolver el valor original
      return value;
    }
  }
  return value;
};

// Función para codificar todos los campos de texto en la estructura de datos
const encodeTextFields = (data: CreateBulletinData): CreateBulletinData => {
  const encodedData = JSON.parse(JSON.stringify(data)); // Deep clone

  const encodeFieldsArray = (fields: Field[]) => {
    fields.forEach((field) => {
      if (field.type === "text" || field.type === "text_with_icon") {
        field.value = encodeTextFieldValue(field.value);
      } else if (field.type === "list" && Array.isArray(field.value)) {
        field.value = field.value.map((item: any) => {
          if (typeof item === "string") {
            return encodeTextFieldValue(item);
          }
          return item;
        });
      }
    });
  };

  // Codificar header y footer
  if (encodedData.version.data.header_config?.fields) {
    encodeFieldsArray(encodedData.version.data.header_config.fields);
  }
  if (encodedData.version.data.footer_config?.fields) {
    encodeFieldsArray(encodedData.version.data.footer_config.fields);
  }

  // Codificar secciones
  encodedData.version.data.sections?.forEach((section: Section) => {
    section.blocks?.forEach((block: Block) => {
      if (block.fields) {
        encodeFieldsArray(block.fields);
      }
    });
  });

  return encodedData;
};

// Función para decodificar todos los campos de texto en la estructura de datos
const decodeTextFields = (data: CreateBulletinData): CreateBulletinData => {
  const decodedData = JSON.parse(JSON.stringify(data)); // Deep clone

  const decodeFieldsArray = (fields: Field[]) => {
    fields.forEach((field) => {
      if (field.type === "text" || field.type === "text_with_icon") {
        field.value = decodeTextFieldValue(field.value);
      } else if (field.type === "list" && Array.isArray(field.value)) {
        field.value = field.value.map((item: any) => {
          if (typeof item === "string") {
            return decodeTextFieldValue(item);
          }
          return item;
        });
      }
    });
  };

  // Decodificar header y footer
  if (decodedData.version.data.header_config?.fields) {
    decodeFieldsArray(decodedData.version.data.header_config.fields);
  }
  if (decodedData.version.data.footer_config?.fields) {
    decodeFieldsArray(decodedData.version.data.footer_config.fields);
  }

  // Decodificar secciones
  decodedData.version.data.sections?.forEach((section: Section) => {
    section.blocks?.forEach((block: Block) => {
      if (block.fields) {
        decodeFieldsArray(block.fields);
      }
    });
  });

  return decodedData;
};

interface FormBulletinPageProps {
  mode?: "create" | "edit";
  bulletinId?: string;
  initialData?: CreateBulletinData;
}

// Configuración para exportación automática (definida fuera del componente)
const getSectionPages = (section: Section) => {
  let totalPages = 1;

  section.blocks?.forEach((block) => {
    block.fields?.forEach((field) => {
      if (field.type === "list") {
        // Usar max_items_per_page directamente como en TemplatePreview
        const config = field.field_config as any;
        const maxItemsPerPage = config?.max_items_per_page
          ? Number(config.max_items_per_page)
          : 0;

        if (maxItemsPerPage > 0) {
          const items = Array.isArray(field.value) ? field.value : [];
          if (items.length > 0) {
            const pages = Math.ceil(items.length / maxItemsPerPage);
            totalPages = Math.max(totalPages, pages);
          }
        }
      }
    });
  });

  return totalPages;
};

const EXPORT_CONFIG = {
  containerSelector: "#export-preview-download",
  itemSelectorTemplate: (sectionIndex: number, pageIndex: number) =>
    `[data-section-index="${sectionIndex}"][data-page-index="${pageIndex}"]`,
  getExportElement: (element: Element) => {
    const container = element.querySelector("#template-preview-container");
    return container ? container.firstElementChild : null;
  },
  getSectionPages,
};

export default function FormBulletinPage({
  mode = "create",
  bulletinId,
  initialData,
}: FormBulletinPageProps) {
  const t = useTranslations("CreateBulletin");
  const { userInfo } = useAuth();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "es";
  const { showToast } = useToast();
  const isEditMode = mode === "edit";
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishedBulletinId, setPublishedBulletinId] = useState<string | null>(
    null
  );
  const [urlCopied, setUrlCopied] = useState(false);

  // Estado para guardar el name_machine del template (para generar URLs amigables)
  const [templateNameMachine, setTemplateNameMachine] = useState<string>("");

  // Estado para almacenar los slug names existentes
  const [existingSlugNames, setExistingSlugNames] = useState<string[]>([]);

  // Estado de paginación del preview (para sincronizar con CardFieldInput)
  const [previewPageIndex, setPreviewPageIndex] = useState(0);

  // Estado para el modal de exportación
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Estado del wizard
  const [creationState, setCreationState] = useState<BulletinCreationState>({
    currentStep: initialData ? "basic-info" : "select-template",
    currentSectionIndex: 0,
    selectedTemplateId: initialData?.master.base_template_master_id,
    selectedTemplateVersionId: initialData?.master.base_template_version_id,
    data: initialData
      ? decodeTextFields(initialData)
      : {
          master: {
            bulletin_name: "",
            name_machine: "",
            status: "draft",
            log: {
              created_at: new Date().toISOString(),
              creator_user_id: "",
              creator_first_name: null,
              creator_last_name: null,
            },
            base_template_master_id: "",
            base_template_version_id: "",
            access_config: {
              access_type: "public",
              allowed_groups: [],
            },
          },
          version: {
            version_num: 1,
            commit_message: "",
            log: {
              created_at: new Date().toISOString(),
              creator_user_id: "",
              creator_first_name: null,
              creator_last_name: null,
            },
            data: {
              style_config: {},
              header_config: { fields: [] },
              footer_config: { fields: [] },
              sections: [],
            },
          },
        },
    errors: {},
    isValid: false,
  });

  const [isLoading, setIsLoading] = useState(false);

  // Cargar los slug names existentes al montar el componente
  useEffect(() => {
    const loadSlugNames = async () => {
      const response = await BulletinAPIService.getAllSlugNames();
      if (response.success && response.data) {
        // Si estamos en modo edición, excluir el slug actual de la lista de existentes
        // para permitir guardar sin cambios en el slug
        let slugs = response.data;
        if (isEditMode && initialData?.master.name_machine) {
          slugs = slugs.filter(
            (slug) => slug !== initialData.master.name_machine
          );
        }
        setExistingSlugNames(slugs);
      }
    };
    loadSlugNames();
  }, [isEditMode, initialData]);

  // Cargar el name_machine del template cuando hay initialData (modo edición)
  useEffect(() => {
    const loadTemplateNameMachine = async () => {
      if (initialData && initialData.master.base_template_master_id) {
        try {
          const response = await TemplateAPIService.getCurrentVersion(
            initialData.master.base_template_master_id
          );
          if (response.success && response.data?.master.name_machine) {
            setTemplateNameMachine(response.data.master.name_machine);
          }
        } catch (error) {
          console.error("Error loading template name_machine:", error);
        }
      }
    };

    loadTemplateNameMachine();
  }, [initialData]);

  // Helper para extraer todas las URLs de imágenes del boletín
  const extractImageUrls = useCallback((data: CreateBulletinData): string[] => {
    const imageUrls: string[] = [];

    const extractFromFields = (fields: Field[]) => {
      fields.forEach((field) => {
        if (
          field.type === "image_upload" &&
          field.value &&
          typeof field.value === "string"
        ) {
          imageUrls.push(field.value);
        }
      });
    };

    // Extraer de header
    if (data.version.data.header_config?.fields) {
      extractFromFields(data.version.data.header_config.fields);
    }

    // Extraer de footer
    if (data.version.data.footer_config?.fields) {
      extractFromFields(data.version.data.footer_config.fields);
    }

    // Extraer de secciones
    data.version.data.sections.forEach((section) => {
      // Header de sección
      if (section.header_config?.fields) {
        extractFromFields(section.header_config.fields);
      }

      // Footer de sección
      if (section.footer_config?.fields) {
        extractFromFields(section.footer_config.fields);
      }

      // Bloques de sección
      section.blocks.forEach((block) => {
        extractFromFields(block.fields);
      });
    });

    return imageUrls;
  }, []);

  // Cargar template seleccionado y llenar estructura inicial
  const loadTemplateVersion = useCallback(
    async (templateId: string) => {
      setIsLoading(true);
      try {
        const response = await TemplateAPIService.getCurrentVersion(templateId);

        if (response.success && response.data) {
          const { current_version, master } = response.data;

          // Guardar el name_machine del template para usarlo en las URLs
          if (master.name_machine) {
            setTemplateNameMachine(master.name_machine);
          }

          // Verificar que existe el content
          if (!current_version.content) {
            console.error(
              "Response does not have content property:",
              current_version
            );
            throw new Error(
              "La respuesta del template no tiene la estructura esperada"
            );
          }

          // Extraer información de la versión actual
          const versionId = current_version._id;
          const content = current_version.content;

          // Validar que versionId existe (es obligatorio)
          if (!versionId) {
            console.error("Template version ID is missing");
            throw new Error(
              "No se pudo obtener el ID de la versión del template"
            );
          }

          // Generar nombre por defecto: [Nombre Template] - [Mes Actual]
          const monthName = new Intl.DateTimeFormat(locale, {
            month: "long",
          }).format(new Date());
          const capitalizedMonth =
            monthName.charAt(0).toUpperCase() + monthName.slice(1);
          const defaultBulletinName = `${master.template_name} - ${capitalizedMonth}`;
          const defaultNameMachine = slugify(defaultBulletinName);

          // Helper para inicializar el valor de un campo según su tipo
          const initializeFieldValue = (field: Field) => {
            if (field.type === "list") {
              // Para campos de tipo list, inicializar como array vacío
              return field.value || [];
            }
            if (field.type === "text" || field.type === "text_with_icon") {
              // Para campos de texto, inicializar como string vacío
              return field.value || "";
            }
            return field.value || null;
          };

          // Inicializar datos del boletín con la estructura del template
          setCreationState((prev) => ({
            ...prev,
            selectedTemplateId: templateId,
            selectedTemplateVersionId: versionId,
            data: {
              ...prev.data,
              master: {
                ...prev.data.master,
                bulletin_name: defaultBulletinName,
                name_machine: defaultNameMachine,
                base_template_master_id: templateId,
                base_template_version_id: versionId,
                access_config: master.access_config || {
                  access_type: "public",
                  allowed_groups: [],
                },
              },
              version: {
                ...prev.data.version,
                data: {
                  style_config: content.style_config,
                  header_config: content.header_config
                    ? {
                        ...content.header_config,
                        fields: content.header_config.fields.map(
                          (field: Field) => ({
                            ...field,
                            value: initializeFieldValue(field),
                          })
                        ),
                      }
                    : { fields: [] },
                  footer_config: content.footer_config
                    ? {
                        ...content.footer_config,
                        fields: content.footer_config.fields.map(
                          (field: Field) => ({
                            ...field,
                            value: initializeFieldValue(field),
                          })
                        ),
                      }
                    : { fields: [] },
                  sections: content.sections.map((section: Section) => ({
                    ...section,
                    header_config: section.header_config
                      ? {
                          ...section.header_config,
                          fields: section.header_config.fields.map(
                            (field: Field) => ({
                              ...field,
                              value: initializeFieldValue(field),
                            })
                          ),
                        }
                      : undefined,
                    footer_config: section.footer_config
                      ? {
                          ...section.footer_config,
                          fields: section.footer_config.fields.map(
                            (field: Field) => ({
                              ...field,
                              value: initializeFieldValue(field),
                            })
                          ),
                        }
                      : undefined,
                    blocks: section.blocks.map((block: Block) => ({
                      ...block,
                      fields: block.fields.map((field: Field) => ({
                        ...field,
                        value: initializeFieldValue(field),
                      })),
                    })),
                  })),
                },
              },
            },
          }));
        }
      } catch (error) {
        console.error("Error loading template version:", error);
        showToast(t("errorLoadingTemplate"), "error");
      } finally {
        setIsLoading(false);
      }
    },
    [showToast, t]
  );

  // Función para actualizar datos del boletín
  const updateBulletinData = useCallback(
    (updater: (prev: CreateBulletinData) => CreateBulletinData) => {
      setCreationState((prev) => ({
        ...prev,
        data: updater(prev.data),
      }));
    },
    []
  );

  // Navegar a un paso específico
  const goToStep = useCallback((step: BulletinCreationStep) => {
    setCreationState((prev) => {
      // Extraer el índice de la sección si el paso es "section-N"
      let sectionIndex = prev.currentSectionIndex;
      if (step.startsWith("section-")) {
        const match = step.match(/section-(\d+)/);
        if (match) {
          sectionIndex = parseInt(match[1], 10);
        }
      }

      return {
        ...prev,
        currentStep: step,
        currentSectionIndex: sectionIndex,
      };
    });
  }, []);

  // Configuración de los pasos del stepper
  const stepConfigs = useMemo((): StepConfig[] => {
    const baseSteps: StepConfig[] = [];

    // En modo edición, no incluimos el paso de seleccionar template
    if (!isEditMode) {
      baseSteps.push({
        id: "select-template",
        title: t("selectTemplate.title"),
        description: t("selectTemplate.description"),
      });
    }

    baseSteps.push({
      id: "basic-info",
      title: t("basicInfo.title"),
      description: t("basicInfo.description"),
    });

    // Agregar un paso por cada sección
    const sectionSteps: StepConfig[] =
      creationState.data.version.data.sections.map((section, index) => ({
        id: `section-${index}`,
        title: section.display_name || `${t("section.title")} ${index + 1}`,
        description: t("section.description"),
      }));

    // Agregar paso de exportación al final
    const exportStep: StepConfig = {
      id: "export",
      title: t("export.title"),
      description: t("export.description"),
    };

    return [...baseSteps, ...sectionSteps, exportStep];
  }, [t, creationState.data.version.data.sections, isEditMode]);

  // Obtener índice del paso actual
  const currentStepIndex = useMemo(() => {
    return stepConfigs.findIndex(
      (step) => step.id === creationState.currentStep
    );
  }, [stepConfigs, creationState.currentStep]);

  // Validar paso actual
  const isCurrentStepValid = useMemo(() => {
    switch (creationState.currentStep) {
      case "select-template":
        return !!creationState.selectedTemplateId;
      case "basic-info":
        const name = creationState.data.master.bulletin_name.trim();
        const nameMachine = creationState.data.master.name_machine.trim();
        const isNameValid = name.length > 0;
        const isSlugValid =
          nameMachine.length > 0 &&
          isValidSlug(nameMachine) &&
          !existingSlugNames.includes(nameMachine);
        return isNameValid && isSlugValid;
      case "export":
        return true; // El paso de exportación siempre es válido
      default:
        // Para pasos de sección
        if (creationState.currentStep.startsWith("section-")) {
          return true; // Las secciones son opcionales
        }
        return false;
    }
  }, [
    creationState.currentStep,
    creationState.selectedTemplateId,
    creationState.data.master.bulletin_name,
  ]);

  // Navegación: siguiente paso
  const handleNext = useCallback(() => {
    if (!isCurrentStepValid) return;

    const nextIndex = currentStepIndex + 1;
    if (nextIndex < stepConfigs.length) {
      goToStep(stepConfigs[nextIndex].id as BulletinCreationStep);
    }
  }, [currentStepIndex, stepConfigs, goToStep, isCurrentStepValid]);

  // Navegación: paso anterior
  const handlePrevious = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(stepConfigs[prevIndex].id as BulletinCreationStep);
    }
  }, [currentStepIndex, stepConfigs, goToStep]);

  // Click en un paso del stepper
  const handleStepClick = useCallback(
    (stepIndex: number) => {
      // Solo permitir navegar a pasos si ya se seleccionó template
      if (stepIndex === 0 || creationState.selectedTemplateId) {
        goToStep(stepConfigs[stepIndex].id as BulletinCreationStep);
      }
    },
    [stepConfigs, goToStep, creationState.selectedTemplateId]
  );

  // Finalizar creación del boletín
  const handleFinish = useCallback(async () => {
    if (!isCurrentStepValid) return;

    setIsLoading(true);
    try {
      // Codificar los campos de texto antes de guardar
      const encodedData = encodeTextFields(creationState.data);

      if (isEditMode && bulletinId) {
        // MODO EDICIÓN: Actualizar bulletin existente
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        // 1. Actualizar bulletin master
        const masterResponse = await BulletinAPIService.updateBulletin(
          bulletinId,
          masterDataWithoutLog
        );

        if (!masterResponse.success) {
          throw new Error(
            masterResponse.message || "Error al actualizar el boletín"
          );
        }

        const { log: versionLog, ...versionDataWithoutLog } =
          encodedData.version;

        // 2. Crear nueva versión del boletín
        const versionResponse = await BulletinAPIService.createBulletinVersion(
          bulletinId,
          versionDataWithoutLog
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message ||
              "Error al crear la versión del boletín actualizado"
          );
        }

        showToast(t("updateSuccess"), "success");
      } else {
        // MODO CREACIÓN: Crear nuevo bulletin
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        const masterResponse = await BulletinAPIService.createBulletin(
          masterDataWithoutLog
        );

        if (!masterResponse.success || !masterResponse.data) {
          throw new Error(
            masterResponse.message || "Error al crear el boletín"
          );
        }

        const newBulletinId =
          (masterResponse.data as any).id || masterResponse.data._id;

        const { log: versionLog, ...versionDataWithoutLog } =
          encodedData.version;

        // 2. Crear primera versión del boletín
        const versionResponse = await BulletinAPIService.createBulletinVersion(
          newBulletinId,
          versionDataWithoutLog
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || "Error al crear la versión del boletín"
          );
        }

        showToast(t("success"), "success");
      }

      // Redirigir a la lista de boletines
      router.push("/bulletins");
    } catch (error) {
      console.error("Error saving bulletin:", error);
      showToast(error instanceof Error ? error.message : t("error"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    isCurrentStepValid,
    creationState.data,
    showToast,
    t,
    router,
    isEditMode,
    bulletinId,
  ]);

  // Función para guardar como borrador
  const handleSave = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Asegurarse de que el estado sea draft
      const draftData = {
        ...creationState.data,
        master: {
          ...creationState.data.master,
          status: "draft",
        },
      };

      // Codificar los campos de texto antes de guardar
      const encodedData = encodeTextFields(draftData);

      if (isEditMode && bulletinId) {
        // MODO EDICIÓN: Actualizar el boletín existente
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        // 1. Actualizar bulletin master con status draft
        const masterResponse = await BulletinAPIService.updateBulletin(
          bulletinId,
          masterDataWithoutLog
        );

        if (!masterResponse.success) {
          throw new Error(
            masterResponse.message || "Error al actualizar el boletín"
          );
        }

        const { log: versionLog, ...versionDataWithoutLog } =
          encodedData.version;

        // 2. Crear nueva versión con los cambios
        const versionResponse = await BulletinAPIService.createBulletinVersion(
          bulletinId,
          versionDataWithoutLog
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || "Error al crear la versión del boletín"
          );
        }

        showToast(t("savedAsDraft") || t("success"), "success");
      } else {
        // MODO CREACIÓN: Crear nuevo bulletin
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        const masterResponse = await BulletinAPIService.createBulletin(
          masterDataWithoutLog
        );

        if (!masterResponse.success || !masterResponse.data) {
          throw new Error(
            masterResponse.message || "Error al crear el boletín"
          );
        }

        const newBulletinId =
          (masterResponse.data as any).id || masterResponse.data._id;

        const { log: versionLog, ...versionDataWithoutLog } =
          encodedData.version;

        const versionResponse = await BulletinAPIService.createBulletinVersion(
          newBulletinId,
          versionDataWithoutLog
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || "Error al crear la versión del boletín"
          );
        }

        showToast(t("savedAsDraft") || t("success"), "success");
      }

      router.push("/bulletins");
    } catch (error) {
      console.error("Error saving draft:", error);
      showToast(error instanceof Error ? error.message : t("error"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    creationState.data,
    isEditMode,
    bulletinId,
    showToast,
    t,
    router,
  ]);

  // Función para publicar
  const handlePublish = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Extraer todas las imágenes temporales para moverlas a permanentes
      const tempImages = extractImageUrls(creationState.data).filter((url) =>
        url.includes("/bulletins/temp/")
      );

      // Mover imágenes a almacenamiento permanente
      let finalizedData = creationState.data;
      if (tempImages.length > 0) {
        const finalizeResponse = await fetch("/api/finalize-bulletin-images", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tempImages }),
        });

        if (finalizeResponse.ok) {
          const { images: permanentImages } = await finalizeResponse.json();

          // Actualizar las URLs en los datos del boletín
          const updateImageUrls = (
            data: CreateBulletinData,
            urlMap: Map<string, string>
          ) => {
            const updateFields = (fields: Field[]) => {
              fields.forEach((field) => {
                if (
                  field.type === "image_upload" &&
                  field.value &&
                  typeof field.value === "string"
                ) {
                  const newUrl = urlMap.get(field.value);
                  if (newUrl) {
                    field.value = newUrl;
                  }
                }
              });
            };

            if (data.version.data.header_config?.fields) {
              updateFields(data.version.data.header_config.fields);
            }

            if (data.version.data.footer_config?.fields) {
              updateFields(data.version.data.footer_config.fields);
            }

            data.version.data.sections.forEach((section) => {
              if (section.header_config?.fields) {
                updateFields(section.header_config.fields);
              }

              if (section.footer_config?.fields) {
                updateFields(section.footer_config.fields);
              }

              section.blocks.forEach((block) => {
                updateFields(block.fields);
              });
            });
          };

          // Crear mapa de URLs temporales a permanentes
          const urlMap = new Map<string, string>();
          tempImages.forEach((tempUrl, index) => {
            urlMap.set(tempUrl, permanentImages[index]);
          });

          finalizedData = JSON.parse(JSON.stringify(creationState.data));
          updateImageUrls(finalizedData, urlMap);
        }
      }

      // Asegurarse de que el estado sea published
      const publishedData = {
        ...finalizedData,
        master: {
          ...finalizedData.master,
          status: "published",
        },
      };

      // Codificar los campos de texto antes de guardar
      const encodedData = encodeTextFields(publishedData);

      if (isEditMode && bulletinId) {
        // MODO EDICIÓN: Actualizar el boletín existente
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        // 1. Actualizar bulletin master con status published
        const masterResponse = await BulletinAPIService.updateBulletin(
          bulletinId,
          masterDataWithoutLog
        );

        if (!masterResponse.success) {
          throw new Error(
            masterResponse.message || "Error al publicar el boletín"
          );
        }

        const { log: versionLog, ...versionDataWithoutLog } =
          encodedData.version;

        // 2. Crear nueva versión con los cambios
        const versionResponse = await BulletinAPIService.createBulletinVersion(
          bulletinId,
          versionDataWithoutLog
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || "Error al crear la versión del boletín"
          );
        }

        setPublishedBulletinId(bulletinId);
        setShowPublishModal(true);
      } else {
        // MODO CREACIÓN: Crear nuevo bulletin
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        const masterResponse = await BulletinAPIService.createBulletin(
          masterDataWithoutLog
        );

        if (!masterResponse.success || !masterResponse.data) {
          throw new Error(
            masterResponse.message || "Error al crear el boletín"
          );
        }

        const newBulletinId =
          (masterResponse.data as any).id || masterResponse.data._id;

        const { log: versionLog, ...versionDataWithoutLog } =
          encodedData.version;

        const versionResponse = await BulletinAPIService.createBulletinVersion(
          newBulletinId,
          versionDataWithoutLog
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || "Error al crear la versión del boletín"
          );
        }

        setPublishedBulletinId(newBulletinId);
        setShowPublishModal(true);
      }
    } catch (error) {
      console.error("Error publishing bulletin:", error);
      showToast(error instanceof Error ? error.message : t("error"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    creationState.data,
    isEditMode,
    bulletinId,
    showToast,
    t,
    extractImageUrls,
  ]);

  // Convertir bulletinData a CreateTemplateData para el preview
  const previewData = useMemo((): CreateTemplateData | null => {
    const headerFields = creationState.data.version.data.header_config?.fields;

    if (!creationState.selectedTemplateId) {
      return null;
    }

    // Determinar qué secciones mostrar según el paso actual
    let sectionsToShow = creationState.data.version.data.sections;

    // Si estamos en un paso de sección específica, mostrar solo esa sección
    if (creationState.currentStep.startsWith("section-")) {
      const currentSection =
        creationState.data.version.data.sections[
          creationState.currentSectionIndex
        ];
      if (currentSection) {
        sectionsToShow = [currentSection];
      }
    }

    return {
      master: {
        template_name:
          creationState.data.master.bulletin_name || "Vista previa",
        name_machine: creationState.data.master.name_machine || "vista-previa",
        description: "",
        status: "active",
        log: creationState.data.master.log,
        access_config: {
          access_type: "public",
          allowed_groups: [],
        },
      },
      version: {
        version_num: 1,
        commit_message: "",
        log: creationState.data.version.log,
        content: {
          style_config: creationState.data.version.data.style_config || {},
          header_config: creationState.data.version.data.header_config,
          footer_config: creationState.data.version.data.footer_config,
          sections: sectionsToShow,
        },
      },
    };
  }, [creationState]);

  // Datos completos para exportación (siempre incluye todas las secciones)
  const exportData = useMemo((): CreateTemplateData | null => {
    if (!creationState.selectedTemplateId) {
      return null;
    }

    return {
      master: {
        template_name:
          creationState.data.master.bulletin_name || "Vista previa",
        name_machine: creationState.data.master.name_machine || "vista-previa",
        description: "",
        status: "active",
        log: creationState.data.master.log,
        access_config: {
          access_type: "public",
          allowed_groups: [],
        },
      },
      version: {
        version_num: 1,
        commit_message: "",
        log: creationState.data.version.log,
        content: {
          style_config: creationState.data.version.data.style_config || {},
          header_config: creationState.data.version.data.header_config,
          footer_config: creationState.data.version.data.footer_config,
          sections: creationState.data.version.data.sections, // SIEMPRE TODAS
        },
      },
    };
  }, [creationState.data, creationState.selectedTemplateId]);

  // Renderizar contenido del paso actual
  const renderStepContent = () => {
    switch (creationState.currentStep) {
      case "select-template":
        return (
          <TemplateSelectionStep
            onSelectTemplate={(templateId) => {
              loadTemplateVersion(templateId);
            }}
            selectedTemplateId={creationState.selectedTemplateId}
          />
        );

      case "basic-info":
        return (
          <BasicInfoStep
            bulletinData={creationState.data}
            onUpdate={updateBulletinData}
            existingSlugNames={existingSlugNames}
          />
        );

      case "export":
        return (
          <ExportStep
            previewData={previewData!}
            bulletinName={creationState.data.master.bulletin_name}
            onExport={() => {
              // Handler se configura internamente en ExportStep
            }}
          />
        );

      default:
        // Pasos de sección
        if (creationState.currentStep.startsWith("section-")) {
          const sectionIndex = parseInt(
            creationState.currentStep.replace("section-", "")
          );

          return (
            <SectionStep
              bulletinData={creationState.data}
              sectionIndex={sectionIndex}
              onUpdate={updateBulletinData}
              currentPageIndex={previewPageIndex}
              onPageChange={setPreviewPageIndex}
            />
          );
        }
        return null;
    }
  };

  const isLastStep = currentStepIndex === stepConfigs.length - 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href="/bulletins"
            className="inline-flex items-center gap-2 text-[#283618] hover:text-[#606c38] transition-colors mb-4"
          >
            <ArrowLeft size={20} />
            <span>{t("backToBulletins")}</span>
          </Link>
        </div>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-[#283618]">
            {isEditMode ? t("titleEdit") : t("title")}
          </h1>
          <p className="text-[#606c38] mt-2">
            {isEditMode ? t("subtitleEdit") : t("subtitle")}
          </p>
        </div>

        {/* Stepper */}
        <div className="mb-8">
          <Stepper
            steps={stepConfigs}
            currentStepIndex={currentStepIndex}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Main Content: Form and Preview */}
        {creationState.currentStep === "export" ? (
          // Layout de ancho completo para el paso de exportación
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Step Content */}
            <div className="min-h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#283618]"></div>
                </div>
              ) : (
                renderStepContent()
              )}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 mt-6 border-t">
              <button
                onClick={handlePrevious}
                disabled={currentStepIndex === 0}
                className={`${btnOutlineSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <ArrowLeft className="w-4 h-4 mr-1" />{" "}
                {t("navigation.previous")}
              </button>
            </div>
          </div>
        ) : (
          // Layout de dos columnas para los otros pasos
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left: Form */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              {/* Step Content */}
              <div className="min-h-[400px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#283618]"></div>
                  </div>
                ) : (
                  renderStepContent()
                )}
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 mt-6 border-t">
                <button
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                  className={`${btnOutlineSecondary} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <ArrowLeft className="w-4 h-4 mr-1" />{" "}
                  {t("navigation.previous")}
                </button>

                <div className="flex gap-3">
                  {isLastStep ? (
                    <button
                      onClick={handleFinish}
                      disabled={!isCurrentStepValid || isLoading}
                      className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isLoading
                        ? t("navigation.creating")
                        : t("navigation.finish")}
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      disabled={!isCurrentStepValid}
                      className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {t("navigation.next")}{" "}
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Preview */}
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-8 self-start">
              <h3 className="text-xl font-semibold text-[#283618] mb-4">
                {t("preview.title")}
              </h3>
              {previewData ? (
                <div
                  id="bulletin-preview-container"
                  className="rounded-lg overflow-hidden"
                >
                  <TemplatePreview
                    data={previewData}
                    moreInfo={true}
                    description={true}
                    forceGlobalHeader={
                      creationState.currentStep === "basic-info"
                    }
                    currentPageIndex={previewPageIndex}
                    onPageChange={setPreviewPageIndex}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64 text-[#606c38]">
                  {t("preview.selectTemplate")}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Actions Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 flex flex-wrap justify-end gap-4 bg-white p-4 rounded-lg shadow-sm">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className={`${btnOutlineSecondary} disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2`}
          >
            <Save className="w-4 h-4" />
            {isLoading ? t("navigation.saving") : t("navigation.save")}
          </button>

          <button
            onClick={() => setIsExportModalOpen(true)}
            className={`${btnPrimary} inline-flex items-center gap-2`}
          >
            <Download className="w-4 h-4" />
            {t("navigation.export")}
          </button>

          <button
            onClick={handlePublish}
            disabled={isLoading}
            className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2`}
          >
            <CheckCircle className="w-4 h-4" />
            {isLoading ? t("navigation.publishing") : t("navigation.publish")}
          </button>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        templateData={exportData || undefined}
        contentName={creationState.data.master.bulletin_name}
        autoExport={true}
        exportConfig={EXPORT_CONFIG}
        sections={exportData?.version.content.sections || []}
      />

      {/* Modal de publicación exitosa */}
      {showPublishModal && publishedBulletinId && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full">
            <h2 className="text-2xl font-bold text-[#283618] mb-4">
              {t("publishModal.title")}
            </h2>
            <p className="text-[#606c38] mb-6">{t("publishModal.message")}</p>

            {/* URL Section */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#283618] mb-2">
                {t("publishModal.urlLabel")}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={`${window.location.origin}/${locale}/${templateNameMachine}/${creationState.data.master.name_machine}`}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-[#283618] text-sm"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/${locale}/${templateNameMachine}/${creationState.data.master.name_machine}`
                    );
                    setUrlCopied(true);
                    setTimeout(() => setUrlCopied(false), 2000);
                  }}
                  className={`${btnOutlineSecondary}`}
                >
                  {urlCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t("publishModal.copied")}
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      {t("publishModal.copyUrl")}
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col justify-between sm:flex-row gap-3">
              <button
                onClick={() => {
                  setShowPublishModal(false);
                  setUrlCopied(false);
                  router.push("/bulletins");
                }}
                className={`${btnOutlineSecondary} `}
              >
                {t("publishModal.close")}
              </button>
              <Link
                href={`/${locale}/${templateNameMachine}/${creationState.data.master.name_machine}`}
                className={`${btnPrimary}`}
              >
                {t("publishModal.viewLink")}
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
