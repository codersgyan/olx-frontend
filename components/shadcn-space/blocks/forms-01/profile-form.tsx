"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
// standardSchemaResolver (not zodResolver): @hookform/resolvers@5.4 resolves zod 3
// internally, so its /zod entry's types clash with the app's zod 4. Zod 4 implements
// Standard Schema natively, so this path is version-agnostic.
import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import { CircleAlert, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ImageUploader } from "@/components/ui/image-uploader";
import { useCreateListing } from "@/hooks/use-listings";
import { useImageUploads } from "@/hooks/use-image-uploads";
import { ApiError } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  ACCEPTED_TYPES,
  DESCRIPTION_MAX,
  MAX_IMAGES,
  MAX_IMAGE_BYTES,
  TITLE_MAX,
  listingSchema,
  type ListingValues,
} from "@/lib/validations/listing";

interface ListingFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

/** The 422 fields the API names that map onto a real input. */
const FIELD_ERRORS = new Set<keyof ListingValues>(["title", "description", "price", "city"]);

/** The API's message is `err.Error()`, i.e. "title: title can't be empty". */
const stripFieldPrefix = (message: string, field: string) =>
  message.startsWith(`${field}: `) ? message.slice(field.length + 2) : message;

const ListingForm = ({ onSuccess, onCancel }: ListingFormProps) => {
  const uploads = useImageUploads();
  const createListing = useCreateListing();

  // Photos live outside the schema — they are uploaded, not typed — so their
  // error is held here and rendered through the same FieldError as every other
  // field, rather than thrown at a toast the user has to remember.
  const [photoError, setPhotoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ListingValues>({
    resolver: standardSchemaResolver(listingSchema),
    mode: "onBlur",
    defaultValues: { title: "", description: "", price: "", city: "" },
  });

  const photoCount = uploads.images.length;
  const { failedCount } = uploads;

  // Adding or retrying a photo answers whatever the error was complaining about.
  useEffect(() => {
    if (photoCount > 0 && failedCount === 0) setPhotoError(null);
  }, [photoCount, failedCount]);

  const title = watch("title") ?? "";
  const description = watch("description") ?? "";

  const onSubmit = async (values: ListingValues) => {
    setPhotoError(null);

    // The photos started uploading the moment they were picked, so this usually
    // resolves instantly — it only waits if the user beat the last PUT here.
    const { keys, failed } = await uploads.settle();

    if (failed > 0) {
      setPhotoError("Some photos didn't upload. Retry or remove them, then post again.");
      return;
    }

    if (keys.length === 0) {
      setPhotoError("Add at least one photo — a listing can't be posted without one.");
      return;
    }

    try {
      await createListing.mutateAsync({
        title: values.title.trim(),
        description: values.description.trim(),
        city: values.city.trim(),
        // Prices are stored in paise everywhere; the field is in rupees.
        price: Math.round(Number(values.price) * 100),
        imageKeys: keys,
      });

      toast.success("Listing posted", {
        description: "Your photos are being processed and will appear shortly.",
      });

      reset();
      // The previews were only ever local; the listing now points at R2.
      uploads.reset();

      onSuccess?.();
    } catch (error) {
      if (!(error instanceof ApiError)) {
        setError("root", { message: "Something went wrong. Please try again." });
        return;
      }

      if (error.status === 422 && error.field) {
        const field = error.field as keyof ListingValues;
        if (FIELD_ERRORS.has(field)) {
          setError(field, { message: stripFieldPrefix(error.message, error.field) });
          return;
        }
        // image_keys and anything else has no input to point at.
        setPhotoError(stripFieldPrefix(error.message, error.field));
        return;
      }

      setError("root", { message: error.message });
    }
  };

  const handleCancel = () => {
    reset();
    uploads.reset();
    setPhotoError(null);
    onCancel?.();
  };

  const isPosting = isSubmitting || createListing.isPending;
  const isBusy = isPosting || uploads.isUploading;

  const status = (() => {
    if (photoCount === 0) return "Photos upload as soon as you pick them.";
    if (uploads.isUploading) return `Uploading ${photoCount - uploads.uploadedCount - failedCount} of ${photoCount}…`;
    if (failedCount > 0)
      return `${failedCount} photo${failedCount === 1 ? "" : "s"} failed — retry or remove.`;
    return `${uploads.uploadedCount} of ${photoCount} photo${photoCount === 1 ? "" : "s"} uploaded.`;
  })();

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      // min-h-0 is what lets the body below actually scroll instead of pushing
      // the footer past the bottom of the dialog.
      className="flex min-h-0 w-full flex-1 flex-col"
    >
      <header className="shrink-0 border-b px-5 py-4 pe-14 sm:px-6 sm:pe-14">
        <h2 className="font-heading text-base font-medium text-foreground">Post a listing</h2>
        <p className="text-muted-foreground mt-0.5 text-sm">
          Add your photos first — the rest takes a minute.
        </p>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-6">
        {errors.root && (
          <div
            role="alert"
            className="border-destructive/40 bg-destructive/5 mb-5 flex items-start gap-3 rounded-2xl border p-4"
          >
            <CircleAlert className="text-destructive mt-0.5 size-4 shrink-0" />
            <p className="text-sm">{errors.root.message}</p>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 md:gap-8">
          {/* Photos first in the DOM, so the single-column layout puts them at
              the top on a phone and the two-column one puts them on the left. */}
          <section aria-labelledby="photos-heading" className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <h3 id="photos-heading" className="text-sm font-medium">
                Photos
              </h3>
              <span className="text-muted-foreground text-xs tabular-nums">
                {photoCount}/{MAX_IMAGES}
              </span>
            </div>

            <ImageUploader
              value={uploads.images}
              onAdd={uploads.add}
              onRemove={uploads.remove}
              onRetry={uploads.retry}
              onReorder={uploads.reorder}
              maxFiles={MAX_IMAGES}
              maxSize={MAX_IMAGE_BYTES}
              accept={ACCEPTED_TYPES}
            />

            {photoError && <FieldError>{photoError}</FieldError>}
          </section>

          <section aria-labelledby="details-heading" className="flex flex-col gap-4">
            <h3 id="details-heading" className="text-sm font-medium">
              Details
            </h3>

            <Field data-invalid={Boolean(errors.title)}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="title">Title</FieldLabel>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {title.length}/{TITLE_MAX}
                </span>
              </div>
              <Input
                id="title"
                type="text"
                maxLength={TITLE_MAX}
                placeholder="e.g. Sony WH-1000XM4 wireless headphones"
                aria-invalid={Boolean(errors.title)}
                className="dark:bg-background h-10 shadow-xs"
                {...register("title")}
              />
              <FieldError errors={errors.title ? [errors.title] : undefined} />
            </Field>

            <Field data-invalid={Boolean(errors.description)}>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel htmlFor="description">Description</FieldLabel>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {description.length}/{DESCRIPTION_MAX}
                </span>
              </div>
              <textarea
                id="description"
                rows={4}
                maxLength={DESCRIPTION_MAX}
                placeholder="Condition, age, what's included, why you're selling…"
                aria-invalid={Boolean(errors.description)}
                className={cn(
                  "dark:bg-background bg-input/50 min-h-24 w-full resize-y rounded-2xl border",
                  "border-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow]",
                  "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30",
                  "focus-visible:ring-3 md:text-sm",
                  "aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-3",
                  "dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
                )}
                {...register("description")}
              />
              <FieldError errors={errors.description ? [errors.description] : undefined} />
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field data-invalid={Boolean(errors.price)}>
                <FieldLabel htmlFor="price">Price</FieldLabel>
                <div className="relative">
                  <span
                    aria-hidden="true"
                    className="text-muted-foreground pointer-events-none absolute inset-y-0 start-3.5 flex items-center text-sm"
                  >
                    ₹
                  </span>
                  <Input
                    id="price"
                    type="text"
                    inputMode="decimal"
                    placeholder="1200"
                    aria-invalid={Boolean(errors.price)}
                    className="dark:bg-background h-10 ps-7 shadow-xs"
                    {...register("price")}
                  />
                </div>
                <FieldError errors={errors.price ? [errors.price] : undefined} />
              </Field>

              <Field data-invalid={Boolean(errors.city)}>
                <FieldLabel htmlFor="city">City</FieldLabel>
                <Input
                  id="city"
                  type="text"
                  autoComplete="address-level2"
                  placeholder="Bangalore"
                  aria-invalid={Boolean(errors.city)}
                  className="dark:bg-background h-10 shadow-xs"
                  {...register("city")}
                />
                <FieldError errors={errors.city ? [errors.city] : undefined} />
              </Field>
            </div>
          </section>
        </div>
      </div>

      <footer className="bg-background/80 flex shrink-0 flex-col gap-3 border-t px-5 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p
          className={cn(
            "text-sm",
            failedCount > 0 ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {status}
        </p>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isPosting}
            className="h-10 flex-1 cursor-pointer rounded-lg shadow-xs sm:h-9 sm:flex-none"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isBusy}
            className="h-10 flex-1 cursor-pointer rounded-lg hover:bg-primary/80 sm:h-9 sm:flex-none"
          >
            {isBusy && <Loader2 className="size-4 animate-spin" />}
            {uploads.isUploading ? "Uploading photos…" : isPosting ? "Posting…" : "Post Listing"}
          </Button>
        </div>
      </footer>
    </form>
  );
};

export default ListingForm;
