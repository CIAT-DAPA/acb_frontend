"use client";

import FormCardPage from "./FormCardPage";
import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import { PERMISSION_ACTIONS, MODULES } from '@/types/core';

export default function CreateCard() {
  return (
    <ProtectedRoute requiredPermission={{ action: PERMISSION_ACTIONS.Create, module: MODULES.CARD_MANAGEMENT }}>
      <FormCardPage />
    </ProtectedRoute>
  );
}
