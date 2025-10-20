"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Users,
  Save,
  AlertCircle,
  Info,
  Globe,
  Plus,
  Trash2,
  UserCheck,
  Loader2,
} from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { ProtectedRoute } from "../../../../../components/ProtectedRoute";
import { useToast } from "../../../../../components/Toast";
import {
  container,
  btnPrimary,
  btnOutlineSecondary,
  pageTitle,
  pageSubtitle,
  inputField,
} from "../../../components/ui";
import { GroupAPIService } from "@/services/groupService";
import { RoleAPIService } from "@/services/roleService";
import { UserService } from "@/services/userService";
import { GroupUserRole } from "@/types/groups";
import { Role } from "@/types/roles";
import { User } from "@/types/user";

export default function EditGroupPage() {
  const t = useTranslations("CreateGroup");
  const router = useRouter();
  const params = useParams();
  const groupId = params.id as string;
  const { showToast } = useToast();

  // Estados del formulario
  const [groupName, setGroupName] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [usersAccess, setUsersAccess] = useState<GroupUserRole[]>([]);

  // Estados para datos de la API
  const [roles, setRoles] = useState<Role[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Estados de UI
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    groupName?: string;
    country?: string;
    description?: string;
    usersAccess?: string;
  }>({});

  useEffect(() => {
    loadRoles();
    loadUsers();
    loadGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await RoleAPIService.getRoles();
      if (response.success) setRoles(response.data);
    } catch (error) {
      console.error("Error loading roles:", error);
      showToast("Error de conexión al cargar los roles", "error", 4000);
    } finally {
      setLoadingRoles(false);
    }
  };

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await UserService.getActiveUsers();
      if (response.success && response.data) setUsers(response.data);
    } catch (error) {
      console.error("Error loading users:", error);
      showToast("Error de conexión al cargar los usuarios", "error", 4000);
    } finally {
      setLoadingUsers(false);
    }
  };

  const loadGroup = async () => {
    setIsLoading(true);
    try {
      if (!groupId) {
        setIsLoading(false);
        setErrors({ groupName: t("invalidId") });
        return;
      }

      const response = await GroupAPIService.getGroupById(groupId);
      if (response.success && response.data) {
        const grp = response.data;
        setGroupName(grp.group_name || "");
        setCountry((grp.country || "").toUpperCase());
        setDescription(grp.description || "");
        setUsersAccess(grp.users_access || []);
      } else {
        showToast(response.message || t("loadError"), "error", 4000);
        router.push("/groups");
      }
    } catch (error) {
      console.error("Error loading group:", error);
      showToast(t("connectionError"), "error", 4000);
      router.push("/groups");
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!groupName.trim()) newErrors.groupName = t("groupNameRequired");
    else if (groupName.length < 3) newErrors.groupName = t("groupNameMinLength");

    if (!country.trim()) newErrors.country = t("countryRequired");
    else if (country.length !== 2) newErrors.country = t("countryInvalid");

    if (!description.trim()) newErrors.description = t("descriptionRequired");
    else if (description.length < 10) newErrors.description = t("descriptionMinLength");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addUser = () => setUsersAccess((prev) => [...prev, { user_id: "", role_id: "" }]);

  const removeUser = (index: number) => setUsersAccess((prev) => prev.filter((_, i) => i !== index));

  const updateUser = (index: number, field: "user_id" | "role_id", value: string) => {
    setUsersAccess((prev) => {
      const clone = [...prev];
      clone[index] = { ...clone[index], [field]: value };
      return clone;
    });
  };

  const getCountryFlag = (countryCode: string): string => {
    if (countryCode.length !== 2) return "🌐";
    try {
      const codePoints = countryCode.toUpperCase().split("").map((char) => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return "🌐";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast(t("validationError"), "error", 4000);
      return;
    }

    setIsSubmitting(true);
    try {
      const validUsers = usersAccess.filter((u) => u.user_id.trim() && u.role_id.trim());

      const response = await GroupAPIService.updateGroup(groupId, {
        group_name: groupName.trim(),
        country: country.trim().toUpperCase(),
        description: description.trim(),
        users_access: validUsers,
      });

      if (response.success) {
        showToast(t("updateSuccess"), "success", 4000);
        router.push("/groups");
      } else {
        showToast(response.message || t("updateError"), "error", 4000);
      }
    } catch (error) {
      console.error("Error updating group:", error);
      showToast(t("connectionError"), "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute requiredPermission={{ action: "u", module: "access_control", resourceGroupIds: [groupId] }}>
        <main>
          <section className="bg-white py-10">
            <div className={container}>
              <div className="flex justify-center items-center py-20">
                <Loader2 className="h-8 w-8 text-[#606c38] animate-spin" />
                <span className="ml-3 text-[#283618]/70">{t("loading")}</span>
              </div>
            </div>
          </section>
        </main>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPermission={{ action: "u", module: "access_control", resourceGroupIds: [groupId] }}>
      <main>
        <section className="bg-white py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Link href="/groups" className="flex items-center gap-2 text-[#283618]/60 hover:text-[#283618] transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                    <span>{t("backToGroups")}</span>
                  </Link>
                </div>
                <h1 className={pageTitle}>{t("titleEdit")}</h1>
                <p className={pageSubtitle}>{t("subtitleEdit")}</p>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-gradient-to-br from-[#606c38] to-[#283618] rounded-lg flex items-center justify-center rotate-6">
                  <Users className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="max-w-6xl mx-auto">
              {/* Información básica */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <h2 className="text-lg font-medium text-[#283618] mb-4 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  {t("basicInfo")}
                </h2>

                <div className="space-y-4">
                  {/* Nombre del grupo */}
                  <div>
                    <label htmlFor="groupName" className="block text-sm font-medium text-[#283618] mb-2">
                      {t("groupName")} *
                    </label>
                    <input type="text" id="groupName" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder={t("groupNamePlaceholder")} className={`${inputField} ${errors.groupName ? "border-red-500" : ""}`} disabled={isSubmitting} />
                    {errors.groupName && (<p className="text-sm text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.groupName}</p>)}
                  </div>

                  {/* Código del país */}
                  <div>
                    <label htmlFor="country" className="block text-sm font-medium text-[#283618] mb-2">{t("country")} *</label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input type="text" id="country" value={country} onChange={(e) => setCountry(e.target.value.toUpperCase())} placeholder={t("countryPlaceholder")} maxLength={2} className={`${inputField} uppercase ${errors.country ? "border-red-500" : ""}`} disabled={isSubmitting} />
                      </div>
                      <div className="flex-shrink-0 w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">{getCountryFlag(country)}</div>
                    </div>
                    {errors.country && (<p className="text-sm text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.country}</p>)}
                  </div>

                  {/* Descripción */}
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-[#283618] mb-2">{t("description")} *</label>
                    <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder={t("descriptionPlaceholder")} rows={3} className={`${inputField} w-full resize-none ${errors.description ? "border-red-500" : ""}`} disabled={isSubmitting} />
                    {errors.description && (<p className="text-sm text-red-600 mt-1 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{errors.description}</p>)}
                  </div>
                </div>
              </div>

              {/* Usuarios y Roles */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-[#283618] flex items-center gap-2"><UserCheck className="h-5 w-5" />{t("usersAccess")}</h2>
                    <p className="text-sm text-[#283618]/60 mt-1">{t("usersAccessDescription")}</p>
                  </div>
                  <button type="button" onClick={addUser} disabled={isSubmitting} className={`${btnOutlineSecondary} whitespace-nowrap`}><Plus className="h-4 w-4" />{t("addUser")}</button>
                </div>

                {usersAccess.length > 0 ? (
                  <div className="space-y-3">
                    {usersAccess.map((user, index) => (
                      <div key={index} className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#283618] mb-1">{t("userId")}</label>
                          <div className="flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-[#606c38] flex-shrink-0" />
                            {loadingUsers ? (
                              <div className="flex items-center gap-2 text-sm text-[#283618]/60"><Loader2 className="h-4 w-4 animate-spin" /><span>Cargando usuarios...</span></div>
                            ) : (
                              <select value={user.user_id} onChange={(e) => updateUser(index, "user_id", e.target.value)} className={`${inputField} text-sm`} disabled={isSubmitting}>
                                <option value="">{t("selectUser")}</option>
                                {users.map((u) => (<option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>))}
                              </select>
                            )}
                          </div>
                        </div>

                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#283618] mb-1">{t("roleId")}</label>
                          <div className="flex items-center gap-2">
                            {loadingRoles ? (
                              <div className="flex items-center gap-2 text-sm text-[#283618]/60"><Loader2 className="h-4 w-4 animate-spin" /><span>Cargando roles...</span></div>
                            ) : (
                              <select value={user.role_id} onChange={(e) => updateUser(index, "role_id", e.target.value)} className={`${inputField} text-sm`} disabled={isSubmitting}>
                                <option value="">{t("selectRole")}</option>
                                {roles.map((r) => (<option key={r._id} value={r._id}>{r.role_name}</option>))}
                              </select>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <button type="button" onClick={() => removeUser(index)} disabled={isSubmitting} className={`${btnOutlineSecondary}`}><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <UserCheck className="h-12 w-12 text-[#283618]/30 mx-auto mb-2" />
                    <p className="text-sm text-[#283618]/60">{t("noUsersAdded")}</p>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 justify-between">
                <Link href="/groups" className={`${btnOutlineSecondary} px-6`}>{t("cancel")}</Link>
                <button type="submit" disabled={isSubmitting} className={`${btnPrimary} ${isSubmitting ? "opacity-50 cursor-not-allowed" : ""}`}>
                  {isSubmitting ? (<div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />) : (<><Save className="h-5 w-5" /><span className="ml-2">{t("updateGroup")}</span></>)}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
