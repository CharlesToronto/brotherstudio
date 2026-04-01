import type { Metadata } from "next";
import { cookies } from "next/headers";

import { ProjectFeedbackAccess } from "@/components/ProjectFeedbackAccess";
import {
  getProjectAccessCookieName,
  getProjectViewerRoleCookieName,
  isProjectAccessAuthorized,
  isProjectFeedbackConfigured,
} from "@/lib/projectFeedbackStore";
import { normalizeProjectViewerRole } from "@/lib/projectViewerIdentity";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MyProjectFeedbackPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ viewer?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: MyProjectFeedbackPageProps): Promise<Metadata> {
  const { projectId } = await params;

  return {
    title: `Project ${projectId.slice(0, 8)}`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function MyProjectFeedbackPage({
  params,
  searchParams,
}: MyProjectFeedbackPageProps) {
  const { projectId } = await params;
  const resolvedSearchParams = await searchParams;
  const viewerParam = Array.isArray(resolvedSearchParams.viewer)
    ? resolvedSearchParams.viewer[0]
    : resolvedSearchParams.viewer;
  const forceVisitorEntry = viewerParam === "visitor";

  if (!isProjectFeedbackConfigured()) {
    return (
      <main className="siteMain">
        <section className="projectConfigNotice">
          <h1 className="projectFeedbackTitle">Project Feedback Not Configured</h1>
          <p className="projectFeedbackVersionMeta">
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> to enable the review space.
          </p>
        </section>
      </main>
    );
  }

  const cookieStore = await cookies();
  const initialUnlocked = await isProjectAccessAuthorized(
    projectId,
    cookieStore.get(getProjectAccessCookieName(projectId))?.value,
  ).catch(() => false);
  const initialRole = normalizeProjectViewerRole(
    cookieStore.get(getProjectViewerRoleCookieName(projectId))?.value ?? null,
  );

  return (
    <main className="siteMain">
      <ProjectFeedbackAccess
        projectId={projectId}
        initialUnlocked={initialUnlocked}
        initialRole={initialRole}
        forceVisitorEntry={forceVisitorEntry}
      />
    </main>
  );
}
