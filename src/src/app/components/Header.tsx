"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Cloud } from "lucide-react";
import { container, brand, brandIcon, btnOutlinePrimary } from "./ui";

// Navegación simple
const NAV_ITEMS = [{ name: "Plantillas", path: "/templates" }];

// Clases simples
const NAV_BASE = "py-2 px-3 transition-colors duration-200 relative";
const NAV_ACTIVE =
  "text-[#bc6c25] font-semibold after:content-[''] after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:bg-[#bc6c25]";
const NAV_INACTIVE =
  "text-[#fefae0]/80 hover:text-[#bc6c25] hover:after:content-[''] hover:after:absolute hover:after:bottom-0 hover:after:left-3 hover:after:right-3 hover:after:h-0.5 hover:after:bg-[#bc6c25]";

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Mock login function - replace with actual auth implementation
  const login = () => {
    // Implement actual login logic
    console.log("Login clicked");
  };

  // Handlers mínimos
  const toggleMenu = () => setIsOpen((v) => !v);

  return (
    <nav className="bg-[#283618] border-b border-[#283618]/80 sticky top-0 z-50">
      <div
        className={`${container} w-full flex items-center justify-between py-4`}
      >
        {/* Logo */}
        <Link
          href="/"
          className={`${brand} text-2xl font-bold py-2 hover:text-[#bc6c25] transition-colors`}
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
        <div className="hidden lg:flex items-center space-x-2">
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
          </ul>

          {/* Botón de login */}
          <div className="flex items-center">
            <button onClick={login} className={btnOutlinePrimary}>
              Iniciar sesión
            </button>
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
                        ? "text-[#bc6c25] font-semibold"
                        : "text-[#fefae0]/80 hover:text-[#bc6c25]"
                    }`}
                    onClick={() => setIsOpen(false)}
                  >
                    {name}
                  </Link>
                </li>
              );
            })}
          </ul>

          {/* Botón de login móvil */}
          <div className="pt-3 border-t border-[#283618]/60">
            <button
              onClick={() => {
                login();
                setIsOpen(false);
              }}
              className="flex items-center space-x-3"
            >
              <div className={btnOutlinePrimary}>Iniciar sesión</div>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
