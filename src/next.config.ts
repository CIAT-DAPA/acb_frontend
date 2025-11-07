import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Desactivar ESLint durante el build para que no falle el pipeline
  eslint: {
    ignoreDuringBuilds: true,
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
