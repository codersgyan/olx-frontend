"use client";

import { useState } from "react";
import {
  createColumnHelper,
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, Plus, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn, formatPrice } from "@/lib/utils";
import { imageUrls, type Listing } from "@/lib/api/types";
import { ImageCarousel } from "@/components/image-carousel";

const statusColors: Record<string, string> = {
  ready: "bg-teal-400/10 text-teal-400 hover:bg-teal-400/10",
  processing: "bg-orange-400/10 text-orange-400 hover:bg-orange-400/10",
  rejected: "bg-red-500/10 text-red-500 hover:bg-red-500/10",
};

// What the API's status values mean to a seller looking at their own listings.
const statusLabels: Record<string, string> = {
  ready: "Active",
  processing: "Processing",
  rejected: "Rejected",
};

const columnHelper = createColumnHelper<Listing>();

interface ListingsDatatableProps {
  listings: Listing[];
  onPost?: () => void;
  onDelete?: (id: string) => void | Promise<void>;
  /** id of the listing whose delete is in flight, straight from the mutation. */
  deletingId?: string | null;
}

/**
 * Confirm-then-delete, held open for the whole round trip.
 *
 * The API deletes each image from R2 inside the request and the list refetches
 * before the mutation settles, so a delete takes seconds. Closing on click made
 * that look like nothing had happened until the row abruptly vanished — so the
 * dialog stays up, showing progress, and closes once the row is actually gone.
 */
const DeleteDialog = ({
  onDelete,
  title,
  isDeleting,
}: {
  onDelete: () => void | Promise<void>;
  title: string;
  isDeleting: boolean;
}) => {
  const [open, setOpen] = useState(false);

  const handleConfirm = async () => {
    // The caller reports failures itself (toast), so this resolves either way
    // and the dialog closes on success and error alike.
    await onDelete();
    setOpen(false);
  };

  return (
    <Dialog
      open={open}
      // Esc and backdrop presses must not strand a delete that is already in
      // flight: the request would finish with nothing on screen to explain it.
      onOpenChange={(next) => {
        if (!isDeleting) setOpen(next);
      }}
      disablePointerDismissal={isDeleting}
    >
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            aria-label="Delete listing"
            onClick={(e) => e.stopPropagation()}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md" showCloseButton={!isDeleting}>
        <DialogHeader>
          <DialogTitle>Delete listing?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{title}&quot;? This action
            cannot be undone.
          </DialogDescription>
        </DialogHeader>
        {isDeleting && (
          // Indeterminate: the API reports no percentage, and inventing one
          // would be a lie about how far along the delete is.
          <Progress
            value={null}
            trackClassName="h-1"
            aria-label="Deleting listing"
          />
        )}
        <DialogFooter className="gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isDeleting}
            onClick={handleConfirm}
          >
            {isDeleting && <Loader2 className="size-4 animate-spin" />}
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const ListingsDatatable = ({
  listings,
  onPost,
  onDelete,
  deletingId,
}: ListingsDatatableProps) => {
  const columns = [
    columnHelper.accessor("title", {
      header: () => <span>Listing</span>,
      cell: (info) => {
        const listing = info.row.original;
        return (
          <div className="flex items-center gap-4">
            <ImageCarousel
              images={imageUrls(listing)}
              alt={listing.title}
              showArrows={false}
              enableDialog
              className="h-16 w-16"
            />
            <div>
              <h6 className="text-base font-medium">{info.getValue()}</h6>
              <p className="text-sm text-muted-foreground capitalize">
                {listing.city}
              </p>
            </div>
          </div>
        );
      },
    }),
    columnHelper.accessor("city", {
      header: () => <span>City</span>,
      cell: (info) => (
        <span className="text-sm capitalize">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor("price", {
      header: () => <span>Price</span>,
      cell: (info) => (
        <span className="text-sm">{formatPrice(info.getValue())}</span>
      ),
    }),
    columnHelper.accessor("description", {
      header: () => <span>Description</span>,
      cell: (info) => (
        <span className="line-clamp-1 max-w-[200px] text-sm">
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("created_at", {
      header: () => <span>Posted</span>,
      cell: (info) => (
        <span className="text-sm">
          {new Date(info.getValue()).toLocaleDateString("en-IN")}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      header: () => <span>Status</span>,
      cell: (info) => {
        const status = info.getValue();
        return (
          <Badge
            className={`${statusColors[status] ?? statusColors.failed} border-0 capitalize shadow-none`}
          >
            {statusLabels[status] ?? status}
          </Badge>
        );
      },
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span>Actions</span>,
      cell: (info) => {
        const listing = info.row.original;
        return (
          <DeleteDialog
            title={listing.title}
            isDeleting={listing.id === deletingId}
            onDelete={() => onDelete?.(listing.id)}
          />
        );
      },
    }),
  ];

  const table = useReactTable({
    data: listings,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:py-16 lg:py-20">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-semibold">My Listings</h2>
        <div className="flex items-center gap-2">
          <Button
            onClick={onPost}
            className="inline-flex cursor-pointer items-center gap-2 hover:bg-primary/80"
          >
            <Plus size={15} />
            Post
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-md border border-border">
        <div className="overflow-x-auto">
          <Table className="min-w-full">
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="h-auto border-b border-border px-4 py-3 text-left text-base font-medium"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody className="divide-y divide-border">
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  aria-busy={row.original.id === deletingId}
                  className={cn(
                    "transition-opacity",
                    row.original.id === deletingId && "opacity-60",
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className="whitespace-nowrap px-4 py-5"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </section>
  );
};

export default ListingsDatatable;
