import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LegacyMyProjectFeedbackPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ viewer?: string | string[] }>;
};

export default async function LegacyMyProjectFeedbackPage({
  params,
  searchParams,
}: LegacyMyProjectFeedbackPageProps) {
  const { projectId } = await params;
  const resolvedSearchParams = await searchParams;
  const viewerParam = Array.isArray(resolvedSearchParams.viewer)
    ? resolvedSearchParams.viewer[0]
    : resolvedSearchParams.viewer;
  const query = viewerParam ? `?viewer=${encodeURIComponent(viewerParam)}` : "";
  redirect(`/mystudio/${projectId}${query}`);
}
