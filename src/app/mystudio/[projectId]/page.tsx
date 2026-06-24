import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LegacyMyStudioFeedbackPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ viewer?: string | string[] }>;
};

export default async function LegacyMyStudioFeedbackPage({
  params,
  searchParams,
}: LegacyMyStudioFeedbackPageProps) {
  const { projectId } = await params;
  const resolvedSearchParams = await searchParams;
  const viewerParam = Array.isArray(resolvedSearchParams.viewer)
    ? resolvedSearchParams.viewer[0]
    : resolvedSearchParams.viewer;
  const forceVisitorEntry = viewerParam === "visitor";
  const query = forceVisitorEntry ? "?viewer=visitor" : "";
  redirect(`/myreview/${projectId}${query}`);
}
