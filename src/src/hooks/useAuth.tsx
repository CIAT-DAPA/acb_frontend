"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
} from "react";
import Keycloak, { KeycloakTokenParsed } from "keycloak-js";

interface AuthContextType {
  userInfo: KeycloakTokenParsed | null;
  token: string | null;
  tokenParsed: KeycloakTokenParsed | null;
  authenticated: boolean;
  loading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<KeycloakTokenParsed | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tokenParsed, setTokenParsed] = useState<KeycloakTokenParsed | null>(
    null
  );
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const isRun = useRef(false);
  const keycloak = useRef<Keycloak | null>(null);

  useEffect(() => {
    // Prevent multiple initializations
    if (isRun.current) return;
    isRun.current = true;

    // Initialize Keycloak only on client side
    keycloak.current = new Keycloak({
      url: process.env.NEXT_PUBLIC_KEYCLOAK_URL || "http://localhost:8080",
      realm: process.env.NEXT_PUBLIC_KEYCLOAK_REALM || "aclimate",
      clientId:
        process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "bulletin_builder",
    });

    keycloak.current
      .init({
        onLoad: "check-sso",
        checkLoginIframe: false,
        pkceMethod: "S256",
      })
      .then((authenticatedResult) => {
        console.log(
          "Keycloak initialized. Authenticated:",
          authenticatedResult
        );
        setAuthenticated(authenticatedResult);
        setLoading(false);

        if (authenticatedResult && keycloak.current) {
          setToken(keycloak.current.token || null);
          setTokenParsed(keycloak.current.tokenParsed || null);
          setUserInfo(keycloak.current.tokenParsed || null);
        }
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
          .then((refreshed) => {
            if (refreshed && keycloak.current) {
              console.log("Token refreshed");
              setToken(keycloak.current.token || null);
              setTokenParsed(keycloak.current.tokenParsed || null);
              setUserInfo(keycloak.current.tokenParsed || null);
            }
          })
          .catch(() => {
            console.warn("No se pudo actualizar el token, cerrando sesión");
            setAuthenticated(false);
            setToken(null);
            setTokenParsed(null);
            setUserInfo(null);
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
    }
  };

  const contextValue: AuthContextType = {
    userInfo,
    token,
    tokenParsed,
    authenticated,
    loading,
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
