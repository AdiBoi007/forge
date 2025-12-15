"use client"

import { useState, useMemo, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { AppShell } from "@/components/app-shell"
import { DollarSign } from "lucide-react"
import { CompensationBenchmark } from "@/components/compensation-benchmark"
import {
  ArrowRight,
  Sparkles,
  AlertTriangle,
  Info,
  Lightbulb,
  RotateCcw,
  Loader2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  Target,
  Zap,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
} from "lucide-react"
import type { ExtractedSkill } from "@/lib/skills"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { markTopNAsRequired, countRequired } from "@/lib/skills"

type SkillConfidence = "high" | "medium" | "low"
type SkillCategory = "frontend" | "backend" | "infra" | "data" | "process" | "soft" | "design" | "product" | "ai"
type SkillImportance = "core" | "required" | "preferred" | "bonus"

type ForgeJobConfig = {
  title: string
  description: string
  skills: {
    name: string
    weight: number
    confidence?: string
    category?: string
    importance?: string
    isRequired?: boolean
  }[]
  critique?: { score: number; issues: { type: string; text: string }[] }
  updatedAt: string
  budget?: { min: number; max: number; currency: string }
  gateThreshold?: number
}

type JDCritiqueIssue = {
  type: "vague" | "missing" | "bias" | "unrealistic" | "contradiction"
  text: string
  severity: "low" | "medium" | "high"
}

const STORAGE_KEY = "forge_job_config"

const weightDescriptions = {
  teamwork: {
    label: "Teamwork",
    description: "Collaboration signals, long-term group work, reliability",
    examples: "PR reviews, team repo contributions, co-authored commits",
  },
  communication: {
    label: "Communication",
    description: "Clarity of documentation, explanations, and code comments",
    examples: "README quality, technical blog posts, commit messages",
  },
  adaptability: {
    label: "Adaptability",
    description: "Breadth of experience, learning speed, tech stack flexibility",
    examples: "Language diversity, project type variety, skill acquisition",
  },
  ownership: {
    label: "Ownership",
    description: "Initiative, primary maintainer status, long-term project stewardship",
    examples: "Repository creation, sustained maintenance, issue resolution",
  },
}

const CATEGORY_COLORS: Record<SkillCategory, string> = {
  frontend: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  backend: "bg-green-500/20 text-green-400 border-green-500/30",
  infra: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  data: "bg-purple-500/20 text-purple-400 border-purple-500/50",
  process: "bg-cyan-500/20 text-cyan-400 border-cyan-500/50",
  soft: "bg-pink-500/20 text-pink-400 border-pink-500/50",
  design: "bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/50",
  product: "bg-amber-500/20 text-amber-400 border-amber-500/50",
  ai: "bg-violet-500/20 text-violet-400 border-violet-500/50",
}

const IMPORTANCE_COLORS: Record<SkillImportance, string> = {
  core: "bg-red-500/20 text-red-400 border-red-500/50",
  required: "bg-yellow-500/20 text-yellow-400 border-yellow-500/50",
  preferred: "bg-emerald-500/20 text-emerald-400 border-emerald-500/50",
  bonus: "bg-slate-500/20 text-slate-400 border-slate-500/50",
}

const IMPORTANCE_LABELS: Record<SkillImportance, string> = {
  core: "CORE",
  required: "REQUIRED",
  preferred: "PREFERRED",
  bonus: "BONUS",
}

const presets = [
  { id: "balanced", name: "Balanced", weights: { teamwork: 25, communication: 25, adaptability: 25, ownership: 25 } },
  { id: "startup", name: "Startup", weights: { teamwork: 15, communication: 20, adaptability: 35, ownership: 30 } },
  {
    id: "enterprise",
    name: "Enterprise",
    weights: { teamwork: 30, communication: 30, adaptability: 20, ownership: 20 },
  },
]

export default function JobPage() {
  const router = useRouter()

  const [jobTitle, setJobTitle] = useState("")
  const [jobDescription, setJobDescription] = useState("")
  const [extractedSkills, setExtractedSkills] = useState<ExtractedSkill[]>([])
  const [lastExtractedSkills, setLastExtractedSkills] = useState<ExtractedSkill[]>([])
  const [critique, setCritique] = useState<{ score: number; issues: { type: string; text: string }[] } | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [hasExtracted, setHasExtracted] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [budget, setBudget] = useState<{ min: number; max: number; currency: string } | null>(null)
  const [gateThreshold, setGateThreshold] = useState(0.4)

  const { required: requiredCount, optional: optionalCount } = countRequired(extractedSkills)

  const [activePreset, setActivePreset] = useState<string | null>("balanced")
  const [confidenceTolerance, setConfidenceTolerance] = useState<number[]>([50])
  const [weights, setWeights] = useState({
    teamwork: 25,
    communication: 25,
    adaptability: 25,
    ownership: 25,
  })

  useEffect(() => {
    loadFromLocalStorage()
  }, [])

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem("forge_job_config")
      if (saved) {
        const parsed = JSON.parse(saved)
        setJobTitle(parsed.title || "")
        setJobDescription(parsed.description || "")
        setExtractedSkills(parsed.skills || [])
        setLastExtractedSkills(parsed.skills || [])
        setCritique(parsed.critique || null)
        setBudget(parsed.budget || null)
        setGateThreshold(parsed.gateThreshold || 0.4)
        if (parsed.skills?.length > 0) {
          setHasExtracted(true)
        }
      }
    } catch (e) {
      console.error("Failed to load from localStorage", e)
    }
  }

  const saveToLocalStorage = useCallback(
    (
      title: string,
      desc: string,
      skills: ExtractedSkill[],
      critiqueData: { score: number; issues: { type: string; text: string }[] } | null,
      budgetData: { min: number; max: number; currency: string } | null,
    ) => {
      const config = {
        title,
        description: desc,
        skills,
        critique: critiqueData,
        budget: budgetData,
        gateThreshold,
        updatedAt: new Date().toISOString(),
      }
      localStorage.setItem("forge_job_config", JSON.stringify(config))
    },
    [gateThreshold],
  )

  const handlePresetClick = (presetId: string) => {
    const preset = presets.find((p) => p.id === presetId)
    if (preset) {
      setActivePreset(presetId)
      setWeights(preset.weights)
    }
  }

  const handleWeightChange = (trait: keyof typeof weights, value: number[]) => {
    const newValue = value[0]
    const oldValue = weights[trait]
    const diff = newValue - oldValue

    const otherTraits = Object.keys(weights).filter((t) => t !== trait) as (keyof typeof weights)[]
    const otherTotal = otherTraits.reduce((sum, t) => sum + weights[t], 0)

    if (otherTotal > 0) {
      const newWeights = { ...weights, [trait]: newValue }
      for (const t of otherTraits) {
        newWeights[t] = Math.max(0, Math.round(weights[t] - (diff * weights[t]) / otherTotal))
      }

      const total = Object.values(newWeights).reduce((a, b) => a + b, 0)
      if (total !== 100 && otherTraits.length > 0) {
        newWeights[otherTraits[0]] += 100 - total
      }

      setWeights(newWeights)
      setActivePreset(null)
    }
  }

  const extractSkills = async () => {
    if (!jobDescription.trim()) return

    setIsExtracting(true)
    try {
      const res = await fetch("/api/job/extract-skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: jobDescription }),
      })

      const data = await res.json()
      if (data.success && data.skills) {
        setExtractedSkills(data.skills)
        setLastExtractedSkills(data.skills)
        setCritique(data.critique || null)
        setHasExtracted(true)
        saveToLocalStorage(jobTitle, jobDescription, data.skills, data.critique || null, budget)
      }
    } catch (e) {
      console.error("Failed to extract skills", e)
    } finally {
      setIsExtracting(false)
    }
  }

  const loadDemoJD = () => {
    const demoTitle = "Senior Full-Stack Engineer"
    const demoJD = `About the Role:
We're looking for a Senior Full-Stack Engineer to join our platform team. You'll be building and scaling our core product infrastructure that serves millions of users.

What You'll Do:
• Design and implement new features across our React/Next.js frontend and Node.js backend
• Work with our data team on real-time analytics pipelines using Kafka and Spark
• Lead technical architecture decisions and mentor junior engineers
• Collaborate with product and design to ship delightful user experiences
• Own the full lifecycle from ideation to production deployment

Requirements:
• 5+ years of professional software engineering experience
• Strong proficiency in TypeScript and React (Next.js experience preferred)
• Solid backend experience with Node.js, Python, or Go
• Experience with PostgreSQL and Redis at scale
• Familiarity with AWS services (EC2, S3, Lambda, RDS)
• Experience with Docker and Kubernetes for containerized deployments
• Strong system design skills for distributed systems
• Excellent written and verbal communication

Nice to Have:
• Experience with GraphQL
• Contributions to open source projects
• Experience with machine learning pipelines
• Previous startup experience

We value diverse perspectives and encourage candidates from all backgrounds to apply.`

    setJobTitle(demoTitle)
    setJobDescription(demoJD)
    setIsDemoMode(true)
    setHasExtracted(false)
    setExtractedSkills([])
    setCritique(null)
    setBudget(null)
  }

  const handleSkillWeightChange = (skillName: string, delta: number) => {
    const skillIndex = extractedSkills.findIndex((s) => s.name === skillName)
    if (skillIndex === -1) return

    const newSkills = [...extractedSkills]
    const oldWeight = newSkills[skillIndex].weight
    const newWeight = Math.max(1, Math.min(100, oldWeight + delta))
    const difference = newWeight - oldWeight

    if (difference === 0) return

    newSkills[skillIndex] = { ...newSkills[skillIndex], weight: newWeight }

    // Distribute the difference among other skills
    const otherSkills = newSkills.filter((_, i) => i !== skillIndex)
    const totalOthers = otherSkills.reduce((sum, s) => sum + s.weight, 0)

    if (totalOthers > 0) {
      for (let i = 0; i < newSkills.length; i++) {
        if (i !== skillIndex) {
          const proportion = newSkills[i].weight / totalOthers
          newSkills[i] = {
            ...newSkills[i],
            weight: Math.max(1, Math.round(newSkills[i].weight - difference * proportion)),
          }
        }
      }
    }

    // Fix any rounding drift
    const total = newSkills.reduce((sum, s) => sum + s.weight, 0)
    if (total !== 100 && newSkills.length > 0) {
      const adjustment = 100 - total
      const adjustIndex = skillIndex === 0 ? 1 : 0
      if (newSkills[adjustIndex]) {
        newSkills[adjustIndex] = {
          ...newSkills[adjustIndex],
          weight: Math.max(1, newSkills[adjustIndex].weight + adjustment),
        }
      }
    }

    setExtractedSkills(newSkills)
    saveToLocalStorage(jobTitle, jobDescription, newSkills, critique, budget)
  }

  const handleContinue = () => {
    // Save final state before continuing
    saveToLocalStorage(jobTitle, jobDescription, extractedSkills, critique, budget)
    router.push("/candidates")
  }

  const resetToExtracted = () => {
    setExtractedSkills([...lastExtractedSkills])
    saveToLocalStorage(jobTitle, jobDescription, lastExtractedSkills, critique, budget)
  }

  const totalWeight = extractedSkills.reduce((sum, s) => sum + s.weight, 0)

  // Group skills by importance
  const skillsByImportance = {
    core: extractedSkills.filter((s) => s.importance === "core"),
    required: extractedSkills.filter((s) => s.importance === "required"),
    preferred: extractedSkills.filter((s) => s.importance === "preferred"),
    bonus: extractedSkills.filter((s) => s.importance === "bonus"),
  }

  const highestWeight = useMemo(() => {
    return Object.entries(weights).reduce((a, b) => (b[1] > a[1] ? b : a))[0]
  }, [weights])

  const getFeedback = () => {
    const sorted = Object.entries(weights).sort((a, b) => b[1] - a[1])
    const top = sorted.slice(0, 2).map(([key]) => weightDescriptions[key as keyof typeof weights].label.toLowerCase())
    return `This configuration favours ${top[0]} and ${top[1]} over other signals.`
  }

  const getToleranceLabel = () => {
    if (confidenceTolerance[0] < 33) return "Only show high-confidence candidates"
    if (confidenceTolerance[0] > 66) return "Allow risky but high-potential"
    return "Balanced confidence tolerance"
  }

  const handleTitleChange = (value: string) => {
    setJobTitle(value)
    if (hasExtracted) {
      saveToLocalStorage(value, jobDescription, extractedSkills, critique, budget)
    }
  }

  const highestSkill = useMemo(() => {
    if (extractedSkills.length === 0) return null
    return extractedSkills.reduce((a, b) => (b.weight > a.weight ? b : a))
  }, [extractedSkills])

  const handleBudgetSet = (newBudget: { min: number; max: number; currency: string }) => {
    setBudget(newBudget)
    const existingConfig = localStorage.getItem("forge_job_config")
    if (existingConfig) {
      const config = JSON.parse(existingConfig)
      config.budget = newBudget
      localStorage.setItem("forge_job_config", JSON.stringify(config))
    }
  }

  const handleSkillRequiredToggle = (skillName: string) => {
    const newSkills = extractedSkills.map((skill) => {
      if (skill.name === skillName) {
        // Toggle isRequired - if undefined, derive from importance first
        const currentRequired = skill.isRequired ?? (skill.importance === "core" || skill.importance === "required")
        return { ...skill, isRequired: !currentRequired }
      }
      return skill
    })
    setExtractedSkills(newSkills)
    saveToLocalStorage(jobTitle, jobDescription, newSkills, critique, budget)
  }

  const handleMarkTopNRequired = (n = 5) => {
    const updated = markTopNAsRequired(extractedSkills, n)
    setExtractedSkills(updated)
    saveToLocalStorage(jobTitle, jobDescription, updated, critique, budget)
  }

  return (
    <AppShell currentStep={1}>
      <div className="min-h-screen bg-background">
        <main className="max-w-5xl mx-auto px-6 py-12 space-y-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Job Configuration</h1>
            <p className="text-muted-foreground mt-2">
              Define the role and let FORGE extract skills with intelligent weighting
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Job Description Input */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Job Description</CardTitle>
                      <CardDescription>Paste your JD or use the demo to see how it works</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadDemoJD}>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Load Demo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="job-title">Job Title</Label>
                    <Input
                      id="job-title"
                      placeholder="e.g., Senior Full-Stack Engineer"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="job-description">Description</Label>
                    <Textarea
                      id="job-description"
                      placeholder="Paste the full job description here..."
                      value={jobDescription}
                      onChange={(e) => {
                        setJobDescription(e.target.value)
                        setIsDemoMode(false)
                      }}
                      className="mt-1 min-h-[300px] font-mono text-sm"
                    />
                  </div>
                  <Button onClick={extractSkills} disabled={!jobDescription.trim() || isExtracting} className="w-full">
                    {isExtracting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4 mr-2" />
                        Extract Skills & Analyze
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* JD Critique */}
              {critique && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        JD Quality Score
                      </CardTitle>
                      <div
                        className={`text-2xl font-bold ${
                          critique.score >= 80
                            ? "text-green-500"
                            : critique.score >= 60
                              ? "text-yellow-500"
                              : "text-red-500"
                        }`}
                      >
                        {critique.score}/100
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <TooltipProvider>
                      {critique.issues.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground">Issues Found</Label>
                          {critique.issues.map((issue, i) => (
                            <div
                              key={i}
                              className={`flex items-start gap-2 p-2 rounded-md text-sm ${
                                issue.severity === "high"
                                  ? "bg-red-500/10 text-red-400"
                                  : issue.severity === "medium"
                                    ? "bg-yellow-500/10 text-yellow-400"
                                    : "bg-muted text-muted-foreground"
                              }`}
                            >
                              {issue.severity === "high" ? (
                                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                              ) : issue.severity === "medium" ? (
                                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                              ) : (
                                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                              )}
                              <span>{issue.text}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {critique.suggestions && critique.suggestions.length > 0 && showSuggestions && (
                        <div className="space-y-2">
                          <Label className="text-muted-foreground flex items-center gap-2">
                            <Lightbulb className="h-4 w-4" />
                            Suggestions
                          </Label>
                          {critique.suggestions.map((suggestion, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 p-2 rounded-md bg-blue-500/10 text-blue-400 text-sm"
                            >
                              <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                              <span>{suggestion}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </TooltipProvider>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Extracted Skills */}
            <div className="space-y-6">
              {hasExtracted && extractedSkills.length > 0 ? (
                <>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5" />
                          Extracted Skills
                        </CardTitle>
                        <Button variant="ghost" size="sm" onClick={resetToExtracted}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset to extracted
                        </Button>
                      </div>
                      <CardDescription>
                        Skills are weighted by importance, mentions, and context. Adjust weights as needed.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {(["core", "required", "preferred", "bonus"] as SkillImportance[]).map((importance) => {
                        const skills = skillsByImportance[importance]
                        if (skills.length === 0) return null

                        return (
                          <div key={importance} className="space-y-3">
                            <div className="flex items-center gap-2 mb-4">
                              <Badge variant="outline" className={IMPORTANCE_COLORS[importance]}>
                                {IMPORTANCE_LABELS[importance]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {skills.length} skill{skills.length !== 1 ? "s" : ""}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({requiredCount} required, {optionalCount} optional)
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleMarkTopNRequired(5)}
                                className="text-xs h-7"
                              >
                                Mark Top 5 as Required
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 gap-3">
                              {skills.map((skill) => {
                                const isRequired =
                                  skill.isRequired ?? (skill.importance === "core" || skill.importance === "required")

                                return (
                                  <div
                                    key={skill.name}
                                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-medium">{skill.name}</span>
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${skill.category ? CATEGORY_COLORS[skill.category] : ""}`}
                                        >
                                          {skill.category}
                                        </Badge>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className={`h-6 px-2 text-xs ${isRequired ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}`}
                                          onClick={() => handleSkillRequiredToggle(skill.name)}
                                        >
                                          {isRequired ? (
                                            <>
                                              <Lock className="h-3 w-3 mr-1" />
                                              Required
                                            </>
                                          ) : (
                                            <>
                                              <Unlock className="h-3 w-3 mr-1" />
                                              Optional
                                            </>
                                          )}
                                        </Button>
                                        {skill.yearsRequired && (
                                          <Tooltip>
                                            <TooltipTrigger>
                                              <Badge variant="outline" className="text-xs bg-muted">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {skill.yearsRequired}+ yrs
                                              </Badge>
                                            </TooltipTrigger>
                                            <TooltipContent>{skill.yearsRequired}+ years required</TooltipContent>
                                          </Tooltip>
                                        )}
                                        {skill.confidence === "high" && (
                                          <Tooltip>
                                            <TooltipTrigger>
                                              <TrendingUp className="h-3 w-3 text-green-500" />
                                            </TooltipTrigger>
                                            <TooltipContent>High confidence extraction</TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                      {skill.context && (
                                        <p className="text-xs text-muted-foreground mt-1 truncate">{skill.context}</p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-1 ml-4">
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 bg-transparent"
                                        onClick={() => handleSkillWeightChange(skill.name, -1)}
                                      >
                                        <ChevronDown className="h-3 w-3" />
                                      </Button>
                                      <div className="w-10 text-center font-mono text-sm">{skill.weight}</div>
                                      <Button
                                        variant="outline"
                                        size="icon"
                                        className="h-7 w-7 bg-transparent"
                                        onClick={() => handleSkillWeightChange(skill.name, 1)}
                                      >
                                        <ChevronUp className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}

                      {/* Weight summary */}
                      <div className="pt-4 border-t">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Weights sum to</span>
                          <span className={`font-bold ${totalWeight === 100 ? "text-green-500" : "text-yellow-500"}`}>
                            {totalWeight}%
                          </span>
                        </div>

                        {/* Visual weight bar */}
                        <div className="mt-2 h-2 rounded-full bg-muted overflow-hidden flex">
                          {extractedSkills.map((skill, i) => (
                            <div
                              key={skill.name}
                              className={`h-full ${
                                i % 6 === 0
                                  ? "bg-blue-500"
                                  : i % 6 === 1
                                    ? "bg-green-500"
                                    : i % 6 === 2
                                      ? "bg-purple-500"
                                      : i % 6 === 3
                                        ? "bg-orange-500"
                                        : i % 6 === 4
                                          ? "bg-pink-500"
                                          : "bg-cyan-500"
                              }`}
                              style={{ width: `${skill.weight}%` }}
                              title={`${skill.name}: ${skill.weight}%`}
                            />
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Compensation Benchmark */}
                  {extractedSkills.length > 0 && (
                    <CompensationBenchmark
                      extractedSkills={extractedSkills.map((s) => s.name)}
                      roleTitle={jobTitle || "Software Engineer"}
                      onBudgetSet={handleBudgetSet}
                    />
                  )}

                  {budget && (
                    <Card className="border-emerald-500/30 bg-emerald-500/5">
                      <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <DollarSign className="h-5 w-5 text-emerald-400" />
                            <span className="font-medium">Budget Set:</span>
                            <span className="text-muted-foreground">
                              {budget.currency} {budget.min.toLocaleString()} - {budget.max.toLocaleString()}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setBudget(null)
                              const existingConfig = localStorage.getItem("forge_job_config")
                              if (existingConfig) {
                                const config = JSON.parse(existingConfig)
                                delete config.budget
                                localStorage.setItem("forge_job_config", JSON.stringify(config))
                              }
                            }}
                          >
                            Clear
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Context Weighting */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Context Weighting</CardTitle>
                      <CardDescription>Adjust how much emphasis to place on soft skills (XS factor)</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex gap-2">
                        {presets.map((preset) => (
                          <Button
                            key={preset.id}
                            variant={activePreset === preset.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePresetClick(preset.id)}
                          >
                            {preset.name}
                          </Button>
                        ))}
                      </div>

                      {Object.entries(weights).map(([trait, value]) => (
                        <div key={trait} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label className="capitalize">{trait}</Label>
                            <span className="text-sm text-muted-foreground">{value}%</span>
                          </div>
                          <Slider
                            value={[value]}
                            onValueChange={(v) => handleWeightChange(trait as keyof typeof weights, v)}
                            max={100}
                            step={1}
                          />
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Gate Threshold slider */}
                  <div className="bg-card border border-border rounded-xl p-4 mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-foreground">Gate Threshold (τ)</label>
                      <span className="text-sm font-mono text-primary">{Math.round(gateThreshold * 100)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Candidates must score ≥ τ on required skills to pass. Lower = more candidates pass.
                    </p>
                    <input
                      type="range"
                      min="0.2"
                      max="0.8"
                      step="0.05"
                      value={gateThreshold}
                      onChange={(e) => {
                        const newTau = Number.parseFloat(e.target.value)
                        setGateThreshold(newTau)
                        saveToLocalStorage(jobTitle, jobDescription, extractedSkills, critique, budget)
                      }}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>20% (lenient)</span>
                      <span>80% (strict)</span>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <Button onClick={handleContinue} className="w-full" size="lg">
                    Continue to Candidates
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </>
              ) : (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Sparkles className="h-12 w-12 text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-medium">No skills extracted yet</h3>
                    <p className="text-muted-foreground mt-1 max-w-sm">
                      Paste a job description and click "Extract Skills" to see intelligent skill analysis with
                      context-aware weighting.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  )
}
