"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/app-shell"
import { ArrowLeft, CheckCircle, AlertTriangle, TrendingUp, Zap, ExternalLink } from "lucide-react"
import type { CandidateAnalysis } from "@/lib/scoring"
import { cn } from "@/lib/utils"
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from "recharts"

const COLORS = {
  candidates: ["#ffffff", "#6b8aff", "#f59e0b"],
  success: "#4ade80",
  warning: "#fbbf24",
  destructive: "#ef4444",
  muted: "#444444",
}

export default function ComparePage() {
  const searchParams = useSearchParams()
  const [candidates, setCandidates] = useState<CandidateAnalysis[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const idsParam = searchParams.get("ids")
    if (!idsParam) {
      setIsLoading(false)
      return
    }

    const ids = idsParam.split(",")

    try {
      const analysisStr = localStorage.getItem("forge_analysis")
      if (analysisStr) {
        const analysis = JSON.parse(analysisStr)
        const selected = (analysis.candidates || []).filter((c: CandidateAnalysis) => ids.includes(c.id))
        setCandidates(selected)
      }
    } catch (e) {
      console.error("Failed to load candidates:", e)
    }
    setIsLoading(false)
  }, [searchParams])

  const getVerdictConfig = (verdict: string) => {
    switch (verdict) {
      case "Strong Hire":
        return { color: "text-success", bg: "bg-success/10", icon: CheckCircle }
      case "Possible":
        return { color: "text-primary", bg: "bg-primary/10", icon: TrendingUp }
      case "Risky but High Potential":
        return { color: "text-warning", bg: "bg-warning/10", icon: Zap }
      default:
        return { color: "text-destructive", bg: "bg-destructive/10", icon: AlertTriangle }
    }
  }

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground font-bold">Loading comparison...</p>
        </div>
      </AppShell>
    )
  }

  if (candidates.length < 2) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center max-w-md">
            <AlertTriangle className="h-12 w-12 text-warning mx-auto mb-4" />
            <h2 className="text-2xl font-black text-foreground mb-2">Select Candidates</h2>
            <p className="text-muted-foreground font-bold mb-6">
              Select 2-3 candidates from the results page to compare them.
            </p>
            <Link href="/results">
              <Button className="bg-foreground hover:bg-foreground/90 text-background rounded-xl font-black">
                Back to Results
              </Button>
            </Link>
          </div>
        </div>
      </AppShell>
    )
  }

  // Build comparison data
  const allSkills = Array.from(new Set(candidates.flatMap((c) => c.capability.skills.map((s) => s.name)))).slice(0, 6)

  const skillComparisonData = allSkills.map((skill) => {
    const entry: Record<string, string | number> = { skill }
    candidates.forEach((c, i) => {
      const skillScore = c.capability.skills.find((s) => s.name === skill)
      entry[`candidate${i}`] = skillScore?.score || 0
    })
    return entry
  })

  const contextSignals = ["Teamwork", "Communication", "Adaptability", "Ownership"]
  const contextComparisonData = contextSignals.map((signal) => {
    const entry: Record<string, string | number> = { signal }
    candidates.forEach((c, i) => {
      const key = signal.toLowerCase() as keyof typeof c.context
      entry[`candidate${i}`] = c.context[key]?.score || 0
    })
    return entry
  })

  const radarData = allSkills.map((skill) => {
    const entry: Record<string, string | number> = { skill: skill.substring(0, 8) }
    candidates.forEach((c, i) => {
      const skillScore = c.capability.skills.find((s) => s.name === skill)
      entry[`c${i}`] = skillScore?.score || 0
    })
    return entry
  })

  return (
    <AppShell>
      <div className="mx-auto max-w-7xl px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Image src="/forge-logo.png" alt="FORGE" width={48} height={48} className="rounded-2xl" />
            <div>
              <h1 className="text-3xl font-black text-foreground">Compare Candidates</h1>
              <p className="text-sm text-muted-foreground font-bold">
                Side-by-side comparison of {candidates.length} candidates
              </p>
            </div>
          </div>
          <Link href="/results">
            <Button
              variant="outline"
              className="border-2 border-border hover:bg-surface bg-transparent rounded-xl font-black"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cockpit
            </Button>
          </Link>
        </div>

        {/* Candidate Headers */}
        <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
          {candidates.map((candidate, i) => {
            const config = getVerdictConfig(candidate.verdict)
            const Icon = config.icon
            return (
              <div
                key={candidate.id}
                className="bg-card border-3 rounded-2xl p-6"
                style={{ borderColor: COLORS.candidates[i] }}
              >
                <div className="flex items-center gap-4 mb-4">
                  {candidate.avatar && (
                    <img
                      src={candidate.avatar || "/placeholder.svg"}
                      alt={candidate.name}
                      className="h-14 w-14 rounded-2xl border-2 border-border"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-black text-foreground">{candidate.name}</h2>
                    <div className={cn("inline-flex items-center gap-1.5 text-sm font-bold", config.color)}>
                      <Icon className="h-4 w-4" />
                      {candidate.verdict}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-surface rounded-xl">
                    <div className="text-3xl font-black text-foreground">{candidate.finalScore}</div>
                    <div className="text-xs font-bold text-muted-foreground">Score</div>
                  </div>
                  <div className="text-center p-3 bg-surface rounded-xl">
                    <div className="text-3xl font-black text-foreground">{candidate.proofConfidence}%</div>
                    <div className="text-xs font-bold text-muted-foreground">Confidence</div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Skill Radar Chart */}
        <div className="bg-card border-3 border-border rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-black text-foreground mb-4">Skill Distribution</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="skill" tick={{ fill: "#888", fontSize: 12 }} />
                {candidates.map((_, i) => (
                  <Radar
                    key={i}
                    name={candidates[i].name}
                    dataKey={`c${i}`}
                    stroke={COLORS.candidates[i]}
                    fill={COLORS.candidates[i]}
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {candidates.map((c, i) => (
              <div key={c.id} className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS.candidates[i] }} />
                <span className="text-sm font-bold text-muted-foreground">{c.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Comparison Bars */}
        <div className="bg-card border-3 border-border rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-black text-foreground mb-4">Skill Match Comparison</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skillComparisonData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#888" }} />
                <YAxis type="category" dataKey="skill" tick={{ fill: "#888" }} width={100} />
                {candidates.map((_, i) => (
                  <Bar
                    key={i}
                    dataKey={`candidate${i}`}
                    fill={COLORS.candidates[i]}
                    radius={[0, 4, 4, 0]}
                    barSize={12}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Context Signals */}
        <div className="bg-card border-3 border-border rounded-2xl p-6 mb-8">
          <h3 className="text-lg font-black text-foreground mb-4">Context Signals</h3>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contextComparisonData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tick={{ fill: "#888" }} />
                <YAxis type="category" dataKey="signal" tick={{ fill: "#888" }} width={120} />
                {candidates.map((_, i) => (
                  <Bar
                    key={i}
                    dataKey={`candidate${i}`}
                    fill={COLORS.candidates[i]}
                    radius={[0, 4, 4, 0]}
                    barSize={10}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Evidence */}
        <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
          {candidates.map((candidate, i) => (
            <div
              key={candidate.id}
              className="bg-card border-3 rounded-2xl p-6"
              style={{ borderColor: COLORS.candidates[i] }}
            >
              <h3 className="text-lg font-black text-foreground mb-4">Top Evidence</h3>
              <div className="space-y-3">
                {candidate.evidence.slice(0, 3).map((ev) => (
                  <a
                    key={ev.id}
                    href={ev.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-surface rounded-xl hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-foreground text-sm">{ev.title}</span>
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{ev.whyThisMatters}</p>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Interview Questions Preview */}
        <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${candidates.length}, 1fr)` }}>
          {candidates.map((candidate, i) => (
            <div
              key={candidate.id}
              className="bg-card border-3 rounded-2xl p-6"
              style={{ borderColor: COLORS.candidates[i] }}
            >
              <h3 className="text-lg font-black text-foreground mb-4">Key Questions</h3>
              <div className="space-y-3">
                {candidate.interviewGuidance.questions.slice(0, 3).map((q, qi) => (
                  <div key={qi} className="p-3 bg-surface rounded-xl">
                    <p className="text-sm text-foreground font-bold">{q.question}</p>
                    <p className="text-xs text-muted-foreground mt-1">{q.context}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
