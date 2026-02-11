"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import type { GalleryItem } from "@/lib/galleryStore";

type GalleryProps = {
  items: GalleryItem[];
  editable?: boolean;
};

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

export function Gallery({ items, editable = false }: GalleryProps) {
  const router = useRouter();
  const [localItems, setLocalItems] = useState<GalleryItem[]>(items);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const replaceInputRef = useRef<HTMLInputElement | null>(null);
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const replaceTargetIdRef = useRef<string | null>(null);
  const lastSavedArchitectByIdRef = useRef<Map<string, string>>(new Map());
  const lastSavedOrderRef = useRef<string[]>([]);

  useEffect(() => {
    setLocalItems(items);
    lastSavedArchitectByIdRef.current = new Map(
      items.map((i) => [i.id, i.architect] as const),
    );
    lastSavedOrderRef.current = items.map((i) => i.id);
  }, [items]);

  const activeItem = useMemo(() => {
    if (activeId === null) return null;
    return localItems.find((i) => i.id === activeId) ?? null;
  }, [activeId, localItems]);

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

    setBusyId("add");
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("architect", architect);

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
      <div
        className="gallery"
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

          const previous = localItems;
          const next = moveToEnd(previous, fromId);
          if (next === previous) return;

          setLocalItems(next);
          setDragId(null);
          setDragOverId(null);
          void saveOrder(next, previous);
        }}
      >
        {localItems.map((item) => {
          const isDropTarget =
            editable && dragId !== null && dragId !== item.id && dragOverId === item.id;
          return (
            <div
              key={item.id}
              className={`galleryItem${isDropTarget ? " galleryItemDropTarget" : ""}`}
              role="listitem"
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

                const previous = localItems;
                const next = reorderById(previous, fromId, item.id);
                if (next === previous) return;

                setLocalItems(next);
                setDragId(null);
                setDragOverId(null);
                void saveOrder(next, previous);
              }}
            >
              <button
                className="galleryImageButton"
                type="button"
                onClick={() => setActiveId(item.id)}
                aria-label="Open image"
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
                <img
                  className="galleryImage"
                  src={item.src}
                  alt={item.architect}
                  loading="lazy"
                  decoding="async"
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
                <input
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
              ) : (
                <div className="galleryCaption">{item.architect}</div>
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
