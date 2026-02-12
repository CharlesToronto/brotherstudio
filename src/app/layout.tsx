import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
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

  return (
    <html lang="en" data-theme={theme}>
      <body>
        <SiteHeader initialTheme={theme} />
        {children}
      </body>
    </html>
  );
}
