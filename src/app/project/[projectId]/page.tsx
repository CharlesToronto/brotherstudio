import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type LegacyProjectFeedbackPageProps = {
  params: Promise<{ projectId: string }>;
};

export default async function LegacyProjectFeedbackPage({
  params,
}: LegacyProjectFeedbackPageProps) {
  const { projectId } = await params;
  redirect(`/myproject/${projectId}`);
}
