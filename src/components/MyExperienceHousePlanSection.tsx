"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type HousePlanSpec = {
  id: string;
  label: string;
  value: string;
};

type HousePlanSectionProps = {
  title: string;
  kicker: string;
  note: string;
  specs: HousePlanSpec[];
  defaultImage: {
    src: string;
    alt: string;
  };
};

type UploadedRoomImage = {
  src: string;
  fileName: string;
  alt: string;
};

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="myExperiencePlanToolIcon">
      <path
        d="M4 20l3.8-.9L18.4 8.5a2.2 2.2 0 0 0 0-3.1l-.8-.8a2.2 2.2 0 0 0-3.1 0L3.9 15.2 3 19z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13.8 5.4l4.8 4.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="myExperiencePlanUploadIcon">
      <path
        d="M12 16V6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8.5 9.5L12 6l3.5 3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 18.5h14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MyExperienceHousePlanSection({
  title,
  kicker,
  note,
  specs,
  defaultImage,
}: HousePlanSectionProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [hoveredSpecId, setHoveredSpecId] = useState("");
  const [uploadedImages, setUploadedImages] = useState<Record<string, UploadedRoomImage>>({});
  const uploadedImagesRef = useRef<Record<string, UploadedRoomImage>>({});

  useEffect(() => {
    return () => {
      Object.values(uploadedImagesRef.current).forEach((entry) => {
        URL.revokeObjectURL(entry.src);
      });
    };
  }, []);

  const activeImage = useMemo(() => {
    if (hoveredSpecId && uploadedImages[hoveredSpecId]) {
      return uploadedImages[hoveredSpecId];
    }
    return defaultImage;
  }, [defaultImage, hoveredSpecId, uploadedImages]);

  const handleFileChange = (specId: string, file: File | null) => {
    if (!file) return;

    setUploadedImages((current) => {
      const next = { ...current };
      const previous = next[specId];
      if (previous) {
        URL.revokeObjectURL(previous.src);
      }

      next[specId] = {
        src: URL.createObjectURL(file),
        fileName: file.name,
        alt: file.name,
      };

      uploadedImagesRef.current = next;
      return next;
    });
  };

  return (
    <>
      <div className="myExperiencePlanCopy">
        <p className="myExperienceSectionKicker">{kicker}</p>
        <div className="myExperiencePlanTitleRow">
          <button
            type="button"
            className="myExperiencePlanEditButton"
            aria-pressed={isEditMode}
            onClick={() => setIsEditMode((current) => !current)}
          >
            <PencilIcon />
          </button>
          <h2 className="myExperienceSectionTitle">{title}</h2>
        </div>

        <dl className="myExperienceSpecs">
          {specs.map((spec) => {
            const hasUpload = Boolean(uploadedImages[spec.id]);

            return (
              <div
                key={spec.id}
                className="myExperienceSpecRow"
                data-edit-mode={isEditMode ? "true" : "false"}
                data-has-upload={hasUpload ? "true" : "false"}
                onMouseEnter={() => setHoveredSpecId(spec.id)}
                onMouseLeave={() => setHoveredSpecId((current) => (current === spec.id ? "" : current))}
              >
                <dt>{spec.label}</dt>
                <div className="myExperienceSpecValueCluster">
                  {isEditMode ? (
                    <label className="myExperiencePlanUploadButton">
                      <input
                        type="file"
                        accept="image/*"
                        className="srOnly"
                        onChange={(event) => handleFileChange(spec.id, event.target.files?.[0] ?? null)}
                      />
                      <UploadIcon />
                    </label>
                  ) : null}
                  <dd>{spec.value}</dd>
                </div>
              </div>
            );
          })}
        </dl>
        <p className="myExperiencePlanNote">{note}</p>
      </div>

      <div className="myExperiencePlanVisual">
        <div className="myExperiencePlanImageFrame">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.src}
            alt={activeImage.alt}
            className="myExperiencePlanImage"
          />
        </div>
      </div>
    </>
  );
}
