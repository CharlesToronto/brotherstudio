import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/errorMessage";
import type {
  BrochureImmersiveBuilder,
  BrochureExperienceMode,
  BrochureImmersiveSettings,
  BrochureSection,
} from "@/lib/brochureTypes";
import { getBrochureProject, saveBrochureSettings } from "@/lib/brochureStore";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const project = await getBrochureProject(projectId);
    if (!project) {
      return NextResponse.json({ error: "Project not found." }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Failed to load brochure settings."),
      },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const payload = (await request.json()) as {
      template?: "minimal" | "modern" | "luxury";
      title?: string;
      subtitle?: string;
      body?: string;
      experienceMode?: BrochureExperienceMode;
      immersiveSettings?: Partial<BrochureImmersiveSettings>;
      accentColor?: string;
      backgroundColor?: string;
      fontFamily?: "helvetica" | "garamond" | "georgia" | "times";
      orientation?: "portrait" | "landscape";
      imageOrder?: string[];
      selectedImageIds?: string[];
      sections?: BrochureSection[];
      immersiveBuilder?: BrochureImmersiveBuilder;
    };

    const project = await saveBrochureSettings(projectId, payload);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Failed to save brochure settings."),
      },
      { status: 400 },
    );
  }
}
