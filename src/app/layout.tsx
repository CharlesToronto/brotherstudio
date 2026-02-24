import type { Metadata } from "next";
import { cookies } from "next/headers";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/content/site";
import { DEFAULT_LOCALE, LOCALE_COOKIE_KEY, normalizeLocale } from "@/lib/i18n";
import { getSiteUrl } from "@/lib/siteUrl";

const siteUrl = getSiteUrl();
const defaultDescription =
  "BrotherStudio creates photorealistic 3D architectural renderings, interior visualizations, and landscape design images for residential projects, kitchens, and concept spaces in Canada.";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "BrotherStudio - 3D Rendering",
    template: `%s | ${site.name}`,
  },
  description: defaultDescription,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: site.name,
    title: "BrotherStudio - 3D Rendering",
    description: defaultDescription,
    url: "/",
    locale: "en_CA",
  },
  twitter: {
    card: "summary",
    title: "BrotherStudio - 3D Rendering",
    description: defaultDescription,
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const theme = cookieStore.get("theme")?.value === "dark" ? "dark" : "light";
  const locale =
    normalizeLocale(headerStore.get("x-site-locale")) ??
    normalizeLocale(cookieStore.get(LOCALE_COOKIE_KEY)?.value ?? null) ??
    DEFAULT_LOCALE;
  const shouldLoadAnalytics =
    process.env.NODE_ENV === "production" && process.env.VERCEL === "1";

  return (
    <html lang={locale} data-theme={theme}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: site.name,
              url: siteUrl.toString(),
              email: site.contact.email,
              telephone: site.contact.phone,
              sameAs: [site.instagramUrl],
            }),
          }}
        />
        <SiteHeader initialTheme={theme} />
        <AnalyticsTracker />
        {children}
        {shouldLoadAnalytics ? (
          <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
        ) : null}
      </body>
    </html>
  );
}
