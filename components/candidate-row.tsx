"use client"

import { cn } from "@/lib/utils"
import { AlertTriangle, CheckCircle, Shield } from "lucide-react"
import type { CandidateResult } from "@/lib/mock-data"

interface CandidateRowProps {
  candidate: CandidateResult
  rank: number
  isSelected: boolean
  onClick: () => void
}

export function CandidateRow({ candidate, rank, isSelected, onClick }: CandidateRowProps) {
  const verdictConfig = {
    "Strong Hire": {
      color: "text-success",
      bg: "bg-success/10",
      border: "border-success/20",
      icon: CheckCircle,
    },
    Possible: {
      color: "text-warning",
      bg: "bg-warning/10",
      border: "border-warning/20",
      icon: Shield,
    },
    Risky: {
      color: "text-destructive",
      bg: "bg-destructive/10",
      border: "border-destructive/20",
      icon: AlertTriangle,
    },
  }

  const config = verdictConfig[candidate.verdict]
  const Icon = config.icon
  const flagCount = candidate.explanation.flags.length

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full text-left bg-card border rounded-xl p-4 transition-all",
        isSelected ? "border-primary selected-glow" : "border-border hover:border-border/80 hover:bg-card/80",
      )}
    >
      <div className="flex items-center gap-4">
        {/* Rank */}
        <div
          className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center font-bold text-lg shrink-0",
            isSelected ? "bg-primary text-primary-foreground" : "bg-surface text-muted-foreground",
          )}
        >
          {rank}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-foreground truncate">{candidate.name}</h3>
            <div
              className={cn(
                "flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium",
                config.bg,
                config.color,
                config.border,
                "border",
              )}
            >
              <Icon className="h-3 w-3" />
              {candidate.verdict}
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span
              className={cn(
                "font-medium",
                candidate.capability.status === "Pass" ? "text-success" : "text-destructive",
              )}
            >
              {candidate.capability.status} · {Math.round(candidate.capability.score * 100)}%
            </span>
            <span className="text-muted-foreground">
              Context:{" "}
              {Math.round(
                candidate.context.teamwork.weighted +
                  candidate.context.communication.weighted +
                  candidate.context.adaptability.weighted +
                  candidate.context.ownership.weighted,
              )}
            </span>
            <span className="text-muted-foreground">
              Confidence: {Math.round(candidate.capability.confidence * 100)}%
            </span>
            {flagCount > 0 && (
              <span className="text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {flagCount} {flagCount === 1 ? "flag" : "flags"}
              </span>
            )}
          </div>
        </div>

        {/* Final Score */}
        <div className="text-right shrink-0">
          <div className={cn("text-2xl font-bold tabular-nums", isSelected ? "text-primary" : "text-foreground")}>
            {candidate.finalScore}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Score</div>
        </div>
      </div>
    </button>
  )
}
