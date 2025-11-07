import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-eloquia-text font-semibold tracking-tight transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-md hover:shadow-lg active:shadow-inner active:brightness-95 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "bg-[#2563eb] hover:bg-[#1d4ed8] text-[#fafafa] focus-visible:ring-blue-500",
        secondary: "bg-gray-100 hover:bg-gray-200 text-[#fafafa] dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-[#fafafa] focus-visible:ring-gray-500",
        danger: "bg-red-500 hover:bg-red-600 text-[#fafafa] dark:bg-red-600 dark:hover:bg-red-700 focus-visible:ring-red-500",
        destructive: "bg-red-500 hover:bg-red-600 text-[#fafafa] dark:bg-red-600 dark:hover:bg-red-700 focus-visible:ring-red-500",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground shadow-none hover:shadow-none",
        link: "text-primary underline-offset-4 hover:underline shadow-none hover:shadow-none",
      },
      size: {
        sm: "h-9 px-4 text-xs md:h-10 md:px-5 md:text-sm",
        default: "h-11 px-5 text-sm md:h-12 md:px-6 md:text-base",
        lg: "h-12 px-6 text-base md:h-14 md:px-8 md:text-lg",
        icon: "h-11 w-11 md:h-12 md:w-12",
      },
    },
    defaultVariants: {
      variant: "primary",
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
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
