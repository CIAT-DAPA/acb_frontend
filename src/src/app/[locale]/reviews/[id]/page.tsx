"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import {
  Loader2,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageSquare,
  ChevronsLeft,
  ChevronsRight,
  Send,
  MoreVertical,
  ExternalLink,
  Copy,
  AlertTriangle,
} from "lucide-react";
import { BulletinAPIService } from "@/services/bulletinService";
import { ReviewService } from "@/services/reviewService";
import { TemplateAPIService } from "@/services/templateService";
import { Modal } from "@/components/Modal";
import { useToast } from "@/components/Toast";
import { Canvas } from "../../templates/create/editor/Canvas";
import { EditorSelection } from "../../templates/create/editor/types";
import {
  CommentPayload,
  ReviewComment,
  ReviewHistory,
  CommentTargetElement,
} from "@/types/review";
import {
  btnPrimary,
  btnOutlineSecondary,
  container,
} from "../../components/ui";
import {
  CreateTemplateData,
  TemplateVersionContent,
  Field,
  Section,
  Block,
} from "@/types/template";
import Link from "next/link";
import Image from "next/image";
import {
  setMetaTag,
  setCanonicalUrl,
  generateArticleSchema,
  injectSchema,
  generateBreadcrumbSchema,
} from "@/utils/seoUtils";
import { encodeReviewFieldId, decodeReviewFieldId } from "@/utils/reviewTarget";

// Helper functions for decoding fields
const decodeTextFieldValue = (value: any): any => {
  if (typeof value === "string" && value.trim() !== "") {
    try {
      return decodeURIComponent(value); // Decode %20 and others
    } catch (e) {
      return value;
    }
  }
  return value;
};

const decodeTextFields = (data: any): any => {
  const decodedData = JSON.parse(JSON.stringify(data));

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
      } else if (field.type === "card") {
        if (Array.isArray(field.value)) {
          return;
        }

        if (typeof field.value === "string" && field.value.trim() !== "") {
          const rawValue = field.value.trim();

          const tryParseCardValue = (candidate: string): any[] | null => {
            const looksLikeJson =
              (candidate.startsWith("{") && candidate.endsWith("}")) ||
              (candidate.startsWith("[") && candidate.endsWith("]"));

            if (!looksLikeJson) {
              return null;
            }

            try {
              const parsed = JSON.parse(candidate);
              return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              return null;
            }
          };

          const directParsed = tryParseCardValue(rawValue);
          if (directParsed) {
            field.value = directParsed as any;
            return;
          }

          try {
            const decodedValue = decodeURIComponent(rawValue);
            if (decodedValue !== rawValue) {
              const decodedParsed = tryParseCardValue(decodedValue);
              if (decodedParsed) {
                field.value = decodedParsed as any;
                return;
              }
            }
          } catch {
            // Ignore malformed URI components and keep raw card value.
          }

          field.value = [rawValue] as any;
        } else if (
          field.value &&
          typeof field.value === "object" &&
          !Array.isArray(field.value)
        ) {
          const valueObject = field.value as Record<string, any>;

          if (Array.isArray(valueObject.selectedCards)) {
            field.value = valueObject.selectedCards as any;
          } else if (Array.isArray(valueObject.selected_cards)) {
            field.value = valueObject.selected_cards as any;
          } else if (Array.isArray(valueObject.cards)) {
            field.value = valueObject.cards as any;
          } else {
            field.value = [valueObject] as any;
          }
        }
      }
    });
  };

  // Decode header/footer
  if (decodedData.version.data.header_config?.fields) {
    decodeFieldsArray(decodedData.version.data.header_config.fields);
  }
  if (decodedData.version.data.footer_config?.fields) {
    decodeFieldsArray(decodedData.version.data.footer_config.fields);
  }

  // Decode sections
  decodedData.version.data.sections?.forEach((section: Section) => {
    section.blocks?.forEach((block: Block) => {
      if (block.fields) {
        decodeFieldsArray(block.fields);
      }
    });
  });

  return decodedData;
};

export default function ReviewBulletinPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();

  const t = useTranslations("Review");
  const tCommon = useTranslations("Common");
  const locale = useLocale();
  const bulletinId = params.id as string;

  const [bulletin, setBulletin] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Canvas selection state
  const [selection, setSelection] = useState<EditorSelection>({
    type: "template",
    id: null,
  });

  // Comments state
  const [commentText, setCommentText] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [comments, setComments] = useState<ReviewComment[]>([]);
  const [reviewHistory, setReviewHistory] = useState<any>(null); // To store full history

  // Modal states
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [isErrorModalOpen, setIsErrorModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalTitle, setModalTitle] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const tReview = useTranslations("Review");

  const [isRedirecting, setIsRedirecting] = useState(false);

  const mappedComments = useMemo(() => {
    if (!bulletin || !comments.length) {
      return comments;
    }

    const data = bulletin.current_version.data as TemplateVersionContent;

    return comments.map((comment) => {
      const target = comment.target_element;

      if (!target) {
        return comment;
      }

      // Comentario general devuelto con target vacío.
      if (
        !target.section_id &&
        !target.block_id &&
        !target.field_id &&
        !target.id
      ) {
        const { target_element, ...rest } = comment;
        return rest as ReviewComment;
      }

      const decodedFieldTarget = decodeReviewFieldId(target.field_id);

      const parentFieldId =
        decodedFieldTarget?.parentFieldId || target.field_id;

      const decodedItemIndex =
        typeof decodedFieldTarget?.itemIndex === "number"
          ? decodedFieldTarget.itemIndex
          : typeof target.item_index === "number"
            ? target.item_index
            : undefined;

      const decodedItemFieldId =
        decodedFieldTarget?.itemFieldId || target.item_field_id || undefined;

      const decodedCardIndex =
        typeof decodedFieldTarget?.cardIndex === "number"
          ? decodedFieldTarget.cardIndex
          : undefined;

      const decodedCardId = decodedFieldTarget?.cardId;

      const decodedCardBlockIndex =
        typeof decodedFieldTarget?.cardBlockIndex === "number"
          ? decodedFieldTarget.cardBlockIndex
          : undefined;

      const decodedCardBlockId = decodedFieldTarget?.cardBlockId;

      const decodedCardFieldIndex =
        typeof decodedFieldTarget?.cardFieldIndex === "number"
          ? decodedFieldTarget.cardFieldIndex
          : undefined;

      const decodedCardFieldId = decodedFieldTarget?.cardFieldId;

      // Estos índices deben reiniciarse para cada comentario.
      let sectionIndex: number | undefined;
      let blockIndex: number | undefined;
      let fieldIndex: number | undefined;

      let frontendId = target.id;
      let targetType: CommentTargetElement["type"] = target.type;
      let displayName = target.display_name;
      let didMapTarget = false;

      /**
       * Construye el target de:
       * - field normal
       * - lista completa
       * - ítem de lista
       * - field dentro de un ítem
       */
      const mapBlockField = (
        section: Section,
        resolvedSectionIndex: number,
        resolvedBlockIndex: number,
        resolvedFieldIndex: number,
      ) => {
        const block = section.blocks[resolvedBlockIndex];
        const field = block?.fields?.[resolvedFieldIndex];

        if (!field) {
          return;
        }

        sectionIndex = resolvedSectionIndex;
        blockIndex = resolvedBlockIndex;
        fieldIndex = resolvedFieldIndex;

        const baseFieldId =
          `field-${resolvedSectionIndex}` +
          `-${resolvedBlockIndex}` +
          `-${resolvedFieldIndex}`;

        const hasItemIndex =
          typeof decodedItemIndex === "number" && decodedItemIndex >= 0;

        const itemFieldId =
          typeof decodedItemFieldId === "string" &&
          decodedItemFieldId.trim().length > 0
            ? decodedItemFieldId
            : undefined;

        const listDisplayName = field.label || field.display_name || "Lista";

        const hasCardIndex =
          typeof decodedCardIndex === "number" && decodedCardIndex >= 0;

        if (hasCardIndex) {
          const cardBaseId = `${baseFieldId}-card-${decodedCardIndex}`;

          const cardNumber = decodedCardIndex + 1;

          const hasCardBlock =
            typeof decodedCardBlockIndex === "number" &&
            decodedCardBlockIndex >= 0;

          const hasCardField =
            typeof decodedCardFieldIndex === "number" &&
            decodedCardFieldIndex >= 0;

          /*
           * Card completa.
           */
          if (!hasCardBlock) {
            frontendId = cardBaseId;
            targetType = "card_item";

            displayName = target.display_name || `Card ${cardNumber}`;

            didMapTarget = true;
            return;
          }

          const cardBlockBaseId = `${cardBaseId}-block-${decodedCardBlockIndex}`;

          /*
           * Bloque dentro de card.
           */
          if (!hasCardField) {
            frontendId = cardBlockBaseId;
            targetType = "card_block";

            displayName =
              target.display_name ||
              `Bloque ${decodedCardBlockIndex + 1}` + ` · Card ${cardNumber}`;

            didMapTarget = true;
            return;
          }

          const cardFieldBaseId = `${cardBlockBaseId}-field-${decodedCardFieldIndex}`;

          /*
           * Subcampo de un ítem de una lista dentro de card.
           */
          if (hasItemIndex && itemFieldId) {
            frontendId =
              `${cardFieldBaseId}` +
              `-item-${decodedItemIndex}` +
              `-subfield-${itemFieldId}`;

            /*
             * Reutilizamos el mismo tipo de las listas externas.
             */
            targetType = "list_item_field";

            displayName =
              target.display_name ||
              `Campo de lista · Item ${decodedItemIndex! + 1}` +
                ` · Card ${cardNumber}`;

            didMapTarget = true;
            return;
          }

          /*
           * Ítem de una lista dentro de card.
           */
          if (hasItemIndex) {
            frontendId = `${cardFieldBaseId}` + `-item-${decodedItemIndex}`;

            targetType = "list_item";

            displayName =
              target.display_name ||
              `Lista · Item ${decodedItemIndex! + 1}` + ` · Card ${cardNumber}`;

            didMapTarget = true;
            return;
          }

          /*
           * Field normal dentro de card.
           */
          frontendId = cardFieldBaseId;
          targetType = "card_field";

          displayName =
            target.display_name ||
            `Campo ${decodedCardFieldIndex + 1}` +
              ` · Bloque ${decodedCardBlockIndex + 1}` +
              ` · Card ${cardNumber}`;

          didMapTarget = true;
          return;
        }

        if (hasItemIndex && itemFieldId) {
          frontendId =
            `${baseFieldId}-item-${decodedItemIndex}` +
            `-subfield-${itemFieldId}`;

          targetType = "list_item_field";

          const itemSchema = (field.field_config as any)?.item_schema;

          const itemFieldConfig = itemSchema?.[itemFieldId];

          const itemFieldName =
            itemFieldConfig?.label || itemFieldConfig?.display_name || "Campo";

          displayName = `${itemFieldName} · Item ${decodedItemIndex! + 1}`;
        } else if (hasItemIndex) {
          frontendId = `${baseFieldId}-item-${decodedItemIndex}`;

          targetType = "list_item";

          displayName = `${listDisplayName} · Item ${decodedItemIndex! + 1}`;
        } else {
          frontendId = baseFieldId;
          targetType = "field";

          displayName = field.label || field.display_name || "Campo";
        }

        didMapTarget = true;
      };

      /**
       * Mapea fields de header y footer.
       */
      const mapHeaderOrFooterField = (
        section: Section | undefined,
        resolvedSectionIndex: number,
        fieldId: string,
      ): boolean => {
        if (section?.header_config?.fields) {
          const headerFieldIndex = section.header_config.fields.findIndex(
            (field) => field.field_id === fieldId,
          );

          if (headerFieldIndex >= 0) {
            const field = section.header_config.fields[headerFieldIndex];

            frontendId =
              `header-${resolvedSectionIndex}` + `-${headerFieldIndex}`;

            targetType = "header_field";
            sectionIndex = resolvedSectionIndex;
            fieldIndex = headerFieldIndex;

            displayName =
              field.label || field.display_name || "Campo de Header";

            didMapTarget = true;
            return true;
          }
        }

        // Header global mostrado dentro de una sección.
        if (data.header_config?.fields) {
          const globalHeaderFieldIndex = data.header_config.fields.findIndex(
            (field) => field.field_id === fieldId,
          );

          if (globalHeaderFieldIndex >= 0) {
            const field = data.header_config.fields[globalHeaderFieldIndex];

            frontendId =
              `header-${resolvedSectionIndex}` + `-${globalHeaderFieldIndex}`;

            targetType = "header_field";
            sectionIndex = resolvedSectionIndex;
            fieldIndex = globalHeaderFieldIndex;

            displayName =
              field.label || field.display_name || "Campo de Header";

            didMapTarget = true;
            return true;
          }
        }

        if (section?.footer_config?.fields) {
          const footerFieldIndex = section.footer_config.fields.findIndex(
            (field) => field.field_id === fieldId,
          );

          if (footerFieldIndex >= 0) {
            const field = section.footer_config.fields[footerFieldIndex];

            frontendId =
              `footer-${resolvedSectionIndex}` + `-${footerFieldIndex}`;

            targetType = "footer_field";
            sectionIndex = resolvedSectionIndex;
            fieldIndex = footerFieldIndex;

            displayName =
              field.label || field.display_name || "Campo de Footer";

            didMapTarget = true;
            return true;
          }
        }

        // Footer global mostrado dentro de una sección.
        if (data.footer_config?.fields) {
          const globalFooterFieldIndex = data.footer_config.fields.findIndex(
            (field) => field.field_id === fieldId,
          );

          if (globalFooterFieldIndex >= 0) {
            const field = data.footer_config.fields[globalFooterFieldIndex];

            frontendId =
              `footer-${resolvedSectionIndex}` + `-${globalFooterFieldIndex}`;

            targetType = "footer_field";
            sectionIndex = resolvedSectionIndex;
            fieldIndex = globalFooterFieldIndex;

            displayName =
              field.label || field.display_name || "Campo de Footer";

            didMapTarget = true;
            return true;
          }
        }

        return false;
      };

      if (target.section_id) {
        const resolvedSectionIndex = data.sections.findIndex(
          (section) => section.section_id === target.section_id,
        );

        if (resolvedSectionIndex >= 0) {
          const section = data.sections[resolvedSectionIndex];

          sectionIndex = resolvedSectionIndex;

          if (target.block_id) {
            const resolvedBlockIndex =
              section.blocks?.findIndex(
                (block) => block.block_id === target.block_id,
              ) ?? -1;

            if (resolvedBlockIndex >= 0) {
              blockIndex = resolvedBlockIndex;
            }

            if (target.field_id) {
              let fieldWasMapped = false;

              if (resolvedBlockIndex >= 0) {
                const block = section.blocks[resolvedBlockIndex];

                const resolvedFieldIndex =
                  block.fields?.findIndex(
                    (field: Field) => field.field_id === parentFieldId,
                  ) ?? -1;

                if (resolvedFieldIndex >= 0) {
                  mapBlockField(
                    section,
                    resolvedSectionIndex,
                    resolvedBlockIndex,
                    resolvedFieldIndex,
                  );

                  fieldWasMapped = true;
                }
              }

              if (!fieldWasMapped && parentFieldId) {
                fieldWasMapped = mapHeaderOrFooterField(
                  section,
                  resolvedSectionIndex,
                  parentFieldId,
                );
              }

              // Fallback: buscar el field en cualquier bloque.
              if (!fieldWasMapped) {
                section.blocks?.some((block, candidateBlockIndex) => {
                  const candidateFieldIndex =
                    block.fields?.findIndex(
                      (field: Field) => field.field_id === parentFieldId,
                    ) ?? -1;

                  if (candidateFieldIndex < 0) {
                    return false;
                  }

                  mapBlockField(
                    section,
                    resolvedSectionIndex,
                    candidateBlockIndex,
                    candidateFieldIndex,
                  );

                  return true;
                });
              }
            } else if (resolvedBlockIndex >= 0) {
              const block = section.blocks[resolvedBlockIndex];

              frontendId =
                `block-${resolvedSectionIndex}` + `-${resolvedBlockIndex}`;

              targetType = "block";
              displayName = block.display_name || "Bloque";

              didMapTarget = true;
            }
          } else if (parentFieldId) {
            mapHeaderOrFooterField(
              section,
              resolvedSectionIndex,
              parentFieldId,
            );
          } else {
            frontendId = `section-${resolvedSectionIndex}`;

            targetType = "section";
            displayName = section.display_name || "Sección";

            didMapTarget = true;
          }
        }
      } else if (target.field_id) {
        // Header global sin section_id.
        const globalHeaderFieldIndex =
          data.header_config?.fields?.findIndex(
            (field) => field.field_id === parentFieldId,
          ) ?? -1;

        if (globalHeaderFieldIndex >= 0) {
          const field = data.header_config?.fields?.[globalHeaderFieldIndex];

          frontendId = `header-global-${globalHeaderFieldIndex}`;

          targetType = "header_field";
          sectionIndex = -1;
          fieldIndex = globalHeaderFieldIndex;

          displayName =
            field?.label || field?.display_name || "Campo de Header";

          didMapTarget = true;
        }

        if (!didMapTarget) {
          const globalFooterFieldIndex =
            data.footer_config?.fields?.findIndex(
              (field) => field.field_id === parentFieldId,
            ) ?? -1;

          if (globalFooterFieldIndex >= 0) {
            const field = data.footer_config?.fields?.[globalFooterFieldIndex];

            frontendId = `footer-global-${globalFooterFieldIndex}`;

            targetType = "footer_field";
            sectionIndex = -1;
            fieldIndex = globalFooterFieldIndex;

            displayName =
              field?.label || field?.display_name || "Campo de Footer";

            didMapTarget = true;
          }
        }
      }

      if (!didMapTarget || !frontendId || !targetType) {
        return comment;
      }

      const updatedTarget: CommentTargetElement = {
        ...target,

        id: frontendId,
        type: targetType,

        section_index: sectionIndex,
        block_index: blockIndex,
        field_index: fieldIndex,

        item_index: decodedItemIndex,
        item_field_id: decodedItemFieldId,

        card_index: decodedCardIndex,
        card_id: decodedCardId,

        card_block_index: decodedCardBlockIndex,
        card_block_id: decodedCardBlockId,

        card_field_index: decodedCardFieldIndex,
        card_field_id: decodedCardFieldId,

        display_name: displayName,
      };

      return {
        ...comment,
        target_element: updatedTarget,
      };
    });
  }, [comments, bulletin]);

  // Sort comments for sidebar display
  const sortedComments = useMemo(() => {
    return [...mappedComments].sort((a, b) => {
      // 1. General comments first (no target_element or empty ID)
      const isGeneralA = !a.target_element || !a.target_element.id;
      const isGeneralB = !b.target_element || !b.target_element.id;

      if (isGeneralA && !isGeneralB) return -1;
      if (!isGeneralA && isGeneralB) return 1;

      // 2. Sort resolved/unresolved? Maybe resolved at bottom.
      if (a.resolved && !b.resolved) return 1;
      if (!a.resolved && b.resolved) return -1;

      // 3. Sort by position in document (alphanumeric sort on ID)
      // "section-0", "block-0-1", "field-0-1-2"
      if (a.target_element?.id && b.target_element?.id) {
        // Simple string comparison works for "section-0" vs "section-1"
        // but "section-10" comes before "section-2".
        // Use localeCompare with numeric option for natural sort order
        return a.target_element.id.localeCompare(
          b.target_element.id,
          undefined,
          { numeric: true, sensitivity: "base" },
        );
      }

      // 4. Sort by date
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });
  }, [mappedComments]);

  const commentCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    mappedComments.forEach((c) => {
      if (c.target_element?.id) {
        counts[c.target_element.id] = (counts[c.target_element.id] || 0) + 1;
      }
    });
    return counts;
  }, [mappedComments]);

  useEffect(() => {
    loadBulletinData();
    loadComments();
  }, [bulletinId]);

  useEffect(() => {
    router.prefetch("/reviews");
  }, [router]);

  // SEO: Actualizar metadatos cuando se carga el boletín
  useEffect(() => {
    if (!bulletin?.master?.bulletin_name) {
      return;
    }

    const bulletinTitle = bulletin.master.bulletin_name;
    const description = bulletin.master.description
      ? bulletin.master.description.substring(0, 160)
      : `Revisión de boletín ${bulletinTitle}`;
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const canonicalUrl = bulletinId
      ? `${baseUrl}/${locale}/reviews/${bulletinId}`
      : "";

    document.title = `${bulletinTitle} - Bulletin builder`;
    setMetaTag("description", description);
    setMetaTag("og:title", bulletinTitle, true);
    setMetaTag(
      "og:description",
      bulletin.master.description || `Revisión de boletín: ${bulletinTitle}`,
      true,
    );
    setMetaTag("og:type", "article", true);
    setMetaTag("article:author", "CIAT", true);
    setMetaTag("twitter:title", bulletinTitle, false);
    setMetaTag("twitter:description", description, false);
    setMetaTag("twitter:card", "summary_large_image", false);

    if (canonicalUrl) {
      setMetaTag("og:url", canonicalUrl, true);
      setCanonicalUrl(canonicalUrl);
      injectSchema(
        generateArticleSchema({
          title: bulletinTitle,
          description,
          author: "CIAT",
          url: canonicalUrl,
          datePublished:
            bulletin.master.log?.created_at || new Date().toISOString(),
          dateModified:
            bulletin.master.log?.updated_at || new Date().toISOString(),
        }),
      );
      injectSchema(
        generateBreadcrumbSchema([
          { name: "Home", url: baseUrl },
          { name: "Revisiones", url: `${baseUrl}/${locale}/reviews` },
          { name: bulletinTitle, url: canonicalUrl },
        ]),
      );
    }
  }, [bulletin, locale, bulletinId]);

  const loadComments = async () => {
    try {
      const response = await ReviewService.getReviewHistory(bulletinId);
      let historyData: ReviewHistory | undefined;

      // Check if response is wrapped in standard API response { success: true, data: ... }
      if ((response as any).success && (response as any).data) {
        historyData = (response as any).data;
      }
      // Check if response is the data object directly (has mandatory fields like bulletin_master_id)
      else if (
        (response as any).bulletin_master_id ||
        (response as any).review_cycles
      ) {
        historyData = response as unknown as ReviewHistory;
      }

      if (historyData) {
        setReviewHistory(historyData);
        // Comments are now at the root level of history response
        if (historyData.comments) {
          setComments(historyData.comments);
        } else if (historyData.active_cycle) {
          // Fallback for previous structure
          setComments(historyData.active_cycle.comments || []);
        } else {
          // Fallback: check inside review_cycles if needed, or assume empty
          // Some backends might put comments inside the last cycle
          const lastCycle =
            historyData.review_cycles?.[historyData.review_cycles.length - 1];
          if (lastCycle?.comments) {
            setComments(lastCycle.comments);
          }
        }
      }
    } catch (error: any) {
      console.error("Error loading comments:", error);
      // Construct a minimal valid history object if possible or just show error
    }
  };

  const loadBulletinData = async () => {
    try {
      setLoading(true);
      const response = await BulletinAPIService.getCurrentVersion(bulletinId);

      if (response.success && response.data) {
        // Decode data before setting state
        const decodedBulletin = {
          ...response.data,
          master: response.data.master,
          // We need to apply decodeTextFields to the whole structure or just data
          // Construct a temp structure that matches what decodeTextFields expects
          // Actually decodeTextFields expects CreateBulletinData structure
          // Let's adapt it inside the function or here.
          // Simplified: just decode response.data
        };

        // Apply decoding to the deep structure
        // We create a temporary object that matches the structure expected by decodeTextFields
        const tempForDecoding = {
          master: response.data.master,
          version: response.data.current_version,
        };
        const decoded = decodeTextFields(tempForDecoding);

        const finalBulletin = {
          master: decoded.master,
          current_version: decoded.version,
        };

        setBulletin(finalBulletin);

        // Si el estado es pending_review, abrir automáticamente la revisión
        if (finalBulletin.master.status === "pending_review") {
          try {
            await ReviewService.openReview(bulletinId);
            // Actualizar estado local
            setBulletin((prev: any) => {
              if (!prev) return finalBulletin;
              return {
                ...prev,
                master: { ...prev.master, status: "review" },
              };
            });
          } catch (e: any) {
            if (e.message && e.message.includes("Current: review")) {
              console.log("Bulletin already in review, updating local state");
              setBulletin((prev: any) => ({
                ...prev,
                master: { ...prev.master, status: "review" },
              }));
            } else if (
              e.message &&
              e.message.includes(
                "Only assigned reviewer or admin can open review",
              )
            ) {
              console.warn(
                "User is not the assigned reviewer. Review mode remains closed.",
              );
            } else {
              console.error("Error opening review:", e);
            }
          }
        }
      } else {
        setError("Error al cargar el boletín");
      }
    } catch (err) {
      setError("Error de conexión");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      await ReviewService.approveBulletin(bulletinId);

      // Successfully approved. Now let's try to get the public URL.
      let url = "";

      try {
        if (bulletin?.master?.base_template_master_id) {
          const tempRes = await TemplateAPIService.getTemplateById(
            bulletin.master.base_template_master_id,
          );
          if (tempRes.success && tempRes.data) {
            const templateSlug = tempRes.data.name_machine;
            const bulletinSlug = bulletin.master.name_machine;
            // Construct absolute URL if possible or relative
            const origin = window.location.origin;
            url = `${origin}/${locale}/${templateSlug}/${bulletinSlug}`;
          }
        }
      } catch (e) {
        console.error("Error constructing public URL", e);
      }

      setPublishedUrl(
        url || `${window.location.origin}/bulletins/${bulletin.master._id}`,
      );
      setModalTitle(t("successModal.title"));
      setModalMessage(t("successModal.message"));
      setIsSuccessModalOpen(true);
      showToast(t("successModal.title"), "success");
    } catch (error: any) {
      console.error("Error approving bulletin:", error);
      showToast(
        error.message ||
          "Ocurrió un error al intentar aprobar el boletín. Por favor intenta nuevamente.",
        "error",
      );
      setModalTitle("Error al aprobar");
      setModalMessage(
        error.message ||
          "Ocurrió un error al intentar aprobar el boletín. Por favor intenta nuevamente.",
      );
      // setIsErrorModalOpen(true); // Disable modal since we use Toast now
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (isRejecting) {
      return;
    }

    setIsRejecting(true);

    try {
      await ReviewService.rejectBulletin(bulletinId);

      setIsRedirecting(true);
      showToast(t("rejectSuccess"), "success");
      router.replace("/reviews");
    } catch (error: any) {
      console.error("Error rejecting bulletin:", error);

      showToast(
        error.message ||
          "Ocurrió un error al intentar rechazar el boletín. Asegúrate de haber dejado al menos un comentario.",
        "error",
      );

      setIsRejecting(false);
    }
  };

  const handleSelection = (newSelection: EditorSelection, rect?: DOMRect) => {
    setSelection(newSelection);

    const isCommentableSelection =
      newSelection.type === "section" ||
      newSelection.type === "block" ||
      newSelection.type === "field" ||
      newSelection.type === "list_item" ||
      newSelection.type === "list_item_field" ||
      newSelection.type === "card_item" ||
      newSelection.type === "card_block" ||
      newSelection.type === "card_field" ||
      newSelection.type === "header" ||
      newSelection.type === "footer" ||
      newSelection.type === "header_field" ||
      newSelection.type === "footer_field";

    if (newSelection.id && isCommentableSelection) {
      if (!isSidebarOpen) {
        setIsSidebarOpen(true);
      }

      setCommentText("");
    }
  };

  const saveComment = async () => {
    if (selection.id && commentText.trim() && bulletin) {
      setIsSubmittingComment(true);
      try {
        const data = bulletin.current_version.data as TemplateVersionContent;
        const target: NonNullable<CommentPayload["target_element"]> = {};
        const sectionIndex =
          typeof selection.sectionIndex === "number" &&
          selection.sectionIndex >= 0
            ? selection.sectionIndex
            : undefined;
        const section =
          sectionIndex !== undefined ? data.sections[sectionIndex] : undefined;
        const sectionForFieldTarget =
          section ||
          (selection.sectionIndex === -1 && data.sections.length > 0
            ? data.sections[0]
            : undefined);

        // section-level target
        if (section) {
          target.section_id = section.section_id;
        }

        // Block, field, list item o field interno de lista.
        const isBlockTarget = selection.type === "block";

        const hasCardContext =
          typeof selection.cardIndex === "number" && selection.cardIndex >= 0;

        const isCardTarget =
          selection.type === "card_item" ||
          selection.type === "card_block" ||
          selection.type === "card_field" ||
          hasCardContext;

        const isFieldTarget =
          selection.type === "field" ||
          selection.type === "list_item" ||
          selection.type === "list_item_field" ||
          isCardTarget;

        if (
          (isBlockTarget || isFieldTarget) &&
          section &&
          typeof selection.blockIndex === "number" &&
          selection.blockIndex >= 0
        ) {
          const block = section.blocks[selection.blockIndex];

          if (block) {
            target.block_id = block.block_id;

            if (
              isFieldTarget &&
              typeof selection.fieldIndex === "number" &&
              selection.fieldIndex >= 0
            ) {
              const field = block.fields[selection.fieldIndex];

              if (field) {
                target.field_id = encodeReviewFieldId({
                  parentFieldId: field.field_id,

                  /*
                   * Lista.
                   */
                  itemIndex:
                    selection.type === "list_item" ||
                    selection.type === "list_item_field"
                      ? selection.itemIndex
                      : undefined,

                  itemFieldId:
                    selection.type === "list_item_field"
                      ? selection.schemaKey
                      : undefined,

                  /*
                   * Card.
                   */
                  cardIndex: hasCardContext ? selection.cardIndex : undefined,

                  cardId: hasCardContext ? selection.cardId : undefined,

                  cardBlockIndex: hasCardContext
                    ? selection.cardBlockIndex
                    : undefined,

                  cardBlockId: hasCardContext
                    ? selection.cardBlockId
                    : undefined,

                  cardFieldIndex: hasCardContext
                    ? selection.cardFieldIndex
                    : undefined,

                  cardFieldId: hasCardContext
                    ? selection.cardFieldId
                    : undefined,
                });
              }
            }
          }
        }

        // header field (section or global)
        if (
          selection.type === "header_field" &&
          typeof selection.fieldIndex === "number" &&
          selection.fieldIndex >= 0
        ) {
          let field =
            selection.sectionIndex === -1
              ? data.header_config?.fields?.[selection.fieldIndex]
              : section?.header_config?.fields?.[selection.fieldIndex];

          if (!field) {
            field = data.header_config?.fields?.[selection.fieldIndex];
          }

          if (field) {
            if (sectionForFieldTarget?.section_id) {
              target.section_id = sectionForFieldTarget.section_id;
            }

            const defaultBlockId = sectionForFieldTarget?.blocks?.[0]?.block_id;
            if (defaultBlockId) {
              target.block_id = defaultBlockId;
            }

            // Backend requires section_id + block_id whenever field_id is present
            if (target.section_id && target.block_id) {
              target.field_id = field.field_id;
            }
          }
        }

        // footer field (section or global)
        if (
          selection.type === "footer_field" &&
          typeof selection.fieldIndex === "number" &&
          selection.fieldIndex >= 0
        ) {
          let field =
            selection.sectionIndex === -1
              ? data.footer_config?.fields?.[selection.fieldIndex]
              : section?.footer_config?.fields?.[selection.fieldIndex];

          if (!field) {
            field = data.footer_config?.fields?.[selection.fieldIndex];
          }

          if (field) {
            if (sectionForFieldTarget?.section_id) {
              target.section_id = sectionForFieldTarget.section_id;
            }

            const defaultBlockId = sectionForFieldTarget?.blocks?.[0]?.block_id;
            if (defaultBlockId) {
              target.block_id = defaultBlockId;
            }

            // Backend requires section_id + block_id whenever field_id is present
            if (target.section_id && target.block_id) {
              target.field_id = field.field_id;
            }
          }
        }

        const payload: CommentPayload = {
          text: commentText,
          target_element: Object.keys(target).length > 0 ? target : undefined,
        };

        const response = await ReviewService.addComment(bulletinId, payload);

        // Si llegamos aquí, la creación fue exitosa (el servicio lanza error si falla)
        // Relax checks to support direct object returns or wrapped responses
        // e.g. { success: true, data: comment } OR { id: "...", text: "..." }
        console.log("Response from addComment:", response);
        const isSuccessful =
          response &&
          (response.success === true || // Explicit success flag
            response.data || // Data object exists
            (response as any).comment_id); // Check for comment_id in response

        if (isSuccessful) {
          console.log("Comment created successfully:", response);
          const commentData = response.data
            ? response.data
            : {
                comment_id: (response as any).comment_id,
                text: (response as any).text,
                target_element: (response as any).target_element,
                created_at: (response as any).created_at,
                author_id: (response as any).author_id,
                author_first_name: (response as any).author_first_name,
                author_last_name: (response as any).author_last_name,
              };

          const newComment = {
            ...commentData,
            target_element: {
              ...(commentData?.target_element || {}),
              ...target,

              id: selection.id,
              type: selection.type,

              section_index: selection.sectionIndex,
              block_index: selection.blockIndex,
              field_index: selection.fieldIndex,

              item_index:
                selection.type === "list_item" ||
                selection.type === "list_item_field"
                  ? selection.itemIndex
                  : undefined,

              item_field_id:
                selection.type === "list_item_field"
                  ? selection.schemaKey
                  : undefined,

              card_index: selection.cardIndex,
              card_id: selection.cardId,

              card_block_index: selection.cardBlockIndex,
              card_block_id: selection.cardBlockId,

              card_field_index: selection.cardFieldIndex,
              card_field_id: selection.cardFieldId,

              display_name: getElementName(),
            },
          } as ReviewComment;

          setComments((prev) => [...prev, newComment]);
          setCommentText("");
        } else {
          console.error("Save comment failed:", response);
          alert("Error al guardar comentario");
        }
      } catch (error) {
        console.error("Error saving comment:", error);
        alert("Error al guardar comentario");
      } finally {
        setIsSubmittingComment(false);
      }
    }
  };

  const getElementName = () => {
    if (!bulletin || !selection.id) return "";

    if (
      typeof selection.displayName === "string" &&
      selection.displayName.trim()
    ) {
      return selection.displayName;
    }
    const data = bulletin.current_version.data;

    try {
      switch (selection.type) {
        case "section":
          const section = data.sections?.[selection.sectionIndex!];
          return (
            section?.display_name || `Sección ${selection.sectionIndex! + 1}`
          );

        case "block":
          const block =
            data.sections?.[selection.sectionIndex!]?.blocks?.[
              selection.blockIndex!
            ];
          return block?.display_name || "Bloque";

        case "field": {
          const field =
            data.sections?.[selection.sectionIndex!]?.blocks?.[
              selection.blockIndex!
            ]?.fields?.[selection.fieldIndex!];

          return field?.label || field?.display_name || "Campo";
        }

        case "list_item": {
          const listField =
            data.sections?.[selection.sectionIndex!]?.blocks?.[
              selection.blockIndex!
            ]?.fields?.[selection.fieldIndex!];

          const listName =
            listField?.label || listField?.display_name || "Lista";

          const itemNumber =
            typeof selection.itemIndex === "number"
              ? selection.itemIndex + 1
              : "?";

          return `${listName} · Item ${itemNumber}`;
        }

        case "list_item_field": {
          const listField =
            data.sections?.[selection.sectionIndex!]?.blocks?.[
              selection.blockIndex!
            ]?.fields?.[selection.fieldIndex!];

          const itemSchema = (listField?.field_config as any)?.item_schema;

          const itemField = selection.schemaKey
            ? itemSchema?.[selection.schemaKey]
            : undefined;

          const itemFieldName =
            itemField?.label || itemField?.display_name || "Campo";

          const itemNumber =
            typeof selection.itemIndex === "number"
              ? selection.itemIndex + 1
              : "?";

          return `${itemFieldName} · Item ${itemNumber}`;
        }

        case "header":
          return selection.sectionIndex === -1
            ? "Header General"
            : "Header de Sección";

        case "footer":
          return selection.sectionIndex === -1
            ? "Footer General"
            : "Footer de Sección";

        case "header_field":
          if (selection.sectionIndex === -1) {
            const hf = data.header_config?.fields?.[selection.fieldIndex!];
            return hf?.label || hf?.display_name || "Campo de Header";
          }
          const shf =
            data.sections?.[selection.sectionIndex!]?.header_config?.fields?.[
              selection.fieldIndex!
            ];
          return (
            shf?.label || shf?.display_name || "Campo de Header de Sección"
          );

        case "footer_field":
          if (selection.sectionIndex === -1) {
            const ff = data.footer_config?.fields?.[selection.fieldIndex!];
            return ff?.label || ff?.display_name || "Campo de Footer";
          }
          const sff =
            data.sections?.[selection.sectionIndex!]?.footer_config?.fields?.[
              selection.fieldIndex!
            ];
          return (
            sff?.label || sff?.display_name || "Campo de Footer de Sección"
          );
        case "card_item": {
          const cardNumber =
            typeof selection.cardIndex === "number"
              ? selection.cardIndex + 1
              : "?";

          return selection.displayName || `Card ${cardNumber}`;
        }

        case "card_block": {
          const cardNumber =
            typeof selection.cardIndex === "number"
              ? selection.cardIndex + 1
              : "?";

          const blockNumber =
            typeof selection.cardBlockIndex === "number"
              ? selection.cardBlockIndex + 1
              : "?";

          return (
            selection.displayName ||
            `Bloque ${blockNumber} · Card ${cardNumber}`
          );
        }

        case "card_field": {
          const cardNumber =
            typeof selection.cardIndex === "number"
              ? selection.cardIndex + 1
              : "?";

          const blockNumber =
            typeof selection.cardBlockIndex === "number"
              ? selection.cardBlockIndex + 1
              : "?";

          return (
            selection.displayName ||
            `Campo · Bloque ${blockNumber} · Card ${cardNumber}`
          );
        }

        default:
          return selection.type;
      }
    } catch (e) {
      return selection.type;
    }
  };

  // Transformar datos de boletín a formato compatible con TemplatePreview
  const previewData: CreateTemplateData | null = bulletin
    ? ({
        master: {
          ...bulletin.master,
          template_name: bulletin.master.bulletin_name,
          template_type: "bulletin",
          template_description: bulletin.master.description || "",
        },
        version: {
          ...bulletin.current_version,
          content: bulletin.current_version.data,
        },
      } as unknown as CreateTemplateData)
    : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-[#ffaf68]" />
      </div>
    );
  }

  if (error || !previewData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-500 mb-4">{error || "No data found"}</p>
        <Link href="/reviews" className={btnPrimary}>
          {t("back")}
        </Link>
      </div>
    );
  }

  if (isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#bc6c25]" />

          <p className="text-sm font-medium text-gray-600">
            Regresando a revisiones...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] w-full bg-gray-100 overflow-hidden">
      {/* Top Bar - Estilo tipo Editor */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-10 shadow-sm shrink-0">
        <div className="flex items-center gap-4 flex-1">
          <Link
            href="/reviews"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 flex items-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">{t("back")}</span>
          </Link>

          <div className="h-8 w-px bg-gray-200 mx-2" />

          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-gray-900 truncate max-w-md">
              {bulletin.master.bulletin_name}
            </h1>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  bulletin.master.status === "review"
                    ? "bg-purple-100 text-purple-800"
                    : bulletin.master.status === "pending_review"
                      ? "bg-orange-100 text-orange-800"
                      : "bg-gray-100 text-gray-800"
                }`}
              >
                {bulletin.master.status === "review"
                  ? t("inReview")
                  : bulletin.master.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleReject}
            disabled={isRejecting}
            className="
              px-4 py-2 border border-red-200 text-red-600 rounded-lg
              hover:bg-red-50 flex items-center gap-2 font-medium
              transition-colors
              disabled:cursor-not-allowed disabled:opacity-60
            "
          >
            {isRejecting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <XCircle className="h-5 w-5" />
            )}

            {isRejecting ? "Rechazando..." : t("reject")}
          </button>
          <button
            onClick={handleApprove}
            className={`${btnPrimary} flex items-center gap-2 shadow-md`}
          >
            <CheckCircle className="h-5 w-5" />
            {t("approveAndPublish")}
          </button>
        </div>
      </div>

      {/* Main Content Area: Canvas + Sidebar */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Canvas Area */}
        <div className="flex-1 overflow-hidden relative bg-gray-100/50">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="bg-white p-2 rounded-lg shadow-md border hover:bg-gray-50 text-gray-600 transition-colors"
                title="Show Comments"
              >
                <ChevronsLeft className="h-5 w-5" />
              </button>
            )}
          </div>

          <Canvas
            data={previewData}
            selection={selection}
            onSelect={handleSelection}
            isCardMode={false}
            commentCounts={commentCounts}
            interactionMode="review"
            renderAllPages={true}
          />
        </div>

        {/* Sidebar */}
        <div
          className={`bg-white border-l border-gray-200 flex flex-col transition-all duration-300 ease-in-out shadow-xl z-20 ${
            isSidebarOpen
              ? "w-96 translate-x-0"
              : "w-0 translate-x-full opacity-0"
          }`}
        >
          {isSidebarOpen && (
            <>
              {/* Sidebar Header */}
              <div className="h-14 border-b border-gray-100 flex items-center justify-between px-4 bg-gray-50/50 shrink-0">
                <div className="flex items-center gap-2 font-semibold text-gray-700">
                  <MessageSquare className="h-4 w-4" />
                  <span>
                    {t("comments")} ({mappedComments.length})
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1.5 hover:bg-gray-200 rounded-md text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <ChevronsRight className="h-4 w-4" />
                </button>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {sortedComments.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{t("noComments")}</p>
                    <p className="text-xs mt-1">
                      {t("selectElementToComment")}
                    </p>
                  </div>
                ) : (
                  sortedComments.map((comment, idx) => {
                    const isSelected =
                      selection.id &&
                      comment.target_element?.id === selection.id;
                    return (
                      <div
                        key={comment.comment_id || idx}
                        onClick={() => {
                          const target = comment.target_element;

                          if (!target?.id || !target.type) {
                            return;
                          }

                          setSelection({
                            type: target.type as EditorSelection["type"],
                            id: target.id,

                            sectionIndex: target.section_index,
                            blockIndex: target.block_index,
                            fieldIndex: target.field_index,

                            itemIndex:
                              typeof target.item_index === "number"
                                ? target.item_index
                                : undefined,

                            schemaKey: target.item_field_id || undefined,
                          });

                          setTimeout(() => {
                            const selector = `[data-review-id="${target.id}"]`;

                            const element = document.querySelector(selector);

                            if (element) {
                              element.scrollIntoView({
                                behavior: "smooth",
                                block: "center",
                              });
                            }
                          }, 100);
                        }}
                        className={`group relative border rounded-xl p-3 text-sm transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-100"
                            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm"
                        }`}
                      >
                        {/* Target Badge */}
                        {comment.target_element ? (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md truncate max-w-[200px]">
                              {comment.target_element.display_name ||
                                (comment.target_element.type === "section"
                                  ? tReview("section")
                                  : comment.target_element.type === "block"
                                    ? tReview("block")
                                    : comment.target_element.type === "field"
                                      ? tReview("field")
                                      : comment.target_element.type ===
                                          "list_item"
                                        ? "List item"
                                        : comment.target_element.type ===
                                            "list_item_field"
                                          ? "Item field"
                                          : comment.target_element.type ===
                                              "header"
                                            ? tCommon("header")
                                            : comment.target_element.type ===
                                                "footer"
                                              ? tCommon("footer")
                                              : comment.target_element.type ===
                                                  "header_field"
                                                ? tCommon("header")
                                                : comment.target_element
                                                      .type === "footer_field"
                                                  ? tCommon("footer")
                                                  : "Element")}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 mb-2">
                            <span className="text-[10px] font-medium px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md">
                              {tCommon("generalComment")}
                            </span>
                          </div>
                        )}

                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
                              {(
                                comment.author_first_name?.[0] ||
                                comment.author_name?.[0] ||
                                "U"
                              ).toUpperCase()}
                            </div>
                            <span className="font-medium text-gray-900 text-xs">
                              {comment.author_first_name || "Usuario"}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400">
                            {new Date(comment.created_at).toLocaleDateString(
                              locale,
                              { month: "short", day: "numeric" },
                            )}
                          </span>
                        </div>

                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap wrap-break-word pl-8">
                          {comment.text}
                        </p>

                        {/* Actions line (optional, purely visual for now) */}
                        {/* <div className="mt-3 pl-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             <button className="text-[10px] text-gray-400 hover:text-blue-500 font-medium">Responder</button>
                        </div> */}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input Area (Sticky Bottom) */}
              <div className="p-4 bg-white border-t border-gray-100 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    {selection.id
                      ? `${t("commentFor")} ${getElementName()}`
                      : t("newGeneralComment")}
                  </span>
                  {selection.id && (
                    <button
                      onClick={() =>
                        setSelection({ type: "template", id: null })
                      }
                      className="text-[10px] text-gray-400 hover:text-gray-600 underline"
                    >
                      {t("cancelSelection")}
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pr-10 min-h-20 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none text-gray-700 transition-all placeholder:text-gray-400"
                    placeholder={
                      selection.id
                        ? t("writeAboutElement")
                        : t("writeGeneralComment")
                    }
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if (commentText.trim()) saveComment();
                      }
                    }}
                  ></textarea>
                  <button
                    onClick={saveComment}
                    disabled={!commentText.trim() || isSubmittingComment}
                    className="absolute bottom-3 right-3 p-1.5 rounded-md text-blue-600 hover:bg-blue-100 disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <div className="mt-2 text-[10px] text-gray-400 flex justify-end">
                  {t("pressEnterToSend")}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Success Modal (Approval with Link) */}
      <Modal
        isOpen={isSuccessModalOpen}
        onClose={() => {
          setIsSuccessModalOpen(false);
          router.push("/bulletins"); // Redirect after closing
        }}
        title={t("successModal.title")}
        type="success"
        footer={
          <button
            onClick={() => router.push("/bulletins")}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            {t("successModal.goToBulletins")}
          </button>
        }
      >
        <div className="flex flex-col gap-4 items-center text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
            <CheckCircle className="w-6 h-6" />
          </div>
          <p className="text-gray-600">{t("successModal.message")}</p>
          {publishedUrl && (
            <div className="w-full mt-2">
              <label className="block text-xs font-medium text-gray-500 mb-1 text-left">
                {t("successModal.publicLinkRaw")}
              </label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200 group hover:border-green-200 transition-colors">
                <span className="flex-1 text-sm text-gray-600 truncate font-mono select-all">
                  {publishedUrl}
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(publishedUrl);
                    showToast(t("successModal.linkCopied"), "success");
                  }}
                  className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-green-600 border border-transparent hover:border-gray-200 transition-all"
                  title={t("successModal.copyLinkTitle")}
                >
                  <Copy className="w-4 h-4" />
                </button>
                <a
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 hover:bg-white rounded-md text-gray-400 hover:text-green-600 border border-transparent hover:border-gray-200 transition-all"
                  title={t("successModal.openLinkTitle")}
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* Error Modal */}
      {/* 
      <Modal
        isOpen={isErrorModalOpen}
        onClose={() => setIsErrorModalOpen(false)}
        title={modalTitle || "Error"}
        type="error"
        footer={
          <button
            onClick={() => setIsErrorModalOpen(false)}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
          >
            Cerrar
          </button>
        }
      >
        <div className="flex flex-col gap-4 items-center text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-2">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <p className="text-gray-600 whitespace-pre-line">
            {modalMessage || "Ha ocurrido un error inesperado."}
          </p>
        </div>
      </Modal> 
      */}
    </div>
  );
}
