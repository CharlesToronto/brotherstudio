import type { Metadata } from "next";
import { AdminLockOverlay } from "@/components/AdminLockOverlay";
import { Gallery } from "@/components/Gallery";
import { getAnalyticsSummary } from "@/lib/analyticsStore";
import { getGalleryItems } from "@/lib/galleryStore";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

function formatTimestamp(value: string | null) {
  if (!value) return "Aucune visite enregistrée";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date inconnue";

  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function AdminPage() {
  const [items, analytics] = await Promise.all([getGalleryItems(), getAnalyticsSummary()]);
  const dashboardUrl =
    process.env.VERCEL_ANALYTICS_DASHBOARD_URL?.trim() ||
    "https://vercel.com/dashboard";

  return (
    <main className="siteMain">
      <AdminLockOverlay />
      <section className="adminAnalyticsSection" aria-labelledby="adminAnalyticsTitle">
        <h1 id="adminAnalyticsTitle" className="adminAnalyticsTitle">
          Analytics
        </h1>
        <p className="adminAnalyticsText">
          Les stats ci-dessous sont mises à jour automatiquement à chaque visite du site.
        </p>
        <div className="adminAnalyticsTables">
          <table className="adminStatsTable" aria-label="Statistiques générales">
            <tbody>
              <tr>
                <th scope="row">Pages vues (total)</th>
                <td>{analytics.totalPageViews}</td>
              </tr>
              <tr>
                <th scope="row">Visiteurs uniques</th>
                <td>{analytics.uniqueVisitors}</td>
              </tr>
              <tr>
                <th scope="row">Pages vues (7 jours)</th>
                <td>{analytics.pageViewsLast7Days}</td>
              </tr>
              <tr>
                <th scope="row">Dernière visite</th>
                <td>{formatTimestamp(analytics.lastVisitAt)}</td>
              </tr>
            </tbody>
          </table>

          <table className="adminTopPagesTable" aria-label="Pages les plus visitées">
            <thead>
              <tr>
                <th scope="col">Page</th>
                <th scope="col">Vues</th>
                <th scope="col">Part</th>
              </tr>
            </thead>
            <tbody>
              {analytics.topPages.length === 0 ? (
                <tr>
                  <td colSpan={3} className="adminEmptyCell">
                    Pas encore de données.
                  </td>
                </tr>
              ) : (
                analytics.topPages.map((entry) => (
                  <tr key={entry.path}>
                    <th scope="row">{entry.path}</th>
                    <td>{entry.views}</td>
                    <td>{entry.sharePercent}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <a
          className="adminAnalyticsLink"
          href={dashboardUrl}
          target="_blank"
          rel="noreferrer"
        >
          Ouvrir le dashboard analytics
        </a>
      </section>
      <Gallery items={items} editable />
    </main>
  );
}
