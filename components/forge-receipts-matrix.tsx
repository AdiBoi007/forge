"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Github,
  Globe,
  Quote,
} from "lucide-react"
import type { JobSpec, RequirementEvidence, ProofTier } from "@/lib/forge/core"

interface ForgeReceiptsMatrixProps {
  jobSpec: JobSpec
  evidenceMatrix: RequirementEvidence[]
  candidateName?: string
}

const PROOF_TIER_CONFIG: Record<ProofTier, { label: string; color: string; icon: typeof CheckCircle; bg: string }> = {
  VERIFIED_ARTIFACT: { label: "Verified", color: "text-emerald-400", icon: CheckCircle, bg: "bg-emerald-500/20" },
  STRONG_SIGNAL: { label: "Strong", color: "text-cyan-400", icon: AlertCircle, bg: "bg-cyan-500/20" },
  WEAK_SIGNAL: { label: "Weak", color: "text-amber-400", icon: AlertTriangle, bg: "bg-amber-500/20" },
  CLAIM_ONLY: { label: "Claim Only", color: "text-orange-400", icon: AlertTriangle, bg: "bg-orange-500/20" },
  NONE: { label: "Missing", color: "text-red-400", icon: XCircle, bg: "bg-red-500/20" },
}

const SOURCE_ICONS: Record<string, typeof Github> = {
  github: Github,
  resume: FileText,
  portfolio: Globe,
  writing: FileText,
  linkedin: FileText,
  other: FileText,
}

function ProofTierBadge({ tier }: { tier: ProofTier }) {
  const config = PROOF_TIER_CONFIG[tier]
  const Icon = config.icon
  return (
    <Badge variant="outline" className={`${config.color} ${config.bg} border-current gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

function EvidenceCard({ evidence, requirement }: { evidence: RequirementEvidence["items"][0]; requirement: string }) {
  const SourceIcon = SOURCE_ICONS[evidence.source] || FileText
  const config = PROOF_TIER_CONFIG[evidence.proofTier]

  return (
    <div className={`rounded-lg border p-3 ${config.bg} border-border/50`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <SourceIcon className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground capitalize">{evidence.source}</span>
        </div>
        <ProofTierBadge tier={evidence.proofTier} />
      </div>

      {/* Snippet */}
      <div className="bg-background/50 rounded p-2 mb-2 border-l-2 border-accent">
        <div className="flex items-start gap-1">
          <Quote className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-sm italic text-foreground/90 line-clamp-3">{evidence.snippet}</p>
        </div>
      </div>

      {/* Scores */}
      <div className="grid grid-cols-3 gap-2 text-xs mb-2">
        <div className="text-center">
          <div className="text-muted-foreground">Strength</div>
          <div className="font-mono font-bold">{Math.round(evidence.strength * 100)}%</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Relevance</div>
          <div className="font-mono font-bold">{Math.round(evidence.relevance * 100)}%</div>
        </div>
        <div className="text-center">
          <div className="text-muted-foreground">Recency</div>
          <div className="font-mono font-bold">{Math.round(evidence.recency * 100)}%</div>
        </div>
      </div>

      {/* URL */}
      {evidence.url && (
        <a
          href={evidence.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-accent hover:underline flex items-center gap-1"
        >
          <ExternalLink className="h-3 w-3" />
          View source
        </a>
      )}

      {/* Notes */}
      {evidence.notes && <p className="text-xs text-muted-foreground mt-1 italic">{evidence.notes}</p>}
    </div>
  )
}

function RequirementRow({
  requirement,
  evidence,
  expanded,
  onToggle,
}: {
  requirement: JobSpec["requirements"][0]
  evidence: RequirementEvidence | undefined
  expanded: boolean
  onToggle: () => void
}) {
  const items = evidence?.items || []
  const bestTier = items.length > 0 ? items[0].proofTier : "NONE"
  const config = PROOF_TIER_CONFIG[bestTier]

  // Calculate requirement score
  const bestScore =
    items.length > 0
      ? Math.max(
          ...items.map((it) => {
            const tierMult =
              it.proofTier === "VERIFIED_ARTIFACT"
                ? 1.0
                : it.proofTier === "STRONG_SIGNAL"
                  ? 0.7
                  : it.proofTier === "WEAK_SIGNAL"
                    ? 0.4
                    : 0
            return tierMult * it.strength * it.relevance * it.recency
          }),
        )
      : 0

  return (
    <div className="border-b border-border/50 last:border-0">
      {/* Header row */}
      <button onClick={onToggle} className="w-full p-3 flex items-center gap-3 hover:bg-muted/30 transition-colors">
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}

        <div className="flex-1 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium">{requirement.label}</span>
            <Badge
              variant="outline"
              className={`text-xs ${
                requirement.importance === "must"
                  ? "border-red-500/50 text-red-400"
                  : requirement.importance === "should"
                    ? "border-amber-500/50 text-amber-400"
                    : "border-muted-foreground/50 text-muted-foreground"
              }`}
            >
              {requirement.importance}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            Weight: {Math.round(requirement.weight * 100)}% | Score: {Math.round(bestScore * 100)}%
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ProofTierBadge tier={bestTier} />
          <span className="text-xs text-muted-foreground">{items.length} receipt(s)</span>
        </div>
      </button>

      {/* Expanded evidence */}
      {expanded && items.length > 0 && (
        <div className="px-3 pb-3 pl-10 grid gap-2">
          {items.map((item, idx) => (
            <EvidenceCard key={idx} evidence={item} requirement={requirement.label} />
          ))}
        </div>
      )}

      {expanded && items.length === 0 && (
        <div className="px-3 pb-3 pl-10">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-400">
            No evidence found for this requirement. Consider asking about this in the interview.
          </div>
        </div>
      )}
    </div>
  )
}

export function ForgeReceiptsMatrix({ jobSpec, evidenceMatrix, candidateName }: ForgeReceiptsMatrixProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<ProofTier | "all">("all")

  const evidenceByReq = new Map(evidenceMatrix.map((e) => [e.requirementId, e]))

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedIds)
    if (newSet.has(id)) {
      newSet.delete(id)
    } else {
      newSet.add(id)
    }
    setExpandedIds(newSet)
  }

  const expandAll = () => {
    setExpandedIds(new Set(jobSpec.requirements.map((r) => r.id)))
  }

  const collapseAll = () => {
    setExpandedIds(new Set())
  }

  // Count by tier
  const tierCounts: Record<ProofTier, number> = {
    VERIFIED_ARTIFACT: 0,
    STRONG_SIGNAL: 0,
    WEAK_SIGNAL: 0,
    CLAIM_ONLY: 0,
    NONE: 0,
  }

  for (const req of jobSpec.requirements) {
    const ev = evidenceByReq.get(req.id)
    const bestTier = ev?.items?.[0]?.proofTier || "NONE"
    tierCounts[bestTier]++
  }

  const filteredRequirements =
    filter === "all"
      ? jobSpec.requirements
      : jobSpec.requirements.filter((req) => {
          const ev = evidenceByReq.get(req.id)
          const bestTier = ev?.items?.[0]?.proofTier || "NONE"
          return bestTier === filter
        })

  return (
    <Card className="border-2 border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">
            Requirements vs Receipts{" "}
            {candidateName && <span className="text-muted-foreground">for {candidateName}</span>}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={expandAll}>
              Expand All
            </Button>
            <Button variant="ghost" size="sm" onClick={collapseAll}>
              Collapse All
            </Button>
          </div>
        </div>

        {/* Summary badges */}
        <div className="flex flex-wrap gap-2 mt-2">
          <TooltipProvider>
            {(Object.keys(tierCounts) as ProofTier[]).map((tier) => {
              const config = PROOF_TIER_CONFIG[tier]
              const Icon = config.icon
              const isActive = filter === tier
              return (
                <Tooltip key={tier}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setFilter(isActive ? "all" : tier)}
                      className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
                        isActive ? config.bg + " ring-1 ring-current" : "hover:bg-muted/50"
                      } ${config.color}`}
                    >
                      <Icon className="h-3 w-3" />
                      <span className="font-mono">{tierCounts[tier]}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {tierCounts[tier]} requirements with {config.label} evidence
                    {isActive ? " (click to clear filter)" : " (click to filter)"}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="rounded-lg border border-border/50 overflow-hidden">
          {filteredRequirements.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No requirements match the current filter</div>
          ) : (
            filteredRequirements.map((req) => (
              <RequirementRow
                key={req.id}
                requirement={req}
                evidence={evidenceByReq.get(req.id)}
                expanded={expandedIds.has(req.id)}
                onToggle={() => toggleExpanded(req.id)}
              />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
