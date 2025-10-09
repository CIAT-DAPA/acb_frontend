"use client";

import FormCardPage from "./FormCardPage";
import { ProtectedRoute } from "../../../../components/ProtectedRoute";

export default function CreateCard() {
  return (
    <ProtectedRoute>
      <FormCardPage />
    </ProtectedRoute>
  );
}
