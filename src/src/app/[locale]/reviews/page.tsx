"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";
import {
  btnPrimary,
  container,
  pageSubtitle,
  pageTitle,
  searchField,
} from "../components/ui";
import { useTranslations, useLocale } from "next-intl";
import Image from "next/image";
import { Loader2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { BulletinMaster } from "@/types/bulletin";
import BulletinAPIService from "@/services/bulletinService";
import { TemplateAPIService } from "@/services/templateService";
import ItemCard from "../components/ItemCard";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";
import { usePermissions } from "@/hooks/usePermissions";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ReviewsPage() {
  const t = useTranslations("Bulletins"); // Reusing Bulletins translations for now
  const tNavbar = useTranslations("Navbar");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bulletins, setBulletins] = useState<BulletinMaster[]>([]);
  const [filteredBulletins, setFilteredBulletins] = useState<BulletinMaster[]>(
    [],
  );
  const [templatesMap, setTemplatesMap] = useState<Record<string, string>>({});
  const [templateThumbnailsMap, setTemplateThumbnailsMap] = useState<
    Record<string, string[]>
  >({});
  const { can } = usePermissions();
  const router = useRouter();
  const { authenticated, loading: authLoading } = useAuth();

  // Establecer el título de la página
  useEffect(() => {
    document.title = `Bulletin builder - ${tNavbar("reviews")}`;
  }, [tNavbar]);

  // Cargar bulletins solo cuando la autenticación ya está resuelta
  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!authenticated) {
      setLoading(false);
      setError(null);
      return;
    }

    loadBulletins();
  }, [authLoading, authenticated]);

  // Función para cargar boletines desde la API
  const loadBulletins = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await BulletinAPIService.getBulletins();

      if (response.success) {
        console.log("Fetched bulletins for review:", response);
        // Filter only bulletins in review or pending_review
        const reviewBulletins = response.data.filter((b) =>
          ["pending_review", "review"].includes(b.status),
        );

        setBulletins(reviewBulletins);
        setFilteredBulletins(reviewBulletins);

        // Obtener los nombres y thumbnails de los templates base
        const templateIds = [
          ...new Set(reviewBulletins.map((b) => b.base_template_master_id)),
        ];

        if (templateIds.length > 0) {
          const templatesResponse = await Promise.all(
            templateIds.map((id) =>
              TemplateAPIService.getTemplateById(id).catch(() => null),
            ),
          );

          const newTemplatesMap: Record<string, string> = {};
          const newThumbnailsMap: Record<string, string[]> = {};
          templatesResponse.forEach((res) => {
            if (res?.success && res.data) {
              const template = res.data as any;
              newTemplatesMap[template._id!] = template.template_name;
              newThumbnailsMap[template._id!] = template.thumbnail_images || [];
            }
          });
          setTemplatesMap(newTemplatesMap);
          setTemplateThumbnailsMap(newThumbnailsMap);
        }
      } else {
        setError(response.message || "Error al cargar los boletines");
      }
    } catch (err) {
      setError("Error de conexión al cargar los boletines");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar boletines cuando cambia el término de búsqueda
  useEffect(() => {
    const term = searchTerm.trim().toLowerCase();

    const filtered = bulletins.filter((bulletin) => {
      const matchesSearch =
        !term ||
        bulletin.bulletin_name.toLowerCase().includes(term) ||
        (templatesMap[bulletin.base_template_master_id] &&
          templatesMap[bulletin.base_template_master_id]
            .toLowerCase()
            .includes(term));

      return matchesSearch;
    });

    setFilteredBulletins(filtered);
  }, [searchTerm, bulletins, templatesMap]);

  return (
    <ProtectedRoute
      requiredPermission={{
        action: PERMISSION_ACTIONS.Read, // Asumiendo que leer es suficiente para ver la lista, pero para revisar se validará al entrar
        module: MODULES.REVIEW,
      }}
    >
      <main>
        <section className="desk-texture desk-texture-strong bg-[#fefae0] py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <h1 className={pageTitle}>{t("reviewsPageTitle")}</h1>
                <p className={pageSubtitle}>{t("reviewsPageSubtitle")}</p>
              </div>
              <div className="hidden lg:block -rotate-12">
                <Image
                  src="/assets/img/bol3.jpg"
                  alt="Reviews dashboard"
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
          {/* Search Bar */}
          <div className="flex gap-4 mb-8">
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
              <button onClick={() => loadBulletins()} className={btnPrimary}>
                {t("retry")}
              </button>
            </div>
          )}

          {/* Bulletins Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBulletins
                .filter((bulletin, index, array) => {
                  return (
                    bulletin._id &&
                    array.findIndex((b) => b._id === bulletin._id) === index
                  );
                })
                .map((bulletin, index) => {
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
                        bulletin.log.updated_at!,
                      ).toLocaleDateString()}
                      templateBaseName={
                        templatesMap[bulletin.base_template_master_id]
                      }
                      status={bulletin.status}
                      thumbnailImages={
                        templateThumbnailsMap[
                          bulletin.base_template_master_id
                        ] || []
                      }
                      editBtn={true} // Siempre mostrar botón de acción
                      onEdit={() => router.push(`/reviews/${bulletin._id}`)}
                    />
                  );
                })}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && filteredBulletins.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#283618]/60 mb-4">
                No hay boletines pendientes de revisión.
              </p>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
