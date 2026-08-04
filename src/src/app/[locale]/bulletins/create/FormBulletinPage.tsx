"use client";

import React, { useState, useCallback, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "../../../../hooks/useAuth";
import usePermissions from "../../../../hooks/usePermissions";
import { Stepper, StepConfig } from "../../components/Stepper";
import {
  CreateBulletinData,
  BulletinCreationStep,
  BulletinCreationState,
  BulletinStatus,
} from "../../../../types/bulletin";
import {
  TemplateVersion,
  Section,
  Block,
  Field,
} from "../../../../types/template";
import type {
  BulletinSection,
  BulletinSectionPage,
} from "../../../../types/bulletin";

import { TemplateSelectionStep } from "./steps/TemplateSelectionStep";
import { BasicInfoStep } from "./steps/BasicInfoStep";
import { SectionStep } from "./steps/SectionStep";
import { ExportStep } from "./steps/ExportStep";
import { UnifiedBulletinPreview } from "../../components/UnifiedBulletinPreview";
import { CreateTemplateData } from "../../../../types/template";
import { ExportModal } from "../../components/ExportModal";
import { ConfirmationModal } from "../../components/ConfirmationModal";
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
import { ReviewService } from "../../../../services/reviewService";
import { useToast } from "../../../../components/Toast";
import { btnOutlineSecondary, btnPrimary } from "../../components/ui";
import { slugify, isValidSlug } from "../../../../utils/slugify";
import { BulletinComment } from "@/types/bulletin"; // Updated to use renamed BulletinComment type
import { MODULES, PERMISSION_ACTIONS } from "../../../../types/core";
import { decodeReviewFieldId } from "@/utils/reviewTarget";
import type { ReviewComment } from "../../../../types/review";
import { ReviewCommentThread } from "./components/ReviewCommentThread";
import {
  BULLETIN_NAME_VALIDATION_ID,
  BULLETIN_SLUG_VALIDATION_ID,
  getBasicInfoRequiredFieldIssues,
  getSectionRequiredFieldIssues,
  toRequiredFieldValidationResult,
  type RequiredFieldIssue,
} from "@/utils/bulletinRequiredFields";

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

  const encodeSectionPages = (section: BulletinSection) => {
    section.repeatable_pages?.forEach((page) => {
      if (page.header_config?.fields) {
        encodeFieldsArray(page.header_config.fields);
      }
      if (page.footer_config?.fields) {
        encodeFieldsArray(page.footer_config.fields);
      }
      page.blocks?.forEach((block) => {
        if (block.fields) {
          encodeFieldsArray(block.fields);
        }
      });
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

    encodeSectionPages(section as BulletinSection);
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

  const decodeSectionPages = (section: BulletinSection) => {
    section.repeatable_pages?.forEach((page) => {
      if (page.header_config?.fields) {
        decodeFieldsArray(page.header_config.fields);
      }
      if (page.footer_config?.fields) {
        decodeFieldsArray(page.footer_config.fields);
      }
      page.blocks?.forEach((block) => {
        if (block.fields) {
          decodeFieldsArray(block.fields);
        }
      });
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

    decodeSectionPages(section as BulletinSection);
  });

  return decodedData;
};

const createBlankFieldValue = (field: Field): any => {
  switch (field.type) {
    case "list":
    case "card":
      return [];
    case "climate_data_puntual":
    case "moon_calendar":
      return {};
    case "date_range":
      return {
        start_date: "",
        end_date: "",
        start_moon_phase: undefined,
        end_moon_phase: undefined,
      };
    case "number":
      return null;
    case "text_with_icon":
    case "text":
    case "select":
    case "searchable":
    case "select_with_icons":
    case "select_background":
    case "date":
    case "image_upload":
    default:
      return "";
  }
};

const cloneFieldForRepeatablePage = (field: Field): Field => {
  const cloned = structuredClone(field);
  cloned.field_id = crypto.randomUUID();
  // Solo limpiar el valor si el campo es editable (form=true)
  if (cloned.form) {
    cloned.value = createBlankFieldValue(cloned);
  }
  return cloned;
};

const cloneHeaderFooterForRepeatablePage = (config?: {
  style_config?: any;
  fields: Field[];
}): { style_config?: any; fields: Field[] } | undefined => {
  if (!config) {
    return undefined;
  }

  return {
    ...structuredClone(config),
    fields: (config.fields || []).map(cloneFieldForRepeatablePage),
  };
};

const createRepeatablePageFromSection = (
  section: Pick<
    Section,
    "display_name" | "blocks" | "header_config" | "footer_config"
  >,
  pageTitle: string,
): BulletinSectionPage => ({
  page_id: crypto.randomUUID(),
  page_title: pageTitle,
  header_config: cloneHeaderFooterForRepeatablePage(section.header_config),
  footer_config: cloneHeaderFooterForRepeatablePage(section.footer_config),
  blocks: (section.blocks || []).map((block) => ({
    ...structuredClone(block),
    block_id: crypto.randomUUID(),
    fields: (block.fields || []).map(cloneFieldForRepeatablePage),
  })),
});

const normalizeReviewComment = (comment: ReviewComment): BulletinComment => {
  const commentId = comment.comment_id || comment.id;

  if (!commentId) {
    throw new Error("The API response does not include a comment ID");
  }

  return {
    comment_id: commentId,
    text: comment.text,
    author_id: comment.author_id,
    author_first_name: comment.author_first_name,
    author_last_name: comment.author_last_name,
    created_at: new Date(comment.created_at),
    bulletin_version_id: comment.bulletin_version_id,
    replies: comment.replies?.map(normalizeReviewComment),
  };
};

const appendReplyToComment = (
  currentComments: BulletinComment[],
  parentCommentId: string,
  reply: BulletinComment,
): BulletinComment[] =>
  currentComments.map((comment) => {
    if (comment.comment_id === parentCommentId) {
      return {
        ...comment,
        replies: [...(comment.replies || []), reply],
      };
    }

    if (!comment.replies?.length) {
      return comment;
    }

    return {
      ...comment,
      replies: appendReplyToComment(comment.replies, parentCommentId, reply),
    };
  });

interface FormBulletinPageProps {
  mode?: "create" | "edit";
  bulletinId?: string;
  initialData?: CreateBulletinData;
  comments?: BulletinComment[]; // Updated type to BulletinComment[]
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
      } else if (field.type === "card" && Array.isArray(field.value)) {
        // Detectar paginación para cards (cada card es una página)
        const cards = field.value;
        if (cards.length > 1) {
          totalPages = Math.max(totalPages, cards.length);
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

const RANDOM_SLUG_SUFFIX_LENGTH = 6;

const createRandomSlugSuffix = () =>
  Math.random()
    .toString(36)
    .slice(2, 2 + RANDOM_SLUG_SUFFIX_LENGTH);

const generateUniqueMachineName = (
  baseSlug: string,
  existingSlugs: string[],
): string => {
  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug;
  }

  let candidate = `${baseSlug}_${createRandomSlugSuffix()}`;
  while (existingSlugs.includes(candidate)) {
    candidate = `${baseSlug}_${createRandomSlugSuffix()}`;
  }

  return candidate;
};

export default function FormBulletinPage({
  mode = "create",
  bulletinId,
  initialData,
  comments,
}: FormBulletinPageProps) {
  const t = useTranslations("CreateBulletin");
  const { userInfo } = useAuth();
  const { can } = usePermissions();
  const router = useRouter();
  const params = useParams();
  const locale = (params.locale as string) || "es";
  const bulletinsPath = `/${locale}/bulletins`;
  const { showToast } = useToast();
  const isEditMode = mode === "edit";
  const hasReviewCrudPermissions =
    can(PERMISSION_ACTIONS.Create, MODULES.REVIEW) ||
    can(PERMISSION_ACTIONS.Read, MODULES.REVIEW) ||
    can(PERMISSION_ACTIONS.Update, MODULES.REVIEW) ||
    can(PERMISSION_ACTIONS.Delete, MODULES.REVIEW);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState<
    "review" | "publish" | null
  >(null);
  const [persistedBulletinId, setPersistedBulletinId] = useState<string | null>(
    bulletinId ?? null,
  );
  const [showDraftSavedModal, setShowDraftSavedModal] = useState(false);
  const [publishedBulletinId, setPublishedBulletinId] = useState<string | null>(
    null,
  );
  const [urlCopied, setUrlCopied] = useState(false);

  useEffect(() => {
    if (bulletinId) {
      setPersistedBulletinId(bulletinId);
    }
  }, [bulletinId]);

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
  const [reviewComments, setReviewComments] = useState<BulletinComment[]>(
    comments || [],
  );

  useEffect(() => {
    setReviewComments(comments || []);
  }, [comments]);

  const canReplyToComments = isEditMode && Boolean(persistedBulletinId);

  const handleReplyToComment = useCallback(
    async (parentCommentId: string, text: string) => {
      const currentBulletinId = persistedBulletinId || bulletinId;

      if (!currentBulletinId) {
        const message = t("comments.missingBulletin");
        showToast(message, "error");
        throw new Error(message);
      }

      try {
        const createdComment = await ReviewService.addComment(
          currentBulletinId,
          {
            text,
            parent_comment_id: parentCommentId,
          },
        );

        const reply = normalizeReviewComment(createdComment);

        setReviewComments((currentComments) =>
          appendReplyToComment(currentComments, parentCommentId, reply),
        );

        showToast(t("comments.replySuccess"), "success");
      } catch (error) {
        const message =
          error instanceof Error ? error.message : t("comments.replyError");

        showToast(message, "error");
        throw error;
      }
    },
    [bulletinId, persistedBulletinId, showToast, t],
  );

  // Group comments by target_element
  const groupedComments = useMemo(() => {
    const generalComments: BulletinComment[] = [];

    const sectionComments: Record<string, BulletinComment[]> = {};

    const blockComments: Record<string, BulletinComment[]> = {};

    const fieldComments: Record<string, BulletinComment[]> = {};

    const fieldAllComments: Record<string, BulletinComment[]> = {};

    const addComment = (
      collection: Record<string, BulletinComment[]>,
      key: string,
      comment: BulletinComment,
    ) => {
      if (!collection[key]) {
        collection[key] = [];
      }

      collection[key].push(comment);
    };

    reviewComments.forEach((comment) => {
      const target = comment.target_element;

      if (!target) {
        generalComments.push(comment);
        return;
      }

      if (target.field_id) {
        const exactFieldTargetId = target.field_id;

        addComment(fieldComments, exactFieldTargetId, comment);

        const decodedTarget = decodeReviewFieldId(exactFieldTargetId);

        const parentFieldId =
          decodedTarget?.parentFieldId || exactFieldTargetId;

        addComment(fieldAllComments, parentFieldId, comment);

        return;
      }

      if (target.block_id) {
        addComment(blockComments, target.block_id, comment);

        return;
      }

      if (target.section_id) {
        addComment(sectionComments, target.section_id, comment);

        return;
      }

      generalComments.push(comment);
    });

    return {
      generalComments,
      sectionComments,
      blockComments,
      fieldComments,
      fieldAllComments,
    };
  }, [reviewComments]);

  // Render general comments
  const renderGeneralComments = useCallback(() => {
    if (groupedComments.generalComments.length === 0) return null;

    return (
      <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h3 className="mb-2 text-sm font-semibold text-yellow-800">
          {t("comments.generalTitle")}
        </h3>

        <ReviewCommentThread
          comments={groupedComments.generalComments}
          onReply={canReplyToComments ? handleReplyToComment : undefined}
        />
      </div>
    );
  }, [
    canReplyToComments,
    groupedComments.generalComments,
    handleReplyToComment,
    t,
  ]);

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
            (slug) => slug !== initialData.master.name_machine,
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
            initialData.master.base_template_master_id,
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

      section.repeatable_pages?.forEach((page) => {
        if (page.header_config?.fields) {
          extractFromFields(page.header_config.fields);
        }

        if (page.footer_config?.fields) {
          extractFromFields(page.footer_config.fields);
        }

        page.blocks.forEach((block) => {
          extractFromFields(block.fields);
        });
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
              current_version,
            );
            throw new Error(t("errors.templateUnexpectedStructure"));
          }

          // Extraer información de la versión actual
          const versionId = current_version._id;
          const content = current_version.content;

          // Validar que versionId existe (es obligatorio)
          if (!versionId) {
            console.error("Template version ID is missing");
            throw new Error(t("errors.missingTemplateVersionId"));
          }

          // Generar nombre por defecto: [Nombre Template] - [Mes Actual] [Año Actual]
          const monthName = new Intl.DateTimeFormat(locale, {
            month: "long",
          }).format(new Date());
          const capitalizedMonth =
            monthName.charAt(0).toUpperCase() + monthName.slice(1);
          const currentYear = new Date().getFullYear();
          const defaultBulletinName = t("defaultBulletinName", {
            template: master.template_name,
            month: capitalizedMonth,
            year: currentYear,
          });
          const defaultNameMachineBase = slugify(defaultBulletinName);

          let slugNamesForValidation = existingSlugNames;
          if (slugNamesForValidation.length === 0) {
            const slugResponse = await BulletinAPIService.getAllSlugNames();
            if (slugResponse.success && slugResponse.data) {
              slugNamesForValidation = slugResponse.data;
              setExistingSlugNames(slugResponse.data);
            }
          }

          const defaultNameMachine = generateUniqueMachineName(
            defaultNameMachineBase,
            slugNamesForValidation,
          );

          const decodeListItemValue = (item: any) => {
            if (typeof item === "string") {
              return decodeTextFieldValue(item);
            }

            if (item && typeof item === "object" && !Array.isArray(item)) {
              const nextItem = { ...item } as Record<string, any>;
              const textLikeKeys = [
                "text",
                "label",
                "title",
                "description",
                "value",
              ];

              textLikeKeys.forEach((key) => {
                if (typeof nextItem[key] === "string") {
                  nextItem[key] = decodeTextFieldValue(nextItem[key]);
                }
              });

              return nextItem;
            }

            return item;
          };

          const decodeTextWithIconValue = (value: any) => {
            if (typeof value === "string") {
              return decodeTextFieldValue(value);
            }

            if (value && typeof value === "object" && !Array.isArray(value)) {
              const nextValue = { ...value } as Record<string, any>;
              const textLikeKeys = [
                "text",
                "label",
                "title",
                "description",
                "value",
              ];

              textLikeKeys.forEach((key) => {
                if (typeof nextValue[key] === "string") {
                  nextValue[key] = decodeTextFieldValue(nextValue[key]);
                }
              });

              return nextValue;
            }

            return value;
          };

          // Helper para inicializar el valor de un campo según su tipo
          const initializeFieldValue = (field: Field) => {
            if (field.type === "list") {
              // Para list, mantener ítems existentes pero decodificando texto serializado
              return Array.isArray(field.value)
                ? field.value.map(decodeListItemValue)
                : [];
            }
            if (field.type === "text") {
              // Para texto plano, decodificar valores URL-encoded heredados de plantilla
              return decodeTextFieldValue(field.value || "");
            }
            if (field.type === "text_with_icon") {
              // text_with_icon puede venir como string u objeto; decodificar ambos formatos
              return decodeTextWithIconValue(field.value);
            }
            return field.value ?? null;
          };

          const initializeSectionAsBulletin = (
            section: Section,
          ): BulletinSection => {
            const initializedBlocks = section.blocks.map((block: Block) => ({
              ...block,
              fields: block.fields.map((field: Field) => ({
                ...field,
                value: initializeFieldValue(field),
              })),
            }));

            const initializedHeaderConfig = section.header_config
              ? {
                  ...section.header_config,
                  fields: section.header_config.fields.map((field: Field) => ({
                    ...field,
                    value: initializeFieldValue(field),
                  })),
                }
              : undefined;

            const initializedFooterConfig = section.footer_config
              ? {
                  ...section.footer_config,
                  fields: section.footer_config.fields.map((field: Field) => ({
                    ...field,
                    value: initializeFieldValue(field),
                  })),
                }
              : undefined;

            const bulletinSection: BulletinSection = {
              ...section,
              header_config: initializedHeaderConfig,
              footer_config: initializedFooterConfig,
              blocks: initializedBlocks,
            };

            if (section.repeatable) {
              bulletinSection.repeatable_pages = [
                createRepeatablePageFromSection(
                  {
                    display_name: section.display_name,
                    blocks: initializedBlocks as any,
                    header_config: initializedHeaderConfig as any,
                    footer_config: initializedFooterConfig as any,
                  },
                  section.display_name ||
                    t("section.repeatablePageTitle", {
                      number: 1,
                    }),
                ),
              ];
            }

            return bulletinSection;
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
                          }),
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
                          }),
                        ),
                      }
                    : { fields: [] },
                  sections: content.sections.map((section: Section) =>
                    initializeSectionAsBulletin(section),
                  ),
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
    [existingSlugNames, locale, showToast, t],
  );

  // Si ya hay un template seleccionado (p. ej. navegando desde otro flujo),
  // asegurarnos de cargar su versión más reciente cuando estemos en modo creación.
  useEffect(() => {
    if (!isEditMode && creationState.selectedTemplateId) {
      loadTemplateVersion(creationState.selectedTemplateId);
    }
  }, [creationState.selectedTemplateId, isEditMode, loadTemplateVersion]);

  // Función para actualizar datos del boletín
  const updateBulletinData = useCallback(
    (updater: (prev: CreateBulletinData) => CreateBulletinData) => {
      setCreationState((prev) => ({
        ...prev,
        data: updater(prev.data),
      }));
    },
    [],
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

  const sectionCommentCounts = useMemo(() => {
    const counts: Record<number, number> = {};

    const sections = creationState.data.version.data.sections;

    if (reviewComments.length === 0 || sections.length === 0) {
      return counts;
    }

    const sectionIdToIndex = new Map<string, number>();

    const blockIdToSectionIndex = new Map<string, number>();

    const fieldIdToSectionIndex = new Map<string, number>();

    const registerFields = (
      fields: Field[] | undefined,
      sectionIndex: number,
    ) => {
      fields?.forEach((field) => {
        if (field.field_id) {
          fieldIdToSectionIndex.set(field.field_id, sectionIndex);
        }
      });
    };

    const registerBlocks = (
      blocks: Block[] | undefined,
      sectionIndex: number,
    ) => {
      blocks?.forEach((block) => {
        if (block.block_id) {
          blockIdToSectionIndex.set(block.block_id, sectionIndex);
        }

        registerFields(block.fields, sectionIndex);
      });
    };

    sections.forEach((section, sectionIndex) => {
      if (section.section_id) {
        sectionIdToIndex.set(section.section_id, sectionIndex);
      }

      registerFields(section.header_config?.fields, sectionIndex);

      registerFields(section.footer_config?.fields, sectionIndex);

      registerBlocks(section.blocks, sectionIndex);

      section.repeatable_pages?.forEach((page) => {
        if (page.page_id) {
          sectionIdToIndex.set(page.page_id, sectionIndex);
        }

        registerFields(page.header_config?.fields, sectionIndex);

        registerFields(page.footer_config?.fields, sectionIndex);

        registerBlocks(page.blocks, sectionIndex);
      });
    });

    reviewComments.forEach((comment) => {
      const target = comment.target_element;

      let resolvedSectionIndex: number | undefined;

      if (
        typeof target?.section_index === "number" &&
        target.section_index >= 0 &&
        target.section_index < sections.length
      ) {
        resolvedSectionIndex = target.section_index;
      }

      if (resolvedSectionIndex === undefined && target?.field_id) {
        const decodedTarget = decodeReviewFieldId(target.field_id);

        const parentFieldId = decodedTarget?.parentFieldId || target.field_id;

        resolvedSectionIndex = fieldIdToSectionIndex.get(parentFieldId);
      }

      if (resolvedSectionIndex === undefined && target?.block_id) {
        resolvedSectionIndex = blockIdToSectionIndex.get(target.block_id);
      }

      if (resolvedSectionIndex === undefined && target?.section_id) {
        resolvedSectionIndex = sectionIdToIndex.get(target.section_id);
      }

      if (resolvedSectionIndex !== undefined) {
        counts[resolvedSectionIndex] = (counts[resolvedSectionIndex] || 0) + 1;
      }
    });

    return counts;
  }, [reviewComments, creationState.data.version.data.sections]);

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
        title:
          section.display_name ||
          t("section.numberedTitle", {
            number: index + 1,
          }),
        description: t("section.description"),
        notificationCount: sectionCommentCounts[index] || undefined,
      }));

    // Agregar paso de exportación al final
    const exportStep: StepConfig = {
      id: "export",
      title: t("export.title"),
      description: t("export.description"),
    };

    return [...baseSteps, ...sectionSteps, exportStep];
  }, [
    t,
    creationState.data.version.data.sections,
    isEditMode,
    sectionCommentCounts,
  ]);

  // Obtener índice del paso actual
  const currentStepIndex = useMemo(() => {
    return stepConfigs.findIndex(
      (step) => step.id === creationState.currentStep,
    );
  }, [stepConfigs, creationState.currentStep]);

  useEffect(() => {
    setPreviewPageIndex(0);
  }, [creationState.currentStep]);

  // Validar el paso actual, incluyendo todos los campos obligatorios editables.
  const currentStepValidation = useMemo(() => {
    switch (creationState.currentStep) {
      case "select-template":
        return {
          isValid: Boolean(creationState.selectedTemplateId),
          issues: [] as RequiredFieldIssue[],
          invalidFieldIds: [] as string[],
        };

      case "basic-info": {
        const issues = getBasicInfoRequiredFieldIssues(creationState.data);
        const name = creationState.data.master.bulletin_name.trim();
        const nameMachine = creationState.data.master.name_machine.trim();

        if (!name) {
          issues.unshift({
            key: BULLETIN_NAME_VALIDATION_ID,
            fieldId: BULLETIN_NAME_VALIDATION_ID,
            label: t("basicInfo.fields.name.label"),
            path: "basicInfo.master",
          });
        }

        if (
          !nameMachine ||
          !isValidSlug(nameMachine) ||
          existingSlugNames.includes(nameMachine)
        ) {
          issues.push({
            key: BULLETIN_SLUG_VALIDATION_ID,
            fieldId: BULLETIN_SLUG_VALIDATION_ID,
            label: t("basicInfo.fields.nameMachine.label"),
            path: "basicInfo.master",
          });
        }

        return toRequiredFieldValidationResult(issues);
      }

      case "export":
        return toRequiredFieldValidationResult([]);

      default: {
        if (!creationState.currentStep.startsWith("section-")) {
          return {
            isValid: false,
            issues: [] as RequiredFieldIssue[],
            invalidFieldIds: [] as string[],
          };
        }

        const sectionIndex = Number.parseInt(
          creationState.currentStep.replace("section-", ""),
          10,
        );
        const section = creationState.data.version.data.sections[sectionIndex];

        return toRequiredFieldValidationResult(
          getSectionRequiredFieldIssues(section, sectionIndex),
        );
      }
    }
  }, [
    creationState.currentStep,
    creationState.selectedTemplateId,
    creationState.data,
    existingSlugNames,
    t,
  ]);

  const isCurrentStepValid = currentStepValidation.isValid;

  // Navegación: siguiente paso
  const handleNext = useCallback(() => {
    if (!isCurrentStepValid) {
      return;
    }

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

  // Click en un paso del stepper. Retroceder siempre es válido; avanzar exige
  // completar el paso actual.
  const handleStepClick = useCallback(
    (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= stepConfigs.length) {
        return;
      }

      if (stepIndex > currentStepIndex && !isCurrentStepValid) {
        return;
      }

      if (stepIndex === 0 || creationState.selectedTemplateId) {
        goToStep(stepConfigs[stepIndex].id as BulletinCreationStep);
      }
    },
    [
      stepConfigs,
      currentStepIndex,
      isCurrentStepValid,
      goToStep,
      creationState.currentStep,
      creationState.selectedTemplateId,
    ],
  );

  // Finalizar creación del boletín
  const handleFinish = useCallback(async () => {
    if (!isCurrentStepValid) return;

    setIsLoading(true);
    try {
      // Codificar los campos de texto antes de guardar
      const encodedData = encodeTextFields(creationState.data);

      if (persistedBulletinId) {
        // MODO EDICIÓN: Actualizar bulletin existente
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        // Eliminar status y otros campos sensibles del payload de actualización
        const {
          _id,
          status,
          current_version_id,
          base_template_master_id,
          base_template_version_id,
          ...updateDataPayload
        } = masterDataWithoutLog as any;

        // 1. Actualizar bulletin master
        const masterResponse = await BulletinAPIService.updateBulletin(
          persistedBulletinId,
          updateDataPayload,
        );

        if (!masterResponse.success) {
          throw new Error(masterResponse.message || t("errors.updateBulletin"));
        }

        const {
          _id: _,
          log: versionLog,
          bulletin_master_id: __,
          previous_version_id: ___,
          ...versionDataClean
        } = encodedData.version as any;

        // 2. Crear nueva versión del boletín
        const versionResponse = await BulletinAPIService.createBulletinVersion(
          persistedBulletinId,
          versionDataClean as any,
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || t("errors.createBulletinVersion"),
          );
        }

        showToast(t("updateSuccess"), "success");
      } else {
        // MODO CREACIÓN: Crear nuevo bulletin
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        const masterResponse =
          await BulletinAPIService.createBulletin(masterDataWithoutLog);

        if (!masterResponse.success || !masterResponse.data) {
          throw new Error(masterResponse.message || t("errors.createBulletin"));
        }

        const newBulletinId =
          (masterResponse.data as any).id || masterResponse.data._id;
        setPersistedBulletinId(newBulletinId);

        const { log: versionLog, ...versionDataWithoutLog } =
          encodedData.version;

        const versionResponse = await BulletinAPIService.createBulletinVersion(
          newBulletinId,
          versionDataWithoutLog,
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || t("errors.createBulletinVersion"),
          );
        }

        showToast(t("success"), "success");
      }

      // Redirigir a la lista de boletines
      router.push(bulletinsPath);
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
    persistedBulletinId,
    bulletinsPath,
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
          status: "draft" as BulletinStatus,
        },
      };

      // Codificar los campos de texto antes de guardar
      const encodedData = encodeTextFields(draftData);

      if (persistedBulletinId) {
        // MODO EDICIÓN: Actualizar el boletín existente
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        // Eliminar status y otros campos sensibles del payload de actualización
        // para evitar conflictos con el backend (especialmente en PUT /bulletins/{id})
        const {
          _id,
          status,
          current_version_id,
          base_template_master_id,
          base_template_version_id,
          ...updateDataPayload
        } = masterDataWithoutLog as any;

        // 1. Actualizar bulletin master (sin status ni campos de sistema)
        const masterResponse = await BulletinAPIService.updateBulletin(
          persistedBulletinId,
          updateDataPayload,
        );

        if (!masterResponse.success) {
          throw new Error(masterResponse.message || t("errors.updateBulletin"));
        }

        const {
          _id: _,
          log: versionLog,
          bulletin_master_id: __,
          previous_version_id: ___,
          ...versionDataClean
        } = encodedData.version as any;

        // 2. Crear nueva versión con los cambios
        const versionResponse = await BulletinAPIService.createBulletinVersion(
          persistedBulletinId,
          versionDataClean as any,
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || t("errors.createBulletinVersion"),
          );
        }

        showToast(t("savedAsDraft"), "success");
      } else {
        // MODO CREACIÓN: Crear nuevo bulletin
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        const masterResponse =
          await BulletinAPIService.createBulletin(masterDataWithoutLog);

        if (!masterResponse.success || !masterResponse.data) {
          throw new Error(masterResponse.message || t("errors.createBulletin"));
        }

        const newBulletinId =
          (masterResponse.data as any).id || masterResponse.data._id;
        setPersistedBulletinId(newBulletinId);

        const { log: versionLog, ...versionDataWithoutLog } =
          encodedData.version;

        const versionResponse = await BulletinAPIService.createBulletinVersion(
          newBulletinId,
          versionDataWithoutLog,
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || t("errors.createBulletinVersion"),
          );
        }

        showToast(t("savedAsDraft"), "success");
      }

      setShowDraftSavedModal(true);
    } catch (error) {
      console.error("Error saving draft:", error);
      showToast(error instanceof Error ? error.message : t("error"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, creationState.data, persistedBulletinId, showToast, t]);

  const handleContinueEditingDraft = useCallback(() => {
    setShowDraftSavedModal(false);
  }, []);

  const handleReturnToBulletins = useCallback(() => {
    setShowDraftSavedModal(false);
    router.push(bulletinsPath);
  }, [router, bulletinsPath]);

  // Función para enviar a revisión
  const handleSubmitForReview = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // 1. Primero guardar el boletín como borrador (DRAFT)
      // Asegurarse de que el estado sea draft para que el endpoint de review lo acepte
      const draftData = {
        ...creationState.data,
        master: {
          ...creationState.data.master,
          status: "draft" as BulletinStatus,
        },
      };

      // Codificar los campos de texto antes de guardar
      const encodedData = encodeTextFields(draftData);

      let currentBulletinId = persistedBulletinId;

      if (persistedBulletinId) {
        // MODO EDICIÓN: Actualizar el boletín existente
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        // Eliminar status y otros campos sensibles del payload de actualización
        // ya que el cambio de estado se debe hacer solo por los endpoints de workflow
        const {
          _id,
          status,
          current_version_id,
          base_template_master_id,
          base_template_version_id,
          ...updateDataPayload
        } = masterDataWithoutLog as any;

        // Actualizar bulletin master
        const masterResponse = await BulletinAPIService.updateBulletin(
          persistedBulletinId,
          updateDataPayload,
        );

        if (!masterResponse.success) {
          throw new Error(masterResponse.message || t("errors.updateBulletin"));
        }

        const {
          _id: versionId,
          log: versionLog,
          bulletin_master_id,
          previous_version_id,
          ...versionDataClean
        } = encodedData.version as any;

        // Crear nueva versión con los cambios
        const versionResponse = await BulletinAPIService.createBulletinVersion(
          persistedBulletinId,
          versionDataClean as any,
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || t("errors.createBulletinVersion"),
          );
        }
      } else {
        // MODO CREACIÓN: Crear nuevo bulletin
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        const masterResponse =
          await BulletinAPIService.createBulletin(masterDataWithoutLog);

        if (!masterResponse.success || !masterResponse.data) {
          throw new Error(masterResponse.message || t("errors.createBulletin"));
        }

        currentBulletinId =
          (masterResponse.data as any).id || masterResponse.data._id;

        const {
          _id: _,
          log: versionLog,
          bulletin_master_id: __,
          previous_version_id: ___,
          ...versionDataClean
        } = encodedData.version as any;

        if (currentBulletinId) {
          setPersistedBulletinId(currentBulletinId);
          const versionResponse =
            await BulletinAPIService.createBulletinVersion(
              currentBulletinId,
              versionDataClean as any,
            );

          if (!versionResponse.success) {
            throw new Error(
              versionResponse.message || t("errors.createBulletinVersion"),
            );
          }
        } else {
          throw new Error(t("errors.missingCreatedBulletinId"));
        }
      }

      // 2. Enviar a revisión usando el servicio de review
      if (currentBulletinId) {
        await ReviewService.submitForReview(currentBulletinId);
        showToast(t("sentToReview"), "success");
        router.push(bulletinsPath);
      } else {
        throw new Error(t("errors.invalidBulletinIdForReview"));
      }
    } catch (error) {
      console.error("Error submitting for review:", error);
      showToast(error instanceof Error ? error.message : t("error"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    creationState.data,
    persistedBulletinId,
    showToast,
    t,
    router,
    bulletinsPath,
  ]);

  // Función para publicar
  const handlePublish = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      // Mantener el boletín en draft hasta completar el flujo de publicación
      // para evitar estados inconsistentes si falla algún paso intermedio.
      const draftData = {
        ...creationState.data,
        master: {
          ...creationState.data.master,
          status: "draft" as BulletinStatus,
        },
      };

      // Extraer todas las imágenes temporales para moverlas a permanentes
      const tempImages = extractImageUrls(draftData).filter((url) =>
        url.includes("/bulletins/temp/"),
      );

      // Mover imágenes a almacenamiento permanente
      let finalizedData = draftData;
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
            urlMap: Map<string, string>,
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

              section.repeatable_pages?.forEach((page) => {
                if (page.header_config?.fields) {
                  updateFields(page.header_config.fields);
                }

                if (page.footer_config?.fields) {
                  updateFields(page.footer_config.fields);
                }

                page.blocks.forEach((block) => {
                  updateFields(block.fields);
                });
              });
            });
          };

          // Crear mapa de URLs temporales a permanentes
          const urlMap = new Map<string, string>();
          tempImages.forEach((tempUrl, index) => {
            urlMap.set(tempUrl, permanentImages[index]);
          });

          finalizedData = JSON.parse(JSON.stringify(draftData));
          updateImageUrls(finalizedData, urlMap);
        }
      }

      // Codificar los campos de texto antes de guardar
      const encodedData = encodeTextFields(finalizedData);

      let currentBulletinId = persistedBulletinId;

      if (persistedBulletinId) {
        // MODO EDICIÓN: Actualizar el boletín existente
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        // El cambio de estado se hace por workflow, no por update directo
        const {
          _id,
          status,
          current_version_id,
          base_template_master_id,
          base_template_version_id,
          thumbnail_images,
          ...updateDataPayload
        } = masterDataWithoutLog as any;

        const masterResponse = await BulletinAPIService.updateBulletin(
          persistedBulletinId,
          updateDataPayload,
        );

        if (!masterResponse.success) {
          throw new Error(
            masterResponse.message || t("errors.publishBulletin"),
          );
        }

        const {
          _id: _,
          log: versionLog,
          bulletin_master_id: __,
          previous_version_id: ___,
          ...versionDataWithoutLog
        } = encodedData.version as any;

        // Crear nueva versión con los cambios
        const versionResponse = await BulletinAPIService.createBulletinVersion(
          persistedBulletinId,
          versionDataWithoutLog as any,
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || t("errors.createBulletinVersion"),
          );
        }
      } else {
        // MODO CREACIÓN: Crear nuevo bulletin
        const { log: masterLog, ...masterDataWithoutLog } = encodedData.master;

        const masterResponse =
          await BulletinAPIService.createBulletin(masterDataWithoutLog);

        if (!masterResponse.success || !masterResponse.data) {
          throw new Error(masterResponse.message || t("errors.createBulletin"));
        }

        const newBulletinId =
          (masterResponse.data as any).id || masterResponse.data._id;
        setPersistedBulletinId(newBulletinId);
        currentBulletinId = newBulletinId;

        const {
          _id: _,
          log: versionLog,
          bulletin_master_id: __,
          previous_version_id: ___,
          ...versionDataWithoutLog
        } = encodedData.version as any;

        const versionResponse = await BulletinAPIService.createBulletinVersion(
          newBulletinId,
          versionDataWithoutLog as any,
        );

        if (!versionResponse.success) {
          throw new Error(
            versionResponse.message || t("errors.createBulletinVersion"),
          );
        }
      }

      if (!currentBulletinId) {
        throw new Error(t("errors.invalidBulletinIdForPublish"));
      }

      // Publicar usando el endpoint de workflow para respetar transiciones válidas
      await ReviewService.publishDirect(currentBulletinId);

      setPublishedBulletinId(currentBulletinId);
      setShowPublishModal(true);
    } catch (error) {
      console.error("Error publishing bulletin:", error);
      showToast(error instanceof Error ? error.message : t("error"), "error");
    } finally {
      setIsLoading(false);
    }
  }, [
    isLoading,
    creationState.data,
    persistedBulletinId,
    showToast,
    t,
    extractImageUrls,
  ]);

  const handleConfirmAction = useCallback(() => {
    const actionToExecute = confirmationAction;

    // Cerrar el modal antes de iniciar la petición
    setConfirmationAction(null);

    if (actionToExecute === "review") {
      void handleSubmitForReview();
      return;
    }

    if (actionToExecute === "publish") {
      void handlePublish();
    }
  }, [confirmationAction, handleSubmitForReview, handlePublish]);

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
          creationState.data.master.bulletin_name || t("preview.fallbackTitle"),
        name_machine: creationState.data.master.name_machine || "preview",
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
  }, [creationState, t]);

  const exportSections = useMemo(() => {
    return creationState.data.version.data.sections.flatMap((section) => {
      if (!section.repeatable || !section.repeatable_pages?.length) {
        return [section];
      }

      return section.repeatable_pages.map((page, pageIndex) => ({
        ...section,
        section_id: page.page_id || `${section.section_id}-${pageIndex}`,
        display_name: page.page_title || section.display_name,
        header_config: page.header_config || section.header_config,
        footer_config: page.footer_config || section.footer_config,
        blocks: page.blocks,
        repeatable_pages: undefined,
        active_page_index: pageIndex,
      }));
    });
  }, [creationState.data.version.data.sections]);

  // Datos completos para exportación (siempre incluye todas las secciones)
  const exportData = useMemo((): CreateTemplateData | null => {
    if (!creationState.selectedTemplateId) {
      return null;
    }

    return {
      master: {
        template_name:
          creationState.data.master.bulletin_name || t("preview.fallbackTitle"),
        name_machine: creationState.data.master.name_machine || "preview",
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
          sections: exportSections, // SIEMPRE TODAS, expandiendo las repetibles
        },
      },
    };
  }, [creationState.data, creationState.selectedTemplateId, exportSections, t]);

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
            fieldComments={groupedComments.fieldComments}
            invalidFieldIds={currentStepValidation.invalidFieldIds}
            onReplyToComment={
              canReplyToComments ? handleReplyToComment : undefined
            }
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
            creationState.currentStep.replace("section-", ""),
          );

          return (
            <SectionStep
              bulletinData={creationState.data}
              sectionIndex={sectionIndex}
              onUpdate={updateBulletinData}
              currentPageIndex={previewPageIndex}
              onPageChange={setPreviewPageIndex}
              sectionComments={groupedComments.sectionComments}
              blockComments={groupedComments.blockComments}
              fieldComments={groupedComments.fieldComments}
              fieldAllComments={groupedComments.fieldAllComments}
              invalidFieldIds={currentStepValidation.invalidFieldIds}
              onReplyToComment={
                canReplyToComments ? handleReplyToComment : undefined
              }
            />
          );
        }
        return null;
    }
  };

  const isLastStep = currentStepIndex === stepConfigs.length - 1;
  const isSingleSectionPreview =
    creationState.currentStep.startsWith("section-");
  const parsedPreviewSectionIndex = creationState.currentStep.startsWith(
    "section-",
  )
    ? Number.parseInt(creationState.currentStep.replace("section-", ""), 10)
    : 0;
  const previewSectionIndex = isSingleSectionPreview
    ? 0
    : Number.isNaN(parsedPreviewSectionIndex)
      ? 0
      : Math.min(
          Math.max(parsedPreviewSectionIndex, 0),
          Math.max(creationState.data.version.data.sections.length - 1, 0),
        );
  const showGlobalActions = creationState.currentStep !== "select-template";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-2">
          <Link
            href={bulletinsPath}
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
                      disabled={isLoading || !isCurrentStepValid}
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
              {renderGeneralComments()}
              <h3 className="text-xl font-semibold text-[#283618] mb-4">
                {t("preview.title")}
              </h3>
              {previewData ? (
                <div
                  id="bulletin-preview-container"
                  className="rounded-lg overflow-hidden"
                >
                  <UnifiedBulletinPreview
                    data={previewData}
                    variant="single"
                    moreInfo={true}
                    description={true}
                    selectedSectionIndex={previewSectionIndex}
                    currentPageIndex={previewPageIndex}
                    onPageChange={setPreviewPageIndex}
                    cardEmptyStateMode="select-card"
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

        {showGlobalActions && (
          /* Global Actions Footer */
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
              onClick={() => setConfirmationAction("review")}
              disabled={isLoading}
              className={`${
                hasReviewCrudPermissions ? btnOutlineSecondary : btnPrimary
              } disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2`}
            >
              <CheckCircle className="w-4 h-4" />
              {t("navigation.sendToReview")}
            </button>

            <button
              onClick={() => setIsExportModalOpen(true)}
              className={`${btnPrimary} inline-flex items-center gap-2`}
            >
              <Download className="w-4 h-4" />
              {t("navigation.export")}
            </button>

            {hasReviewCrudPermissions && (
              <button
                onClick={() => setConfirmationAction("publish")}
                disabled={isLoading}
                className={`${btnPrimary} disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2`}
              >
                <CheckCircle className="w-4 h-4" />
                {isLoading
                  ? t("navigation.publishing")
                  : t("navigation.publish")}
              </button>
            )}
          </div>
        )}
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

      <ConfirmationModal
        isOpen={showDraftSavedModal}
        onClose={handleContinueEditingDraft}
        onConfirm={handleReturnToBulletins}
        title={t("draftSavedModal.title")}
        message={t("draftSavedModal.message")}
        confirmLabel={t("draftSavedModal.backToBulletins")}
        cancelLabel={t("draftSavedModal.continueEditing")}
        isDangerous={false}
      />

      <ConfirmationModal
        isOpen={confirmationAction !== null}
        onClose={() => setConfirmationAction(null)}
        onConfirm={handleConfirmAction}
        title={
          confirmationAction === "publish"
            ? t("confirmation.publish.title")
            : t("confirmation.review.title")
        }
        message={
          confirmationAction === "publish"
            ? t("confirmation.publish.message")
            : t("confirmation.review.message")
        }
        confirmLabel={
          confirmationAction === "publish"
            ? t("confirmation.publish.confirm")
            : t("confirmation.review.confirm")
        }
        cancelLabel={t("confirmation.cancel")}
        isDangerous={false}
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
                      `${window.location.origin}/${locale}/${templateNameMachine}/${creationState.data.master.name_machine}`,
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
                  router.push(bulletinsPath);
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
