import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/errorMessage";
import { uploadBrochureLogo } from "@/lib/brochureStore";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const formData = await request.formData();
    const logo = formData.get("logo");

    if (!(logo instanceof File)) {
      throw new Error("Select a logo to upload.");
    }

    const project = await uploadBrochureLogo(projectId, logo);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Failed to upload logo."),
      },
      { status: 400 },
    );
  }
}
