"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { BulletinStatus } from "@/types/bulletin";
import { searchField } from "./ui";

export const BULLETIN_STATUS_FILTERS: readonly BulletinStatus[] = [
  "draft",
  "pending_review",
  "review",
  "rejected",
  "published",
  "archived",
];

export const REVIEW_STATUS_FILTERS: readonly BulletinStatus[] = [
  "pending_review",
  "review",
  "rejected",
  "published",
];

interface BulletinFiltersProps {
  searchTerm: string;
  onSearchTermChange: (value: string) => void;
  selectedStatus: BulletinStatus | "all";
  onStatusChange: (status: BulletinStatus | "all") => void;
  statusOptions: readonly BulletinStatus[];
  className?: string;
}

export function BulletinFilters({
  searchTerm,
  onSearchTermChange,
  selectedStatus,
  onStatusChange,
  statusOptions,
  className = "space-y-4",
}: BulletinFiltersProps) {
  const t = useTranslations("Bulletins");

  const getStatusButtonClassName = (status: BulletinStatus | "all"): string => {
    const isSelected = selectedStatus === status;

    return `px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
      isSelected
        ? "bg-[#606c38] text-white"
        : "bg-white text-[#283618] border border-gray-200 hover:bg-gray-50"
    }`;
  };

  return (
    <div className={className}>
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[#283618]/50"
          aria-hidden="true"
        />
        <input
          type="search"
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          value={searchTerm}
          onChange={(event) => onSearchTermChange(event.target.value)}
          className={searchField}
        />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <span className="whitespace-nowrap text-sm font-medium text-[#283618]">
          {t("filterByStatus")}:
        </span>

        <button
          type="button"
          onClick={() => onStatusChange("all")}
          aria-pressed={selectedStatus === "all"}
          className={getStatusButtonClassName("all")}
        >
          {t("allStatuses")}
        </button>

        {statusOptions.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => onStatusChange(status)}
            aria-pressed={selectedStatus === status}
            className={getStatusButtonClassName(status)}
          >
            {t(`status.${status}`)}
          </button>
        ))}
      </div>
    </div>
  );
}
