"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import FormCardPage from "../../create/FormCardPage";
import { CardAPIService } from "../../../../../services/cardService";
import { CreateCardData } from "../../../../../types/card";
import { ProtectedRoute } from "../../../../../components/ProtectedRoute";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";

export default function EditCardPage() {
  const t = useTranslations("CreateCard");
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<CreateCardData | null>(null);

  useEffect(() => {
    if (!cardId) {
      setError(t("messages.invalidId"));
      setLoading(false);
      return;
    }

    const loadCardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await CardAPIService.getCardById(cardId);
        if (!response.success || !response.data) {
          setError(t("messages.loadErrorMessage"));
          return;
        }

        const card = response.data;
        setInitialData({
          card_name: card.card_name || "",
          card_type: card.card_type,
          templates_master_ids: card.templates_master_ids || [],
          access_config: card.access_config || {
            access_type: "public",
            allowed_groups: [],
          },
          content: card.content || { blocks: [] },
          status: card.status || "active",
        });
      } catch (err) {
        console.error("Error loading card:", err);
        setError(err instanceof Error ? err.message : t("messages.loadError"));
      } finally {
        setLoading(false);
      }
    };

    loadCardData();
  }, [cardId, t]);

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#ffaf68] mx-auto mb-4" />
            <p className="text-[#283618] text-lg">{t("messages.loading")}</p>
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
                {t("messages.loadError")}
              </h2>
              <p className="text-red-600 mb-4">
                {error || t("messages.loadErrorMessage")}
              </p>
              <button
                onClick={() => router.push("/cards")}
                className="bg-[#ffaf68] hover:bg-[#ff8c42] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                {t("backToCards")}
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
        module: MODULES.CARD_MANAGEMENT,
        resourceGroupIds: initialData.access_config?.allowed_groups || [],
      }}
    >
      <FormCardPage mode="edit" cardId={cardId} initialData={initialData} />
    </ProtectedRoute>
  );
}
