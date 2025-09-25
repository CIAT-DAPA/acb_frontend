"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Plus, Search, Loader2 } from "lucide-react";
import Image from "next/image";
import ItemCard from "../components/ItemCard";
import { TemplateAPIService } from "../../../services/templateService";
import { ProtectedRoute } from "../../../components/ProtectedRoute";
import {
  container,
  btnPrimary,
  searchField,
  pageTitle,
  pageSubtitle,
} from "../components/ui";
import { TemplateMaster } from "@/types/template";

export default function Templates() {
  const t = useTranslations("Templates");
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState<TemplateMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar templates al montar el componente
  useEffect(() => {
    loadTemplates();
  }, []);

  // Función para cargar templates desde la API
  const loadTemplates = async (search?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await TemplateAPIService.getTemplates();

      if (response.success) {
        console.log("Fetched templates:", response);
        setTemplates(response.data);
      } else {
        setError(response.message || "Error al cargar las plantillas");
      }
    } catch (err) {
      setError("Error de conexión al cargar las plantillas");
    } finally {
      setLoading(false);
    }
  };

  // Ejecutar búsqueda con debounce
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      loadTemplates(searchTerm);
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  return (
    <ProtectedRoute>
      <main>
        <section className="desk-texture desk-texture-strong bg-[#fefae0] py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <h1 className={pageTitle}>{t("title")}</h1>
                <p className={pageSubtitle}>{t("subtitle")}</p>
              </div>
              <div className="hidden lg:block rotate-12">
                <Image
                  src="/assets/img/bol1.jpg"
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
          {/* Search Bar y Botón Crear */}
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
            <Link
              href="/templates/create"
              className={`${btnPrimary} whitespace-nowrap`}
            >
              <Plus className="h-5 w-5" />
              <span>{t("createNew")}</span>
            </Link>
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
                onClick={() => loadTemplates(searchTerm)}
                className={btnPrimary}
              >
                {t("retry")}
              </button>
            </div>
          )}

          {/* Templates Grid */}
          {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates
                .filter((template, index, array) => {
                  // Filter out templates without valid _id and remove duplicates
                  return (
                    template._id &&
                    array.findIndex((t) => t._id === template._id) === index
                  );
                })
                .map((template, index) => (
                  <ItemCard
                    key={template._id || `template-${index}`}
                    id={template._id!} // Pasar directamente como string
                    name={template.template_name}
                    author={template.log.creator_user_id}
                    lastModified={new Date(
                      template.log.updated_at!
                    ).toLocaleDateString()}
                    type="template"
                  />
                ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && templates.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#283618]/60 mb-4">{t("noResults")}</p>
              <Link
                href="/templates/create"
                className="text-[#ffaf68] hover:underline"
              >
                {t("createFirst")}
              </Link>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
