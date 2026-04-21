import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/errorMessage";
import {
  deleteBrochureAsset,
  uploadBrochureAssets,
} from "@/lib/brochureStore";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (files.length === 0) {
      throw new Error("Select at least one image.");
    }

    const project = await uploadBrochureAssets(projectId, files);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Failed to upload assets."),
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { projectId } = await context.params;
    const payload = (await request.json()) as {
      assetId?: string;
    };

    if (!payload.assetId?.trim()) {
      throw new Error("Select an image to delete.");
    }

    const project = await deleteBrochureAsset(projectId, payload.assetId);
    return NextResponse.json({ project });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Failed to delete image."),
      },
      { status: 400 },
    );
  }
}
