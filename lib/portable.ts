// FORGE Export/Import
// Share analysis without a database

import type { CandidateAnalysis } from "@/lib/scoring"

export interface PortableAnalysis {
  version: "1.0"
  exportedAt: string
  job: {
    title: string
    description: string
    skills: Array<{ name: string; weight: number }>
  }
  candidates: CandidateAnalysis[]
  decisions?: Record<string, Decision>
  meta?: {
    mode: "live" | "demo"
    analyzedAt?: string
  }
}

export interface Decision {
  candidateId: string
  status: "shortlisted" | "rejected" | "none"
  notes: string
  nextStep: "screen" | "tech" | "final" | "hold" | "none"
  updatedAt: string
}

export function exportAnalysis(): string {
  const jobStr = localStorage.getItem("forge_job_config")
  const analysisStr = localStorage.getItem("forge_analysis")
  const decisionsStr = localStorage.getItem("forge_decisions")

  if (!analysisStr) {
    throw new Error("No analysis found to export")
  }

  const analysis = JSON.parse(analysisStr)
  const job = jobStr ? JSON.parse(jobStr) : { title: "Unknown", description: "", skills: [] }
  const decisions = decisionsStr ? JSON.parse(decisionsStr) : {}

  const portable: PortableAnalysis = {
    version: "1.0",
    exportedAt: new Date().toISOString(),
    job: {
      title: job.title,
      description: job.description,
      skills: job.skills || [],
    },
    candidates: analysis.candidates || [],
    decisions,
    meta: analysis.meta,
  }

  return JSON.stringify(portable, null, 2)
}

export function downloadAnalysisJson(filename?: string): void {
  const json = exportAnalysis()
  const blob = new Blob([json], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename || `forge-analysis-${new Date().toISOString().split("T")[0]}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function importAnalysisJson(jsonText: string): { ok: true } | { ok: false; error: string } {
  try {
    const data = JSON.parse(jsonText)

    // Validate required keys
    if (!data.candidates || !Array.isArray(data.candidates)) {
      return { ok: false, error: "Invalid format: missing candidates array" }
    }
    if (!data.job || typeof data.job !== "object") {
      return { ok: false, error: "Invalid format: missing job configuration" }
    }
    if (data.candidates.length === 0) {
      return { ok: false, error: "Invalid format: candidates array is empty" }
    }

    // Validate candidate shape (basic)
    const firstCandidate = data.candidates[0]
    if (!firstCandidate.id || !firstCandidate.name || typeof firstCandidate.finalScore !== "number") {
      return { ok: false, error: "Invalid format: candidates have invalid structure" }
    }

    // Write to localStorage
    localStorage.setItem(
      "forge_job_config",
      JSON.stringify({
        title: data.job.title,
        description: data.job.description,
        skills: data.job.skills,
        updatedAt: new Date().toISOString(),
      }),
    )

    localStorage.setItem(
      "forge_analysis",
      JSON.stringify({
        candidates: data.candidates,
        meta: data.meta || { mode: "demo", analyzedAt: data.exportedAt },
      }),
    )

    if (data.decisions) {
      localStorage.setItem("forge_decisions", JSON.stringify(data.decisions))
    }

    return { ok: true }
  } catch (e) {
    return { ok: false, error: `Failed to parse JSON: ${e instanceof Error ? e.message : "Unknown error"}` }
  }
}

export function copyAnalysisJson(): void {
  const json = exportAnalysis()
  navigator.clipboard.writeText(json)
}
