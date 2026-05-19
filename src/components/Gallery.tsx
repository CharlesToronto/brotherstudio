"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { GalleryItem } from "@/lib/galleryStore";
import {
  DEFAULT_GALLERY_PROJECT,
  PROJECT_OPTIONS,
  getGalleryProjectLabel,
  type GalleryProjectKey,
  type GalleryProjectValue,
} from "@/lib/galleryProjects";

type GalleryProps = {
  items: GalleryItem[];
  editable?: boolean;
  activeProject?: GalleryProjectKey | "all";
  galleryState?: {
    activeProject: GalleryProjectKey | "all";
    visibleCount: number;
  };
  filterLabels?: {
    all: string;
    ariaLabel: string;
  };
  onProjectChange?: (project: GalleryProjectKey | "all") => void;
  showProjectFilters?: boolean;
};

const GALLERY_IMAGE_SIZES =
  "(max-width: 640px) calc(100vw - 36px), (max-width: 1100px) calc((100vw - 84px) / 2), calc((100vw - 112px) / 3)";
const ALWAYS_VISIBLE_PROJECT_KEYS = new Set<GalleryProjectKey>(["flanthey", "arbaz"]);
const INITIAL_GALLERY_BATCH = 12;
const GALLERY_BATCH_SIZE = 12;

function arraysEqual(a: string[], b: string[]) {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) return items;
  if (fromIndex < 0 || toIndex < 0) return items;
  if (fromIndex >= items.length || toIndex >= items.length) return items;

  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function reorderById(items: GalleryItem[], fromId: string, toId: string) {
  const fromIndex = items.findIndex((i) => i.id === fromId);
  const toIndex = items.findIndex((i) => i.id === toId);
  if (fromIndex === -1 || toIndex === -1) return items;
  return moveItem(items, fromIndex, toIndex);
}

function moveToEnd(items: GalleryItem[], id: string) {
  const fromIndex = items.findIndex((i) => i.id === id);
  if (fromIndex === -1) return items;
  return moveItem(items, fromIndex, items.length - 1);
}

function mergeVisibleOrder(
  allItems: GalleryItem[],
  visibleItems: GalleryItem[],
  nextVisibleItems: GalleryItem[],
) {
  if (visibleItems.length === allItems.length) return nextVisibleItems;

  const visibleIds = new Set(visibleItems.map((item) => item.id));
  let visibleIndex = 0;

  return allItems.map((item) =>
    visibleIds.has(item.id) ? nextVisibleItems[visibleIndex++] : item,
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3l4 4h-3v7h-2V7H8l4-4zm-7 14h14v2H5v-2z"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 21c-.55 0-1-.45-1-1V7h12v13c0 .55-.45 1-1 1H7zm10-16H7V3h4l1-1h4v3z"
      />
    </svg>
  );
}

export function Gallery({
  items,
  editable = false,
  activeProject: controlledActiveProject,
  galleryState,
  filterLabels,
  onProjectChange,
  showProjectFilters = true,
}: GalleryProps) {
  const router = useRouter();
  const resolvedFilterLabels = filterLabels ?? {
    all: editable ? "Tous" : "All",
    ariaLabel: editable ? "Filtres de projet" : "Project filters",
  };
  const [localItems, setLocalItems] = useState<GalleryItem[]>(items);
  const sourceItems = editable ? localItems : items;
  const [activeId, setActiveId] = useState<string | null>(null);
  const [internalActiveProject, setInternalActiveProject] = useState<GalleryProjectKey | "all">("all");
  const activeProject = controlledActiveProject ?? internalActiveProject;
  const setActiveProject = useCallback((project: GalleryProjectKey | "all") => {
    if (controlledActiveProject === undefined) {
      setInternalActiveProject(project);
    }
    onProjectChange?.(project);
  }, [controlledActiveProject, onProjectChange]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(() =>
    Math.min(items.length, INITIAL_GALLERY_BATCH),
  );
  const [revealedIds, setRevealedIds] = useState<string[]>([]);
  const [loadedIds, setLoadedIds] = useState<string[]>([]);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetIdRef = useRef<string | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const revealItemRefs = useRef(new Map<string, HTMLDivElement>());
  const previousProjectRef = useRef<GalleryProjectKey | "all">("all");
  const lastSavedArchitectByIdRef = useRef<Map<string, string>>(new Map());
  const lastSavedProjectByIdRef = useRef<Map<string, GalleryProjectValue>>(new Map());
  const lastSavedOrderRef = useRef<string[]>([]);

  useEffect(() => {
    setLocalItems(items);
    lastSavedArchitectByIdRef.current = new Map(
      items.map((i) => [i.id, i.architect] as const),
    );
    lastSavedProjectByIdRef.current = new Map(
      items.map((i) => [i.id, i.project] as const),
    );
    lastSavedOrderRef.current = items.map((i) => i.id);
  }, [items]);

  const availableProjects = useMemo(
    () => {
      if (editable) return [...PROJECT_OPTIONS];
      return PROJECT_OPTIONS.filter((option) =>
        ALWAYS_VISIBLE_PROJECT_KEYS.has(option.key) ||
        sourceItems.some((item) => item.project === option.key),
      );
    },
    [editable, sourceItems],
  );

  useEffect(() => {
    if (activeProject === "all") return;
    if (availableProjects.some((option) => option.key === activeProject)) return;
    setActiveProject("all");
  }, [activeProject, availableProjects, setActiveProject]);

  const filteredItems = useMemo(() => {
    if (activeProject === "all") return sourceItems;
    return sourceItems.filter((item) => item.project === activeProject);
  }, [activeProject, sourceItems]);

  const renderedItems = useMemo(
    () => filteredItems.slice(0, visibleCount),
    [filteredItems, visibleCount],
  );

  useEffect(() => {
    const nextInitialCount = Math.min(filteredItems.length, INITIAL_GALLERY_BATCH);

    if (previousProjectRef.current !== activeProject) {
      previousProjectRef.current = activeProject;
      setVisibleCount(nextInitialCount);
      setRevealedIds([]);
      setLoadedIds([]);
      return;
    }

    setVisibleCount((current) =>
      current > filteredItems.length ? nextInitialCount : Math.max(current, nextInitialCount),
    );
  }, [activeProject, filteredItems.length]);

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    if (!sentinel || visibleCount >= filteredItems.length) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting) return;
        setVisibleCount((current) =>
          Math.min(current + GALLERY_BATCH_SIZE, filteredItems.length),
        );
      },
      {
        rootMargin: "220px 0px",
        threshold: 0.01,
      },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredItems.length, visibleCount]);

  useEffect(() => {
    if (renderedItems.length === 0) return undefined;

    const observer = new IntersectionObserver(
      (entries) => {
        setRevealedIds((current) => {
          const next = new Set(current);
          for (const entry of entries) {
            const id = (entry.target as HTMLElement).dataset.galleryId;
            if (!id) continue;
            if (entry.isIntersecting) {
              next.add(id);
            } else {
              next.delete(id);
            }
          }
          return Array.from(next);
        });
      },
      {
        rootMargin: "0px 0px -8% 0px",
        threshold: 0.18,
      },
    );

    for (const item of renderedItems) {
      const node = revealItemRefs.current.get(item.id);
      if (node) observer.observe(node);
    }

    return () => observer.disconnect();
  }, [renderedItems]);

  const activeItem = useMemo(() => {
    if (activeId === null) return null;
    return sourceItems.find((i) => i.id === activeId) ?? null;
  }, [activeId, sourceItems]);

  useEffect(() => {
    if (!activeItem) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveId(null);
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeItem]);

  const openReplacePicker = (id: string) => {
    replaceTargetIdRef.current = id;
    replaceInputRef.current?.click();
  };

  const openAddPicker = () => {
    addInputRef.current?.click();
  };

  const replaceImage = async (id: string, file: File) => {
    setBusyId(id);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`/api/gallery/${encodeURIComponent(id)}/image`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Upload failed");
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusyId(null);
    }
  };

  const addImage = async (file: File) => {
    const architect =
      window.prompt("Architect / Studio name", "Architect / Studio")?.trim() ?? "";
    if (!architect) return;

    const project =
      activeProject === "all" ? DEFAULT_GALLERY_PROJECT : activeProject;

    setBusyId("add");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("architect", architect);
      formData.append("project", project);

      const response = await fetch("/api/gallery", { method: "POST", body: formData });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Upload failed");
      }

      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setBusyId(null);
    }
  };

  const deleteItem = async (id: string) => {
    const ok = window.confirm("Delete this image?");
    if (!ok) return;

    setBusyId(id);
    try {
      const response = await fetch(`/api/gallery/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Delete failed");
      }

      if (activeId === id) setActiveId(null);
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  };

  const saveArchitect = async (id: string, rawValue: string) => {
    const lastSavedArchitect = lastSavedArchitectByIdRef.current.get(id) ?? "";
    const architect = rawValue.trim();

    if (!architect) {
      setLocalItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, architect: lastSavedArchitect } : i)),
      );
      return;
    }

    if (architect === lastSavedArchitect) return;

    setBusyId(id);
    try {
      const response = await fetch(`/api/gallery/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ architect }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Update failed");
      }

      lastSavedArchitectByIdRef.current.set(id, architect);
      setLocalItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, architect } : i)),
      );
      router.refresh();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const saveProject = async (id: string, project: GalleryProjectValue) => {
    const lastSavedProject = lastSavedProjectByIdRef.current.has(id)
      ? (lastSavedProjectByIdRef.current.get(id) ?? null)
      : DEFAULT_GALLERY_PROJECT;

    if (project === lastSavedProject) return;

    setBusyId(id);
    try {
      const response = await fetch(`/api/gallery/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ project }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Update failed");
      }

      lastSavedProjectByIdRef.current.set(id, project);
      setLocalItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, project } : item)),
      );
      router.refresh();
    } catch (error) {
      setLocalItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, project: lastSavedProject } : item,
        ),
      );
      window.alert(error instanceof Error ? error.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  };

  const saveOrder = async (nextItems: GalleryItem[], previousItems: GalleryItem[]) => {
    const nextOrder = nextItems.map((i) => i.id);
    if (arraysEqual(nextOrder, lastSavedOrderRef.current)) return;

    setBusyId("order");
    try {
      const response = await fetch("/api/gallery", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ order: nextOrder }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error ?? "Reorder failed");
      }

      lastSavedOrderRef.current = nextOrder;
      router.refresh();
    } catch (error) {
      setLocalItems(previousItems);
      window.alert(error instanceof Error ? error.message : "Reorder failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      {showProjectFilters && availableProjects.length > 0 ? (
        <div
          className="galleryFilters"
          role="toolbar"
          aria-label={resolvedFilterLabels.ariaLabel}
        >
          <button
            type="button"
            className="galleryFilterButton"
            data-active={activeProject === "all"}
            onClick={() => setActiveProject("all")}
          >
            {resolvedFilterLabels.all}
          </button>
          {availableProjects.map((project) => (
            <button
              key={project.key}
              type="button"
              className="galleryFilterButton"
              data-active={activeProject === project.key}
              onClick={() => setActiveProject(project.key)}
            >
              {project.label}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className="gallery"
        data-active-project={galleryState?.activeProject ?? activeProject}
        data-visible-count={galleryState?.visibleCount ?? filteredItems.length}
        role="list"
        onDragOver={(event) => {
          if (!editable || busyId !== null) return;
          event.preventDefault();
        }}
        onDrop={(event) => {
          if (!editable || busyId !== null) return;
          event.preventDefault();
          const fromId = dragId ?? event.dataTransfer.getData("text/plain") ?? null;
          if (!fromId) return;

          const previousAll = localItems;
          const previousVisible = filteredItems;
          const nextVisible = moveToEnd(previousVisible, fromId);
          if (nextVisible === previousVisible) return;

          const nextAll = mergeVisibleOrder(previousAll, previousVisible, nextVisible);

          setLocalItems(nextAll);
          setDragId(null);
          setDragOverId(null);
          void saveOrder(nextAll, previousAll);
        }}
      >
        {renderedItems.map((item, index) => {
          const isDropTarget =
            editable && dragId !== null && dragId !== item.id && dragOverId === item.id;
          const isPriorityImage = index < 2;
          const isSvgImage = item.src.toLowerCase().endsWith(".svg");
          const isRevealed = revealedIds.includes(item.id);
          const isLoaded = loadedIds.includes(item.id);
          return (
            <div
              key={item.id}
              className={`galleryItem${isDropTarget ? " galleryItemDropTarget" : ""}`}
              role="listitem"
              ref={(node) => {
                if (node) {
                  revealItemRefs.current.set(item.id, node);
                } else {
                  revealItemRefs.current.delete(item.id);
                }
              }}
              data-gallery-id={item.id}
              data-revealed={isRevealed ? "true" : "false"}
              onDragOver={(event) => {
                if (!editable || busyId !== null) return;
                event.preventDefault();
                if (dragId && dragId !== item.id) setDragOverId(item.id);
              }}
              onDrop={(event) => {
                if (!editable || busyId !== null) return;
                event.preventDefault();
                event.stopPropagation();

                const fromId = dragId ?? event.dataTransfer.getData("text/plain") ?? null;
                if (!fromId || fromId === item.id) return;

                const previousAll = localItems;
                const previousVisible = filteredItems;
                const nextVisible = reorderById(previousVisible, fromId, item.id);
                if (nextVisible === previousVisible) return;

                const nextAll = mergeVisibleOrder(
                  previousAll,
                  previousVisible,
                  nextVisible,
                );

                setLocalItems(nextAll);
                setDragId(null);
                setDragOverId(null);
                void saveOrder(nextAll, previousAll);
              }}
            >
              <button
                className="galleryImageButton"
                type="button"
                onClick={() => setActiveId(item.id)}
                aria-label="Open image"
                data-loaded={isLoaded ? "true" : "false"}
                draggable={editable && busyId === null}
                onDragStart={(event) => {
                  if (!editable || busyId !== null) return;
                  setDragId(item.id);
                  setDragOverId(null);
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", item.id);
                }}
                onDragEnd={() => {
                  if (!editable) return;
                  setDragId(null);
                  setDragOverId(null);
                }}
              >
                <Image
                  className="galleryImage"
                  src={item.src}
                  alt={item.architect}
                  width={1600}
                  height={1600}
                  sizes={GALLERY_IMAGE_SIZES}
                  quality={78}
                  priority={isPriorityImage}
                  loading={isPriorityImage ? undefined : "lazy"}
                  decoding="async"
                  unoptimized={isSvgImage}
                  onLoad={() =>
                    setLoadedIds((current) =>
                      current.includes(item.id) ? current : [...current, item.id],
                    )
                  }
                />
              </button>

              {editable ? (
                <div className="galleryControls" aria-label="Edit image">
                  <button
                    className="galleryControlButton"
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      openReplacePicker(item.id);
                    }}
                    aria-label="Upload / replace"
                    disabled={busyId !== null}
                  >
                    <UploadIcon />
                  </button>
                  <button
                    className="galleryControlButton"
                    type="button"
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      void deleteItem(item.id);
                    }}
                    aria-label="Delete"
                    disabled={busyId !== null}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ) : null}

              {editable ? (
                <div className="galleryMeta">
                  <label className="galleryMetaLabel" htmlFor={`gallery-project-${item.id}`}>
                    Project
                  </label>
                  <select
                    id={`gallery-project-${item.id}`}
                    className="galleryProjectSelect"
                    value={item.project ?? ""}
                    onChange={(event) => {
                      const nextProject =
                        event.target.value === ""
                          ? null
                          : (event.target.value as GalleryProjectKey);
                      setLocalItems((prev) =>
                        prev.map((i) =>
                          i.id === item.id ? { ...i, project: nextProject } : i,
                        ),
                      );
                      void saveProject(item.id, nextProject);
                    }}
                    disabled={busyId !== null}
                    aria-label="Project"
                  >
                    <option value="">Tous uniquement</option>
                    {PROJECT_OPTIONS.map((project) => (
                      <option key={project.key} value={project.key}>
                        {project.label}
                      </option>
                    ))}
                  </select>
                  <label className="galleryMetaLabel" htmlFor={`gallery-caption-${item.id}`}>
                    Architect / Studio
                  </label>
                  <input
                    id={`gallery-caption-${item.id}`}
                    className="galleryCaptionInput"
                    type="text"
                    value={item.architect}
                    onChange={(event) => {
                      const next = event.target.value;
                      setLocalItems((prev) =>
                        prev.map((i) => (i.id === item.id ? { ...i, architect: next } : i)),
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.currentTarget.blur();
                      }
                    }}
                    onBlur={(event) => void saveArchitect(item.id, event.currentTarget.value)}
                    disabled={busyId !== null}
                    aria-label="Architect / Studio name"
                  />
                </div>
              ) : (
                <div className="galleryMeta galleryMetaInline">
                  <div className="galleryCaption">{item.architect}</div>
                  {getGalleryProjectLabel(item.project) ? (
                    <div className="galleryProjectInline">
                      {getGalleryProjectLabel(item.project)}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}

        {editable ? (
          <button
            type="button"
            className="galleryAddItem"
            onClick={() => openAddPicker()}
            disabled={busyId !== null}
          >
            Add
          </button>
        ) : null}

        {visibleCount < filteredItems.length ? (
          <div
            ref={loadMoreRef}
            className="galleryLoadMoreSentinel"
            aria-hidden="true"
          />
        ) : null}
      </div>

      {activeItem ? (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={() => setActiveId(null)}
        >
          <img
            className="lightboxImage"
            src={activeItem.src}
            alt={activeItem.architect}
            decoding="async"
          />
        </div>
      ) : null}

      {editable ? (
        <>
          <input
            ref={replaceInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = "";
              const id = replaceTargetIdRef.current;
              replaceTargetIdRef.current = null;
              if (!file || !id) return;
              void replaceImage(id, file);
            }}
          />
          <input
            ref={addInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null;
              event.target.value = "";
              if (!file) return;
              void addImage(file);
            }}
          />
        </>
      ) : null}
    </>
  );
}
