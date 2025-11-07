"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  Search,
  Image as ImageIcon,
  Trash2,
  Loader2,
  AlertCircle,
  Save,
  X,
} from "lucide-react";
import Image from "next/image";
import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import ItemCard from "../../components/ItemCard";
import {
  container,
  btnPrimary,
  searchField,
  pageTitle,
  pageSubtitle,
  inputField,
  btnOutlineSecondary,
} from "../../components/ui";
import { VisualResource } from "@/types/visualResource";
import { VisualResourcesService } from "@/services/visualResourcesService";
import { useToast } from "../../../../components/Toast";

export default function VisualResources() {
  const t = useTranslations("VisualResources");
  const { showToast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"all" | "image" | "icon">("all");
  const [allResources, setAllResources] = useState<VisualResource[]>([]); // Todos los recursos originales
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] =
    useState<VisualResource | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [resourceToDelete, setResourceToDelete] =
    useState<VisualResource | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para la edición
  const [editForm, setEditForm] = useState({
    file_name: "",
    file_type: "image" as "image" | "icon",
    access_type: "public" as "public" | "private" | "restricted",
    group_name: "",
  });
  const [isEditing, setIsEditing] = useState(false);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);

  // Cargar recursos visuales al montar el componente (solo una vez)
  useEffect(() => {
    loadVisualResources();
    loadAvailableGroups();
  }, []);

  // Efecto para cerrar los modales con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (showEditModal) {
          handleCloseEdit();
        } else if (showDeleteModal && !isDeleting) {
          handleCloseDeleteModal();
        }
      }
    };

    if (showEditModal || showDeleteModal) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevenir scroll del fondo
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // Restaurar scroll
    };
  }, [showEditModal, showDeleteModal, isDeleting]);

  // Función para cargar recursos visuales desde el servicio
  const loadVisualResources = async () => {
    setLoading(true);
    setError(null);

    try {
      const allResourcesResponse =
        await VisualResourcesService.getVisualResourcesByStatus("active");

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

  // Función para cargar grupos disponibles
  const loadAvailableGroups = async () => {
    try {
      const response = await VisualResourcesService.getAvailableGroups();
      if (response.success && response.data) {
        setAvailableGroups(response.data);
      }
    } catch (error) {
      console.error("Error loading available groups:", error);
      // Fallback: usar grupos de ejemplo si el endpoint no está disponible
      setAvailableGroups(["Admin", "Research", "Public"]);
    }
  };

  // Función para abrir el modal de edición
  const handleEditResource = (resource: VisualResource) => {
    setSelectedResource(resource);
    setEditForm({
      file_name: resource.file_name,
      file_type: resource.file_type,
      access_type: resource.access_config.access_type,
      group_name: resource.access_config.allowed_groups?.[0] || "",
    });
    setShowEditModal(true);
  };

  // Función para cerrar el modal de edición
  const handleCloseEdit = () => {
    setSelectedResource(null);
    setShowEditModal(false);
    setIsEditing(false);
    setEditForm({
      file_name: "",
      file_type: "image",
      access_type: "public",
      group_name: "",
    });
  };

  // Función para guardar los cambios
  const handleSaveChanges = async () => {
    if (!selectedResource) return;

    setIsEditing(true);
    setError(null);

    try {
      const updateData = {
        file_name: editForm.file_name,
        file_type: editForm.file_type,
        status: "active" as const,
        access_config: {
          access_type: editForm.access_type,
          allowed_groups:
            editForm.access_type === "restricted" && editForm.group_name
              ? [editForm.group_name]
              : [],
        },
      };

      const response = await VisualResourcesService.updateVisualResource(
        selectedResource.id,
        updateData
      );

      if (response.success) {
        // Actualizar el recurso en la lista local
        setAllResources((prevResources: VisualResource[]) =>
          prevResources.map((r: VisualResource) =>
            r.id === selectedResource.id ? { ...r, ...updateData } : r
          )
        );

        handleCloseEdit();
        showToast(t("editSuccess"), "success");
      } else {
        throw new Error(response.message || "Error al actualizar el recurso");
      }
    } catch (error) {
      console.error("Error updating resource:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("editError");
      setError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsEditing(false);
    }
  };

  // Función para mostrar el modal de confirmación de eliminación
  const handleDeleteResource = (resource: VisualResource) => {
    setResourceToDelete(resource);
    setShowDeleteModal(true);
  };

  // Función para cerrar el modal de eliminación
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setResourceToDelete(null);
    setIsDeleting(false);
  };

  // Función para confirmar la eliminación
  const handleConfirmDelete = async () => {
    if (!resourceToDelete) return;

    try {
      setIsDeleting(true);
      await VisualResourcesService.deleteVisualResource(resourceToDelete.id);

      // Remover el recurso de la lista local
      setAllResources((prevResources: VisualResource[]) =>
        prevResources.filter(
          (r: VisualResource) => r.id !== resourceToDelete.id
        )
      );

      handleCloseDeleteModal();
      showToast(t("deleteSuccess"), "success");
    } catch (error) {
      console.error("Error al eliminar el recurso:", error);
      const errorMessage =
        error instanceof Error ? error.message : t("deleteError");
      setError(errorMessage);
      showToast(errorMessage, "error");
      setIsDeleting(false);
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
                    className="flex items-center gap-2 text-[#283618]/80 hover:text-[#283618] transition-colors"
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
          <div className="flex flex-col sm:flex-row gap-2 mb-8">
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
                className={`${inputField} cursor-pointer`}
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
                <ItemCard
                  key={resource.id}
                  type="visual-resource"
                  id={resource.id}
                  name={resource.file_name}
                  image={resource.file_url}
                  fileType={resource.file_type}
                  author={
                    resource.log.updater_first_name +
                      " " +
                      resource.log.updater_last_name ||
                    resource.log.creator_first_name +
                      " " +
                      resource.log.creator_last_name
                  }
                  tags={getResourceTags(resource)}
                  editBtn={true}
                  onEdit={() => handleEditResource(resource)}
                  downloadBtn={true}
                  onDownload={() => handleDownloadResource(resource)}
                  deleteBtn={true}
                  onDelete={() => handleDeleteResource(resource)}
                  isDownloading={downloadingId === resource.id}
                />
              ))}
            </div>
          )}

          {/* Empty State - Solo mostrar si no hay carga ni error */}
          {!loading && !error && filteredResources.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-[#283618]/80 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#283618] mb-2">
                {searchTerm ? t("noResults") : t("noResources")}
              </h3>
              <p className="text-[#283618]/80 mb-6">
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

      {/* Modal de Edición */}
      {showEditModal && selectedResource && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleCloseEdit}
        >
          <div
            className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-medium text-[#283618]">
                  {t("editResource")}
                </h3>
                <p className="text-sm text-[#283618]/80">
                  {selectedResource.file_type} • ID: {selectedResource.id}
                </p>
              </div>
              <button
                onClick={handleCloseEdit}
                className="p-2 text-[#283618]/80 hover:text-[#283618] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Vista previa del recurso */}
                <div>
                  <h4 className="text-md font-medium text-[#283618] mb-3">
                    {t("preview")}
                  </h4>
                  <div className="flex items-center justify-center bg-gray-50 rounded-lg min-h-[300px] p-4">
                    <Image
                      src={selectedResource.file_url}
                      alt={selectedResource.file_name}
                      width={400}
                      height={300}
                      className="w-auto h-auto max-w-full max-h-[280px] object-contain"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/img/imageNotFound.png";
                      }}
                    />
                  </div>
                </div>

                {/* Formulario de edición */}
                <div>
                  <h4 className="text-md font-medium text-[#283618] mb-3">
                    {t("resourceInfo")}
                  </h4>

                  <div className="space-y-4">
                    {/* Nombre del archivo */}
                    <div>
                      <label className="block text-sm font-medium text-[#283618] mb-2">
                        {t("fileName")}
                      </label>
                      <input
                        type="text"
                        value={editForm.file_name}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            file_name: e.target.value,
                          }))
                        }
                        className={inputField}
                        placeholder={t("fileNamePlaceholder")}
                      />
                    </div>

                    {/* Tipo de archivo */}
                    <div>
                      <label className="block text-sm font-medium text-[#283618] mb-2">
                        {t("fileType")}
                      </label>
                      <select
                        value={editForm.file_type}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            file_type: e.target.value as "image" | "icon",
                          }))
                        }
                        className={`${inputField} cursor-pointer`}
                      >
                        <option value="image">{t("image")}</option>
                        <option value="icon">{t("icon")}</option>
                      </select>
                    </div>

                    {/* Tipo de acceso */}
                    <div>
                      <label className="block text-sm font-medium text-[#283618] mb-2">
                        {t("accessTypeLabel")}
                      </label>
                      <select
                        value={editForm.access_type}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            access_type: e.target.value as
                              | "public"
                              | "private"
                              | "restricted",
                          }))
                        }
                        className={`${inputField} cursor-pointer`}
                      >
                        <option value="public">{t("publicAccess")}</option>
                        <option value="private">{t("privateAccess")}</option>
                        <option value="restricted">
                          {t("restrictedAccess")}
                        </option>
                      </select>
                    </div>

                    {/* Selector de grupo (solo si es restringido) */}
                    {editForm.access_type === "restricted" && (
                      <div>
                        <label className="block text-sm font-medium text-[#283618] mb-2">
                          {t("allowedGroup")}
                        </label>
                        <select
                          value={editForm.group_name}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              group_name: e.target.value,
                            }))
                          }
                          className={inputField}
                        >
                          <option value="">{t("selectGroup")}</option>
                          {availableGroups.map((group) => (
                            <option key={group} value={group}>
                              {group}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mensajes de error */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex gap-4 justify-end mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCloseEdit}
                  className={btnOutlineSecondary}
                  disabled={isEditing}
                >
                  {t("cancelEdit")}
                </button>
                <button
                  onClick={handleSaveChanges}
                  disabled={isEditing || !editForm.file_name.trim()}
                  className={`${btnPrimary} ${
                    isEditing || !editForm.file_name.trim()
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isEditing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>{t("saving")}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>{t("saveChanges")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && resourceToDelete && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={handleCloseDeleteModal}
        >
          <div
            className="bg-white rounded-lg max-w-md w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-[#283618]">
                  {t("deleteConfirmTitle")}
                </h3>
              </div>
              <button
                onClick={handleCloseDeleteModal}
                className="p-2 text-[#283618]/80 hover:text-[#283618] transition-colors cursor-pointer"
                disabled={isDeleting}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="p-6">
              <div className="flex gap-4">
                {/* Vista previa pequeña del recurso */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                    <Image
                      src={resourceToDelete.file_url}
                      alt={resourceToDelete.file_name}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = "/assets/img/imageNotFound.png";
                      }}
                    />
                  </div>
                </div>

                {/* Mensaje de confirmación */}
                <div className="flex-1">
                  <p className="text-[#283618] mb-2">
                    {t("deleteConfirmMessage", {
                      fileName: resourceToDelete.file_name,
                    })}
                  </p>
                  <div className="text-sm text-[#283618]/70">
                    <p>Tipo: {resourceToDelete.file_type}</p>
                    <p>ID: {resourceToDelete.id}</p>
                  </div>
                </div>
              </div>

              {/* Mensajes de error */}
              {error && (
                <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5" />
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className="flex gap-3 justify-end p-4 border-t bg-gray-50">
              <button
                onClick={handleCloseDeleteModal}
                className={btnOutlineSecondary}
                disabled={isDeleting}
              >
                {t("cancelDelete")}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  isDeleting ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{t("deleting")}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>{t("confirmDelete")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </ProtectedRoute>
  );
}
