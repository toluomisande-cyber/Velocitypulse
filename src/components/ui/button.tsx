import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-on-primary hover:bg-primary-active active:bg-primary-active shadow-subtle",
        destructive:
          "bg-error text-white hover:opacity-90 shadow-subtle",
        outline:
          "border border-hairline bg-canvas text-ink hover:bg-surface-soft hover:border-hairline-soft",
        secondary:
          "bg-surface-card text-ink hover:bg-surface-cream-strong border border-hairline/60",
        darkElevated:
          "bg-surface-dark-elevated text-on-dark hover:bg-surface-dark-soft border border-surface-dark-elevated",
        ghost:
          "text-muted hover:text-ink hover:bg-surface-soft",
        link:
          "text-primary underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-8 rounded-sm px-3 text-xs",
        lg: "h-11 rounded-md px-7 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
