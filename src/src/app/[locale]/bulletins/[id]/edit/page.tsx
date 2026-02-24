"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import FormBulletinPage from "../../create/FormBulletinPage";
import { BulletinAPIService } from "../../../../../services/bulletinService";
import {
  CreateBulletinData,
  BulletinStatus,
} from "../../../../../types/bulletin";
import { ProtectedRoute } from "../../../../../components/ProtectedRoute";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";
import { useAuth } from "@/hooks/useAuth";
import { slugify } from "../../../../../utils/slugify";
import { ReviewService } from "@/services/reviewService";
import { ReviewComment } from "@/types/review";
import { BulletinComment } from "@/types/bulletin"; // Ensure alias is used consistently

export default function EditBulletinPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("CreateBulletin");
  const bulletinId = params.id as string;
  const { userInfo } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<CreateBulletinData | null>(
    null,
  );
  const [comments, setComments] = useState<BulletinComment[]>([]);

  useEffect(() => {
    loadBulletinData();
  }, [bulletinId]);

  useEffect(() => {
    const reopenIfRejected = async () => {
      if (initialData?.master.status === "rejected") {
        try {
          await ReviewService.reopenBulletin(bulletinId);
          console.log("Bulletin reopened successfully.");
        } catch (error) {
          console.error("Failed to reopen bulletin:", error);
        }
      }
    };

    reopenIfRejected();
  }, [initialData, bulletinId]);

  const loadBulletinData = async () => {
    if (!bulletinId) {
      setError(t("editBulletin.errorInvalidId"));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await BulletinAPIService.getCurrentVersion(bulletinId);

      if (!response.success || !response.data) {
        setError(t("editBulletin.errorNoData"));
        return;
      }

      const { master, current_version: currentVersion } = response.data;
      console.log("Bulletin master y versión cargados:", {
        master,
        currentVersion,
      });

      if (!currentVersion || !currentVersion.data) {
        console.warn(
          "La versión actual no tiene data, usando valores por defecto",
        );
        setError(t("editBulletin.errorNoVersion"));
        return;
      }

      const bulletinData: CreateBulletinData = {
        master: {
          bulletin_name: master.bulletin_name,
          name_machine: master.name_machine || slugify(master.bulletin_name), // Generar automáticamente si no existe
          status: master.status as BulletinStatus,
          log: master.log,
          base_template_master_id: master.base_template_master_id,
          base_template_version_id: master.base_template_version_id,
          access_config: master.access_config,
        },
        version: {
          version_num: currentVersion.version_num + 1,
          commit_message: "Versión actualizada",
          log: {
            created_at: new Date().toISOString(),
            creator_user_id: userInfo?.id || "",
            creator_first_name: userInfo?.first_name || null,
            creator_last_name: userInfo?.last_name || null,
            updated_at: new Date().toISOString(),
            updater_user_id: userInfo?.id || "",
            updater_first_name: userInfo?.first_name || null,
            updater_last_name: userInfo?.last_name || null,
          },
          data: currentVersion.data,
        },
      };

      setInitialData(bulletinData);
    } catch (err) {
      console.error("Error loading bulletin:", err);
      setError(
        err instanceof Error ? err.message : t("editBulletin.errorGeneric"),
      );
    } finally {
      setLoading(false);
    }
  };

  const loadComments = async () => {
    try {
      const response = await ReviewService.getReviewHistory(bulletinId);

      // 1. Normalizamos la respuesta: si viene en .data bien, si no, usamos el objeto completo
      const historyData = (response as any).data || response;

      // 2. Cambiamos la validación: verificamos si existen comentarios o ciclos
      if (historyData && (historyData.comments || historyData.active_cycle)) {
        const transformReviewCommentToComment = (
          reviewComment: any,
        ): BulletinComment => ({
          comment_id: reviewComment.comment_id,
          target_element: {
            section_id: reviewComment.target_element?.section_id || undefined,
            block_id: reviewComment.target_element?.block_id || undefined,
            field_id: reviewComment.target_element?.field_id || undefined,
          },
          text: reviewComment.text,
          author_id: reviewComment.author_id,
          author_first_name: reviewComment.author_first_name || reviewComment.reviewer_first_name, // Fallback to reviewer name if author name is missing
          author_last_name: reviewComment.author_last_name || reviewComment.reviewer_last_name,
          created_at: new Date(reviewComment.created_at),
          replies: reviewComment.replies?.map(transformReviewCommentToComment) || [],
          bulletin_version_id: reviewComment.bulletin_version_id || "",
        });

        // Use Set to avoid duplicate comments
        const processedCommentsMap = new Map<string, BulletinComment>();

        const addCommentsToMap = (commentsToAdd: any[]) => {
            commentsToAdd.forEach(c => {
                 if(c && c.comment_id) {
                     processedCommentsMap.set(c.comment_id, transformReviewCommentToComment(c));
                 }
            });
        };


        if (Array.isArray(historyData.comments)) {
          addCommentsToMap(historyData.comments);
        }
        
        if (historyData.active_cycle?.comments && Array.isArray(historyData.active_cycle.comments)) {
            addCommentsToMap(historyData.active_cycle.comments);
        }

        // Also check if there are comments in other cycles if needed, or if the backend returns them all in root
        if(historyData.review_cycles && Array.isArray(historyData.review_cycles)) {
            historyData.review_cycles.forEach((cycle: any) => {
                if(cycle.comments && Array.isArray(cycle.comments)) {
                    addCommentsToMap(cycle.comments);
                }
            });
        }

        const processedComments = Array.from(processedCommentsMap.values());
        
        console.log("✅ Comentarios encontrados y procesados:", processedComments);
        setComments(processedComments);
      } else {
        console.warn("⚠️ No se encontraron comentarios en la respuesta:", response);
      }
    } catch (error) {
      console.error("❌ Error en la petición de comentarios:", error);
    }
  };

  useEffect(() => {
    loadComments();
  }, [bulletinId]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#283618] mx-auto mb-4" />
            <p className="text-[#283618] text-lg">Cargando boletín...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (error || !initialData) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-red-800 mb-2">
                {t("editBulletin.errorTitle")}
              </h2>
              <p className="text-red-600 mb-4">
                {error || t("editBulletin.errorNoData")}
              </p>
              <button
                onClick={() => router.push("/bulletins")}
                className="bg-[#283618] hover:bg-[#606c38] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {t("backToBulletins")}
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute
      requiredPermission={{
        action: PERMISSION_ACTIONS.Update,
        module: MODULES.BULLETINS_COMPOSER,
      }}
    >
      <FormBulletinPage
        mode="edit"
        bulletinId={bulletinId}
        initialData={initialData}
        comments={comments as any} // Temporary cast to resolve type mismatch
      />
    </ProtectedRoute>
  );
}
