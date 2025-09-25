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
  Video,
  FileText,
  Trash2,
  Eye,
  Download,
  MoreHorizontal,
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

interface MultimediaResource {
  id: string;
  name: string;
  type: "image" | "video" | "document";
  url: string;
  thumbnailUrl?: string;
  size: string;
  uploadDate: string;
  uploadedBy: string;
  tags: string[];
}

export default function MultimediaResources() {
  const t = useTranslations("MultimediaResources");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterType, setFilterType] = useState<
    "all" | "image" | "video" | "document"
  >("all");
  const [resources, setResources] = useState<MultimediaResource[]>([]);
  const [loading, setLoading] = useState(false);

  // Mock data para demostración
  useEffect(() => {
    // Simular carga de recursos
    const mockResources: MultimediaResource[] = [
      {
        id: "1",
        name: "climate-chart-template.png",
        type: "image",
        url: "/assets/img/bol1.jpg",
        thumbnailUrl: "/assets/img/bol1.jpg",
        size: "2.3 MB",
        uploadDate: "2024-01-15",
        uploadedBy: "Juan Pérez",
        tags: ["gráfico", "clima", "plantilla"],
      },
      {
        id: "2",
        name: "logo-institucion.svg",
        type: "image",
        url: "/assets/img/bol2.jpg",
        thumbnailUrl: "/assets/img/bol2.jpg",
        size: "156 KB",
        uploadDate: "2024-01-10",
        uploadedBy: "María González",
        tags: ["logo", "institución"],
      },
    ];
    setResources(mockResources);
  }, []);

  // Filtrar recursos basado en búsqueda y tipo
  const filteredResources = resources.filter((resource) => {
    const matchesSearch =
      resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some((tag) =>
        tag.toLowerCase().includes(searchTerm.toLowerCase())
      );
    const matchesType = filterType === "all" || resource.type === filterType;
    return matchesSearch && matchesType;
  });

  const getFileIcon = (type: string) => {
    switch (type) {
      case "image":
        return <ImageIcon className="h-5 w-5" />;
      case "video":
        return <Video className="h-5 w-5" />;
      case "document":
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
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
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffaf68] focus:border-transparent"
              >
                <option value="all">{t("allFiles")}</option>
                <option value="image">{t("images")}</option>
                <option value="video">{t("videos")}</option>
                <option value="document">{t("documents")}</option>
              </select>

              {/* Toggle vista */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded ${
                    viewMode === "grid" ? "bg-white shadow-sm" : ""
                  }`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded ${
                    viewMode === "list" ? "bg-white shadow-sm" : ""
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>

              {/* Botón subir */}
              <button className={btnPrimary}>
                <Upload className="h-5 w-5" />
                <span>{t("uploadFile")}</span>
              </button>
            </div>
          </div>

          {/* Grid/List View */}
          {viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group"
                >
                  {/* Thumbnail */}
                  <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {resource.type === "image" && resource.thumbnailUrl ? (
                      <Image
                        src={resource.thumbnailUrl}
                        alt={resource.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        {getFileIcon(resource.type)}
                      </div>
                    )}

                    {/* Overlay con acciones */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <Eye className="h-4 w-4 text-white" />
                      </button>
                      <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <Download className="h-4 w-4 text-white" />
                      </button>
                      <button className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                        <Trash2 className="h-4 w-4 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-sm text-[#283618] truncate mb-1">
                      {resource.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {resource.size}
                    </p>

                    {/* Tags */}
                    {resource.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {resource.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-[#ffaf68]/20 text-[#283618] text-xs rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                        {resource.tags.length > 2 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{resource.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* List View */
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {filteredResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-center gap-4 p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
                >
                  {/* Icon/Thumbnail */}
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {resource.type === "image" && resource.thumbnailUrl ? (
                      <Image
                        src={resource.thumbnailUrl}
                        alt={resource.name}
                        width={48}
                        height={48}
                        className="object-cover"
                      />
                    ) : (
                      <div className="text-gray-400">
                        {getFileIcon(resource.type)}
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#283618] truncate">
                      {resource.name}
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span>{resource.size}</span>
                      <span>
                        {t("uploadedBy")} {resource.uploadedBy}
                      </span>
                      <span>
                        {new Date(resource.uploadDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex gap-1">
                    {resource.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-[#ffaf68]/20 text-[#283618] text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Download className="h-4 w-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {filteredResources.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-[#283618] mb-2">
                {searchTerm ? t("noResults") : t("noResources")}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm ? t("tryDifferentSearch") : t("uploadFirst")}
              </p>
              <button className={btnPrimary}>
                <Upload className="h-5 w-5" />
                <span>{t("uploadFirstFile")}</span>
              </button>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
