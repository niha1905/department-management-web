import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-300 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:shadow-md",
  {
    variants: {
      variant: {
        // Primary CTA: Neon yellow with slight darken on hover
        default: "bg-[var(--gm-yellow)] text-[var(--color-primary-foreground)] hover:bg-[#D5E536]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-[var(--gm-aqua)] hover:text-[var(--color-accent-foreground)]",
        secondary:
          "bg-[var(--gm-aqua)] text-[var(--color-secondary-foreground)] hover:bg-[#5FFFF3]",
        ghost: "hover:bg-[color:rgba(63,255,224,0.12)] hover:text-[color:#05343a]",
        link: "text-[var(--gm-aqua)] underline-offset-4 hover:underline",
        gradient: "bg-[var(--gm-dark)] text-white hover:[background-color:rgba(3,3,19,0.92)]",
      },
      size: {
        default: "h-10 px-5",
        sm: "h-9 rounded-lg px-3",
        lg: "h-12 rounded-3xl px-8",
        icon: "h-10 w-10 rounded-full",
      },
      shape: {
        rounded: "rounded-2xl",
        pill: "rounded-full",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "rounded",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, shape, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, shape, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants } 