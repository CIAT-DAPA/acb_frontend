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
  Maximize2,
  Minimize2,
} from "lucide-react";
import { BulletinAPIService } from "@/services/bulletinService";
import { ReviewService } from "@/services/reviewService";
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
  const t = useTranslations("Bulletins");
  const tCommon = useTranslations("Common");
  const tReview = useTranslations("Review");
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

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  let sIndex: number | undefined;
  let bIndex: number | undefined;
  let fIndex: number | undefined;

  const mappedComments = useMemo(() => {
    if (!bulletin || !comments.length) return comments;
    const data = bulletin.current_version.data as TemplateVersionContent;

    return comments.map((comment) => {
      const target = comment.target_element;
      if (!target) return comment;

      // Handle backend response where target_element has null values instead of being null/undefined
      if (
        !target.section_id &&
        !target.block_id &&
        !target.field_id &&
        !target.id
      ) {
        // Return a copy without target_element (or set to undefined) so UI fails gracefully to "General Comment"
        const { target_element, ...rest } = comment;
        return rest as ReviewComment;
      }

      // If we already have a frontend ID that looks like 'section-0', 'block-0-1', etc. use it.
      // However, new comments from backend will have section_id, block_id, field_id.

      let frontendId: string = target.id || "unknown-id";
      let type: string = target.type || "unknown-type";

      if (target.section_id) {
        sIndex = data.sections.findIndex(
          (s) => s.section_id === target.section_id,
        );
        if (sIndex !== -1) {
          const section = data.sections[sIndex];
          if (target.block_id) {
            if (section && section.blocks) {
              bIndex = section.blocks.findIndex(
                (b) => b.block_id === target.block_id,
              );
              if (bIndex !== -1) {
                if (target.field_id) {
                  const block = section.blocks[bIndex];
                  if (block && block.fields) {
                    fIndex = block.fields.findIndex(
                      (f) => f.field_id === target.field_id,
                    );
                    if (fIndex !== -1) {
                      frontendId = `field-${sIndex}-${bIndex}-${fIndex}`;
                      type = "field";
                    }
                  }
                } else {
                  frontendId = `block-${sIndex}-${bIndex}`;
                  type = "block";
                }
              }
            }
          } else if (target.field_id) {
            // Check for section header/footer fields
            let foundHeader = false;
            if (section && section.header_config?.fields) {
              const hIndex = section.header_config.fields.findIndex(
                (f) => f.field_id === target.field_id,
              );
              if (hIndex !== -1) {
                frontendId = `header-${sIndex}-${hIndex}`;
                type = "header_field";
                foundHeader = true;
              }
            }
            // Fallback to global header if not found
            if (!foundHeader && data.header_config?.fields) {
              const ghIndex = data.header_config.fields.findIndex(
                (f) => f.field_id === target.field_id,
              );
              if (ghIndex !== -1) {
                frontendId = `header-${sIndex}-${ghIndex}`;
                type = "header_field";
              }
            }

            // Footer
            if (type !== "header_field" && section) {
              let foundFooter = false;
              if (section.footer_config?.fields) {
                const foIndex = section.footer_config.fields.findIndex(
                  (f) => f.field_id === target.field_id,
                );
                if (foIndex !== -1) {
                  frontendId = `footer-${sIndex}-${foIndex}`;
                  type = "footer_field";
                  foundFooter = true;
                }
              }
              // Fallback to global footer
              if (!foundFooter && data.footer_config?.fields) {
                const gfIndex = data.footer_config.fields.findIndex(
                  (f) => f.field_id === target.field_id,
                );
                if (gfIndex !== -1) {
                  frontendId = `footer-${sIndex}-${gfIndex}`;
                  type = "footer_field";
                }
              }
            }
          } else {
            frontendId = `section-${sIndex}`;
            type = "section";
          }
        }
      } else if (target.field_id) {
        // Global header/footer without section_id
        if (data.header_config?.fields) {
          const ghIndex = data.header_config.fields.findIndex(
            (f) => f.field_id === target.field_id,
          );
          if (ghIndex !== -1) {
            frontendId = `header-global-${ghIndex}`;
            type = "header_field";
          }
        }
        // Check footer global
        if (type !== "header_field" && data.footer_config?.fields) {
          const gfIndex = data.footer_config.fields.findIndex(
            (f) => f.field_id === target.field_id,
          );
          if (gfIndex !== -1) {
            frontendId = `footer-global-${gfIndex}`;
            type = "footer_field";
          }
        }
      }

      // Compare if we calculated a new ID or type
      if (frontendId !== target.id || type !== target.type) {
        const updatedTarget = {
          ...target,
          id: frontendId,
          type: type,
        };

        if (
          type === "field" &&
          typeof sIndex !== "undefined" &&
          typeof bIndex !== "undefined" &&
          typeof fIndex !== "undefined"
        ) {
          updatedTarget.display_name =
            data.sections[sIndex]?.blocks[bIndex]?.fields[fIndex]?.display_name;
        } else if (
          type === "block" &&
          typeof sIndex !== "undefined" &&
          typeof bIndex !== "undefined"
        ) {
          updatedTarget.display_name =
            data.sections[sIndex]?.blocks[bIndex]?.display_name;
        } else if (type === "section" && typeof sIndex !== "undefined") {
          updatedTarget.display_name = data.sections[sIndex]?.display_name;
        }

        return {
          ...comment,
          target_element: updatedTarget,
        };
      }
      return comment;
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
    // Mock approval
    alert("Boletín aprobado y publicado (Simulado)");
    router.push("/reviews");
  };

  const handleReject = async () => {
    // Mock rejection
    alert("Boletín rechazado y devuelto a borrador (Simulado)");
    router.push("/reviews");
  };

  const handleSelection = (newSelection: EditorSelection, rect?: DOMRect) => {
    setSelection(newSelection);

    // Si se selecciona un elemento comentable, asegurar que el sidebar esté abierto
    if (
      newSelection.id &&
      (newSelection.type === "section" ||
        newSelection.type === "block" ||
        newSelection.type === "field" ||
        newSelection.type === "header" ||
        newSelection.type === "footer" ||
        newSelection.type === "header_field" ||
        newSelection.type === "footer_field")
    ) {
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
        const target: any = {};

        // Helper to extract IDs based on indices
        if (
          selection.sectionIndex !== undefined &&
          selection.sectionIndex >= 0
        ) {
          const section = data.sections[selection.sectionIndex];
          if (section) {
            target.section_id = section.section_id;

            if (
              selection.blockIndex !== undefined &&
              selection.blockIndex >= 0
            ) {
              const block = section.blocks[selection.blockIndex];
              if (
                block &&
                (selection.type === "block" || selection.type === "field")
              ) {
                target.block_id = block.block_id;

                if (
                  selection.fieldIndex !== undefined &&
                  selection.fieldIndex >= 0 &&
                  selection.type === "field"
                ) {
                  const field = block.fields[selection.fieldIndex];
                  if (field) {
                    target.field_id = field.field_id;
                  }
                }
              }
            }
          }

          // Handle header/footer fields
          if (
            selection.type === "header_field" &&
            selection.fieldIndex !== undefined
          ) {
            // Heuristic: Check section config first, then global
            let field = section.header_config?.fields?.[selection.fieldIndex!];
            if (!field && data.header_config?.fields?.[selection.fieldIndex!]) {
              field = data.header_config.fields[selection.fieldIndex!];
            }
            if (field) {
              target.field_id = field.field_id;
              target.type = "header_field";
            }
          }

          if (
            selection.type === "footer_field" &&
            selection.fieldIndex !== undefined
          ) {
            let field = section.footer_config?.fields?.[selection.fieldIndex!];
            if (!field && data.footer_config?.fields?.[selection.fieldIndex!]) {
              field = data.footer_config.fields[selection.fieldIndex!];
            }
            if (field) {
              target.field_id = field.field_id;
              target.type = "footer_field";
            }
          }
        }

        // Handle global header/footer (if sectionIndex is -1 or missing but type is header/footer)
        // ... (currently selection.sectionIndex seems to be populated for headers/footers in Canvas)

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
              id: selection.id,
              type: selection.type,
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

        case "field":
          const f =
            data.sections?.[selection.sectionIndex!]?.blocks?.[
              selection.blockIndex!
            ]?.fields?.[selection.fieldIndex!];
          return f?.label || f?.display_name || "Campo";

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
          Volver
        </Link>
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
            <span className="font-medium">Volver</span>
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
                  ? "En revisión"
                  : bulletin.master.status}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReject}
            className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 font-medium transition-colors"
          >
            <XCircle className="h-5 w-5" />
            Rechazar
          </button>
          <button
            onClick={handleApprove}
            className={`${btnPrimary} flex items-center gap-2 shadow-md`}
          >
            <CheckCircle className="h-5 w-5" />
            Aprobar y Publicar
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
                  <span>Comentarios ({mappedComments.length})</span>
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
                    <p className="text-sm">Sin comentarios aún</p>
                    <p className="text-xs mt-1">
                      Selecciona un elemento para comentar
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
                          if (comment.target_element?.id) {
                            // Find element in canvas if possible - this requires the Canvas to expose refs or IDs
                            // Since we don't have direct access to internal refs, we rely on selection to highlight it
                            // But scrolling might need document.getElementById if IDs are applied to DOM elements

                            // Try to select it
                            setSelection({
                              type: comment.target_element.type as any,
                              id: comment.target_element.id,
                            });

                            // Try to scroll
                            // Assuming Canvas renders elements with data-review-id matching our frontendIds
                            setTimeout(() => {
                              const selector = `[data-review-id="${comment.target_element!.id!}"]`;
                              const el = document.querySelector(selector);
                              if (el) {
                                el.scrollIntoView({
                                  behavior: "smooth",
                                  block: "center",
                                });
                              }
                            }, 100);
                          }
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
                                      : comment.target_element.type === "header"
                                        ? tCommon("header")
                                        : comment.target_element.type ===
                                            "footer"
                                          ? tCommon("footer")
                                          : comment.target_element.type ===
                                              "header_field"
                                            ? tCommon("header")
                                            : comment.target_element.type ===
                                                "footer_field"
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
                      ? `Comentario para: ${getElementName()}`
                      : "Nuevo comentario general"}
                  </span>
                  {selection.id && (
                    <button
                      onClick={() =>
                        setSelection({ type: "template", id: null })
                      }
                      className="text-[10px] text-gray-400 hover:text-gray-600 underline"
                    >
                      Cancelar selección
                    </button>
                  )}
                </div>

                <div className="relative">
                  <textarea
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 pr-10 min-h-20 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none resize-none text-gray-700 transition-all placeholder:text-gray-400"
                    placeholder={
                      selection.id
                        ? "Escribe sobre este elemento..."
                        : "Escribe un comentario general..."
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
                  Presiona Enter para enviar
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
