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

export function Footer() {
  const t = useTranslations("Footer");
  const tNavbar = useTranslations("Navbar");
  return (
    <footer className="bg-[#283618] text-[#fefae0]/80 border-t border-[#283618]/80">
      <div className={`${container} py-12`}>
        <div className="grid gap-10 md:grid-cols-3">
          {/* Marca y descripción */}
          <div className="space-y-4">
            <div className={brand}>
              <Cloud className={brandIcon} />
              <span className="text-xl font-semibold text-[#fefae0] font-headers">
                {t("brand")}
              </span>
            </div>
            <p className={`${muted} leading-relaxed`}>{t("description")}</p>
          </div>

          {/* Enlaces simples */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>{t("links")}</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/templates" className={linkAccent}>
                  {tNavbar("templates")}
                </Link>
              </li>
              <li>
                <Link href="/cards" className={linkAccent}>
                  {tNavbar("cards")}
                </Link>
              </li>
              <li>
                <Link href="/bulletins" className={linkAccent}>
                  {tNavbar("bulletins")}
                </Link>
              </li>
              <li>
                <Link href="/roles" className={linkAccent}>
                  {tNavbar("roles")}
                </Link>
              </li>
              <li>
                <Link href="/groups" className={linkAccent}>
                  {tNavbar("groups")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>{t("contact")}</h3>
            <ul className={`space-y-3 ${muted}`}>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#fefae0]" />
                <span>{t("email")}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#fefae0]" />
                <span>{t("phone")}</span>
              </li>
            </ul>
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
