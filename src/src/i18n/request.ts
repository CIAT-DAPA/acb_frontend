import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async ({ locale }) => {
  if (!locale || !["es", "en", "vi"].includes(locale)) {
    locale = "es";
  }

  return {
    messages: (await import(`../messages/${locale}.json`)).default,
    locale: locale as string,
  };
});
