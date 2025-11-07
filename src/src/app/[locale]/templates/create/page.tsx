"use client";

import CreateTemplatePage from './FormTemplatePage';
import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import { MODULES, PERMISSION_ACTIONS } from "@/types/core";

export default function CreateTemplate() {
  return (
    <ProtectedRoute requiredPermission={{ action: PERMISSION_ACTIONS.Create, module: MODULES.TEMPLATE_MANAGEMENT }}>
      <CreateTemplatePage />
    </ProtectedRoute>
  );
}
