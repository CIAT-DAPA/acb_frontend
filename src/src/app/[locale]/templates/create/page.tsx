"use client";

import CreateTemplatePage from './FormTemplatePage';
import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import usePermissions from "@/hooks/usePermissions";

export default function CreateTemplate() {
  return (
    <ProtectedRoute requiredPermission={{ action: "c", module: "template_management" }}>
      <CreateTemplatePage />
    </ProtectedRoute>
  );
}
