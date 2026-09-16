import {
  commitProjectReferenceUploads,
  createProjectReferenceLink,
  createProjectReferenceFolder,
  deleteProjectReferenceFile,
  deleteProjectReferenceFolder,
  listProjectReferences,
  prepareProjectReferenceUploads,
  renameProjectReferenceFolder,
  updateProjectReferenceFile,
} from "@/lib/projectReferenceStore";

function stringValue(value: unknown) {
  return typeof value === "string" ? value : "";
}

export async function handleProjectReferenceGet(projectId: string) {
  return listProjectReferences(projectId);
}

export async function handleProjectReferenceMutation(
  request: Request,
  projectId: string,
) {
  const body = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const action = stringValue(body?.action);

  if (action === "prepare-upload") {
    const files = Array.isArray(body?.files)
      ? body.files
          .map((file) => {
            if (!file || typeof file !== "object") return null;
            const value = file as Record<string, unknown>;
            return { name: stringValue(value.name), type: stringValue(value.type) };
          })
          .filter((file): file is { name: string; type: string } => Boolean(file))
      : [];
    return prepareProjectReferenceUploads(projectId, stringValue(body?.folderId), files);
  }

  if (action === "commit-upload") {
    const uploads = Array.isArray(body?.uploads)
      ? body.uploads
          .map((upload) => {
            if (!upload || typeof upload !== "object") return null;
            const value = upload as Record<string, unknown>;
            return {
              publicUrl: stringValue(value.publicUrl),
              filename: stringValue(value.filename),
              mimeType: stringValue(value.mimeType),
              sizeBytes: typeof value.sizeBytes === "number" ? value.sizeBytes : 0,
              title: stringValue(value.title),
              description: stringValue(value.description),
            };
          })
          .filter(
            (
              upload,
            ): upload is {
              publicUrl: string;
              filename: string;
              mimeType: string;
              sizeBytes: number;
              title: string;
              description: string;
            } => Boolean(upload),
          )
      : [];
    return commitProjectReferenceUploads(projectId, {
      folderId: stringValue(body?.folderId),
      uploads,
    });
  }

  if (action === "create-link") {
    return createProjectReferenceLink(projectId, {
      folderId: stringValue(body?.folderId),
      url: stringValue(body?.url),
      title: typeof body?.title === "string" ? body.title : undefined,
      description: typeof body?.description === "string" ? body.description : undefined,
    });
  }

  if (action === "create-folder") {
    return createProjectReferenceFolder(projectId, stringValue(body?.name));
  }

  if (action === "rename-folder") {
    return renameProjectReferenceFolder(
      projectId,
      stringValue(body?.folderId),
      stringValue(body?.name),
    );
  }

  if (action === "delete-folder") {
    await deleteProjectReferenceFolder(projectId, stringValue(body?.folderId));
    return listProjectReferences(projectId);
  }

  if (action === "update-file") {
    return updateProjectReferenceFile(projectId, stringValue(body?.fileId), {
      title: typeof body?.title === "string" ? body.title : undefined,
      description: typeof body?.description === "string" ? body.description : undefined,
      folderId: typeof body?.folderId === "string" ? body.folderId : undefined,
    });
  }

  if (action === "delete-file") {
    return deleteProjectReferenceFile(projectId, stringValue(body?.fileId));
  }

  throw new Error("Invalid reference action.");
}
