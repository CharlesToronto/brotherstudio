"use client";

/* eslint-disable @next/next/no-img-element */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  Eye,
  ExternalLink,
  File as FileIcon,
  FileText,
  Folder,
  FolderPlus,
  Grid2X2,
  Link2,
  List,
  MoveRight,
  Pencil,
  Search,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import type {
  ProjectReferenceFile,
  ProjectReferenceFolder,
  ProjectReferences,
} from "@/lib/projectFeedbackTypes";

type ProjectClientReferencesProps = {
  projectId: string;
  adminMode?: boolean;
  onCountChange?: (count: number) => void;
};

type UploadDraft = {
  file: File;
  title: string;
  description: string;
};

type ReferenceSort = "updated" | "name" | "type";

type UploadProgress = {
  current: number;
  total: number;
  filename: string;
  percent: number;
};

const REFERENCE_LINK_MIME_TYPE = "application/x-reference-link";
const ALL_DOCUMENTS_FOLDER_ID = "__all_documents__";

function getApiBase(projectId: string, adminMode: boolean) {
  return `${adminMode ? "/api/projects" : "/api/project"}/${projectId}/references`;
}

function baseFilename(filename: string) {
  return filename.replace(/\.[^.]+$/, "") || filename;
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

async function compressReferenceImage(file: File) {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/svg+xml" ||
    file.type === "image/gif" ||
    typeof createImageBitmap !== "function"
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);
    const maxDimension = 2400;
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.82),
    );
    if (!blob || blob.size >= file.size) return file;

    return new File([blob], `${baseFilename(file.name)}.webp`, {
      type: "image/webp",
      lastModified: file.lastModified,
    });
  } catch {
    return file;
  }
}

async function uploadReferenceFile(
  signedUrl: string,
  file: File,
  onProgress: (fraction: number) => void,
) {
  await new Promise<void>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", signedUrl);
    request.setRequestHeader("content-type", file.type || "application/octet-stream");
    request.setRequestHeader("x-upsert", "false");
    request.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    };
    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        onProgress(1);
        resolve();
      } else {
        reject(new Error(`Unable to upload ${file.name}.`));
      }
    };
    request.onerror = () => reject(new Error(`Unable to upload ${file.name}.`));
    request.send(file);
  });
}

function isReferenceLink(file: ProjectReferenceFile) {
  return file.mimeType === REFERENCE_LINK_MIME_TYPE;
}

function getDocumentPreviewUrl(file: ProjectReferenceFile) {
  const officeMimeTypes = [
    "application/msword",
    "application/vnd.ms-excel",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ];

  return officeMimeTypes.includes(file.mimeType)
    ? `https://docs.google.com/gview?embedded=1&url=${encodeURIComponent(file.url)}`
    : file.url;
}

function ReferenceFileIcon({ mimeType }: { mimeType: string }) {
  return mimeType === "application/pdf" ? <FileText aria-hidden="true" /> : <FileIcon aria-hidden="true" />;
}

export function ProjectClientReferences({
  projectId,
  adminMode = false,
  onCountChange,
}: ProjectClientReferencesProps) {
  const isFrench =
    typeof document !== "undefined" && document.documentElement.lang.startsWith("fr");
  const copy = isFrench
    ? {
        title: "Références client",
        intro: "Un espace partagé pour les inspirations, documents et références du projet.",
        upload: "Ajouter des fichiers",
        addLink: "Ajouter un lien",
        folder: "Nouveau dossier",
        allDocuments: "Tous les documents",
        folderLabel: "Dossier",
        createFolder: "Créer le dossier",
        search: "Rechercher dans les références",
        all: "Toutes les références",
        empty: "Aucune référence dans ce dossier.",
        emptyHint: "Ajoutez une image, un document ou créez un dossier pour commencer.",
        grid: "Affichage en grille",
        list: "Affichage en liste",
        sort: "Trier par",
        recent: "Plus récents",
        name: "Nom",
        type: "Type",
        rename: "Renommer",
        delete: "Supprimer",
        move: "Déplacer vers",
        save: "Enregistrer",
        cancel: "Annuler",
        publish: "Ajouter les fichiers",
        uploading: "Téléversement...",
        preparing: "Préparation des fichiers...",
        preview: "Aperçu",
        openLink: "Ouvrir le lien",
        openNewTab: "Ouvrir dans un nouvel onglet",
        closePreview: "Fermer l’aperçu",
        url: "URL",
        urlPlaceholder: "https://exemple.com/inspiration",
        linkTitle: "Ajouter une référence web",
        linkDescription: "Ajoutez un lien vers une inspiration ou une ressource externe.",
        linkSaved: "Référence web",
        dropFolder: "Déposer dans ce dossier",
        uploadProgress: "Progression du téléversement",
        titleLabel: "Titre",
        description: "Description courte",
        file: "Fichier",
        noDescription: "Aucune description",
        defaultFolder: "Dossier prédéfini",
        cannotDelete: "Les dossiers prédéfinis ne peuvent pas être supprimés.",
        confirmDeleteFile: "Supprimer cette référence ?",
        confirmDeleteFolder: "Supprimer ce dossier et son contenu ?",
        folderName: "Nom du dossier",
        fileCount: "fichier(s)",
        noReferences: "Aucune référence",
        selectFolder: "Sélectionnez un dossier pour ajouter une référence.",
      }
    : {
        title: "Client References",
        intro: "A shared space for project inspiration, documents and references.",
        upload: "Add files",
        addLink: "Add a link",
        folder: "New folder",
        allDocuments: "All documents",
        folderLabel: "Folder",
        createFolder: "Create folder",
        search: "Search references",
        all: "All references",
        empty: "No references in this folder.",
        emptyHint: "Add an image, document or create a folder to get started.",
        grid: "Grid view",
        list: "List view",
        sort: "Sort by",
        recent: "Most recent",
        name: "Name",
        type: "Type",
        rename: "Rename",
        delete: "Delete",
        move: "Move to",
        save: "Save",
        cancel: "Cancel",
        publish: "Add files",
        uploading: "Uploading...",
        preparing: "Preparing files...",
        preview: "Preview",
        openLink: "Open link",
        openNewTab: "Open in new tab",
        closePreview: "Close preview",
        url: "URL",
        urlPlaceholder: "https://example.com/inspiration",
        linkTitle: "Add a web reference",
        linkDescription: "Add a link to an inspiration or an external resource.",
        linkSaved: "Web reference",
        dropFolder: "Drop into this folder",
        uploadProgress: "Upload progress",
        titleLabel: "Title",
        description: "Short description",
        file: "File",
        noDescription: "No description",
        defaultFolder: "Default folder",
        cannotDelete: "Default folders cannot be deleted.",
        confirmDeleteFile: "Delete this reference?",
        confirmDeleteFolder: "Delete this folder and its contents?",
        folderName: "Folder name",
        fileCount: "file(s)",
        noReferences: "No references",
        selectFolder: "Select a folder before adding a reference.",
      };

  const inputRef = useRef<HTMLInputElement>(null);
  const apiBase = getApiBase(projectId, adminMode);
  const [references, setReferences] = useState<ProjectReferences>({ folders: [], files: [] });
  const [activeFolderId, setActiveFolderId] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sort, setSort] = useState<ReferenceSort>("updated");
  const [query, setQuery] = useState("");
  const [uploadDrafts, setUploadDrafts] = useState<UploadDraft[]>([]);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [linkDescription, setLinkDescription] = useState("");
  const [previewingFile, setPreviewingFile] = useState<ProjectReferenceFile | null>(null);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null);
  const [draggedFileId, setDraggedFileId] = useState("");
  const [dragOverFolderId, setDragOverFolderId] = useState("");
  const [isPreparingUpload, setIsPreparingUpload] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [editingFile, setEditingFile] = useState<ProjectReferenceFile | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyAction, setBusyAction] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const refreshReferences = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(apiBase, { cache: "no-store" });
      const payload = (await response.json().catch(() => null)) as ProjectReferences & {
        error?: string;
      };
      if (!response.ok) throw new Error(payload?.error ?? "Unable to load references.");
      setReferences(payload);
      setActiveFolderId((current) =>
        current === ALL_DOCUMENTS_FOLDER_ID || payload.folders.some((folder) => folder.id === current)
          ? current
          : ALL_DOCUMENTS_FOLDER_ID,
      );
      onCountChange?.(payload.files.length);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load references.");
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, onCountChange]);

  useEffect(() => {
    void refreshReferences();
  }, [refreshReferences]);

  const activeFolder = references.folders.find((folder) => folder.id === activeFolderId) ?? null;
  const activeFolderName =
    activeFolderId === ALL_DOCUMENTS_FOLDER_ID
      ? copy.allDocuments
      : activeFolder?.name ?? copy.noReferences;
  const visibleFiles = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return references.files
      .filter((file) =>
        activeFolderId === ALL_DOCUMENTS_FOLDER_ID
          ? true
          : file.folderId === activeFolderId,
      )
      .filter((file) =>
        normalizedQuery
          ? `${file.title} ${file.description} ${file.filename}`.toLowerCase().includes(normalizedQuery)
          : true,
      )
      .sort((first, second) => {
        if (sort === "name") return first.title.localeCompare(second.title);
        if (sort === "type") return first.mimeType.localeCompare(second.mimeType);
        return second.updatedAt.localeCompare(first.updatedAt);
      });
  }, [activeFolderId, query, references.files, sort]);

  const runAction = async (action: string, payload: Record<string, unknown>) => {
    setBusyAction(action);
    setErrorMessage("");
    try {
      const response = await fetch(apiBase, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const result = (await response.json().catch(() => null)) as
        | ProjectReferences
        | ProjectReferenceFolder
        | { error?: string }
        | null;
      if (!response.ok) {
        throw new Error(result && "error" in result ? result.error : "Reference action failed.");
      }
      if (result && "folders" in result && "files" in result) {
        setReferences(result);
        onCountChange?.(result.files.length);
      }
      return result;
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Reference action failed.");
      return null;
    } finally {
      setBusyAction("");
    }
  };

  const handleSelectFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files ?? []);
    event.currentTarget.value = "";
    if (selectedFiles.length === 0) return;
    if (!activeFolderId || activeFolderId === ALL_DOCUMENTS_FOLDER_ID) {
      setErrorMessage(copy.selectFolder);
      return;
    }

    setIsPreparingUpload(true);
    setErrorMessage("");
    try {
      const drafts = await Promise.all(
        selectedFiles.map(async (originalFile) => {
          const file = await compressReferenceImage(originalFile);
          return {
            file,
            title: baseFilename(originalFile.name),
            description: "",
          } satisfies UploadDraft;
        }),
      );
      setUploadDrafts(drafts);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to prepare files.");
    } finally {
      setIsPreparingUpload(false);
    }
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (uploadDrafts.length === 0 || !activeFolderId) return;
    setIsUploading(true);
    setBusyAction("upload");
    setErrorMessage("");
    const totalBytes = uploadDrafts.reduce((total, draft) => total + draft.file.size, 0);
    let uploadedBytes = 0;
    setUploadProgress({
      current: 0,
      total: uploadDrafts.length,
      filename: uploadDrafts[0]?.file.name ?? "",
      percent: 0,
    });

    try {
      const prepareResponse = await fetch(apiBase, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "prepare-upload",
          folderId: activeFolderId,
          files: uploadDrafts.map(({ file }) => ({ name: file.name, type: file.type })),
        }),
      });
      const preparePayload = (await prepareResponse.json().catch(() => null)) as
        | { uploads?: Array<{ signedUrl: string; publicUrl: string; filename: string; mimeType: string }> ; error?: string }
        | null;
      if (!prepareResponse.ok || !preparePayload?.uploads) {
        throw new Error(preparePayload?.error ?? "Unable to prepare uploads.");
      }

      for (const [index, upload] of preparePayload.uploads.entries()) {
        const draft = uploadDrafts[index];
        if (!draft) throw new Error("Unable to match the selected reference files.");
        setUploadProgress({
          current: index + 1,
          total: uploadDrafts.length,
          filename: draft.file.name,
          percent: totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0,
        });
        await uploadReferenceFile(upload.signedUrl, draft.file, (fraction) => {
          const percent = totalBytes > 0
            ? Math.min(100, Math.round(((uploadedBytes + draft.file.size * fraction) / totalBytes) * 100))
            : Math.round(((index + fraction) / uploadDrafts.length) * 100);
          setUploadProgress({
            current: index + 1,
            total: uploadDrafts.length,
            filename: draft.file.name,
            percent,
          });
        });
        uploadedBytes += draft.file.size;
      }

      const commitResponse = await fetch(apiBase, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action: "commit-upload",
          folderId: activeFolderId,
          uploads: preparePayload.uploads.map((upload, index) => ({
            publicUrl: upload.publicUrl,
            filename: upload.filename,
            mimeType: upload.mimeType,
            sizeBytes: uploadDrafts[index].file.size,
            title: uploadDrafts[index].title,
            description: uploadDrafts[index].description,
          })),
        }),
      });
      const commitPayload = (await commitResponse.json().catch(() => null)) as
        | ProjectReferences
        | { error?: string }
        | null;
      if (!commitResponse.ok || !commitPayload || !("folders" in commitPayload)) {
        throw new Error(commitPayload && "error" in commitPayload ? commitPayload.error : "Unable to save references.");
      }

      setReferences(commitPayload);
      onCountChange?.(commitPayload.files.length);
      setUploadDrafts([]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to upload references.");
    } finally {
      setIsUploading(false);
      setBusyAction("");
      setUploadProgress(null);
    }
  };

  const handleCreateLink = () => {
    if (!activeFolderId || activeFolderId === ALL_DOCUMENTS_FOLDER_ID) {
      setErrorMessage(copy.selectFolder);
      return;
    }
    setLinkUrl("");
    setLinkTitle("");
    setLinkDescription("");
    setIsLinkModalOpen(true);
  };

  const handleSubmitLink = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!activeFolderId || activeFolderId === ALL_DOCUMENTS_FOLDER_ID || !linkUrl.trim()) return;

    const result = await runAction("create-link", {
      folderId: activeFolderId,
      url: linkUrl,
      title: linkTitle,
      description: linkDescription,
    });
    if (result && "folders" in result) {
      setLinkUrl("");
      setLinkTitle("");
      setLinkDescription("");
      setIsLinkModalOpen(false);
    }
  };

  const handleCreateFolder = async () => {
    setNewFolderName("");
    setIsCreateFolderOpen(true);
  };

  const handleSubmitCreateFolder = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newFolderName.trim()) return;

    const result = await runAction("create-folder", { name: newFolderName });
    if (result && "id" in result) {
      await refreshReferences();
      setActiveFolderId(result.id);
      setIsCreateFolderOpen(false);
    }
  };

  const handleRenameFolder = async (folder: ProjectReferenceFolder) => {
    const name = window.prompt(copy.folderName, folder.name);
    if (!name?.trim() || name.trim() === folder.name) return;
    await runAction("rename-folder", { folderId: folder.id, name });
  };

  const handleDeleteFolder = async (folder: ProjectReferenceFolder) => {
    if (folder.isDefault) {
      setErrorMessage(copy.cannotDelete);
      return;
    }
    if (!window.confirm(copy.confirmDeleteFolder)) return;
    const result = await runAction("delete-folder", { folderId: folder.id });
    if (result && "folders" in result) {
      setActiveFolderId(ALL_DOCUMENTS_FOLDER_ID);
    }
  };

  const handleEditFile = (file: ProjectReferenceFile) => {
    setEditingFile(file);
    setEditingTitle(file.title);
    setEditingDescription(file.description);
  };

  const handleSaveFile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingFile) return;
    const result = await runAction("update-file", {
      fileId: editingFile.id,
      title: editingTitle,
      description: editingDescription,
    });
    if (result && "folders" in result) setEditingFile(null);
  };

  const handleMoveFile = async (fileId: string, folderId: string) => {
    if (!fileId || !folderId) return;
    await runAction("update-file", { fileId, folderId });
  };

  const handleDropFile = (event: React.DragEvent<HTMLDivElement>, folderId: string) => {
    event.preventDefault();
    const fileId = event.dataTransfer.getData("text/reference-file") || draggedFileId;
    setDragOverFolderId("");
    setDraggedFileId("");
    if (!fileId) return;
    const file = references.files.find((reference) => reference.id === fileId);
    if (!file || file.folderId === folderId) return;
    void handleMoveFile(fileId, folderId);
  };

  const handleDeleteFile = async (file: ProjectReferenceFile) => {
    if (!window.confirm(copy.confirmDeleteFile)) return;
    await runAction("delete-file", { fileId: file.id });
  };

  const renderPreview = (file: ProjectReferenceFile) =>
    isReferenceLink(file) ? (
      <span className="projectReferenceFileTypeIcon">
        <Link2 aria-hidden="true" />
        <small>URL</small>
      </span>
    ) : file.mimeType.startsWith("image/") ? (
      <img src={file.url} alt="" loading="lazy" />
    ) : (
      <span className="projectReferenceFileTypeIcon">
        <ReferenceFileIcon mimeType={file.mimeType} />
      </span>
    );

  const renderPreviewContent = (file: ProjectReferenceFile) => {
    if (isReferenceLink(file)) {
      return (
        <div className="projectClientReferencesLinkPreview">
          <Link2 aria-hidden="true" size={34} />
          <p>{file.url}</p>
        </div>
      );
    }
    if (file.mimeType.startsWith("image/")) {
      return <img src={file.url} alt={file.title} />;
    }
    if (file.mimeType.startsWith("video/")) {
      return <video src={file.url} controls playsInline />;
    }
    if (file.mimeType.startsWith("audio/")) {
      return <audio src={file.url} controls />;
    }
    return <iframe src={getDocumentPreviewUrl(file)} title={file.title} />;
  };

  return (
    <section className="projectClientReferences" aria-labelledby="project-client-references-title">
      <div className="projectClientReferencesHeader">
        <div>
          <p className="projectFeedbackEyebrow">MyReview™</p>
          <h2 id="project-client-references-title" className="projectFeedbackVersionTitle">
            {copy.title}
          </h2>
          <p className="projectFeedbackVersionMeta">{copy.intro}</p>
        </div>
        <div className="projectClientReferencesActions">
          <button className="projectFeedbackAction projectClientReferencesButton" type="button" onClick={handleCreateFolder}>
            <FolderPlus aria-hidden="true" size={15} />
            {copy.folder}
          </button>
          <button className="projectFeedbackAction projectClientReferencesButton" type="button" onClick={handleCreateLink}>
            <Link2 aria-hidden="true" size={15} />
            {copy.addLink}
          </button>
          <button className="projectFeedbackAction projectClientReferencesButton projectClientReferencesUploadButton" type="button" onClick={() => inputRef.current?.click()} disabled={isPreparingUpload || isUploading}>
            <Upload aria-hidden="true" size={15} />
            {isPreparingUpload ? copy.preparing : copy.upload}
          </button>
          <input ref={inputRef} className="projectClientReferencesHiddenInput" type="file" multiple onChange={handleSelectFiles} />
        </div>
      </div>

      {errorMessage ? <p className="projectFeedbackMessage projectFeedbackMessageError">{errorMessage}</p> : null}

      <div className="projectClientReferencesLayout">
        <aside className="projectClientReferencesFolders">
          <div className="projectClientReferencesFoldersHeader">
            <span>{copy.folderLabel}</span>
            <span>{references.files.length}</span>
          </div>
          <div
            className="projectClientReferencesFolderRow"
            data-all-documents="true"
            data-has-files={references.files.length > 0 ? "true" : "false"}
          >
            <button
              className="projectClientReferencesFolderButton"
              type="button"
              data-active={activeFolderId === ALL_DOCUMENTS_FOLDER_ID ? "true" : "false"}
              onClick={() => setActiveFolderId(ALL_DOCUMENTS_FOLDER_ID)}
            >
              <Folder aria-hidden="true" size={17} />
              <span>{copy.allDocuments}</span>
              <small>{references.files.length}</small>
            </button>
          </div>
          {references.folders.map((folder) => {
            const folderCount = references.files.filter((file) => file.folderId === folder.id).length;
            return (
              <div
                key={folder.id}
                className="projectClientReferencesFolderRow"
                data-has-files={folderCount > 0 ? "true" : "false"}
                data-drag-over={dragOverFolderId === folder.id ? "true" : "false"}
                onDragOver={(event) => {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "move";
                  setDragOverFolderId(folder.id);
                }}
                onDragLeave={() => setDragOverFolderId((current) => current === folder.id ? "" : current)}
                onDrop={(event) => handleDropFile(event, folder.id)}
              >
                <button className="projectClientReferencesFolderButton" type="button" data-active={folder.id === activeFolderId ? "true" : "false"} onClick={() => setActiveFolderId(folder.id)}>
                  <Folder aria-hidden="true" size={17} />
                  <span>{folder.name}</span>
                  <small>{folderCount}</small>
                </button>
                <div className="projectClientReferencesFolderActions">
                  <button type="button" aria-label={`${copy.rename} ${folder.name}`} title={copy.rename} onClick={() => void handleRenameFolder(folder)}><Pencil aria-hidden="true" size={13} /></button>
                  {!folder.isDefault ? <button type="button" aria-label={`${copy.delete} ${folder.name}`} title={copy.delete} onClick={() => void handleDeleteFolder(folder)}><Trash2 aria-hidden="true" size={13} /></button> : null}
                </div>
              </div>
            );
          })}
        </aside>

        <div className="projectClientReferencesContent">
          <div className="projectClientReferencesToolbar">
            <div className="projectClientReferencesCurrentFolder">
              <Folder aria-hidden="true" size={18} />
              <strong>{activeFolderName}</strong>
            </div>
            <label className="projectClientReferencesSearch">
              <Search aria-hidden="true" size={15} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} />
            </label>
            <div className="projectClientReferencesToolbarControls">
              <label className="projectClientReferencesSort">
                <span>{copy.sort}</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as ReferenceSort)}>
                  <option value="updated">{copy.recent}</option>
                  <option value="name">{copy.name}</option>
                  <option value="type">{copy.type}</option>
                </select>
              </label>
              <div className="projectClientReferencesViewToggle" role="group" aria-label="Reference view">
                <button type="button" data-active={viewMode === "grid" ? "true" : "false"} aria-label={copy.grid} title={copy.grid} onClick={() => setViewMode("grid")}><Grid2X2 aria-hidden="true" size={16} /></button>
                <button type="button" data-active={viewMode === "list" ? "true" : "false"} aria-label={copy.list} title={copy.list} onClick={() => setViewMode("list")}><List aria-hidden="true" size={17} /></button>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="projectClientReferencesEmpty"><span className="projectFeedbackSpinner" aria-hidden="true" /><p>{copy.preparing}</p></div>
          ) : visibleFiles.length === 0 ? (
            <div className="projectClientReferencesEmpty">
              <Folder aria-hidden="true" size={30} />
              <h3>{query ? copy.noReferences : copy.empty}</h3>
              <p>{copy.emptyHint}</p>
            </div>
          ) : (
            <div className={`projectClientReferencesFiles projectClientReferencesFiles--${viewMode}`}>
              {visibleFiles.map((file) => (
                <article
                  key={file.id}
                  className="projectClientReferenceCard"
                  draggable={!isUploading}
                  data-dragging={draggedFileId === file.id ? "true" : "false"}
                  onDragStart={(event) => {
                    setDraggedFileId(file.id);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/reference-file", file.id);
                  }}
                  onDragEnd={() => setDraggedFileId("")}
                >
                  <button className="projectClientReferencePreview" type="button" onClick={() => setPreviewingFile(file)} aria-label={`${copy.preview}: ${file.title}`}>
                    {renderPreview(file)}
                    <span className="projectClientReferencePreviewBadge"><Eye aria-hidden="true" size={14} /></span>
                  </button>
                  <div className="projectClientReferenceCardBody">
                    <div className="projectClientReferenceCardHeading">
                      <div>
                        <h3>{file.title}</h3>
                        <p>{file.description || copy.noDescription}</p>
                      </div>
                      <span className="projectClientReferenceMenu" title={file.mimeType}>{isReferenceLink(file) ? "URL" : file.mimeType.split("/").pop()}</span>
                    </div>
                    <div className="projectClientReferenceMeta"><span>{file.filename}</span><span>{formatBytes(file.sizeBytes)}</span></div>
                    <div className="projectClientReferenceCardActions">
                      <label className="projectClientReferenceMove">
                        <MoveRight aria-hidden="true" size={13} />
                        <span className="srOnly">{copy.move}</span>
                        <select value={file.folderId} onChange={(event) => void handleMoveFile(file.id, event.target.value)} aria-label={`${copy.move} ${file.title}`}>
                          {references.folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}
                        </select>
                      </label>
                      <button type="button" title={copy.rename} aria-label={`${copy.rename} ${file.title}`} onClick={() => handleEditFile(file)}><Pencil aria-hidden="true" size={14} /></button>
                      {isReferenceLink(file) ? (
                        <a href={file.url} target="_blank" rel="noreferrer" title={copy.openLink} aria-label={`${copy.openLink}: ${file.title}`}><ExternalLink aria-hidden="true" size={14} /></a>
                      ) : (
                        <a href={`${apiBase}/${file.id}/download`} title={copy.file} aria-label={`${copy.file} ${file.title}`}><Download aria-hidden="true" size={14} /></a>
                      )}
                      <button type="button" title={copy.delete} aria-label={`${copy.delete} ${file.title}`} onClick={() => void handleDeleteFile(file)}><Trash2 aria-hidden="true" size={14} /></button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>

      {uploadDrafts.length > 0 ? (
        <div className="projectClientReferencesModalBackdrop">
          <form className="projectClientReferencesModal" onSubmit={handleUpload}>
            <div className="projectClientReferencesModalHeader">
              <div><p className="projectFeedbackEyebrow">{copy.title}</p><h3>{copy.publish}</h3></div>
              <button type="button" aria-label={copy.cancel} onClick={() => setUploadDrafts([])}>×</button>
            </div>
            <div className="projectClientReferencesUploadDrafts">
              {uploadDrafts.map((draft, index) => (
                <div key={`${draft.file.name}-${index}`} className="projectClientReferencesUploadDraft">
                  <div className="projectClientReferencesUploadFilename"><ReferenceFileIcon mimeType={draft.file.type} /><span>{draft.file.name}</span><small>{formatBytes(draft.file.size)}</small></div>
                  <label className="projectFeedbackField"><span>{copy.titleLabel}</span><input className="projectFeedbackInput" value={draft.title} onChange={(event) => setUploadDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item))} required /></label>
                  <label className="projectFeedbackField"><span>{copy.description}</span><textarea className="projectFeedbackTextarea" value={draft.description} onChange={(event) => setUploadDrafts((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item))} rows={2} /></label>
                </div>
              ))}
            </div>
            {isUploading && uploadProgress ? (
              <div className="projectClientReferencesUploadProgress" aria-live="polite">
                <div className="projectClientReferencesUploadProgressHeader">
                  <span>{copy.uploadProgress}</span>
                  <strong>{uploadProgress.percent}%</strong>
                </div>
                <div className="projectClientReferencesProgressTrack" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={uploadProgress.percent}>
                  <span style={{ width: `${uploadProgress.percent}%` }} />
                </div>
                <small>{uploadProgress.current}/{uploadProgress.total} · {uploadProgress.filename}</small>
              </div>
            ) : null}
            <div className="projectFeedbackDraftActions"><button className="projectFeedbackAction" type="submit" disabled={isUploading}>{isUploading ? copy.uploading : copy.publish}</button><button className="projectFeedbackAction projectFeedbackActionGhost" type="button" onClick={() => setUploadDrafts([])}>{copy.cancel}</button></div>
          </form>
        </div>
      ) : null}

      {isLinkModalOpen ? (
        <div className="projectClientReferencesModalBackdrop">
          <form className="projectClientReferencesModal projectClientReferencesLinkModal" onSubmit={handleSubmitLink}>
            <div className="projectClientReferencesModalHeader">
              <div>
                <p className="projectFeedbackEyebrow">{copy.title}</p>
                <h3>{copy.linkTitle}</h3>
                <p className="projectClientReferencesModalHint">{copy.linkDescription}</p>
              </div>
              <button type="button" aria-label={copy.cancel} onClick={() => setIsLinkModalOpen(false)}><X aria-hidden="true" size={17} /></button>
            </div>
            <label className="projectFeedbackField">
              <span>{copy.url}</span>
              <input className="projectFeedbackInput" type="url" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} placeholder={copy.urlPlaceholder} autoFocus required />
            </label>
            <label className="projectFeedbackField">
              <span>{copy.titleLabel}</span>
              <input className="projectFeedbackInput" value={linkTitle} onChange={(event) => setLinkTitle(event.target.value)} placeholder="Inspiration" />
            </label>
            <label className="projectFeedbackField">
              <span>{copy.description}</span>
              <textarea className="projectFeedbackTextarea" value={linkDescription} onChange={(event) => setLinkDescription(event.target.value)} rows={3} />
            </label>
            <div className="projectFeedbackDraftActions">
              <button className="projectFeedbackAction" type="submit" disabled={busyAction === "create-link"}><Link2 aria-hidden="true" size={15} />{copy.addLink}</button>
              <button className="projectFeedbackAction projectFeedbackActionGhost" type="button" onClick={() => setIsLinkModalOpen(false)}>{copy.cancel}</button>
            </div>
          </form>
        </div>
      ) : null}

      {isCreateFolderOpen ? (
        <div className="projectClientReferencesModalBackdrop">
          <form className="projectClientReferencesModal projectClientReferencesFolderModal" onSubmit={handleSubmitCreateFolder}>
            <div className="projectClientReferencesModalHeader">
              <div>
                <p className="projectFeedbackEyebrow">{copy.title}</p>
                <h3>{copy.folder}</h3>
              </div>
              <button type="button" aria-label={copy.cancel} onClick={() => setIsCreateFolderOpen(false)}>×</button>
            </div>
            <label className="projectFeedbackField">
              <span>{copy.folderName}</span>
              <input className="projectFeedbackInput" value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} autoFocus required />
            </label>
            <div className="projectFeedbackDraftActions">
              <button className="projectFeedbackAction" type="submit" disabled={busyAction === "create-folder"}>{copy.createFolder}</button>
              <button className="projectFeedbackAction projectFeedbackActionGhost" type="button" onClick={() => setIsCreateFolderOpen(false)}>{copy.cancel}</button>
            </div>
          </form>
        </div>
      ) : null}

      {editingFile ? (
        <div className="projectClientReferencesModalBackdrop">
          <form className="projectClientReferencesModal projectClientReferencesEditModal" onSubmit={handleSaveFile}>
            <div className="projectClientReferencesModalHeader"><div><p className="projectFeedbackEyebrow">{copy.file}</p><h3>{editingFile.filename}</h3></div><button type="button" aria-label={copy.cancel} onClick={() => setEditingFile(null)}>×</button></div>
            <label className="projectFeedbackField"><span>{copy.titleLabel}</span><input className="projectFeedbackInput" value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} required /></label>
            <label className="projectFeedbackField"><span>{copy.description}</span><textarea className="projectFeedbackTextarea" value={editingDescription} onChange={(event) => setEditingDescription(event.target.value)} rows={3} /></label>
            <div className="projectFeedbackDraftActions"><button className="projectFeedbackAction" type="submit" disabled={busyAction === "update-file"}>{copy.save}</button><button className="projectFeedbackAction projectFeedbackActionGhost" type="button" onClick={() => setEditingFile(null)}>{copy.cancel}</button></div>
          </form>
        </div>
      ) : null}

      {previewingFile ? (
        <div className="projectClientReferencesModalBackdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setPreviewingFile(null);
        }}>
          <div className="projectClientReferencesModal projectClientReferencesPreviewModal" role="dialog" aria-modal="true" aria-labelledby="project-reference-preview-title">
            <div className="projectClientReferencesModalHeader">
              <div>
                <p className="projectFeedbackEyebrow">{copy.preview}</p>
                <h3 id="project-reference-preview-title">{previewingFile.title}</h3>
              </div>
              <button type="button" aria-label={copy.closePreview} onClick={() => setPreviewingFile(null)}><X aria-hidden="true" size={17} /></button>
            </div>
            <div className="projectClientReferencesPreviewStage">
              {renderPreviewContent(previewingFile)}
            </div>
            <div className="projectFeedbackDraftActions">
              <a className="projectFeedbackAction" href={previewingFile.url} target="_blank" rel="noreferrer">
                <ExternalLink aria-hidden="true" size={15} />
                {isReferenceLink(previewingFile) ? copy.openLink : copy.openNewTab}
              </a>
              <button className="projectFeedbackAction projectFeedbackActionGhost" type="button" onClick={() => setPreviewingFile(null)}>{copy.cancel}</button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
