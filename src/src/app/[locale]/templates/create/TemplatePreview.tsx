"use client";

import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { useTranslations, useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import { CreateTemplateData, Field, Section } from "../../../../types/template";
import { StyleConfig } from "../../../../types/core";
import { getEffectiveFieldStyles } from "../../../../utils/styleInheritance";
import { SmartIcon } from "../../components/AdaptiveSvgIcon";
import { Card } from "../../../../types/card";
import { CardAPIService } from "../../../../services/cardService";
import { RefreshCw } from "lucide-react";

// Mapeo de fuentes a variables CSS de Next.js
const FONT_CSS_VARS: Record<string, string> = {
  Poppins: "var(--font-poppins)",
  Roboto: "var(--font-roboto)",
  "Open Sans": "var(--font-open-sans)",
  Lato: "var(--font-lato)",
  Montserrat: "var(--font-montserrat)",
  "Archivo Narrow": "var(--font-archivo-narrow)",
  Arial: "Arial, sans-serif",
  Helvetica: "Helvetica, sans-serif",
  "Times New Roman": "'Times New Roman', serif",
  Georgia: "Georgia, serif",
};

// Helper para obtener el fontFamily correcto
function getFontFamily(font?: string): string {
  if (!font) return "Arial";
  return FONT_CSS_VARS[font] || font;
}

// Helper para obtener la clase Tailwind de justify-content
function getJustifyClass(justifyContent?: string): string {
  const justifyMap: Record<string, string> = {
    start: "justify-start",
    end: "justify-end",
    center: "justify-center",
    between: "justify-between",
    around: "justify-around",
    evenly: "justify-evenly",
  };
  return justifyMap[justifyContent || "start"] || "justify-start";
}

/**
 * Helper function para generar estilos de borde según los lados seleccionados
 */
function getBorderStyles(
  styleConfig: StyleConfig | undefined,
): React.CSSProperties {
  const styles: React.CSSProperties = {};

  // If no style config, return empty
  if (!styleConfig) return styles;

  if (styleConfig.border_radius) {
    styles.borderRadius = styleConfig.border_radius;
  }

  // If no border width and no border sides defined, return just radius
  if (!styleConfig.border_width && !styleConfig.border_sides) {
    return styles;
  }

  // Default width to 1px if sides are selected but no width specified
  const borderWidth =
    styleConfig.border_width || (styleConfig.border_sides ? "1px" : undefined);

  if (!borderWidth) return styles;

  const borderValue = `${borderWidth} ${
    styleConfig.border_style || "solid"
  } ${styleConfig.border_color || "#000000"}`;
  const borderSides = styleConfig.border_sides || "all";

  if (borderSides === "all") {
    styles.border = borderValue;
  } else {
    // Aplicar bordes individuales según los lados seleccionados
    const sides = borderSides.split(",").map((s) => s.trim());

    if (sides.includes("top")) styles.borderTop = borderValue;
    if (sides.includes("bottom")) styles.borderBottom = borderValue;
    if (sides.includes("left")) styles.borderLeft = borderValue;
    if (sides.includes("right")) styles.borderRight = borderValue;
  }

  return styles;
}

type OverflowSlice = {
  offset: number;
  height: number;
};

type PaginatedBlockPage = {
  blockIndexes: number[];
  blockSlices?: Record<number, OverflowSlice>;
  usedHeight: number;
};

type PaginatedFieldPage = {
  fieldIndexes: number[];
  fieldSlices?: Record<number, OverflowSlice>;
  listFieldItemPages?: Record<number, ListFieldItemPage>;
  usedHeight: number;
  includesPreviousBlockContext?: boolean;
};

type ListFieldItemPage = {
  itemIndexes: number[];
  itemSlices?: Record<number, OverflowSlice>;
};

type OverflowPageInfo = {
  blockIndexes: number[];
  blockSlices?: Record<number, OverflowSlice>;
  cardBlockPages?: Record<number, PaginatedBlockPage>;
  blockFieldPages?: Record<number, PaginatedFieldPage>;
};

type BlockMeasurement = {
  height: number;
  cardBlockHeights?: number[];
  cardStaticHeight?: number;
  fieldHeights?: number[];
  fieldStaticHeight?: number;
  listFieldItemHeights?: (number[] | undefined)[];
  listFieldStaticHeights?: (number | undefined)[];
  listFieldItemGapHeights?: (number | undefined)[];
};

type FieldOverflowContext = {
  cardBlockPage?: PaginatedBlockPage;
  listFieldPage?: ListFieldItemPage;
  measurementFieldIndex?: number;
};

type CompositePageDescriptor = {
  basePageIndex: number;
  overflowPageIndex: number;
};

function buildCardsCache(
  cardsMetadata?: Record<string, Card>,
): Map<string, Card> {
  const cache = new Map<string, Card>();

  if (!cardsMetadata) {
    return cache;
  }

  Object.values(cardsMetadata).forEach((card) => {
    if (card._id) {
      cache.set(card._id, card);
    }
  });

  return cache;
}

const normalizeCardTag = (value: unknown): string =>
  String(value ?? "")
    .trim()
    .toLowerCase();

const getAvailableCardIdsFromConfig = (
  fieldConfig: any,
  cardsCache: Map<string, Card>,
): string[] => {
  const configuredIds = Array.isArray(fieldConfig?.available_cards)
    ? fieldConfig.available_cards.filter(
        (id: unknown): id is string => typeof id === "string" && Boolean(id),
      )
    : [];

  const selectedTags = Array.isArray(fieldConfig?.available_tags)
    ? fieldConfig.available_tags
        .map((tag: unknown) => normalizeCardTag(tag))
        .filter(Boolean)
    : [];

  if (selectedTags.length === 0) {
    return Array.from(new Set(configuredIds));
  }

  const selectedTagSet = new Set(selectedTags);
  const idsByTags = Array.from(cardsCache.values())
    .filter(
      (card) =>
        Boolean(card._id) &&
        Array.isArray(card.tags) &&
        card.tags.some((tag) => selectedTagSet.has(normalizeCardTag(tag))),
    )
    .map((card) => card._id as string);

  return Array.from(new Set([...configuredIds, ...idsByTags]));
};

function getOverflowPages(
  blockMeasurements: BlockMeasurement[],
  availableHeight: number,
): OverflowPageInfo[] {
  const defaultPage: OverflowPageInfo = {
    blockIndexes: blockMeasurements.map((_, index) => index),
  };

  if (blockMeasurements.length === 0 || availableHeight <= 0) {
    return [defaultPage];
  }

  const paginateBlockHeights = (
    blockHeights: number[],
    firstPageAvailableHeight: number,
    fullPageAvailableHeight: number,
  ): PaginatedBlockPage[] => {
    if (blockHeights.length === 0 || fullPageAvailableHeight <= 0) {
      return [{ blockIndexes: [], usedHeight: 0 }];
    }

    const pages: PaginatedBlockPage[] = [];
    let currentBlockIndex = 0;
    let currentBlockOffset = 0;
    let previousCompletedBlockIndex: number | undefined;
    let isFirstPage = true;

    while (currentBlockIndex < blockHeights.length) {
      let availableHeightForPage = Math.max(
        isFirstPage ? firstPageAvailableHeight : fullPageAvailableHeight,
        0,
      );

      if (availableHeightForPage <= 0) {
        if (isFirstPage) {
          isFirstPage = false;
          continue;
        }
        break;
      }

      const pageBlockIndexes: number[] = [];
      const pageBlockSlices: Record<number, OverflowSlice> = {};
      let usedHeight = 0;

      if (!isFirstPage && previousCompletedBlockIndex !== undefined) {
        const previousBlockHeight = blockHeights[previousCompletedBlockIndex];

        if (previousBlockHeight < availableHeightForPage) {
          pageBlockIndexes.push(previousCompletedBlockIndex);
          availableHeightForPage -= previousBlockHeight;
          usedHeight += previousBlockHeight;
        }
      }

      while (
        currentBlockIndex < blockHeights.length &&
        availableHeightForPage > 0
      ) {
        const currentBlockHeight = blockHeights[currentBlockIndex];
        const remainingBlockHeight = Math.max(
          currentBlockHeight - currentBlockOffset,
          0,
        );

        if (remainingBlockHeight <= 0) {
          previousCompletedBlockIndex = currentBlockIndex;
          currentBlockIndex += 1;
          currentBlockOffset = 0;
          continue;
        }

        pageBlockIndexes.push(currentBlockIndex);

        if (remainingBlockHeight <= availableHeightForPage) {
          if (currentBlockOffset > 0) {
            pageBlockSlices[currentBlockIndex] = {
              offset: currentBlockOffset,
              height: remainingBlockHeight,
            };
          }

          availableHeightForPage -= remainingBlockHeight;
          usedHeight += remainingBlockHeight;
          previousCompletedBlockIndex = currentBlockIndex;
          currentBlockIndex += 1;
          currentBlockOffset = 0;
        } else {
          pageBlockSlices[currentBlockIndex] = {
            offset: currentBlockOffset,
            height: availableHeightForPage,
          };
          currentBlockOffset += availableHeightForPage;
          usedHeight += availableHeightForPage;
          availableHeightForPage = 0;
        }
      }

      pages.push({
        blockIndexes: [...new Set(pageBlockIndexes)],
        blockSlices:
          Object.keys(pageBlockSlices).length > 0 ? pageBlockSlices : undefined,
        usedHeight,
      });

      isFirstPage = false;
    }

    return pages.length > 0
      ? pages
      : [
          {
            blockIndexes: blockHeights.map((_, index) => index),
            usedHeight: 0,
          },
        ];
  };

  const paginateFieldHeights = (
    fieldHeights: number[],
    firstPageAvailableHeight: number,
    fullPageAvailableHeight: number,
    repeatedPreviousBlockHeight?: number,
    includePreviousBlockOnFirstPage = false,
    listFieldItemHeights?: (number[] | undefined)[],
    listFieldStaticHeights?: (number | undefined)[],
    listFieldItemGapHeights?: (number | undefined)[],
  ): PaginatedFieldPage[] => {
    if (fieldHeights.length === 0 || fullPageAvailableHeight <= 0) {
      return [{ fieldIndexes: [], usedHeight: 0 }];
    }

    const pages: PaginatedFieldPage[] = [];
    let currentFieldIndex = 0;
    let currentFieldOffset = 0;
    let currentListItemIndex = 0;
    let currentListItemOffset = 0;
    let isFirstPage = true;

    while (currentFieldIndex < fieldHeights.length) {
      let availableHeightForPage = Math.max(
        isFirstPage ? firstPageAvailableHeight : fullPageAvailableHeight,
        0,
      );
      let reservedPreviousBlockHeight = 0;
      const shouldReservePreviousBlock =
        repeatedPreviousBlockHeight !== undefined &&
        (isFirstPage ? includePreviousBlockOnFirstPage : true) &&
        repeatedPreviousBlockHeight < availableHeightForPage;

      if (shouldReservePreviousBlock) {
        reservedPreviousBlockHeight = repeatedPreviousBlockHeight;
        availableHeightForPage -= repeatedPreviousBlockHeight;
      }

      if (availableHeightForPage <= 0) {
        if (isFirstPage) {
          isFirstPage = false;
          continue;
        }
        break;
      }

      const pageFieldIndexes: number[] = [];
      const pageFieldSlices: Record<number, OverflowSlice> = {};
      const pageListFieldItemPages: Record<number, ListFieldItemPage> = {};
      let usedFieldHeight = 0;

      while (
        currentFieldIndex < fieldHeights.length &&
        availableHeightForPage > 0
      ) {
        const currentFieldHeight = fieldHeights[currentFieldIndex];
        const currentListItems = listFieldItemHeights?.[currentFieldIndex];
        const isListField =
          Array.isArray(currentListItems) && currentListItems.length > 0;

        if (isListField) {
          const normalizedItemHeights = currentListItems;
          const listItemGapHeight = Math.max(
            listFieldItemGapHeights?.[currentFieldIndex] ?? 0,
            0,
          );
          const inferredTotalGapHeight =
            normalizedItemHeights.length > 1
              ? listItemGapHeight * (normalizedItemHeights.length - 1)
              : 0;
          const inferredStaticHeight = Math.max(
            currentFieldHeight -
              normalizedItemHeights.reduce(
                (totalHeight, itemHeight) =>
                  totalHeight + Math.max(itemHeight, 0),
                0,
              ) -
              inferredTotalGapHeight,
            0,
          );
          const listStaticHeight = Math.max(
            listFieldStaticHeights?.[currentFieldIndex] ?? inferredStaticHeight,
            0,
          );

          if (availableHeightForPage > listStaticHeight) {
            let availableHeightForItems =
              availableHeightForPage - listStaticHeight;
            const pageItemIndexes: number[] = [];
            const pageItemSlices: Record<number, OverflowSlice> = {};
            let usedItemsHeight = 0;

            while (
              currentListItemIndex < normalizedItemHeights.length &&
              availableHeightForItems > 0
            ) {
              const currentItemHeight = Math.max(
                normalizedItemHeights[currentListItemIndex] || 0,
                0,
              );
              const remainingItemHeight = Math.max(
                currentItemHeight - currentListItemOffset,
                0,
              );
              const gapBeforeCurrentItem =
                currentListItemOffset === 0 && pageItemIndexes.length > 0
                  ? listItemGapHeight
                  : 0;
              const requiredItemHeight =
                remainingItemHeight + gapBeforeCurrentItem;

              if (remainingItemHeight <= 0) {
                currentListItemIndex += 1;
                currentListItemOffset = 0;
                continue;
              }

              if (requiredItemHeight <= availableHeightForItems) {
                pageItemIndexes.push(currentListItemIndex);

                if (currentListItemOffset > 0) {
                  pageItemSlices[currentListItemIndex] = {
                    offset: currentListItemOffset,
                    height: remainingItemHeight,
                  };
                }

                availableHeightForItems -= requiredItemHeight;
                usedItemsHeight += requiredItemHeight;
                currentListItemIndex += 1;
                currentListItemOffset = 0;
                continue;
              }

              const shouldMoveCurrentItemToNextPage =
                currentListItemOffset === 0 && pageItemIndexes.length > 0;
              const shouldMoveWholeListToNextPage =
                currentListItemOffset === 0 &&
                pageItemIndexes.length === 0 &&
                pageFieldIndexes.length > 0;

              if (
                shouldMoveCurrentItemToNextPage ||
                shouldMoveWholeListToNextPage
              ) {
                break;
              }

              pageItemIndexes.push(currentListItemIndex);
              pageItemSlices[currentListItemIndex] = {
                offset: currentListItemOffset,
                height: availableHeightForItems,
              };
              currentListItemOffset += availableHeightForItems;
              usedItemsHeight += availableHeightForItems;
              availableHeightForItems = 0;
            }

            if (pageItemIndexes.length > 0) {
              pageFieldIndexes.push(currentFieldIndex);
              pageListFieldItemPages[currentFieldIndex] = {
                itemIndexes: [...new Set(pageItemIndexes)],
                itemSlices:
                  Object.keys(pageItemSlices).length > 0
                    ? pageItemSlices
                    : undefined,
              };

              usedFieldHeight += listStaticHeight + usedItemsHeight;
              availableHeightForPage = availableHeightForItems;

              if (
                currentListItemIndex >= normalizedItemHeights.length &&
                currentListItemOffset === 0
              ) {
                currentFieldIndex += 1;
                currentFieldOffset = 0;
                currentListItemIndex = 0;
                currentListItemOffset = 0;
                continue;
              }

              break;
            }

            if (pageFieldIndexes.length > 0) {
              break;
            }
          } else if (pageFieldIndexes.length > 0) {
            break;
          }
        }

        const remainingFieldHeight = Math.max(
          currentFieldHeight - currentFieldOffset,
          0,
        );

        if (remainingFieldHeight <= 0) {
          currentFieldIndex += 1;
          currentFieldOffset = 0;
          currentListItemIndex = 0;
          currentListItemOffset = 0;
          continue;
        }

        if (remainingFieldHeight <= availableHeightForPage) {
          pageFieldIndexes.push(currentFieldIndex);

          if (currentFieldOffset > 0) {
            pageFieldSlices[currentFieldIndex] = {
              offset: currentFieldOffset,
              height: remainingFieldHeight,
            };
          }

          availableHeightForPage -= remainingFieldHeight;
          usedFieldHeight += remainingFieldHeight;
          currentFieldIndex += 1;
          currentFieldOffset = 0;
          currentListItemIndex = 0;
          currentListItemOffset = 0;
          continue;
        }

        const shouldMoveToNextPage =
          currentFieldOffset === 0 && pageFieldIndexes.length > 0;

        if (shouldMoveToNextPage) {
          break;
        }

        pageFieldIndexes.push(currentFieldIndex);
        pageFieldSlices[currentFieldIndex] = {
          offset: currentFieldOffset,
          height: availableHeightForPage,
        };
        currentFieldOffset += availableHeightForPage;
        usedFieldHeight += availableHeightForPage;
        availableHeightForPage = 0;
      }

      const hasPageContent =
        pageFieldIndexes.length > 0 || Object.keys(pageFieldSlices).length > 0;

      if (!hasPageContent && currentFieldIndex < fieldHeights.length) {
        const fallbackRemainingHeight = Math.max(
          fieldHeights[currentFieldIndex] - currentFieldOffset,
          0,
        );
        const fallbackHeight = Math.min(
          Math.max(availableHeightForPage, 0),
          fallbackRemainingHeight,
        );

        if (fallbackHeight > 0) {
          pageFieldIndexes.push(currentFieldIndex);
          pageFieldSlices[currentFieldIndex] = {
            offset: currentFieldOffset,
            height: fallbackHeight,
          };
          currentFieldOffset += fallbackHeight;
          usedFieldHeight += fallbackHeight;
        } else {
          currentFieldIndex += 1;
          currentFieldOffset = 0;
          currentListItemIndex = 0;
          currentListItemOffset = 0;
        }
      }

      const hasListFieldItemPages =
        Object.keys(pageListFieldItemPages).length > 0;

      pages.push({
        fieldIndexes: [...new Set(pageFieldIndexes)],
        fieldSlices:
          Object.keys(pageFieldSlices).length > 0 ? pageFieldSlices : undefined,
        listFieldItemPages: hasListFieldItemPages
          ? pageListFieldItemPages
          : undefined,
        usedHeight: usedFieldHeight + reservedPreviousBlockHeight,
        includesPreviousBlockContext: shouldReservePreviousBlock,
      });

      isFirstPage = false;
    }

    return pages.length > 0
      ? pages
      : [
          {
            fieldIndexes: fieldHeights.map((_, index) => index),
            usedHeight: 0,
          },
        ];
  };

  const pages: OverflowPageInfo[] = [];
  let currentPageBlocks: number[] = [];
  let currentHeight = 0;

  blockMeasurements.forEach((blockMeasurement, blockIndex) => {
    const blockHeight = blockMeasurement.height;
    const fitsOnCurrentPage = currentHeight + blockHeight <= availableHeight;

    if (fitsOnCurrentPage) {
      currentPageBlocks.push(blockIndex);
      currentHeight += blockHeight;
      return;
    }

    if (blockMeasurement.cardBlockHeights?.length) {
      const remainingSpace = Math.max(availableHeight - currentHeight, 0);
      const cardStaticHeight = Math.max(
        blockMeasurement.cardStaticHeight || 0,
        0,
      );
      const shouldShareCurrentPage =
        currentPageBlocks.length > 0 && remainingSpace > cardStaticHeight;
      const cardPages = paginateBlockHeights(
        blockMeasurement.cardBlockHeights,
        Math.max(
          (shouldShareCurrentPage ? remainingSpace : availableHeight) -
            cardStaticHeight,
          0,
        ),
        Math.max(availableHeight - cardStaticHeight, 0),
      );

      if (shouldShareCurrentPage) {
        const [firstCardPage, ...remainingCardPages] = cardPages;

        pages.push({
          blockIndexes: [...currentPageBlocks, blockIndex],
          cardBlockPages: {
            [blockIndex]: firstCardPage,
          },
        });

        remainingCardPages.forEach((cardPage) => {
          pages.push({
            blockIndexes: [blockIndex],
            cardBlockPages: {
              [blockIndex]: cardPage,
            },
          });
        });
      } else {
        if (currentPageBlocks.length > 0) {
          pages.push({ blockIndexes: [...currentPageBlocks] });
        }

        cardPages.forEach((cardPage) => {
          pages.push({
            blockIndexes: [blockIndex],
            cardBlockPages: {
              [blockIndex]: cardPage,
            },
          });
        });
      }

      currentPageBlocks = [];
      currentHeight = 0;
      return;
    }

    if (blockMeasurement.fieldHeights?.length) {
      const previousBlockIndex =
        currentPageBlocks[currentPageBlocks.length - 1];
      const previousBlockHeight =
        previousBlockIndex !== undefined
          ? blockMeasurements[previousBlockIndex]?.height || 0
          : 0;
      const fieldStaticHeight = Math.max(
        blockMeasurement.fieldStaticHeight || 0,
        0,
      );
      const remainingSpace = Math.max(availableHeight - currentHeight, 0);
      const currentPageFieldCapacity = Math.max(
        remainingSpace - fieldStaticHeight - OVERFLOW_SAFETY_MARGIN_PX,
        0,
      );
      const fullPageFieldCapacity = Math.max(
        availableHeight - fieldStaticHeight - OVERFLOW_SAFETY_MARGIN_PX,
        0,
      );
      const firstMeasuredFieldIndex = blockMeasurement.fieldHeights.findIndex(
        (height) => height > 0,
      );
      let firstMeasuredFieldHeight = 0;

      if (firstMeasuredFieldIndex >= 0) {
        const firstFieldHeight =
          blockMeasurement.fieldHeights[firstMeasuredFieldIndex] || 0;
        const firstFieldListItems =
          blockMeasurement.listFieldItemHeights?.[firstMeasuredFieldIndex];

        if (
          Array.isArray(firstFieldListItems) &&
          firstFieldListItems.length > 0
        ) {
          const firstItemHeight = Math.max(
            firstFieldListItems.find((height) => height > 0) || 0,
            0,
          );
          const firstFieldGapHeight = Math.max(
            blockMeasurement.listFieldItemGapHeights?.[
              firstMeasuredFieldIndex
            ] ?? 0,
            0,
          );
          const inferredTotalGapHeight =
            firstFieldListItems.length > 1
              ? firstFieldGapHeight * (firstFieldListItems.length - 1)
              : 0;
          const inferredStaticHeight = Math.max(
            firstFieldHeight -
              firstFieldListItems.reduce(
                (totalHeight, itemHeight) =>
                  totalHeight + Math.max(itemHeight, 0),
                0,
              ) -
              inferredTotalGapHeight,
            0,
          );
          const firstFieldStaticHeight = Math.max(
            blockMeasurement.listFieldStaticHeights?.[
              firstMeasuredFieldIndex
            ] ?? inferredStaticHeight,
            0,
          );

          firstMeasuredFieldHeight = firstFieldStaticHeight + firstItemHeight;
        } else {
          firstMeasuredFieldHeight = firstFieldHeight;
        }
      }
      const canFitWholeFieldOnCurrentPage =
        firstMeasuredFieldHeight === 0 ||
        firstMeasuredFieldHeight <= currentPageFieldCapacity;
      const shouldShareCurrentPage =
        currentPageBlocks.length > 0 &&
        currentPageFieldCapacity > 0 &&
        canFitWholeFieldOnCurrentPage;
      const firstPageFieldCapacity = shouldShareCurrentPage
        ? currentPageFieldCapacity
        : fullPageFieldCapacity;

      if (fullPageFieldCapacity <= 0) {
        // Fallback: cuando el overhead del bloque no permite paginación por field,
        // usar la lógica legacy de slicing por bloque para evitar perder contenido.
      } else {
        const canRepeatPreviousBlock =
          previousBlockIndex !== undefined &&
          previousBlockHeight < availableHeight;
        const includePreviousBlockOnFirstFieldPage =
          canRepeatPreviousBlock && !shouldShareCurrentPage;

        const fieldPages = paginateFieldHeights(
          blockMeasurement.fieldHeights,
          firstPageFieldCapacity,
          fullPageFieldCapacity,
          canRepeatPreviousBlock ? previousBlockHeight : undefined,
          includePreviousBlockOnFirstFieldPage,
          blockMeasurement.listFieldItemHeights,
          blockMeasurement.listFieldStaticHeights,
          blockMeasurement.listFieldItemGapHeights,
        );

        if (shouldShareCurrentPage) {
          const [firstFieldPage, ...remainingFieldPages] = fieldPages;

          pages.push({
            blockIndexes: [...currentPageBlocks, blockIndex],
            blockFieldPages: {
              [blockIndex]: firstFieldPage,
            },
          });

          remainingFieldPages.forEach((fieldPage) => {
            const shouldIncludePreviousBlock =
              canRepeatPreviousBlock &&
              fieldPage.includesPreviousBlockContext &&
              previousBlockIndex !== undefined;

            pages.push({
              blockIndexes: shouldIncludePreviousBlock
                ? [previousBlockIndex, blockIndex]
                : [blockIndex],
              blockFieldPages: {
                [blockIndex]: fieldPage,
              },
            });
          });
        } else {
          if (currentPageBlocks.length > 0) {
            pages.push({ blockIndexes: [...currentPageBlocks] });
          }

          fieldPages.forEach((fieldPage) => {
            const shouldIncludePreviousBlock =
              canRepeatPreviousBlock &&
              fieldPage.includesPreviousBlockContext &&
              previousBlockIndex !== undefined;

            pages.push({
              blockIndexes: shouldIncludePreviousBlock
                ? [previousBlockIndex, blockIndex]
                : [blockIndex],
              blockFieldPages: {
                [blockIndex]: fieldPage,
              },
            });
          });
        }

        currentPageBlocks = [];
        currentHeight = 0;
        return;
      }
    }

    const previousBlockIndex = currentPageBlocks[currentPageBlocks.length - 1];
    const remainingSpace = Math.max(availableHeight - currentHeight, 0);
    let remainingHeight = blockHeight;
    let sliceOffset = 0;

    if (currentPageBlocks.length > 0) {
      if (remainingSpace > 0) {
        const firstSliceHeight = Math.min(remainingHeight, remainingSpace);

        pages.push({
          blockIndexes: [...currentPageBlocks, blockIndex],
          blockSlices: {
            [blockIndex]: {
              offset: sliceOffset,
              height: firstSliceHeight,
            },
          },
        });

        remainingHeight -= firstSliceHeight;
        sliceOffset += firstSliceHeight;
      } else {
        pages.push({ blockIndexes: [...currentPageBlocks] });
      }
    }

    while (remainingHeight > 0) {
      let sliceAvailableHeight = availableHeight;
      const nextPageBlocks: number[] = [];

      if (previousBlockIndex !== undefined) {
        const previousBlockHeight =
          blockMeasurements[previousBlockIndex]?.height || 0;

        if (previousBlockHeight < sliceAvailableHeight) {
          nextPageBlocks.push(previousBlockIndex);
          sliceAvailableHeight -= previousBlockHeight;
        }
      }

      if (sliceAvailableHeight <= 0) {
        nextPageBlocks.length = 0;
        sliceAvailableHeight = availableHeight;
      }

      const sliceHeight = Math.min(remainingHeight, sliceAvailableHeight);

      pages.push({
        blockIndexes: [...nextPageBlocks, blockIndex],
        blockSlices: {
          [blockIndex]: {
            offset: sliceOffset,
            height: sliceHeight,
          },
        },
      });

      remainingHeight -= sliceHeight;
      sliceOffset += sliceHeight;
    }

    currentPageBlocks = [];
    currentHeight = 0;
  });

  if (currentPageBlocks.length > 0) {
    pages.push({ blockIndexes: [...currentPageBlocks] });
  }

  return pages.length > 0 ? pages : [defaultPage];
}

function getCompositePageDescriptor(
  pageSizes: number[],
  compositePageIndex: number,
): CompositePageDescriptor {
  let remainingPages = compositePageIndex;

  for (let pageIndex = 0; pageIndex < pageSizes.length; pageIndex++) {
    const pageSize = Math.max(pageSizes[pageIndex] || 1, 1);

    if (remainingPages < pageSize) {
      return {
        basePageIndex: pageIndex,
        overflowPageIndex: remainingPages,
      };
    }

    remainingPages -= pageSize;
  }

  const lastBasePageIndex = Math.max(pageSizes.length - 1, 0);
  const lastPageSize = Math.max(pageSizes[lastBasePageIndex] || 1, 1);

  return {
    basePageIndex: lastBasePageIndex,
    overflowPageIndex: lastPageSize - 1,
  };
}

interface TemplatePreviewProps {
  data: CreateTemplateData;
  selectedSectionIndex?: number;
  moreInfo?: boolean;
  description?: boolean;
  forceGlobalHeader?: boolean; // Forzar uso del header global en lugar del header de sección
  currentPageIndex?: number; // Control externo del índice base de página
  currentResolvedPageIndex?: number; // Control externo del índice real de página dentro de la sección
  onPageChange?: (pageIndex: number) => void; // Callback cuando cambia la página
  onResolvedPageCount?: (pageCount: number) => void; // Callback cuando se resuelve el total real de páginas de la sección
  hidePagination?: boolean; // Ocultar controles de paginación
  cardsMetadata?: Record<string, Card>; // Diccionario de cards precargadas para evitar HTTP calls
  cardsMetadataLoading?: boolean; // Indica que un contenedor padre está precargando cards
  resolvedSectionPageCounts?: number[]; // Cantidad de páginas reales por sección para page numbers globales
  reviewMode?: boolean;
  onElementClick?: (
    type:
      | "section"
      | "block"
      | "field"
      | "header"
      | "footer"
      | "header_field"
      | "footer_field",
    id: string,
    e: React.MouseEvent,
  ) => void;
  selectedElementId?: string | null;
  commentCounts?: Record<string, number>;
}

// Constantes para estilos repetidos
const PLACEHOLDER_CONTAINER_CLASS =
  "flex items-center justify-center bg-gray-100 border border-gray-300 rounded";
const PLACEHOLDER_TEXT_CLASS = "text-gray-400 text-sm";
const PAGINATION_BUTTON_CLASS =
  "px-4 py-2 bg-[#283618] text-white rounded-md disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-[#283618]/90 transition-colors";
const OVERFLOW_SAFETY_MARGIN_PX = 4;

export function TemplatePreview({
  data,
  selectedSectionIndex = 0,
  moreInfo = false,
  description = false,
  forceGlobalHeader = false,
  currentPageIndex: externalPageIndex,
  onPageChange,
  currentResolvedPageIndex,
  onResolvedPageCount,
  hidePagination = false,
  cardsMetadata,
  cardsMetadataLoading = false,
  resolvedSectionPageCounts,
  reviewMode = false,
  onElementClick,
  selectedElementId,
  commentCounts,
}: TemplatePreviewProps) {
  const t = useTranslations("CreateTemplate.preview");
  const pathname = usePathname();

  // Helper para renderizar el badge de comentarios
  const renderCommentBadge = (elementId: string) => {
    const count = commentCounts?.[elementId];
    if (!count || count <= 0) return null;

    return (
      <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-md z-30 ring-1 ring-white">
        {count > 9 ? "9+" : count}
      </div>
    );
  };

  const hookLocale = useLocale();

  // Extraer el locale actual del pathname como backup (igual que LanguageSelector)
  const pathnameLocale = pathname.split("/")[1];

  // Usar el locale del pathname si está disponible, sino el del hook
  const locale = ["es", "en"].includes(pathnameLocale)
    ? pathnameLocale
    : hookLocale;

  // Código de locale para formateo de fechas
  const localeCode = locale === "es" ? "es-ES" : "en-US";

  // Estado para almacenar las cards cargadas
  const [cardsCache, setCardsCache] = useState<Map<string, Card>>(new Map());
  const [cardsLoadingError, setCardsLoadingError] = useState(false);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const hasProvidedCardsMetadata = Boolean(
    cardsMetadata && Object.keys(cardsMetadata).length > 0,
  );
  const resolvedCardsCache = useMemo(() => {
    if (hasProvidedCardsMetadata) {
      return buildCardsCache(cardsMetadata);
    }

    return cardsCache;
  }, [cardsCache, cardsMetadata, hasProvidedCardsMetadata]);

  // Estado para controlar la página actual (para paginación de listas)
  const [internalPageIndex, setInternalPageIndex] = useState(0);

  // Usar el índice externo si está disponible, sino usar el interno
  const currentPageIndex =
    externalPageIndex !== undefined ? externalPageIndex : internalPageIndex;

  const [overflowPagesByBasePage, setOverflowPagesByBasePage] = useState<
    OverflowPageInfo[][]
  >([]);
  const [currentOverflowPageIndex, setCurrentOverflowPageIndex] = useState(0);
  const [isMeasuringOverflow, setIsMeasuringOverflow] = useState(false);
  const [measurementBasePageIndex, setMeasurementBasePageIndex] = useState(0);

  const headerMeasureRef = useRef<HTMLDivElement | null>(null);
  const footerMeasureRef = useRef<HTMLDivElement | null>(null);
  const blockMeasureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pendingOverflowPageRef = useRef<number | null>(null);
  const previousMeasuredSectionIdRef = useRef<string | null>(null);
  const previousBasePageIndexRef = useRef(0);
  const overflowCollapseTimeoutRef = useRef<number | null>(null);

  // Función para cambiar de página
  const handlePageChange = (newPageIndex: number) => {
    if (onPageChange) {
      onPageChange(newPageIndex);
    } else {
      setInternalPageIndex(newPageIndex);
    }
  };

  // Cargar todas las cards necesarias
  useEffect(() => {
    let isMounted = true;
    setCardsLoadingError(false);

    if (cardsMetadataLoading || hasProvidedCardsMetadata) {
      return () => {
        isMounted = false;
      };
    }

    const loadCards = async (retryCount = 0) => {
      try {
        // Si no hay cardsMetadata, hacer el fetch tradicional
        const response = await CardAPIService.getCards();
        if (response.success && response.data) {
          const cache = new Map<string, Card>();
          response.data.forEach((card) => {
            if (card._id) {
              cache.set(card._id, card);
            }
          });
          if (isMounted) {
            setCardsCache(cache);
            setCardsLoadingError(false);
          }
        } else {
          throw new Error(response.message || "Failed to load cards");
        }
      } catch (error) {
        console.error(
          `Error loading cards (attempt ${retryCount + 1}):`,
          error,
        );

        if (isMounted) {
          if (retryCount < 3) {
            // Retry with exponential backoff
            const timeout = Math.pow(2, retryCount) * 1000;
            setTimeout(() => loadCards(retryCount + 1), timeout);
          } else {
            setCardsLoadingError(true);
          }
        }
      }
    };

    loadCards();

    return () => {
      isMounted = false;
    };
  }, [cardsMetadataLoading, hasProvidedCardsMetadata, retryTrigger]);

  const styleConfig = data.version.content.style_config;
  const headerConfig = data.version.content.header_config;
  const footerConfig = data.version.content.footer_config;
  const sections = data.version.content.sections;

  // Estilos globales aplicados
  const globalStyles = {
    fontFamily: getFontFamily(styleConfig?.font),
    color: styleConfig?.primary_color || "#000000",
    fontSize: `${styleConfig?.font_size || 16}px`,
    lineHeight: styleConfig?.line_height || "normal",
    backgroundColor: styleConfig?.background_color || "#ffffff",
    textAlign:
      (styleConfig?.text_align as "left" | "center" | "right") || "left",
  };

  // Helper para construir URL completa de imagen
  const getBackgroundImageUrl = (imageUrl: string) => {
    // Si ya es una URL completa, devolverla tal como está (codificada)
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      // Codificar espacios y caracteres especiales en la URL
      return imageUrl
        .split("/")
        .map((part, index) => {
          // No codificar el protocolo (http: o https:)
          if (index < 3) return part;
          return encodeURIComponent(part);
        })
        .join("/");
    }

    // Si es una ruta relativa, construir URL completa y codificar
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    let cleanUrl = imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`;

    // Fix for runtime uploaded assets
    if (
      cleanUrl.startsWith("/assets/thumbnails/") ||
      cleanUrl.startsWith("/assets/img/visualResources/")
    ) {
      cleanUrl = cleanUrl.replace("/assets/", "/api/dynamic-assets/");
    }

    // Codificar cada parte del path (excepto las barras)
    const encodedPath = cleanUrl
      .split("/")
      .map((part) => encodeURIComponent(part))
      .join("/");

    return `${baseUrl}${encodedPath}`;
  };

  // Helper para parsear fechas como locales
  const parseLocalDate = (date: string | Date): Date => {
    if (typeof date !== "string") return date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-").map(Number);
      return new Date(year, month - 1, day);
    }
    return new Date(date);
  };

  // Helper function to format dates according to field configuration
  const formatDateValue = (date: Date | string, format: string): string => {
    const dateObj = parseLocalDate(date);

    if (isNaN(dateObj.getTime())) {
      return t("invalidDate");
    }

    const day = dateObj.getDate().toString().padStart(2, "0");
    const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
    const year = dateObj.getFullYear();
    const shortYear = year.toString().slice(-2);

    const dayName = dateObj.toLocaleDateString(localeCode, { weekday: "long" });
    const dayNameCapitalized =
      dayName.charAt(0).toUpperCase() + dayName.slice(1);

    const monthName = dateObj.toLocaleDateString(localeCode, { month: "long" });
    const monthNameCapitalized =
      monthName.charAt(0).toUpperCase() + monthName.slice(1);

    switch (format) {
      case "DD/MM/YYYY":
        return `${day}/${month}/${year}`;
      case "MM/DD/YYYY":
        return `${month}/${day}/${year}`;
      case "DD-MM-YYYY":
        return `${day}-${month}-${year}`;
      case "dddd, DD - MM":
        return `${dayNameCapitalized}, ${day} - ${month}`;
      case "DD, MMMM YYYY":
        return `${day}, ${monthNameCapitalized} ${year}`;
      case "DD de MMMM":
        return `${day} de ${monthNameCapitalized}`;
      case "MMMM/YY":
        return `${monthNameCapitalized}/${shortYear}`;
      case "YYYY-MM-DD":
      default:
        return `${year}-${month}-${day}`;
    }
  };

  // Helper function to render field values safely
  const renderFieldValue = (value: Field["value"], field?: Field): string => {
    if (!value) return "";
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      return String(value);
    }
    if (value instanceof Date) {
      // Si es un campo de fecha y tiene configuración de formato, usarla
      if (field?.type === "date" && field.field_config?.date_format) {
        return formatDateValue(value, field.field_config.date_format);
      }
      return value.toLocaleDateString(localeCode);
    }
    if (Array.isArray(value)) {
      return value.join(", ");
    }
    return "";
  };

  const renderField = (
    field: Field,
    key: string | number,
    containerStyle?: StyleConfig,
    layout: "vertical" | "horizontal" = "vertical",
    pageInfo?: { currentPage: number; totalPages: number },
    fieldId?: string,
    overflowContext?: FieldOverflowContext,
  ) => {
    // Usar herencia de estilos
    const effectiveStyles = getEffectiveFieldStyles(field, containerStyle);

    const fieldStyles = {
      ...globalStyles,
      color: effectiveStyles.primary_color || globalStyles.color,
      fontSize: effectiveStyles.font_size
        ? `${effectiveStyles.font_size}px`
        : globalStyles.fontSize,
      fontWeight: effectiveStyles.font_weight || "400",
      lineHeight:
        effectiveStyles.line_height || globalStyles.lineHeight || "normal",
      fontStyle: effectiveStyles.font_style || "normal",
      textDecoration: effectiveStyles.text_decoration || "none",
      textAlign:
        (effectiveStyles.text_align as "left" | "center" | "right") ||
        globalStyles.textAlign,
      fontFamily: effectiveStyles.font
        ? getFontFamily(effectiveStyles.font)
        : globalStyles.fontFamily,
      backgroundColor: effectiveStyles.background_color || "transparent",
      backgroundImage: effectiveStyles.background_image
        ? `url("${getBackgroundImageUrl(effectiveStyles.background_image)}")`
        : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      padding: effectiveStyles.padding,
      margin: effectiveStyles.margin,
      gap: effectiveStyles.gap,
      // alignItems is handled specifically in fields like List where it makes sense
      iconSize: effectiveStyles.icon_size, // Propiedad personalizada para referencia
      ...getBorderStyles(effectiveStyles),
    };

    switch (field.type) {
      case "text":
        // Mostrar el valor si existe, sino mostrar placeholder
        const textValue = field.value
          ? renderFieldValue(field.value)
          : field.display_name || field.label || "Campo de texto";

        return (
          <div key={key} style={fieldStyles}>
            {textValue}
          </div>
        );

      case "text_with_icon":
        // El valor puede ser un string o un objeto {text, icon}
        let textWithIconValue = "";
        let iconFromValue = null;

        if (field.value) {
          if (typeof field.value === "object" && "text" in field.value) {
            // Es un objeto {text, icon} - usado en listas
            textWithIconValue = (field.value as any).text || "";
            iconFromValue = (field.value as any).icon || null;
          } else {
            // Es un string simple
            textWithIconValue = renderFieldValue(field.value);
          }
        } else {
          textWithIconValue = field.label || "Texto con icono";
        }

        // Obtener el icono: primero del valor (en listas), luego del field_config, o fallback
        const selectedIcon =
          iconFromValue ||
          (field.field_config as any)?.selected_icon ||
          (field.field_config?.icon_options &&
          field.field_config.icon_options.length > 0
            ? field.field_config.icon_options[0]
            : null);

        const iconSize = effectiveStyles.icon_size || 24;
        const useOriginalColor =
          effectiveStyles.icon_use_original_color === true;

        // Verificar si se debe mostrar el label
        const showTextLabel = (field.field_config as any)?.showLabel ?? true;

        // Si form=true y showLabel=true, mostrar "label: value"
        // Si form=false y showLabel=true, mostrar solo "label" antes del icono
        const displayLabel = showTextLabel
          ? field.label || field.display_name
          : null;

        return (
          <div
            key={key}
            style={fieldStyles}
            className="flex items-center gap-2"
          >
            {/* Icono - siempre se muestra (configurado desde el template o del valor) */}
            {selectedIcon ? (
              selectedIcon.startsWith("http") ||
              selectedIcon.startsWith("/") ? (
                <SmartIcon
                  src={selectedIcon}
                  style={{
                    width: `${iconSize}px`,
                    height: `${iconSize}px`, // Asegurar altura igual al ancho
                  }}
                  color={useOriginalColor ? undefined : fieldStyles.color}
                  preserveOriginalColors={useOriginalColor}
                  alt="Icon"
                />
              ) : (
                <span style={{ fontSize: `${iconSize}px` }}>
                  {selectedIcon}
                </span>
              )
            ) : (
              <span style={{ fontSize: `${iconSize}px` }}>📄</span>
            )}

            {/* Label y valor */}
            {displayLabel && field.form ? (
              // Cuando form=true y showLabel=true: "label: value"
              <span>
                {displayLabel}: {textWithIconValue}
              </span>
            ) : (
              // Cuando form=false o showLabel=false
              <>
                {displayLabel && <span>{displayLabel}:</span>}
                <span>{textWithIconValue}</span>
              </>
            )}
          </div>
        );

      case "select_with_icons":
        // Mostrar el icono seleccionado si existe valor, sino mostrar placeholder
        let iconToShow = null;
        let labelToShow = null;

        const selectOptions = (field.field_config as any)?.options || [];
        const selectIconsUrl = (field.field_config as any)?.icons_url || [];

        if (field.value) {
          // Buscar el icono correspondiente al valor seleccionado
          const selectedIndex = selectOptions.findIndex(
            (opt: string) => opt === field.value,
          );
          if (selectedIndex !== -1) {
            iconToShow = selectIconsUrl[selectedIndex] || null;
            labelToShow = selectOptions[selectedIndex];
          }
        } else {
          // Si no hay valor seleccionado, mostrar placeholder (primer icono)
          if (selectOptions.length > 0) {
            iconToShow = selectIconsUrl[0] || null;
            labelToShow = selectOptions[0];
          }
        }

        // Mapear text-align a justify-content
        const selectTextAlign = effectiveStyles.text_align || "center";
        const justifyClass =
          selectTextAlign === "left"
            ? "justify-start"
            : selectTextAlign === "right"
              ? "justify-end"
              : "justify-center";

        const selectIconSize = (field.style_config as any)?.icon_size || 32;
        const showLabel = (field.field_config as any)?.show_label !== false;
        const selectUseOriginalColor =
          effectiveStyles.icon_use_original_color === true;

        return (
          <div
            key={key}
            style={{ ...fieldStyles, display: "flex", gap: "8px" }}
            className={`flex items-center gap-2 ${justifyClass}`}
          >
            {iconToShow ? (
              <SmartIcon
                src={iconToShow}
                style={{
                  width: `${selectIconSize}px`,
                  height: `${selectIconSize}px`,
                }}
                color={
                  selectUseOriginalColor
                    ? undefined
                    : effectiveStyles.primary_color || fieldStyles.color
                }
                preserveOriginalColors={selectUseOriginalColor}
                alt="Selected icon"
              />
            ) : (
              <span style={{ fontSize: `${selectIconSize}px` }}>❓</span>
            )}
            {showLabel && labelToShow && <span>{labelToShow}</span>}
          </div>
        );

      case "searchable":
        // Mostrar la primera opción si no hay valor seleccionado
        const searchableOptions = (field.field_config as any)?.options || [];
        const searchableValue = field.value || searchableOptions[0] || "Opción";

        return (
          <div key={key} style={fieldStyles}>
            {searchableValue}
          </div>
        );

      case "select_background":
        // Este campo no renderiza contenido visible, solo cambia el fondo de la sección
        // El fondo se aplica automáticamente a nivel de sección en el renderizado del contenedor
        return null;

      case "date":
        const dateFormat =
          (field.field_config as any)?.date_format || "DD/MM/YYYY";

        // Si no tiene valor, mostrar el patrón del formato
        const displayValue = field.value
          ? formatDateValue(field.value as Date | string, dateFormat)
          : dateFormat;

        return (
          <div key={key} style={fieldStyles}>
            {displayValue}
          </div>
        );

      case "date_range":
        const dateRangeFormat =
          (field.field_config as any)?.date_format || "DD/MM/YYYY";
        const showMoonPhases =
          (field.field_config as any)?.show_moon_phases || false;

        // Obtener las fases de luna configuradas o desde el valor
        let startMoonPhase = (field.field_config as any)?.start_moon_phase;
        let endMoonPhase = (field.field_config as any)?.end_moon_phase;

        // Si form es true y hay valor con moon_phases, usar esos valores
        if (field.form && field.value && typeof field.value === "object") {
          if ("start_moon_phase" in field.value) {
            startMoonPhase = (field.value as any).start_moon_phase;
          }
          if ("end_moon_phase" in field.value) {
            endMoonPhase = (field.value as any).end_moon_phase;
          }
        }

        // Helper para obtener la ruta de la imagen de la luna
        const getMoonImagePath = (phase?: string) => {
          if (!phase) return "/assets/img/moons/llena.png";
          return `/assets/img/moons/${phase}.png`;
        };

        // Si el formato es DD-DD, MMMM YYYY, combinar en un solo formato
        const isRangeFormat = dateRangeFormat === "DD-DD, MMMM YYYY";

        if (isRangeFormat) {
          // Para formato de rango combinado: "15-26, Abril 2025"
          let rangeDisplay = "DD-DD, MMMM YYYY";

          if (
            field.value &&
            typeof field.value === "object" &&
            "start_date" in field.value &&
            "end_date" in field.value &&
            field.value.start_date &&
            field.value.end_date
          ) {
            const startDateVal = parseLocalDate(
              field.value.start_date as string | Date,
            );
            const endDateVal = parseLocalDate(
              field.value.end_date as string | Date,
            );

            const startDay = startDateVal.getDate();
            const endDay = endDateVal.getDate();
            const month = endDateVal.toLocaleDateString(localeCode, {
              month: "long",
            });
            const year = endDateVal.getFullYear();

            rangeDisplay = `${startDay}-${endDay}, ${
              month.charAt(0).toUpperCase() + month.slice(1)
            } ${year}`;
          }

          return (
            <div key={key} style={fieldStyles}>
              {rangeDisplay}
            </div>
          );
        }

        // Para formatos normales: mostrar dos fechas separadas
        let startDateDisplay = dateRangeFormat;
        let endDateDisplay = dateRangeFormat;

        if (
          field.value &&
          typeof field.value === "object" &&
          "start_date" in field.value &&
          "end_date" in field.value
        ) {
          if (field.value.start_date) {
            startDateDisplay = formatDateValue(
              field.value.start_date as Date | string,
              dateRangeFormat,
            );
          }
          if (field.value.end_date) {
            endDateDisplay = formatDateValue(
              field.value.end_date as Date | string,
              dateRangeFormat,
            );
          }
        }

        // Si se muestran las fases de luna, usar layout con imágenes
        if (showMoonPhases) {
          return (
            <div
              key={key}
              style={fieldStyles}
              className="flex items-center justify-between gap-4"
            >
              {/* Fecha de inicio con luna debajo */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-center">{startDateDisplay}</span>
                <img
                  src={getMoonImagePath(startMoonPhase)}
                  alt="Moon phase"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/img/moons/llena.png";
                  }}
                />
              </div>

              {/* Separador "Y" */}
              <div className="shrink-0 w-8 h-8 rounded-sm bg-[#525556] text-white flex items-center justify-center font-bold text-sm">
                Y
              </div>

              {/* Fecha de fin con luna debajo */}
              <div className="flex flex-col items-center gap-1">
                <span className="text-center">{endDateDisplay}</span>
                <img
                  src={getMoonImagePath(endMoonPhase)}
                  alt="Moon phase"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      "/assets/img/moons/llena.png";
                  }}
                />
              </div>
            </div>
          );
        }

        // Sin lunas: formato tradicional
        return (
          <div key={key} style={fieldStyles}>
            {`${startDateDisplay} - ${endDateDisplay}`}
          </div>
        );

      case "page_number":
        const format = field.field_config?.format || t("pageFormat");
        const currentPage =
          pageInfo?.currentPage !== undefined ? pageInfo.currentPage + 1 : 1;
        const totalPages = pageInfo?.totalPages || 1;
        const pageNumber = format
          .replace("{page}", String(currentPage))
          .replace("{total}", String(totalPages));
        return (
          <div key={key} style={fieldStyles}>
            {pageNumber}
          </div>
        );

      case "list":
        const listStyleType = effectiveStyles.list_style_type || "disc";
        const showBullets = listStyleType !== "none";
        const listItemsLayout = effectiveStyles.list_items_layout || "vertical";
        const isNumbered = listStyleType === "decimal";
        const showTableHeader = effectiveStyles.show_table_header || false;

        // Obtener el array de items del valor del campo
        const listItems = Array.isArray(field.value) ? field.value : [];
        const listFieldPage = overflowContext?.listFieldPage;
        const measurementFieldIndex = overflowContext?.measurementFieldIndex;

        const defaultItemsToRenderWithIndex =
          listItems.length > 0
            ? listItems.map((item, itemIndex) => ({ item, itemIndex }))
            : [{ item: {}, itemIndex: 0 }];

        const paginatedItemsToRenderWithIndex =
          listFieldPage && listItems.length > 0
            ? listFieldPage.itemIndexes
                .map((itemIndex) => ({
                  item: listItems[itemIndex],
                  itemIndex,
                }))
                .filter((entry) => entry.item !== undefined)
            : defaultItemsToRenderWithIndex;

        const itemsToRenderWithIndex =
          paginatedItemsToRenderWithIndex.length > 0
            ? paginatedItemsToRenderWithIndex
            : defaultItemsToRenderWithIndex;

        if (listItemsLayout === "table") {
          return (
            <div key={key} className="w-full overflow-x-auto">
              <table
                className="w-full border-collapse"
                style={{
                  ...getBorderStyles(effectiveStyles),
                  backgroundColor:
                    effectiveStyles.background_color || "transparent",
                }}
              >
                {showTableHeader && field.field_config?.item_schema && (
                  <thead
                    style={{
                      backgroundColor:
                        effectiveStyles.header_background_color ||
                        "transparent",
                    }}
                  >
                    <tr>
                      {Object.entries(field.field_config.item_schema).map(
                        (
                          [schemaKey, schemaField]: [string, any],
                          index,
                          array,
                        ) => {
                          const subfieldId = `${fieldId}-subfield-${schemaKey}`;
                          const isSubfieldSelected =
                            selectedElementId === subfieldId;

                          return (
                            <th
                              key={index}
                              className={`p-2 text-left ${reviewMode ? "cursor-pointer hover:bg-black/5" : ""} ${isSubfieldSelected ? "ring-2 ring-emerald-500 bg-emerald-50 relative z-30" : ""}`}
                              onDoubleClick={(e) => {
                                if (reviewMode && fieldId && onElementClick) {
                                  e.stopPropagation();
                                  // Usamos un formato especial para indicar que es un sub-field del schema
                                  // ID format: field-{s}-{b}-{f}-subfield-{schemaKey}
                                  onElementClick("field", subfieldId, e);
                                }
                              }}
                              style={{
                                color:
                                  effectiveStyles.header_text_color ||
                                  effectiveStyles.primary_color,
                                fontFamily: effectiveStyles.font
                                  ? getFontFamily(effectiveStyles.font)
                                  : undefined,
                                fontSize: effectiveStyles.header_font_size
                                  ? `${effectiveStyles.header_font_size}px`
                                  : effectiveStyles.font_size
                                    ? `${effectiveStyles.font_size}px`
                                    : undefined,
                                fontWeight:
                                  effectiveStyles.header_font_weight || "bold",
                                padding: effectiveStyles.padding || "8px",
                                borderBottomWidth:
                                  effectiveStyles.border_width || "1px",
                                borderBottomStyle:
                                  (effectiveStyles.border_style as any) ||
                                  "solid",
                                borderBottomColor:
                                  effectiveStyles.border_color || "#e5e7eb",
                                borderRightWidth:
                                  index === array.length - 1
                                    ? "0px"
                                    : effectiveStyles.border_width || "1px",
                                borderRightStyle:
                                  (effectiveStyles.border_style as any) ||
                                  "solid",
                                borderRightColor:
                                  effectiveStyles.border_color || "#e5e7eb",
                              }}
                            >
                              {schemaField.display_name || schemaField.label}
                            </th>
                          );
                        },
                      )}
                    </tr>
                  </thead>
                )}
                <tbody>
                  {itemsToRenderWithIndex.map(
                    ({ item, itemIndex }, renderItemIndex) => (
                      <tr
                        key={itemIndex}
                        data-measure-list-field-index={measurementFieldIndex}
                        data-measure-list-item-index={
                          measurementFieldIndex !== undefined
                            ? itemIndex
                            : undefined
                        }
                      >
                        {field.field_config?.item_schema &&
                          Object.entries(field.field_config.item_schema).map(
                            (
                              [fieldKey, itemFieldSchema],
                              fieldIndex,
                              array,
                            ) => {
                              const itemFieldValue = (
                                item as Record<string, any>
                              )[fieldKey];
                              const fieldSchema = itemFieldSchema as Field;
                              const subfieldId = `${fieldId}-subfield-${fieldKey}`;
                              const isSubfieldSelected =
                                selectedElementId === subfieldId;

                              return (
                                <td
                                  key={fieldIndex}
                                  className={`p-2 align-top ${reviewMode ? "cursor-pointer hover:bg-black/5" : ""} ${isSubfieldSelected ? "ring-2 ring-emerald-500 bg-emerald-50 relative z-30" : ""}`}
                                  onDoubleClick={(e) => {
                                    if (
                                      reviewMode &&
                                      fieldId &&
                                      onElementClick
                                    ) {
                                      e.stopPropagation();
                                      onElementClick("field", subfieldId, e);
                                    }
                                  }}
                                  style={{
                                    padding: effectiveStyles.padding || "8px",
                                    borderBottomWidth:
                                      renderItemIndex ===
                                      itemsToRenderWithIndex.length - 1
                                        ? "0px"
                                        : effectiveStyles.border_width || "1px",
                                    borderBottomStyle:
                                      (effectiveStyles.border_style as any) ||
                                      "solid",
                                    borderBottomColor:
                                      effectiveStyles.border_color || "#e5e7eb",
                                    borderRightWidth:
                                      fieldIndex === array.length - 1
                                        ? "0px"
                                        : effectiveStyles.border_width || "1px",
                                    borderRightStyle:
                                      (effectiveStyles.border_style as any) ||
                                      "solid",
                                    borderRightColor:
                                      effectiveStyles.border_color || "#e5e7eb",
                                  }}
                                >
                                  {renderField(
                                    {
                                      ...fieldSchema,
                                      value: itemFieldValue,
                                    } as Field,
                                    `${itemIndex}-${fieldIndex}`,
                                    effectiveStyles,
                                    "horizontal",
                                  )}
                                </td>
                              );
                            },
                          )}
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          );
        }

        // Mapeo de estilos CSS de lista
        const bulletStyles: { [key: string]: string } = {
          disc: "•",
          circle: "○",
          square: "■",
          decimal: "", // Los números se generan automáticamente
          none: "",
        };

        // Determinar clases CSS para el layout de items
        const getItemLayoutClasses = () => {
          switch (listItemsLayout) {
            case "horizontal":
              return "flex flex-wrap justify-between";
            case "grid-2":
              return "grid w-full";
            case "grid-3":
              return "grid w-full";
            case "vertical":
            default:
              return "flex flex-col";
          }
        };

        // Determinar el estilo de grid columns según el layout
        const getGridColumnsStyle = (): React.CSSProperties | undefined => {
          switch (listItemsLayout) {
            case "grid-2":
              return { gridTemplateColumns: "auto auto" };
            case "grid-3":
              return { gridTemplateColumns: "auto auto auto" };
            default:
              return undefined;
          }
        };

        // Estilos para cada item de la lista
        const listItemStyles: React.CSSProperties = {
          backgroundColor: effectiveStyles.background_color || "transparent",
          backgroundImage: effectiveStyles.background_image
            ? `url("${getBackgroundImageUrl(
                effectiveStyles.background_image,
              )}")`
            : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          color: effectiveStyles.primary_color || undefined,
          ...getBorderStyles(effectiveStyles),
          padding: effectiveStyles.padding || undefined,
          margin: effectiveStyles.margin || undefined,
          fontSize: effectiveStyles.font_size
            ? `${effectiveStyles.font_size}px`
            : undefined,
          fontWeight: effectiveStyles.font_weight || undefined,
          lineHeight: effectiveStyles.line_height || undefined,
          fontStyle: effectiveStyles.font_style || undefined,
          textDecoration: effectiveStyles.text_decoration || undefined,
          textAlign:
            (effectiveStyles.text_align as "left" | "center" | "right") ||
            undefined,
          fontFamily: effectiveStyles.font
            ? getFontFamily(effectiveStyles.font)
            : undefined,
        };

        // Estilos para el contenedor de items con gap configurable
        const itemsContainerStyle: React.CSSProperties = {
          gap: effectiveStyles.gap || undefined,
        };

        return (
          <div key={key}>
            <div
              className={
                listItemsLayout === "horizontal"
                  ? "flex flex-wrap items-start"
                  : "grid"
              }
              data-measure-list-items-container-index={
                measurementFieldIndex !== undefined
                  ? measurementFieldIndex
                  : undefined
              }
              style={itemsContainerStyle}
            >
              {/* Renderizar elementos basados en el valor del campo */}
              {itemsToRenderWithIndex.flatMap(
                ({ item, itemIndex }, visualItemIndex) => {
                  const itemSlice = listFieldPage?.itemSlices?.[itemIndex];

                  const listItemNode = (
                    <div
                      key={`list-item-${itemIndex}-${visualItemIndex}`}
                      data-measure-list-field-index={measurementFieldIndex}
                      data-measure-list-item-index={
                        measurementFieldIndex !== undefined
                          ? itemIndex
                          : undefined
                      }
                      className={
                        listItemsLayout === "horizontal"
                          ? "flex items-start"
                          : "flex w-full"
                      }
                      style={{
                        ...listItemStyles,
                        // Apply alignItems to the list item wrapper (which contains the bullet/number)
                        alignItems: effectiveStyles.align_items || "start",
                        gap: "8px", // Gap fijo entre bullet y contenido
                      }}
                    >
                      {showBullets && (
                        <span
                          className="shrink-0"
                          style={{
                            color:
                              effectiveStyles.primary_color ||
                              fieldStyles.color,
                            fontSize: effectiveStyles.font_size
                              ? `${effectiveStyles.font_size}px`
                              : undefined,
                          }}
                        >
                          {isNumbered
                            ? `${itemIndex + 1}.`
                            : bulletStyles[listStyleType]}
                        </span>
                      )}
                      <div
                        className={`flex-1 min-w-0 ${getItemLayoutClasses()}`}
                        style={{
                          ...getGridColumnsStyle(),
                          gap: effectiveStyles.gap || undefined,
                          // alignItems: effectiveStyles.align_items || "center", // Removed, now applied to parent
                        }}
                      >
                        {field.field_config?.item_schema &&
                        Object.keys(field.field_config.item_schema).length >
                          0 ? (
                          Object.entries(field.field_config.item_schema).map(
                            ([fieldKey, itemFieldSchema], fieldIndex) => {
                              // Obtener el valor del sub-field del item actual
                              const itemFieldValue = (
                                item as Record<string, any>
                              )[fieldKey];
                              const fieldSchema = itemFieldSchema as Field;

                              // Determinar si el campo debe expandirse (texto) o usar ancho natural (iconos, números, etc.)
                              const shouldExpand =
                                fieldSchema.type === "text" ||
                                fieldSchema.type === "text_with_icon";

                              // Para grid layouts: cada celda del grid contiene un flex interno
                              const isGridLayout =
                                listItemsLayout === "grid-2" ||
                                listItemsLayout === "grid-3";

                              // Determinar la alineación según la posición en el grid
                              let justifyClass = "";
                              if (isGridLayout) {
                                // En grid-2: índices impares (1, 3, 5...) van a la derecha
                                // En grid-3: índices 2, 5, 8... van a la derecha
                                const colsCount =
                                  listItemsLayout === "grid-2" ? 2 : 3;
                                const colPosition = fieldIndex % colsCount;

                                if (colPosition === colsCount - 1) {
                                  // Última columna: alinear a la derecha
                                  justifyClass = "justify-end";
                                } else if (colPosition === 0) {
                                  // Primera columna: alinear a la izquierda
                                  justifyClass = "justify-start";
                                } else {
                                  // Columnas del medio: centrar
                                  justifyClass = "justify-center";
                                }
                              }

                              const subfieldId = `${fieldId}-subfield-${fieldKey}`;
                              const isSubfieldSelected =
                                selectedElementId === subfieldId;

                              return (
                                <div
                                  key={fieldIndex}
                                  className={
                                    (isGridLayout
                                      ? `flex gap-1 items-center ${justifyClass} min-w-0 ${reviewMode ? "cursor-pointer hover:bg-black/5 p-1 rounded transition-colors" : ""}`
                                      : shouldExpand
                                        ? `flex-1 min-w-[120px] ${reviewMode ? "cursor-pointer hover:bg-black/5 p-1 rounded transition-colors" : ""}`
                                        : `shrink-0 ${reviewMode ? "cursor-pointer hover:bg-black/5 p-1 rounded transition-colors" : ""}`) +
                                    (isSubfieldSelected
                                      ? " ring-2 ring-emerald-500 bg-emerald-50 relative z-30"
                                      : "")
                                  }
                                  onClick={(e) => {
                                    // Dejar que el click se propague para seleccionar el padre (Lista)
                                  }}
                                  onDoubleClick={(e) => {
                                    if (
                                      reviewMode &&
                                      fieldId &&
                                      onElementClick
                                    ) {
                                      e.stopPropagation();
                                      onElementClick("field", subfieldId, e);
                                    }
                                  }}
                                >
                                  {renderField(
                                    {
                                      ...fieldSchema,
                                      value: itemFieldValue,
                                    } as Field,
                                    `${itemIndex}-${fieldIndex}`,
                                    containerStyle,
                                    "horizontal",
                                  )}
                                </div>
                              );
                            },
                          )
                        ) : (
                          <div className="text-sm">{JSON.stringify(item)}</div>
                        )}
                      </div>
                    </div>
                  );

                  if (!itemSlice || measurementFieldIndex !== undefined) {
                    return [listItemNode];
                  }

                  return [
                    <div
                      key={`list-item-slice-${itemIndex}-${visualItemIndex}`}
                      style={{
                        overflow: "hidden",
                        height: `${itemSlice.height}px`,
                      }}
                    >
                      <div
                        style={{
                          transform: `translateY(-${itemSlice.offset}px)`,
                        }}
                      >
                        {listItemNode}
                      </div>
                    </div>,
                  ];
                },
              )}
            </div>
          </div>
        );

      case "climate_data_puntual":
        const availableParams =
          (field.field_config as any)?.available_parameters || {};
        const paramEntries = Object.entries(availableParams);
        const climateValue: { [key: string]: any } =
          typeof field.value === "object" &&
          field.value !== null &&
          !Array.isArray(field.value)
            ? (field.value as { [key: string]: any })
            : {};

        return (
          <div key={key} className="flex flex-col gap-4" style={fieldStyles}>
            {paramEntries.length > 0 ? (
              paramEntries.map(([paramKey, paramConfig]: [string, any]) => {
                // Por defecto showName es true si no está definido
                const showName = paramConfig.showName !== false;

                // Obtener el valor del parámetro o mostrar placeholder
                const paramValue = climateValue[paramKey];
                const displayValue =
                  paramValue !== undefined &&
                  paramValue !== null &&
                  paramValue !== ""
                    ? paramValue
                    : paramConfig.type === "number"
                      ? "-"
                      : "-";

                // Estilos individuales del parámetro
                const paramStyles: React.CSSProperties = {
                  color:
                    paramConfig.style_config?.primary_color ||
                    effectiveStyles.primary_color,
                  fontSize: paramConfig.style_config?.font_size
                    ? `${paramConfig.style_config.font_size}px`
                    : effectiveStyles.font_size
                      ? `${effectiveStyles.font_size}px`
                      : undefined,
                  fontWeight:
                    paramConfig.style_config?.font_weight ||
                    effectiveStyles.font_weight ||
                    undefined,
                };

                return (
                  <div key={paramKey} className="text-sm" style={paramStyles}>
                    {showName && `${paramConfig.label}: `}
                    {displayValue} {paramConfig.unit}
                  </div>
                );
              })
            ) : (
              <>
                <div className="text-sm">Temp. Max: 25°C</div>
                <div className="text-sm">Temp. Min: 15°C</div>
              </>
            )}
          </div>
        );

      case "image":
        // Mostrar la imagen si tiene valor (cuando form es false)
        // El valor puede ser un string (URL directa) o un objeto {url, label}
        const imageValue = field.value;
        const imageUrl =
          typeof imageValue === "string"
            ? imageValue
            : typeof imageValue === "object" &&
                imageValue &&
                "url" in imageValue
              ? (imageValue as any).url
              : undefined;
        const itemImageLabel =
          typeof imageValue === "object" && imageValue && "label" in imageValue
            ? (imageValue as any).label
            : undefined;

        const imageConfig = field.field_config as any;
        const showImageLabel = imageConfig?.show_label ?? false;
        const configImageLabel = imageConfig?.label_text || "";

        // El label puede venir del config o del item (en listas)
        const finalImageLabel = itemImageLabel || configImageLabel;

        if (!imageUrl) {
          return (
            <div
              key={key}
              style={fieldStyles}
              className={PLACEHOLDER_CONTAINER_CLASS}
            >
              <span className={PLACEHOLDER_TEXT_CLASS}>{t("noImage")}</span>
            </div>
          );
        }

        return (
          <div
            key={key}
            style={fieldStyles}
            className="flex flex-col items-center"
          >
            <img
              src={imageUrl}
              alt={field.display_name || "Imagen"}
              className="max-w-full max-h-full object-contain block"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/img/imageNotFound.png";
              }}
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                const label = img.nextElementSibling as HTMLElement;
                if (label) {
                  label.style.maxWidth = `${img.offsetWidth + 24}px`;
                }
              }}
            />
            {(showImageLabel || itemImageLabel) && finalImageLabel && (
              <div
                className="text-center mt-2"
                style={{
                  color: fieldStyles.color,
                  fontSize: fieldStyles.fontSize,
                  fontFamily: fieldStyles.fontFamily,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
              >
                {finalImageLabel}
              </div>
            )}
          </div>
        );

      case "image_upload":
        // Mostrar placeholder con las dimensiones exactas configuradas
        const uploadedImageUrl = field.value as string | undefined;
        const imageHeight = (field.field_config as any)?.max_height;
        const imageWidth = (field.field_config as any)?.max_width;

        // Estilos del placeholder/imagen con dimensiones exactas
        const imageUploadContainerStyle: React.CSSProperties = {
          ...fieldStyles,
          height: imageHeight ? `${imageHeight}px` : "200px", // Altura por defecto si no está definida
          width: imageWidth ? `${imageWidth}px` : "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0, // Evitar que se reduzca
        };

        if (!uploadedImageUrl) {
          // Mostrar placeholder indicando el espacio exacto que ocupará la imagen
          return (
            <div
              key={key}
              style={imageUploadContainerStyle}
              className="border-2 border-dashed border-gray-300 rounded-lg bg-gray-50"
            >
              <div className="text-center p-4">
                <div className="text-4xl mb-2">🖼️</div>
                <span className={PLACEHOLDER_TEXT_CLASS}>
                  {field.display_name ||
                    t("imageUploadPlaceholder", { default: "Imagen a subir" })}
                </span>
                {(imageHeight || imageWidth) && (
                  <div className="text-xs text-gray-400 mt-2">
                    {imageHeight && `Altura: ${imageHeight}px`}
                    {imageHeight && imageWidth && " × "}
                    {imageWidth && `Ancho: ${imageWidth}px`}
                  </div>
                )}
              </div>
            </div>
          );
        }

        // Mostrar la imagen subida ocupando el espacio exacto y ajustándose con object-fit: cover
        return (
          <div
            key={key}
            style={imageUploadContainerStyle}
            className="overflow-hidden rounded-lg"
          >
            <img
              src={uploadedImageUrl}
              alt={field.display_name || "Imagen subida"}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover", // La imagen cubre todo el espacio, recortando si es necesario
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "/assets/img/imageNotFound.png";
              }}
            />
          </div>
        );

      case "card":
        const cardBlockPage = overflowContext?.cardBlockPage;
        // Obtener los IDs de cards disponibles desde field_config
        const availableCardIds = getAvailableCardIdsFromConfig(
          field.field_config,
          resolvedCardsCache,
        );

        // El valor puede ser:
        // 1. Un array de objetos {cardId, fieldValues} - ya paginado por getSectionPagination
        // 2. Un array de strings (solo IDs)
        // 3. Un string (un solo ID)
        // 4. undefined/null
        // NOTA:
        // - En preview normal, getSectionPagination divide cards en páginas (1 card por página).
        // - En review mode mostramos todas las cards seleccionadas en el mismo canvas.

        type CardFieldItem = {
          cardId: string;
          fieldValues: Record<string, any>;
        };

        const parseCardFieldItem = (item: any): CardFieldItem | null => {
          if (item === null || item === undefined) {
            return null;
          }

          if (typeof item === "string") {
            const trimmed = item.trim();
            if (!trimmed) {
              return null;
            }

            const parseStringCandidate = (
              candidate: string,
            ): CardFieldItem | null => {
              const looksLikeJson =
                (candidate.startsWith("{") && candidate.endsWith("}")) ||
                (candidate.startsWith("[") && candidate.endsWith("]"));

              if (!looksLikeJson) {
                return null;
              }

              try {
                const parsed = JSON.parse(candidate);
                const parsedArray = Array.isArray(parsed) ? parsed : [parsed];

                for (const parsedItem of parsedArray) {
                  const nestedParsed = parseCardFieldItem(parsedItem);
                  if (nestedParsed) {
                    return nestedParsed;
                  }
                }
              } catch {
                return null;
              }

              return null;
            };

            const directParsed = parseStringCandidate(trimmed);
            if (directParsed) {
              return directParsed;
            }

            try {
              const decoded = decodeURIComponent(trimmed);
              if (decoded !== trimmed) {
                const decodedParsed = parseStringCandidate(decoded);
                if (decodedParsed) {
                  return decodedParsed;
                }
              }
            } catch {
              // Ignore malformed URI components and treat the string as a card ID.
            }

            return { cardId: trimmed, fieldValues: {} };
          }

          if (item && typeof item === "object") {
            const source = item as Record<string, any>;
            const cardId =
              source.cardId ||
              source.card_id ||
              source._id ||
              source.id ||
              source.card?._id ||
              source.card?.id ||
              "";

            if (cardId) {
              const rawFieldValues =
                source.fieldValues ||
                source.field_values ||
                source.values ||
                source.cardFieldValues ||
                {};

              return {
                cardId: String(cardId),
                fieldValues:
                  rawFieldValues && typeof rawFieldValues === "object"
                    ? (rawFieldValues as Record<string, any>)
                    : {},
              };
            }
          }

          return null;
        };

        const normalizedCardValue: any[] = (() => {
          if (Array.isArray(field.value)) {
            return field.value;
          }

          if (
            field.value === null ||
            field.value === undefined ||
            field.value === ""
          ) {
            return [];
          }

          if (typeof field.value === "string") {
            const trimmedValue = field.value.trim();
            if (!trimmedValue) {
              return [];
            }

            const tryParseArrayLikeString = (
              candidate: string,
            ): any[] | null => {
              const looksLikeJson =
                (candidate.startsWith("{") && candidate.endsWith("}")) ||
                (candidate.startsWith("[") && candidate.endsWith("]"));

              if (!looksLikeJson) {
                return null;
              }

              try {
                const parsed = JSON.parse(candidate);
                return Array.isArray(parsed) ? parsed : [parsed];
              } catch {
                return null;
              }
            };

            const directParsed = tryParseArrayLikeString(trimmedValue);
            if (directParsed) {
              return directParsed;
            }

            try {
              const decodedValue = decodeURIComponent(trimmedValue);
              if (decodedValue !== trimmedValue) {
                const decodedParsed = tryParseArrayLikeString(decodedValue);
                if (decodedParsed) {
                  return decodedParsed;
                }
              }
            } catch {
              // Ignore malformed URI components and keep raw string value.
            }

            return [trimmedValue];
          }

          if (typeof field.value === "object") {
            const valueObject = field.value as Record<string, any>;

            if (Array.isArray(valueObject.selectedCards)) {
              return valueObject.selectedCards;
            }

            if (Array.isArray(valueObject.selected_cards)) {
              return valueObject.selected_cards;
            }

            if (Array.isArray(valueObject.cards)) {
              return valueObject.cards;
            }

            return [valueObject];
          }

          return [];
        })();

        const cardItems: CardFieldItem[] = [];

        if (normalizedCardValue.length > 0) {
          if (reviewMode) {
            // In review mode we want to show all selected cards in the canvas.
            normalizedCardValue.forEach((item) => {
              const parsed = parseCardFieldItem(item);
              if (parsed) {
                cardItems.push(parsed);
              }
            });
          } else {
            // In normal preview mode keep one-card rendering per paginated section.
            const parsed = parseCardFieldItem(normalizedCardValue[0]);
            if (parsed) {
              cardItems.push(parsed);
            }
          }
        } else if (availableCardIds.length > 0) {
          // Si no hay valor (preview del template), mostrar el primer card disponible
          const parsed = parseCardFieldItem(availableCardIds[0]);
          if (parsed) {
            cardItems.push(parsed);
          }
        }

        if (cardItems.length === 0) {
          return (
            <div
              key={key}
              style={fieldStyles}
              className={`${PLACEHOLDER_CONTAINER_CLASS} p-4`}
            >
              <span className={PLACEHOLDER_TEXT_CLASS}>
                {availableCardIds.length === 0
                  ? t("noCardsAvailable")
                  : t("selectCard")}
              </span>
            </div>
          );
        }

        const renderCardItem = (
          cardData: CardFieldItem,
          cardOrderIndex: number,
        ) => {
          const cardToRender = resolvedCardsCache.get(cardData.cardId);

          if (!cardToRender) {
            if (cardsLoadingError) {
              return (
                <div
                  key={`card-error-${cardData.cardId}-${cardOrderIndex}`}
                  style={fieldStyles}
                  className={`${PLACEHOLDER_CONTAINER_CLASS} p-4 flex flex-col items-center justify-center gap-2`}
                >
                  <span className="text-red-500 text-sm font-medium text-center">
                    {t("errorLoadingCard")}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setRetryTrigger((prev) => prev + 1);
                    }}
                    className="flex items-center gap-1 text-xs bg-white border border-gray-300 px-2 py-1 rounded hover:bg-gray-50 text-gray-700"
                  >
                    <RefreshCw className="w-3 h-3" />
                    {t("retry")}
                  </button>
                </div>
              );
            }

            return (
              <div
                key={`card-loading-${cardData.cardId}-${cardOrderIndex}`}
                style={fieldStyles}
                className={`${PLACEHOLDER_CONTAINER_CLASS} p-4`}
              >
                <span className={PLACEHOLDER_TEXT_CLASS}>
                  {t("loadingCard")}
                </span>
              </div>
            );
          }

          const cardContent = cardToRender.content;
          const cardBackgroundUrl = cardContent.background_url;
          const cardBackgroundColor = cardContent.background_color;
          const cardContentStyleConfig = cardContent.style_config;

          const cardContainerStyles: React.CSSProperties = {
            ...fieldStyles,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            ...(cardBackgroundColor && {
              backgroundColor: cardBackgroundColor,
            }),
            ...(cardBackgroundUrl && {
              backgroundImage: `url(${getBackgroundImageUrl(cardBackgroundUrl)})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }),
          };

          if (cardContentStyleConfig) {
            if (cardContentStyleConfig.padding) {
              cardContainerStyles.padding = cardContentStyleConfig.padding;
            }
            if (cardContentStyleConfig.gap) {
              cardContainerStyles.gap = cardContentStyleConfig.gap;
            }
          }

          const cardBlockIndexes = !reviewMode
            ? cardBlockPage?.blockIndexes ||
              cardContent.blocks.map((_, blockIndex) => blockIndex)
            : cardContent.blocks.map((_, blockIndex) => blockIndex);

          return (
            <div
              key={`card-${cardData.cardId}-${cardOrderIndex}`}
              style={cardContainerStyles}
              className="flex flex-col"
            >
              {cardBlockIndexes.flatMap((cardBlockIndex) => {
                const block = cardContent.blocks[cardBlockIndex];

                if (!block) {
                  return [];
                }

                const cardBlockSlice = !reviewMode
                  ? cardBlockPage?.blockSlices?.[cardBlockIndex]
                  : undefined;
                const blockStyleConfig = block.style_config || {};
                const contentStyleConfig = cardContentStyleConfig || {};

                const effectiveBlockStyles = {
                  ...contentStyleConfig,
                  ...blockStyleConfig,
                };

                const blockContainerStyles: React.CSSProperties = {
                  display: "flex",
                  flexDirection:
                    (block as any).layout === "horizontal" ? "row" : "column",
                  gap: effectiveBlockStyles.gap
                    ? `${effectiveBlockStyles.gap}px`
                    : "8px",
                  padding: effectiveBlockStyles.padding || undefined,
                  backgroundColor:
                    effectiveBlockStyles.background_color || "transparent",
                  boxSizing: "border-box",
                  ...getBorderStyles(block.style_config),
                  ...(effectiveBlockStyles.background_image && {
                    backgroundImage: `url(${getBackgroundImageUrl(
                      effectiveBlockStyles.background_image,
                    )})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }),
                };

                return (
                  <div
                    key={`card-block-${cardData.cardId}-${cardOrderIndex}-${cardBlockIndex}`}
                    data-card-content-block-index={
                      !reviewMode ? cardBlockIndex : undefined
                    }
                    style={
                      cardBlockSlice
                        ? {
                            overflow: "hidden",
                            height: `${cardBlockSlice.height}px`,
                          }
                        : blockContainerStyles
                    }
                  >
                    <div
                      style={
                        cardBlockSlice
                          ? {
                              ...blockContainerStyles,
                              transform: `translateY(-${cardBlockSlice.offset}px)`,
                            }
                          : undefined
                      }
                    >
                      {block.fields.map((blockField, fieldIndex) => {
                        const safeField: Field = {
                          ...blockField,
                          style_manually_edited:
                            blockField.style_manually_edited ?? false,
                        } as Field;

                        if (
                          blockField.form &&
                          cardData.fieldValues[blockField.field_id]
                        ) {
                          safeField.value =
                            cardData.fieldValues[blockField.field_id];
                        }

                        return renderField(
                          safeField,
                          `card-${cardData.cardId}-block-${cardOrderIndex}-${cardBlockIndex}-field-${fieldIndex}`,
                          block.style_config,
                          (block as any).layout || "vertical",
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        };

        return (
          <div
            key={key}
            className={`flex flex-col ${reviewMode ? "gap-3" : ""}`}
          >
            {cardItems.map((cardData, cardOrderIndex) =>
              renderCardItem(cardData, cardOrderIndex),
            )}
          </div>
        );

      case "moon_calendar":
        const daysOfWeek = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

        // Obtener datos del valor del campo si está en modo form
        const moonCalendarValue =
          field.value && typeof field.value === "object"
            ? (field.value as any)
            : {};

        // Usar el mes y año del date picker si están disponibles, sino usar fecha actual
        const currentDate = new Date();
        const monthNames = [
          "enero",
          "febrero",
          "marzo",
          "abril",
          "mayo",
          "junio",
          "julio",
          "agosto",
          "septiembre",
          "octubre",
          "noviembre",
          "diciembre",
        ];
        const defaultMonth = monthNames[currentDate.getMonth()];
        const defaultYear = currentDate.getFullYear();

        const selectedMonth = moonCalendarValue.month || defaultMonth;
        const selectedYear = moonCalendarValue.year || defaultYear;

        // Determinar días del mes según el mes seleccionado
        const DAYS_IN_MONTH_MAP: { [key: string]: number } = {
          enero: 31,
          febrero: 28,
          marzo: 31,
          abril: 30,
          mayo: 31,
          junio: 30,
          julio: 31,
          agosto: 31,
          septiembre: 30,
          octubre: 31,
          noviembre: 30,
          diciembre: 31,
        };

        const isLeapYear = (year: number) => {
          return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        };

        let daysInMonth = DAYS_IN_MONTH_MAP[selectedMonth] || 31;
        if (selectedMonth === "febrero" && isLeapYear(selectedYear)) {
          daysInMonth = 29;
        }

        // Obtener fechas de fases lunares del valor del campo
        const fullMoonDate = moonCalendarValue.full_moon_date;
        const newMoonDate = moonCalendarValue.new_moon_date;
        const waxingCrescentDate = moonCalendarValue.waxing_crescent_date;
        const waningCrescentDate = moonCalendarValue.waning_crescent_date;

        // Extraer día del mes de una fecha string (YYYY-MM-DD)
        const getDayFromDate = (
          dateString: string | undefined,
        ): number | null => {
          if (!dateString) return null;
          const parts = dateString.split("-");
          return parts.length === 3 ? parseInt(parts[2]) : null;
        };

        const fullMoonDay = getDayFromDate(fullMoonDate);
        const newMoonDay = getDayFromDate(newMoonDate);
        const waxingCrescentDay = getDayFromDate(waxingCrescentDate);
        const waningCrescentDay = getDayFromDate(waningCrescentDate);

        // Construir un mapa de fases lunares principales
        type MoonPhase =
          | "llena"
          | "nueva"
          | "cuartoCreciente"
          | "cuartoMenguante";
        const mainPhases: Array<{ day: number; phase: MoonPhase }> = [];

        if (fullMoonDay) mainPhases.push({ day: fullMoonDay, phase: "llena" });
        if (newMoonDay) mainPhases.push({ day: newMoonDay, phase: "nueva" });
        if (waxingCrescentDay)
          mainPhases.push({ day: waxingCrescentDay, phase: "cuartoCreciente" });
        if (waningCrescentDay)
          mainPhases.push({ day: waningCrescentDay, phase: "cuartoMenguante" });

        // Ordenar por día
        mainPhases.sort((a, b) => a.day - b.day);

        // Determinar el orden del ciclo lunar
        // El ciclo típico es: nueva -> creciente -> llena -> menguante -> nueva
        const phaseOrder: MoonPhase[] = [
          "nueva",
          "cuartoCreciente",
          "llena",
          "cuartoMenguante",
        ];

        // Función para obtener la transición entre dos fases y su número de imágenes
        const getTransitionInfo = (
          fromPhase: MoonPhase,
          toPhase: MoonPhase,
        ): { folder: string; images: number } | null => {
          if (fromPhase === "cuartoCreciente" && toPhase === "llena")
            return { folder: "crecToLlena", images: 7 };
          if (fromPhase === "llena" && toPhase === "cuartoMenguante")
            return { folder: "llenaToMeng", images: 7 };
          if (fromPhase === "cuartoMenguante" && toPhase === "nueva")
            return { folder: "mengToNueva", images: 5 };
          if (fromPhase === "nueva" && toPhase === "cuartoCreciente")
            return { folder: "nuevaToCrec", images: 6 };

          // Casos especiales cuando hay fases faltantes
          if (fromPhase === "nueva" && toPhase === "llena")
            return { folder: "nuevaToCrec", images: 6 }; // Primera mitad
          if (fromPhase === "llena" && toPhase === "nueva")
            return { folder: "llenaToMeng", images: 7 }; // Segunda mitad
          if (fromPhase === "cuartoCreciente" && toPhase === "cuartoMenguante")
            return { folder: "crecToLlena", images: 7 }; // A través de llena
          if (fromPhase === "cuartoMenguante" && toPhase === "cuartoCreciente")
            return { folder: "mengToNueva", images: 5 }; // A través de nueva

          return null;
        };

        // Construir mapa de días con sus imágenes
        const dayMoonMap: { [day: number]: { icon: string; label: string } } =
          {};

        // Primero asignar las fases principales
        mainPhases.forEach(({ day, phase }) => {
          const labels: { [key in MoonPhase]: string } = {
            llena: "Llena",
            nueva: "Nueva",
            cuartoCreciente: "Crec.",
            cuartoMenguante: "Meng.",
          };
          dayMoonMap[day] = {
            icon: `/assets/img/moons/${phase}.png`,
            label: labels[phase],
          };
        });

        // Función auxiliar para llenar días con transiciones
        const fillTransitionDays = (
          startDay: number,
          endDay: number,
          transitionFolder: string,
          totalImages: number,
          reverse: boolean = false,
        ) => {
          const daysBetween = endDay - startDay + 1;

          for (let d = startDay; d <= endDay; d++) {
            // Para reversa, queremos que el último día tenga la última imagen de la transición
            // y el primer día tenga la primera imagen
            const position = reverse ? endDay - d : d - startDay;
            let imageIndex: number;

            if (daysBetween <= totalImages) {
              // Mapear al rango de imágenes disponibles, pero desde el final hacia el inicio en reversa
              if (reverse) {
                // Invertir: último día del mes debe tener la última imagen (más cercana a la fase)
                const ratio = (daysBetween - 1 - position) / (daysBetween - 1);
                imageIndex = Math.round(ratio * (totalImages - 1)) + 1;
              } else {
                const ratio = position / (daysBetween - 1);
                imageIndex = Math.round(ratio * (totalImages - 1)) + 1;
              }
              imageIndex = Math.max(1, Math.min(imageIndex, totalImages));
            } else {
              if (position === 0) {
                imageIndex = reverse ? totalImages : 1;
              } else if (position === daysBetween - 1) {
                imageIndex = reverse ? 1 : totalImages;
              } else {
                if (reverse) {
                  const ratio =
                    (daysBetween - 1 - position) / (daysBetween - 1);
                  imageIndex = Math.round(ratio * (totalImages - 1)) + 1;
                } else {
                  const ratio = position / (daysBetween - 1);
                  imageIndex = Math.round(ratio * (totalImages - 1)) + 1;
                }
                imageIndex = Math.max(1, Math.min(imageIndex, totalImages));
              }
            }

            if (!dayMoonMap[d] || !dayMoonMap[d].label) {
              dayMoonMap[d] = {
                icon: `/assets/img/moons/${transitionFolder}/${imageIndex}.png`,
                label: "",
              };
            }
          }
        };

        // Llenar días antes de la primera fase (transición inversa)
        if (mainPhases.length > 0) {
          const firstPhase = mainPhases[0];
          if (firstPhase.day > 1) {
            // Determinar de qué fase viene (ciclo lunar: menguante -> nueva -> creciente -> llena -> menguante)
            let previousPhase: MoonPhase;
            if (firstPhase.phase === "nueva") previousPhase = "cuartoMenguante";
            else if (firstPhase.phase === "cuartoCreciente")
              previousPhase = "nueva";
            else if (firstPhase.phase === "llena")
              previousPhase = "cuartoCreciente";
            else previousPhase = "llena"; // cuartoMenguante viene de llena

            const transitionInfo = getTransitionInfo(
              previousPhase,
              firstPhase.phase,
            );
            if (transitionInfo) {
              fillTransitionDays(
                1,
                firstPhase.day - 1,
                transitionInfo.folder,
                transitionInfo.images,
                true,
              );
            }
          }
        }

        // Calcular las transiciones entre fases consecutivas
        for (let i = 0; i < mainPhases.length - 1; i++) {
          const currentPhase = mainPhases[i];
          const nextPhase = mainPhases[i + 1];

          if (nextPhase.day > currentPhase.day) {
            const startDay = currentPhase.day + 1;
            const endDay = nextPhase.day - 1;

            if (endDay >= startDay) {
              const transitionInfo = getTransitionInfo(
                currentPhase.phase,
                nextPhase.phase,
              );
              if (transitionInfo) {
                fillTransitionDays(
                  startDay,
                  endDay,
                  transitionInfo.folder,
                  transitionInfo.images,
                  false,
                );
              }
            }
          }
        }

        // Llenar días después de la última fase (transición normal)
        if (mainPhases.length > 0) {
          const lastPhase = mainPhases[mainPhases.length - 1];
          if (lastPhase.day < daysInMonth) {
            // Determinar a qué fase va (ciclo lunar)
            let nextPhase: MoonPhase;
            if (lastPhase.phase === "nueva") nextPhase = "cuartoCreciente";
            else if (lastPhase.phase === "cuartoCreciente") nextPhase = "llena";
            else if (lastPhase.phase === "llena") nextPhase = "cuartoMenguante";
            else nextPhase = "nueva"; // cuartoMenguante va a nueva

            const transitionInfo = getTransitionInfo(
              lastPhase.phase,
              nextPhase,
            );
            if (transitionInfo) {
              fillTransitionDays(
                lastPhase.day + 1,
                daysInMonth,
                transitionInfo.folder,
                transitionInfo.images,
                false,
              );
            }
          }
        }

        const getMoonIcon = (day: number): string | null => {
          return dayMoonMap[day]?.icon || null;
        };

        const getMoonPhaseLabel = (day: number): string | null => {
          return dayMoonMap[day]?.label || null;
        };

        // Calcular el día de la semana en que empieza el mes
        const MONTH_INDEX: { [key: string]: number } = {
          enero: 0,
          febrero: 1,
          marzo: 2,
          abril: 3,
          mayo: 4,
          junio: 5,
          julio: 6,
          agosto: 7,
          septiembre: 8,
          octubre: 9,
          noviembre: 10,
          diciembre: 11,
        };

        const firstDayOfMonth = new Date(
          selectedYear,
          MONTH_INDEX[selectedMonth],
          1,
        );
        const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo, 1 = Lunes, etc.

        // Obtener configuración del título
        const moonCalendarConfig = field.field_config as any;
        const titleIcon = moonCalendarConfig?.title_icon;
        const titleLabel =
          moonCalendarConfig?.title_label || "Calendario lunar - {month}";
        const displayMonth =
          selectedMonth.charAt(0).toUpperCase() + selectedMonth.slice(1);
        const displayTitle = titleLabel.replace("{month}", displayMonth);

        return (
          <div key={key} style={fieldStyles} className="w-full">
            {/* Título del calendario */}
            {(titleIcon || titleLabel) && (
              <div
                className="flex items-center gap-2 mb-2 py-1 justify-center"
                style={{
                  backgroundColor: "rgba(44, 40, 37, 0.3)",
                }}
              >
                {titleIcon && (
                  <img
                    src={titleIcon}
                    alt="Calendar icon"
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
                <span
                  className="font-semibold text-base"
                  style={{ color: fieldStyles.color || "#ffffff" }}
                >
                  {displayTitle}
                </span>
              </div>
            )}

            {/* Encabezado con días de la semana */}
            <div className="grid grid-cols-7 gap-0">
              {daysOfWeek.map((day, idx) => (
                <div
                  key={idx}
                  className="text-center font-semibold text-sm py-1"
                  style={{
                    color: fieldStyles.color || "#ffffff",
                    backgroundColor: idx === 0 ? "rgba(44, 40, 37, 0.3)" : "",
                    border: "0.5px solid rgba(217, 217, 217, 0.2)",
                  }}
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Cuadrícula de días del mes */}
            <div className="grid grid-cols-7 gap-0">
              {/* Celdas vacías para los días antes del inicio del mes */}
              {Array.from({ length: startDayOfWeek }, (_, i) => (
                <div
                  key={`empty-${i}`}
                  className="flex flex-col relative"
                  style={{
                    border: "0.5px solid rgba(217, 217, 217, 0.2)",
                    minHeight: "70px",
                    backgroundColor: "rgba(0, 0, 0, 0.1)",
                  }}
                />
              ))}

              {/* Días del mes */}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const moonIcon = getMoonIcon(day);
                const dayOfWeek = (startDayOfWeek + i) % 7; // Calcular día de la semana real
                const isSunday = dayOfWeek === 0;

                return (
                  <div
                    key={day}
                    className="flex flex-col relative"
                    style={{
                      border: "0.5px solid rgba(217, 217, 217, 0.2)",
                      minHeight: "70px",
                    }}
                  >
                    {/* Número del día en la parte superior */}
                    <div
                      className="text-center"
                      style={{
                        backgroundColor: isSunday
                          ? "rgba(0, 0, 0, 0.3)"
                          : "transparent",
                        borderBottom: "0.5px solid rgba(217, 217, 217, 0.2)",
                      }}
                    >
                      <span
                        className="text-sm font-medium"
                        style={{ color: fieldStyles.color || "#ffffff" }}
                      >
                        {day}
                      </span>
                    </div>

                    {/* Área para la luna y etiqueta */}
                    <div className="flex-1 flex flex-col items-center justify-center p-1">
                      {/* Icono de fase lunar si aplica */}
                      {moonIcon && (
                        <img
                          src={moonIcon}
                          alt={getMoonPhaseLabel(day) || "Moon phase"}
                          className="w-7 h-7"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display =
                              "none";
                          }}
                        />
                      )}

                      {/* Etiqueta de fase lunar */}
                      {moonIcon && getMoonPhaseLabel(day) && (
                        <span
                          className="text-xs"
                          style={{
                            color: fieldStyles.color || "#ffffff",
                            opacity: 0.8,
                          }}
                        >
                          {getMoonPhaseLabel(day)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default:
        // Para cualquier otro tipo de campo, si form es false y tiene valor, mostrarlo
        const defaultValue =
          !field.form && field.value
            ? renderFieldValue(field.value)
            : `[${field.type}] ${field.display_name}`;

        return (
          <div key={key} style={fieldStyles}>
            {defaultValue}
          </div>
        );
    }
  };

  const renderMeasurementBlock = (
    section: Section,
    block: Section["blocks"][number],
    blockIndex: number,
  ) => {
    const hasCardField = block.fields.some((field) => field.type === "card");
    const measurementBlockStyles: React.CSSProperties = {
      backgroundColor: block.style_config?.background_color || undefined,
      backgroundImage: block.style_config?.background_image
        ? `url("${getBackgroundImageUrl(block.style_config.background_image)}")`
        : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundRepeat: "no-repeat",
      color: block.style_config?.primary_color || undefined,
      padding:
        block.style_config?.padding !== undefined
          ? block.style_config.padding
          : "16px",
      margin:
        block.style_config?.margin !== undefined
          ? block.style_config.margin
          : undefined,
      gap:
        block.style_config?.gap !== undefined ? block.style_config.gap : "8px",
      boxSizing: "border-box",
      ...getBorderStyles(block.style_config),
      ...(hasCardField && {
        display: "flex",
        flexDirection: "column",
      }),
    };

    const fieldsLayout = block.style_config?.fields_layout || "vertical";
    const fieldsContainerStyle: React.CSSProperties = {
      gap: block.style_config?.gap ? block.style_config.gap : "8px",
      alignItems: block.style_config?.align_items || "stretch",
      display: "flex",
      flexDirection: fieldsLayout === "horizontal" ? "row" : "column",
      flexWrap: fieldsLayout === "horizontal" ? "wrap" : "nowrap",
    };

    if (block.style_config?.justify_content) {
      const justifyMap: Record<string, string> = {
        start: "flex-start",
        end: "flex-end",
        center: "center",
        between: "space-between",
        around: "space-around",
        evenly: "space-evenly",
      };
      const justifyContent = block.style_config.justify_content.replace(
        "justify-",
        "",
      );
      fieldsContainerStyle.justifyContent =
        justifyMap[justifyContent] ||
        justifyMap[block.style_config.justify_content] ||
        "flex-start";
    }

    return (
      <div
        key={`measurement-block-${blockIndex}`}
        ref={(element) => {
          blockMeasureRefs.current[blockIndex] = element;
        }}
        style={measurementBlockStyles}
      >
        <div
          className={`${hasCardField ? "flex-1" : ""}`}
          style={fieldsContainerStyle}
        >
          {block.fields.length === 0 ? (
            <div className="text-sm text-[#283618]/50 italic">
              {t("noFieldsInBlock")}
            </div>
          ) : (
            block.fields
              .filter((field) => field.bulletin)
              .map((field, fieldIndex) => (
                <div
                  key={`measurement-field-wrapper-${blockIndex}-${fieldIndex}`}
                  data-measure-field-index={fieldIndex}
                  style={{ display: "contents" }}
                >
                  {renderField(
                    field,
                    `measurement-field-${blockIndex}-${fieldIndex}`,
                    block.style_config || section.style_config,
                    fieldsLayout,
                    undefined,
                    undefined,
                    { measurementFieldIndex: fieldIndex },
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    );
  };

  // Tipo para info de paginación (funciona tanto para listas como para cards)
  type PaginationInfo = {
    blockIndex: number;
    fieldIndex: number;
    maxItemsPerPage: number;
    totalItems: number;
    items: any[];
    type: "list" | "card"; // Tipo de campo paginado
  };

  // Función para obtener info de paginación de una sección específica
  const getSectionPagination = (
    section?: Section | null,
  ): {
    totalPages: number;
    paginatedSections: Section[];
  } => {
    if (!section) {
      return { totalPages: 1, paginatedSections: [] };
    }

    // Buscar si hay algún field de tipo list o card que requiera paginación
    // Iteramos sobre TODOS los campos para encontrar el que requiera más páginas
    let maxPagesFound = 1;
    let bestPaginationInfo: PaginationInfo | undefined;

    for (let blockIndex = 0; blockIndex < section.blocks.length; blockIndex++) {
      const block = section.blocks[blockIndex];
      for (let fieldIndex = 0; fieldIndex < block.fields.length; fieldIndex++) {
        const field = block.fields[fieldIndex];
        let currentFieldPages = 1;
        let currentInfo: PaginationInfo | undefined;

        // Detectar paginación para listas
        if (field.type === "list") {
          const rawMax = (field.field_config as any)?.max_items_per_page;
          const maxItemsPerPage = rawMax ? Number(rawMax) : 0;

          const items = Array.isArray(field.value) ? field.value : [];

          if (items.length > 0 && maxItemsPerPage > 0) {
            currentFieldPages = Math.ceil(items.length / maxItemsPerPage);
            if (currentFieldPages > 1) {
              currentInfo = {
                blockIndex,
                fieldIndex,
                maxItemsPerPage,
                totalItems: items.length,
                items,
                type: "list",
              };
            }
          }
        }

        // Detectar paginación para cards (cada card es una página)
        if (field.type === "card" && Array.isArray(field.value)) {
          const cards = field.value;
          if (cards.length > 1) {
            currentFieldPages = cards.length;
            currentInfo = {
              blockIndex,
              fieldIndex,
              maxItemsPerPage: 1, // Una card por página
              totalItems: cards.length,
              items: cards,
              type: "card",
            };
          }
        }

        // Si este campo requiere más páginas que el máximo encontrado hasta ahora, lo seleccionamos
        if (currentFieldPages > maxPagesFound) {
          maxPagesFound = currentFieldPages;
          bestPaginationInfo = currentInfo;
        }
      }
    }

    if (!bestPaginationInfo) {
      return { totalPages: 1, paginatedSections: [section] };
    }

    const paginatedSections = Array.from(
      { length: maxPagesFound },
      (_, pageIndex) => {
        const startIndex = pageIndex * bestPaginationInfo.maxItemsPerPage;
        const endIndex = Math.min(
          startIndex + bestPaginationInfo.maxItemsPerPage,
          bestPaginationInfo.totalItems,
        );

        const clonedSection: Section = JSON.parse(JSON.stringify(section));

        clonedSection.blocks[bestPaginationInfo.blockIndex].fields[
          bestPaginationInfo.fieldIndex
        ].value = bestPaginationInfo.items.slice(startIndex, endIndex);

        return clonedSection;
      },
    );

    return {
      totalPages: maxPagesFound,
      paginatedSections,
    };
  };

  // Obtener la sección actual y su paginación
  const safeSelectedSectionIndex = Math.min(
    Math.max(selectedSectionIndex, 0),
    Math.max(sections.length - 1, 0),
  );
  const currentSection = sections[safeSelectedSectionIndex];
  const currentSectionId = currentSection?.section_id ?? null;
  const paginationInfo = currentSection
    ? getSectionPagination(currentSection)
    : { totalPages: 1, paginatedSections: [] as Section[] };

  const resolvedBasePageIndex = Math.min(
    currentPageIndex,
    Math.max(paginationInfo.totalPages - 1, 0),
  );
  const pageSizes = paginationInfo.paginatedSections.map(
    (_, pageIndex) => overflowPagesByBasePage[pageIndex]?.length || 1,
  );
  const clampedResolvedPageIndex =
    currentResolvedPageIndex !== undefined
      ? Math.min(
          Math.max(currentResolvedPageIndex, 0),
          Math.max(
            pageSizes.reduce(
              (totalPages, pageSize) => totalPages + Math.max(pageSize, 1),
              0,
            ) - 1,
            0,
          ),
        )
      : undefined;
  const resolvedCompositeDescriptor =
    clampedResolvedPageIndex !== undefined
      ? getCompositePageDescriptor(pageSizes, clampedResolvedPageIndex)
      : null;
  const activeBasePageIndex =
    resolvedCompositeDescriptor?.basePageIndex ?? resolvedBasePageIndex;
  const defaultBlockIndexes =
    paginationInfo.paginatedSections[activeBasePageIndex]?.blocks.map(
      (_, blockIndex) => blockIndex,
    ) || [];

  const measuredSection =
    paginationInfo.paginatedSections[measurementBasePageIndex];
  const measuredOverflowPages: OverflowPageInfo[] = overflowPagesByBasePage[
    activeBasePageIndex
  ] || [{ blockIndexes: defaultBlockIndexes } as OverflowPageInfo];
  const resolvedOverflowPageIndex = Math.min(
    resolvedCompositeDescriptor?.overflowPageIndex ?? currentOverflowPageIndex,
    Math.max(measuredOverflowPages.length - 1, 0),
  );
  const pagesBeforeCurrentBase = paginationInfo.paginatedSections.reduce(
    (total, _, pageIndex) => {
      if (pageIndex >= activeBasePageIndex) {
        return total;
      }

      return total + (overflowPagesByBasePage[pageIndex]?.length || 1);
    },
    0,
  );

  const getResolvedSectionPageCount = (sectionIndex: number) => {
    if (resolvedSectionPageCounts?.[sectionIndex]) {
      return resolvedSectionPageCounts[sectionIndex];
    }

    if (sectionIndex === safeSelectedSectionIndex) {
      return currentSectionTotalPages || 1;
    }

    const sectionPagination = getSectionPagination(sections[sectionIndex]);
    return sectionPagination.totalPages;
  };
  const currentSectionTotalPages = paginationInfo.paginatedSections.reduce(
    (total, _, pageIndex) => {
      return total + (overflowPagesByBasePage[pageIndex]?.length || 1);
    },
    0,
  );

  useEffect(() => {
    onResolvedPageCount?.(currentSectionTotalPages || 1);
  }, [currentSectionTotalPages, onResolvedPageCount]);

  useEffect(() => {
    return () => {
      if (overflowCollapseTimeoutRef.current !== null) {
        window.clearTimeout(overflowCollapseTimeoutRef.current);
        overflowCollapseTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!currentSection) {
      previousMeasuredSectionIdRef.current = null;
      previousBasePageIndexRef.current = 0;
      if (overflowCollapseTimeoutRef.current !== null) {
        window.clearTimeout(overflowCollapseTimeoutRef.current);
        overflowCollapseTimeoutRef.current = null;
      }
      setOverflowPagesByBasePage([]);
      setCurrentOverflowPageIndex(0);
      setIsMeasuringOverflow(false);
      setMeasurementBasePageIndex(0);
      return;
    }

    const didSectionChange =
      previousMeasuredSectionIdRef.current !== currentSectionId;
    previousMeasuredSectionIdRef.current = currentSectionId;

    blockMeasureRefs.current = [];
    if (overflowCollapseTimeoutRef.current !== null) {
      window.clearTimeout(overflowCollapseTimeoutRef.current);
      overflowCollapseTimeoutRef.current = null;
    }
    if (didSectionChange) {
      pendingOverflowPageRef.current = null;
      previousBasePageIndexRef.current = 0;
      setOverflowPagesByBasePage([]);
      setCurrentOverflowPageIndex(0);
    }
    setMeasurementBasePageIndex(0);
    setIsMeasuringOverflow(true);
  }, [
    currentSection,
    currentSectionId,
    forceGlobalHeader,
    resolvedCardsCache,
    safeSelectedSectionIndex,
  ]);

  useLayoutEffect(() => {
    if (!isMeasuringOverflow || !measuredSection) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const bulletinHeight = Number(styleConfig?.bulletin_height || 638);
      const headerHeight = headerMeasureRef.current?.offsetHeight || 0;
      const footerHeight = footerMeasureRef.current?.offsetHeight || 0;
      const availableHeight = Math.max(
        bulletinHeight - headerHeight - footerHeight,
        0,
      );
      const blockMeasurements: BlockMeasurement[] = measuredSection.blocks.map(
        (block, blockIndex) => {
          const blockElement = blockMeasureRefs.current[blockIndex];
          const hasCardField = block.fields.some(
            (field) => field.type === "card",
          );
          const blockMeasuredHeight =
            blockElement?.scrollHeight || blockElement?.offsetHeight || 0;
          const cardBlockElements = blockElement
            ? Array.from(
                blockElement.querySelectorAll<HTMLElement>(
                  "[data-card-content-block-index]",
                ),
              )
            : [];
          const measuredFieldElements = blockElement
            ? Array.from(
                blockElement.querySelectorAll<HTMLElement>(
                  "[data-measure-field-index]",
                ),
              )
                .map((wrapperElement) => {
                  const fieldIndex = Number(
                    wrapperElement.dataset.measureFieldIndex,
                  );
                  const fieldElement =
                    wrapperElement.firstElementChild as HTMLElement | null;

                  if (!Number.isFinite(fieldIndex) || !fieldElement) {
                    return null;
                  }

                  return {
                    fieldIndex,
                    fieldElement,
                  };
                })
                .filter(
                  (
                    candidate,
                  ): candidate is {
                    fieldIndex: number;
                    fieldElement: HTMLElement;
                  } => candidate !== null,
                )
                .sort((a, b) => a.fieldIndex - b.fieldIndex)
            : [];
          const measuredListItemElements = blockElement
            ? Array.from(
                blockElement.querySelectorAll<HTMLElement>(
                  "[data-measure-list-item-index]",
                ),
              )
                .map((itemElement) => {
                  const fieldIndex = Number(
                    itemElement.dataset.measureListFieldIndex,
                  );
                  const itemIndex = Number(
                    itemElement.dataset.measureListItemIndex,
                  );

                  if (
                    !Number.isFinite(fieldIndex) ||
                    !Number.isFinite(itemIndex)
                  ) {
                    return null;
                  }

                  return {
                    fieldIndex,
                    itemIndex,
                    itemElement,
                  };
                })
                .filter(
                  (
                    candidate,
                  ): candidate is {
                    fieldIndex: number;
                    itemIndex: number;
                    itemElement: HTMLElement;
                  } => candidate !== null,
                )
                .sort((a, b) => {
                  if (a.fieldIndex === b.fieldIndex) {
                    return a.itemIndex - b.itemIndex;
                  }

                  return a.fieldIndex - b.fieldIndex;
                })
            : [];
          const measuredListContainerElements = blockElement
            ? Array.from(
                blockElement.querySelectorAll<HTMLElement>(
                  "[data-measure-list-items-container-index]",
                ),
              )
                .map((containerElement) => {
                  const fieldIndex = Number(
                    containerElement.dataset.measureListItemsContainerIndex,
                  );

                  if (!Number.isFinite(fieldIndex)) {
                    return null;
                  }

                  return {
                    fieldIndex,
                    containerElement,
                  };
                })
                .filter(
                  (
                    candidate,
                  ): candidate is {
                    fieldIndex: number;
                    containerElement: HTMLElement;
                  } => candidate !== null,
                )
                .sort((a, b) => a.fieldIndex - b.fieldIndex)
            : [];
          const bulletinFields = block.fields.filter((field) => field.bulletin);
          const bulletinFieldCount = bulletinFields.length;
          const measuredFieldHeightsByIndex = new Map<number, number>();
          const measuredListItemHeightsByField = new Map<
            number,
            Map<number, number>
          >();
          const measuredListItemGapHeightsByField = new Map<number, number>();

          measuredFieldElements.forEach(({ fieldIndex, fieldElement }) => {
            const computedStyle = window.getComputedStyle(fieldElement);
            const marginTop =
              Number.parseFloat(computedStyle.marginTop || "0") || 0;
            const marginBottom =
              Number.parseFloat(computedStyle.marginBottom || "0") || 0;
            const measuredHeight =
              (fieldElement.scrollHeight ||
                fieldElement.offsetHeight ||
                fieldElement.getBoundingClientRect().height ||
                0) +
              marginTop +
              marginBottom;

            measuredFieldHeightsByIndex.set(fieldIndex, measuredHeight);
          });
          measuredListItemElements.forEach(
            ({ fieldIndex, itemIndex, itemElement }) => {
              const computedStyle = window.getComputedStyle(itemElement);
              const marginTop =
                Number.parseFloat(computedStyle.marginTop || "0") || 0;
              const marginBottom =
                Number.parseFloat(computedStyle.marginBottom || "0") || 0;
              const measuredHeight =
                (itemElement.scrollHeight ||
                  itemElement.offsetHeight ||
                  itemElement.getBoundingClientRect().height ||
                  0) +
                marginTop +
                marginBottom;

              const currentFieldMap =
                measuredListItemHeightsByField.get(fieldIndex) ||
                new Map<number, number>();

              currentFieldMap.set(itemIndex, measuredHeight);
              measuredListItemHeightsByField.set(fieldIndex, currentFieldMap);
            },
          );
          measuredListContainerElements.forEach(
            ({ fieldIndex, containerElement }) => {
              const computedStyle = window.getComputedStyle(containerElement);
              const parsedRowGap = Number.parseFloat(
                computedStyle.rowGap || "",
              );
              const parsedGap = Number.parseFloat(computedStyle.gap || "");
              const resolvedGap = Number.isFinite(parsedRowGap)
                ? parsedRowGap
                : Number.isFinite(parsedGap)
                  ? parsedGap
                  : 0;

              measuredListItemGapHeightsByField.set(
                fieldIndex,
                Math.max(resolvedGap, 0),
              );
            },
          );
          const measuredFieldHeights =
            bulletinFieldCount > 0
              ? Array.from(
                  { length: bulletinFieldCount },
                  (_, fieldIndex) =>
                    measuredFieldHeightsByIndex.get(fieldIndex) || 0,
                )
              : [];
          const measuredListFieldItemHeights: (number[] | undefined)[] =
            bulletinFieldCount > 0
              ? Array.from({ length: bulletinFieldCount }, (_, fieldIndex) => {
                  const itemHeightsMap =
                    measuredListItemHeightsByField.get(fieldIndex);

                  if (!itemHeightsMap || itemHeightsMap.size === 0) {
                    return undefined;
                  }

                  const maxItemIndex = Math.max(...itemHeightsMap.keys());

                  return Array.from(
                    { length: maxItemIndex + 1 },
                    (_, itemIndex) => itemHeightsMap.get(itemIndex) || 0,
                  );
                })
              : [];
          const measuredListFieldItemGapHeights: (number | undefined)[] =
            measuredListFieldItemHeights.map((itemHeights, fieldIndex) => {
              if (!itemHeights || itemHeights.length === 0) {
                return undefined;
              }

              return Math.max(
                measuredListItemGapHeightsByField.get(fieldIndex) || 0,
                0,
              );
            });
          const measuredListFieldStaticHeights: (number | undefined)[] =
            measuredListFieldItemHeights.map((itemHeights, fieldIndex) => {
              if (!itemHeights || itemHeights.length === 0) {
                return undefined;
              }

              const bulletinField = bulletinFields[fieldIndex];
              const fieldListLayout = bulletinField
                ? getEffectiveFieldStyles(
                    bulletinField,
                    block.style_config || measuredSection.style_config,
                  ).list_items_layout || "vertical"
                : "vertical";
              const shouldApplyInterItemGap =
                fieldListLayout !== "table" &&
                fieldListLayout !== "horizontal" &&
                fieldListLayout !== "grid-2" &&
                fieldListLayout !== "grid-3";
              const itemGapHeight = Math.max(
                measuredListFieldItemGapHeights[fieldIndex] || 0,
                0,
              );

              const totalItemHeight = itemHeights.reduce(
                (totalHeight, itemHeight) =>
                  totalHeight + Math.max(itemHeight, 0),
                0,
              );
              const totalGapHeight =
                shouldApplyInterItemGap && itemHeights.length > 1
                  ? itemGapHeight * (itemHeights.length - 1)
                  : 0;
              const totalFieldHeight =
                measuredFieldHeightsByIndex.get(fieldIndex) || 0;

              return Math.max(
                totalFieldHeight - totalItemHeight - totalGapHeight,
                0,
              );
            });
          const measuredFieldTotalHeight = measuredFieldHeights.reduce(
            (totalHeight, fieldHeight) => totalHeight + fieldHeight,
            0,
          );

          return {
            height: blockMeasuredHeight,
            cardBlockHeights:
              hasCardField && cardBlockElements.length > 0
                ? cardBlockElements.map(
                    (element) =>
                      element.scrollHeight || element.offsetHeight || 0,
                  )
                : undefined,
            cardStaticHeight:
              hasCardField && cardBlockElements.length > 0
                ? Math.max(
                    blockMeasuredHeight -
                      cardBlockElements.reduce(
                        (totalHeight, element) =>
                          totalHeight +
                          (element.scrollHeight || element.offsetHeight || 0),
                        0,
                      ),
                    0,
                  )
                : undefined,
            fieldHeights:
              !hasCardField && bulletinFieldCount > 0
                ? measuredFieldHeights
                : undefined,
            fieldStaticHeight:
              !hasCardField && bulletinFieldCount > 0
                ? Math.max(blockMeasuredHeight - measuredFieldTotalHeight, 0)
                : undefined,
            listFieldItemHeights:
              !hasCardField && bulletinFieldCount > 0
                ? measuredListFieldItemHeights
                : undefined,
            listFieldStaticHeights:
              !hasCardField && bulletinFieldCount > 0
                ? measuredListFieldStaticHeights
                : undefined,
            listFieldItemGapHeights:
              !hasCardField && bulletinFieldCount > 0
                ? measuredListFieldItemGapHeights
                : undefined,
          };
        },
      );

      const nextOverflowPages = getOverflowPages(
        blockMeasurements,
        availableHeight,
      );

      const previousOverflowPages =
        overflowPagesByBasePage[measurementBasePageIndex];
      const shouldDelayOverflowCollapse =
        pendingOverflowPageRef.current === null &&
        measurementBasePageIndex === activeBasePageIndex &&
        currentOverflowPageIndex > 0 &&
        Boolean(previousOverflowPages?.length) &&
        (previousOverflowPages?.length || 0) > nextOverflowPages.length &&
        nextOverflowPages.length <= currentOverflowPageIndex;

      const applyOverflowPages = () => {
        setOverflowPagesByBasePage((previousPages) => {
          const nextPages = [...previousPages];
          nextPages[measurementBasePageIndex] = nextOverflowPages;
          return nextPages;
        });
      };

      if (shouldDelayOverflowCollapse) {
        if (overflowCollapseTimeoutRef.current !== null) {
          window.clearTimeout(overflowCollapseTimeoutRef.current);
        }

        overflowCollapseTimeoutRef.current = window.setTimeout(() => {
          applyOverflowPages();
          overflowCollapseTimeoutRef.current = null;
        }, 120);
      } else {
        if (overflowCollapseTimeoutRef.current !== null) {
          window.clearTimeout(overflowCollapseTimeoutRef.current);
          overflowCollapseTimeoutRef.current = null;
        }

        applyOverflowPages();
      }

      blockMeasureRefs.current = [];

      if (
        measurementBasePageIndex <
        paginationInfo.paginatedSections.length - 1
      ) {
        setMeasurementBasePageIndex((previousIndex) => previousIndex + 1);
        return;
      }

      setIsMeasuringOverflow(false);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [
    isMeasuringOverflow,
    measuredSection,
    measurementBasePageIndex,
    paginationInfo.paginatedSections.length,
    styleConfig?.bulletin_height,
    overflowPagesByBasePage,
    activeBasePageIndex,
    currentOverflowPageIndex,
  ]);

  useEffect(() => {
    if (isMeasuringOverflow) {
      return;
    }

    const requestedOverflowIndex = pendingOverflowPageRef.current;
    const didBasePageChange =
      previousBasePageIndexRef.current !== resolvedBasePageIndex;
    pendingOverflowPageRef.current = null;

    setCurrentOverflowPageIndex((previousIndex) => {
      const maxOverflowIndex = Math.max(measuredOverflowPages.length - 1, 0);
      const nextOverflowIndex =
        requestedOverflowIndex !== null
          ? requestedOverflowIndex
          : didBasePageChange
            ? 0
            : previousIndex;

      return Math.min(Math.max(nextOverflowIndex, 0), maxOverflowIndex);
    });

    previousBasePageIndexRef.current = resolvedBasePageIndex;
  }, [
    isMeasuringOverflow,
    measuredOverflowPages.length,
    resolvedBasePageIndex,
    safeSelectedSectionIndex,
  ]);

  // Calcular el número de páginas acumuladas de todas las secciones anteriores
  const getPreviousSectionsPagesCount = () => {
    let totalPages = 0;
    for (let i = 0; i < safeSelectedSectionIndex; i++) {
      totalPages += getResolvedSectionPageCount(i);
    }
    return totalPages;
  };

  // Calcular el número total de páginas de todo el documento
  const getTotalDocumentPages = () => {
    let totalPages = 0;
    sections.forEach((_, sectionIndex) => {
      totalPages += getResolvedSectionPageCount(sectionIndex);
    });
    return totalPages;
  };

  const previousPagesCount = getPreviousSectionsPagesCount();
  const totalDocumentPages = getTotalDocumentPages();
  const currentCompositePageNumber =
    clampedResolvedPageIndex !== undefined
      ? clampedResolvedPageIndex + 1
      : pagesBeforeCurrentBase + resolvedOverflowPageIndex + 1;
  const absolutePageNumber = previousPagesCount + currentCompositePageNumber;

  const baseSectionToRender =
    paginationInfo.paginatedSections[activeBasePageIndex] ||
    currentSection ||
    null;
  const currentSectionHasCardField = Boolean(
    currentSection?.blocks.some((block) =>
      block.fields.some((field) => field.type === "card"),
    ),
  );
  const hasPendingCardLoad =
    currentSectionHasCardField &&
    !cardsLoadingError &&
    (cardsMetadataLoading ||
      (!hasProvidedCardsMetadata && resolvedCardsCache.size === 0));
  const isPreviewReady = !isMeasuringOverflow && !hasPendingCardLoad;
  const hasMeasuredOverflowLayout = Boolean(
    overflowPagesByBasePage[activeBasePageIndex]?.length,
  );
  const visibleBlockIndexes = !baseSectionToRender
    ? undefined
    : hasMeasuredOverflowLayout
      ? measuredOverflowPages[resolvedOverflowPageIndex]?.blockIndexes
      : undefined;
  const visibleBlockSlices = !baseSectionToRender
    ? undefined
    : hasMeasuredOverflowLayout
      ? measuredOverflowPages[resolvedOverflowPageIndex]?.blockSlices
      : undefined;
  const visibleCardBlockPages = !baseSectionToRender
    ? undefined
    : hasMeasuredOverflowLayout
      ? measuredOverflowPages[resolvedOverflowPageIndex]?.cardBlockPages
      : undefined;
  const visibleBlockFieldPages = !baseSectionToRender
    ? undefined
    : hasMeasuredOverflowLayout
      ? measuredOverflowPages[resolvedOverflowPageIndex]?.blockFieldPages
      : undefined;

  const goToPreviousPreviewPage = () => {
    if (resolvedOverflowPageIndex > 0) {
      setCurrentOverflowPageIndex((previousIndex) => previousIndex - 1);
      return;
    }

    if (activeBasePageIndex === 0) {
      return;
    }

    const previousBasePageIndex = activeBasePageIndex - 1;
    const previousOverflowPages =
      overflowPagesByBasePage[previousBasePageIndex]?.length || 1;

    pendingOverflowPageRef.current = previousOverflowPages - 1;
    handlePageChange(previousBasePageIndex);
  };

  const goToNextPreviewPage = () => {
    if (resolvedOverflowPageIndex < measuredOverflowPages.length - 1) {
      setCurrentOverflowPageIndex((previousIndex) => previousIndex + 1);
      return;
    }

    if (activeBasePageIndex >= paginationInfo.totalPages - 1) {
      return;
    }

    pendingOverflowPageRef.current = 0;
    handlePageChange(activeBasePageIndex + 1);
  };

  // Resetear página cuando cambie la sección
  useEffect(() => {
    if (onPageChange) {
      onPageChange(0);
      return;
    }

    setInternalPageIndex(0);
  }, [onPageChange, safeSelectedSectionIndex]);

  return (
    <div
      className="h-full relative"
      id="template-preview-root"
      data-template-preview-root="true"
      data-preview-ready={isPreviewReady ? "true" : "false"}
      data-preview-measuring={isMeasuringOverflow ? "true" : "false"}
      data-preview-card-loading={hasPendingCardLoad ? "true" : "false"}
    >
      {/* Información de la plantilla */}
      {description && (
        <div className="mb-4 p-3 bg-[#bc6c25]/10 rounded-lg">
          <h3 className="font-semibold text-[#bc6c25]">
            {data.master.template_name ||
              t("untitled", { default: "Plantilla Sin Título" })}
          </h3>
          <p className="text-sm text-[#bc6c25] mt-1">
            {data.master.description ||
              t("noDescription", { default: "Sin descripción" })}
          </p>
          <div className="text-xs text-[#bc6c25] mt-2">
            {t("status")}: {data.master.status} | {t("access")}:{" "}
            {data.master.access_config.access_type}
          </div>
        </div>
      )}

      {/* Preview del documento */}
      <div
        id="template-preview-container"
        className="border-2 border-gray-300 rounded-lg overflow-hidden flex justify-center"
      >
        <div
          className="bg-white flex flex-col"
          style={{
            ...globalStyles,
            width: `${styleConfig?.bulletin_width || 366}px`,
            height: `${styleConfig?.bulletin_height || 638}px`,
            padding: 0,
            overflow: "hidden",
            backgroundImage: styleConfig?.background_image
              ? `url("${getBackgroundImageUrl(styleConfig.background_image)}")`
              : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        >
          {/* Header Global (solo cuando NO hay secciones) */}
          {sections.length === 0 &&
            headerConfig?.fields &&
            headerConfig.fields.length > 0 && (
              <div
                className={`w-full ${
                  headerConfig.style_config?.fields_layout === "vertical"
                    ? "flex flex-col"
                    : `flex items-center ${getJustifyClass(
                        headerConfig.style_config?.justify_content,
                      )}`
                } ${
                  reviewMode
                    ? "hover:ring-2 hover:ring-purple-400 cursor-pointer relative group/header box-decoration-slice"
                    : ""
                }`}
                onClick={
                  reviewMode && onElementClick
                    ? (e) => onElementClick("header", "header-global", e)
                    : undefined
                }
                style={{
                  backgroundColor:
                    headerConfig.style_config?.background_color ||
                    "transparent",
                  backgroundImage: headerConfig.style_config?.background_image
                    ? `url("${getBackgroundImageUrl(
                        headerConfig.style_config.background_image,
                      )}")`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  color:
                    headerConfig.style_config?.primary_color ||
                    globalStyles.color,
                  fontSize: headerConfig.style_config?.font_size
                    ? `${headerConfig.style_config.font_size}px`
                    : globalStyles.fontSize,
                  fontWeight: headerConfig.style_config?.font_weight || "400",
                  lineHeight:
                    headerConfig.style_config?.line_height || undefined,
                  fontStyle: headerConfig.style_config?.font_style || "normal",
                  textDecoration:
                    headerConfig.style_config?.text_decoration || "none",
                  textAlign:
                    (headerConfig.style_config?.text_align as
                      | "left"
                      | "center"
                      | "right") || "center",
                  padding: headerConfig.style_config?.padding || "16px",
                  margin: headerConfig.style_config?.margin,
                  gap: headerConfig.style_config?.gap || "16px",
                  ...getBorderStyles(headerConfig.style_config),
                }}
              >
                {reviewMode && (
                  <div className="absolute top-0 left-0 bg-purple-400 text-white text-[10px] px-1 rounded-br opacity-0 group-hover/header:opacity-100 transition-opacity z-20 pointer-events-none">
                    Header
                  </div>
                )}
                {(() => {
                  return headerConfig.fields.map((field, index) => {
                    const fieldId = `header-global-${index}`;
                    const rendered = renderField(
                      field,
                      fieldId,
                      headerConfig.style_config,
                      headerConfig.style_config?.fields_layout || "horizontal",
                      {
                        currentPage: absolutePageNumber - 1,
                        totalPages: totalDocumentPages,
                      },
                    );

                    if (reviewMode && onElementClick) {
                      return (
                        <div
                          key={`review-wrapper-${fieldId}`}
                          onClick={(e) =>
                            onElementClick("header_field", fieldId, e)
                          }
                          className="relative hover:ring-2 hover:ring-yellow-400 cursor-pointer rounded transition-all group/field"
                        >
                          {rendered}
                          {renderCommentBadge(fieldId)}
                          <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full p-1 opacity-0 group-hover/field:opacity-100 transition-opacity z-10 shadow-sm">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                          </div>
                        </div>
                      );
                    }
                    return rendered;
                  });
                })()}
              </div>
            )}

          {sections.length === 0 ? (
            <div className="text-center py-12 text-[#283618]/50 flex-1 flex items-center justify-center flex-col">
              <div className="text-4xl mb-4">📄</div>
              <p>
                {t("noSections", {
                  default: "No hay secciones configuradas",
                })}
              </p>
            </div>
          ) : (
            baseSectionToRender && (
              <>
                {(() => {
                  const section = baseSectionToRender;
                  const sectionIndex = safeSelectedSectionIndex;
                  const measuredBlockEntries =
                    visibleBlockIndexes && visibleBlockIndexes.length > 0
                      ? visibleBlockIndexes.flatMap(
                          (blockIndex, renderIndex) => {
                            const block = section.blocks[blockIndex];

                            if (!block) {
                              return [];
                            }

                            return [
                              {
                                block,
                                blockIndex,
                                renderIndex,
                              },
                            ];
                          },
                        )
                      : [];
                  const blockEntries =
                    measuredBlockEntries.length > 0
                      ? measuredBlockEntries
                      : section.blocks.map((block, blockIndex) => ({
                          block,
                          blockIndex,
                          renderIndex: blockIndex,
                        }));

                  // Buscar campos de tipo select_background para aplicar el fondo seleccionado
                  let dynamicBackgroundUrl = null;
                  for (const block of section.blocks) {
                    for (const field of block.fields) {
                      if (field.type === "select_background") {
                        const bgOptions =
                          (field.field_config as any)?.options || [];
                        const bgUrls =
                          (field.field_config as any)?.backgrounds_url || [];

                        if (field.value) {
                          // Buscar el fondo correspondiente al valor seleccionado
                          const selectedIndex = bgOptions.findIndex(
                            (opt: string) => opt === field.value,
                          );
                          if (selectedIndex !== -1 && bgUrls[selectedIndex]) {
                            dynamicBackgroundUrl = bgUrls[selectedIndex];
                            break;
                          }
                        } else {
                          // Si no hay valor, usar el primer fondo por defecto
                          if (bgUrls.length > 0) {
                            dynamicBackgroundUrl = bgUrls[0];
                            break;
                          }
                        }
                      }
                    }
                    if (dynamicBackgroundUrl) break;
                  }

                  // Estilos aplicados a la sección completa
                  const sectionStyles = {
                    fontFamily: section.style_config?.font
                      ? getFontFamily(section.style_config.font)
                      : globalStyles.fontFamily,
                    color:
                      section.style_config?.primary_color || globalStyles.color,
                    fontSize: section.style_config?.font_size
                      ? `${section.style_config.font_size}px`
                      : globalStyles.fontSize,
                    backgroundColor: section.style_config?.background_color,
                    backgroundImage: dynamicBackgroundUrl
                      ? `url("${getBackgroundImageUrl(dynamicBackgroundUrl)}")`
                      : section.style_config?.background_image
                        ? `url("${getBackgroundImageUrl(
                            section.style_config.background_image,
                          )}")`
                        : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    fontWeight: section.style_config?.font_weight || "400",
                    fontStyle: section.style_config?.font_style || "normal",
                    textDecoration:
                      section.style_config?.text_decoration || "none",
                    textAlign:
                      (section.style_config?.text_align as
                        | "left"
                        | "center"
                        | "right") || "left",
                    padding: section.style_config?.padding,
                    margin: section.style_config?.margin,
                    ...getBorderStyles(section.style_config),
                  };

                  // Buscar si hay algún field de tipo "card" en los blocks de esta section
                  let cardHeaderConfig = null;
                  let cardFooterConfig = null;
                  let cardBackgroundColor = null;
                  let cardFieldValues: Record<string, any> = {}; // Valores de los campos de la card actual

                  for (const block of section.blocks) {
                    for (const field of block.fields) {
                      if (field.type === "card") {
                        let cardIdToShow: string | null = null;

                        // Si hay un valor y es un array, tomar el primer elemento (paginación ya aplicada)
                        if (
                          Array.isArray(field.value) &&
                          field.value.length > 0
                        ) {
                          const item = field.value[0];
                          if (typeof item === "string") {
                            cardIdToShow = item;
                          } else if (item && typeof item === "object") {
                            cardIdToShow =
                              (item as any).cardId ||
                              (item as any).card_id ||
                              (item as any)._id ||
                              (item as any).id ||
                              "";
                            cardFieldValues =
                              (item as any).fieldValues ||
                              (item as any).field_values ||
                              {};
                          }
                        } else if (
                          field.value &&
                          typeof field.value === "string"
                        ) {
                          cardIdToShow = field.value;
                        } else {
                          // Fallback: usar el primer card disponible (preview de template)
                          const availableCardIds =
                            getAvailableCardIdsFromConfig(
                              field.field_config,
                              resolvedCardsCache,
                            );
                          if (availableCardIds.length > 0) {
                            cardIdToShow = availableCardIds[0];
                          }
                        }

                        if (cardIdToShow) {
                          const card = resolvedCardsCache.get(cardIdToShow);
                          if (card) {
                            // Guardar el background color de la card
                            cardBackgroundColor = card.content.background_color;

                            // Si la card tiene header, usarlo
                            if (
                              card.content.header_config &&
                              (card.content.header_config as any).fields
                            ) {
                              cardHeaderConfig = card.content.header_config;
                            }
                            // Si la card tiene footer, usarlo
                            if (
                              card.content.footer_config &&
                              (card.content.footer_config as any).fields
                            ) {
                              cardFooterConfig = card.content.footer_config;
                            }
                            // Solo tomar el primer card encontrado
                            break;
                          }
                        }
                      }
                    }
                    if (cardHeaderConfig || cardFooterConfig) break;
                  }

                  // Determinar qué header usar: card > sección específica > global
                  const hasSectionHeader =
                    section.header_config?.fields &&
                    section.header_config.fields.length > 0;

                  const hasGlobalHeader =
                    headerConfig?.fields && headerConfig.fields.length > 0;

                  // Prioridad: card header > section header (si no forceGlobalHeader) > global header
                  const activeHeaderConfig = cardHeaderConfig
                    ? cardHeaderConfig
                    : forceGlobalHeader
                      ? hasGlobalHeader
                        ? headerConfig
                        : null
                      : hasSectionHeader
                        ? section.header_config
                        : hasGlobalHeader
                          ? headerConfig
                          : null;

                  // Determinar qué footer usar: card > sección específica (si no forceGlobalHeader) > global
                  const hasSectionFooter =
                    section.footer_config?.fields &&
                    section.footer_config.fields.length > 0;

                  const hasGlobalFooter =
                    footerConfig?.fields && footerConfig.fields.length > 0;

                  // Prioridad: card footer > section footer (si no forceGlobalHeader) > global footer
                  const activeFooterConfig = cardFooterConfig
                    ? cardFooterConfig
                    : forceGlobalHeader
                      ? hasGlobalFooter
                        ? footerConfig
                        : null
                      : hasSectionFooter
                        ? section.footer_config
                        : hasGlobalFooter
                          ? footerConfig
                          : null;

                  return (
                    <>
                      {/* Header con lógica de prioridad */}
                      {activeHeaderConfig && (
                        <div
                          ref={
                            isMeasuringOverflow ? headerMeasureRef : undefined
                          }
                          data-review-id={`header-${sectionIndex}`}
                          onClick={
                            reviewMode && onElementClick
                              ? (e) =>
                                  onElementClick(
                                    "header",
                                    `header-${sectionIndex}`,
                                    e,
                                  )
                              : undefined
                          }
                          className={`w-full ${
                            activeHeaderConfig.style_config?.fields_layout !==
                            "horizontal"
                              ? "flex flex-col"
                              : `flex items-center ${getJustifyClass(
                                  activeHeaderConfig.style_config
                                    ?.justify_content,
                                )}`
                          } ${
                            reviewMode
                              ? "hover:ring-2 hover:ring-purple-400 cursor-pointer relative group/header box-decoration-slice"
                              : ""
                          }`}
                          style={{
                            backgroundColor:
                              activeHeaderConfig.style_config
                                ?.background_color || "transparent",
                            backgroundImage: activeHeaderConfig.style_config
                              ?.background_image
                              ? `url("${getBackgroundImageUrl(
                                  activeHeaderConfig.style_config
                                    .background_image,
                                )}")`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            color:
                              activeHeaderConfig.style_config?.primary_color ||
                              globalStyles.color,
                            fontSize: activeHeaderConfig.style_config?.font_size
                              ? `${activeHeaderConfig.style_config.font_size}px`
                              : globalStyles.fontSize,
                            fontWeight:
                              activeHeaderConfig.style_config?.font_weight ||
                              "400",
                            lineHeight:
                              activeHeaderConfig.style_config?.line_height ||
                              undefined,
                            fontStyle:
                              activeHeaderConfig.style_config?.font_style ||
                              "normal",
                            textDecoration:
                              activeHeaderConfig.style_config
                                ?.text_decoration || "none",
                            textAlign:
                              (activeHeaderConfig.style_config?.text_align as
                                | "left"
                                | "center"
                                | "right") || "center",
                            padding:
                              activeHeaderConfig.style_config?.padding ||
                              "16px",
                            margin: activeHeaderConfig.style_config?.margin,
                            gap: activeHeaderConfig.style_config?.gap || "16px",
                            ...getBorderStyles(activeHeaderConfig.style_config),
                          }}
                        >
                          {reviewMode && (
                            <div className="absolute top-0 left-0 bg-purple-400 text-white text-[10px] px-1 rounded-br opacity-0 group-hover/header:opacity-100 transition-opacity z-20 pointer-events-none">
                              Header
                            </div>
                          )}
                          {activeHeaderConfig.fields.map((field, index) => {
                            // Si estamos renderizando el header de una card y el campo tiene form: true, usar fieldValues
                            const fieldToRender =
                              cardHeaderConfig &&
                              field.form &&
                              cardFieldValues[field.field_id]
                                ? {
                                    ...field,
                                    value: cardFieldValues[field.field_id],
                                  }
                                : field;

                            const fieldId = `header-${sectionIndex}-${index}`;
                            const rendered = renderField(
                              fieldToRender,
                              fieldId,
                              activeHeaderConfig.style_config,
                              activeHeaderConfig.style_config?.fields_layout ||
                                "vertical",
                              {
                                currentPage: absolutePageNumber - 1,
                                totalPages: totalDocumentPages,
                              },
                            );
                            if (reviewMode && onElementClick) {
                              return (
                                <div
                                  key={`review-wrapper-${fieldId}`}
                                  data-review-id={fieldId}
                                  onClick={(e) =>
                                    onElementClick("header_field", fieldId, e)
                                  }
                                  className="relative hover:ring-2 hover:ring-yellow-400 cursor-pointer rounded transition-all group/field"
                                >
                                  {rendered}
                                  {renderCommentBadge(fieldId)}
                                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full p-1 opacity-0 group-hover/field:opacity-100 transition-opacity z-10 shadow-sm">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                  </div>
                                </div>
                              );
                            }
                            return rendered;
                          })}
                        </div>
                      )}

                      {/* Sección con bloques - ocupa todo el espacio disponible */}
                      <div
                        data-section-preview={`section-${sectionIndex}`}
                        data-review-id={
                          reviewMode ? `section-${sectionIndex}` : undefined
                        }
                        style={{ ...sectionStyles, overflow: "hidden" }}
                        className={`flex-1 overflow-hidden flex flex-col ${
                          reviewMode
                            ? "hover:ring-2 hover:ring-green-400 cursor-pointer relative group/section box-decoration-slice"
                            : ""
                        }`}
                        onClick={
                          reviewMode && onElementClick
                            ? (e) =>
                                onElementClick(
                                  "section",
                                  `section-${sectionIndex}`,
                                  e,
                                )
                            : undefined
                        }
                      >
                        {reviewMode && (
                          <div className="absolute top-0 right-0 bg-green-400 text-white text-[10px] px-1 rounded-bl opacity-0 group-hover/section:opacity-100 transition-opacity z-20 pointer-events-none">
                            Section
                          </div>
                        )}
                        {renderCommentBadge(`section-${sectionIndex}`)}
                        {/* Bloques de la sección */}
                        <div className="space-y-1 w-full flex-1 flex flex-col overflow-hidden">
                          {section.blocks.length === 0 ? (
                            <div className="text-sm text-[#283618]/50 italic pl-4">
                              {t("noBlocksInSection")}
                            </div>
                          ) : (
                            blockEntries.map(
                              ({ block, blockIndex, renderIndex }) => {
                                const blockSlice =
                                  visibleBlockSlices?.[blockIndex];
                                const cardBlockPage =
                                  visibleCardBlockPages?.[blockIndex];
                                const blockFieldPage =
                                  visibleBlockFieldPages?.[blockIndex];
                                const visibleFieldIndexes =
                                  blockFieldPage?.fieldIndexes;
                                const visibleFieldSlices =
                                  blockFieldPage?.fieldSlices;
                                // Verificar si el block contiene un field de tipo card
                                const hasCardField = block.fields.some(
                                  (field) => field.type === "card",
                                );

                                // Obtener estilos del bloque
                                const blockStyles: React.CSSProperties = {
                                  backgroundColor:
                                    block.style_config?.background_color ||
                                    undefined,
                                  backgroundImage: block.style_config
                                    ?.background_image
                                    ? `url("${getBackgroundImageUrl(
                                        block.style_config.background_image,
                                      )}")`
                                    : undefined,
                                  backgroundSize: "cover",
                                  backgroundPosition: "center",
                                  backgroundRepeat: "no-repeat",
                                  color:
                                    block.style_config?.primary_color ||
                                    undefined,
                                  padding:
                                    block.style_config?.padding !== undefined
                                      ? block.style_config.padding
                                      : "16px",
                                  margin:
                                    block.style_config?.margin !== undefined
                                      ? block.style_config.margin
                                      : undefined,
                                  gap:
                                    block.style_config?.gap !== undefined
                                      ? block.style_config.gap
                                      : "8px",
                                  boxSizing: "border-box",
                                  ...getBorderStyles(block.style_config),
                                  // Si tiene un card field, ocupar todo el espacio disponible
                                  ...(hasCardField && {
                                    flex: 1,
                                    display: "flex",
                                    flexDirection: "column",
                                  }),
                                };

                                // Determine layout of fields
                                const fieldsLayout =
                                  block.style_config?.fields_layout ||
                                  "vertical";

                                // Calculate container style for fields
                                const fieldsContainerStyle: React.CSSProperties =
                                  {
                                    gap: block.style_config?.gap
                                      ? block.style_config.gap
                                      : "8px",
                                    alignItems:
                                      block.style_config?.align_items ||
                                      "stretch",
                                    display: "flex",
                                    flexDirection:
                                      fieldsLayout === "horizontal"
                                        ? "row"
                                        : "column",
                                    flexWrap:
                                      fieldsLayout === "horizontal"
                                        ? "wrap"
                                        : "nowrap",
                                  };

                                // Fix justifyContent value mapping from Tailwind class logic
                                if (block.style_config?.justify_content) {
                                  const justifyMap: Record<string, string> = {
                                    start: "flex-start",
                                    end: "flex-end",
                                    center: "center",
                                    between: "space-between",
                                    around: "space-around",
                                    evenly: "space-evenly",
                                  };
                                  const jcValue =
                                    block.style_config.justify_content.replace(
                                      "justify-",
                                      "",
                                    );
                                  fieldsContainerStyle.justifyContent =
                                    justifyMap[jcValue] ||
                                    justifyMap[
                                      block.style_config.justify_content
                                    ] ||
                                    "flex-start";
                                }

                                // Calculate width considering margin
                                const marginValue =
                                  block.style_config?.margin || "0";
                                let widthStyle = {};
                                if (
                                  marginValue &&
                                  marginValue !== "0" &&
                                  marginValue !== "0px"
                                ) {
                                  // Parse margin to calculate width if possible
                                  // Simple text based parsing or assume full width minus margins
                                  // For now, let's keep it simple as the container handles margin via blockStyles
                                }

                                const blockContent = (
                                  <>
                                    {/* Container for fields with specific layout */}
                                    <div
                                      className={`${
                                        hasCardField ? "flex-1" : ""
                                      }`}
                                      style={fieldsContainerStyle}
                                    >
                                      {(() => {
                                        const bulletinFields =
                                          block.fields.filter(
                                            (field) => field.bulletin,
                                          );

                                        if (block.fields.length === 0) {
                                          return (
                                            <div className="text-sm text-[#283618]/50 italic">
                                              {t("noFieldsInBlock")}
                                            </div>
                                          );
                                        }

                                        return bulletinFields.flatMap(
                                          (field, fieldIndex) => {
                                            if (
                                              visibleFieldIndexes &&
                                              !visibleFieldIndexes.includes(
                                                fieldIndex,
                                              )
                                            ) {
                                              return [];
                                            }

                                            const fieldId = `field-${sectionIndex}-${blockIndex}-${fieldIndex}`;
                                            const renderedField = renderField(
                                              field,
                                              `preview-${fieldId}`,
                                              block.style_config ||
                                                section.style_config,
                                              fieldsLayout,
                                              undefined,
                                              fieldId,
                                              field.type === "card"
                                                ? { cardBlockPage }
                                                : field.type === "list"
                                                  ? {
                                                      listFieldPage:
                                                        blockFieldPage
                                                          ?.listFieldItemPages?.[
                                                          fieldIndex
                                                        ],
                                                    }
                                                  : undefined,
                                            );
                                            const fieldSlice =
                                              visibleFieldSlices?.[fieldIndex];

                                            const fieldNode =
                                              reviewMode && onElementClick ? (
                                                <div
                                                  key={`review-wrapper-${fieldId}`}
                                                  data-review-id={fieldId}
                                                  onClick={(e) =>
                                                    onElementClick(
                                                      "field",
                                                      fieldId,
                                                      e,
                                                    )
                                                  }
                                                  style={{
                                                    ...((field as Field)
                                                      .style_config?.margin
                                                      ? {
                                                          margin: (
                                                            field as Field
                                                          ).style_config
                                                            ?.margin,
                                                        }
                                                      : {}),
                                                    ...((field as Field)
                                                      .style_config?.padding
                                                      ? {
                                                          padding: (
                                                            field as Field
                                                          ).style_config
                                                            ?.padding,
                                                        }
                                                      : {}),
                                                    flexShrink: 0,
                                                  }}
                                                  className={`relative ${
                                                    selectedElementId ===
                                                    fieldId
                                                      ? "ring-2 ring-blue-500 z-20"
                                                      : "hover:ring-2 hover:ring-yellow-400"
                                                  } cursor-pointer rounded transition-all group/field`}
                                                >
                                                  {renderedField}
                                                  {renderCommentBadge(fieldId)}
                                                  {selectedElementId ===
                                                    fieldId && (
                                                    <div className="absolute -top-3 -left-1 bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-t font-semibold shadow-sm z-30">
                                                      List
                                                    </div>
                                                  )}
                                                  <div
                                                    className={`absolute -top-2 -right-2 ${
                                                      selectedElementId ===
                                                      fieldId
                                                        ? "bg-blue-500"
                                                        : "bg-yellow-400"
                                                    } text-white rounded-full p-1 ${
                                                      selectedElementId ===
                                                      fieldId
                                                        ? "opacity-100"
                                                        : "opacity-0 group-hover/field:opacity-100"
                                                    } transition-opacity z-10 shadow-sm`}
                                                  >
                                                    <svg
                                                      xmlns="http://www.w3.org/2000/svg"
                                                      width="12"
                                                      height="12"
                                                      viewBox="0 0 24 24"
                                                      fill="none"
                                                      stroke="currentColor"
                                                      strokeWidth="2"
                                                      strokeLinecap="round"
                                                      strokeLinejoin="round"
                                                    >
                                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                                    </svg>
                                                  </div>
                                                </div>
                                              ) : (
                                                renderedField
                                              );

                                            if (!fieldSlice) {
                                              return [fieldNode];
                                            }

                                            return [
                                              <div
                                                key={`field-slice-wrapper-${fieldId}`}
                                                style={{
                                                  overflow: "hidden",
                                                  height: `${fieldSlice.height}px`,
                                                }}
                                              >
                                                <div
                                                  style={{
                                                    transform: `translateY(-${fieldSlice.offset}px)`,
                                                  }}
                                                >
                                                  {fieldNode}
                                                </div>
                                              </div>,
                                            ];
                                          },
                                        );
                                      })()}
                                    </div>
                                  </>
                                );
                                const slicedBlockWrapperStyles:
                                  | React.CSSProperties
                                  | undefined = blockSlice
                                  ? {
                                      overflow: "hidden",
                                      height: `${blockSlice.height}px`,
                                      margin: blockStyles.margin,
                                      boxSizing: blockStyles.boxSizing,
                                      flex: blockStyles.flex,
                                      display: blockStyles.display,
                                      flexDirection: blockStyles.flexDirection,
                                    }
                                  : undefined;
                                const slicedBlockContentStyles:
                                  | React.CSSProperties
                                  | undefined = blockSlice
                                  ? {
                                      ...blockStyles,
                                      margin: undefined,
                                      transform: `translateY(-${blockSlice.offset}px)`,
                                    }
                                  : undefined;

                                return (
                                  <div
                                    key={`preview-block-${sectionIndex}-${blockIndex}-${renderIndex}`}
                                    data-review-id={
                                      reviewMode
                                        ? block.block_id ||
                                          `block-${sectionIndex}-${blockIndex}`
                                        : undefined
                                    }
                                    className={`${hasCardField ? "flex-1" : ""} ${
                                      reviewMode
                                        ? "hover:ring-2 hover:ring-blue-400 cursor-pointer relative group/block transition-all"
                                        : ""
                                    }`}
                                    onClick={
                                      reviewMode && onElementClick
                                        ? (e) =>
                                            onElementClick(
                                              "block",
                                              `block-${sectionIndex}-${blockIndex}`,
                                              e,
                                            )
                                        : undefined
                                    }
                                    style={{
                                      ...(blockSlice
                                        ? slicedBlockWrapperStyles
                                        : blockStyles),
                                      overflow: "hidden",
                                    }}
                                  >
                                    {reviewMode && (
                                      <div className="absolute top-0 left-0 bg-blue-400 text-white text-[10px] px-1 rounded-br opacity-0 group-hover/block:opacity-100 transition-opacity z-10 pointer-events-none">
                                        Block
                                      </div>
                                    )}
                                    {renderCommentBadge(
                                      `block-${sectionIndex}-${blockIndex}`,
                                    )}

                                    {blockSlice ? (
                                      <div style={slicedBlockContentStyles}>
                                        {blockContent}
                                      </div>
                                    ) : (
                                      blockContent
                                    )}
                                  </div>
                                );
                              },
                            )
                          )}
                        </div>
                      </div>

                      {/* Footer con lógica de prioridad */}
                      {activeFooterConfig && (
                        <div
                          ref={
                            isMeasuringOverflow ? footerMeasureRef : undefined
                          }
                          data-review-id={`footer-${sectionIndex}`}
                          onClick={
                            reviewMode && onElementClick
                              ? (e) =>
                                  onElementClick(
                                    "footer",
                                    `footer-${sectionIndex}`,
                                    e,
                                  )
                              : undefined
                          }
                          className={`w-full ${
                            activeFooterConfig.style_config?.fields_layout !==
                            "horizontal"
                              ? "flex flex-col"
                              : `flex items-center ${getJustifyClass(
                                  activeFooterConfig.style_config
                                    ?.justify_content,
                                )}`
                          } ${
                            reviewMode
                              ? "hover:ring-2 hover:ring-purple-400 cursor-pointer relative group/footer box-decoration-slice"
                              : ""
                          }`}
                          style={{
                            backgroundColor:
                              activeFooterConfig.style_config
                                ?.background_color ||
                              cardBackgroundColor ||
                              "transparent",
                            backgroundImage: activeFooterConfig.style_config
                              ?.background_image
                              ? `url("${getBackgroundImageUrl(
                                  activeFooterConfig.style_config
                                    .background_image,
                                )}")`
                              : undefined,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            color:
                              activeFooterConfig.style_config?.primary_color ||
                              globalStyles.color,
                            fontSize: activeFooterConfig.style_config?.font_size
                              ? `${activeFooterConfig.style_config.font_size}px`
                              : globalStyles.fontSize,
                            fontWeight:
                              activeFooterConfig.style_config?.font_weight ||
                              "400",
                            lineHeight:
                              activeFooterConfig.style_config?.line_height ||
                              undefined,
                            fontStyle:
                              activeFooterConfig.style_config?.font_style ||
                              "normal",
                            textDecoration:
                              activeFooterConfig.style_config
                                ?.text_decoration || "none",
                            textAlign:
                              (activeFooterConfig.style_config?.text_align as
                                | "left"
                                | "center"
                                | "right") || "center",
                            padding:
                              activeFooterConfig.style_config?.padding ||
                              "16px",
                            margin: activeFooterConfig.style_config?.margin,
                            gap: activeFooterConfig.style_config?.gap || "16px",
                            ...getBorderStyles(activeFooterConfig.style_config),
                          }}
                        >
                          {reviewMode && (
                            <div className="absolute top-0 left-0 bg-purple-400 text-white text-[10px] px-1 rounded-br opacity-0 group-hover/footer:opacity-100 transition-opacity z-20 pointer-events-none">
                              Footer
                            </div>
                          )}
                          {activeFooterConfig.fields.map((field, index) => {
                            // Si estamos renderizando el footer de una card y el campo tiene form: true, usar fieldValues
                            const fieldToRender =
                              cardFooterConfig &&
                              field.form &&
                              cardFieldValues[field.field_id]
                                ? {
                                    ...field,
                                    value: cardFieldValues[field.field_id],
                                  }
                                : field;

                            const fieldId = `footer-${sectionIndex}-${index}`;
                            const rendered = renderField(
                              fieldToRender,
                              fieldId,
                              activeFooterConfig.style_config,
                              activeFooterConfig.style_config?.fields_layout ||
                                "vertical",
                              {
                                currentPage: absolutePageNumber - 1,
                                totalPages: totalDocumentPages,
                              },
                            );
                            if (reviewMode && onElementClick) {
                              return (
                                <div
                                  key={`review-wrapper-${fieldId}`}
                                  data-review-id={fieldId}
                                  onClick={(e) =>
                                    onElementClick("footer_field", fieldId, e)
                                  }
                                  className="relative hover:ring-2 hover:ring-yellow-400 cursor-pointer rounded transition-all group/field"
                                >
                                  {rendered}
                                  {renderCommentBadge(fieldId)}
                                  <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full p-1 opacity-0 group-hover/field:opacity-100 transition-opacity z-10 shadow-sm">
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    >
                                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                    </svg>
                                  </div>
                                </div>
                              );
                            }
                            return rendered;
                          })}
                        </div>
                      )}
                    </>
                  );
                })()}
              </>
            )
          )}

          {/* Footer Global (solo cuando NO hay secciones) */}
          {sections.length === 0 &&
            footerConfig?.fields &&
            footerConfig.fields.length > 0 && (
              <div
                onClick={
                  reviewMode && onElementClick
                    ? (e) => onElementClick("footer", "footer-global", e)
                    : undefined
                }
                className={`w-full ${
                  footerConfig.style_config?.fields_layout === "vertical"
                    ? "flex flex-col"
                    : `flex items-center ${getJustifyClass(
                        footerConfig.style_config?.justify_content,
                      )}`
                } ${
                  reviewMode
                    ? "hover:ring-2 hover:ring-purple-400 cursor-pointer relative group/footer box-decoration-slice"
                    : ""
                }`}
                style={{
                  backgroundColor:
                    footerConfig.style_config?.background_color ||
                    "transparent",
                  backgroundImage: footerConfig.style_config?.background_image
                    ? `url("${getBackgroundImageUrl(
                        footerConfig.style_config.background_image,
                      )}")`
                    : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  color:
                    footerConfig.style_config?.primary_color ||
                    globalStyles.color,
                  fontSize: footerConfig.style_config?.font_size
                    ? `${footerConfig.style_config.font_size}px`
                    : globalStyles.fontSize,
                  fontWeight: footerConfig.style_config?.font_weight || "400",
                  lineHeight:
                    footerConfig.style_config?.line_height || undefined,
                  fontStyle: footerConfig.style_config?.font_style || "normal",
                  textDecoration:
                    footerConfig.style_config?.text_decoration || "none",
                  textAlign:
                    (footerConfig.style_config?.text_align as
                      | "left"
                      | "center"
                      | "right") || "center",
                  padding: footerConfig.style_config?.padding || "16px",
                  margin: footerConfig.style_config?.margin,
                  gap: footerConfig.style_config?.gap || "16px",
                  ...getBorderStyles(footerConfig.style_config),
                }}
              >
                {footerConfig.fields.map((field, index) => {
                  const fieldId = `footer-global-${index}`;
                  const rendered = renderField(
                    field,
                    fieldId,
                    footerConfig.style_config,
                    footerConfig.style_config?.fields_layout || "horizontal",
                    {
                      currentPage: absolutePageNumber - 1,
                      totalPages: totalDocumentPages,
                    },
                  );

                  if (reviewMode && onElementClick) {
                    return (
                      <div
                        key={`review-wrapper-${fieldId}`}
                        onClick={(e) =>
                          onElementClick("footer_field", fieldId, e)
                        }
                        className="relative hover:ring-2 hover:ring-yellow-400 cursor-pointer rounded transition-all group/field"
                      >
                        {rendered}
                        {renderCommentBadge(fieldId)}
                        <div className="absolute -top-2 -right-2 bg-yellow-400 text-white rounded-full p-1 opacity-0 group-hover/field:opacity-100 transition-opacity z-10 shadow-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                        </div>
                      </div>
                    );
                  }
                  return rendered;
                })}
              </div>
            )}
        </div>
      </div>

      {isMeasuringOverflow && measuredSection && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: "-10000px",
            top: 0,
            width: `${styleConfig?.bulletin_width || 366}px`,
            visibility: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              ...globalStyles,
              width: `${styleConfig?.bulletin_width || 366}px`,
              padding: 0,
            }}
          >
            <div className="space-y-1 w-full flex flex-col">
              {measuredSection.blocks.map((block, blockIndex) =>
                renderMeasurementBlock(measuredSection, block, blockIndex),
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controles de paginación de la sección */}
      {!hidePagination && currentSectionTotalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <button
            onClick={goToPreviousPreviewPage}
            disabled={absolutePageNumber <= previousPagesCount + 1}
            className={PAGINATION_BUTTON_CLASS}
          >
            {t("previousPage")}
          </button>
          <span className="text-sm text-[#283618] font-medium">
            {t("pageOf", {
              current: currentCompositePageNumber,
              total: currentSectionTotalPages,
            })}
          </span>
          <button
            onClick={goToNextPreviewPage}
            disabled={currentCompositePageNumber === currentSectionTotalPages}
            className={PAGINATION_BUTTON_CLASS}
          >
            {t("nextPage")}
          </button>
        </div>
      )}

      {/* Información adicional */}
      {moreInfo && (
        <div className="mt-4 text-xs text-[#283618]/50 space-y-1">
          <div>
            {t("version")} {data.version.version_num}
          </div>
          <div>
            {t("message")} {data.version.commit_message}
          </div>
          <div>
            {t("sectionsCount")} {sections.length}
          </div>
          <div>
            {t("totalFields")}{" "}
            {sections.reduce(
              (total, section) =>
                total +
                section.blocks.reduce(
                  (blockTotal, block) => blockTotal + block.fields.length,
                  0,
                ),
              0,
            ) +
              (headerConfig?.fields?.length || 0) +
              (footerConfig?.fields?.length || 0)}
          </div>
        </div>
      )}
    </div>
  );
}
