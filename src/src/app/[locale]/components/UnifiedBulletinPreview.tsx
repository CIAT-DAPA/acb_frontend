"use client";

import React from "react";
import { CreateTemplateData } from "@/types/template";
import { Card } from "@/types/card";
import { ScrollConfig } from "@/types/templatePreview";
import { TemplatePreview } from "@/app/[locale]/templates/create/TemplatePreview";
import { ScrollView } from "@/app/[locale]/components/ScrollView";

type ElementClickType =
  | "section"
  | "block"
  | "field"
  | "header"
  | "footer"
  | "header_field"
  | "footer_field";

type UnifiedPreviewVariant = "single" | "full-scroll";

interface UnifiedBulletinPreviewProps {
  data: CreateTemplateData;
  variant?: UnifiedPreviewVariant;
  className?: string;
  renderForPrint?: boolean;
  cardsMetadata?: Record<string, Card>;
  cardsMetadataLoading?: boolean;
  scrollConfig?: ScrollConfig;
  initialSection?: number;
  allowSectionReorder?: boolean;
  onSectionOrderChange?: (order: number[]) => void;

  selectedSectionIndex?: number;
  sectionOrder?: number[];
  moreInfo?: boolean;
  description?: boolean;
  forceGlobalHeader?: boolean;
  currentPageIndex?: number;
  currentResolvedPageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
  onResolvedPageCount?: (pageCount: number) => void;
  hidePagination?: boolean;
  resolvedSectionPageCounts?: number[];
  reviewMode?: boolean;
  onElementClick?: (
    type: ElementClickType,
    id: string,
    e: React.MouseEvent,
  ) => void;
  selectedElementId?: string | null;
  commentCounts?: Record<string, number>;
}

export function UnifiedBulletinPreview({
  data,
  variant = "single",
  className,
  renderForPrint = false,
  cardsMetadata,
  cardsMetadataLoading = false,
  scrollConfig,
  initialSection = 0,
  allowSectionReorder = false,
  onSectionOrderChange,
  selectedSectionIndex = 0,
  sectionOrder,
  moreInfo = false,
  description = false,
  forceGlobalHeader = false,
  currentPageIndex,
  currentResolvedPageIndex,
  onPageChange,
  onResolvedPageCount,
  hidePagination = false,
  resolvedSectionPageCounts,
  reviewMode = false,
  onElementClick,
  selectedElementId,
  commentCounts,
}: UnifiedBulletinPreviewProps) {
  if (variant === "full-scroll") {
    return (
      <div className={className}>
        <ScrollView
          data={data}
          config={scrollConfig}
          initialSection={initialSection}
          cardsMetadata={cardsMetadata}
          cardsMetadataLoading={cardsMetadataLoading}
          renderForPrint={renderForPrint}
          sectionOrder={sectionOrder}
          allowSectionReorder={allowSectionReorder}
          onSectionOrderChange={onSectionOrderChange}
        />
      </div>
    );
  }

  return (
    <div className={className}>
      <TemplatePreview
        data={data}
        selectedSectionIndex={selectedSectionIndex}
        sectionOrder={sectionOrder}
        moreInfo={moreInfo}
        description={description}
        forceGlobalHeader={forceGlobalHeader}
        currentPageIndex={currentPageIndex}
        currentResolvedPageIndex={currentResolvedPageIndex}
        onPageChange={onPageChange}
        onResolvedPageCount={onResolvedPageCount}
        hidePagination={hidePagination}
        cardsMetadata={cardsMetadata}
        cardsMetadataLoading={cardsMetadataLoading}
        resolvedSectionPageCounts={resolvedSectionPageCounts}
        reviewMode={reviewMode}
        onElementClick={onElementClick}
        selectedElementId={selectedElementId}
        commentCounts={commentCounts}
        renderForPrint={renderForPrint}
      />
    </div>
  );
}
