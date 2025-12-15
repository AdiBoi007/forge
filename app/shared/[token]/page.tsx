"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { AlertTriangle, Clock, Eye, Lock, ExternalLink } from "lucide-react"
import { getShareByToken, incrementShareViews, isShareLinkValid, type ShareableAnalysis } from "@/lib/shareable-link"
import type { CandidateAnalysis } from "@/lib/scoring"
import { cn } from "@/lib/utils"

export default function SharedAnalysisPage() {
  const params = useParams()
  const token = params.token as string

  const [share, setShare] = useState<ShareableAnalysis | null>(null)
  const [candidates, setCandidates] = useState<CandidateAnalysis[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadShare = () => {
      const shareData = getShareByToken(token)

      if (!shareData) {
        setError("This shared link does not exist or has been deleted.")
        setIsLoading(false)
        return
      }

      const validity = isShareLinkValid(shareData)
      if (!validity.valid) {
        setError(validity.reason || "This link is no longer valid.")
        setIsLoading(false)
        return
      }

      // Increment views
      incrementShareViews(token)

      // Parse analysis data
      try {
        const data = JSON.parse(shareData.analysisData)
        setCandidates(data.candidates || [])
        setShare(shareData)
      } catch {
        setError("Failed to parse shared analysis data.")
      }

      setIsLoading(false)
    }

    loadShare()
  }, [token])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground font-bold">Loading shared analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <Lock className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-black text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground font-bold">{error}</p>
        </div>
      </div>
    )
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "Strong Hire":
        return "text-success bg-success/10"
      case "Possible":
        return "text-primary bg-primary/10"
      case "Risky but High Potential":
        return "text-warning bg-warning/10"
      default:
        return "text-destructive bg-destructive/10"
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b-2 border-border bg-black/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Image src="/forge-logo.png" alt="FORGE" width={40} height={40} className="rounded-xl" />
              <div>
                <h1 className="text-xl font-black text-foreground">Shared Analysis</h1>
                <p className="text-sm text-muted-foreground font-medium">{share?.jobTitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span className="font-bold">
                  {share?.views}/{share?.maxViews} views
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-bold">Expires {share ? new Date(share.expiresAt).toLocaleDateString() : ""}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-warning/10 border-2 border-warning/30 rounded-xl p-4 mb-8 flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0" />
          <p className="text-sm text-warning font-bold">
            This is a read-only shared view. Contact the hiring team for full access.
          </p>
        </div>

        <div className="grid gap-6">
          {candidates.map((candidate, index) => (
            <div key={candidate.id} className="bg-card border-3 border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-surface flex items-center justify-center font-black text-lg text-foreground">
                    #{index + 1}
                  </div>
                  {candidate.avatar && (
                    <img
                      src={candidate.avatar || "/placeholder.svg"}
                      alt={candidate.name}
                      className="h-12 w-12 rounded-xl border-2 border-border"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-black text-foreground">{candidate.name}</h2>
                    <p className="text-sm text-muted-foreground font-medium">{candidate.headline}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-foreground">{candidate.finalScore}</div>
                  <span className={cn("text-sm font-bold px-3 py-1 rounded-lg", getVerdictColor(candidate.verdict))}>
                    {candidate.verdict}
                  </span>
                </div>
              </div>

              <div className="grid md:grid-cols-4 gap-4 mb-4">
                <div className="bg-surface rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-foreground">{Math.round((candidate.cs || 0) * 100)}%</div>
                  <div className="text-xs font-bold text-muted-foreground">Capability</div>
                </div>
                <div className="bg-surface rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-foreground">{Math.round((candidate.xs || 0) * 100)}%</div>
                  <div className="text-xs font-bold text-muted-foreground">Context</div>
                </div>
                <div className="bg-surface rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-foreground">{candidate.proofConfidence}%</div>
                  <div className="text-xs font-bold text-muted-foreground">Proof Confidence</div>
                </div>
                <div className="bg-surface rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-foreground">{candidate.evidence.length}</div>
                  <div className="text-xs font-bold text-muted-foreground">Evidence Items</div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-foreground text-sm">Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {candidate.capability.skills.slice(0, 6).map((skill) => (
                    <span
                      key={skill.name}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-sm font-bold",
                        skill.status === "Proven"
                          ? "bg-success/20 text-success"
                          : skill.status === "Weak"
                            ? "bg-warning/20 text-warning"
                            : "bg-destructive/20 text-destructive",
                      )}
                    >
                      {skill.name}: {Math.round(skill.score * 100)}%
                    </span>
                  ))}
                </div>
              </div>

              {candidate.evidence.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <h4 className="font-bold text-foreground text-sm mb-2">Top Evidence</h4>
                  <div className="grid md:grid-cols-3 gap-2">
                    {candidate.evidence.slice(0, 3).map((ev) => (
                      <a
                        key={ev.id}
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-surface rounded-lg p-3 hover:bg-muted transition-colors block"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground text-sm truncate">{ev.title}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{ev.skill}</p>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by <span className="font-black text-foreground">FORGE</span> - Proof-First Hiring
          </p>
        </div>
      </div>
    </div>
  )
}
