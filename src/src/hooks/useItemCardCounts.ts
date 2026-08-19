"use client";

import { useEffect, useState } from "react";
import type { BulletinMaster } from "@/types/bulletin";
import type { TemplateMaster } from "@/types/template";
import BulletinAPIService from "@/services/bulletinService";
import { TemplateAPIService } from "@/services/templateService";
import { getBulletinPageCount } from "@/utils/itemCardCounts";

const METADATA_BATCH_SIZE = 6;

type CountMap = Record<string, number>;

const getUniqueItemsById = <T extends { _id?: string }>(items: T[]): T[] => {
  const seen = new Set<string>();

  return items.filter((item) => {
    if (!item._id || seen.has(item._id)) {
      return false;
    }

    seen.add(item._id);
    return true;
  });
};

export const useTemplateSectionCounts = (
  templates: TemplateMaster[],
  enabled = true,
): CountMap => {
  const [counts, setCounts] = useState<CountMap>({});

  useEffect(() => {
    if (!enabled) {
      setCounts({});
      return;
    }

    let cancelled = false;
    const uniqueTemplates = getUniqueItemsById(templates);
    const initialCounts: CountMap = {};

    uniqueTemplates.forEach((template) => {
      if (
        template._id &&
        Number.isFinite(template.section_count) &&
        Number(template.section_count) >= 0
      ) {
        initialCounts[template._id] = Number(template.section_count);
      }
    });

    setCounts(initialCounts);

    const loadCounts = async () => {
      for (
        let index = 0;
        index < uniqueTemplates.length;
        index += METADATA_BATCH_SIZE
      ) {
        const batch = uniqueTemplates.slice(index, index + METADATA_BATCH_SIZE);

        const results = await Promise.all(
          batch.map(async (template) => {
            if (!template._id) {
              return null;
            }

            try {
              const response = await TemplateAPIService.getCurrentVersion(
                template._id,
              );

              const sections = response.data?.current_version.content.sections;

              if (!response.success || !Array.isArray(sections)) {
                return null;
              }

              return [template._id, sections.length] as const;
            } catch {
              return null;
            }
          }),
        );

        if (cancelled) {
          return;
        }

        const batchCounts: CountMap = {};

        results.forEach((result) => {
          if (result) {
            batchCounts[result[0]] = result[1];
          }
        });

        if (Object.keys(batchCounts).length > 0) {
          setCounts((current) => ({
            ...current,
            ...batchCounts,
          }));
        }
      }
    };

    void loadCounts();

    return () => {
      cancelled = true;
    };
  }, [templates, enabled]);

  return counts;
};

export const useBulletinPageCounts = (
  bulletins: BulletinMaster[],
  enabled = true,
): CountMap => {
  const [counts, setCounts] = useState<CountMap>({});

  useEffect(() => {
    if (!enabled) {
      setCounts({});
      return;
    }

    let cancelled = false;
    const uniqueBulletins = getUniqueItemsById(bulletins);
    const initialCounts: CountMap = {};

    uniqueBulletins.forEach((bulletin) => {
      if (
        bulletin._id &&
        Number.isFinite(bulletin.page_count) &&
        Number(bulletin.page_count) >= 0
      ) {
        initialCounts[bulletin._id] = Number(bulletin.page_count);
      }
    });

    setCounts(initialCounts);

    const loadCounts = async () => {
      for (
        let index = 0;
        index < uniqueBulletins.length;
        index += METADATA_BATCH_SIZE
      ) {
        const batch = uniqueBulletins.slice(index, index + METADATA_BATCH_SIZE);

        const results = await Promise.all(
          batch.map(async (bulletin) => {
            if (!bulletin._id) {
              return null;
            }

            try {
              const response = await BulletinAPIService.getCurrentVersion(
                bulletin._id,
              );

              if (!response.success || !response.data?.current_version) {
                return null;
              }

              return [
                bulletin._id,
                getBulletinPageCount(response.data.current_version),
              ] as const;
            } catch {
              return null;
            }
          }),
        );

        if (cancelled) {
          return;
        }

        const batchCounts: CountMap = {};

        results.forEach((result) => {
          if (result) {
            batchCounts[result[0]] = result[1];
          }
        });

        if (Object.keys(batchCounts).length > 0) {
          setCounts((current) => ({
            ...current,
            ...batchCounts,
          }));
        }
      }
    };

    void loadCounts();

    return () => {
      cancelled = true;
    };
  }, [bulletins, enabled]);

  return counts;
};
