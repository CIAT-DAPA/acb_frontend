"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Cloud, User, LogOut, ChevronDown } from "lucide-react";
import { container, brand, brandIcon, btnOutlinePrimary } from "./ui";
import { LanguageSelector } from "./LanguageSelector";
import { useAuth } from "../../../hooks/useAuth";

// Clases simples con colores corregidos
const NAV_BASE = "py-2 px-3 transition-colors duration-200 relative";
const NAV_ACTIVE =
  "text-[#ffaf68] font-semibold after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#ffaf68]";
const NAV_INACTIVE =
  "text-[#fefae0]/80 hover:text-[#ffaf68] hover:after:content-[''] hover:after:absolute hover:after:bottom-0 hover:after:left-3 hover:after:right-3 hover:after:h-0.5 hover:after:bg-[#ffaf68]";

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccessMenu, setShowAccessMenu] = useState(false);
  const pathname = usePathname();
  const t = useTranslations("Navbar");

  // Hook de autenticación
  const { authenticated, loading, userInfo, token, login, logout } = useAuth();

  // Navegación condicional - solo mostrar rutas que requieren auth si está autenticado
  const ALL_NAV_ITEMS = [
    { name: t("templates"), path: "/templates", requiresAuth: true },
    { name: t("bulletins"), path: "/bulletins", requiresAuth: true },
  ];

  // Filtrar items según autenticación
  const NAV_ITEMS = ALL_NAV_ITEMS.filter(
    (item) => !item.requiresAuth || authenticated
  );

  // Función para toggle del menú móvil
  const toggleMenu = () => setIsOpen(!isOpen);

  const getInitials = (firstName?: string, lastName?: string) => {
    const initials = [];
    if (firstName) initials.push(firstName.charAt(0).toUpperCase());
    if (lastName) initials.push(lastName.charAt(0).toUpperCase());

    // Si no hay iniciales, usar la primera letra del nombre de usuario
    if (initials.length === 0 && userInfo?.preferred_username) {
      initials.push(userInfo.preferred_username.charAt(0).toUpperCase());
    }

    return initials.join("") || "U";
  };

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
          <Cloud className={brandIcon} />
          <span className="font-headers">Bulletin Builder</span>
        </Link>

        {/* Botón hamburguesa */}
        <button
          onClick={toggleMenu}
          className="lg:hidden text-[#fefae0]/80"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
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
            {NAV_ITEMS.map(({ name, path }) => {
              const active = pathname === path;
              return (
                <li key={path}>
                  <Link
                    href={path}
                    className={`${NAV_BASE} ${
                      active ? NAV_ACTIVE : NAV_INACTIVE
                    }`}
                  >
                    {name}
                  </Link>
                </li>
              );
            })}

            {/* Dropdown de Acceso */}
            {authenticated && (
              <li className="relative">
                <button
                  onClick={() => setShowAccessMenu(!showAccessMenu)}
                  className={`${NAV_BASE} ${NAV_INACTIVE} flex items-center gap-1 cursor-pointer`}
                >
                  {t("access")}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      showAccessMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showAccessMenu && (
                  <div className="absolute left-0 mt-2 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                    <Link
                      href="/roles"
                      onClick={() => setShowAccessMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t("roles")}
                    </Link>
                    <Link
                      href="/groups"
                      onClick={() => setShowAccessMenu(false)}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {t("groups")}
                    </Link>
                  </div>
                )}
              </li>
            )}
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
                    userInfo?.preferred_username || userInfo?.name || "User"
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
            {NAV_ITEMS.map(({ name, path }) => {
              const active = pathname === path;
              return (
                <li key={path}>
                  <Link
                    href={path}
                    className={`block transition-colors duration-200 ${
                      active
                        ? "text-[#ffaf68] font-semibold"
                        : "text-[#fefae0]/80 hover:text-[#ffaf68]"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {name}
                  </Link>
                </li>
              );
            })}

            {/* Dropdown de Acceso - Móvil */}
            {authenticated && (
              <li>
                <button
                  onClick={() => setShowAccessMenu(!showAccessMenu)}
                  className="flex items-center gap-1 text-[#fefae0]/80 hover:text-[#ffaf68] transition-colors w-full"
                >
                  {t("access")}
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${
                      showAccessMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showAccessMenu && (
                  <ul className="pl-4 mt-2 space-y-2">
                    <li>
                      <Link
                        href="/roles"
                        onClick={() => {
                          setShowAccessMenu(false);
                          setIsOpen(false);
                        }}
                        className="block text-[#fefae0]/70 hover:text-[#ffaf68] transition-colors text-sm"
                      >
                        {t("roles")}
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/groups"
                        onClick={() => {
                          setShowAccessMenu(false);
                          setIsOpen(false);
                        }}
                        className="block text-[#fefae0]/70 hover:text-[#ffaf68] transition-colors text-sm"
                      >
                        {t("groups")}
                      </Link>
                    </li>
                  </ul>
                )}
              </li>
            )}
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
                <span className="text-[#fefae0]/80">Cargando...</span>
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
