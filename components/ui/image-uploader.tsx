"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  type SortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  CircleAlertIcon,
  ImagePlusIcon,
  Loader2,
  PlusIcon,
  RotateCwIcon,
  UploadCloudIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert";

/**
 * The display shape of one tile. Uploading is somebody else's job — the caller
 * owns the files and their upload state (see `useImageUploads`), and anything
 * structurally matching this renders here.
 */
export interface ImageUploaderItem {
  id: string;
  preview: string;
  status: "uploading" | "uploaded" | "error";
  error?: string;
}

interface ImageUploaderProps {
  value: ImageUploaderItem[];
  /** Called with the files that survived validation, in selection order. */
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
  /**
   * Move `activeId` to `overId`'s slot. Omit to disable reordering entirely.
   * Order matters: the first photo becomes the listing's cover.
   */
  onReorder?: (activeId: string, overId: string) => void;
  maxFiles?: number;
  maxSize?: number;
  /** Comma-separated MIME list, e.g. "image/jpeg,image/png". */
  accept?: string;
  className?: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

/**
 * Move only the photo under the cursor; leave the others where they are.
 *
 * The stock `rectSortingStrategy` previews a reorder by shifting every sibling,
 * but its maths assumes a grid of equal cells — and the cover tile here is 2×2.
 * With mixed sizes it lays the previews on top of each other. dnd-kit only
 * consults the strategy for the items that *aren't* being dragged (the drag
 * source uses the pointer delta), so returning null keeps the dragged photo
 * under the finger and drops the misleading preview. The drop target is shown
 * with a ring instead, and the grid animates into its new order afterwards.
 */
const noDisplacement: SortingStrategy = () => null;

/** "image/jpeg,image/png,image/webp" → "JPEG, PNG or WEBP" */
function describeTypes(accept: string): string {
  const labels = accept
    .split(",")
    .map((type) => type.trim().split("/")[1]?.toUpperCase())
    .filter(Boolean);

  if (labels.length === 0) return "Images";
  if (labels.length === 1) return labels[0]!;
  return `${labels.slice(0, -1).join(", ")} or ${labels.at(-1)}`;
}

/**
 * One photo tile.
 *
 * The whole tile is the drag activator rather than a corner grip: on a grid of
 * images, grabbing the image is the gesture people already expect. The buttons
 * on top stop pointer events from reaching it so a tap on Remove stays a tap.
 */
function SortableTile({
  item,
  index,
  total,
  isCover,
  canReorder,
  onRemove,
  onRetry,
}: {
  item: ImageUploaderItem;
  index: number;
  total: number;
  isCover: boolean;
  canReorder: boolean;
  onRemove: (id: string) => void;
  onRetry?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: item.id, disabled: !canReorder });

  const isDropTarget = isOver && !isDragging;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group/tile bg-muted relative overflow-hidden rounded-xl ring-1 ring-inset",
        "aspect-square touch-manipulation select-none",
        // The cover is worth twice the room: it is the image every listing card
        // and the carousel's first frame will use.
        isCover && "col-span-2 row-span-2",
        canReorder && "cursor-grab active:cursor-grabbing",
        isDragging && "z-10 cursor-grabbing opacity-80 shadow-lg",
        item.status === "error"
          ? "ring-destructive ring-2"
          : isDropTarget
            ? "ring-primary ring-2"
            : "ring-border/60 focus-visible:ring-ring focus-visible:ring-2",
        "outline-none",
      )}
      {...attributes}
      {...listeners}
      aria-label={
        canReorder
          ? `Photo ${index + 1} of ${total}${isCover ? " (cover)" : ""}. Press space to reorder.`
          : `Photo ${index + 1} of ${total}${isCover ? " (cover)" : ""}`
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.preview}
        alt=""
        draggable={false}
        className={cn(
          "size-full object-cover",
          item.status !== "uploaded" && "opacity-40",
        )}
      />

      {/* Upload state. The photo is already on its way to storage the moment it
          is picked, so the tile has to say where it got to. */}
      {item.status === "uploading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="text-foreground size-5 animate-spin" />
        </div>
      )}

      {item.status === "error" && onRetry && (
        <div className="absolute inset-0 flex items-center justify-center p-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onRetry(item.id)}
            // The sensors activate on mousedown/touchstart, so a long press on
            // this button would otherwise pick the whole tile up instead.
            onMouseDown={(event) => event.stopPropagation()}
            onTouchStart={(event) => event.stopPropagation()}
            className="h-7 gap-1.5 rounded-full px-2.5 text-xs shadow-sm"
          >
            <RotateCwIcon className="size-3.5" />
            Retry
          </Button>
        </div>
      )}

      {isCover && item.status !== "error" && (
        <span className="bg-background/85 text-foreground absolute start-2 bottom-2 rounded-full px-2 py-0.5 text-[11px] font-medium shadow-sm backdrop-blur-sm">
          Cover
        </span>
      )}

      {/* Always visible, never hover-gated: on a touch screen there is no hover,
          and a remove button you cannot reach is a photo you cannot remove. */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onRemove(item.id)}
        onMouseDown={(event) => event.stopPropagation()}
        onTouchStart={(event) => event.stopPropagation()}
        aria-label={`Remove photo ${index + 1}`}
        className={cn(
          "bg-background/85 hover:bg-background absolute end-1.5 top-1.5 size-7 rounded-full shadow-sm backdrop-blur-sm",
          // Dragging onto a differently-sized slot scales the whole tile, which
          // would blow this button up with it.
          isDragging && "hidden",
        )}
      >
        <XIcon className="size-3.5" />
      </Button>
    </div>
  );
}

export function ImageUploader({
  value,
  onAdd,
  onRemove,
  onRetry,
  onReorder,
  maxFiles = 10,
  maxSize = 2 * 1024 * 1024, // 2MB
  accept = "image/*",
  className,
}: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  const isFull = value.length >= maxFiles;
  const canReorder = Boolean(onReorder) && value.length > 1;

  const acceptedTypes = useMemo(
    () => accept.split(",").map((type) => type.trim()).filter(Boolean),
    [accept],
  );

  const matchesAccept = useCallback(
    (file: File) =>
      acceptedTypes.some((type) =>
        type.endsWith("/*")
          ? file.type.startsWith(type.slice(0, -1))
          : file.type === type,
      ),
    [acceptedTypes],
  );

  const addImages = useCallback(
    (files: FileList | File[]) => {
      const accepted: File[] = [];
      const newErrors: string[] = [];
      let count = value.length;

      Array.from(files).forEach((file) => {
        // Checked against the accept list, not just "is it an image": the
        // presign endpoint 400s the whole batch on one unsupported type, so a
        // HEIC straight off an iPhone would take every other photo down with it.
        if (!matchesAccept(file)) {
          newErrors.push(`${file.name} — only ${describeTypes(accept)} files work here`);
          return;
        }
        if (file.size > maxSize) {
          newErrors.push(
            `${file.name} — ${formatBytes(file.size)}, over the ${formatBytes(maxSize)} limit`,
          );
          return;
        }
        if (count >= maxFiles) {
          newErrors.push(`${file.name} — you can add ${maxFiles} photos at most`);
          return;
        }

        accepted.push(file);
        count += 1;
      });

      setErrors(newErrors);

      if (accepted.length > 0) {
        onAdd(accepted);
      }
    },
    [value, onAdd, maxSize, maxFiles, accept, matchesAccept],
  );

  const openFileDialog = useCallback(() => inputRef.current?.click(), []);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files?.length) addImages(event.target.files);
      // Otherwise picking the same file twice in a row is a no-op: the value
      // never changes, so `change` never fires again.
      event.target.value = "";
    },
    [addImages],
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (e.dataTransfer.files.length > 0) addImages(e.dataTransfer.files);
    },
    [addImages],
  );

  // Mouse and touch are deliberately separate sensors. A pointer sensor would
  // need `touch-action: none` on every tile, which stops the page scrolling when
  // a finger lands on the grid; a long press to pick a photo up costs nothing.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      if (!over || active.id === over.id) return;
      onReorder?.(String(active.id), String(over.id));
    },
    [onReorder],
  );

  const announcements: Announcements = useMemo(
    () => ({
      onDragStart: ({ active }) => {
        const index = value.findIndex((item) => item.id === active.id);
        return `Picked up photo ${index + 1} of ${value.length}.`;
      },
      onDragOver: ({ over }) => {
        if (!over) return undefined;
        const index = value.findIndex((item) => item.id === over.id);
        return `Photo moved to position ${index + 1} of ${value.length}.`;
      },
      onDragEnd: ({ over }) => {
        if (!over) return "Photo returned to its original position.";
        const index = value.findIndex((item) => item.id === over.id);
        return index === 0
          ? "Photo dropped in position 1. It is now the cover."
          : `Photo dropped in position ${index + 1} of ${value.length}.`;
      },
      onDragCancel: () => "Reordering cancelled.",
    }),
    [value],
  );

  const uploadingCount = value.filter((item) => item.status === "uploading").length;
  const failedCount = value.filter((item) => item.status === "error").length;

  return (
    <div className={cn("w-full", className)}>
      {/* One real input for every entry point — the dropzone, the add tile and
          the empty state all click this. A detached input built on the fly
          reaches no keyboard and no screen reader. */}
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleInputChange}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "@container/photos rounded-2xl transition-colors",
          isDragging && "ring-primary bg-primary/5 ring-2",
        )}
      >
        {value.length === 0 ? (
          // Empty state: the dropzone is the whole surface and is itself the
          // button, so click, Tab-and-Enter, and drop all land in one place.
          <button
            type="button"
            onClick={openFileDialog}
            className={cn(
              "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/40",
              "focus-visible:border-ring focus-visible:ring-ring/30 flex w-full flex-col items-center",
              "justify-center gap-2 rounded-2xl border border-dashed px-6 py-10 text-center",
              "transition-colors outline-none focus-visible:ring-3 sm:py-14",
            )}
          >
            <span className="border-border bg-background flex size-10 items-center justify-center rounded-full border">
              <UploadCloudIcon className="size-4.5" />
            </span>
            <span className="text-foreground text-sm font-medium">
              Add photos of your item
            </span>
            <span className="text-muted-foreground text-xs">
              Drag &amp; drop, or tap to browse · {describeTypes(accept)} up to{" "}
              {formatBytes(maxSize)}
            </span>
          </button>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToParentElement]}
            onDragEnd={handleDragEnd}
            accessibility={{ announcements }}
          >
            <SortableContext
              items={value.map((item) => item.id)}
              strategy={noDisplacement}
            >
              {/* Container query, not a viewport one: in the two-column dialog
                  this grid is ~340px wide on a desktop — near enough the same
                  as on a phone — so a `sm:` breakpoint would only shrink the
                  tiles on the screen with the most room to spare. */}
              <div className="@lg/photos:grid-cols-4 grid grid-cols-3 gap-2">
                {value.map((item, index) => (
                  <SortableTile
                    key={item.id}
                    item={item}
                    index={index}
                    total={value.length}
                    isCover={index === 0}
                    canReorder={canReorder}
                    onRemove={onRemove}
                    onRetry={onRetry}
                  />
                ))}

                {!isFull && (
                  <button
                    type="button"
                    onClick={openFileDialog}
                    className={cn(
                      "border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/60",
                      "hover:text-foreground hover:bg-muted/40 focus-visible:border-ring",
                      "focus-visible:ring-ring/30 flex aspect-square flex-col items-center justify-center",
                      "gap-1 rounded-xl border border-dashed transition-colors outline-none",
                      "focus-visible:ring-3",
                    )}
                  >
                    <PlusIcon className="size-4" />
                    <span className="text-[11px] leading-none font-medium">Add</span>
                  </button>
                )}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {value.length > 0 && (
        <p className="text-muted-foreground mt-2.5 flex items-center gap-1.5 text-xs">
          <ImagePlusIcon className="size-3.5 shrink-0" />
          {canReorder
            ? "The first photo is the cover — drag a photo to reorder."
            : "The first photo is the cover."}
        </p>
      )}

      {/* Tile state is colour and motion, neither of which a screen reader sees. */}
      <p aria-live="polite" className="sr-only">
        {uploadingCount > 0
          ? `Uploading ${uploadingCount} of ${value.length} photos.`
          : failedCount > 0
            ? `${failedCount} of ${value.length} photos failed to upload.`
            : value.length > 0
              ? `${value.length} photos uploaded.`
              : "No photos added."}
      </p>

      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-4" id={errorId}>
          <CircleAlertIcon />
          <AlertTitle>
            {errors.length === 1 ? "That file wasn't added" : "Some files weren't added"}
          </AlertTitle>
          <AlertDescription>
            {errors.map((error, index) => (
              <p key={index} className="last:mb-0">
                {error}
              </p>
            ))}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
