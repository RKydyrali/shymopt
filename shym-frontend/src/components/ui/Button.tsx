import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "subtle";
  size?: "default" | "sm" | "lg" | "xl" | "icon" | "icon-sm";
  asChild?: boolean; // Kept for compatibility but ignored, uses <button> anyway
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", asChild = false, ...props }, ref) => {
    const baseClass = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";
    
    const variants = {
      default: "bg-[#E04F33] text-white shadow-sm hover:bg-[#C93B25] active:scale-[0.98]",
      destructive: "bg-[#C93B25] text-white shadow-sm hover:bg-[#A83020] active:scale-[0.98]",
      outline: "border border-[#2D2D2D]/20 bg-transparent text-[#2D2D2D] hover:border-[#2D2D2D]/40 hover:bg-[#F0EDE8] active:scale-[0.98]",
      secondary: "bg-[#4A7C59] text-white shadow-sm hover:bg-[#3A6347] active:scale-[0.98]",
      ghost: "text-[#2D2D2D]/70 hover:bg-[#F0EDE8] hover:text-[#2D2D2D] active:scale-[0.98]",
      link: "text-[#E04F33] underline-offset-4 hover:underline p-0 h-auto",
      subtle: "bg-[#F0EDE8] text-[#2D2D2D] hover:bg-[#E8E4DE] active:scale-[0.98]",
    };

    const sizes = {
      default: "h-10 px-5 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-xl px-8 text-base font-semibold",
      xl: "h-14 rounded-xl px-10 text-base font-semibold",
      icon: "h-10 w-10",
      "icon-sm": "h-8 w-8",
    };

    return (
      <button
        className={cn(baseClass, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
