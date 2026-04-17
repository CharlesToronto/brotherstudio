"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";

import type { BrochureProjectSummary } from "@/lib/brochureTypes";

type BrochureDirectoryProps = {
  projects: BrochureProjectSummary[];
};

export function BrochureDirectory({ projects }: BrochureDirectoryProps) {
  return (
    <section className="brochureDirectoryShell" aria-label="myBrochure projects">
      <header className="brochureDirectoryHeader">
        <div className="projectFeedbackIntro">
          <p className="projectFeedbackEyebrow">myBrochure</p>
          <h1 className="projectFeedbackTitle">Luxury brochure generator</h1>
          <p className="projectFeedbackVersionMeta">
            Approved myStudio visuals open a brochure builder automatically. Select
            the images, add a title, generate, then share the web page or export the
            PDF.
          </p>
        </div>
      </header>

      {projects.length > 0 ? (
        <div className="brochureDirectoryGrid">
          {projects.map((project) => (
            <article key={project.projectId} className="brochureDirectoryCard">
              <div className="brochureDirectoryMedia">
                {project.coverImageUrl ? (
                  <img
                    className="brochureDirectoryImage"
                    src={project.coverImageUrl}
                    alt={project.name}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className="brochureDirectoryPlaceholder">
                    <span>{project.name.slice(0, 1).toUpperCase()}</span>
                  </div>
                )}
              </div>

              <div className="brochureDirectoryBody">
                <div className="brochureDirectoryMeta">
                  <h2 className="projectFeedbackVersionTitle">{project.name}</h2>
                  <p className="projectFeedbackVersionMeta">
                    {project.approvedImageCount} approved image(s) • Variant V
                    {project.latestApprovedVersion}
                  </p>
                </div>

                <div className="projectFeedbackSummary">
                  <span>Web brochure</span>
                  <span>Print-ready PDF</span>
                  <span>2-minute workflow</span>
                </div>

                <Link
                  className="projectFeedbackAction projectFeedbackActionDark"
                  href={`/mybrochure/${project.brochureId ?? project.projectId}?edit=1`}
                >
                  Open builder
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="projectFeedbackEmpty">
          <h2 className="projectFeedbackVersionTitle">No approved images yet</h2>
          <p className="projectFeedbackVersionMeta">
            myBrochure becomes available automatically as soon as a myStudio project
            contains approved visuals.
          </p>
        </section>
      )}
    </section>
  );
}
