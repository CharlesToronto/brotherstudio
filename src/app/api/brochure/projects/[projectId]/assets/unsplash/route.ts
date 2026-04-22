import { NextResponse } from "next/server";

import { getErrorMessage } from "@/lib/errorMessage";
import { getBrochureProject, uploadBrochureAssets } from "@/lib/brochureStore";
import { getUnsplashAccessKey, isUnsplashConfigured } from "@/lib/unsplash";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ projectId: string }>;
};

function extensionFromContentType(contentType: string) {
  const normalized = contentType.toLowerCase();
  if (normalized.includes("png")) return ".png";
  if (normalized.includes("webp")) return ".webp";
  if (normalized.includes("gif")) return ".gif";
  if (normalized.includes("svg")) return ".svg";
  return ".jpg";
}

function assertAllowedHost(value: string, expectedHost: string) {
  const url = new URL(value);
  if (url.hostname !== expectedHost) {
    throw new Error("Invalid Unsplash URL.");
  }
  return url;
}

export async function POST(request: Request, context: RouteContext) {
  try {
    if (!isUnsplashConfigured()) {
      throw new Error("Unsplash is not configured on the server.");
    }

    const { projectId } = await context.params;
    const payload = (await request.json()) as {
      photo?: {
        id?: string;
        regularUrl?: string;
        downloadLocation?: string;
        description?: string;
        alt?: string;
      };
    };

    const photoId = payload.photo?.id?.trim() ?? "";
    const regularUrl = payload.photo?.regularUrl?.trim() ?? "";
    const downloadLocation = payload.photo?.downloadLocation?.trim() ?? "";
    if (!photoId || !regularUrl || !downloadLocation) {
      throw new Error("Missing Unsplash image information.");
    }

    assertAllowedHost(regularUrl, "images.unsplash.com");
    assertAllowedHost(downloadLocation, "api.unsplash.com");

    const accessKey = getUnsplashAccessKey();

    const trackingResponse = await fetch(downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        "Accept-Version": "v1",
      },
      cache: "no-store",
    });

    if (!trackingResponse.ok) {
      throw new Error("Failed to register Unsplash download.");
    }

    const imageResponse = await fetch(regularUrl, { cache: "no-store" });
    if (!imageResponse.ok) {
      throw new Error("Failed to download Unsplash image.");
    }

    const contentType = imageResponse.headers.get("content-type")?.trim() || "image/jpeg";
    const extension = extensionFromContentType(contentType);
    const fileName = `unsplash-${photoId}${extension}`;
    const arrayBuffer = await imageResponse.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const file = new File([buffer], fileName, { type: contentType });

    const previousProject = await getBrochureProject(projectId);
    if (!previousProject) {
      throw new Error("Project not found.");
    }

    const previousExtraAssetIds = new Set(previousProject.extraAssets.map((asset) => asset.id));
    const project = await uploadBrochureAssets(projectId, [file]);
    const importedAsset =
      project.extraAssets.find((asset) => !previousExtraAssetIds.has(asset.id)) ??
      project.extraAssets.at(-1);

    return NextResponse.json({
      project,
      assetId: importedAsset?.id ?? "",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: getErrorMessage(error, "Failed to import Unsplash image."),
      },
      { status: 400 },
    );
  }
}
