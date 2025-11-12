"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import FormBulletinPage from "../../create/FormBulletinPage";
import { BulletinAPIService } from "../../../../../services/bulletinService";
import { CreateBulletinData } from "../../../../../types/bulletin";
import { ProtectedRoute } from "../../../../../components/ProtectedRoute";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";
import { useAuth } from "@/hooks/useAuth";

export default function EditBulletinPage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("CreateBulletin");
  const bulletinId = params.id as string;
  const { userInfo } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<CreateBulletinData | null>(
    null
  );

  useEffect(() => {
    loadBulletinData();
  }, [bulletinId]);

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
          "La versión actual no tiene data, usando valores por defecto"
        );
        setError(t("editBulletin.errorNoVersion"));
        return;
      }

      const bulletinData: CreateBulletinData = {
        master: {
          bulletin_name: master.bulletin_name,
          status: master.status,
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
        err instanceof Error ? err.message : t("editBulletin.errorGeneric")
      );
    } finally {
      setLoading(false);
    }
  };

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
      />
    </ProtectedRoute>
  );
}
