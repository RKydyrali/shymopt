import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl border border-[#E8E4DE] bg-white px-4 py-2 text-sm text-[#2D2D2D]",
          "placeholder:text-[#7A7065]",
          "shadow-[0_1px_3px_rgba(45,45,45,0.06)]",
          "transition-all duration-200",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E04F33]/30 focus-visible:border-[#E04F33]",
          "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F0EDE8]",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
