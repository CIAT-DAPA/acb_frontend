"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import {
  Shield,
  Loader2,
  Search,
  AlertCircle,
  Lock,
  Eye,
  Plus,
  CheckCircle,
  Circle,
  ChevronDown,
  ChevronUp,
  Edit,
  Edit3,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { RoleAPIService } from "../../../services/roleService";
import { ProtectedRoute } from "../../../components/ProtectedRoute";
import { Role } from "@/types/roles";
import { PermissionModule } from "@/types/core";
import {
  container,
  searchField,
  pageTitle,
  pageSubtitle,
  btnPrimary,
  btnOutlineSecondary,
} from "../components/ui";
import Link from "next/link";

export default function RolesPage() {
  const t = useTranslations("Roles");

  // Función para obtener etiquetas de módulos con traducciones
  const getModuleLabel = (module: PermissionModule): string => {
    const moduleKey = module.replace(/_/g, "");
    return t(`modules.${moduleKey}`);
  };
  const [searchTerm, setSearchTerm] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  // Función para alternar expansión de un rol
  const toggleRoleExpansion = (roleId: string) => {
    setExpandedRoles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(roleId)) {
        newSet.delete(roleId);
      } else {
        newSet.add(roleId);
      }
      return newSet;
    });
  };

  // Cargar roles al montar el componente
  useEffect(() => {
    loadRoles();
  }, []);

  // Función para cargar roles desde la API
  const loadRoles = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await RoleAPIService.getRoles();

      if (response.success) {
        console.log("Fetched roles:", response);
        setRoles(response.data);
        setFilteredRoles(response.data);
      } else {
        setError(response.message || "Error al cargar los roles");
      }
    } catch (err) {
      setError("Error de conexión al cargar los roles");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar roles cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredRoles(roles);
    } else {
      const filtered = roles.filter(
        (role) =>
          role.role_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          role.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRoles(filtered);
    }
  }, [searchTerm, roles]);

  // Función para contar permisos habilitados
  const countEnabledPermissions = (role: Role): number => {
    return RoleAPIService.getTotalPermissions(role);
  };

  // Función para obtener el total de permisos posibles
  const getTotalPossiblePermissions = (): number => {
    return 7 * 4; // 7 módulos × 4 operaciones CRUD
  };

  return (
    <ProtectedRoute requireSuperadmin={true}>
      <main>
        <section className="desk-texture desk-texture-strong bg-[#fefae0] py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <h1 className={pageTitle}>{t("title")}</h1>
                <p className={pageSubtitle}>{t("subtitle")}</p>
              </div>
              <div className="hidden lg:block rotate-12">
                <Shield
                  width={150}
                  height={319}
                  className="object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>
        {/* Content Section */}
        <div className={`${container} py-8`}>
          {/* Search Bar y Botones */}
          <div className="flex gap-4 mb-8">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#283618]/50" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={searchField}
              />
            </div>
            {/* Botón Crear - COMENTADO TEMPORALMENTE
            <Link
              href="/roles/create"
              className={`${btnPrimary} whitespace-nowrap`}
            >
              <Plus className="h-5 w-5" />
              <span>{t("createNew")}</span>
            </Link>
            */}
          </div>
          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="h-8 w-8 text-[#606c38] animate-spin" />
              <span className="ml-3 text-[#283618]/70">{t("loading")}</span>
            </div>
          )}
          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-900 mb-1">
                  {t("errorTitle")}
                </h3>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {/* Tabla de Roles */}
          {!loading && !error && (
            <>
              {/* Información de resultados */}
              <div className="mb-4 text-sm text-[#283618]/70">
                {searchTerm ? (
                  <span>
                    {t("showing", {
                      filtered: filteredRoles.length,
                      total: roles.length,
                    })}
                  </span>
                ) : (
                  <span>{t("totalRoles", { count: roles.length })}</span>
                )}
              </div>

              {/* Lista de Roles con Cards */}
              {filteredRoles.length > 0 ? (
                <div className="space-y-4">
                  {filteredRoles.map((role) => {
                    const enabledPermissions = countEnabledPermissions(role);
                    const totalPermissions = getTotalPossiblePermissions();
                    const enabledModules =
                      RoleAPIService.getEnabledModules(role);
                    const permissionPercentage =
                      (enabledPermissions / totalPermissions) * 100;
                    const roleId = role._id || "";

                    return (
                      <div
                        key={roleId}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Header del Role */}
                        <div className="p-6 border-b border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              {/* Icono */}
                              <div className="flex-shrink-0 h-12 w-12 bg-[#606c38]/10 rounded-full flex items-center justify-center">
                                <Shield className="h-6 w-6 text-[#606c38]" />
                              </div>

                              {/* Info del rol */}
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-[#283618] mb-1">
                                  {role.role_name}
                                </h3>
                                <p className="text-sm text-[#283618]/70 mb-3">
                                  {role.description}
                                </p>

                                {/* Stats */}
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <div className="text-sm text-[#283618]/70">
                                      {t("table.activePermissionsLabel")}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-semibold text-[#606c38]">
                                        {enabledPermissions} /{" "}
                                        {totalPermissions}
                                      </span>
                                      {/* Barra de progreso pequeña */}
                                      <div className="w-20 bg-gray-200 rounded-full h-1.5">
                                        <div
                                          className="bg-[#606c38] h-1.5 rounded-full transition-all"
                                          style={{
                                            width: `${permissionPercentage}%`,
                                          }}
                                        />
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-sm text-[#283618]/70">
                                    {t("table.enabledModulesCount", {
                                      count: enabledModules.length,
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Botones de acciones */}
                            <div className="flex-shrink-0 flex items-center gap-2">
                              <Link
                                href={`/roles/${roleId}/edit`}
                                className={btnOutlineSecondary}
                                title={t("table.edit")}
                              >
                                <Edit3 className="h-4 w-4" />
                                {t("table.edit")}
                              </Link>
                              <button
                                onClick={() => toggleRoleExpansion(roleId)}
                                className={btnOutlineSecondary}
                                title={
                                  expandedRoles.has(roleId)
                                    ? t("table.hide")
                                    : t("table.viewDetails")
                                }
                              >
                                {expandedRoles.has(roleId) ? (
                                  <>
                                    <ChevronUp className="h-4 w-4" />
                                    {t("table.hide")}
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-4 w-4" />
                                    {t("table.viewDetails")}
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Módulos y Permisos - Solo visible cuando está expandido */}
                        {expandedRoles.has(roleId) && (
                          <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <h4 className="text-sm font-medium text-[#283618] mb-3">
                              {t("table.modulesAndPermissions")}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {(
                                Object.keys(
                                  role.permissions
                                ) as PermissionModule[]
                              ).map((module) => {
                                const perms = role.permissions[module];
                                const hasAnyPermission = Object.values(
                                  perms
                                ).some((v) => v);

                                // Solo mostrar módulos con al menos un permiso
                                if (!hasAnyPermission) return null;

                                return (
                                  <div
                                    key={module}
                                    className="bg-gray-50 rounded-lg p-3 border border-gray-200"
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <CheckCircle className="h-4 w-4 text-[#606c38]" />
                                      <span className="text-sm font-medium text-[#283618]">
                                        {getModuleLabel(module)}
                                      </span>
                                    </div>

                                    {/* Permisos CRUD */}
                                    <div className="flex gap-2 flex-wrap">
                                      {perms.c && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                          <Edit3 className="h-4 w-4 mr-1" />{" "}
                                          {t("crud.create")}
                                        </span>
                                      )}
                                      {perms.r && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                          <Eye className="h-4 w-4 mr-1" />{" "}
                                          {t("crud.read")}
                                        </span>
                                      )}
                                      {perms.u && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                          <RefreshCcw className="h-4 w-4 mr-1" />{" "}
                                          {t("crud.update")}
                                        </span>
                                      )}
                                      {perms.d && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                                          <Trash2 className="h-4 w-4 mr-1" />{" "}
                                          {t("crud.delete")}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Mensaje si no hay módulos habilitados */}
                            {enabledModules.length === 0 && (
                              <div className="text-center py-4 text-sm text-[#283618]/50">
                                {t("table.noModulesEnabled")}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                // Sin resultados
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <Lock className="h-12 w-12 text-[#283618]/50 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-[#283618] mb-1">
                    {t("noResults")}
                  </h3>
                  <p className="text-sm text-[#283618]/60">
                    {searchTerm ? t("noResultsSearch") : t("noRolesSystem")}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Información sobre módulos de permisos */}
          {!loading && !error && roles.length > 0 && (
            <div className="mt-8 bg-orange-50 border border-[#bc6c25] rounded-lg p-6">
              <h3 className="text-sm font-medium text-[#283618] mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t("permissionsInfo.title")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-[#283618]">
                <div className="flex items-start gap-2">
                  <span className="font-medium">•</span>
                  <span>
                    <strong>bulletins_composer:</strong>{" "}
                    {t("permissionsInfo.bulletinsComposer")}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">•</span>
                  <span>
                    <strong>template_management:</strong>{" "}
                    {t("permissionsInfo.templateManagement")}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">•</span>
                  <span>
                    <strong>dashboard_bulletins:</strong>{" "}
                    {t("permissionsInfo.dashboardBulletins")}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">•</span>
                  <span>
                    <strong>review:</strong> {t("permissionsInfo.review")}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">•</span>
                  <span>
                    <strong>card_management:</strong>{" "}
                    {t("permissionsInfo.cardManagement")}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">•</span>
                  <span>
                    <strong>access_control:</strong>{" "}
                    {t("permissionsInfo.accessControl")}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-medium">•</span>
                  <span>
                    <strong>external_integrations:</strong>{" "}
                    {t("permissionsInfo.externalIntegrations")}
                  </span>
                </div>
              </div>
              <p className="mt-3 text-xs text-[#283618]/90">
                {t("permissionsInfo.crudNote", {
                  create: t("permissionsInfo.create"),
                  read: t("permissionsInfo.read"),
                  update: t("permissionsInfo.update"),
                  delete: t("permissionsInfo.delete"),
                })}
              </p>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
