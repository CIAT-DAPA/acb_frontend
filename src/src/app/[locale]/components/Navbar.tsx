"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Menu, X, LogOut, ChevronDown } from "lucide-react";
import { container, brand, btnOutlinePrimary, btnPrimary } from "./ui";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "../../../hooks/useAuth";
import usePermissions from "../../../hooks/usePermissions";
import { MODULES } from "../../../types/core";
import Image from "next/image";

// Clases simples con colores corregidos
const NAV_BASE = "py-2 px-3 transition-colors duration-200 relative";
const NAV_INACTIVE =
  "text-[#fefae0]/80 hover:text-[#ffaf68] hover:after:content-[''] hover:after:absolute hover:after:bottom-0 hover:after:left-3 hover:after:right-3 hover:after:h-0.5 hover:after:bg-[#ffaf68]";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showConfigMenu, setShowConfigMenu] = useState(false);
  const [showWorkspacesMenu, setShowWorkspacesMenu] = useState(false);
  const t = useTranslations("Navbar");
  const { can, isAdminAnywhere, isSuperadmin } = usePermissions();

  // Hook de autenticación
  const { authenticated, loading, userInfo, token, login, logout } = useAuth();

  // Items de configuración
  const CONFIG_ITEMS = [
    {
      name: t("templates"),
      path: "/templates",
      requiresAuth: true,
      module: MODULES.TEMPLATE_MANAGEMENT,
    },
    {
      name: t("cards"),
      path: "/cards",
      requiresAuth: true,
      module: MODULES.CARD_MANAGEMENT,
    },
    {
      name: t("visualResources"),
      path: "/templates/visual-resources",
      requiresAuth: true,
      module: MODULES.TEMPLATE_MANAGEMENT, // Usar el mismo módulo que templates
    },
  ];

  // Filtrar items de configuración según permisos
  const VISIBLE_CONFIG_ITEMS = CONFIG_ITEMS.filter(
    (item) => !item.requiresAuth || (authenticated && can("r", item.module))
  );

  // Verificar si el usuario puede ver bulletins
  const canSeeBulletins = authenticated && can("r", MODULES.BULLETINS_COMPOSER);

  // Función para toggle del menú móvil
  const toggleMenu = () => setIsOpen(!isOpen);

  // Items de administración
  const ADMIN_ITEMS = [
    ...(isSuperadmin ? [{ name: t("roles"), path: "/roles" as const }] : []),
    { name: t("groups"), path: "/groups" as const },
  ];

  const getInitials = (firstName?: string, lastName?: string) => {
    const initials = [];
    if (firstName) initials.push(firstName.charAt(0).toUpperCase());
    if (lastName) initials.push(lastName.charAt(0).toUpperCase());

    // Si no hay iniciales, usar la primera letra del nombre de usuario
    if (initials.length === 0 && userInfo?.preferred_username) {
      initials.push(userInfo.preferred_username.charAt(0).toUpperCase());
    }

    return initials.join("") || t("defaultInitial");
  };

  // Componente reutilizable para dropdowns (escritorio)
  const DropdownMenu = ({
    label,
    isOpen,
    onToggle,
    items,
    onItemClick,
  }: {
    label: string;
    isOpen: boolean;
    onToggle: () => void;
    items: { name: string; path: string }[];
    onItemClick: (path: string) => void;
  }) => (
    <li className="relative">
      <button
        onClick={onToggle}
        className={`${NAV_BASE} ${NAV_INACTIVE} flex items-center gap-1 cursor-pointer`}
      >
        {label}
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
          {items.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => onItemClick(item.path)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </li>
  );

  // Componente reutilizable para dropdowns (móvil)
  const MobileDropdownMenu = ({
    label,
    isOpen,
    onToggle,
    items,
  }: {
    label: string;
    isOpen: boolean;
    onToggle: () => void;
    items: { name: string; path: string }[];
  }) => (
    <li>
      <button
        onClick={onToggle}
        className="flex items-center gap-1 text-[#fefae0]/80 hover:text-[#ffaf68] transition-colors w-full"
      >
        {label}
        <ChevronDown
          size={16}
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <ul className="pl-4 mt-2 space-y-2">
          {items.map((item) => (
            <li key={item.path}>
              <Link
                href={item.path}
                onClick={() => {
                  onToggle();
                  setIsOpen(false);
                }}
                className="block text-[#fefae0]/70 hover:text-[#ffaf68] transition-colors text-sm"
              >
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </li>
  );

  return (
    <nav className="bg-[#283618] border-b border-[#283618]/80 sticky top-0 z-50">
      <div
        className={`${container} w-full flex items-center justify-between py-4`}
      >
        {/* Logo */}
        <Link
          href="/"
          className={`${brand} text-2xl font-bold py-2 hover:text-[#ffaf68] transition-colors`}
        >
          <Image
            src="/assets/img/bulletinLogo.png"
            alt="logo del bulletin builder"
            width={34}
            height={37}
          />
          <span className="font-headers">{t("brand")}</span>
        </Link>

        {/* Botón hamburguesa */}
        <button
          onClick={toggleMenu}
          className="lg:hidden text-[#fefae0]/80"
          aria-label={isOpen ? t("closeMenu") : t("openMenu")}
        >
          {isOpen ? (
            <X size={24} className="cursor-pointer hover:text-[#fefae0]" />
          ) : (
            <Menu size={24} className="cursor-pointer hover:text-[#fefae0]" />
          )}
        </button>

        {/* Menú y usuario en escritorio */}
        <div className="hidden lg:flex items-center space-x-4">
          {/* Links de navegación */}
          <ul className="flex font-medium space-x-1 items-center">
            {/* Botón de Bulletins destacado - PRIMERO */}
            {canSeeBulletins && (
              <li>
                <Link href="/bulletins" className={btnPrimary}>
                  {t("bulletins")}
                </Link>
              </li>
            )}

            {/* Dropdown de Content */}
            {authenticated && VISIBLE_CONFIG_ITEMS.length > 0 ? (
              <DropdownMenu
                label={t("content")}
                isOpen={showConfigMenu}
                onToggle={() => setShowConfigMenu(!showConfigMenu)}
                items={VISIBLE_CONFIG_ITEMS}
                onItemClick={() => setShowConfigMenu(false)}
              />
            ) : null}

            {/* Dropdown de Administration */}
            {authenticated && isAdminAnywhere && (
              <DropdownMenu
                label={t("administration")}
                isOpen={showWorkspacesMenu}
                onToggle={() => setShowWorkspacesMenu(!showWorkspacesMenu)}
                items={ADMIN_ITEMS}
                onItemClick={() => setShowWorkspacesMenu(false)}
              />
            )}

            {/* Link de Partners */}
            <li>
              <Link href="/partners" className={`${NAV_BASE} ${NAV_INACTIVE}`}>
                {t("partners")}
              </Link>
            </li>
          </ul>

          {/* Selector de idioma */}
          <LanguageSelector />

          {/* Botón de login/usuario */}
          <div className="flex items-center">
            {loading ? (
              <div className="animate-spin h-4 w-4 border-2 border-[#ffaf68] border-t-transparent rounded-full"></div>
            ) : !authenticated ? (
              <button onClick={login} className={btnOutlinePrimary}>
                {t("login")}
              </button>
            ) : (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center justify-center w-10 h-10 bg-[#bc6c25] text-[#fefae0] font-semibold rounded-full hover:bg-[#bc6c25]/90 transition-colors cursor-pointer"
                  title={
                    userInfo?.preferred_username || userInfo?.name || t("user")
                  }
                >
                  {getInitials(
                    userInfo?.given_name || "",
                    userInfo?.family_name || ""
                  )}
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {userInfo?.name || userInfo?.preferred_username}
                      </p>
                      <p className="text-xs text-gray-500">{userInfo?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      {t("logout")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Menú móvil */}
      {isOpen && (
        <div className="lg:hidden bg-[#283618] px-6 sm:px-8 md:px-12 py-4 space-y-3">
          <ul className="flex flex-col space-y-3">
            {/* Botón de Bulletins destacado - Móvil - PRIMERO */}
            {canSeeBulletins && (
              <li>
                <Link
                  href="/bulletins"
                  onClick={() => setIsOpen(false)}
                  className={`${btnPrimary} justify-center text-center`}
                >
                  {t("bulletins")}
                </Link>
              </li>
            )}

            {/* Dropdown de Content - Móvil */}
            {authenticated && VISIBLE_CONFIG_ITEMS.length > 0 ? (
              <MobileDropdownMenu
                label={t("content")}
                isOpen={showConfigMenu}
                onToggle={() => setShowConfigMenu(!showConfigMenu)}
                items={VISIBLE_CONFIG_ITEMS}
              />
            ) : null}

            {/* Dropdown de Administration - Móvil */}
            {authenticated && isAdminAnywhere && (
              <MobileDropdownMenu
                label={t("administration")}
                isOpen={showWorkspacesMenu}
                onToggle={() => setShowWorkspacesMenu(!showWorkspacesMenu)}
                items={ADMIN_ITEMS}
              />
            )}

            {/* Link de Partners - Móvil */}
            <li>
              <Link
                href="/partners"
                onClick={() => setIsOpen(false)}
                className="text-[#fefae0]/80 hover:text-[#ffaf68] transition-colors"
              >
                {t("partners")}
              </Link>
            </li>
          </ul>

          {/* Selector de idioma móvil */}
          <div className="pt-3 border-t border-[#283618]/60">
            <LanguageSelector />
          </div>

          {/* Botón de login móvil */}
          <div className="pt-3">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin h-4 w-4 border-2 border-[#ffaf68] border-t-transparent rounded-full"></div>
                <span className="text-[#fefae0]/80">{t("loading")}</span>
              </div>
            ) : !authenticated ? (
              <button
                onClick={() => {
                  login();
                  setIsOpen(false);
                }}
                className="flex items-center space-x-3"
              >
                <div className={btnOutlinePrimary}>{t("login")}</div>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-[#fefae0]/80 pb-2 border-b border-[#283618]/60">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#bc6c25] text-[#fefae0] font-semibold cursor-pointer">
                    {getInitials(
                      userInfo?.given_name || "",
                      userInfo?.family_name || ""
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {userInfo?.name || userInfo?.preferred_username}
                    </p>
                    <p className="text-xs text-[#fefae0]/60">
                      {userInfo?.email}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setIsOpen(false);
                  }}
                  className="flex items-center space-x-2 text-[#fefae0]/80 hover:text-[#ffaf68] transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="text-sm">{t("logout")}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
