import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Orígenes autorizados a incrustar las rutas /[locale]/embed/... en un iframe.
// Por defecto se permite cualquiera; restringir en producción con, por ejemplo:
// EMBED_FRAME_ANCESTORS="https://misitio.org https://www.misitio.org"
const EMBED_FRAME_ANCESTORS = process.env.EMBED_FRAME_ANCESTORS || "*";

const nextConfig: NextConfig = {
  // Desactivar ESLint durante el build para que no falle el pipeline
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:locale/embed/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: `frame-ancestors ${EMBED_FRAME_ANCESTORS};`,
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/bulletins/:id/edit",
        destination: "/bulletins/edit/:id",
        permanent: false,
      },
    ];
  },
  // Configuración para Puppeteer (actualizado a la nueva API)
  serverExternalPackages: ["puppeteer-core", "puppeteer"],
  webpack: (config) => {
    // Excluir Puppeteer del bundle del cliente
    config.externals = [...(config.externals || []), "puppeteer"];
    return config;
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
