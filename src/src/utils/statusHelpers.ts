/**
 * Status Helpers - Utilidades compartidas para manejar estados
 * Reutiliza la lógica del ItemCard para mantener consistencia
 */

export type StatusType = 
  | "draft" 
  | "published" 
  | "archived" 
  | "pending_review" 
  | "rejected" 
  | "active";

export interface StatusBadge {
  bg: string;
  text: string;
  translationKey: string;
}

/**
 * Obtiene la configuración del badge para un estado
 * Mantiene consistencia con ItemCard
 */
export const getStatusBadgeConfig = (status: string): StatusBadge => {
  const normalizedStatus = status.toLowerCase();
  
  const badges: Record<string, StatusBadge> = {
    // Estados de boletines
    draft: {
      bg: "bg-gray-200",
      text: "text-gray-700",
      translationKey: "statusDraft"
    },
    published: {
      bg: "bg-green-100",
      text: "text-green-700",
      translationKey: "statusPublished"
    },
    pending_review: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      translationKey: "statusPendingReview"
    },
    rejected: {
      bg: "bg-red-100",
      text: "text-red-700",
      translationKey: "statusRejected"
    },
    archived: {
      bg: "bg-gray-100",
      text: "text-gray-600",
      translationKey: "statusArchived"
    },
    // Estados de templates/cards
    active: {
      bg: "bg-blue-100",
      text: "text-blue-700",
      translationKey: "statusActive"
    },
  };
  
  return badges[normalizedStatus] || {
    bg: "bg-gray-100",
    text: "text-gray-800",
    translationKey: "statusUnknown"
  };
};

/**
 * Clase CSS para el badge (igual que ItemCard)
 */
export const getStatusBadgeClass = (status: string): string => {
  const config = getStatusBadgeConfig(status);
  return `px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`;
};
