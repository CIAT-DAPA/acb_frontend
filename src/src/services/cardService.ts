import { Card, CardType, CreateCardData } from "@/types/card";
import { BaseAPIService } from "./apiConfig";

// Interfaz para respuestas de la API
interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  total?: number;
  page?: number;
  limit?: number;
}

// Interfaz para la respuesta de listado de cards
export interface GetCardsResponse {
  success: boolean;
  data: Card[];
  total: number;
  message?: string;
}

/**
 * Servicio para gestión de cards
 * Endpoints disponibles:
 * - GET /cards/ - Obtener todas las cards
 * - POST /cards/ - Crear una nueva card
 * - PUT /cards/{card_id} - Actualizar card
 * - GET /cards/{card_id} - Obtener card por ID
 * - GET /cards/name/{name} - Obtener cards por nombre
 * - GET /cards/type/{card_type} - Obtener cards por tipo
 * - GET /cards/template/{template_id} - Obtener cards por template
 * - GET /cards/by-groups/ - Obtener cards por grupos de usuario
 */
export class CardAPIService extends BaseAPIService {
  /**
   * Obtiene la lista de todas las cards
   * GET /cards/
   */
  static async getCards(): Promise<GetCardsResponse> {
    try {
      const data = await this.get<any>("/cards/");
      const cards = data.cards || data.data || data;

      // Map API response to match Card interface
      const mappedCards = Array.isArray(cards)
        ? cards.map((card: any) => ({
            ...card,
            _id: card.id || card._id, // Map 'id' to '_id'
          }))
        : [];

      return {
        success: true,
        data: mappedCards,
        total: data.total || mappedCards.length,
      };
    } catch (error) {
      console.error("Error fetching cards:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error ? error.message : "Error al obtener las cards",
      };
    }
  }

  /**
   * Crea una nueva card
   * POST /cards/
   */
  static async createCard(
    cardData: CreateCardData
  ): Promise<APIResponse<Card>> {
    try {
      const data = await this.post<any>("/cards/", cardData);

      const card = data.card || data.data || data;

      // Map API response to match Card interface
      const mappedCard = {
        ...card,
        _id: card.id || card._id, // Map 'id' to '_id'
      };

      return {
        success: true,
        data: mappedCard,
        message: "Card creada exitosamente",
      };
    } catch (error) {
      console.error("Error creating card:", error);
      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Error al crear la card",
      };
    }
  }

  /**
   * Actualiza una card existente
   * PUT /cards/{card_id}
   */
  static async updateCard(
    id: string,
    cardData: Partial<Card>
  ): Promise<APIResponse<Card>> {
    const { log, ...cardDataWithoutLog } = cardData;

    console.log("🔍 CardService.updateCard - ID:", id);
    console.log(
      "🔍 CardService.updateCard - Data to send:",
      cardDataWithoutLog
    );

    try {
      const data = await this.put<any>(`/cards/${id}`, cardDataWithoutLog);

      console.log("✅ CardService.updateCard - Response:", data);

      return {
        success: true,
        data: data.card || data.data || data,
        message: "Card actualizada exitosamente",
      };
    } catch (error) {
      console.error("Error updating card:", error);
      return {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Error al actualizar la card",
      };
    }
  }

  /**
   * Obtiene una card específica por ID
   * GET /cards/{card_id}
   */
  static async getCardById(id: string): Promise<APIResponse<Card>> {
    try {
      const data = await this.get<any>(`/cards/${id}`);
      const card = data.card || data.data || data;

      // Map API response to match Card interface
      const mappedCard = {
        ...card,
        _id: card.id || card._id, // Map 'id' to '_id'
      };

      return {
        success: true,
        data: mappedCard,
      };
    } catch (error) {
      console.error("Error fetching card:", error);

      return {
        success: false,
        message:
          error instanceof Error ? error.message : "Error al obtener la card",
      };
    }
  }

  /**
   * Obtiene cards filtradas por nombre
   * GET /cards/name/{name}
   */
  static async getCardsByName(name: string): Promise<GetCardsResponse> {
    try {
      const data = await this.get<any>(`/cards/name/${name}`);
      const cards = data.cards || data.data || data;

      // Map API response to match Card interface
      const mappedCards = Array.isArray(cards)
        ? cards.map((card: any) => ({
            ...card,
            _id: card.id || card._id,
          }))
        : [];

      return {
        success: true,
        data: mappedCards,
        total: data.total || mappedCards.length,
      };
    } catch (error) {
      console.error("Error fetching cards by name:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al buscar cards por nombre",
      };
    }
  }

  /**
   * Obtiene cards filtradas por tipo
   * GET /cards/type/{card_type}
   */
  static async getCardsByType(cardType: CardType): Promise<GetCardsResponse> {
    try {
      const data = await this.get<any>(`/cards/type/${cardType}`);
      const cards = data.cards || data.data || data;

      // Map API response to match Card interface
      const mappedCards = Array.isArray(cards)
        ? cards.map((card: any) => ({
            ...card,
            _id: card.id || card._id,
          }))
        : [];

      return {
        success: true,
        data: mappedCards,
        total: data.total || mappedCards.length,
      };
    } catch (error) {
      console.error("Error fetching cards by type:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al buscar cards por tipo",
      };
    }
  }

  /**
   * Obtiene cards filtradas por template
   * GET /cards/template/{template_id}
   */
  static async getCardsByTemplate(
    templateId: string
  ): Promise<GetCardsResponse> {
    try {
      const data = await this.get<any>(`/cards/template/${templateId}`);
      const cards = data.cards || data.data || data;

      // Map API response to match Card interface
      const mappedCards = Array.isArray(cards)
        ? cards.map((card: any) => ({
            ...card,
            _id: card.id || card._id,
          }))
        : [];

      return {
        success: true,
        data: mappedCards,
        total: data.total || mappedCards.length,
      };
    } catch (error) {
      console.error("Error fetching cards by template:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al buscar cards por template",
      };
    }
  }

  /**
   * Obtiene cards filtradas por grupos del usuario autenticado
   * GET /cards/by-groups/
   */
  static async getCardsByUserGroups(): Promise<GetCardsResponse> {
    try {
      const data = await this.get<any>("/cards/by-groups/");
      const cards = data.cards || data.data || data;

      // Map API response to match Card interface
      const mappedCards = Array.isArray(cards)
        ? cards.map((card: any) => ({
            ...card,
            _id: card.id || card._id,
          }))
        : [];

      return {
        success: true,
        data: mappedCards,
        total: data.total || mappedCards.length,
      };
    } catch (error) {
      console.error("Error fetching cards by user groups:", error);

      return {
        success: false,
        data: [],
        total: 0,
        message:
          error instanceof Error
            ? error.message
            : "Error al obtener cards del usuario",
      };
    }
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Obtiene el número total de bloques en una card
   */
  static getBlocksCount(card: Card): number {
    return card.content.blocks.length;
  }

  /**
   * Obtiene el número total de campos en todos los bloques de una card
   */
  static getFieldsCount(card: Card): number {
    return card.content.blocks.reduce((total, block) => {
      return total + block.fields.length;
    }, 0);
  }

  /**
   * Obtiene el número de templates donde la card es válida
   */
  static getTemplatesCount(card: Card): number {
    return card.templates_master_ids.length;
  }

  /**
   * Verifica si una card es válida para un template específico
   */
  static isValidForTemplate(card: Card, templateId: string): boolean {
    return card.templates_master_ids.includes(templateId);
  }

  /**
   * Filtra cards por tipo de acceso
   */
  static filterByAccessType(
    cards: Card[],
    accessType: "public" | "restricted" | "private"
  ): Card[] {
    return cards.filter(
      (card) => card.access_config.access_type === accessType
    );
  }

  /**
   * Filtra cards por tipo de card
   */
  static filterByCardType(cards: Card[], cardType: CardType): Card[] {
    return cards.filter((card) => card.card_type === cardType);
  }

  /**
   * Busca cards por texto en nombre
   */
  static searchByName(cards: Card[], searchTerm: string): Card[] {
    const term = searchTerm.toLowerCase();
    return cards.filter((card) => card.card_name.toLowerCase().includes(term));
  }

  /**
   * Ordena cards por nombre
   */
  static sortByName(cards: Card[], order: "asc" | "desc" = "asc"): Card[] {
    return [...cards].sort((a, b) => {
      const comparison = a.card_name.localeCompare(b.card_name);
      return order === "asc" ? comparison : -comparison;
    });
  }

  /**
   * Ordena cards por fecha de creación
   */
  static sortByCreatedDate(
    cards: Card[],
    order: "asc" | "desc" = "desc"
  ): Card[] {
    return [...cards].sort((a, b) => {
      const dateA = new Date(a.log.created_at).getTime();
      const dateB = new Date(b.log.created_at).getTime();
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * Ordena cards por fecha de actualización
   */
  static sortByUpdatedDate(
    cards: Card[],
    order: "asc" | "desc" = "desc"
  ): Card[] {
    return [...cards].sort((a, b) => {
      const dateA = new Date(a.log.updated_at || a.log.created_at).getTime();
      const dateB = new Date(b.log.updated_at || b.log.created_at).getTime();
      return order === "asc" ? dateA - dateB : dateB - dateA;
    });
  }

  /**
   * Obtiene estadísticas de una card
   */
  static getCardStats(card: Card) {
    return {
      blocksCount: this.getBlocksCount(card),
      fieldsCount: this.getFieldsCount(card),
      templatesCount: this.getTemplatesCount(card),
      hasBackgroundImage: !!card.content.background_url,
      accessType: card.access_config.access_type,
      isPublic: card.access_config.access_type === "public",
      createdBy: `${card.log.creator_first_name || ""} ${
        card.log.creator_last_name || ""
      }`.trim(),
      lastUpdatedBy: card.log.updater_first_name
        ? `${card.log.updater_first_name} ${
            card.log.updater_last_name || ""
          }`.trim()
        : null,
      createdAt: new Date(card.log.created_at),
      updatedAt: card.log.updated_at
        ? new Date(card.log.updated_at)
        : new Date(card.log.created_at),
    };
  }
}
