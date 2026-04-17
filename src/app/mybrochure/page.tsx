import type { Metadata } from "next";

import { BrochureDirectory } from "@/components/BrochureDirectory";
import {
  isBrochureConfigured,
  listBrochureProjectSummaries,
} from "@/lib/brochureStore";
import type { BrochureProjectSummary } from "@/lib/brochureTypes";

export const metadata: Metadata = {
  title: "myBrochure",
  robots: {
    index: false,
    follow: false,
  },
};

export const dynamic = "force-dynamic";

export default async function MyBrochurePage() {
  if (!isBrochureConfigured()) {
    return (
      <main className="siteMain">
        <section className="projectConfigNotice">
          <h1 className="projectFeedbackTitle">myBrochure Not Configured</h1>
          <p className="projectFeedbackVersionMeta">
            Add <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
            <code>SUPABASE_SERVICE_ROLE_KEY</code> to enable the brochure builder.
          </p>
        </section>
      </main>
    );
  }

  let projects: BrochureProjectSummary[] = [];

  try {
    projects = await listBrochureProjectSummaries();
  } catch (error) {
    return (
      <main className="siteMain">
        <section className="projectConfigNotice">
          <h1 className="projectFeedbackTitle">myBrochure Setup Is Incomplete</h1>
          <p className="projectFeedbackVersionMeta">
            {error instanceof Error
              ? error.message
              : "The brochure builder could not be loaded."}
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="siteMain">
      <BrochureDirectory projects={projects} />
    </main>
  );
}
