import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

/* Three deliberate departures from the stock shadcn base string.

   `outline-none` is gone, so the one ring defined in globals.css applies here
   like it does to every other control. `transition-all` is now
   `transition-colors`: `all` includes `outline`, so the ring animated out of the
   browser's default `outline-style: auto` and rendered as a white 3px ring —
   invisible on a green button in a white header.

   And the radius is `rounded-full` rather than `rounded-lg`. Every button in the
   product was already overriding it to a pill; making it the default removes two
   dozen copies of that override and, more importantly, means a button added
   tomorrow matches the ones shipped today without anyone having to remember. */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-transparent bg-clip-padding text-sm font-semibold whitespace-nowrap transition-colors select-none focus-visible:border-ring active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        /* Hover darkens to `brand-stronger` instead of fading `primary` to 80%.
           A translucent green over a white card reads as *disabled*, which is the
           opposite of what a hover state is for. In dark mode the same token
           steps lighter, which is the correct direction there. */
        default: "bg-primary text-primary-foreground hover:bg-brand-stronger",
        outline:
          "border-border bg-transparent hover:bg-accent hover:text-foreground aria-expanded:bg-accent dark:border-input dark:hover:bg-muted",
        secondary:
          "bg-muted text-foreground hover:bg-accent aria-expanded:bg-accent",
        ghost:
          "hover:bg-accent hover:text-foreground aria-expanded:bg-accent dark:hover:bg-muted",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 dark:bg-destructive/20 dark:hover:bg-destructive/30",
        link: "text-link underline-offset-4 hover:underline",
      },
      /* Bumped one step across the board. shadcn's 32px default is a desktop-only
         target; 36px is the smallest row that survives a thumb, and the sizes
         below it are reserved for controls that sit inside dense rows. */
      size: {
        default:
          "h-9 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
        xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1 px-3 text-[0.8rem] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 gap-2 px-5 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4",
        icon: "size-9",
        "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
