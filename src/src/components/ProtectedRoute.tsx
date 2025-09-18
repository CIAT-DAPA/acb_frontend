"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
}) => {
  const { authenticated, loading, login } = useAuth();
  const t = useTranslations("Authentication");

  useEffect(() => {
    // Si no está cargando y no está autenticado, redirigir a login
    if (!loading && !authenticated) {
      login();
    }
  }, [loading, authenticated, login]);

  // Mostrar loading mientras verifica autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-[#ffaf68] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">{t("verification")}</p>
        </div>
      </div>
    );
  }

  // Si no está autenticado, mostrar fallback o redirigir
  if (!authenticated) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-gray-800">
            {t("accessRestrictedTitle")}
          </h1>
          <p className="text-gray-600 mb-4">{t("accessRestrictedMessage")}</p>
          <p className="text-sm text-gray-500">{t("redirecting")}</p>
        </div>
      </div>
    );
  }

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
};
