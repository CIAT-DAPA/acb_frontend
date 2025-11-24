import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  Edit3,
  Download,
  Trash2,
  Loader2,
  Eye,
  Calendar,
  User,
  Tag,
  Copy,
} from "lucide-react";

// Props base compartidas
interface BaseItemCardProps {
  id: number | string;
  name: string;
  image?: string;
  type: "template" | "visual-resource" | "card";
  author: string;

  // Botones de acción (opcionales y compartidos)
  previewBtn?: boolean;
  onPreview?: () => void;

  editBtn?: boolean;
  onEdit?: () => void;

  downloadBtn?: boolean;
  onDownload?: () => void;
  isDownloading?: boolean;

  duplicateBtn?: boolean;
  onDuplicate?: () => void;
  isDuplicating?: boolean;

  deleteBtn?: boolean;
  onDelete?: () => void;
  isDeleting?: boolean;
}

// Props específicas para templates
export interface TemplateCardProps extends BaseItemCardProps {
  type: "template";
  lastModified: string;
  thumbnailImages?: string[]; // Array de thumbnails de las secciones (máximo 3)
  totalSections?: number; // Número real total de secciones del template
  templateBaseName?: string; // Nombre del template base (solo para boletines)
  status?: string; // Estado del boletín (draft, published, etc.)
}

// Props específicas para visual resources
export interface VisualResourceCardProps extends BaseItemCardProps {
  type: "visual-resource";
  fileType: "image" | "icon";
  tags?: string[];
}

// Props específicas para cards
export interface CardItemCardProps extends BaseItemCardProps {
  type: "card";
  lastModified: string;
  thumbnailImages?: string[]; // Background URL de la card
  badge?: React.ReactNode; // Para mostrar el tipo de card
  metadata?: React.ReactNode; // Para mostrar blocks, fields, templates count
}

// Union type para todas las props
export type ItemCardProps =
  | TemplateCardProps
  | VisualResourceCardProps
  | CardItemCardProps;

export default function ItemCard(props: ItemCardProps) {
  const t = useTranslations(
    props.type === "template"
      ? "Templates"
      : props.type === "card"
      ? "Cards"
      : "VisualResources"
  );

  // Constantes reutilizables
  const ACTION_BUTTON_CLASS =
    "p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors cursor-pointer";
  const DELETE_BUTTON_CLASS =
    "p-2 bg-white/20 rounded-full hover:bg-red-500/50 transition-colors cursor-pointer";
  const ICON_CLASS = "h-4 w-4 text-white";
  const IMAGE_FALLBACK = "/assets/img/imageNotFound.png";

  // Imagen a mostrar
  let displayImage = props.image || IMAGE_FALLBACK;

  // Para templates, usar el primer thumbnail si existe
  if (
    props.type === "template" &&
    props.thumbnailImages &&
    props.thumbnailImages.length > 0
  ) {
    displayImage = props.thumbnailImages[0];
  }

  // Función para obtener el estilo del badge según el status
  const getStatusBadgeClass = (status?: string) => {
    if (!status) return "";

    const baseClass = "px-2 py-1 rounded-full text-xs font-medium";

    switch (status.toLowerCase()) {
      case "draft":
        return `${baseClass} bg-gray-200 text-gray-700`;
      case "published":
        return `${baseClass} bg-green-100 text-green-700`;
      default:
        return `${baseClass} bg-blue-100 text-blue-700`;
    }
  };

  // Función para obtener el texto traducido del status
  const getStatusText = (status?: string) => {
    if (!status) return "";

    switch (status.toLowerCase()) {
      case "draft":
        return t("statusDraft") || "Borrador";
      case "published":
        return t("statusPublished") || "Publicado";
      default:
        return status;
    }
  };

  // Para cards, usar el primer thumbnail si existe (background_url)
  if (
    props.type === "card" &&
    props.thumbnailImages &&
    props.thumbnailImages.length > 0
  ) {
    displayImage = props.thumbnailImages[0];
  }

  // Helper para manejar errores de imágenes
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.src = IMAGE_FALLBACK;
  };

  // Renderizar botones de acción compartidos
  const renderActionButtons = () => (
    <>
      {props.previewBtn && props.onPreview && (
        <button
          onClick={props.onPreview}
          className={ACTION_BUTTON_CLASS}
          title={t("preview")}
        >
          <Eye className={ICON_CLASS} />
        </button>
      )}

      {props.editBtn && props.onEdit && (
        <button
          onClick={props.onEdit}
          className={ACTION_BUTTON_CLASS}
          title={t("edit")}
        >
          <Edit3 className={ICON_CLASS} />
        </button>
      )}

      {props.downloadBtn && props.onDownload && (
        <button
          onClick={props.onDownload}
          className={ACTION_BUTTON_CLASS}
          title={t("download")}
          disabled={props.isDownloading}
        >
          {props.isDownloading ? (
            <Loader2 className={`${ICON_CLASS} animate-spin`} />
          ) : (
            <Download className={ICON_CLASS} />
          )}
        </button>
      )}

      {props.duplicateBtn && props.onDuplicate && (
        <button
          onClick={props.onDuplicate}
          className={ACTION_BUTTON_CLASS}
          title={t("duplicate")}
          disabled={props.isDuplicating}
        >
          {props.isDuplicating ? (
            <Loader2 className={`${ICON_CLASS} animate-spin`} />
          ) : (
            <Copy className={ICON_CLASS} />
          )}
        </button>
      )}

      {props.deleteBtn && props.onDelete && (
        <button
          onClick={props.onDelete}
          className={DELETE_BUTTON_CLASS}
          title={t("delete")}
          disabled={props.isDeleting}
        >
          {props.isDeleting ? (
            <Loader2 className={`${ICON_CLASS} animate-spin`} />
          ) : (
            <Trash2 className={ICON_CLASS} />
          )}
        </button>
      )}
    </>
  );

  // Renderizar card para templates
  if (props.type === "template") {
    // Usar totalSections si está disponible, sino usar el número de thumbnails
    const totalSections =
      props.totalSections || props.thumbnailImages?.length || 1;
    const hasMutipleSections = totalSections > 1;

    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
        {/* Thumbnails para templates */}
        <div className="h-64 bg-gray-100 relative overflow-hidden">
          {hasMutipleSections &&
          props.thumbnailImages &&
          props.thumbnailImages.length > 1 ? (
            // Mostrar grilla de thumbnails cuando hay múltiples secciones
            <div
              className="grid gap-0.5 h-full"
              style={{
                gridTemplateColumns: `repeat(${Math.min(
                  props.thumbnailImages.length,
                  3
                )}, 1fr)`,
              }}
            >
              {props.thumbnailImages.slice(0, 3).map((thumbnail, index) => (
                <div key={index} className="relative bg-gray-50">
                  <Image
                    src={thumbnail}
                    alt={`${props.name} - ${t("section")} ${index + 1}`}
                    fill
                    className="object-contain"
                    onError={handleImageError}
                  />
                </div>
              ))}
              {totalSections > 3 && (
                <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-2 py-0.5 rounded-full">
                  +{totalSections - 3}
                </div>
              )}
            </div>
          ) : (
            // Mostrar una sola imagen cuando hay una sección
            <Image
              src={displayImage}
              alt={props.name}
              fill
              className="object-contain group-hover:scale-105 transition-transform"
              onError={handleImageError}
            />
          )}

          {/* Overlay con acciones */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {renderActionButtons()}
          </div>
        </div>

        {/* Info para templates más compacta */}
        <div className="p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm text-[#283618] truncate flex-1">
              {props.name}
            </h3>
            {hasMutipleSections && (
              <span className="text-xs text-[#283618]/60 ml-2 whitespace-nowrap">
                {totalSections} {totalSections === 1 ? t("page") : t("pages")}
              </span>
            )}
            {props.status && (
              <div>
                <span className={getStatusBadgeClass(props.status)}>
                  {getStatusText(props.status)}
                </span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-[#283618]/80 mb-1">
            <User className="h-3 w-3" />
            <span>
              {t("by")} {props.author}
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-[#283618]/60">
            <Calendar className="h-3 w-3" />
            <span>
              {t("lastModified")}: {props.lastModified}
            </span>
          </div>
          {props.templateBaseName && (
            <div className="flex items-center gap-1 text-xs text-[#283618]/60 mt-1">
              <Tag className="h-3 w-3" />
              <span>
                {t("basedOn")}: {props.templateBaseName}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }
  // Renderizar card para visual resources
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Thumbnail */}
      <div className="h-64 bg-gray-100 relative overflow-hidden">
        <Image
          src={displayImage}
          alt={props.name}
          fill
          className="object-contain group-hover:scale-105 transition-transform"
          onError={handleImageError}
        />
        {/* Overlay con acciones */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {renderActionButtons()}
        </div>
      </div>

      {/* Info para visual resources */}
      <div className="p-4">
        <h3 className="font-medium text-sm text-[#283618] truncate mb-1">
          {props.name}
        </h3>
        {props.author && (
          <p className="text-xs text-[#283618]/80 mb-2">
            {t("updatedBy")} {props.author}
          </p>
        )}

        {/* Tags (solo para visual-resource) */}
        {props.type === "visual-resource" &&
          props.tags &&
          props.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {props.tags.slice(0, 2).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 bg-[#ffaf68]/20 text-[#283618] text-xs rounded-full flex items-center gap-1"
                >
                  <Tag className="h-2 w-2" />
                  {tag}
                </span>
              ))}
              {props.tags.length > 2 && (
                <span className="px-2 py-1 bg-gray-100 text-[#283618]/80 text-xs rounded-full">
                  +{props.tags.length - 2}
                </span>
              )}
            </div>
          )}

        {/* Badge (solo para cards) */}
        {props.type === "card" && props.badge && (
          <div className="mb-2">{props.badge}</div>
        )}

        {/* Metadata (solo para cards) */}
        {props.type === "card" && props.metadata && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            {props.metadata}
          </div>
        )}
      </div>
    </div>
  );
}
