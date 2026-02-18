import type { Metadata } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import "./globals.css";
import { AnalyticsTracker } from "@/components/AnalyticsTracker";
import { SiteHeader } from "@/components/SiteHeader";
import { site } from "@/content/site";

export const metadata: Metadata = {
  title: site.name,
  description: "Architectural visualization portfolio.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value === "dark" ? "dark" : "light";
  const shouldLoadAnalytics =
    process.env.NODE_ENV === "production" && process.env.VERCEL === "1";

  return (
    <html lang="en" data-theme={theme}>
      <body>
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
