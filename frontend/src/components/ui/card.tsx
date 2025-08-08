import * as React from "react"
import { cn } from "../../lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function Card({ className, children, hover = true, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl",
        "bg-[var(--gm-white)] border border-[var(--color-border)]",
        "shadow-[0_4px_20px_rgba(0,0,0,0.05)]",
        hover && "hover-lift",
        "transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pt-4 pb-2", className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn("text-2xl font-bold", className)} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("px-5 pb-5", className)} {...props}>
      {children}
    </div>
  )}


