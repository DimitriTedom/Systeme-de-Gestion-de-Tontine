import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-bold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm hover:shadow-md",
        secondary:
          "border-transparent bg-slate-100 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800",
        destructive:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 shadow-sm hover:shadow-md",
        outline: "text-foreground border-current",
        // Financial status variants
        paid:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm",
        pending:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm",
        late:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 shadow-sm",
        refunded:
          "border-transparent bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm",
        approved:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm",
        repaying:
          "border-transparent bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 shadow-sm",
        completed:
          "border-transparent bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 shadow-sm",
        defaulted:
          "border-transparent bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
