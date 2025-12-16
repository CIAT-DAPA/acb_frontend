"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ItemCard from "../components/ItemCard";
import TableView from "../components/TableView";
import {
  container,
  pageTitle,
  pageSubtitle,
  searchField,
  btnPrimary,
} from "../components/ui";
import { TemplateAPIService } from "../../../services/templateService";
import { CardAPIService } from "../../../services/cardService";
import BulletinAPIService from "../../../services/bulletinService";
import { EnumAPIService } from "../../../services/enumService";
import usePermissions from "@/hooks/usePermissions";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";
import { TemplateMaster } from "@/types/template";
import { Card } from "@/types/card";
import { BulletinMaster } from "@/types/bulletin";
import {
  Loader2,
  Trash2,
  X,
  AlertCircle,
  FileText,
  Calendar,
  Search,
  CalendarDays,
  ArrowUpDown,
  BarChart3,
  Grid3x3,
  List,
} from "lucide-react";
import { useToast } from "../../../components/Toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { PreviewModal } from "../components/PreviewModal";
import { ContentType } from "@/types/content";

type TabKey = "templates" | "bulletins" | "cards";

export default function DashboardPage() {
  const t = useTranslations("Dashboard");
  const { can } = usePermissions();

  // Determine which tabs the user can read
  const canReadTemplates = can(
    PERMISSION_ACTIONS.Read,
    MODULES.TEMPLATE_MANAGEMENT
  );
  const canReadBulletins = can(
    PERMISSION_ACTIONS.Read,
    MODULES.BULLETINS_COMPOSER
  );
  const canReadCards = can(PERMISSION_ACTIONS.Read, MODULES.CARD_MANAGEMENT);

  // Determine first available tab based on permissions
  const getFirstAvailableTab = (): TabKey => {
    if (canReadBulletins) return "bulletins";
    if (canReadTemplates) return "templates";
    if (canReadCards) return "cards";
    return "bulletins"; // ultimate fallback
  };

  const getFirstAvailableContentType = (): ContentType => {
    if (canReadBulletins) return "bulletin";
    if (canReadTemplates) return "template";
    if (canReadCards) return "card";
    return "bulletin"; // ultimate fallback
  };

  // Ensure the active tab is the first available one for the user
  const [active, setActive] = useState<TabKey>(getFirstAvailableTab());
  const [typePreview, setTypePreview] = useState<ContentType>(
    getFirstAvailableContentType()
  );

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

  const router = useRouter();
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<TemplateMaster[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [bulletins, setBulletins] = useState<BulletinMaster[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status enums from API
  const [bulletinStatuses, setBulletinStatuses] = useState<string[]>([]);
  const [templateStatuses, setTemplateStatuses] = useState<string[]>([]);
  const [cardStatuses, setCardStatuses] = useState<string[]>([]);

  // Status filters (empty array = "All")
  const [bulletinStatusFilter, setBulletinStatusFilter] = useState<string[]>(
    []
  );
  const [templateStatusFilter, setTemplateStatusFilter] = useState<string[]>(
    []
  );
  const [cardStatusFilter, setCardStatusFilter] = useState<string[]>([]);

  // Date filters
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");

  // Sort options
  type SortOption = "name-asc" | "name-desc" | "date-newest" | "date-oldest";
  const [sortBy, setSortBy] = useState<SortOption>("date-newest");

  // View mode (grid or table)
  type ViewMode = "grid" | "table";
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Selection for bulk actions
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewId, setPreview] = useState<string | null>(null);

  // Load status enums from API
  useEffect(() => {
    const loadEnums = async () => {
      try {
        const [bulletinRes, templateRes, cardRes] = await Promise.all([
          EnumAPIService.getBulletinStatuses(),
          EnumAPIService.getTemplateStatuses(),
          EnumAPIService.getCardStatuses(),
        ]);

        setBulletinStatuses(bulletinRes.map((e) => e.value));
        setTemplateStatuses(templateRes.map((e) => e.value));
        setCardStatuses(cardRes.map((e) => e.value));
      } catch (err) {
        console.error("Error loading enums:", err);
        // Fallbacks are handled by the service itself
      }
    };

    loadEnums();
  }, []);

  // Load all data once on mount to avoid refetching on tab change
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setError(null);
    setLoading(true);
    try {
      const [tplRes, cardRes, bullRes] = await Promise.all([
        TemplateAPIService.getTemplates(),
        CardAPIService.getCards(),
        BulletinAPIService.getBulletins(),
      ]);

      // Validar respuestas y detectar errores
      const errors: string[] = [];

      if (tplRes.success && tplRes.data) {
        setTemplates(tplRes.data as TemplateMaster[]);
      } else {
        errors.push(`Templates: ${tplRes.message || "Error desconocido"}`);
      }

      if (cardRes.success && cardRes.data) {
        setCards(cardRes.data as Card[]);
      } else {
        errors.push(`Cards: ${cardRes.message || "Error desconocido"}`);
      }

      if (bullRes.success && bullRes.data) {
        setBulletins(bullRes.data as BulletinMaster[]);
      } else {
        errors.push(`Bulletins: ${bullRes.message || "Error desconocido"}`);
      }

      // Si hay errores, mostrarlos
      if (errors.length > 0) {
        setError(errors.join(" | "));
      }
    } catch (err: any) {
      console.error("Error loading data:", err);
      setError(err?.message || "Error de conexión al cargar los datos");
    } finally {
      setLoading(false);
    }
  };

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

  const filteredTemplates = useMemo(() => {
    let filtered = templates;

    // Apply status filter (only if not empty = not "All")
    if (templateStatusFilter.length > 0) {
      filtered = filtered.filter((tpl) =>
        templateStatusFilter.includes(tpl.status)
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((tpl) =>
        tpl.template_name.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((tpl) => {
        const itemDate = new Date(tpl.log.updated_at || tpl.log.created_at);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;

        if (from && to) {
          return itemDate >= from && itemDate <= to;
        } else if (from) {
          return itemDate >= from;
        } else if (to) {
          return itemDate <= to;
        }
        return true;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.template_name.localeCompare(b.template_name);
        case "name-desc":
          return b.template_name.localeCompare(a.template_name);
        case "date-newest":
          return (
            new Date(b.log.updated_at || b.log.created_at).getTime() -
            new Date(a.log.updated_at || a.log.created_at).getTime()
          );
        case "date-oldest":
          return (
            new Date(a.log.updated_at || a.log.created_at).getTime() -
            new Date(b.log.updated_at || b.log.created_at).getTime()
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [templates, searchTerm, templateStatusFilter, dateFrom, dateTo, sortBy]);

  const filteredCards = useMemo(() => {
    let filtered = cards;

    // Apply status filter (only if not empty = not "All")
    if (cardStatusFilter.length > 0) {
      filtered = filtered.filter((card) =>
        cardStatusFilter.includes(card.status)
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((card) =>
        card.card_name.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((card) => {
        const itemDate = new Date(card.log.updated_at || card.log.created_at);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;

        if (from && to) {
          return itemDate >= from && itemDate <= to;
        } else if (from) {
          return itemDate >= from;
        } else if (to) {
          return itemDate <= to;
        }
        return true;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.card_name.localeCompare(b.card_name);
        case "name-desc":
          return b.card_name.localeCompare(a.card_name);
        case "date-newest":
          return (
            new Date(b.log.updated_at || b.log.created_at).getTime() -
            new Date(a.log.updated_at || a.log.created_at).getTime()
          );
        case "date-oldest":
          return (
            new Date(a.log.updated_at || a.log.created_at).getTime() -
            new Date(b.log.updated_at || b.log.created_at).getTime()
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [cards, searchTerm, cardStatusFilter, dateFrom, dateTo, sortBy]);

  const filteredBulletins = useMemo(() => {
    let filtered = bulletins;

    // Apply status filter (only if not empty = not "All")
    if (bulletinStatusFilter.length > 0) {
      filtered = filtered.filter((bull) =>
        bulletinStatusFilter.includes(bull.status)
      );
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((bull) =>
        bull.bulletin_name.toLowerCase().includes(term)
      );
    }

    // Apply date filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((bull) => {
        const itemDate = new Date(bull.log.updated_at || bull.log.created_at);
        const from = dateFrom ? new Date(dateFrom) : null;
        const to = dateTo ? new Date(dateTo) : null;

        if (from && to) {
          return itemDate >= from && itemDate <= to;
        } else if (from) {
          return itemDate >= from;
        } else if (to) {
          return itemDate <= to;
        }
        return true;
      });
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case "name-asc":
          return a.bulletin_name.localeCompare(b.bulletin_name);
        case "name-desc":
          return b.bulletin_name.localeCompare(a.bulletin_name);
        case "date-newest":
          return (
            new Date(b.log.updated_at || b.log.created_at).getTime() -
            new Date(a.log.updated_at || a.log.created_at).getTime()
          );
        case "date-oldest":
          return (
            new Date(a.log.updated_at || a.log.created_at).getTime() -
            new Date(b.log.updated_at || b.log.created_at).getTime()
          );
        default:
          return 0;
      }
    });

    return sorted;
  }, [bulletins, searchTerm, bulletinStatusFilter, dateFrom, dateTo, sortBy]);

  // Calculate counts for each status (for the pills)
  const templateStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: templates.length };
    templateStatuses.forEach((status) => {
      counts[status] = templates.filter((t) => t.status === status).length;
    });
    return counts;
  }, [templates, templateStatuses]);

  const cardStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: cards.length };
    cardStatuses.forEach((status) => {
      counts[status] = cards.filter((c) => c.status === status).length;
    });
    return counts;
  }, [cards, cardStatuses]);

  const bulletinStatusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: bulletins.length };
    bulletinStatuses.forEach((status) => {
      counts[status] = bulletins.filter((b) => b.status === status).length;
    });
    return counts;
  }, [bulletins, bulletinStatuses]);

  // Calculate statistics for current active tab
  const currentStats = useMemo(() => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    let total = 0;
    let thisWeek = 0;
    let pending = 0;

    if (active === "bulletins") {
      total = bulletins.length;
      thisWeek = bulletins.filter((b) => {
        const date = new Date(b.log.created_at);
        return date >= oneWeekAgo;
      }).length;
      pending = bulletins.filter((b) => b.status === "pending_review").length;
    } else if (active === "templates") {
      total = templates.length;
      thisWeek = templates.filter((t) => {
        const date = new Date(t.log.created_at);
        return date >= oneWeekAgo;
      }).length;
      pending = 0; // Templates don't have pending review
    } else if (active === "cards") {
      total = cards.length;
      thisWeek = cards.filter((c) => {
        const date = new Date(c.log.created_at);
        return date >= oneWeekAgo;
      }).length;
      pending = 0; // Cards don't have pending review
    }

    return { total, thisWeek, pending };
  }, [active, bulletins, templates, cards]);

  // Helper functions to toggle status filters
  const toggleBulletinStatus = (status: string) => {
    setBulletinStatusFilter((prev) => {
      if (prev.includes(status)) {
        // Remove status
        return prev.filter((s) => s !== status);
      } else {
        // Add status
        const newFilter = [...prev, status];
        // If all statuses are selected, clear to show "All"
        if (newFilter.length === bulletinStatuses.length) {
          return [];
        }
        return newFilter;
      }
    });
  };

  const toggleTemplateStatus = (status: string) => {
    setTemplateStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        const newFilter = [...prev, status];
        if (newFilter.length === templateStatuses.length) {
          return [];
        }
        return newFilter;
      }
    });
  };

  const toggleCardStatus = (status: string) => {
    setCardStatusFilter((prev) => {
      if (prev.includes(status)) {
        return prev.filter((s) => s !== status);
      } else {
        const newFilter = [...prev, status];
        if (newFilter.length === cardStatuses.length) {
          return [];
        }
        return newFilter;
      }
    });
  };

  // Selection handlers
  const toggleSelectItem = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const currentItems =
      active === "bulletins"
        ? filteredBulletins
        : active === "templates"
        ? filteredTemplates
        : filteredCards;

    if (selectedItems.length === currentItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(currentItems.map((item) => item._id!));
    }
  };

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
        res = await TemplateAPIService.updateTemplate(id, {
          status: "archived",
        });
      } else if (type === "cards") {
        res = await CardAPIService.updateCard(id, { status: "archived" });
      } else if (type === "bulletins") {
        // BulletinStatus type doesn't include "archived" in typings; use an any-typed payload to avoid type error
        const payload: any = { status: "archived" };
        res = await BulletinAPIService.updateBulletin(id, payload);
      }

      if (res && res.success) {
        showToast?.(
          t("deleteSuccess", { name: itemToDelete.name || id }),
          "success",
          3000
        );
        // remove locally
        if (type === "templates")
          setTemplates((prev) => prev.filter((p) => p._id !== id));
        if (type === "cards")
          setCards((prev) => prev.filter((c) => c._id !== id));
        if (type === "bulletins")
          setBulletins((prev) => prev.filter((b) => b._id !== id));
      } else {
        throw new Error(res?.message || "Error al archivar");
      }
    } catch (err: any) {
      showToast?.(
        t("deleteError", {
          name: itemToDelete?.name || "",
          error: err?.message || "",
        }),
        "error",
        5000
      );
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
      setItemToDelete(null);
    }
  };

  // Función para manejar el preview de un template
  const handlePreview = (id: string, type: ContentType) => {
    setPreview(id);
    setTypePreview(type);
    setShowPreviewModal(true);
  };

  // Función para cerrar el modal de preview
  const handleClosePreview = () => {
    setShowPreviewModal(false);
    setPreview(null);
  };

  // Función para mostrar el modal de confirmación de eliminación
  /* const handleDeleteTemplate = (template: TemplateMaster) => {
      setTemplateToDelete(template);
      setShowDeleteModal(true);
    }; */

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
        <section className="py-5 border-b">
          <div className={container}>
            <div className="flex gap-2 justify-center">
              {canReadBulletins && (
                <button
                  onClick={() => setActive("bulletins")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    active === "bulletins"
                      ? "bg-[#606c38] text-white"
                      : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {t("bulletins")}
                </button>
              )}

              {canReadTemplates && (
                <button
                  onClick={() => setActive("templates")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    active === "templates"
                      ? "bg-[#606c38] text-white"
                      : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {t("templates")}
                </button>
              )}

              {canReadCards && (
                <button
                  onClick={() => setActive("cards")}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    active === "cards"
                      ? "bg-[#606c38] text-white"
                      : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {t("cards")}
                </button>
              )}
            </div>
          </div>
        </section>

        <div className={`${container} py-4`}>
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 text-[#606c38] animate-spin mb-4" />
              <p className="text-gray-600 text-lg">{t("loading")}</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button onClick={() => loadAllData()} className={btnPrimary}>
                {t("retry", { default: "Reintentar" })}
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Statistics */}
              {!loading && !error && (
                <div className="m-3 flex flex-wrap gap-3 justify-center">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <BarChart3 className="h-5 w-5 text-[#606c38]" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("stats.total")}
                      </p>
                      <p className="text-lg font-bold text-[#283618]">
                        {currentStats.total}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="text-xs text-gray-500">
                        {t("stats.thisWeek")}
                      </p>
                      <p className="text-lg font-bold text-[#283618]">
                        {currentStats.thisWeek}
                      </p>
                    </div>
                  </div>
                  {active === "bulletins" && currentStats.pending > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-orange-200 shadow-sm">
                      <AlertCircle className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-xs text-gray-500">
                          {t("stats.pendingReview")}
                        </p>
                        <p className="text-lg font-bold text-orange-600">
                          {currentStats.pending}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* Search and Filters Bar */}
              <div className="mb-4 space-y-3">
                {/* Search Input */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={t("searchPlaceholder")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className={`${searchField} pl-10`}
                    />
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                        viewMode === "grid"
                          ? "bg-white text-[#606c38] shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                      title={t("viewMode.grid")}
                    >
                      <Grid3x3 className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">
                        {t("viewMode.grid")}
                      </span>
                    </button>
                    <button
                      onClick={() => setViewMode("table")}
                      className={`px-3 py-2 rounded-md transition-all flex items-center gap-2 ${
                        viewMode === "table"
                          ? "bg-white text-[#606c38] shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                      title={t("viewMode.table")}
                    >
                      <List className="h-4 w-4" />
                      <span className="hidden sm:inline text-sm">
                        {t("viewMode.table")}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Sort Dropdown - Solo visible en vista de grid */}
                  {viewMode === "grid" && (
                    <div className="flex items-center gap-2 w-full md:w-auto md:order-last md:ml-auto">
                      <ArrowUpDown className="h-4 w-4 text-gray-500" />
                      <label className="text-sm text-gray-600 font-medium whitespace-nowrap">
                        {t("sortBy.label")}:
                      </label>
                      <select
                        value={sortBy}
                        onChange={(e) =>
                          setSortBy(e.target.value as SortOption)
                        }
                        className="flex-1 sm:flex-none px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#606c38] focus:border-transparent bg-white"
                      >
                        <option value="date-newest">
                          {t("sortBy.date-newest")}
                        </option>
                        <option value="date-oldest">
                          {t("sortBy.date-oldest")}
                        </option>
                        <option value="name-asc">{t("sortBy.name-asc")}</option>
                        <option value="name-desc">
                          {t("sortBy.name-desc")}
                        </option>
                      </select>
                    </div>
                  )}

                  {/* Date From */}
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    <label className="text-sm text-gray-600 font-medium whitespace-nowrap">
                      {t("dateFilter.from")}:
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#606c38] focus:border-transparent"
                    />
                  </div>

                  {/* Date To */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 font-medium whitespace-nowrap">
                      {t("dateFilter.to")}:
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#606c38] focus:border-transparent"
                    />
                  </div>

                  {/* Clear Dates Button */}
                  {(dateFrom || dateTo) && (
                    <button
                      onClick={() => {
                        setDateFrom("");
                        setDateTo("");
                      }}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 underline whitespace-nowrap"
                    >
                      {t("dateFilter.clear")}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Filter Pills */}
              <div className="mb-6 flex flex-wrap gap-2">
                {/* Bulletins Status Pills */}
                {active === "bulletins" && (
                  <>
                    <button
                      onClick={() => setBulletinStatusFilter([])}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        bulletinStatusFilter.length === 0
                          ? "bg-[#606c38] text-white"
                          : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {t("statusFilter.all")} ({bulletinStatusCounts.all})
                    </button>
                    {bulletinStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleBulletinStatus(status)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          bulletinStatusFilter.includes(status)
                            ? "bg-[#606c38] text-white"
                            : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {t(`statusFilter.${status}`)} (
                        {bulletinStatusCounts[status] || 0})
                      </button>
                    ))}
                  </>
                )}

                {/* Templates Status Pills */}
                {active === "templates" && (
                  <>
                    <button
                      onClick={() => setTemplateStatusFilter([])}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        templateStatusFilter.length === 0
                          ? "bg-[#606c38] text-white"
                          : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {t("statusFilter.all")} ({templateStatusCounts.all})
                    </button>
                    {templateStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleTemplateStatus(status)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          templateStatusFilter.includes(status)
                            ? "bg-[#606c38] text-white"
                            : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {t(`statusFilter.${status}`)} (
                        {templateStatusCounts[status] || 0})
                      </button>
                    ))}
                  </>
                )}

                {/* Cards Status Pills */}
                {active === "cards" && (
                  <>
                    <button
                      onClick={() => setCardStatusFilter([])}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                        cardStatusFilter.length === 0
                          ? "bg-[#606c38] text-white"
                          : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {t("statusFilter.all")} ({cardStatusCounts.all})
                    </button>
                    {cardStatuses.map((status) => (
                      <button
                        key={status}
                        onClick={() => toggleCardStatus(status)}
                        className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                          cardStatusFilter.includes(status)
                            ? "bg-[#606c38] text-white"
                            : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
                        }`}
                      >
                        {t(`statusFilter.${status}`)} (
                        {cardStatusCounts[status] || 0})
                      </button>
                    ))}
                  </>
                )}
              </div>
            </>
          )}

          {!loading && !error && active === "templates" && (
            <>
              {filteredTemplates.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {searchTerm
                      ? t("noResults")
                      : t("noTemplates", {
                          default: "No hay plantillas disponibles",
                        })}
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates
                    .filter(
                      (template, index, array) =>
                        template._id &&
                        array.findIndex((t) => t._id === template._id) === index
                    )
                    .map((template) => {
                      const allowedGroups =
                        template.access_config?.allowed_groups || [];
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

                      return (
                        <ItemCard
                          key={template._id}
                          type="template"
                          id={template._id!}
                          name={template.template_name}
                          author={
                            (template.log.updater_first_name ||
                              template.log.creator_first_name ||
                              "") +
                            " " +
                            (template.log.updater_last_name ||
                              template.log.creator_last_name ||
                              "")
                          }
                          lastModified={
                            template.log.updated_at
                              ? new Date(
                                  template.log.updated_at
                                ).toLocaleDateString()
                              : template.log.created_at
                              ? new Date(
                                  template.log.created_at
                                ).toLocaleDateString()
                              : ""
                          }
                          thumbnailImages={template.thumbnail_images || []}
                          previewBtn={true}
                          onPreview={() =>
                            handlePreview(template._id!, "template")
                          }
                          editBtn={canEdit}
                          onEdit={
                            canEdit
                              ? () =>
                                  router.push(`/templates/${template._id}/edit`)
                              : undefined
                          }
                          deleteBtn={canDelete}
                          onDelete={
                            canDelete
                              ? () =>
                                  handleDelete(
                                    template._id!,
                                    "templates",
                                    template.template_name
                                  )
                              : undefined
                          }
                          isDeleting={
                            isDeleting && itemToDelete?.id === template._id
                          }
                        />
                      );
                    })}
                </div>
              ) : (
                /* Table View */
                <TableView
                  items={filteredTemplates}
                  selectedItems={selectedItems}
                  onToggleSelect={toggleSelectItem}
                  onToggleSelectAll={toggleSelectAll}
                  onView={(item) => handlePreview(item._id!, "template")}
                  onEdit={(item) => router.push(`/templates/${item._id}/edit`)}
                  onDelete={(item) =>
                    handleDelete(item._id!, "templates", item.template_name)
                  }
                  canEdit={(item) =>
                    can(
                      PERMISSION_ACTIONS.Update,
                      MODULES.TEMPLATE_MANAGEMENT,
                      item.access_config?.allowed_groups || []
                    )
                  }
                  canDelete={(item) =>
                    can(
                      PERMISSION_ACTIONS.Delete,
                      MODULES.TEMPLATE_MANAGEMENT,
                      item.access_config?.allowed_groups || []
                    )
                  }
                  getItemId={(item) => item._id!}
                  getItemName={(item) => item.template_name}
                  getItemStatus={(item) => item.status}
                  getItemAuthor={(item) =>
                    `${
                      item.log.updater_first_name ||
                      item.log.creator_first_name ||
                      ""
                    } ${
                      item.log.updater_last_name ||
                      item.log.creator_last_name ||
                      ""
                    }`
                  }
                  getItemCreatedDate={(item) =>
                    item.log.created_at
                      ? new Date(item.log.created_at).toLocaleDateString()
                      : ""
                  }
                  getItemUpdatedDate={(item) =>
                    item.log.updated_at
                      ? new Date(item.log.updated_at).toLocaleDateString()
                      : ""
                  }
                  translationNamespace="Dashboard"
                />
              )}
            </>
          )}

          {!loading && !error && active === "bulletins" && (
            <>
              {filteredBulletins.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {searchTerm
                      ? t("noResults")
                      : t("noBulletins", {
                          default: "No hay boletines disponibles",
                        })}
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredBulletins.map((b) => {
                    const allowedGroups = b.access_config?.allowed_groups || [];
                    const canEdit = can(
                      PERMISSION_ACTIONS.Update,
                      MODULES.BULLETINS_COMPOSER,
                      allowedGroups
                    );
                    const canDelete = can(
                      PERMISSION_ACTIONS.Delete,
                      MODULES.BULLETINS_COMPOSER,
                      allowedGroups
                    );
                    const creatorName =
                      b.log.creator_first_name && b.log.creator_last_name
                        ? `${b.log.creator_first_name} ${b.log.creator_last_name}`
                        : b.log.creator_first_name ||
                          b.log.creator_last_name ||
                          b.log.creator_user_id;

                    return (
                      <ItemCard
                        key={b._id}
                        type="template"
                        id={b._id!}
                        name={b.bulletin_name || "Bulletin"}
                        author={creatorName}
                        lastModified={
                          b.log.updated_at
                            ? new Date(b.log.updated_at).toLocaleDateString()
                            : b.log.created_at
                            ? new Date(b.log.created_at).toLocaleDateString()
                            : ""
                        }
                        thumbnailImages={b.thumbnail_images || []}
                        previewBtn={true}
                        status={b.status}
                        onPreview={() => handlePreview(b._id!, "bulletin")}
                        editBtn={canEdit}
                        onEdit={
                          canEdit
                            ? () => router.push(`/bulletins/${b._id}/edit`)
                            : undefined
                        }
                        deleteBtn={canDelete}
                        onDelete={
                          canDelete
                            ? () =>
                                handleDelete(
                                  b._id!,
                                  "bulletins",
                                  b.bulletin_name
                                )
                            : undefined
                        }
                        isDeleting={isDeleting && itemToDelete?.id === b._id}
                      />
                    );
                  })}
                </div>
              ) : (
                /* Table View */
                <TableView
                  items={filteredBulletins}
                  selectedItems={selectedItems}
                  onToggleSelect={toggleSelectItem}
                  onToggleSelectAll={toggleSelectAll}
                  onView={(item) => handlePreview(item._id!, "bulletin")}
                  onEdit={(item) => router.push(`/bulletins/${item._id}/edit`)}
                  onDelete={(item) =>
                    handleDelete(item._id!, "bulletins", item.bulletin_name)
                  }
                  canEdit={(item) =>
                    can(
                      PERMISSION_ACTIONS.Update,
                      MODULES.BULLETINS_COMPOSER,
                      item.access_config?.allowed_groups || []
                    )
                  }
                  canDelete={(item) =>
                    can(
                      PERMISSION_ACTIONS.Delete,
                      MODULES.BULLETINS_COMPOSER,
                      item.access_config?.allowed_groups || []
                    )
                  }
                  getItemId={(item) => item._id!}
                  getItemName={(item) => item.bulletin_name}
                  getItemStatus={(item) => item.status}
                  getItemAuthor={(item) => {
                    const firstName = item.log.creator_first_name || "";
                    const lastName = item.log.creator_last_name || "";
                    const userId = item.log.creator_user_id || "";
                    return firstName && lastName
                      ? `${firstName} ${lastName}`
                      : firstName || lastName || userId;
                  }}
                  getItemCreatedDate={(item) =>
                    item.log.created_at
                      ? new Date(item.log.created_at).toLocaleDateString()
                      : ""
                  }
                  getItemUpdatedDate={(item) =>
                    item.log.updated_at
                      ? new Date(item.log.updated_at).toLocaleDateString()
                      : ""
                  }
                  translationNamespace="Dashboard"
                />
              )}
            </>
          )}

          {!loading && !error && active === "cards" && (
            <>
              {filteredCards.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">
                    {searchTerm
                      ? t("noResults")
                      : t("noCards", {
                          default: "No hay tarjetas disponibles",
                        })}
                  </p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCards.map((c) => {
                    const allowedGroups = c.access_config?.allowed_groups || [];
                    const canEdit = can(
                      PERMISSION_ACTIONS.Update,
                      MODULES.CARD_MANAGEMENT,
                      allowedGroups
                    );
                    const canDelete = can(
                      PERMISSION_ACTIONS.Delete,
                      MODULES.CARD_MANAGEMENT,
                      allowedGroups
                    );

                    return (
                      <ItemCard
                        key={c._id}
                        type="card"
                        id={c._id!}
                        name={c.card_name || "Card"}
                        author={c.log.creator_first_name || ""}
                        lastModified={
                          c.log.updated_at
                            ? new Date(c.log.updated_at).toLocaleDateString()
                            : c.log.created_at
                            ? new Date(c.log.created_at).toLocaleDateString()
                            : ""
                        }
                        thumbnailImages={c.thumbnail_images || []}
                        previewBtn={true}
                        onPreview={() => handlePreview(c._id!, "card")}
                        editBtn={canEdit}
                        onEdit={
                          canEdit
                            ? () => router.push(`/cards/${c._id}/edit`)
                            : undefined
                        }
                        deleteBtn={canDelete}
                        onDelete={
                          canDelete
                            ? () => handleDelete(c._id!, "cards", c.card_name)
                            : undefined
                        }
                        isDeleting={isDeleting && itemToDelete?.id === c._id}
                      />
                    );
                  })}
                </div>
              ) : (
                /* Table View */
                <TableView
                  items={filteredCards}
                  selectedItems={selectedItems}
                  onToggleSelect={toggleSelectItem}
                  onToggleSelectAll={toggleSelectAll}
                  onView={(item) => handlePreview(item._id!, "card")}
                  onEdit={(item) => router.push(`/cards/${item._id}/edit`)}
                  onDelete={(item) =>
                    handleDelete(item._id!, "cards", item.card_name)
                  }
                  canEdit={(item) =>
                    can(
                      PERMISSION_ACTIONS.Update,
                      MODULES.CARD_MANAGEMENT,
                      item.access_config?.allowed_groups || []
                    )
                  }
                  canDelete={(item) =>
                    can(
                      PERMISSION_ACTIONS.Delete,
                      MODULES.CARD_MANAGEMENT,
                      item.access_config?.allowed_groups || []
                    )
                  }
                  getItemId={(item) => item._id!}
                  getItemName={(item) => item.card_name || "Card"}
                  getItemStatus={(item) => item.status}
                  getItemAuthor={(item) => item.log.creator_first_name || ""}
                  getItemCreatedDate={(item) =>
                    item.log.created_at
                      ? new Date(item.log.created_at).toLocaleDateString()
                      : ""
                  }
                  getItemUpdatedDate={(item) =>
                    item.log.updated_at
                      ? new Date(item.log.updated_at).toLocaleDateString()
                      : ""
                  }
                  translationNamespace="Dashboard"
                />
              )}
            </>
          )}
        </div>

        {/* Delete confirmation modal */}
        {showDeleteModal && itemToDelete && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setShowDeleteModal(false)}
          >
            <div
              className="bg-white rounded-lg max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
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
                  onClick={() => setShowDeleteModal(false)}
                  className="p-2 text-[#283618]/80 hover:text-[#283618] transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="flex gap-4">
                  <div className="shrink-0">
                    <div className="w-16 h-16 bg-[#ffaf68]/20 rounded-lg flex items-center justify-center">
                      <FileText className="h-8 w-8 text-[#ffaf68]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-[#283618] mb-3">
                      {t("deleteConfirmMessage", {
                        name: itemToDelete.name || "",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 justify-end p-4 border-t bg-gray-50">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-white border rounded"
                    disabled={isDeleting}
                  >
                    {t("cancelDelete")}
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className={`bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors ${
                      isDeleting
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    {isDeleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    <span>
                      {isDeleting ? t("deleting") : t("confirmDeleteBtn")}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de Preview */}
        {showPreviewModal && previewId && (
          <PreviewModal
            isOpen={showPreviewModal}
            onClose={handleClosePreview}
            contentType={typePreview}
            contentId={previewId}
          />
        )}
      </main>
    </ProtectedRoute>
  );
}
