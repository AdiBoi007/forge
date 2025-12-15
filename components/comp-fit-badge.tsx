"use client"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { CompFit } from "@/lib/compensation"

interface CompFitBadgeProps {
  compFit: CompFit
}

export function CompFitBadge({ compFit }: CompFitBadgeProps) {
  const statusStyles = {
    "in-band": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    "slightly-above": "bg-amber-500/20 text-amber-400 border-amber-500/30",
    "way-above": "bg-rose-500/20 text-rose-400 border-rose-500/30",
    "slightly-below": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    "way-below": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    unknown: "bg-muted text-muted-foreground border-border",
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className={`cursor-help ${statusStyles[compFit.status]}`}>
            <span className="mr-1">{compFit.icon}</span>
            {compFit.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <p className="text-sm">{compFit.note}</p>
          {compFit.xsMultiplier !== 1 && (
            <p className="text-xs text-muted-foreground mt-1">XS adjustment: ×{compFit.xsMultiplier.toFixed(2)}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
