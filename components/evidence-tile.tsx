"use client"

import { ExternalLink, GitBranch, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface EvidenceTileProps {
  repo: string
  description: string
  commits: number
  ownership: string
  language?: string
}

export function EvidenceTile({ repo, description, commits, ownership }: EvidenceTileProps) {
  return (
    <a
      href={`https://github.com/${repo}`}
      target="_blank"
      rel="noopener noreferrer"
      className="group block bg-surface border border-border rounded-lg p-4 hover:border-primary/40 hover:bg-surface-elevated transition-all"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <GitBranch className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="font-mono text-sm text-foreground truncate group-hover:text-primary transition-colors">
            {repo}
          </span>
        </div>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{description}</p>

      <div className="flex items-center gap-4 text-[11px]">
        <span className="text-muted-foreground">
          <Clock className="h-3 w-3 inline mr-1" />
          {commits} commits
        </span>
        <span
          className={cn(
            "px-1.5 py-0.5 rounded",
            ownership === "Primary owner" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground",
          )}
        >
          {ownership}
        </span>
      </div>
    </a>
  )
}
