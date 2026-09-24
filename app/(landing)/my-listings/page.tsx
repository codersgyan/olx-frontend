"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PackageOpen } from "lucide-react";
import ListingsDatatable from "@/components/shadcn-space/blocks/datatable-01/datatable";
import ListingForm from "@/components/shadcn-space/blocks/forms-01/profile-form";
import EmptyState from "@/components/shadcn-space/blocks/empty-state-02/empty-state";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useMe } from "@/hooks/use-auth";
import { useDeleteListing, useMyListings } from "@/hooks/use-listings";
import { APP_ROUTES } from "@/lib/constants";

export default function MyListingsPage() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const { isSignedIn, isResolved } = useMe();
  const { data: listings, isPending, isError, error } = useMyListings();
  const deleteListing = useDeleteListing();

  // Only redirect once auth is actually known. Acting on `!isSignedIn` before
  // the store rehydrates would bounce every signed-in user to the login page on
  // a hard refresh.
  useEffect(() => {
    if (isResolved && !isSignedIn) router.replace(APP_ROUTES.AUTH.SIGN_IN);
  }, [isResolved, isSignedIn, router]);

  // `mutateAsync`, not `mutate`: the confirm dialog awaits this to know when to
  // close, and the hook's `onSuccess` awaits the refetch, so the promise settles
  // only once the row is really gone. It rejects on failure, hence the catch —
  // an escaping rejection would land in the console instead of on screen.
  const handleDelete = async (id: string) => {
    try {
      await deleteListing.mutateAsync(id);
      toast.success("Listing deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete listing");
    }
  };

  if (!isResolved || !isSignedIn || isPending) {
    return (
      <main className="mx-auto min-h-[60vh] max-w-5xl px-4 py-8 sm:py-16 lg:py-20">
        <Skeleton className="mb-6 h-9 w-48" />
        <Skeleton className="h-96 w-full rounded-md" />
      </main>
    );
  }

  if (isError) {
    return (
      <main className="min-h-[60vh]">
        <EmptyState
          title="Couldn't load your listings"
          description={error.message}
          primaryAction={{
            label: "Try again",
            onClick: () => router.refresh(),
          }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-[60vh]">
      {listings.length > 0 ? (
        <ListingsDatatable
          listings={listings}
          onPost={() => setOpen(true)}
          onDelete={handleDelete}
          deletingId={
            deleteListing.isPending ? (deleteListing.variables ?? null) : null
          }
        />
      ) : (
        // Same treatment as the "No listings found" state on /listing, so the
        // two empty surfaces read as one design rather than two.
        <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-16 lg:py-20">
          <Empty className="border-border bg-card/50 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <PackageOpen />
              </EmptyMedia>
              <EmptyTitle>No listings yet</EmptyTitle>
              <EmptyDescription>
                You haven&apos;t posted any listings. Create your first listing to
                start selling.
              </EmptyDescription>
            </EmptyHeader>
            <EmptyContent>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => setOpen(true)}
              >
                Post listing
              </Button>
            </EmptyContent>
          </Empty>
        </section>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        {/* The form owns its own padding and scrolling: it renders a fixed
            header and footer around a scrolling body, which is what keeps the
            Post button reachable on a phone. svh, not vh, so mobile browser
            chrome doesn't clip the footer. */}
        <DialogContent className="flex max-h-[92svh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
          <DialogTitle className="sr-only">Post a listing</DialogTitle>
          <ListingForm
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </main>
  );
}
