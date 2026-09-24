import { z } from "zod";

/**
 * Mirrors what olx-api enforces (internal/handlers/imagekeys.go, uploads.go).
 * Duplicated here so the browser rejects a bad file before it is uploaded, not
 * after — but the server's copy is the one that counts.
 */
export const MAX_IMAGES = 8;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp";

/**
 * Title and description are `TEXT` columns with no server-side limit, so these
 * two are ours alone — a cap that keeps a listing card readable rather than a
 * constraint the API would reject.
 */
export const TITLE_MAX = 80;
export const DESCRIPTION_MAX = 600;

/** Ten million rupees. Past this, it's a typo far more often than a listing. */
const PRICE_MAX_RUPEES = 10_000_000;

export const listingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(4, "Give your listing a clear title")
    .max(TITLE_MAX, `Keep the title under ${TITLE_MAX} characters`),
  // Required, because the API requires it (CreateListingRequest.Validate).
  // Leaving it optional here just turns an empty box into a 422.
  description: z
    .string()
    .trim()
    .min(10, "Describe the item in a sentence or two")
    .max(DESCRIPTION_MAX, `Keep the description under ${DESCRIPTION_MAX} characters`),
  // Kept as a string all the way to submit: `valueAsNumber` turns an empty
  // input into NaN, which reads as "not a number" rather than "you left this
  // blank". The rupees → paise conversion happens once, in the submit handler.
  price: z
    .string()
    .trim()
    .min(1, "Enter a price")
    .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Enter an amount like 1200 or 1200.50")
    .refine((value) => Number(value) > 0, "Price must be more than ₹0")
    .refine(
      (value) => Number(value) <= PRICE_MAX_RUPEES,
      `That looks too high — the most you can ask is ₹${PRICE_MAX_RUPEES.toLocaleString("en-IN")}`,
    ),
  // Also required by the API. The old form sent the literal "unknown" when this
  // was blank, which wrote a fake city into Postgres.
  city: z.string().trim().min(2, "Where is the item?"),
});

export type ListingValues = z.infer<typeof listingSchema>;
