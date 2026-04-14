"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent, CSSProperties } from "react";

import type {
  BrochureAsset,
  BrochureFontFamily,
  BrochureProject,
  BrochureSettings,
  BrochureTemplate,
} from "@/lib/brochureTypes";
import { getResponseErrorMessage } from "@/lib/errorMessage";

type BrochureStudioProps = {
  initialProject: BrochureProject;
};

type FeedbackTone = "neutral" | "error" | "success";

const fontFamilyMap: Record<BrochureFontFamily, string> = {
  helvetica: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  garamond: 'Garamond, "Times New Roman", serif',
  georgia: 'Georgia, "Times New Roman", serif',
  times: '"Times New Roman", Times, serif',
};

const templateDescriptions: Record<BrochureTemplate, string> = {
  minimal: "Quiet layouts with restrained spacing and a clean editorial rhythm.",
  modern: "Balanced marketing layout with clear blocks and a sharper accent.",
  luxury: "Warmer presentation with more contrast and a premium editorial tone.",
};

const MAX_UPLOAD_SIZE_BYTES = 8 * 1024 * 1024;

function formatBytesToMb(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getUploadError(files: File[]) {
  const oversizedFile = files.find((file) => file.size > MAX_UPLOAD_SIZE_BYTES);
  if (!oversizedFile) return "";

  return `${oversizedFile.name} exceeds the ${formatBytesToMb(
    MAX_UPLOAD_SIZE_BYTES,
  )} upload limit. Export a lighter image before uploading.`;
}

function getEffectiveSelectedImageIds(
  project: BrochureProject,
  settings: BrochureSettings,
) {
  return settings.selectedImageIds.length > 0
    ? settings.selectedImageIds
    : project.approvedImages.map((image) => image.id);
}

function buildPreviewAssets(
  project: BrochureProject,
  selectedImageIds: string[],
) {
  const selectedSet = new Set(selectedImageIds);
  const approvedImages = project.approvedImages.filter((image) =>
    selectedSet.has(image.id),
  );

  return [
    ...approvedImages.map((image, index) => ({
      id: image.id,
      url: image.url,
      label: `Approved image ${index + 1}`,
      meta: `3D render • V${image.version}`,
    })),
    ...project.assets.map((asset, index) => ({
      id: asset.id,
      url: asset.url,
      label: asset.fileName || `Extra asset ${index + 1}`,
      meta: "Client upload",
    })),
  ];
}

export function BrochureStudio({ initialProject }: BrochureStudioProps) {
  const [project, setProject] = useState(initialProject);
  const [settings, setSettings] = useState(initialProject.settings);
  const [shareUrl, setShareUrl] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackTone, setFeedbackTone] = useState<FeedbackTone>("neutral");
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingAssets, setIsUploadingAssets] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    setProject(initialProject);
    setSettings(initialProject.settings);
  }, [initialProject]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  const effectiveSelectedImageIds = useMemo(
    () => getEffectiveSelectedImageIds(project, settings),
    [project, settings],
  );
  const previewAssets = useMemo(
    () => buildPreviewAssets(project, effectiveSelectedImageIds),
    [project, effectiveSelectedImageIds],
  );

  const previewStyle = useMemo(
    () =>
      ({
        "--brochure-heading-color": settings.headingColor,
        "--brochure-body-color": settings.bodyColor,
        "--brochure-accent-color": settings.accentColor,
        "--brochure-font-family": fontFamilyMap[settings.fontFamily],
      }) as CSSProperties,
    [settings],
  );

  const updateField = <Key extends keyof BrochureSettings>(
    key: Key,
    value: BrochureSettings[Key],
  ) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setFeedbackMessage("");

    try {
      const response = await fetch(`/api/brochure/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          template: settings.template,
          title: settings.title,
          subtitle: settings.subtitle,
          body: settings.body,
          headingColor: settings.headingColor,
          bodyColor: settings.bodyColor,
          accentColor: settings.accentColor,
          fontFamily: settings.fontFamily,
          selectedImageIds: effectiveSelectedImageIds,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(
            response,
            "Failed to save brochure settings.",
          ),
        );
      }

      const payload = (await response.json()) as { project?: BrochureProject };
      if (!payload.project) {
        throw new Error("Failed to save brochure settings.");
      }

      setProject(payload.project);
      setSettings(payload.project.settings);
      setFeedbackTone("success");
      setFeedbackMessage("Brochure settings saved.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to save brochure settings.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const uploadError = getUploadError(files);
    if (uploadError) {
      setFeedbackTone("error");
      setFeedbackMessage(uploadError);
      return;
    }

    setIsUploadingLogo(true);
    setFeedbackMessage("");

    try {
      const formData = new FormData();
      formData.set("logo", files[0]);

      const response = await fetch(`/api/brochure/projects/${project.id}/logo`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to upload logo."),
        );
      }

      const payload = (await response.json()) as { project?: BrochureProject };
      if (!payload.project) throw new Error("Failed to upload logo.");

      setProject(payload.project);
      setSettings(payload.project.settings);
      setFeedbackTone("success");
      setFeedbackMessage("Logo uploaded.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to upload logo.",
      );
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleAssetsUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    const uploadError = getUploadError(files);
    if (uploadError) {
      setFeedbackTone("error");
      setFeedbackMessage(uploadError);
      return;
    }

    setIsUploadingAssets(true);
    setFeedbackMessage("");

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch(`/api/brochure/projects/${project.id}/assets`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(
          await getResponseErrorMessage(response, "Failed to upload assets."),
        );
      }

      const payload = (await response.json()) as { project?: BrochureProject };
      if (!payload.project) throw new Error("Failed to upload assets.");

      setProject(payload.project);
      setSettings(payload.project.settings);
      setFeedbackTone("success");
      setFeedbackMessage("Assets uploaded.");
    } catch (error) {
      setFeedbackTone("error");
      setFeedbackMessage(
        error instanceof Error ? error.message : "Failed to upload assets.",
      );
    } finally {
      setIsUploadingAssets(false);
    }
  };

  const handleToggleImage = (imageId: string) => {
    const nextSelection = new Set(effectiveSelectedImageIds);

    if (nextSelection.has(imageId)) {
      nextSelection.delete(imageId);
    } else {
      nextSelection.add(imageId);
    }

    updateField("selectedImageIds", [...nextSelection]);
  };

  const handleCopyLink = async () => {
    if (!shareUrl || typeof navigator === "undefined" || !navigator.clipboard) {
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopying(true);
      setFeedbackTone("success");
      setFeedbackMessage("Share link copied.");
      window.setTimeout(() => setIsCopying(false), 1400);
    } catch {
      setFeedbackTone("error");
      setFeedbackMessage("Failed to copy share link.");
    }
  };

  const brochureTemplateCards: Array<{
    key: BrochureTemplate;
    title: string;
    description: string;
  }> = [
    { key: "minimal", title: "Minimal", description: templateDescriptions.minimal },
    { key: "modern", title: "Modern", description: templateDescriptions.modern },
    { key: "luxury", title: "Luxury", description: templateDescriptions.luxury },
  ];

  const brochureFontOptions: Array<{
    key: BrochureFontFamily;
    title: string;
  }> = [
    { key: "helvetica", title: "Helvetica" },
    { key: "garamond", title: "Garamond" },
    { key: "georgia", title: "Georgia" },
    { key: "times", title: "Times" },
  ];

  return (
    <section className="brochureStudioShell">
      <header className="brochureStudioHeader">
        <div className="projectFeedbackIntro">
          <p className="projectFeedbackEyebrow">myBrochure</p>
          <h1 className="projectFeedbackTitle">{project.name}</h1>
          <p className="projectFeedbackVersionMeta">
            Built from {project.approvedImageCount} approved myStudio image(s). Add
            your logo, supporting visuals, and brochure copy from one workspace.
          </p>
          {shareUrl ? (
            <p className="projectFeedbackMeta projectFeedbackMetaCode">{shareUrl}</p>
          ) : null}
        </div>

        <div className="brochureStudioToolbar">
          <button
            className={`projectFeedbackAction${isCopying ? " projectFeedbackActionSuccess" : ""}`}
            type="button"
            onClick={() => void handleCopyLink()}
          >
            {isCopying ? "Copied" : "Copy link"}
          </button>
          <button
            className="projectFeedbackAction"
            type="button"
            onClick={() => window.print()}
          >
            Save PDF
          </button>
        </div>
      </header>

      {feedbackMessage ? (
        <p
          className={`projectFeedbackMessage${
            feedbackTone === "error" ? " projectFeedbackMessageError" : ""
          }`}
        >
          {feedbackMessage}
        </p>
      ) : null}

      <div className="brochureStudioLayout">
        <aside className="brochureStudioControls">
          <section className="brochureStudioSection">
            <div className="brochureStudioSectionHeader">
              <h2 className="projectFeedbackVersionTitle">Template</h2>
              <p className="projectFeedbackVersionMeta">Choose a brochure direction.</p>
            </div>

            <div className="brochureTemplateGrid">
              {brochureTemplateCards.map((template) => (
                <button
                  key={template.key}
                  className="brochureTemplateCard"
                  type="button"
                  data-active={settings.template === template.key ? "true" : "false"}
                  onClick={() => updateField("template", template.key)}
                >
                  <strong>{template.title}</strong>
                  <span>{template.description}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="brochureStudioSection">
            <div className="brochureStudioSectionHeader">
              <h2 className="projectFeedbackVersionTitle">Typography</h2>
              <p className="projectFeedbackVersionMeta">Adjust text styling.</p>
            </div>

            <label className="projectFeedbackField">
              <span>Font family</span>
              <select
                className="projectFeedbackInput"
                value={settings.fontFamily}
                onChange={(event) =>
                  updateField("fontFamily", event.target.value as BrochureFontFamily)
                }
              >
                {brochureFontOptions.map((font) => (
                  <option key={font.key} value={font.key}>
                    {font.title}
                  </option>
                ))}
              </select>
            </label>

            <div className="brochureColorGrid">
              <label className="projectFeedbackField">
                <span>Heading color</span>
                <input
                  className="brochureColorInput"
                  type="color"
                  value={settings.headingColor}
                  onChange={(event) => updateField("headingColor", event.target.value)}
                />
              </label>
              <label className="projectFeedbackField">
                <span>Body color</span>
                <input
                  className="brochureColorInput"
                  type="color"
                  value={settings.bodyColor}
                  onChange={(event) => updateField("bodyColor", event.target.value)}
                />
              </label>
              <label className="projectFeedbackField">
                <span>Accent color</span>
                <input
                  className="brochureColorInput"
                  type="color"
                  value={settings.accentColor}
                  onChange={(event) => updateField("accentColor", event.target.value)}
                />
              </label>
            </div>
          </section>

          <section className="brochureStudioSection">
            <div className="brochureStudioSectionHeader">
              <h2 className="projectFeedbackVersionTitle">Content</h2>
              <p className="projectFeedbackVersionMeta">
                Prepare the copy shown in the web preview and PDF.
              </p>
            </div>

            <label className="projectFeedbackField">
              <span>Title</span>
              <input
                className="projectFeedbackInput"
                type="text"
                value={settings.title}
                onChange={(event) => updateField("title", event.target.value)}
              />
            </label>

            <label className="projectFeedbackField">
              <span>Subtitle</span>
              <input
                className="projectFeedbackInput"
                type="text"
                value={settings.subtitle}
                onChange={(event) => updateField("subtitle", event.target.value)}
              />
            </label>

            <label className="projectFeedbackField">
              <span>Body</span>
              <textarea
                className="projectFeedbackTextarea brochureStudioTextarea"
                value={settings.body}
                onChange={(event) => updateField("body", event.target.value)}
              />
            </label>
          </section>

          <section className="brochureStudioSection">
            <div className="brochureStudioSectionHeader">
              <h2 className="projectFeedbackVersionTitle">Approved 3D images</h2>
              <p className="projectFeedbackVersionMeta">
                Select the renders that should appear in the brochure.
              </p>
            </div>

            <div className="brochureAssetGrid">
              {project.approvedImages.map((image, index) => {
                const isSelected = effectiveSelectedImageIds.includes(image.id);

                return (
                  <button
                    key={image.id}
                    className="brochureAssetCard"
                    type="button"
                    data-active={isSelected ? "true" : "false"}
                    onClick={() => handleToggleImage(image.id)}
                  >
                    <img
                      className="brochureAssetImage"
                      src={image.url}
                      alt={`Approved image ${index + 1}`}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="brochureAssetCardMeta">
                      Image {index + 1} • V{image.version}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="brochureStudioSection">
            <div className="brochureStudioSectionHeader">
              <h2 className="projectFeedbackVersionTitle">Brand assets</h2>
              <p className="projectFeedbackVersionMeta">
                Upload a logo and additional visuals beyond the 3D renders.
              </p>
            </div>

            <div className="brochureStudioUploads">
              <label className="projectFeedbackUpload brochureStudioUpload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => void handleLogoUpload(event)}
                  disabled={isUploadingLogo}
                />
                {isUploadingLogo ? "Uploading logo..." : "Upload logo"}
              </label>

              <label className="projectFeedbackUpload brochureStudioUpload">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => void handleAssetsUpload(event)}
                  disabled={isUploadingAssets}
                />
                {isUploadingAssets ? "Uploading assets..." : "Upload extra images"}
              </label>
            </div>

            {settings.logoUrl ? (
              <div className="brochureStudioLogoPreview">
                <img src={settings.logoUrl} alt={`${project.name} logo`} />
              </div>
            ) : null}

            {project.assets.length > 0 ? (
              <div className="brochureStudioExtraAssets">
                {project.assets.map((asset: BrochureAsset) => (
                  <div key={asset.id} className="brochureStudioExtraAsset">
                    <img src={asset.url} alt={asset.fileName} loading="lazy" decoding="async" />
                    <span>{asset.fileName}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </section>

          <div className="brochureStudioActionRow brochureStudioControlsFooter">
            <button
              className="projectFeedbackAction"
              type="button"
              onClick={() => void handleSaveSettings()}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save settings"}
            </button>
          </div>
        </aside>

        <div className="brochurePreviewShell">
          <div
            className="brochurePreviewPage"
            data-template={settings.template}
            data-count={previewAssets.length}
            style={previewStyle}
          >
            <div className="brochurePreviewHero">
              <div className="brochurePreviewHeroCopy">
                <p className="brochurePreviewEyebrow">BrotherStudio brochure</p>
                <h2 className="brochurePreviewTitle">{settings.title}</h2>
                <p className="brochurePreviewSubtitle">{settings.subtitle}</p>
                <p className="brochurePreviewBody">{settings.body}</p>
              </div>

              {settings.logoUrl ? (
                <div className="brochurePreviewLogo">
                  <img src={settings.logoUrl} alt={`${project.name} logo`} />
                </div>
              ) : null}
            </div>

            <div className="brochurePreviewGrid">
              {previewAssets.length > 0 ? (
                previewAssets.map((asset) => (
                  <figure key={asset.id} className="brochurePreviewFigure">
                    <img src={asset.url} alt={asset.label} />
                    <figcaption>
                      <strong>{asset.label}</strong>
                      <span>{asset.meta}</span>
                    </figcaption>
                  </figure>
                ))
              ) : (
                <div className="brochurePreviewEmpty">
                  Select approved images or upload additional assets to build the
                  brochure preview.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
