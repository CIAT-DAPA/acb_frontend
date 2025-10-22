"use client";

import FormBulletinPage from './FormBulletinPage';
import { ProtectedRoute } from "../../../../components/ProtectedRoute";
import { PERMISSION_ACTIONS, MODULES } from '@/types/core';

export default function CreateBulletinPage() {
  return (
    <ProtectedRoute requiredPermission={{ action: PERMISSION_ACTIONS.Create, module: MODULES.BULLETINS_COMPOSER }}>
      <FormBulletinPage />
    </ProtectedRoute>
  );
}
