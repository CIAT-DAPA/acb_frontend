import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BulletinAPIService from "@/services/bulletinService";
import BulletinPublicClient from "../../../[templateSlug]/[bulletinSlug]/BulletinPublicClient";
import { bulletinToTemplateData, safeDecode } from "@/utils/publicBulletin";
import { filterTemplateDataForOutput } from "@/utils/sectionVisibility";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://bulletin.aclimate.org";

type PageProps = {
  params: Promise<{
    locale: string;
    templateSlug: string;
    bulletinSlug: string;
  }>;
};

async function getPublishedBulletin(bulletinSlug: string) {
  const response = await BulletinAPIService.getBulletinBySlug(bulletinSlug);

  if (!response.success || !response.data) {
    return null;
  }

  if (response.data.master.status !== "published") {
    return null;
  }

  if (!response.data.current_version?.data?.sections?.length) {
    return null;
  }

  return response.data;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, templateSlug, bulletinSlug } = await params;

  const bulletin = await getPublishedBulletin(bulletinSlug);

  const title = bulletin
    ? safeDecode(bulletin.master.bulletin_name) || "Agroclimatic Bulletin"
    : "Bulletin not found";

  return {
    title,
    // La vista embebible duplica el contenido de la página pública:
    // no debe indexarse y su canónica apunta a la versión pública.
    robots: {
      index: false,
      follow: false,
    },
    alternates: {
      canonical: `${SITE_URL}/${locale}/${templateSlug}/${bulletinSlug}`,
    },
  };
}

/**
 * Vista embebible del boletín: solo previsualización + botón de exportar.
 *
 * Ruta: /[locale]/embed/[templateSlug]/[bulletinSlug]
 * Uso:  <iframe src="https://.../es/embed/mi-plantilla/mi-boletin" />
 *
 * El layout omite Navbar, Footer y banner de cookies para estas rutas
 * (ver `ChromeGate`), y no se inicializa Keycloak (ver `useAuth`).
 */
export default async function EmbedBulletinPage({ params }: PageProps) {
  const { locale, templateSlug, bulletinSlug } = await params;

  const bulletin = await getPublishedBulletin(bulletinSlug);

  if (!bulletin) {
    notFound();
  }

  const templateData = filterTemplateDataForOutput(
    bulletinToTemplateData(bulletin, bulletinSlug),
  );

  return (
    <BulletinPublicClient
      initialTemplateData={templateData}
      initialCardsMetadata={bulletin.cards_metadata || {}}
      locale={locale}
      templateSlug={templateSlug}
      bulletinSlug={bulletinSlug}
      embed
    />
  );
}
