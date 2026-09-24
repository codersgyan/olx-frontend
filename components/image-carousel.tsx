"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface CarouselContentProps {
  images: string[];
  alt: string;
  currentIndex: number;
  onPrev: (e?: React.MouseEvent) => void;
  onNext: (e?: React.MouseEvent) => void;
  arrows: boolean;
  size: "sm" | "lg";
  className?: string;
  imageClassName?: string;
}

function CarouselContent({
  images,
  alt,
  currentIndex,
  onPrev,
  onNext,
  arrows,
  size,
  className,
  imageClassName,
}: CarouselContentProps) {
  const hasImages = images.length > 0;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md",
        size === "lg" && "aspect-square w-full",
        className,
      )}
    >
      <div
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {hasImages ? (
          images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${alt} ${index + 1}`}
              className={cn(
                "h-full w-full flex-shrink-0 object-cover",
                imageClassName,
              )}
            />
          ))
        ) : (
          <div className="h-full w-full flex-shrink-0 bg-muted" />
        )}
      </div>

      {arrows && hasImages && images.length > 1 && (
        <>
          <button
            type="button"
            onClick={onPrev}
            className="absolute left-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors duration-300 hover:bg-black/70"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onNext}
            className="absolute right-2 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition-colors duration-300 hover:bg-black/70"
            aria-label="Next image"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      )}
    </div>
  );
}

interface ImageCarouselProps {
  images: string[];
  alt: string;
  className?: string;
  imageClassName?: string;
  showArrows?: boolean;
  enableDialog?: boolean;
  dialogClassName?: string;
}

export function ImageCarousel({
  images,
  alt,
  className,
  imageClassName,
  showArrows = true,
  enableDialog = false,
  dialogClassName,
}: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dialogOpen, setDialogOpen] = useState(false);

  const showPrev = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const showNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  if (enableDialog) {
    return (
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger
          render={
            <button
              type="button"
              className={cn(
                "block cursor-pointer overflow-hidden rounded-md text-left",
                className,
              )}
              aria-label={`View ${alt} images`}
            >
              <CarouselContent
                images={images}
                alt={alt}
                currentIndex={currentIndex}
                onPrev={showPrev}
                onNext={showNext}
                arrows={false}
                size="sm"
                className={className}
                imageClassName={imageClassName}
              />
            </button>
          }
        />
        <DialogContent
          className={cn(
            "flex max-h-[90vh] max-w-3xl items-center justify-center gap-0 border-0 bg-transparent p-0 shadow-none",
            dialogClassName,
          )}
        >
          <DialogTitle className="sr-only">{alt} images</DialogTitle>
          <CarouselContent
            images={images}
            alt={alt}
            currentIndex={currentIndex}
            onPrev={showPrev}
            onNext={showNext}
            arrows={true}
            size="lg"
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <CarouselContent
      images={images}
      alt={alt}
      currentIndex={currentIndex}
      onPrev={showPrev}
      onNext={showNext}
      arrows={showArrows}
      size="sm"
      className={className}
      imageClassName={imageClassName}
    />
  );
}
