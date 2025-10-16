"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import FormCardPage from "../../create/FormCardPage";
import { CardAPIService } from "../../../../../services/cardService";
import { CreateCardData } from "../../../../../types/card";
import { ProtectedRoute } from "../../../../../components/ProtectedRoute";

export default function EditCardPage() {
  const params = useParams();
  const router = useRouter();
  const cardId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<CreateCardData | null>(
    null
  );

  useEffect(() => {
    loadCardData();
  }, [cardId]);

  const loadCardData = async () => {
    if (!cardId) {
      setError("ID de card no válido");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await CardAPIService.getCardById(cardId);
      if (!response.success || !response.data) {
        setError("No se pudo cargar la información de la card");
        setLoading(false);
        return;
      }

      const card = response.data;

      const cardData: CreateCardData = {
        card_name: card.card_name || "",
        card_type: card.card_type,
        templates_master_ids: card.templates_master_ids || [],
        access_config: card.access_config || { access_type: "public", allowed_groups: [] },
        content: card.content || { blocks: [] },
        status: card.status || "active"
      };

      setInitialData(cardData);
    } catch (err) {
      console.error("Error loading card:", err);
      setError(err instanceof Error ? err.message : "Error al cargar la card");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-[#ffaf68] mx-auto mb-4" />
            <p className="text-[#283618] text-lg">Cargando card...</p>
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
              <h2 className="text-xl font-semibold text-red-800 mb-2">Error al cargar la card</h2>
              <p className="text-red-600 mb-4">{error || "No se pudieron cargar los datos de la card"}</p>
              <button
                onClick={() => router.push("/cards")}
                className="bg-[#ffaf68] hover:bg-[#ff8c42] text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Volver a Cards
              </button>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <FormCardPage mode="edit" cardId={cardId} initialData={initialData} />
    </ProtectedRoute>
  );
}
