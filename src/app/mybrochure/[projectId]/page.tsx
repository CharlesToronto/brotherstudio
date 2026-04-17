import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrochurePreview } from "@/components/BrochurePreview";
import { BrochureStudio } from "@/components/BrochureStudio";
import { getBrochureProject, isBrochureConfigured } from "@/lib/brochureStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type MyBrochureProjectPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ edit?: string }>;
};

export async function generateMetadata({
  params,
}: MyBrochureProjectPageProps): Promise<Metadata> {
  const { projectId } = await params;

  if (!isBrochureConfigured()) {
    return {
      title: `myBrochure ${projectId.slice(0, 8)}`,
      robots: {
        index: false,
        follow: false,
        nocache: true,
      },
    };
  }

  try {
    const project = await getBrochureProject(projectId);

    return {
      title: project ? `${project.title} | myBrochure` : `myBrochure ${projectId.slice(0, 8)}`,
      robots: {
        index: false,
        follow: false,
        nocache: true,
      },
    };
  } catch {
    return {
      title: `myBrochure ${projectId.slice(0, 8)}`,
      robots: {
        index: false,
        follow: false,
        nocache: true,
      },
    };
  }
}

export default async function MyBrochureProjectPage({
  params,
  searchParams,
}: MyBrochureProjectPageProps) {
  const [{ projectId }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const editMode = resolvedSearchParams.edit === "1";

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

  let project = null;

  try {
    project = await getBrochureProject(projectId);
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

  if (!project) {
    notFound();
  }

  const allImages = [...project.approvedImages, ...project.extraAssets];

  return (
    <main className="siteMain">
      {editMode ? (
        <BrochureStudio initialProject={project} />
      ) : (
        <section className="brochurePublicShell">
          <div className="brochurePublicCanvas">
            <BrochurePreview
              projectName={project.name}
              template={project.template}
              styleSettings={project.styleSettings}
              sections={project.content.sections}
              images={allImages}
            />
          </div>
        </section>
      )}
    </main>
  );
}
