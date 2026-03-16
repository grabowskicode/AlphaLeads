import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-3xl text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "border border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 backdrop-blur-2xl text-foreground hover:scale-[1.02] hover:bg-white/70 dark:hover:bg-black/70 active:scale-[0.98]",
        destructive:
          "border border-red-500/40 bg-red-500/80 backdrop-blur-2xl text-destructive-foreground hover:scale-[1.02] hover:bg-red-600/80 active:scale-[0.98]",
        outline:
"border border-slate-200 dark:border-white/20 bg-white/60 dark:bg-black/60 backdrop-blur-2xl text-foreground hover:scale-[1.02] hover:bg-muted/50 dark:hover:bg-black/70 active:scale-[0.98]",
        secondary:
          "border border-slate-200 dark:border-white/20 bg-white/70 dark:bg-black/70 backdrop-blur-2xl text-foreground hover:scale-[1.02] hover:bg-white/80 dark:hover:bg-black/80 active:scale-[0.98]",
        ghost: "hover:bg-white/40 dark:hover:bg-black/40 hover:text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
