import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Calcio Classics: Badges sind eckige Etiketten in Versalien (Skill cc-design §6 „Tags“).
const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-none border px-[7px] py-1 font-body text-[10px] font-medium uppercase leading-none tracking-[0.14em] transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground",
        secondary: "border-nero bg-carta text-nero",
        destructive: "border-destructive bg-destructive text-destructive-foreground",
        outline: "border-nero bg-transparent text-foreground",
        tag: "border-current bg-transparent",
        "tag-rosso": "border-rosso bg-transparent text-rosso",
        "tag-verde": "border-verde bg-transparent text-verde",
        solid: "border-nero bg-nero text-avorio",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
