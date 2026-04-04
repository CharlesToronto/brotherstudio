import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminLockOverlay } from "@/components/AdminLockOverlay";
import { ProjectFeedbackWorkspace } from "@/components/ProjectFeedbackWorkspace";
import {
  getProjectFeedbackProject,
  isProjectFeedbackConfigured,
} from "@/lib/projectFeedbackStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AdminClientProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({
  params,
}: AdminClientProjectDetailPageProps): Promise<Metadata> {
  const { projectId } = await params;

  return {
    title: `Admin | Project ${projectId.slice(0, 8)}`,
    robots: {
      index: false,
      follow: false,
      nocache: true,
    },
  };
}

export default async function AdminClientProjectDetailPage({
  params,
}: AdminClientProjectDetailPageProps) {
  const { projectId } = await params;

  if (!isProjectFeedbackConfigured()) {
    return (
      <main className="siteMain">
        <AdminLockOverlay />
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

  const project = await getProjectFeedbackProject(projectId);
  if (!project) {
    notFound();
  }

  return (
    <main className="siteMain">
      <AdminLockOverlay />
      <ProjectFeedbackWorkspace
        initialProject={project}
        allowImageManagement
        adminAccent
      />
    </main>
  );
}
