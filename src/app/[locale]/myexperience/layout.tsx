import { MyExperienceChromeHider } from "@/components/MyExperienceChromeHider";

export default function MyExperienceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <MyExperienceChromeHider />
      <style>{`
        .siteHeader,
        .siteFooter {
          display: none !important;
        }
      `}</style>
      {children}
    </>
  );
}
