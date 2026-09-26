import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

// Calcio Classics (Skill cc-design §6): eckig, Versalien, keine Hover-Sprünge.
// `hero` und `bid` bleiben als Aliase für bestehende Aufrufe (Aufräumen in CC-R8).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none border border-transparent font-body text-xs font-medium uppercase tracking-[0.14em] ring-offset-background transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-40 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border-primary bg-primary text-primary-foreground hover:border-nero hover:bg-nero hover:text-avorio",
        dark: "border-nero bg-nero text-avorio hover:border-primary hover:bg-primary hover:text-primary-foreground",
        light: "border-avorio bg-avorio text-nero hover:border-carta hover:bg-carta",
        destructive: "border-destructive bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border-nero bg-transparent text-foreground hover:bg-nero hover:text-avorio",
        secondary: "border-secondary bg-secondary text-secondary-foreground hover:border-nero",
        ghost: "hover:bg-secondary",
        link: "h-auto px-0 text-foreground underline decoration-1 underline-offset-4 hover:text-primary",
        hero: "border-primary bg-primary text-primary-foreground hover:border-nero hover:bg-nero hover:text-avorio",
        bid: "border-nero bg-nero text-avorio hover:border-primary hover:bg-primary hover:text-primary-foreground",
      },
      size: {
        default: "h-11 px-6",
        sm: "h-9 px-4",
        lg: "h-[52px] px-7",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
