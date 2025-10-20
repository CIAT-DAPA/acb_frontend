"use client";

import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTranslations } from "next-intl";
import usePermissions from "@/hooks/usePermissions";

export type PermissionRequirement = {
  action: "c" | "r" | "u" | "d";
  module: string;
  resourceGroupIds?: string[];
};

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiredPermission?: PermissionRequirement;
  requireSuperadmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback,
  requiredPermission,
  requireSuperadmin,
}) => {
  const { authenticated, loading, login } = useAuth();
  const t = useTranslations("Authentication");
  const { can, isSuperadmin } = usePermissions();

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

  // Si se requiere permiso adicional, verificarlo
  if (requiredPermission || requireSuperadmin) {
    const lacksPermission = requiredPermission
      ? !can(
          requiredPermission.action,
          requiredPermission.module,
          requiredPermission.resourceGroupIds
        )
      : false;

    const lacksSuperadmin = !!requireSuperadmin && !isSuperadmin;

    if (lacksPermission || lacksSuperadmin) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-6">
            <h2 className="text-xl font-semibold text-red-700">{t("accessDeniedTitle")}</h2>
            <p className="text-sm text-gray-600">{t("accessDeniedMessage")}</p>
          </div>
        </div>
      );
    }
  }
  

  // Si está autenticado, mostrar el contenido
  return <>{children}</>;
};
