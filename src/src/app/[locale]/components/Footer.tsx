"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { container, brand, linkAccent, muted, sectionTitle } from "./ui";
import Image from "next/image";
import { useAuth } from "../../../hooks/useAuth";
import usePermissions from "../../../hooks/usePermissions";
import { MODULES } from "../../../types/core";

export function Footer() {
  const t = useTranslations("Footer");
  const tNavbar = useTranslations("Navbar");
  const { authenticated } = useAuth();
  const { can, isAdminAnywhere, isSuperadmin } = usePermissions();

  // Helper function para verificar permisos
  const hasPermission = (
    module?: string,
    requiresSuperadmin?: boolean,
    requiresAdmin?: boolean
  ) => {
    if (!authenticated) return false;
    if (requiresSuperadmin && !isSuperadmin) return false;
    if (requiresAdmin && !isAdminAnywhere) return false;
    if (module && !can("r", module)) return false;
    return true;
  };

  // Definir todos los links con sus permisos
  const ALL_LINKS = [
    {
      name: tNavbar("templates"),
      path: "/templates",
      module: MODULES.TEMPLATE_MANAGEMENT,
    },
    {
      name: tNavbar("cards"),
      path: "/cards",
      module: MODULES.CARD_MANAGEMENT,
    },
    {
      name: tNavbar("visualResources"),
      path: "/templates/visual-resources",
      module: MODULES.TEMPLATE_MANAGEMENT,
    },
    {
      name: tNavbar("bulletins"),
      path: "/bulletins",
      module: MODULES.BULLETINS_COMPOSER,
    },
    {
      name: tNavbar("roles"),
      path: "/roles",
      requiresSuperadmin: true,
    },
    {
      name: tNavbar("groups"),
      path: "/groups",
      requiresAdmin: true,
    },
  ];

  // Filtrar links según permisos
  const VISIBLE_LINKS = ALL_LINKS.filter((link) =>
    hasPermission(link.module, link.requiresSuperadmin, link.requiresAdmin)
  );

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
