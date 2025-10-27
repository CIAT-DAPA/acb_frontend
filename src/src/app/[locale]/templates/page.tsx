"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Plus,
  Search,
  Loader2,
  Images,
  Trash2,
  X,
  AlertCircle,
  FileText,
  Calendar,
  User,
} from "lucide-react";
import Image from "next/image";
import ItemCard from "../components/ItemCard";
import { TemplateAPIService } from "../../../services/templateService";
import { ProtectedRoute } from "../../../components/ProtectedRoute";
import usePermissions from "@/hooks/usePermissions";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";
import { useToast } from "../../../components/Toast";
import {
  container,
  btnPrimary,
  btnOutlineSecondary,
  searchField,
  pageTitle,
  pageSubtitle,
} from "../components/ui";
import { TemplateMaster } from "@/types/template";
import { PreviewModal } from "../components/PreviewModal";

export default function Templates() {
  const t = useTranslations("Templates");
  const { showToast } = useToast();
  const { can } = usePermissions();
  const params = useParams();
  const locale = params.locale as string;
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState<TemplateMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] =
    useState<TemplateMaster | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Estados para el modal de preview
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

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
      const templatesActive = response.data.filter(
        (template) => template.status === "active"
      );

      if (response.success) {
        console.log("Fetched templates:", response);
        setTemplates(templatesActive);
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

  // Efecto para cerrar el modal con la tecla Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && showDeleteModal && !isDeleting) {
        handleCloseDeleteModal();
      }
    };

    if (showDeleteModal) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // Prevenir scroll del fondo
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset"; // Restaurar scroll
    };
  }, [showDeleteModal, isDeleting]);

  // Función para mostrar el modal de confirmación de eliminación
  const handleDeleteTemplate = (template: TemplateMaster) => {
    setTemplateToDelete(template);
    setShowDeleteModal(true);
  };

  // Función para cerrar el modal de eliminación
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setTemplateToDelete(null);
    setIsDeleting(false);
  };

  // Función para confirmar la eliminación (archivar)
  const handleConfirmDelete = async () => {
    if (!templateToDelete) return;

    setIsDeleting(true);

    try {
      // Actualizar el estado del template a "archived"
      const response = await TemplateAPIService.updateTemplate(
        templateToDelete._id!,
        {
          status: "archived",
        }
      );

      if (response.success) {
        showToast(
          t("deleteSuccess", { name: templateToDelete.template_name }),
          "success",
          3000
        );
        // Recargar la lista de templates
        loadTemplates(searchTerm);
        handleCloseDeleteModal();
      } else {
        throw new Error(response.message || "Error al archivar la plantilla");
      }
    } catch (error) {
      console.error("Error archiving template:", error);
      showToast(
        t("deleteError", {
          name: templateToDelete.template_name,
          error: error instanceof Error ? error.message : "Error desconocido",
        }),
        "error",
        5000
      );
      setIsDeleting(false);
    }
  };

  // Función para manejar el preview de un template
  const handlePreviewTemplate = (templateId: string) => {
    setPreviewTemplateId(templateId);
    setShowPreviewModal(true);
  };

  // Función para cerrar el modal de preview
  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreviewTemplateId(null);
  };

  return (
    <ProtectedRoute
      requiredPermission={{
        action: PERMISSION_ACTIONS.Read,
        module: MODULES.TEMPLATE_MANAGEMENT,
      }}
    >
      <main>
        <section className='desk-texture desk-texture-strong bg-[#fefae0] py-10'>
          <div className={container}>
            <div className='flex justify-between items-center'>
              <div>
                <h1 className={pageTitle}>{t('title')}</h1>
                <p className={pageSubtitle}>{t('subtitle')}</p>
              </div>
              <div className='hidden lg:block rotate-12'>
                <Image
                  src='/assets/img/bol1.jpg'
                  alt='Templates dashboard'
                  width={150}
                  height={319}
                  className='object-contain drop-shadow-lg'
                />
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <div className={`${container} py-8`}>
          {/* Search Bar y Botones */}
          <div className='flex gap-4 mb-8'>
            {/* Search Bar */}
            <div className='relative flex-1'>
              <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#283618]/50' />
              <input
                type='text'
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={searchField}
              />
            </div>

            {/* Botón Recursos Visuales */}
            {can(PERMISSION_ACTIONS.Create, MODULES.TEMPLATE_MANAGEMENT) && (
              <>
                <Link
                  href='/templates/visual-resources'
                  className='flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#ffaf68] text-[#283618] rounded-lg hover:bg-[#ffaf68]/10 transition-colors whitespace-nowrap'
                >
                  <Images className='h-5 w-5' />
                  <span>{t('visualResources')}</span>
                </Link>

                {/* Botón Crear (condicionado por permiso) */}
                <Link
                  href='/templates/create'
                  className={`${btnPrimary} whitespace-nowrap`}
                >
                  <Plus className='h-5 w-5' />
                  <span>{t('createNew')}</span>
                </Link>
              </>
            )}
          </div>

          {/* Loading State */}
          {loading && (
            <div className='flex items-center justify-center py-12'>
              <Loader2 className='h-8 w-8 animate-spin text-[#ffaf68]' />
              <span className='ml-2 text-[#283618]/60'>{t('loading')}</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className='text-center py-12'>
              <p className='text-red-600 mb-4'>{error}</p>
              <button
                onClick={() => loadTemplates(searchTerm)}
                className={btnPrimary}
              >
                {t('retry')}
              </button>
            </div>
          )}

          {/* Templates Grid */}
          {!loading && !error && (
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
              {templates
                .filter((template, index, array) => {
                  // Filter out templates without valid _id and remove duplicates
                  return (
                    template._id &&
                    array.findIndex((t) => t._id === template._id) === index
                  );
                })
                .map((template, index) => {
                  const allowedGroups =
                    template.access_config?.allowed_groups || [];
                  const canEdit = can(
                    PERMISSION_ACTIONS.Update,
                    MODULES.TEMPLATE_MANAGEMENT,
                    allowedGroups,
                  );
                  const canDelete = can(
                    PERMISSION_ACTIONS.Delete,
                    MODULES.TEMPLATE_MANAGEMENT,
                    allowedGroups,
                  );

                  return (
                    <ItemCard
                      key={template._id || `template-${index}`}
                      type='template'
                      id={template._id!}
                      name={template.template_name}
                      author={
                        template.log.updater_first_name +
                          ' ' +
                          template.log.updater_last_name ||
                        template.log.creator_first_name +
                          ' ' +
                          template.log.creator_last_name
                      }
                      lastModified={new Date(
                        template.log.updated_at!,
                      ).toLocaleDateString()}
                      thumbnailImages={template.thumbnail_images}
                      previewBtn={true}
                      onPreview={() => handlePreviewTemplate(template._id!)}
                      editBtn={canEdit}
                      onEdit={
                        canEdit
                          ? () =>
                              (window.location.href = `/templates/${template._id}/edit`)
                          : undefined
                      }
                      deleteBtn={canDelete}
                      onDelete={
                        canDelete
                          ? () => handleDeleteTemplate(template)
                          : undefined
                      }
                      isDeleting={
                        isDeleting && templateToDelete?._id === template._id
                      }
                    />
                  );
                })}
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && templates.length === 0 && (
            <div className='text-center py-12'>
              <p className='text-[#283618]/60 mb-4'>{t('noResults')}</p>
              {can(PERMISSION_ACTIONS.Create, MODULES.TEMPLATE_MANAGEMENT) &&
                <Link href='/templates/create' className={btnPrimary}>
                  {t('createFirst')}
                </Link>
              }
            </div>
          )}
        </div>
      </main>

      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && templateToDelete && (
        <div
          className='fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4'
          onClick={handleCloseDeleteModal}
        >
          <div
            className='bg-white rounded-lg max-w-md w-full mx-4'
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header del modal */}
            <div className='flex items-center justify-between p-4 border-b'>
              <div className='flex items-center gap-3'>
                <div className='p-2 bg-red-100 rounded-full'>
                  <Trash2 className='h-5 w-5 text-red-600' />
                </div>
                <h3 className='text-lg font-medium text-[#283618]'>
                  {t('deleteConfirmTitle')}
                </h3>
              </div>
              <button
                onClick={handleCloseDeleteModal}
                className='p-2 text-[#283618]/80 hover:text-[#283618] transition-colors cursor-pointer'
                disabled={isDeleting}
              >
                <X className='h-5 w-5' />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className='p-6'>
              <div className='flex gap-4'>
                {/* Icono del template */}
                <div className='flex-shrink-0'>
                  <div className='w-16 h-16 bg-[#ffaf68]/20 rounded-lg flex items-center justify-center'>
                    <FileText className='h-8 w-8 text-[#ffaf68]' />
                  </div>
                </div>

                {/* Mensaje de confirmación */}
                <div className='flex-1'>
                  <p className='text-[#283618] mb-3'>
                    {t('deleteConfirmMessage', {
                      name: templateToDelete.template_name,
                    })}
                  </p>
                  <div className='text-sm text-[#283618]/70 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <User className='h-3 w-3' />
                      <span>
                        {t('by')}{' '}
                        {templateToDelete.log.updater_first_name +
                          ' ' +
                          templateToDelete.log.updater_last_name ||
                          templateToDelete.log.creator_first_name +
                            ' ' +
                            templateToDelete.log.creator_last_name}
                      </span>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Calendar className='h-3 w-3' />
                      <span>
                        {t('lastModified')}:{' '}
                        {new Date(
                          templateToDelete.log.updated_at!,
                        ).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mensajes de error */}
              {error && (
                <div className='mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg'>
                  <div className='flex items-center gap-2'>
                    <AlertCircle className='h-5 w-5' />
                    <p>{error}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Botones de acción */}
            <div className='flex gap-3 justify-end p-4 border-t bg-gray-50'>
              <button
                onClick={handleCloseDeleteModal}
                className={btnOutlineSecondary}
                disabled={isDeleting}
              >
                {t('cancelDelete')}
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                  isDeleting
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer'
                }`}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className='h-4 w-4 animate-spin' />
                    <span>{t('deleting')}</span>
                  </>
                ) : (
                  <>
                    <Trash2 className='h-4 w-4' />
                    <span>{t('confirmDeleteBtn')}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Preview */}
      {showPreviewModal && previewTemplateId && (
        <PreviewModal
          isOpen={showPreviewModal}
          onClose={handleClosePreview}
          contentType="template"
          contentId={previewTemplateId}
          locale={locale}
          showActions={true}
          actions={{
            onEdit: (id) => (window.location.href = `/templates/${id}/edit`),
            onDelete: (id) => {
              const template = templates.find((t) => t._id === id);
              if (template) handleDeleteTemplate(template);
            },
          }}
        />
      )}
    </ProtectedRoute>
  );
}
