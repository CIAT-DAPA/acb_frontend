"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { Cloud, Mail, Phone } from "lucide-react";
import {
  container,
  brand,
  brandIcon,
  linkAccent,
  muted,
  sectionTitle,
} from "./ui";
import Image from "next/image";
import { useAuth } from "../../../hooks/useAuth";
import usePermissions from "../../../hooks/usePermissions";
import { MODULES } from "../../../types/core";

export function Footer() {
  const t = useTranslations("Footer");
  const tNavbar = useTranslations("Navbar");
  const { authenticated } = useAuth();
  const { can, isAdminAnywhere, isSuperadmin } = usePermissions();

  // Definir todos los links con sus permisos
  const ALL_LINKS = [
    {
      name: tNavbar("templates"),
      path: "/templates",
      requiresAuth: true,
      module: MODULES.TEMPLATE_MANAGEMENT,
    },
    {
      name: tNavbar("cards"),
      path: "/cards",
      requiresAuth: true,
      module: MODULES.CARD_MANAGEMENT,
    },
    {
      name: tNavbar("bulletins"),
      path: "/bulletins",
      requiresAuth: true,
      module: MODULES.BULLETINS_COMPOSER,
    },
    {
      name: tNavbar("roles"),
      path: "/roles",
      requiresAuth: true,
      requiresSuperadmin: true,
    },
    {
      name: tNavbar("groups"),
      path: "/groups",
      requiresAuth: true,
      requiresAdmin: true,
    },
  ];

  // Filtrar links según permisos
  const VISIBLE_LINKS = ALL_LINKS.filter((link) => {
    // Si requiere auth y el usuario no está autenticado
    if (link.requiresAuth && !authenticated) return false;

    // Si requiere superadmin
    if (link.requiresSuperadmin && !isSuperadmin) return false;

    // Si requiere admin
    if (link.requiresAdmin && !isAdminAnywhere) return false;

    // Si tiene módulo, verificar permisos
    if (link.module && !can("r", link.module)) return false;

    return true;
  });

  return (
    <footer className="bg-[#283618] text-[#fefae0]/80 border-t border-[#283618]/80">
      <div className={`${container} py-12`}>
        <div className="grid gap-10 md:grid-cols-3">
          {/* Marca y descripción */}
          <div className="space-y-4">
            <div className={brand}>
              <Image
                src="/assets/img/bulletinLogo.png"
                alt="logo del bulletin builder"
                width={34}
                height={37}
              />
              <span className="text-xl font-semibold text-[#fefae0] font-headers">
                {t("brand")}
              </span>
            </div>
            <p className={`${muted} leading-relaxed`}>{t("description")}</p>
          </div>

          {/* Enlaces simples */}
          {VISIBLE_LINKS.length > 0 && (
            <div className="space-y-4">
              <h3 className={sectionTitle}>{t("links")}</h3>
              <ul className="space-y-2">
                {VISIBLE_LINKS.map((link) => (
                  <li key={link.path}>
                    <Link href={link.path} className={linkAccent}>
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Socios */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>{t("partner")}</h3>
            <div className="d-flex">
              <Image
                src="/assets/img/AllianceLogo.png"
                alt="logo del bulletin builder"
                width={200}
                height={37}
              />
            </div>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t border-[#283618]/60 mt-10 pt-6">
          <p className={`${muted} text-sm`}>{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
