"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
} from "react";
import Keycloak, { KeycloakTokenParsed } from "keycloak-js";
import {
  AuthAPIService,
  TokenValidationResponse,
} from "@/services/authService";

interface AuthContextType {
  userInfo: any | null;
  token: string | null;
  tokenParsed: KeycloakTokenParsed | null;
  authenticated: boolean;
  loading: boolean;
  validatedPayload: TokenValidationResponse | null;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenParsed, setTokenParsed] = useState<KeycloakTokenParsed | null>(
    null
  );
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [validatedPayload, setValidatedPayload] =
    useState<TokenValidationResponse | null>(null);
  const isRun = useRef(false);
  const keycloak = useRef<Keycloak | null>(null);

  // Función para validar token con el backend
  const validateTokenWithBackend = async (token: string) => {
    try {
      const validation = await AuthAPIService.validateToken(token);

      if (validation.success && validation.data?.valid) {
        setValidatedPayload(validation.data);
      } else {
        console.warn("Token validation failed:", validation.message);
        setValidatedPayload(null);
      }
    } catch (error) {
      console.error("Error validating token with backend:", error);
      setValidatedPayload(null);
    }
  };

  useEffect(() => {
    // Prevent multiple initializations
    if (isRun.current) return;
    isRun.current = true;

    // Initialize Keycloak only on client side
    keycloak.current = new Keycloak({
      url:
        process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
        "https://ganausers.alliance.cgiar.org",
      realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "GanaBosques",
      clientId: process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "GanabosquesWeb",
    });

    keycloak.current
      .init({
        onLoad: "check-sso",
        checkLoginIframe: false,
        pkceMethod: "S256",
      })
      .then(async (authenticatedResult) => {
        console.log(
          "Keycloak initialized. Authenticated:",
          authenticatedResult
        );
        setAuthenticated(authenticatedResult);

        if (authenticatedResult && keycloak.current) {
          setToken(keycloak.current.token || null);
          setTokenParsed(keycloak.current.tokenParsed || null);

          // Load user info from Keycloak
          try {
            const userInfo = await keycloak.current.loadUserInfo();
            setUserInfo(userInfo);
          } catch (error) {
            console.error("Error loading user info:", error);
            // Fallback to tokenParsed if loadUserInfo fails
            setUserInfo(keycloak.current.tokenParsed || null);
          }

          // Validate token with backend
          if (keycloak.current.token) {
            await validateTokenWithBackend(keycloak.current.token);
          }
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error inicializando Keycloak:", error);
        setLoading(false);
      });
  }, []);

  // Token refresh effect
  useEffect(() => {
    if (!authenticated || !keycloak.current) return;

    const interval = setInterval(() => {
      if (keycloak.current) {
        keycloak.current
          .updateToken(60)
          .then(async (refreshed) => {
            if (refreshed && keycloak.current) {
              console.log("Token refreshed");
              setToken(keycloak.current.token || null);
              setTokenParsed(keycloak.current.tokenParsed || null);

              // Reload user info after token refresh
              try {
                const userInfo = await keycloak.current.loadUserInfo();
                setUserInfo(userInfo);
              } catch (error) {
                console.error("Error loading user info after refresh:", error);
                setUserInfo(keycloak.current.tokenParsed || null);
              }

              // Revalidate token with backend
              if (keycloak.current.token) {
                await validateTokenWithBackend(keycloak.current.token);
              }
            }
          })
          .catch(() => {
            console.warn("No se pudo actualizar el token, cerrando sesión");
            setAuthenticated(false);
            setToken(null);
            setTokenParsed(null);
            setUserInfo(null);
            setValidatedPayload(null);
          });
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [authenticated]);

  const login = () => {
    if (keycloak.current) {
      keycloak.current.login();
    }
  };

  const logout = () => {
    if (keycloak.current) {
      keycloak.current.logout({ redirectUri: window.location.origin });
      setUserInfo(null);
      setToken(null);
      setTokenParsed(null);
      setAuthenticated(false);
      setValidatedPayload(null);
    }
  };

  const contextValue: AuthContextType = {
    userInfo,
    token,
    tokenParsed,
    authenticated,
    loading,
    validatedPayload,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
