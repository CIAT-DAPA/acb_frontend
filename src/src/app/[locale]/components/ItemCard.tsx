import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { cardBase, btnDark, btnOutlineSecondary } from "./ui";

export interface ItemCardProps {
  id: number | string; // Permitir tanto number como string para compatibilidad
  name: string;
  author: string;
  lastModified: string;
  type: "template" | "bulletin"; // Para determinar las rutas y traducciones
  image?: string; // Imagen opcional
}

interface ActionButton {
  label: string;
  href: string;
  variant: "secondary" | "dark";
}

export default function ItemCard({
  id,
  name,
  author,
  lastModified,
  type,
  image,
}: ItemCardProps) {
  const t = useTranslations(type === "template" ? "Templates" : "Bulletins");

  // Configurar las acciones basadas en el tipo
  const actions: ActionButton[] =
    type === "template"
      ? [
          {
            label: t("view"),
            href: `/templates/${id}`,
            variant: "secondary",
          },
          {
            label: t("edit"),
            href: `/templates/${id}/edit`,
            variant: "dark",
          },
        ]
      : [
          {
            label: t("view"),
            href: `/bulletins/${id}`,
            variant: "secondary",
          },
          {
            label: t("download"),
            href: `/bulletins/${id}/download`,
            variant: "dark",
          },
        ];

  // Imagen a mostrar (usar imagen por defecto si no se proporciona)
  const displayImage = image || "/assets/img/imageNotFound.png";

  return (
    <div className={cardBase}>
      {/* Imagen */}
      <div className="relative h-48 w-full mb-4 rounded-lg overflow-hidden bg-gray-100">
        <Image
          src={displayImage}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>

      {/* Contenido */}
      <h3 className="text-lg font-semibold text-[#283618] mb-2">{name}</h3>
      <p className="text-[#283618]/60 text-sm mb-4">
        {t("by")} {author}
      </p>
      <p className="text-[#283618]/50 text-xs mb-4">
        {t("lastModified")}: {lastModified}
      </p>

      <div className="flex space-x-2">
        {actions.map((action, index) => (
          <Link
            key={index}
            href={action.href}
            className={action.variant === "secondary" ? btnOutlineSecondary : btnDark}
          >
            {action.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
