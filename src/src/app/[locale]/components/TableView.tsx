import { useTranslations } from "next-intl";
import { Eye, Edit3, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { getStatusBadgeConfig } from "@/utils/statusHelpers";
import { useState } from "react";

export interface TableColumn {
  key: string;
  label: string;
  hideOnMobile?: boolean;
  render?: (item: any) => React.ReactNode;
}

export interface TableAction {
  icon: React.ComponentType<{ className?: string }>;
  onClick: (item: any) => void;
  title: string;
  color: "blue" | "green" | "red";
  show?: (item: any) => boolean;
}

export interface TableViewProps {
  items: any[];
  columns?: TableColumn[];
  selectedItems: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  onView?: (item: any) => void;
  onEdit?: (item: any) => void;
  onDelete?: (item: any) => void;
  canEdit?: (item: any) => boolean;
  canDelete?: (item: any) => boolean;
  getItemId: (item: any) => string;
  getItemName: (item: any) => string;
  getItemStatus?: (item: any) => string;
  getItemAuthor?: (item: any) => string;
  getItemCreatedDate?: (item: any) => string;
  getItemUpdatedDate?: (item: any) => string;
  translationNamespace?: "Templates" | "Dashboard" | "Bulletins" | "Cards";
}

type SortField = "name" | "status" | "author" | "createdDate" | "updatedDate";
type SortDirection = "asc" | "desc" | null;

export default function TableView({
  items,
  selectedItems,
  onToggleSelect,
  onToggleSelectAll,
  onView,
  onEdit,
  onDelete,
  canEdit,
  canDelete,
  getItemId,
  getItemName,
  getItemStatus,
  getItemAuthor,
  getItemCreatedDate,
  getItemUpdatedDate,
  translationNamespace = "Dashboard",
}: TableViewProps) {
  const t = useTranslations(translationNamespace);
  const tStatus = useTranslations("Templates"); // Para las traducciones de estados

  // Estado para el ordenamiento
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  // Función para manejar el click en un header
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Si ya está ordenado por este campo, cambiar dirección o quitar ordenamiento
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      }
    } else {
      // Nuevo campo, ordenar ascendente
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Renderizar icono de ordenamiento
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />;
    }
    if (sortDirection === "asc") {
      return <ArrowUp className="h-3 w-3" />;
    }
    return <ArrowDown className="h-3 w-3" />;
  };

  // Ordenar items
  const sortedItems = [...items].sort((a, b) => {
    if (!sortField || !sortDirection) return 0;

    let aValue: any;
    let bValue: any;

    switch (sortField) {
      case "name":
        aValue = getItemName(a).toLowerCase();
        bValue = getItemName(b).toLowerCase();
        break;
      case "status":
        aValue = getItemStatus ? getItemStatus(a).toLowerCase() : "";
        bValue = getItemStatus ? getItemStatus(b).toLowerCase() : "";
        break;
      case "author":
        aValue = getItemAuthor ? getItemAuthor(a).toLowerCase() : "";
        bValue = getItemAuthor ? getItemAuthor(b).toLowerCase() : "";
        break;
      case "createdDate":
        aValue = a.log?.created_at ? new Date(a.log.created_at).getTime() : 0;
        bValue = b.log?.created_at ? new Date(b.log.created_at).getTime() : 0;
        break;
      case "updatedDate":
        aValue = a.log?.updated_at ? new Date(a.log.updated_at).getTime() : 0;
        bValue = b.log?.updated_at ? new Date(b.log.updated_at).getTime() : 0;
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const colorClasses = {
    blue: "text-blue-600 hover:text-blue-800",
    green: "text-[#606c38] hover:text-[#4a5429]",
    red: "text-red-600 hover:text-red-800",
  };

  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-3 text-left">
              <input
                type="checkbox"
                checked={selectedItems.length === items.length && items.length > 0}
                onChange={onToggleSelectAll}
                className="rounded border-gray-300 text-[#606c38] focus:ring-[#606c38]"
              />
            </th>
            <th 
              className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
              onClick={() => handleSort("name")}
            >
              <div className="flex items-center gap-1">
                {t("table.name")}
                {renderSortIcon("name")}
              </div>
            </th>
            {getItemStatus && (
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => handleSort("status")}
              >
                <div className="flex items-center gap-1">
                  {t("table.status")}
                  {renderSortIcon("status")}
                </div>
              </th>
            )}
            {getItemAuthor && (
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => handleSort("author")}
              >
                <div className="flex items-center gap-1">
                  {t("table.author")}
                  {renderSortIcon("author")}
                </div>
              </th>
            )}
            {getItemCreatedDate && (
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => handleSort("createdDate")}
              >
                <div className="flex items-center gap-1">
                  {t("table.createdDate")}
                  {renderSortIcon("createdDate")}
                </div>
              </th>
            )}
            {getItemUpdatedDate && (
              <th 
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors group"
                onClick={() => handleSort("updatedDate")}
              >
                <div className="flex items-center gap-1">
                  {t("table.updatedDate")}
                  {renderSortIcon("updatedDate")}
                </div>
              </th>
            )}
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              {t("table.actions")}
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {sortedItems.map((item) => {
            const itemId = getItemId(item);
            const status = getItemStatus ? getItemStatus(item) : null;
            const statusConfig = status ? getStatusBadgeConfig(status) : null;
            const showEdit = canEdit ? canEdit(item) : true;
            const showDelete = canDelete ? canDelete(item) : true;

            return (
              <tr key={itemId} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(itemId)}
                    onChange={() => onToggleSelect(itemId)}
                    className="rounded border-gray-300 text-[#606c38] focus:ring-[#606c38]"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-gray-900">
                    {getItemName(item)}
                  </div>
                </td>
                {getItemStatus && statusConfig && (
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full text-center ${statusConfig.bg} ${statusConfig.text}`}
                    >
                      {tStatus(statusConfig.translationKey) || status}
                    </span>
                  </td>
                )}
                {getItemAuthor && (
                  <td className="px-4 py-3 text-sm text-gray-500 hidden md:table-cell">
                    {getItemAuthor(item)}
                  </td>
                )}
                {getItemCreatedDate && (
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {getItemCreatedDate(item)}
                  </td>
                )}
                {getItemUpdatedDate && (
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {getItemUpdatedDate(item)}
                  </td>
                )}
                <td className="px-4 py-3 text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {onView && (
                      <button
                        onClick={() => onView(item)}
                        className={`${colorClasses.blue} p-1`}
                        title={t("table.view")}
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    )}
                    {onEdit && showEdit && (
                      <button
                        onClick={() => onEdit(item)}
                        className={`${colorClasses.green} p-1`}
                        title={t("table.edit")}
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                    )}
                    {onDelete && showDelete && (
                      <button
                        onClick={() => onDelete(item)}
                        className={`${colorClasses.red} p-1`}
                        title={t("table.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
