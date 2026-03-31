import type { Metadata } from "next";

import { MyProjectDirectory } from "@/components/MyProjectDirectory";
import {
  isProjectFeedbackConfigured,
  listProjectSummaries,
} from "@/lib/projectFeedbackStore";

export const metadata: Metadata = {
  title: "myStudio",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function MyProjectAccessPage() {
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

  const projects = await listProjectSummaries({ status: "in_review" });

  return (
    <main className="siteMain">
      <MyProjectDirectory projects={projects} />
    </main>
  );
}
