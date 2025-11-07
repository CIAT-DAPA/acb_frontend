"use client";

import { AuthProvider } from "@/hooks/useAuth";

interface AuthProviderWrapperProps {
  children: React.ReactNode;
}

export const AuthProviderWrapper: React.FC<AuthProviderWrapperProps> = ({
  children,
}) => {
  return <AuthProvider>{children}</AuthProvider>;
};
