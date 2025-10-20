import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";

type Action = "c" | "r" | "u" | "d";
type ModuleKey = string;

export function usePermissions() {
  const { validatedPayload } = useAuth();

  const userGroups = (validatedPayload as any)?.payload?.user_db?.groups || [];

  const isSuperadmin = !!(
    (validatedPayload as any)?.payload?.user_db?.is_superadmin ||
    (validatedPayload as any)?.payload?.is_superadmin ||
    (validatedPayload as any)?.is_superadmin
  );

  const permsByGroup = useMemo(() => {
    const map: Record<string, any> = {};
    for (const g of userGroups) {
      if (g.group_id && g.role && g.role.permissions) {
        map[g.group_id] = g.role.permissions;
      }
    }
    return map;
  }, [userGroups]);

  // Calcular grupos donde el usuario actúa como "admin".
  // Criterio: role.role_name === 'admin' OR tiene permisos completos en el módulo 'access_control'
  const adminGroups = useMemo(() => {
    const res: string[] = [];
    for (const g of userGroups) {
      const gid = g.group_id;
      const role = g.role || {};
      const roleName = (role.role_name || "").toString().toLowerCase();
      const perms = role.permissions || {};
      const acc = perms.access_control;
      const hasFullAccessControl = !!(acc && acc.c && acc.r && acc.u && acc.d);
      if (gid && (roleName === "admin" || hasFullAccessControl)) {
        res.push(gid);
      }
    }
    return res;
  }, [userGroups]);

  const isAdminInGroup = (groupId?: string) => {
    if (isSuperadmin) return true;
    if (!groupId) return adminGroups.length > 0;
    return adminGroups.includes(groupId);
  };

  const isAdminAnywhere = isSuperadmin || adminGroups.length > 0;

  const can = (action: Action, module: ModuleKey, resourceGroupIds?: string[]) => {
    if (isSuperadmin) return true;

    if (!permsByGroup || Object.keys(permsByGroup).length === 0) return false;

    if (Array.isArray(resourceGroupIds) && resourceGroupIds.length > 0) {
      for (const gid of resourceGroupIds) {
        const perms = permsByGroup[gid];
        if (perms && perms[module] && perms[module][action]) return true;
      }
      return false;
    }

    for (const gid of Object.keys(permsByGroup)) {
      const perms = permsByGroup[gid];
      if (perms && perms[module] && perms[module][action]) return true;
    }

    return false;
  };

  return { can, permsByGroup, userGroups, isSuperadmin, adminGroups, isAdminInGroup, isAdminAnywhere };
}

export default usePermissions;
