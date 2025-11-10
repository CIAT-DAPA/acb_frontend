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
  Plus,
  Trash2,
  UserCheck,
  Shield,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import { useToast } from "../../../../components/Toast";
import {
  container,
  btnPrimary,
  btnOutlineSecondary,
  pageTitle,
  pageSubtitle,
  inputField,
} from "../../components/ui";
import SearchableSelect, {
  SearchableSelectOption,
} from "../../components/SearchableSelect";
import { GroupAPIService } from "@/services/groupService";
import { RoleAPIService } from "@/services/roleService";
import { UserService } from "@/services/userService";
import { GroupUserRole } from "@/types/groups";
import { Role } from "@/types/roles";
import { User } from "@/types/user";
import { PERMISSION_ACTIONS, MODULES } from "@/types/core";

export default function CreateGroupPage() {
  const t = useTranslations("CreateGroup");
  const router = useRouter();
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

  // Convertir datos a opciones para el SearchableSelect
  const userOptions: SearchableSelectOption[] = users.map((user) => ({
    id: user.id,
    label: `${user.first_name} ${user.last_name}`,
    description: user.ext_id,
  }));

  const roleOptions: SearchableSelectOption[] = roles.map((role) => ({
    id: role._id || "",
    label: role.role_name,
    description: role.description,
  }));

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    groupName?: string;
    country?: string;
    description?: string;
    usersAccess?: string;
  }>({});

  // Cargar roles y usuarios al montar el componente
  useEffect(() => {
    loadRoles();
    loadUsers();
  }, []);

  // Función para cargar roles desde la API
  const loadRoles = async () => {
    setLoadingRoles(true);
    try {
      const response = await RoleAPIService.getRoles();
      if (response.success) {
        setRoles(response.data);
      } else {
        showToast("Error al cargar los roles", "error", 4000);
      }
    } catch (error) {
      console.error("Error loading roles:", error);
      showToast("Error de conexión al cargar los roles", "error", 4000);
    } finally {
      setLoadingRoles(false);
    }
  };

  // Función para cargar usuarios desde la API
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await UserService.getActiveUsers();
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        showToast("Error al cargar los usuarios", "error", 4000);
      }
    } catch (error) {
      console.error("Error loading users:", error);
      showToast("Error de conexión al cargar los usuarios", "error", 4000);
    } finally {
      setLoadingUsers(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    const trimmed = {
      name: groupName.trim(),
      country: country.trim(),
      desc: description.trim(),
    };

    if (!trimmed.name) newErrors.groupName = t("groupNameRequired");
    else if (trimmed.name.length < 3)
      newErrors.groupName = t("groupNameMinLength");

    if (!trimmed.country) newErrors.country = t("countryRequired");
    else if (trimmed.country.length !== 2)
      newErrors.country = t("countryInvalid");

    if (!trimmed.desc) newErrors.description = t("descriptionRequired");
    else if (trimmed.desc.length < 10)
      newErrors.description = t("descriptionMinLength");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addUser = () =>
    setUsersAccess([...usersAccess, { user_id: "", role_id: "" }]);
  const removeUser = (index: number) =>
    setUsersAccess(usersAccess.filter((_, i) => i !== index));
  const updateUser = (
    index: number,
    field: "user_id" | "role_id",
    value: string
  ) => {
    const updated = [...usersAccess];
    updated[index][field] = value;
    setUsersAccess(updated);
  };

  // Función para obtener código de bandera del país
  const getCountryFlag = (countryCode: string): string => {
    if (countryCode.length !== 2) return "🌐";
    try {
      const codePoints = countryCode
        .toUpperCase()
        .split("")
        .map((char) => 127397 + char.charCodeAt(0));
      return String.fromCodePoint(...codePoints);
    } catch {
      return "🌐";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return showToast(t("validationError"), "error", 4000);

    setIsSubmitting(true);
    try {
      const response = await GroupAPIService.createGroup({
        group_name: groupName.trim(),
        country: country.trim().toUpperCase(),
        description: description.trim(),
        users_access: usersAccess.filter(
          (u) => u.user_id.trim() && u.role_id.trim()
        ),
      });

      showToast(
        response.success
          ? t("createSuccess")
          : response.message || t("createError"),
        response.success ? "success" : "error",
        4000
      );
      if (response.success) router.push("/groups");
    } catch (error) {
      console.error("Error creating group:", error);
      showToast(t("connectionError"), "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute
      requiredPermission={{
        action: PERMISSION_ACTIONS.Create,
        module: MODULES.ACCESS_CONTROL,
      }}
    >
      <main>
        <section className="bg-white py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Link
                    href="/groups"
                    className="flex items-center gap-2 text-[#283618]/60 hover:text-[#283618] transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>{t("backToGroups")}</span>
                  </Link>
                </div>
                <h1 className={pageTitle}>{t("title")}</h1>
                <p className={pageSubtitle}>{t("subtitle")}</p>
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
                    <label
                      htmlFor="groupName"
                      className="block text-sm font-medium text-[#283618] mb-2"
                    >
                      {t("groupName")} *
                    </label>
                    <input
                      type="text"
                      id="groupName"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder={t("groupNamePlaceholder")}
                      className={`${inputField} ${
                        errors.groupName ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.groupName && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.groupName}
                      </p>
                    )}
                  </div>

                  {/* Código del país */}
                  <div>
                    <label
                      htmlFor="country"
                      className="block text-sm font-medium text-[#283618] mb-2"
                    >
                      {t("country")} *
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <input
                          type="text"
                          id="country"
                          value={country}
                          onChange={(e) =>
                            setCountry(e.target.value.toUpperCase())
                          }
                          placeholder={t("countryPlaceholder")}
                          maxLength={2}
                          className={`${inputField} uppercase ${
                            errors.country ? "border-red-500" : ""
                          }`}
                          disabled={isSubmitting}
                        />
                      </div>
                      <div className="flex-shrink-0 w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-3xl">
                        {getCountryFlag(country)}
                      </div>
                    </div>
                    {errors.country && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.country}
                      </p>
                    )}
                  </div>

                  {/* Descripción */}
                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-[#283618] mb-2"
                    >
                      {t("description")} *
                    </label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder={t("descriptionPlaceholder")}
                      rows={3}
                      className={`${inputField} w-full resize-none ${
                        errors.description ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.description && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Usuarios y Roles */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-[#283618] flex items-center gap-2">
                      <UserCheck className="h-5 w-5" />
                      {t("usersAccess")}
                    </h2>
                    <p className="text-sm text-[#283618]/60 mt-1">
                      {t("usersAccessDescription")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addUser}
                    disabled={isSubmitting}
                    className={`${btnOutlineSecondary} whitespace-nowrap`}
                  >
                    <Plus className="h-4 w-4" />
                    {t("addUser")}
                  </button>
                </div>

                {usersAccess.length > 0 ? (
                  <div className="space-y-3">
                    {usersAccess.map((user, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        {/* User Select */}
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#283618] mb-1">
                            {t("userId")}
                          </label>
                          <SearchableSelect
                            options={userOptions}
                            value={user.user_id}
                            onChange={(value) =>
                              updateUser(index, "user_id", value)
                            }
                            placeholder={t("selectUser")}
                            loading={loadingUsers}
                            loadingText="Cargando usuarios..."
                            noResultsText={t("noUsersFound")}
                            disabled={isSubmitting}
                            icon={<UserCheck className="h-4 w-4" />}
                          />
                        </div>

                        {/* Role Select */}
                        <div className="flex-1">
                          <label className="block text-xs font-medium text-[#283618] mb-1">
                            {t("roleId")}
                          </label>
                          <SearchableSelect
                            options={roleOptions}
                            value={user.role_id}
                            onChange={(value) =>
                              updateUser(index, "role_id", value)
                            }
                            placeholder={t("selectRole")}
                            loading={loadingRoles}
                            loadingText="Cargando roles..."
                            noResultsText={t("noRolesFound")}
                            disabled={isSubmitting}
                            icon={<Shield className="h-4 w-4" />}
                          />
                        </div>

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeUser(index)}
                          disabled={isSubmitting}
                          className="mt-6 p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title={t("removeUser")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                    <UserCheck className="h-12 w-12 text-[#283618]/30 mx-auto mb-2" />
                    <p className="text-sm text-[#283618]/60">{t("noUsers")}</p>
                  </div>
                )}
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 justify-between">
                <Link href="/groups" className={`${btnOutlineSecondary} px-6`}>
                  {t("cancel")}
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`${btnPrimary} ${
                    isSubmitting ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{t("creating")}</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5" />
                      <span>{t("createGroup")}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </ProtectedRoute>
  );
}
