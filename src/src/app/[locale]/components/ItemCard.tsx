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
} from "lucide-react";

// Tipos base
export interface BaseItemCardProps {
  id: number | string;
  name: string;
  image?: string;
}

// Props específicas para templates
export interface TemplateCardProps extends BaseItemCardProps {
  type: "template";
  author: string;
  lastModified: string;
}

// Props específicas para visual resources
export interface VisualResourceCardProps extends BaseItemCardProps {
  type: "visual-resource";
  fileType: "image" | "icon";
  fileSize?: string;
  tags?: string[];
  onEdit?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  isDownloading?: boolean;
}

// Union type para todas las props
export type ItemCardProps = TemplateCardProps | VisualResourceCardProps;

export default function ItemCard(props: ItemCardProps) {
  const t = useTranslations(
    props.type === "template" ? "Templates" : "VisualResources"
  );

  // Imagen a mostrar (usar imagen por defecto si no se proporciona)
  const displayImage = props.image || "/assets/img/imageNotFound.png";

  // Renderizar card para templates
  if (props.type === "template") {
    return (
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
        {/* Thumbnail más pequeño para templates */}
        <div className="h-32 bg-gray-100 relative overflow-hidden">
          <Image
            src={displayImage}
            alt={props.name}
            fill
            className="object-contain group-hover:scale-105 transition-transform"
            onError={(e) => {
              e.currentTarget.src = "/assets/img/imageNotFound.png";
            }}
          />
          {/* Overlay con acciones para templates */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Link
              href={`/templates/${props.id}`}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title={t("view")}
            >
              <Eye className="h-4 w-4 text-white" />
            </Link>
            <Link
              href={`/templates/${props.id}/edit`}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title={t("edit")}
            >
              <Edit3 className="h-4 w-4 text-white" />
            </Link>
          </div>
        </div>

        {/* Info para templates más compacta */}
        <div className="p-3">
          <h3 className="font-medium text-sm text-[#283618] truncate mb-2">
            {props.name}
          </h3>
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
        </div>
      </div>
    );
  }

  // Renderizar card para visual resources
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        <Image
          src={displayImage}
          alt={props.name}
          fill
          className="object-contain group-hover:scale-105 transition-transform"
          onError={(e) => {
            e.currentTarget.src = "/assets/img/imageNotFound.png";
          }}
        />
        {/* Overlay con acciones para visual resources */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          {props.onEdit && (
            <button
              onClick={props.onEdit}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title={t("editFile")}
            >
              <Edit3 className="h-4 w-4 text-white cursor-pointer" />
            </button>
          )}
          {props.onDownload && (
            <button
              onClick={props.onDownload}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title={t("downloadFile")}
              disabled={props.isDownloading}
            >
              {props.isDownloading ? (
                <Loader2 className="h-4 w-4 text-white animate-spin" />
              ) : (
                <Download className="h-4 w-4 text-white cursor-pointer" />
              )}
            </button>
          )}
          {props.onDelete && (
            <button
              onClick={props.onDelete}
              className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
              title={t("deleteFile")}
            >
              <Trash2 className="h-4 w-4 text-white cursor-pointer" />
            </button>
          )}
        </div>
      </div>

      {/* Info para visual resources */}
      <div className="p-4">
        <h3 className="font-medium text-sm text-[#283618] truncate mb-1">
          {props.name}
        </h3>
        {props.fileSize && (
          <p className="text-xs text-[#283618]/80 mb-2">{props.fileSize}</p>
        )}

        {/* Tags */}
        {props.tags && props.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {props.tags.slice(0, 2).map((tag) => (
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
      </div>
    </div>
  );
}
