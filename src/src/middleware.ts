import createMiddleware from "next-intl/middleware";

export default createMiddleware({
  locales: ["es", "en", "vi"],
  defaultLocale: "es",
  localeDetection: true,
});

export const config = {
  matcher: [
    "/",
    "/((?!api|_next|_vercel|favicon.ico|.*\\..*).*)",
    "/(es|en|vi)/:path*",
  ],
};
