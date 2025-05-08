"use client"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { SidebarLeftIcon } from "./icons"
import { Button } from "./ui/button"

interface SidebarToggleProps {
  className?: string
  onToggle: () => void
}

export function SidebarToggle({ className, onToggle }: SidebarToggleProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button onClick={onToggle} variant="outline" className="md:px-2 md:h-fit">
          <SidebarLeftIcon size={16} />
        </Button>
      </TooltipTrigger>
      <TooltipContent align="start">Toggle Sidebar</TooltipContent>
    </Tooltip>
  )
}
