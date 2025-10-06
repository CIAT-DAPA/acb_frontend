"use client";

import CreateTemplatePage from './FormTemplatePage';
import { ProtectedRoute } from "../../../../components/ProtectedRoute";

export default function CreateTemplate() {
  return (
    <ProtectedRoute>
      <CreateTemplatePage />
    </ProtectedRoute>
  );
}
