"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Loader2, Search } from "lucide-react";
import { VisualResourcesService } from "@/services/visualResourcesService";
import { VisualResource } from "@/types/visualResource";
import Image from "next/image";
import { normalizeAssetUrl } from "@/utils/assetUrl";
import { useTranslations } from "next-intl";

export interface VisualResourceSelectorProps {
  /** Si el modal está visible */
  isOpen: boolean;
  /** Función para cerrar el modal */
  onClose: () => void;
  /** Función que se ejecuta al seleccionar un recurso */
  onSelect: (resourceUrl: string) => void;
  /** Título del modal */
  title?: string;
  /** Tipo de recursos a mostrar: 'icon', 'image', o 'both' */
  resourceType?: "icon" | "image" | "both";
  /** URL del recurso actualmente seleccionado (para resaltar) */
  selectedUrl?: string;
  /** Número de columnas en el grid (default: 4) */
  gridColumns?: number;
  /** Texto del botón de cerrar (default: "Cerrar") */
  closeButtonText?: string;
}

export const VisualResourceSelector: React.FC<VisualResourceSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  title = "Seleccionar Recurso",
  resourceType = "both",
  selectedUrl,
  gridColumns = 4,
  closeButtonText = "Cerrar",
}) => {
  const t = useTranslations("VisualResources");
  const [availableResources, setAvailableResources] = useState<
    VisualResource[]
  >([]);
  const [loadingResources, setLoadingResources] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Cargar recursos disponibles cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      loadResources();
    }
  }, [isOpen, resourceType]);

  const loadResources = async () => {
    setLoadingResources(true);
    try {
      const response =
        await VisualResourcesService.getVisualResourcesByStatus("active");
      if (response.success && response.data) {
        let filteredResources = response.data;

        // Filtrar por tipo si es necesario
        if (resourceType !== "both") {
          filteredResources = filteredResources.filter(
            (resource) => resource.file_type === resourceType,
          );
        }

        setAvailableResources(filteredResources);
      }
    } catch (error) {
      console.error("Error loading visual resources:", error);
    } finally {
      setLoadingResources(false);
    }
  };

  const handleSelect = (resourceUrl: string) => {
    onSelect(resourceUrl);
    onClose();
  };

  const filteredResources = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return availableResources;
    }

    return availableResources.filter((resource) =>
      [resource.file_name, resource.file_type].some((value) =>
        value?.toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [availableResources, searchTerm]);

  if (!isOpen) return null;

  const gridColsClass =
    {
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    }[gridColumns] || "grid-cols-4";

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-[#283618]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-[#283618]/50 hover:text-[#283618] p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#283618]/40" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm text-[#283618] outline-none transition focus:border-[#bc6c25] focus:ring-2 focus:ring-[#bc6c25]/20"
            aria-label={t("searchPlaceholder")}
          />
        </div>

        {/* Content */}
        {loadingResources ? (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[#bc6c25] mx-auto mb-2" />
            <p className="text-[#283618]/50">
              Cargando recursos disponibles...
            </p>
          </div>
        ) : availableResources.length === 0 ? (
          <div className="text-center py-12 text-amber-600">
            <p className="mb-2">{t("noResources")}</p>
            <p className="text-sm">{t("uploadFirst")}</p>
          </div>
        ) : filteredResources.length === 0 ? (
          <div className="text-center py-12 text-[#283618]/60">
            <Search className="mx-auto mb-3 h-8 w-8 opacity-30" />
            <p className="mb-1 font-medium">{t("noResults")}</p>
            <p className="text-sm">{t("tryDifferentSearch")}</p>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[calc(90vh-230px)]">
            <div className={`grid ${gridColsClass} gap-4 p-2`}>
              {filteredResources.map((resource) => {
                const normalizedResourceUrl = normalizeAssetUrl(
                  resource.file_url,
                );
                const isSelected =
                  normalizeAssetUrl(selectedUrl) === normalizedResourceUrl;
                return (
                  <button
                    key={resource.id}
                    type="button"
                    onClick={() => handleSelect(normalizedResourceUrl)}
                    className={`
                      flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all
                      ${
                        isSelected
                          ? "border-[#bc6c25] bg-[#bc6c25]/10"
                          : "border-gray-200 hover:border-[#bc6c25]/50 hover:bg-gray-50"
                      }
                    `}
                    title={resource.file_name}
                  >
                    <div className="w-16 h-16 mb-2 flex items-center justify-center">
                      <Image
                        src={normalizedResourceUrl}
                        alt={resource.file_name}
                        width={64}
                        height={64}
                        className="max-w-full max-h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "/assets/img/imageNotFound.png";
                        }}
                      />
                    </div>
                    <span className="text-xs text-[#283618]/70 text-center truncate w-full">
                      {resource.file_name}
                    </span>
                    <span className="text-[10px] text-[#283618]/40 mt-1">
                      {resource.file_type}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-[#283618] bg-white hover:bg-gray-50 transition-colors"
          >
            {closeButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
