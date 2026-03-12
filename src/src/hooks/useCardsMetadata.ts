"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/types/card";
import { CardAPIService } from "@/services/cardService";

interface UseCardsMetadataResult {
  cardsMetadata?: Record<string, Card>;
  isLoading: boolean;
}

function buildCardsMetadata(cards: Card[]): Record<string, Card> {
  return cards.reduce<Record<string, Card>>((metadata, card) => {
    if (card._id) {
      metadata[card._id] = card;
    }

    return metadata;
  }, {});
}

export function useCardsMetadata(enabled: boolean): UseCardsMetadataResult {
  const [cardsMetadata, setCardsMetadata] = useState<Record<string, Card>>({});
  const [isLoading, setIsLoading] = useState(enabled);
  const previousEnabledRef = useRef(enabled);

  useEffect(() => {
    previousEnabledRef.current = enabled;
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setCardsMetadata({});
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadCardsMetadata = async () => {
      setIsLoading(true);

      try {
        const response = await CardAPIService.getCards();

        if (!isMounted) {
          return;
        }

        if (response.success && response.data) {
          setCardsMetadata(buildCardsMetadata(response.data));
        } else {
          setCardsMetadata({});
        }
      } catch (error) {
        console.error("Error preloading cards metadata:", error);

        if (isMounted) {
          setCardsMetadata({});
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCardsMetadata();

    return () => {
      isMounted = false;
    };
  }, [enabled]);

  return useMemo(
    () => ({
      cardsMetadata:
        Object.keys(cardsMetadata).length > 0 ? cardsMetadata : undefined,
      isLoading: (enabled && !previousEnabledRef.current) || isLoading,
    }),
    [cardsMetadata, enabled, isLoading],
  );
}
