import { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  // Configuración para Puppeteer
  experimental: {
    serverComponentsExternalPackages: ["puppeteer-core", "puppeteer"],
  },
  webpack: (config) => {
    // Excluir Puppeteer del bundle del cliente
    config.externals = [...(config.externals || []), "puppeteer"];
    return config;
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
