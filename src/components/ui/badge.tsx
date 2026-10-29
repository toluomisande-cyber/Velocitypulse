import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default:
          "border-hairline bg-surface-card text-ink",
        secondary:
          "border-hairline-soft bg-surface-soft text-body",
        coral:
          "border-transparent bg-primary text-on-primary font-semibold tracking-wider uppercase text-[11px]",
        success:
          "border-emerald-200 bg-emerald-50 text-emerald-800",
        destructive:
          "border-rose-200 bg-rose-50 text-error font-medium",
        outline:
          "border-hairline bg-transparent text-muted",
        teal:
          "border-teal-200 bg-teal-50 text-teal-800",
        dark:
          "border-surface-dark-elevated bg-surface-dark-soft text-on-dark text-[11px]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
