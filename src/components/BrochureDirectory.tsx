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
          <h1 className="projectFeedbackTitle">Marketing brochure builder</h1>
          <p className="projectFeedbackVersionMeta">
            Approved myStudio images open a ready-to-style brochure workspace. Add
            branding, text, extra visuals, then export a web preview or PDF.
          </p>
        </div>
      </header>

      {projects.length > 0 ? (
        <div className="brochureDirectoryGrid">
          {projects.map((project) => (
            <article key={project.id} className="brochureDirectoryCard">
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
                    Variant V{project.latestApprovedVersion}
                  </p>
                </div>

                <div className="projectFeedbackSummary">
                  <span>{project.approvedImageCount} approved image(s)</span>
                  <span>Dynamic web preview</span>
                  <span>PDF-ready export</span>
                </div>

                <Link className="projectFeedbackAction" href={`/mybrochure/${project.id}`}>
                  Open brochure
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className="projectFeedbackEmpty">
          <h2 className="projectFeedbackVersionTitle">No approved images yet</h2>
          <p className="projectFeedbackVersionMeta">
            myBrochure folders appear automatically when a project has at least one
            approved image in myStudio.
          </p>
        </section>
      )}
    </section>
  );
}
