"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  Search,
  Grid3X3,
  List,
  Filter,
  Image as ImageIcon,
  FileText,
  Trash2,
  Eye,
  Download,
  MoreHorizontal,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import {
  container,
  btnPrimary,
  searchField,
  pageTitle,
  pageSubtitle,
} from "../../components/ui";
import { VisualResource, VisualResourceFileType } from "@/types/visualResource";
import { VisualResourcesService } from "@/services/visualResourcesService";

export default function VisualResources() {
  const t = useTranslations("VisualResources");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "icon">("all");
  const [allResources, setAllResources] = useState<VisualResource[]>([]); // Todos los recursos originales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] =
    useState<VisualResource | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Cargar recursos visuales al montar el componente (solo una vez)
  useEffect(() => {
    loadVisualResources();
  }, []);

  // Efecto para cerrar el modal con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showPreviewModal) {
        handleClosePreview();
      }
    };

    if (showPreviewModal) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevenir scroll del fondo
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // Restaurar scroll
    };
  }, [showPreviewModal]);

  // Función para cargar recursos visuales desde el servicio
  const loadVisualResources = async () => {
    setLoading(true);
    setError(null);

    try {
      const allResourcesResponse =
        await VisualResourcesService.getAllVisualResources();

      setAllResources(allResourcesResponse.data || []); // Guardar todos los recursos originales
      console.log("Recursos visuales cargados:", allResourcesResponse.data);
    } catch (err) {
      setError("Error de conexión al cargar los recursos visuales");
      console.error("Error loading visual resources:", err);
      setAllResources([]); // Limpiar recursos en caso de error
    } finally {
      setLoading(false);
    }
  };

  // Filtrar recursos localmente basado en el término de búsqueda y tipo
  const filteredResources = allResources.filter((resource) => {
    // Filtrar por tipo si no es "all"
    const matchesType =
      filterType === "all" || resource.file_type === filterType;

    // Filtrar por término de búsqueda (en nombre del archivo)
    const matchesSearch =
      searchTerm === "" ||
      resource.file_name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesType && matchesSearch;
  });

  // Función para formatear el tamaño del archivo (si está disponible en los logs)
  const formatFileSize = (resource: VisualResource) => {
    // Por ahora retornamos un tamaño estimado o "N/A" si no está disponible
    // En el futuro se puede obtener del sistema de archivos o de los logs
    return "N/A";
  };

  // Función para obtener las etiquetas/categorías del recurso
  const getResourceTags = (resource: VisualResource) => {
    const tags = [];

    // Agregar tipo como etiqueta
    tags.push(resource.file_type);

    // Agregar acceso como etiqueta si no es público
    if (resource.access_config.access_type !== "public") {
      tags.push(resource.access_config.access_type);
    }

    return tags;
  };

  // Función para abrir el modal de vista previa
  const handleViewResource = (resource: VisualResource) => {
    setSelectedResource(resource);
    setShowPreviewModal(true);
  };

  // Función para cerrar el modal de vista previa
  const handleClosePreview = () => {
    setSelectedResource(null);
    setShowPreviewModal(false);
  };

  // Función para eliminar un recurso
  const handleDeleteResource = async (resource: VisualResource) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar "${resource.file_name}"? Esta acción no se puede deshacer.`
    );

    if (!confirmDelete) return;

    try {
      setLoading(true);
      await VisualResourcesService.deleteVisualResource(resource.id);

      // Remover el recurso de la lista local
      setAllResources((prevResources: VisualResource[]) =>
        prevResources.filter((r: VisualResource) => r.id !== resource.id)
      );

      console.log(`Recurso eliminado: ${resource.file_name}`);
    } catch (error) {
      console.error("Error al eliminar el recurso:", error);
      setError("Error al eliminar el recurso. Por favor, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  // Función para descargar un recurso
  const handleDownloadResource = async (resource: VisualResource) => {
    try {
      setDownloadingId(resource.id);

      // Construir la URL completa del recurso
      const baseUrl = window.location.origin;
      const fullImageUrl = resource.file_url.startsWith("http")
        ? resource.file_url
        : `${baseUrl}${resource.file_url}`;

      // Fetch la imagen como blob para asegurar la descarga
      const response = await fetch(fullImageUrl);
      if (!response.ok) {
        throw new Error("Error al obtener el archivo");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Crear un elemento 'a' temporal para descargar
      const link = document.createElement("a");
      link.href = url;
      link.download = resource.file_name;

      // Agregar al DOM, hacer click y remover
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar la URL del blob
      window.URL.revokeObjectURL(url);

      console.log(`Descargado: ${resource.file_name}`);
    } catch (error) {
      console.error("Error al descargar el recurso:", error);
      alert(
        "Error al descargar el archivo. Verifica que el archivo esté disponible."
      );
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <ProtectedRoute>
      <main>
        <section className="desk-texture desk-texture-strong bg-[#fefae0] py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Link
                    href="/templates"
                    className="flex items-center gap-2 text-[#283618]/60 hover:text-[#283618] transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>{t("backToTemplates")}</span>
                  </Link>
                </div>
                <h1 className={pageTitle}>{t("title")}</h1>
                <p className={pageSubtitle}>{t("subtitle")}</p>
              </div>
              <div className="hidden lg:block rotate-12">
                <div className="w-32 h-32 bg-gradient-to-br from-[#ffaf68] to-[#ff8c42] rounded-lg flex items-center justify-center">
                  <ImageIcon className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className={`${container} py-8`}>
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
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

            {/* Filtros y controles */}
            <div className="flex gap-2">
              {/* Filtro por tipo */}
              <select
                value={filterType}
                onChange={(e) =>
                  setFilterType(e.target.value as "all" | "image" | "icon")
                }
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffaf68] focus:border-transparent"
              >
                <option value="all">{t("allFiles")}</option>
                <option value="image">{t("images")}</option>
                <option value="icon">{t("icons")}</option>
              </select>

              {/* Botón subir */}
              <Link
                href="/templates/visual-resources/upload"
                className={btnPrimary}
              >
                <Upload className="h-5 w-5" />
                <span>{t("uploadFile")}</span>
              </Link>
            </div>
          </div>

          {/* Estado de carga */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#ffaf68]" />
              <span className="ml-2 text-[#283618]">Cargando recursos...</span>
            </div>
          )}

          {/* Mensaje de error */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
                <button
                  onClick={loadVisualResources}
                  className="ml-auto text-red-800 hover:text-red-900 underline"
                >
                  Reintentar
                </button>
              </div>
            </div>
          )}

          {/* Grilla de recursos */}
          {!loading && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    <Image
                      src={resource.file_url}
                      alt={resource.file_name}
                      fill
                      className="object-contain group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/img/imageNotFound.png";
                      }}
                    />
                    {/* Overlay con acciones */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleViewResource(resource)}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        title={t("viewFile")}
                      >
                        <Eye className="h-4 w-4 text-white" />
                      </button>
                      <button
                        onClick={() => handleDownloadResource(resource)}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        title={t("downloadFile")}
                        disabled={downloadingId === resource.id}
                      >
                        {downloadingId === resource.id ? (
                          <Loader2 className="h-4 w-4 text-white animate-spin" />
                        ) : (
                          <Download className="h-4 w-4 text-white" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteResource(resource)}
                        className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                        title={t("deleteFile")}
                      >
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-sm text-[#283618] truncate mb-1">
                      {resource.file_name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {formatFileSize(resource)}
                    </p>

                    {/* Tags */}
                    {getResourceTags(resource).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {getResourceTags(resource)
                          .slice(0, 2)
                          .map((tag) => (
                            <span
                              key={tag}
                              className="px-2 py-1 bg-[#ffaf68]/20 text-[#283618] text-xs rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        {getResourceTags(resource).length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{getResourceTags(resource).length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State - Solo mostrar si no hay carga ni error */}
          {!loading && !error && filteredResources.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#283618] mb-2">
                {searchTerm ? t("noResults") : t("noResources")}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? t("tryDifferentSearch") : t("uploadFirst")}
              </p>
              <Link
                href="/templates/visual-resources/upload"
                className={btnPrimary}
              >
                <Upload className="h-5 w-5" />
                <span>{t("uploadFirstFile")}</span>
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Vista Previa */}
      {showPreviewModal && selectedResource && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleClosePreview}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-medium text-[#283618]">
                  {selectedResource.file_name}
                </h3>
                <p className="text-sm text-gray-500">
                  {selectedResource.file_type} •{" "}
                  {formatFileSize(selectedResource)}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownloadResource(selectedResource)}
                  className="p-2 text-gray-600 hover:text-[#283618] transition-colors"
                  title={t("downloadFile")}
                  disabled={downloadingId === selectedResource.id}
                >
                  {downloadingId === selectedResource.id ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                </button>
                <button
                  onClick={handleClosePreview}
                  className="p-2 text-gray-600 hover:text-[#283618] transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenido del modal */}
            <div className="p-4">
              <div className="flex items-center justify-center bg-gray-50 rounded-lg min-h-[400px]">
                <Image
                  src={selectedResource.file_url}
                  alt={selectedResource.file_name}
                  width={800}
                  height={600}
                  className="max-w-full max-h-[60vh] object-contain"
                  onError={(e) => {
                    e.currentTarget.src = "/assets/img/imageNotFound.png";
                  }}
                />
              </div>

              {/* Información adicional */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-[#283618]">Tipo:</span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {selectedResource.file_type}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-[#283618]">Estado:</span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {selectedResource.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-[#283618]">Acceso:</span>
                  <span className="ml-2 text-gray-600 capitalize">
                    {selectedResource.access_config.access_type}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-[#283618]">Creado:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(
                      selectedResource.log.created_at
                    ).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Tags */}
              {getResourceTags(selectedResource).length > 0 && (
                <div className="mt-4">
                  <span className="font-medium text-[#283618] text-sm">
                    Etiquetas:
                  </span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {getResourceTags(selectedResource).map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 bg-[#ffaf68]/20 text-[#283618] text-sm rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
