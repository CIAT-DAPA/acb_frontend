"use client";

import FormBulletinPage from './FormBulletinPage';
import { ProtectedRoute } from "../../../../components/ProtectedRoute";

export default function CreateBulletinPage() {
  return (
    <ProtectedRoute>
      <FormBulletinPage />
    </ProtectedRoute>
  );
}
