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
    requiresAdmin?: boolean,
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
      name: t("partner"),
      path: "/partners",
    },
  ];

  return (
    <footer className="bg-[#283618] text-[#fefae0]/80 border-t border-[#283618]/80">
      <div className={`${container} py-8`}>
        <div className="flex items-center justify-between gap-6 overflow-x-auto whitespace-nowrap">
          <div>
            <div className={brand}>
              <Image
                src="/assets/img/bulletinLogo.png"
                alt="logo del bulletin builder"
                width={28}
                height={30}
              />
              <span className="text-base font-semibold text-[#fefae0] font-headers">
                {t("brand")}
              </span>
            </div>
            <p className={`${muted} text-sm mt-2`}>{t("copyright")}</p>
          </div>

          <ul className="flex flex-col gap-2 text-sm">
            {ALL_LINKS.map((link: (typeof ALL_LINKS)[0]) => (
              <li key={link.path}>
                <Link href={link.path} className={linkAccent}>
                  {link.name}
                </Link>
              </li>
            ))}
            <li key="data policy">
              <Link
                href="https://www.aclimate.org/data-policy"
                className={linkAccent}
                target="_blank"
              >
                {t("dataPolicy")}
              </Link>
            </li>
          </ul>

          <Image
            src="/assets/partners/guatemala/AllianceLogoWhite.png"
            alt="logo de la alianza"
            width={160}
            height={30}
          />
        </div>
      </div>
    </footer>
  );
}
