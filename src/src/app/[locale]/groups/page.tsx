"use client";

import { useTranslations } from "next-intl";
import { useState, useEffect } from "react";
import {
  Users,
  Loader2,
  Search,
  AlertCircle,
  Globe,
  Plus,
  ChevronDown,
  ChevronUp,
  Edit3,
  UserCheck,
  Shield,
} from "lucide-react";
import { GroupAPIService } from "../../../services/groupService";
import { ProtectedRoute } from "../../../components/ProtectedRoute";
import { Group } from "@/types/groups";
import usePermissions from "@/hooks/usePermissions";
import {
  container,
  searchField,
  pageTitle,
  pageSubtitle,
  btnPrimary,
  btnOutlineSecondary,
} from "../components/ui";
import Link from "next/link";
import { PERMISSION_ACTIONS, MODULES } from "@/types/core";

export default function GroupsPage() {
  const t = useTranslations("Groups");
  const { can, isSuperadmin } = usePermissions();

  const [searchTerm, setSearchTerm] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Función para alternar expansión de un grupo
  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Cargar grupos al montar el componente
  useEffect(() => {
    loadGroups();
  }, []);

  // Función para cargar grupos desde la API
  const loadGroups = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await GroupAPIService.getGroups({ include_users: true });

      if (response.success) {
        console.log("Fetched groups:", response);
        setGroups(response.data);
        setFilteredGroups(response.data);
      } else {
        setError(response.message || "Error al cargar los grupos");
      }
    } catch (err) {
      setError("Error de conexión al cargar los grupos");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar grupos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredGroups(groups);
    } else {
      const filtered = groups.filter(
        (group) =>
          group.group_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
          group.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredGroups(filtered);
    }
  }, [searchTerm, groups]);

  // Función para contar usuarios en un grupo
  const countUsers = (group: Group): number => {
    return group.users_access.length;
  };

  // Función para contar roles únicos en un grupo
  const countUniqueRoles = (group: Group): number => {
    const uniqueRoles = new Set(group.users_access.map((ua) => ua.role_id));
    return uniqueRoles.size;
  };

  // Función para obtener código de bandera del país
  const getCountryFlag = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map((char) => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  };

  return (
    <ProtectedRoute requiredPermission={{ action: PERMISSION_ACTIONS.Read, module: MODULES.ACCESS_CONTROL }}>
      <main>
        <section className="desk-texture desk-texture-strong bg-[#fefae0] py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <h1 className={pageTitle}>{t("title")}</h1>
                <p className={pageSubtitle}>{t("subtitle")}</p>
              </div>
              <div className="hidden lg:block rotate-12">
                <Users
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

            {/* Botón Crear (condicionado) */}
            {isSuperadmin && can(PERMISSION_ACTIONS.Create, MODULES.ACCESS_CONTROL ) && (
              <Link href="/groups/create" className={`${btnPrimary} whitespace-nowrap`}>
                <Plus className="h-5 w-5" />
                <span>{t("createNew")}</span>
              </Link>
            )}
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

          {/* Lista de Grupos */}
          {!loading && !error && (
            <>
              {/* Información de resultados */}
              <div className="mb-4 text-sm text-[#283618]/70">
                {searchTerm ? (
                  <span>
                    {t("showing", {
                      filtered: filteredGroups.length,
                      total: groups.length,
                    })}
                  </span>
                ) : (
                  <span>{t("totalGroups", { count: groups.length })}</span>
                )}
              </div>

              {/* Lista de Grupos con Cards */}
              {filteredGroups.length > 0 ? (
                <div className="space-y-4">
                  {filteredGroups.map((group) => {
                    const usersCount = countUsers(group);
                    const rolesCount = countUniqueRoles(group);
                    const groupId = group._id || "";

                    return (
                      <div
                        key={groupId}
                        className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                      >
                        {/* Header del Grupo */}
                        <div className="p-6 border-b border-gray-200">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              {/* Icono y bandera */}
                              <div className="flex-shrink-0">
                                <div className="h-12 w-12 bg-[#606c38]/10 rounded-full flex items-center justify-center mb-1">
                                  <Users className="h-6 w-6 text-[#606c38]" />
                                </div>
                                <div className="text-2xl text-center">
                                  {getCountryFlag(group.country)}
                                </div>
                              </div>

                              {/* Info del grupo */}
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-lg font-semibold text-[#283618]">
                                    {group.group_name}
                                  </h3>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    <Globe className="h-3 w-3 mr-1" />
                                    {group.country.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-sm text-[#283618]/70 mb-3">
                                  {group.description}
                                </p>

                                {/* Stats */}
                                <div className="flex items-center gap-6">
                                  <div className="flex items-center gap-2">
                                    <UserCheck className="h-4 w-4 text-[#606c38]" />
                                    <span className="text-sm text-[#283618]/70">
                                      {t("table.membersCount", {
                                        count: usersCount,
                                      })}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-[#606c38]" />
                                    <span className="text-sm text-[#283618]/70">
                                      {t("table.rolesCount", {
                                        count: rolesCount,
                                      })}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Botones de acciones */}
                            <div className="flex-shrink-0 flex items-center gap-2">
                              {can(PERMISSION_ACTIONS.Update, MODULES.ACCESS_CONTROL, [groupId]) && (
                                <Link
                                  href={`/groups/${groupId}/edit`}
                                  className={btnOutlineSecondary}
                                  title={t("table.edit")}
                                >
                                  <Edit3 className="h-4 w-4" />
                                  {t("table.edit")}
                                </Link>
                              )}
                              <button
                                onClick={() => toggleGroupExpansion(groupId)}
                                className={btnOutlineSecondary}
                                title={
                                  expandedGroups.has(groupId)
                                    ? t("table.hide")
                                    : t("table.viewDetails")
                                }
                              >
                                {expandedGroups.has(groupId) ? (
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

                        {/* Usuarios y Roles - Solo visible cuando está expandido */}
                        {expandedGroups.has(groupId) && (
                          <div className="p-6 border-t border-gray-200 bg-gray-50">
                            <h4 className="text-sm font-semibold text-[#283618] mb-4">
                              {t("table.usersAndRoles")}
                            </h4>

                            {group.users_access.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="px-4 py-2 text-left text-xs font-medium text-[#283618]/70 uppercase tracking-wider">
                                        {t("table.user")}
                                      </th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-[#283618]/70 uppercase tracking-wider">
                                        {t("table.role")}
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200">
                                    {group.users_access.map(
                                      (userAccess, idx) => (
                                        <tr
                                          key={idx}
                                          className="hover:bg-white transition-colors"
                                        >
                                          <td className="px-4 py-3 text-sm text-[#283618]">
                                            <div className="flex items-center gap-2">
                                              <div className="h-8 w-8 bg-[#606c38]/10 rounded-full flex items-center justify-center">
                                                <UserCheck className="h-4 w-4 text-[#606c38]" />
                                              </div>
                                              <span className="font-mono text-xs text-[#283618]/70">
                                                {userAccess.user_first_name ? `${userAccess.user_first_name} ${userAccess.user_last_name}` : userAccess.user_id}
                                              </span>
                                            </div>
                                          </td>
                                          <td className="px-4 py-3 text-sm">
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#606c38]/10 text-[#283618]">
                                              <Shield className="h-3 w-3 mr-1" />
                                              <span className="font-mono">
                                                {userAccess.role_name || userAccess.role_id}
                                              </span>
                                            </span>
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="text-center py-8 text-sm text-[#283618]/50">
                                <UserCheck className="h-12 w-12 mx-auto mb-2 text-[#283618]/30" />
                                {t("table.noUsers")}
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
                  <Users className="h-12 w-12 text-[#283618]/50 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-[#283618] mb-1">
                    {t("noResults")}
                  </h3>
                  <p className="text-sm text-[#283618]/60">
                    {searchTerm ? t("noResultsSearch") : t("noGroupsSystem")}
                  </p>
                </div>
              )}
            </>
          )}

          {/* Información sobre grupos */}
          {!loading && !error && groups.length > 0 && (
            <div className="mt-8 bg-orange-50 border border-[#bc6c25] rounded-lg p-6">
              <h3 className="text-sm font-medium text-[#283618] mb-3 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                {t("groupsInfo.title")}
              </h3>
              <p className="text-sm text-[#283618] mb-3">
                {t("groupsInfo.description")}
              </p>
              <div className="mt-3">
                <p className="text-sm font-medium text-[#283618] mb-2">
                  {t("groupsInfo.benefits")}
                </p>
                <ul className="space-y-1 text-sm text-[#283618]">
                  <li className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span>{t("groupsInfo.benefit1")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span>{t("groupsInfo.benefit2")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span>{t("groupsInfo.benefit3")}</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-medium">•</span>
                    <span>{t("groupsInfo.benefit4")}</span>
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </main>
    </ProtectedRoute>
  );
}
