import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/errorMessage";
import { saveBrochureSettings } from "@/lib/brochureStore";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const payload = (await request.json()) as {
      template?: "minimal" | "modern" | "luxury";
      title?: string;
      subtitle?: string;
      body?: string;
      headingColor?: string;
      bodyColor?: string;
      accentColor?: string;
      fontFamily?: "helvetica" | "garamond" | "georgia" | "times";
      selectedImageIds?: string[];
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
