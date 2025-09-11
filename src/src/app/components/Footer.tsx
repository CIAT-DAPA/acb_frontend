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
  return (
    <footer className="bg-gray-900 text-gray-300 border-t border-gray-800">
      <div className={`${container} py-12`}>
        <div className="grid gap-10 md:grid-cols-3">
          {/* Marca y descripción */}
          <div className="space-y-4">
            <div className={brand}>
              <Cloud className={brandIcon} />
              <span className="text-xl font-semibold text-white font-headers">
                Bulletin builder
              </span>
            </div>
            <p className={`${muted} leading-relaxed`}>
              Herramienta gratuita para crear boletines agroclimáticos de forma
              colaborativa.
            </p>
          </div>

          {/* Enlaces simples */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Enlaces</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/templates" className={linkAccent}>
                  Plantillas
                </Link>
              </li>
            </ul>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className={sectionTitle}>Contacto</h3>
            <ul className={`space-y-3 ${muted}`}>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-400" />
                <span>test@example.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-400" />
                <span>+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Barra inferior */}
        <div className="border-t border-gray-800 mt-10 pt-6">
          <p className={`${muted} text-sm`}>© 2025 Bulletin Builder.</p>
        </div>
      </div>
    </footer>
  );
}
