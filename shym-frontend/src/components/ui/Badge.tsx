import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "accent" | "destructive" | "outline" | "muted" | "pending" | "confirmed" | "completed" | "ready";
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const baseClass = "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variants = {
    default: "bg-[#FAE0DB] text-[#C93B25] border border-[#FAE0DB]",
    secondary: "bg-[#EEF4F1] text-[#4A7C59] border border-[#EEF4F1]",
    accent: "bg-[#FEF3E8] text-[#D4854A] border border-[#FEF3E8]",
    destructive: "bg-[#FAE0DB] text-[#C93B25] border border-[#F5C5BB]",
    outline: "border border-[#E8E4DE] text-[#2D2D2D] bg-transparent",
    muted: "bg-[#F0EDE8] text-[#7A7065] border border-[#F0EDE8]",
    pending: "bg-[#FEF3E8] text-[#D4854A] border border-[#FDDBB4]",
    confirmed: "bg-[#EEF4F1] text-[#4A7C59] border border-[#C0DACC]",
    completed: "bg-[#E8F5EF] text-[#2E7D4F] border border-[#B3D9C5]",
    ready: "bg-[#EEF4F1] text-[#4A7C59] border border-[#C0DACC]",
  };

  return (
    <div className={cn(baseClass, variants[variant], className)} {...props} />
  )
}

export { Badge }
