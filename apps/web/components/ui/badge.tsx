import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary-500 text-white",
        secondary: "border-transparent bg-muted text-fg-DEFAULT",
        destructive: "border-transparent bg-destructive text-white",
        outline: "text-fg-DEFAULT",
        risk_critical: "border-red-200 bg-red-50 text-risk-critical",
        risk_high: "border-amber-200 bg-amber-50 text-risk-high",
        risk_medium: "border-yellow-200 bg-yellow-50 text-risk-medium",
        risk_low: "border-green-200 bg-green-50 text-risk-low",
        risk_excellent: "border-teal-200 bg-teal-50 text-risk-excellent",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
