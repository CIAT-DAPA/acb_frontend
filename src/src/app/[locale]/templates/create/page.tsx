"use client";

import CreateTemplatePage from './CreateTemplatePage';
import { ProtectedRoute } from "../../../../components/ProtectedRoute";

export default function CreateTemplate() {
  return (
    <ProtectedRoute>
      <CreateTemplatePage />
    </ProtectedRoute>
  );
}
