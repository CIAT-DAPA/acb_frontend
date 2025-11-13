"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  btnPrimary,
  container,
  pageSubtitle,
  pageTitle,
  searchField,
} from "../components/ui";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Loader2, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BulletinMaster } from "@/types/bulletin";
import BulletinAPIService from "@/services/bulletinService";
import { TemplateAPIService } from "@/services/templateService";
import ItemCard from "../components/ItemCard";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";
import { usePermissions } from "@/hooks/usePermissions";

export default function Bulletins() {
  const t = useTranslations("Bulletins");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulletins, setBulletins] = useState<BulletinMaster[]>([]);
  const [templatesMap, setTemplatesMap] = useState<Record<string, string>>({});
  const { can } = usePermissions();

  // Cargar bulletins al montar el componente
  useEffect(() => {
    loadBulletins();
  }, []);

  // Función para cargar templates desde la API
  const loadBulletins = async (search?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await BulletinAPIService.getBulletins();

      if (response.success) {
        console.log("Fetched bulletins:", response);
        setBulletins(response.data);

        // Obtener los nombres de los templates base
        const templateIds = [
          ...new Set(response.data.map((b) => b.base_template_master_id)),
        ];
        const templatesResponse = await Promise.all(
          templateIds.map((id) =>
            TemplateAPIService.getTemplateById(id).catch(() => null)
          )
        );

        const newTemplatesMap: Record<string, string> = {};
        templatesResponse.forEach((res) => {
          if (res?.success && res.data) {
            newTemplatesMap[res.data._id!] = res.data.template_name;
          }
        });
        setTemplatesMap(newTemplatesMap);
      } else {
        setError(response.message || "Error al cargar los boletines");
      }
    } catch (err) {
      setError("Error de conexión al cargar los boletines");
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar búsqueda con debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadBulletins(searchTerm);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <ProtectedRoute
      requiredPermission={{
        action: PERMISSION_ACTIONS.Read,
        module: MODULES.BULLETINS_COMPOSER,
      }}
    >
      <main>
        <section className="desk-texture desk-texture-strong bg-[#fefae0] py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <h1 className={pageTitle}>{t("title")}</h1>
                <p className={pageSubtitle}>{t("subtitle")}</p>
              </div>
              <div className="hidden lg:block -rotate-12">
                <Image
                  src="/assets/img/bol3.jpg"
                  alt="Templates dashboard"
                  width={150}
                  height={319}
                  className="object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className={`${container} py-8`}>
          {/* Search Bar y Botones */}
          <div className="flex gap-4 mb-8">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#283618]/50" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={searchField}
              />
            </div>
            {/* Botón Crear */}
            {can(PERMISSION_ACTIONS.Create, MODULES.BULLETINS_COMPOSER) && (
              <Link
                href="/bulletins/create"
                className={`${btnPrimary} whitespace-nowrap`}
              >
                <Plus className="h-5 w-5" />
                <span>{t("createNew")}</span>
              </Link>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ffaf68]" />
              <span className="ml-2 text-[#283618]/60">{t("loading")}</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => loadBulletins(searchTerm)}
                className={btnPrimary}
              >
                {t("retry")}
              </button>
            </div>
          )}

          {/* Bulletins Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bulletins
                .filter((bulletin, index, array) => {
                  // Filter out bulletins without valid _id and remove duplicates
                  return (
                    bulletin._id &&
                    array.findIndex((b) => b._id === bulletin._id) === index
                  );
                })
                .map((bulletin, index) => {
                  const allowedGroups =
                    bulletin.access_config?.allowed_groups || [];
                  const canEdit = can(
                    PERMISSION_ACTIONS.Update,
                    MODULES.TEMPLATE_MANAGEMENT,
                    allowedGroups
                  );
                  const canDelete = can(
                    PERMISSION_ACTIONS.Delete,
                    MODULES.TEMPLATE_MANAGEMENT,
                    allowedGroups
                  );
                  const creatorName =
                    bulletin.log.creator_first_name &&
                    bulletin.log.creator_last_name
                      ? `${bulletin.log.creator_first_name} ${bulletin.log.creator_last_name}`
                      : bulletin.log.creator_first_name ||
                        bulletin.log.creator_last_name ||
                        bulletin.log.creator_user_id;

                  return (
                    <ItemCard
                      key={bulletin._id || `bulletin-${index}`}
                      type="template"
                      id={bulletin._id!}
                      name={bulletin.bulletin_name}
                      author={creatorName}
                      lastModified={new Date(
                        bulletin.log.updated_at!
                      ).toLocaleDateString()}
                      templateBaseName={
                        templatesMap[bulletin.base_template_master_id]
                      }
                      editBtn={canEdit}
                      onEdit={() =>
                        (window.location.href = `/bulletins/${bulletin._id}/edit`)
                      }
                    />
                  );
                })}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && bulletins.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#283618]/60 mb-4">{t("noResults")}</p>
              {can(PERMISSION_ACTIONS.Create, MODULES.BULLETINS_COMPOSER) && (
                <Link href="/bulletins/create" className={btnPrimary}>
                  {t("createFirst")}
                </Link>
              )}
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
