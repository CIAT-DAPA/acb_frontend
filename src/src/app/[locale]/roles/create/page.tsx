"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { JSX, useState } from "react";
import {
  ArrowLeft,
  Shield,
  Save,
  AlertCircle,
  Info,
  CheckCircle,
  Edit3,
  Eye,
  RefreshCcw,
  Trash2,
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
import { RoleAPIService } from "@/services/roleService";
import {
  RolePermissions,
  PermissionModule,
  CRUDOperation,
} from "@/types/roles";

// Información sobre operaciones CRUD (solo iconos, los nombres vienen de traducciones)
const crudInfo: Record<CRUDOperation, { icon: JSX.Element }> = {
  c: { icon: <Edit3 className="h-4 w-4" /> },
  r: { icon: <Eye className="h-4 w-4" /> },
  u: { icon: <RefreshCcw className="h-4 w-4" /> },
  d: { icon: <Trash2 className="h-4 w-4" /> },
};

export default function CreateRolePage() {
  const t = useTranslations("CreateRole");

  // Función para obtener información de módulos con traducciones
  const getModuleInfo = (module: PermissionModule) => {
    const moduleKey = module.replace(/_/g, "");
    const capitalizedKey =
      moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1);
    return {
      name: t(`modules.${moduleKey}.name`),
      description: t(`modules.${moduleKey}.description`),
    };
  };
  const router = useRouter();
  const { showToast } = useToast();

  // Estados del formulario
  const [roleName, setRoleName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<RolePermissions>({
    bulletins_composer: { c: false, r: false, u: false, d: false },
    template_management: { c: false, r: false, u: false, d: false },
    dashboard_bulletins: { c: false, r: false, u: false, d: false },
    review: { c: false, r: false, u: false, d: false },
    card_management: { c: false, r: false, u: false, d: false },
    access_control: { c: false, r: false, u: false, d: false },
    external_integrations: { c: false, r: false, u: false, d: false },
  });

  // Estados de UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    roleName?: string;
    description?: string;
    permissions?: string;
  }>({});

  // Validar formulario
  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!roleName.trim()) {
      newErrors.roleName = t("roleNameRequired");
    } else if (roleName.length < 3) {
      newErrors.roleName = t("roleNameMinLength");
    }

    if (!description.trim()) {
      newErrors.description = t("descriptionRequired");
    } else if (description.length < 10) {
      newErrors.description = t("descriptionMinLength");
    }

    // Verificar que al menos un permiso esté habilitado
    const hasAnyPermission = Object.values(permissions).some((module) =>
      Object.values(module).some((value) => value)
    );

    if (!hasAnyPermission) {
      newErrors.permissions = t("permissionsRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Actualizar un permiso específico
  const togglePermission = (
    module: PermissionModule,
    operation: CRUDOperation
  ) => {
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        ...prev[module],
        [operation]: !prev[module][operation],
      },
    }));
  };

  // Habilitar/deshabilitar todos los permisos de un módulo
  const toggleAllModulePermissions = (module: PermissionModule) => {
    const allEnabled = Object.values(permissions[module]).every((v) => v);
    setPermissions((prev) => ({
      ...prev,
      [module]: {
        c: !allEnabled,
        r: !allEnabled,
        u: !allEnabled,
        d: !allEnabled,
      },
    }));
  };

  // Habilitar/deshabilitar todos los permisos de una operación CRUD
  const toggleAllOperationPermissions = (operation: CRUDOperation) => {
    const allEnabled = Object.keys(permissions).every(
      (module) => permissions[module as PermissionModule][operation]
    );
    setPermissions((prev) => {
      const newPermissions = { ...prev };
      Object.keys(newPermissions).forEach((module) => {
        newPermissions[module as PermissionModule][operation] = !allEnabled;
      });
      return newPermissions;
    });
  };

  // Contar permisos habilitados
  const countEnabledPermissions = (): number => {
    return Object.values(permissions).reduce((total, module) => {
      return total + Object.values(module).filter((v) => v).length;
    }, 0);
  };

  // Manejar submit del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast(t("validationError"), "error", 4000);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await RoleAPIService.createRole({
        role_name: roleName.trim(),
        description: description.trim(),
        permissions,
      });

      if (response.success) {
        showToast(t("createSuccess"), "success", 4000);
        router.push("/roles");
      } else {
        showToast(response.message || t("createError"), "error", 4000);
      }
    } catch (error) {
      console.error("Error creating role:", error);
      showToast(t("connectionError"), "error", 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <main>
        <section className="bg-white py-10">
          <div className={container}>
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center gap-4 mb-2">
                  <Link
                    href="/roles"
                    className="flex items-center gap-2 text-[#283618]/60 hover:text-[#283618] transition-colors"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    <span>{t("backToRoles")}</span>
                  </Link>
                </div>
                <h1 className={pageTitle}>{t("title")}</h1>
                <p className={pageSubtitle}>{t("subtitle")}</p>
              </div>
              <div className="hidden lg:block">
                <div className="w-32 h-32 bg-gradient-to-br from-[#606c38] to-[#283618] rounded-lg flex items-center justify-center rotate-6">
                  <Shield className="h-16 w-16 text-white" />
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
                  {/* Nombre del rol */}
                  <div>
                    <label
                      htmlFor="roleName"
                      className="block text-sm font-medium text-[#283618] mb-2"
                    >
                      {t("roleName")} *
                    </label>
                    <input
                      type="text"
                      id="roleName"
                      value={roleName}
                      onChange={(e) => setRoleName(e.target.value)}
                      placeholder={t("roleNamePlaceholder")}
                      className={`${inputField} ${
                        errors.roleName ? "border-red-500" : ""
                      }`}
                      disabled={isSubmitting}
                    />
                    {errors.roleName && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.roleName}
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
                      className={`${inputField} w-full ${
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

              {/* Configuración de permisos */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-medium text-[#283618] flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    {t("permissions")}
                  </h2>
                  <div className="text-sm text-[#283618]/70">
                    {t("permissionsEnabled")}:{" "}
                    <span className="font-semibold text-[#606c38]">
                      {countEnabledPermissions()} / 28
                    </span>
                  </div>
                </div>

                {errors.permissions && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{errors.permissions}</p>
                  </div>
                )}

                {/* Tabla de permisos */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-[#283618] border border-gray-200">
                          {t("module")}
                        </th>
                        {(["c", "r", "u", "d"] as CRUDOperation[]).map((op) => (
                          <th
                            key={op}
                            className="px-4 py-3 text-center text-sm font-medium text-[#283618] border border-gray-200"
                          >
                            <button
                              type="button"
                              onClick={() => toggleAllOperationPermissions(op)}
                              className="flex flex-col items-center gap-1 w-full hover:bg-gray-100 rounded p-1 transition-colors"
                              disabled={isSubmitting}
                            >
                              <span>{crudInfo[op].icon}</span>
                              <span>
                                {t(
                                  `crud.${
                                    op === "c"
                                      ? "create"
                                      : op === "r"
                                      ? "read"
                                      : op === "u"
                                      ? "update"
                                      : "delete"
                                  }`
                                )}
                              </span>
                            </button>
                          </th>
                        ))}
                        <th className="px-4 py-3 text-center text-sm font-medium text-[#283618] border border-gray-200">
                          {t("all")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        [
                          "bulletins_composer",
                          "template_management",
                          "dashboard_bulletins",
                          "review",
                          "card_management",
                          "access_control",
                          "external_integrations",
                        ] as PermissionModule[]
                      ).map((module) => {
                        const modulePerms = permissions[module];
                        const allEnabled = Object.values(modulePerms).every(
                          (v) => v
                        );
                        const someEnabled = Object.values(modulePerms).some(
                          (v) => v
                        );
                        const moduleData = getModuleInfo(module);

                        return (
                          <tr
                            key={module}
                            className="hover:bg-gray-50 transition-colors"
                          >
                            <td className="px-4 py-3 border border-gray-200">
                              <div>
                                <p className="font-medium text-[#283618] text-sm">
                                  {moduleData.name}
                                </p>
                                <p className="text-xs text-[#283618]/60">
                                  {moduleData.description}
                                </p>
                              </div>
                            </td>
                            {(["c", "r", "u", "d"] as CRUDOperation[]).map(
                              (op) => (
                                <td
                                  key={op}
                                  className="px-4 py-3 text-center border border-gray-200"
                                >
                                  <input
                                    type="checkbox"
                                    checked={modulePerms[op]}
                                    onChange={() =>
                                      togglePermission(module, op)
                                    }
                                    disabled={isSubmitting}
                                    className="w-5 h-5 text-[#606c38] border-gray-300 rounded focus:ring-[#606c38] cursor-pointer"
                                  />
                                </td>
                              )
                            )}
                            <td className="px-4 py-3 text-center border border-gray-200">
                              <button
                                type="button"
                                onClick={() =>
                                  toggleAllModulePermissions(module)
                                }
                                disabled={isSubmitting}
                                className={`px-3 py-1 text-xs rounded transition-colors ${
                                  allEnabled
                                    ? "bg-[#606c38] text-white hover:bg-[#283618]"
                                    : someEnabled
                                    ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                                    : "bg-gray-100 text-[#283618]/80 hover:bg-gray-200"
                                }`}
                              >
                                {allEnabled
                                  ? t("uncheckAll")
                                  : someEnabled
                                  ? t("complete")
                                  : t("checkAll")}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-4 justify-between">
                <Link href="/roles" className={`${btnOutlineSecondary} px-6`}>
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
                      <span>{t("createRole")}</span>
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
