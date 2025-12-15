// FORGE - Verification Panel Component
// Displays skill verification status with receipts and suggestions

"use client"

import { CheckCircle, AlertTriangle, XCircle, ExternalLink, Lightbulb } from "lucide-react"
import type { CandidateVerification, SkillVerification } from "@/lib/types"
import { getArtifactSuggestions } from "@/lib/verification"

interface VerificationPanelProps {
  verification: CandidateVerification
}

export function VerificationPanel({ verification }: VerificationPanelProps) {
  const { summary, skills } = verification

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Verification Summary</h3>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-foreground">{summary.overallSupportScore}</div>
            <div className="text-xs text-muted-foreground">Support Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">{summary.supportedCount}</div>
            <div className="text-xs text-muted-foreground">Supported</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-warning">{summary.partialCount}</div>
            <div className="text-xs text-muted-foreground">Partial</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-destructive">{summary.unverifiedCount}</div>
            <div className="text-xs text-muted-foreground">Unverified</div>
          </div>
        </div>

        {/* Support Score Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gradient-to-r from-success via-warning to-destructive"
            style={{ width: `${summary.overallSupportScore}%` }}
          />
        </div>

        {/* Warnings */}
        {summary.warnings.length > 0 && (
          <div className="space-y-1">
            {summary.warnings.map((warning, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-warning">
                <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" />
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skill Verification List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Skill Verification</h3>

        {skills.map((skill) => (
          <SkillVerificationCard key={skill.skill} skill={skill} />
        ))}
      </div>
    </div>
  )
}

function SkillVerificationCard({ skill }: { skill: SkillVerification }) {
  const suggestions = skill.support === "unverified" ? getArtifactSuggestions(skill) : []

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm text-foreground">{skill.skill}</span>
          <SupportBadge support={skill.support} />
          <ConfidenceBadge confidence={skill.confidence} />
        </div>
      </div>

      {/* Receipts */}
      {skill.receipts.length > 0 && (
        <div className="space-y-1.5 mb-3">
          {skill.receipts.slice(0, 3).map((receipt, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <SourceIcon source={receipt.source} />
              <span className="text-muted-foreground flex-1">{receipt.text}</span>
              {receipt.url && (
                <a
                  href={receipt.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Notes */}
      {skill.notes && skill.notes.length > 0 && (
        <div className="space-y-1 mb-3">
          {skill.notes.map((note, i) => (
            <div key={i} className="text-xs text-muted-foreground italic">
              {note}
            </div>
          ))}
        </div>
      )}

      {/* Suggestions for unverified skills */}
      {skill.support === "unverified" && suggestions.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-2">
            <Lightbulb className="h-3 w-3" />
            What would count as proof?
          </div>
          <ul className="space-y-1">
            {suggestions.slice(0, 2).map((suggestion, i) => (
              <li
                key={i}
                className="text-xs text-muted-foreground pl-4 relative before:content-['•'] before:absolute before:left-1"
              >
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function SupportBadge({ support }: { support: SkillVerification["support"] }) {
  if (support === "supported") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/20 text-success text-xs">
        <CheckCircle className="h-3 w-3" />
        Supported
      </span>
    )
  }
  if (support === "partial") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/20 text-warning text-xs">
        <AlertTriangle className="h-3 w-3" />
        Partial
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/20 text-destructive text-xs">
      <XCircle className="h-3 w-3" />
      Unverified
    </span>
  )
}

function ConfidenceBadge({ confidence }: { confidence: SkillVerification["confidence"] }) {
  const colors = {
    high: "bg-success/10 text-success",
    medium: "bg-warning/10 text-warning",
    low: "bg-muted text-muted-foreground",
  }

  return <span className={`px-1.5 py-0.5 rounded text-xs ${colors[confidence]}`}>{confidence}</span>
}

function SourceIcon({ source }: { source: string }) {
  const icons: Record<string, string> = {
    github: "🔗",
    portfolio: "🌐",
    writing: "📝",
    linkedin: "💼",
    resume: "📄",
    extracurricular: "🏆",
  }

  return <span className="text-xs">{icons[source] || "📋"}</span>
}
