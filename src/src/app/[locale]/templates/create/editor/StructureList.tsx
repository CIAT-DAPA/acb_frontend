"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, GripVertical, Settings, Trash2 } from "lucide-react";

/**
 * Un elemento del listado de estructura.
 *
 * El id es estable (block_id / field_id) y sirve de clave de React y de
 * referencia para marcar el elemento en el lienzo; el índice es su posición
 * actual, que es lo que consumen la selección y los reordenados.
 */
export interface StructureItem {
  id: string;
  index: number;
  name: string;
  detail?: string;
}

interface StructureListProps {
  items: StructureItem[];
  markedId?: string | null;
  emptyMessage: string;
  onMark: (item: StructureItem) => void;
  onOpen: (item: StructureItem) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onDuplicate: (item: StructureItem) => void;
  onDelete: (item: StructureItem) => void;
}

/**
 * Listado de la estructura de un contenedor: los bloques de una sección o los
 * campos de un bloque, cabecera o pie.
 *
 * Un clic simple marca el elemento (lo resalta en el lienzo sin cambiar de
 * panel, para poder recorrer la lista sin perderla). El doble clic y el botón
 * del engrane abren su panel; se ofrecen los dos porque el doble clic no es un
 * gesto que el usuario descubra por su cuenta.
 */
export const StructureList: React.FC<StructureListProps> = ({
  items,
  markedId,
  emptyMessage,
  onMark,
  onOpen,
  onReorder,
  onDuplicate,
  onDelete,
}) => {
  const t = useTranslations("CreateTemplate.fieldEditor.structure");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [draggableIndex, setDraggableIndex] = useState<number | null>(null);

  if (items.length === 0) {
    return (
      <p className="text-xs text-gray-400 italic text-center py-3">
        {emptyMessage}
      </p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => {
        const isMarked = markedId === item.id;

        return (
          <li
            key={item.id}
            draggable={draggableIndex === item.index}
            onDragStart={(event) => {
              if (draggableIndex !== item.index) {
                event.preventDefault();
                return;
              }

              event.dataTransfer.effectAllowed = "move";
              setDraggedIndex(item.index);
            }}
            onDragEnd={() => {
              setDraggedIndex(null);
              setDraggableIndex(null);
            }}
            onDragOver={(event) => {
              if (draggedIndex !== null) {
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
              }
            }}
            onDrop={(event) => {
              event.preventDefault();

              if (draggedIndex !== null && draggedIndex !== item.index) {
                onReorder(draggedIndex, item.index);
              }

              setDraggedIndex(null);
              setDraggableIndex(null);
            }}
            onClick={() => onMark(item)}
            onDoubleClick={() => onOpen(item)}
            className={[
              "group flex items-center gap-1.5 rounded border px-1.5 py-1.5",
              "cursor-pointer transition-colors",
              draggedIndex === item.index ? "opacity-50" : "",
              isMarked
                ? "border-[#bc6c25] bg-[#bc6c25]/10"
                : "border-gray-200 bg-white hover:bg-gray-50",
            ].join(" ")}
          >
            <span
              onMouseDown={() => setDraggableIndex(item.index)}
              onMouseUp={() => setDraggableIndex(null)}
              className="shrink-0 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
              title={t("dragToReorder")}
            >
              <GripVertical className="w-3.5 h-3.5" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-medium text-[#283618]">
                {item.name}
              </span>
              {item.detail && (
                <span className="block truncate text-[10px] text-[#283618]/50">
                  {item.detail}
                </span>
              )}
            </span>

            <span className="flex shrink-0 items-center gap-0.5 opacity-60 group-hover:opacity-100">
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpen(item);
                }}
                className="rounded p-1 text-[#283618]/50 hover:bg-gray-100 hover:text-[#283618]"
                title={t("openSettings")}
                aria-label={t("openSettings")}
              >
                <Settings className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDuplicate(item);
                }}
                className="rounded p-1 text-[#283618]/50 hover:bg-gray-100 hover:text-[#283618]"
                title={t("duplicate")}
                aria-label={t("duplicate")}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete(item);
                }}
                className="rounded p-1 text-red-500 hover:bg-red-50 hover:text-red-700"
                title={t("delete")}
                aria-label={t("delete")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
};
