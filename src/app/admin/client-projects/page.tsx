import type { Metadata } from "next";
import Link from "next/link";

import { AdminLockOverlay } from "@/components/AdminLockOverlay";
import { ClientProjectsAdmin } from "@/components/ClientProjectsAdmin";
import type { ProjectSummary } from "@/lib/projectFeedbackTypes";
import {
  isProjectFeedbackConfigured,
  listProjectSummaries,
} from "@/lib/projectFeedbackStore";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin | Client Projects",
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

function formatSetupError(error: unknown) {
  if (error instanceof Error) return error.message;

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const message =
      typeof candidate.message === "string" ? candidate.message.trim() : "";
    const details =
      typeof candidate.details === "string" ? candidate.details.trim() : "";
    const hint =
      typeof candidate.hint === "string" ? candidate.hint.trim() : "";
    const code =
      typeof candidate.code === "string" ? candidate.code.trim() : "";

    const combined = [message, details, hint, code].filter(Boolean).join(" ");
    if (
      combined.includes("UNABLE_TO_GET_ISSUER_CERT_LOCALLY") ||
      combined.includes("unable to get local issuer certificate")
    ) {
      return "Local Node cannot verify the Supabase TLS certificate (UNABLE_TO_GET_ISSUER_CERT_LOCALLY).";
    }

    if (message) return message;
  }

  return "myStudio setup is incomplete.";
}

export default async function AdminClientProjectsPage() {
  const isConfigured = isProjectFeedbackConfigured();
  let projects: ProjectSummary[] = [];
  let setupError: string | null = null;

  if (isConfigured) {
    try {
      projects = await listProjectSummaries({ includeAccessPassword: true });
    } catch (error) {
      setupError = formatSetupError(error);
    }
  }

  return (
    <main className="siteMain">
      <AdminLockOverlay />
      <p className="pageCta">
        <Link className="pageCtaInlineLink" href="/admin">
          Return to gallery admin
        </Link>
      </p>
      <ClientProjectsAdmin
        initialProjects={projects}
        isConfigured={isConfigured}
        setupError={setupError}
      />
    </main>
  );
}
