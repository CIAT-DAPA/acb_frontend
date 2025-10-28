"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import ItemCard from "../components/ItemCard";
import { container, pageTitle, pageSubtitle, searchField } from "../components/ui";
import { TemplateAPIService } from "../../../services/templateService";
import { CardAPIService } from "../../../services/cardService";
import BulletinAPIService from "../../../services/bulletinService";
import usePermissions from "@/hooks/usePermissions";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";
import { TemplateMaster } from "@/types/template";
import { Card } from "@/types/card";
import { BulletinMaster } from "@/types/bulletin";
import { Loader2, Trash2, X, AlertCircle, FileText, Calendar, User, Search } from "lucide-react";
import { useToast } from "../../../components/Toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";

type TabKey = "templates" | "bulletins" | "cards";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const { can } = usePermissions();

  // Determine which tabs the user can read
  const canReadTemplates = can(PERMISSION_ACTIONS.Read, MODULES.TEMPLATE_MANAGEMENT);
  const canReadBulletins = can(PERMISSION_ACTIONS.Read, MODULES.BULLETINS_COMPOSER);
  const canReadCards = can(PERMISSION_ACTIONS.Read, MODULES.CARD_MANAGEMENT);

  // Ensure the active tab is the first available one for the user
  const [active, setActive] = useState<TabKey>(() => {
    if (canReadTemplates) return "templates";
    if (canReadBulletins) return "bulletins";
    if (canReadCards) return "cards";
    return "templates"; // fallback
  });

  // If permissions change at runtime, ensure active tab remains valid
  useEffect(() => {
    if (active === "templates" && !canReadTemplates) {
      if (canReadBulletins) setActive("bulletins");
      else if (canReadCards) setActive("cards");
    }
    if (active === "bulletins" && !canReadBulletins) {
      if (canReadTemplates) setActive("templates");
      else if (canReadCards) setActive("cards");
    }
    if (active === "cards" && !canReadCards) {
      if (canReadTemplates) setActive("templates");
      else if (canReadBulletins) setActive("bulletins");
    }
  }, [canReadTemplates, canReadBulletins, canReadCards, active]);

  const [templates, setTemplates] = useState<TemplateMaster[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [bulletins, setBulletins] = useState<BulletinMaster[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load all data once on mount to avoid refetching on tab change
  useEffect(() => {
    const loadAll = async () => {
      setError(null);
      setLoading(true);
      try {
        const [tplRes, cardRes, bullRes] = await Promise.all([
          TemplateAPIService.getTemplates(),
          CardAPIService.getCards(),
          BulletinAPIService.getBulletins(),
        ]);

        if (tplRes.success && tplRes.data) setTemplates(tplRes.data as TemplateMaster[]);
        if (cardRes.success && cardRes.data) setCards(cardRes.data as Card[]);
        if (bullRes.success && bullRes.data) setBulletins(bullRes.data as BulletinMaster[]);
      } catch (err) {
        setError("Error cargando datos");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

  // search state (client-side filter)
  const [searchTerm, setSearchTerm] = useState("");

  // modal / delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: TabKey;
    name?: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) return templates;
    const term = searchTerm.toLowerCase();
    return templates.filter((tpl) => tpl.template_name.toLowerCase().includes(term));
  }, [templates, searchTerm]);

  const filteredCards = useMemo(() => {
    if (!searchTerm.trim()) return cards;
    const term = searchTerm.toLowerCase();
    return cards.filter((c) => (c.card_name || "").toLowerCase().includes(term));
  }, [cards, searchTerm]);

  const filteredBulletins = useMemo(() => {
    if (!searchTerm.trim()) return bulletins;
    const term = searchTerm.toLowerCase();
    return bulletins.filter((b) => (b.bulletin_name || "").toLowerCase().includes(term));
  }, [bulletins, searchTerm]);

  const handleDelete = (id: string, type: TabKey, name?: string) => {
    setItemToDelete({ id, type, name });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const { id, type } = itemToDelete;
      let res: any = null;
      if (type === "templates") {
        res = await TemplateAPIService.updateTemplate(id, { status: "archived" });
      } else if (type === "cards") {
        res = await CardAPIService.updateCard(id, { status: "archived" });
      } else if (type === "bulletins") {
        // BulletinStatus type doesn't include "archived" in typings; use an any-typed payload to avoid type error
        const payload: any = { status: "archived" };
        res = await BulletinAPIService.updateBulletin(id, payload);
      }

      if (res && res.success) {
        showToast?.(t("deleteSuccess", { name: itemToDelete.name || id }), "success", 3000);
        // remove locally
        if (type === "templates") setTemplates((prev) => prev.filter((p) => p._id !== id));
        if (type === "cards") setCards((prev) => prev.filter((c) => c._id !== id));
        if (type === "bulletins") setBulletins((prev) => prev.filter((b) => b._id !== id));
      } else {
        throw new Error(res?.message || "Error al archivar");
      }
    } catch (err: any) {
      showToast?.(t("deleteError", { name: itemToDelete?.name || "" , error: err?.message || "" }), "error", 5000);
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

    // Función para mostrar el modal de confirmación de eliminación
    /* const handleDeleteTemplate = (template: TemplateMaster) => {
      setTemplateToDelete(template);
      setShowDeleteModal(true);
    }; */

  return (
    <ProtectedRoute>
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
      <section className='bg-[#fefae0] py-6 border-b'>
        <div className={container}>
            <div className='mt-4 flex gap-2'>
              {canReadTemplates && (
                <button
                  onClick={() => setActive('templates')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    active === 'templates'
                      ? 'bg-[#606c38] text-white'
                      : 'bg-white text-[#283618] border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t('templates')}
                </button>
              )}

              {canReadBulletins && (
                <button
                  onClick={() => setActive('bulletins')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    active === 'bulletins'
                      ? 'bg-[#606c38] text-white'
                      : 'bg-white text-[#283618] border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t('bulletins')}
                </button>
              )}

              {canReadCards && (
                <button
                  onClick={() => setActive('cards')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    active === 'cards'
                      ? 'bg-[#606c38] text-white'
                      : 'bg-white text-[#283618] border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {t('cards')}
                </button>
              )}
            </div>
        </div>
      </section>

      <div className={`${container} py-8`}>
        {loading && <p>{t('loading')}</p>}
        {error && <p className='text-red-600'>{error}</p>}

        <div className="flex items-center justify-between mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={searchField}
            />
          </div>
        </div>

        {!loading && active === 'templates' && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredTemplates
              .filter((template, index, array) => template._id && array.findIndex((t) => t._id === template._id) === index)
              .map((template) => {
                const allowedGroups = template.access_config?.allowed_groups || [];
                const canEdit = can(PERMISSION_ACTIONS.Update, MODULES.TEMPLATE_MANAGEMENT, allowedGroups);
                const canDelete = can(PERMISSION_ACTIONS.Delete, MODULES.TEMPLATE_MANAGEMENT, allowedGroups);

                return (
                  <ItemCard
                    key={template._id}
                    type='template'
                    id={template._id!}
                    name={template.template_name}
                    author={(template.log.updater_first_name || template.log.creator_first_name || '') + ' ' + (template.log.updater_last_name || template.log.creator_last_name || '')}
                    lastModified={template.log.updated_at ? new Date(template.log.updated_at).toLocaleDateString() : (template.log.created_at ? new Date(template.log.created_at).toLocaleDateString() : '')}
                      thumbnailImages={template.thumbnail_images}
                    editBtn={canEdit}
                    onEdit={canEdit ? () => (window.location.href = `/templates/${template._id}/edit`) : undefined}
                    deleteBtn={canDelete}
                    onDelete={canDelete ? () => handleDelete(template._id!, 'templates', template.template_name) : undefined}
                    isDeleting={isDeleting && itemToDelete?.id === template._id}
                  />
                );
              })}
          </div>
        )}

        {!loading && active === 'bulletins' && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredBulletins.map((b) => (
                <ItemCard
                  key={b._id}
                  type='template'
                  id={b._id!}
                  name={b.bulletin_name || 'Bulletin'}
                  author={b.log.creator_first_name || ''}
                  lastModified={b.log.updated_at ? new Date(b.log.updated_at).toLocaleDateString() : (b.log.created_at ? new Date(b.log.created_at).toLocaleDateString() : '')}
                  thumbnailImages={[]}
                  editBtn={can(PERMISSION_ACTIONS.Update, MODULES.BULLETINS_COMPOSER, b.access_config?.allowed_groups || [])}
                  onEdit={can(PERMISSION_ACTIONS.Update, MODULES.BULLETINS_COMPOSER, b.access_config?.allowed_groups || []) ? () => (window.location.href = `/bulletins/${b._id}/edit`) : undefined}
                  deleteBtn={can(PERMISSION_ACTIONS.Delete, MODULES.BULLETINS_COMPOSER, b.access_config?.allowed_groups || [])}
                  onDelete={can(PERMISSION_ACTIONS.Delete, MODULES.BULLETINS_COMPOSER, b.access_config?.allowed_groups || []) ? () => handleDelete(b._id!, 'bulletins', b.bulletin_name) : undefined}
                  isDeleting={isDeleting && itemToDelete?.id === b._id}
                />
              ))}
          </div>
        )}

        {!loading && active === 'cards' && (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {filteredCards.map((c) => (
                <ItemCard
                  key={c._id}
                  type='card'
                  id={c._id!}
                  name={c.card_name || 'Card'}
                  author={c.log.creator_first_name || ''}
                  lastModified={c.log.updated_at ? new Date(c.log.updated_at).toLocaleDateString() : (c.log.created_at ? new Date(c.log.created_at).toLocaleDateString() : '')}
                  thumbnailImages={c.content?.background_url ? [c.content.background_url] : []}
                  editBtn={can(PERMISSION_ACTIONS.Update, MODULES.CARD_MANAGEMENT, c.access_config?.allowed_groups || [])}
                  onEdit={can(PERMISSION_ACTIONS.Update, MODULES.CARD_MANAGEMENT, c.access_config?.allowed_groups || []) ? () => (window.location.href = `/cards/${c._id}/edit`) : undefined}
                  deleteBtn={can(PERMISSION_ACTIONS.Delete, MODULES.CARD_MANAGEMENT, c.access_config?.allowed_groups || [])}
                  onDelete={can(PERMISSION_ACTIONS.Delete, MODULES.CARD_MANAGEMENT, c.access_config?.allowed_groups || []) ? () => handleDelete(c._id!, 'cards', c.card_name) : undefined}
                  isDeleting={isDeleting && itemToDelete?.id === c._id}
                />
              ))}
          </div>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowDeleteModal(false)}>
          <div className="bg-white rounded-lg max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-[#283618]">{t('deleteConfirmTitle')}</h3>
              </div>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 text-[#283618]/80 hover:text-[#283618] transition-colors cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-[#ffaf68]/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-8 w-8 text-[#ffaf68]" />
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-[#283618] mb-3">{t('deleteConfirmMessage', { name: itemToDelete.name || '' })}</p>
                </div>
              </div>

              <div className="flex gap-3 justify-end p-4 border-t bg-gray-50">
                <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 bg-white border rounded" disabled={isDeleting}>{t('cancelDelete')}</button>
                <button onClick={handleConfirmDelete} disabled={isDeleting} className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                  {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  <span>{isDeleting ? t('deleting') : t('confirmDeleteBtn')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
    </ProtectedRoute>
  );
}
