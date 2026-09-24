"use client";

import { useRef } from "react";
import type { ReactNode } from "react";
import {
  motion,
  useInView,
  type Variants,
} from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { LayoutGrid, Plus } from "lucide-react";

interface EmptyStateAction {
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  primaryAction?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  illustration?: ReactNode;
}

const EASE = [0.16, 1, 0.3, 1] as const;

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

const ListingsEmptyIllustration = () => (
  <div className="flex size-24 items-center justify-center rounded-full bg-muted text-muted-foreground">
    <LayoutGrid className="size-10" />
  </div>
);

const EmptyState = ({
  title = "No listings yet",
  description = "You haven't posted any listings. Create your first listing to start selling.",
  primaryAction = {
    label: "Create listing",
    icon: <Plus className="size-4" />,
  },
  secondaryAction,
  illustration = <ListingsEmptyIllustration />,
}: EmptyStateProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <div
      ref={ref}
      className="flex w-full items-center justify-center px-4 py-10 sm:py-16"
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "show" : "hidden"}
        className="flex w-92 max-w-full flex-col items-center gap-6"
      >
        <Empty className="gap-4 border-none p-0">
          <EmptyHeader className="gap-4">
            <motion.div variants={itemVariants}>
              <EmptyMedia variant="default" className="mb-0">
                {illustration}
              </EmptyMedia>
            </motion.div>
            <motion.div
              variants={itemVariants}
              className="flex flex-col items-center gap-0.5"
            >
              <EmptyTitle className="text-lg font-medium text-foreground">
                {title}
              </EmptyTitle>
              <EmptyDescription className="text-center">
                {description}
              </EmptyDescription>
            </motion.div>
          </EmptyHeader>
          <EmptyContent>
            <div className="flex items-start gap-3">
              {primaryAction && (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="inline-flex"
                >
                  {primaryAction.href ? (
                    <Button
                      size="lg"
                      render={<a href={primaryAction.href} />}
                      className="cursor-pointer px-4 hover:bg-primary/80"
                    >
                      {primaryAction.icon}
                      {primaryAction.label}
                    </Button>
                  ) : (
                    <Button
                      size="lg"
                      onClick={primaryAction.onClick}
                      className="cursor-pointer px-4 hover:bg-primary/80"
                    >
                      {primaryAction.icon}
                      {primaryAction.label}
                    </Button>
                  )}
                </motion.div>
              )}
              {secondaryAction && (
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.2, ease: EASE }}
                  className="inline-flex"
                >
                  {secondaryAction.href ? (
                    <Button
                      variant="outline"
                      size="lg"
                      render={<a href={secondaryAction.href} />}
                      className="cursor-pointer px-4"
                    >
                      {secondaryAction.icon}
                      {secondaryAction.label}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={secondaryAction.onClick}
                      className="cursor-pointer px-4"
                    >
                      {secondaryAction.icon}
                      {secondaryAction.label}
                    </Button>
                  )}
                </motion.div>
              )}
            </div>
          </EmptyContent>
        </Empty>
      </motion.div>
    </div>
  );
};

export default EmptyState;
