import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BrochureCinematicViewer } from "@/components/BrochureCinematicViewer";
import { getBrochureProject, isBrochureConfigured } from "@/lib/brochureStore";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Props = {
  params: Promise<{ projectId: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { projectId } = await params;

  try {
    const project = await getBrochureProject(projectId);
    return {
      title: project ? `${project.title} — Présentation` : "Présentation",
      robots: { index: false, follow: false, nocache: true },
    };
  } catch {
    return {
      title: "Présentation",
      robots: { index: false, follow: false, nocache: true },
    };
  }
}

export default async function BrochureCinematicPage({ params }: Props) {
  const { projectId } = await params;

  if (!isBrochureConfigured()) notFound();

  let project = null;
  try {
    project = await getBrochureProject(projectId);
  } catch {
    notFound();
  }

  if (!project) notFound();

  return <BrochureCinematicViewer project={project} />;
}
