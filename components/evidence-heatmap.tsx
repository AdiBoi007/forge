"use client"

import { useMemo } from "react"
import type { CandidateAnalysis } from "@/lib/scoring"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface EvidenceHeatmapProps {
  candidate: CandidateAnalysis
  className?: string
}

const PROOF_TIERS = ["owned_artifact", "linked_artifact", "third_party", "claim_only"] as const
const TIER_LABELS: Record<string, string> = {
  owned_artifact: "Owned",
  linked_artifact: "Linked",
  third_party: "3rd Party",
  claim_only: "Claim",
}

const TIER_COLORS: Record<string, { bg: string; text: string }> = {
  owned_artifact: { bg: "bg-success", text: "text-success" },
  linked_artifact: { bg: "bg-primary", text: "text-primary" },
  third_party: { bg: "bg-warning", text: "text-warning" },
  claim_only: { bg: "bg-destructive/50", text: "text-destructive" },
}

function formatScore(value: number | undefined | null): number {
  if (value === undefined || value === null || isNaN(value)) return 0
  // If value > 1, assume it's already 0-100; otherwise multiply by 100
  const normalized = value > 1 ? value : value * 100
  return Math.round(Math.max(0, Math.min(100, normalized)))
}

export function EvidenceHeatmap({ candidate, className }: EvidenceHeatmapProps) {
  const skills = candidate.capability.skills.slice(0, 8)

  // Build heatmap data: for each skill, count evidence by proof tier
  const heatmapData = useMemo(() => {
    return skills.map((skill) => {
      const tierCounts: Record<string, number> = {
        owned_artifact: 0,
        linked_artifact: 0,
        third_party: 0,
        claim_only: 0,
      }

      // Count evidence matching this skill
      candidate.evidence
        .filter((e) => e.skill === skill.name)
        .forEach((e) => {
          const tier = e.proofTier || "claim_only"
          if (tier in tierCounts) {
            tierCounts[tier]++
          }
        })

      // If no evidence found, mark as claim_only based on status
      const totalEvidence = Object.values(tierCounts).reduce((a, b) => a + b, 0)
      if (totalEvidence === 0) {
        if (skill.status === "Proven") {
          tierCounts.owned_artifact = 1
        } else if (skill.status === "Weak") {
          tierCounts.claim_only = 1
        } else {
          tierCounts.claim_only = 0 // Missing - no evidence
        }
      }

      return {
        skill: skill.name,
        score: skill.score,
        status: skill.status,
        proofTier: skill.proofTier || "claim_only",
        ...tierCounts,
      }
    })
  }, [skills, candidate.evidence])

  const getIntensity = (count: number): string => {
    if (count === 0) return "opacity-10"
    if (count === 1) return "opacity-40"
    if (count === 2) return "opacity-70"
    return "opacity-100"
  }

  return (
    <div className={cn("bg-surface rounded-xl p-4 border-2 border-border", className)}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-black text-foreground">Evidence Heatmap</h4>
        <div className="flex items-center gap-3 text-xs">
          {PROOF_TIERS.map((tier) => (
            <div key={tier} className="flex items-center gap-1.5">
              <div className={cn("h-3 w-3 rounded", TIER_COLORS[tier].bg)} />
              <span className="text-muted-foreground font-medium">{TIER_LABELS[tier]}</span>
            </div>
          ))}
        </div>
      </div>

      <TooltipProvider>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="text-left text-xs font-bold text-muted-foreground pb-2 pr-4">Skill</th>
                {PROOF_TIERS.map((tier) => (
                  <th key={tier} className="text-center text-xs font-bold text-muted-foreground pb-2 px-2">
                    {TIER_LABELS[tier]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {heatmapData.map((row) => (
                <tr key={row.skill} className="border-t border-border/30">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{row.skill}</span>
                      <span
                        className={cn(
                          "text-xs px-1.5 py-0.5 rounded font-medium",
                          row.status === "Proven"
                            ? "bg-success/20 text-success"
                            : row.status === "Weak"
                              ? "bg-warning/20 text-warning"
                              : "bg-destructive/20 text-destructive",
                        )}
                      >
                        {formatScore(row.score)}%
                      </span>
                    </div>
                  </td>
                  {PROOF_TIERS.map((tier) => {
                    const count = row[tier] as number
                    return (
                      <td key={tier} className="py-2 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              className={cn(
                                "h-8 w-full rounded cursor-help transition-all",
                                TIER_COLORS[tier].bg,
                                getIntensity(count),
                                count > 0 && "hover:ring-2 hover:ring-white/30",
                              )}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="font-bold">
                              {row.skill} - {TIER_LABELS[tier]}
                            </p>
                            <p className="text-xs">
                              {count === 0
                                ? "No evidence at this tier"
                                : `${count} piece${count > 1 ? "s" : ""} of evidence`}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TooltipProvider>

      <div className="mt-4 pt-3 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          <span className="font-bold text-foreground">Reading the heatmap:</span> Darker cells = more evidence. Owned
          artifacts (code you wrote) are strongest proof. Claim-only evidence cannot pass the tau gate alone.
        </p>
      </div>
    </div>
  )
}
