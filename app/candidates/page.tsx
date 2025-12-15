"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AppShell } from "@/components/app-shell"
import { PortfolioAnalyzer } from "@/components/portfolio-analyzer"
import type { PortfolioExtraction } from "@/lib/portfolio-extract"
import {
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  GitBranch,
  Globe,
  Sparkles,
  Shield,
  FileText,
  ChevronDown,
  ChevronUp,
  User,
  Briefcase,
  Palette,
  Users,
  Megaphone,
  Database,
  Settings,
  Upload,
  File,
  AlertTriangle,
  DollarSign,
} from "lucide-react"
import type { RoleType } from "@/lib/types"

interface Candidate {
  id: string
  name: string
  github: string
  portfolio: string
  portfolioExtraction?: PortfolioExtraction
  writingLinks: string[]
  resumeText: string
  resumeMeta?: {
    fileName?: string
    charCount: number
    isLikelyScanned?: boolean
    extractionMethod?: string
    warnings?: string[]
  }
  linkedinText: string
  extracurricularText: string
  status: "missing" | "validating" | "valid" | "invalid" | "warning"
  avatar?: string
  bio?: string
  publicRepos?: number
  followers?: number
  roleType: RoleType
  salaryExpectation?: {
    min?: number
    max?: number
    target?: number
    currency?: string
  }
}

interface PDFDocument {
  numPages: number
  getPage: (num: number) => Promise<PDFPage>
}

interface PDFPage {
  getTextContent: () => Promise<{ items: Array<{ str: string }> }>
}

declare global {
  interface Window {
    pdfjsLib: {
      getDocument: (data: ArrayBuffer) => { promise: Promise<PDFDocument> }
      GlobalWorkerOptions: { workerSrc: string }
    }
  }
}

const ROLE_OPTIONS: { value: RoleType; label: string; icon: React.ReactNode }[] = [
  { value: "engineer", label: "Engineer", icon: <GitBranch className="h-3.5 w-3.5" /> },
  { value: "designer", label: "Designer", icon: <Palette className="h-3.5 w-3.5" /> },
  { value: "pm", label: "PM", icon: <Briefcase className="h-3.5 w-3.5" /> },
  { value: "recruiter", label: "Recruiter", icon: <Users className="h-3.5 w-3.5" /> },
  { value: "marketing", label: "Marketing", icon: <Megaphone className="h-3.5 w-3.5" /> },
  { value: "data", label: "Data", icon: <Database className="h-3.5 w-3.5" /> },
  { value: "ops", label: "Ops", icon: <Settings className="h-3.5 w-3.5" /> },
  { value: "other", label: "Other", icon: <User className="h-3.5 w-3.5" /> },
]

const demoData: Candidate[] = [
  {
    id: "1",
    name: "Sarah Chen",
    github: "sindresorhus",
    portfolio: "https://sindresorhus.com",
    writingLinks: [],
    resumeText: `SARAH CHEN - Senior Software Engineer
5+ years of experience building scalable web applications

EXPERIENCE:
Senior Frontend Engineer | Stripe | 2021-Present
- Led migration from webpack to Vite, reducing build times by 60%
- Built React component library used by 50+ internal teams
- Implemented real-time payment dashboard with TypeScript and WebSockets

Software Engineer | Vercel | 2019-2021
- Core contributor to Next.js framework (500+ commits)
- Designed and shipped Edge Functions feature
- Mentored 3 junior engineers

SKILLS: React, TypeScript, Node.js, GraphQL, PostgreSQL, Redis, Docker

EDUCATION: BS Computer Science, Stanford University`,
    resumeMeta: { charCount: 650, isLikelyScanned: false, extractionMethod: "pdf-parse" },
    linkedinText: "",
    extracurricularText: "",
    status: "validating",
    roleType: "engineer",
  },
  {
    id: "2",
    name: "Alex Rivera",
    github: "",
    portfolio: "https://stripe.com/blog",
    writingLinks: ["https://medium.com/@stripe"],
    resumeText: `ALEX RIVERA - Product Designer
Design systems specialist with 6 years experience

EXPERIENCE:
Senior Product Designer | Figma | 2022-Present
- Created Config design system serving 200+ components
- Led accessibility initiative achieving WCAG AA compliance
- Published Figma Community plugins with 50k+ installs

Product Designer | Notion | 2019-2022
- Designed blocks system UX for templates feature
- Conducted 40+ user research sessions
- Shipped mobile app redesign increasing DAU 25%

SKILLS: Figma, Framer, User Research, Design Systems, Prototyping

PORTFOLIO: https://alexrivera.design (includes all case studies)`,
    resumeMeta: { charCount: 580, isLikelyScanned: false, extractionMethod: "mammoth" },
    linkedinText: "",
    extracurricularText: "Speaker at Config 2024. Created design system used by 50+ engineers.",
    status: "warning",
    roleType: "designer",
  },
  {
    id: "3",
    name: "Jordan Kim",
    github: "",
    portfolio: "",
    writingLinks: [],
    resumeText: "5 years recruiting experience at FAANG. Hired 200+ engineers. Built interview process from scratch.",
    linkedinText: "Talent Acquisition Lead. Specialized in engineering hiring. ATS: Greenhouse, Lever.",
    extracurricularText: "",
    status: "warning",
    roleType: "recruiter",
  },
  {
    id: "4",
    name: "Morgan Lee",
    github: "",
    portfolio: "https://www.intercom.com/blog",
    writingLinks: [],
    resumeText: "",
    linkedinText: "",
    extracurricularText: "Led product launch that grew revenue 40%. Published case study on Product Hunt.",
    status: "warning",
    roleType: "pm",
  },
  {
    id: "5",
    name: "Taylor Swift",
    github: "leerob",
    portfolio: "https://leerob.io",
    writingLinks: [],
    resumeText: "",
    linkedinText: "",
    extracurricularText: "",
    status: "validating",
    roleType: "engineer",
  },
]

const createEmptyCandidate = (): Candidate => ({
  id: Date.now().toString(),
  name: "",
  github: "",
  portfolio: "",
  writingLinks: [],
  resumeText: "",
  linkedinText: "",
  extracurricularText: "",
  status: "missing",
  expanded: false,
  roleType: "engineer",
})

export default function CandidatesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [uploadingResume, setUploadingResume] = useState<string | null>(null)
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false)

  useEffect(() => {
    if (typeof window !== "undefined" && !window.pdfjsLib) {
      const script = document.createElement("script")
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"
      script.onload = () => {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
        setPdfJsLoaded(true)
      }
      document.head.appendChild(script)
    } else if (window.pdfjsLib) {
      setPdfJsLoaded(true)
    }
  }, [])

  const validateCandidates = useCallback(async (candidatesToValidate: Candidate[]) => {
    const githubUsernames = candidatesToValidate
      .filter((c) => c.github && c.status === "validating")
      .map((c) => c.github)

    if (githubUsernames.length === 0) return

    try {
      const response = await fetch("/api/candidates/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: githubUsernames }),
      })

      const data = await response.json()

      if (data.success && data.results) {
        setCandidates((prev) =>
          prev.map((candidate) => {
            const result = data.results.find(
              (r: { username: string }) => r.username.toLowerCase() === candidate.github.toLowerCase(),
            )

            if (result) {
              if (result.valid) {
                return {
                  ...candidate,
                  name: candidate.name || result.name || result.username,
                  avatar: result.avatar,
                  status: "valid" as const,
                  publicRepos: result.publicRepos,
                  followers: result.followers,
                  bio: result.bio,
                }
              } else {
                return { ...candidate, status: "missing" as const }
              }
            }
            return candidate
          }),
        )
      }
    } catch (error) {
      console.error("Validation error:", error)
      setCandidates((prev) => prev.map((c) => (c.status === "validating" ? { ...c, status: "missing" as const } : c)))
    }
  }, [])

  useEffect(() => {
    const validatingCandidates = candidates.filter((c) => c.status === "validating" && c.github)
    if (validatingCandidates.length > 0) {
      const timer = setTimeout(() => validateCandidates(candidates), 500)
      return () => clearTimeout(timer)
    }
  }, [candidates, validateCandidates])

  useEffect(() => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.status === "validating") return c
        if (c.github && c.status === "valid") return c

        const hasSignals =
          c.portfolio || c.writingLinks.length > 0 || c.resumeText || c.linkedinText || c.extracurricularText
        if (hasSignals && !c.github) {
          return { ...c, status: "warning" as const }
        }

        if (c.github && c.status === "missing") {
          return { ...c, status: "validating" as const }
        }

        return c
      }),
    )
  }, [])

  const addCandidate = () => {
    setCandidates([...candidates, createEmptyCandidate()])
  }

  const removeCandidate = (id: string) => {
    setCandidates(candidates.filter((c) => c.id !== id))
  }

  const updateCandidate = (
    id: string,
    field: keyof Candidate,
    value: string | string[] | RoleType | PortfolioExtraction,
  ) => {
    setCandidates(
      candidates.map((c) => {
        if (c.id === id) {
          const updated = { ...c, [field]: value }
          if (field === "github" && value) {
            updated.status = "validating"
          } else if (field === "github" && !value) {
            const hasOtherSignals = c.portfolio || c.writingLinks.length > 0 || c.resumeText || c.linkedinText
            updated.status = hasOtherSignals ? "warning" : "missing"
          }
          return updated
        }
        return c
      }),
    )
  }

  const toggleExpanded = (id: string) => {
    setCandidates(candidates.map((c) => (c.id === id ? { ...c, expanded: !c.expanded } : c)))
  }

  const addWritingLink = (id: string) => {
    setCandidates(
      candidates.map((c) => {
        if (c.id === id && c.writingLinks.length < 3) {
          return { ...c, writingLinks: [...c.writingLinks, ""] }
        }
        return c
      }),
    )
  }

  const updateWritingLink = (id: string, index: number, value: string) => {
    setCandidates(
      candidates.map((c) => {
        if (c.id === id) {
          const newLinks = [...c.writingLinks]
          newLinks[index] = value
          return { ...c, writingLinks: newLinks }
        }
        return c
      }),
    )
  }

  const removeWritingLink = (id: string, index: number) => {
    setCandidates(
      candidates.map((c) => {
        if (c.id === id) {
          const newLinks = c.writingLinks.filter((_, i) => i !== index)
          return { ...c, writingLinks: newLinks }
        }
        return c
      }),
    )
  }

  const extractPdfTextClientSide = async (file: File): Promise<string> => {
    if (!window.pdfjsLib) {
      throw new Error("PDF.js not loaded")
    }

    const arrayBuffer = await file.arrayBuffer()
    const pdf = await window.pdfjsLib.getDocument(arrayBuffer).promise
    const textParts: string[] = []

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items.map((item) => item.str).join(" ")
      textParts.push(pageText)
    }

    return textParts.join("\n\n").trim()
  }

  const handleResumeUpload = async (candidateId: string, file: File) => {
    setUploadingResume(candidateId)

    try {
      if (file.type === "application/pdf") {
        try {
          if (!pdfJsLoaded) {
            await new Promise((resolve) => setTimeout(resolve, 1000))
          }

          const extractedText = await extractPdfTextClientSide(file)

          setCandidates((prev) =>
            prev.map((c) => {
              if (c.id === candidateId) {
                const updated = {
                  ...c,
                  resumeFileName: file.name,
                  resumeMeta: {
                    fileName: file.name,
                    mimeType: file.type,
                    charCount: extractedText.length,
                    isLikelyScanned: extractedText.length < 400,
                    extractionMethod: "pdf-js-client" as const,
                    warnings:
                      extractedText.length < 400
                        ? ["Low text extracted - may be scanned. Consider pasting manually."]
                        : undefined,
                  },
                  resumeText: extractedText,
                }
                const hasSignals =
                  updated.portfolio || updated.writingLinks.length > 0 || updated.resumeText || updated.linkedinText
                if (hasSignals && !updated.github) {
                  updated.status = "warning" as const
                }
                return updated
              }
              return c
            }),
          )

          if (extractedText.length < 400) {
            alert("This PDF has minimal text. If it's scanned, please paste the resume text manually.")
          }
        } catch (pdfError) {
          console.error("Client-side PDF extraction failed:", pdfError)
          alert("Could not extract text from PDF. Please paste the resume text manually in the Resume Text field.")

          setCandidates((prev) =>
            prev.map((c) => {
              if (c.id === candidateId) {
                return {
                  ...c,
                  resumeFileName: file.name,
                  resumeMeta: {
                    fileName: file.name,
                    mimeType: file.type,
                    charCount: 0,
                    isLikelyScanned: true,
                    extractionMethod: "fallback" as const,
                    warnings: ["Extraction failed - please paste text manually"],
                  },
                }
              }
              return c
            }),
          )
        }
      } else {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/resume/extract-text", {
          method: "POST",
          body: formData,
        })

        const data = await response.json()

        setCandidates((prev) =>
          prev.map((c) => {
            if (c.id === candidateId) {
              const updated = {
                ...c,
                resumeFileName: file.name,
                resumeMeta: data.meta,
                resumeText: data.success ? data.text : c.resumeText,
              }
              const hasSignals =
                updated.portfolio || updated.writingLinks.length > 0 || updated.resumeText || updated.linkedinText
              if (hasSignals && !updated.github) {
                updated.status = "warning" as const
              }
              return updated
            }
            return c
          }),
        )

        if (!data.success) {
          alert(data.error || "Failed to extract text from resume")
        }
      }
    } catch (error) {
      console.error("Resume upload error:", error)
      alert("Failed to upload resume. Please try pasting the text instead.")
    } finally {
      setUploadingResume(null)
    }
  }

  const loadDemoData = () => {
    setCandidates(demoData)
  }

  const handleRunAnalysis = async () => {
    setLoading(true)

    try {
      const jobConfigStr = localStorage.getItem("forge_job_config")
      let skills: Array<{
        name: string
        weight: number
        isRequired?: boolean
        importance?: string
        category?: string
      }> = [
        { name: "React", weight: 30, isRequired: true },
        { name: "TypeScript", weight: 25, isRequired: true },
        { name: "Node.js", weight: 20, isRequired: true },
        { name: "System Design", weight: 15, isRequired: false },
        { name: "Testing", weight: 10, isRequired: false },
      ]
      let jobTitle = "Software Engineer"
      let jobDescription = ""
      let gateThreshold = 0.4

      if (jobConfigStr) {
        try {
          const jobConfig = JSON.parse(jobConfigStr)
          if (jobConfig.skills?.length > 0) {
            skills = jobConfig.skills.map((s: any) => ({
              name: s.name,
              weight: s.weight,
              isRequired: s.isRequired ?? (s.importance === "core" || s.importance === "required"),
              importance: s.importance,
              category: s.category,
            }))
          }
          if (jobConfig.title) jobTitle = jobConfig.title
          if (jobConfig.description) jobDescription = jobConfig.description
          if (jobConfig.gateThreshold !== undefined) gateThreshold = jobConfig.gateThreshold
          if (jobConfig.budget?.gateThreshold !== undefined) gateThreshold = jobConfig.budget.gateThreshold
        } catch (e) {
          console.error("Failed to parse job config:", e)
        }
      }

      const candidateInputs = candidates
        .filter((c) => c.status === "valid" || c.status === "warning")
        .map((c) => ({
          id: c.id,
          name: c.name || c.github || "Unknown",
          roleType: c.roleType,
          github: c.github || undefined,
          salaryExpectation: c.salaryExpectation,
          signals: {
            githubUsername: c.github || undefined,
            portfolioUrl: c.portfolio || undefined,
            writingLinks: c.writingLinks.filter((l) => l) || undefined,
            resumeText: c.resumeText || undefined,
            linkedinText: c.linkedinText || undefined,
            extracurricularText: c.extracurricularText || undefined,
          },
        }))

      if (candidateInputs.length === 0) {
        alert("No valid candidates to analyze")
        setLoading(false)
        return
      }

      const parsedJobConfig = jobConfigStr ? JSON.parse(jobConfigStr) : {}

      const response = await fetch("/api/candidates/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          skills,
          candidates: candidateInputs,
          job: { title: jobTitle, description: jobDescription },
          tau: gateThreshold,
          jobConfig: {
            ...parsedJobConfig,
            roleTitle: jobTitle,
            gateThreshold,
          },
        }),
      })

      const data = await response.json()

      if (data.success && data.candidates) {
        localStorage.setItem("forge_analysis", JSON.stringify(data))
        localStorage.setItem("forge_candidate_pool", JSON.stringify(candidates))
        router.push("/results")
      } else {
        alert(data.error || "Analysis failed")
        setLoading(false)
      }
    } catch (error) {
      console.error("Analysis error:", error)
      alert("Failed to analyze candidates. Please try again.")
      setLoading(false)
    }
  }

  const validCount = candidates.filter((c) => c.status === "valid").length
  const warningCount = candidates.filter((c) => c.status === "warning").length
  const validatingCount = candidates.filter((c) => c.status === "validating").length
  const canAnalyze = validCount + warningCount > 0 && validatingCount === 0

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Step 2 of 3</p>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Add candidates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Engineers need GitHub. Other roles use portfolio, writing, or resume signals.
            </p>
          </div>
          <Button
            onClick={loadDemoData}
            variant="outline"
            size="sm"
            className="border-border hover:bg-surface bg-transparent"
          >
            <Sparkles className="mr-2 h-3.5 w-3.5 text-primary" />
            Load demo candidates
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="bg-card border border-border rounded-lg p-3 mb-5 flex items-center gap-5 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">{candidates.length}</span>
            <span className="text-muted-foreground">candidates</span>
          </div>
          {validCount > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <CheckCircle className="h-3.5 w-3.5 text-success" />
                <span className="text-muted-foreground">{validCount} GitHub verified</span>
              </div>
            </>
          )}
          {warningCount > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <AlertCircle className="h-3.5 w-3.5 text-warning" />
                <span className="text-muted-foreground">{warningCount} non-GitHub (lower confidence)</span>
              </div>
            </>
          )}
          {validatingCount > 0 && (
            <>
              <div className="h-4 w-px bg-border" />
              <div className="flex items-center gap-1.5">
                <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                <span className="text-muted-foreground">{validatingCount} validating...</span>
              </div>
            </>
          )}
        </div>

        {/* Candidate Cards */}
        <div className="space-y-4 mb-6">
          {candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onUpdate={updateCandidate}
              onRemove={removeCandidate}
              onToggleExpanded={toggleExpanded}
              onAddWritingLink={addWritingLink}
              onUpdateWritingLink={updateWritingLink}
              onRemoveWritingLink={removeWritingLink}
              onResumeUpload={handleResumeUpload}
              isUploadingResume={uploadingResume === candidate.id}
              candidates={candidates}
              setCandidates={setCandidates}
            />
          ))}
        </div>

        {/* Add Candidate Button */}
        <Button
          onClick={addCandidate}
          variant="outline"
          className="w-full border-dashed border-border hover:bg-surface bg-transparent"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add candidate
        </Button>

        {/* Footer */}
        <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
          <Link href="/job">
            <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to job
            </Button>
          </Link>

          <Button
            onClick={handleRunAnalysis}
            disabled={!canAnalyze || loading}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Run FORGE analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </AppShell>
  )
}

function CandidateCard({
  candidate,
  onUpdate,
  onRemove,
  onToggleExpanded,
  onAddWritingLink,
  onUpdateWritingLink,
  onRemoveWritingLink,
  onResumeUpload,
  isUploadingResume,
  candidates,
  setCandidates,
}: {
  candidate: Candidate
  onUpdate: (id: string, field: keyof Candidate, value: string | string[] | RoleType | PortfolioExtraction) => void
  onRemove: (id: string) => void
  onToggleExpanded: (id: string) => void
  onAddWritingLink: (id: string) => void
  onUpdateWritingLink: (id: string, index: number, value: string) => void
  onRemoveWritingLink: (id: string, index: number) => void
  onResumeUpload: (id: string, file: File) => void
  isUploadingResume: boolean
  candidates: Candidate[]
  setCandidates: React.Dispatch<React.SetStateAction<Candidate[]>>
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onResumeUpload(candidate.id, file)
    }
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header Row */}
      <div className="grid grid-cols-[40px,1fr,140px,1fr,1fr,40px,40px] gap-3 px-4 py-3 items-center">
        <div>
          {candidate.status === "valid" && <CheckCircle className="h-5 w-5 text-success" />}
          {candidate.status === "validating" && <Loader2 className="h-5 w-5 text-primary animate-spin" />}
          {candidate.status === "warning" && <AlertCircle className="h-5 w-5 text-warning" />}
          {candidate.status === "missing" && <AlertCircle className="h-5 w-5 text-muted-foreground/50" />}
        </div>

        <div className="flex items-center gap-2">
          {candidate.avatar && (
            <img src={candidate.avatar || "/placeholder.svg"} alt={candidate.name} className="h-7 w-7 rounded-full" />
          )}
          <Input
            value={candidate.name}
            onChange={(e) => onUpdate(candidate.id, "name", e.target.value)}
            placeholder="Name"
            className="bg-transparent border-none h-8 px-0 text-sm font-medium focus-visible:ring-0"
          />
        </div>

        <div>
          <select
            value={candidate.roleType}
            onChange={(e) => onUpdate(candidate.id, "roleType", e.target.value as RoleType)}
            className="w-full bg-surface border border-border rounded-lg h-8 px-2 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            value={candidate.github}
            onChange={(e) => onUpdate(candidate.id, "github", e.target.value)}
            placeholder={candidate.roleType === "engineer" ? "username (required)" : "username (optional)"}
            className="bg-transparent border-none h-8 px-0 text-xs focus-visible:ring-0"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            value={candidate.portfolio}
            onChange={(e) => onUpdate(candidate.id, "portfolio", e.target.value)}
            placeholder="Portfolio URL"
            className="bg-transparent border-none h-8 px-0 text-xs focus-visible:ring-0"
          />
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onToggleExpanded(candidate.id)}
          className="h-8 w-8 hover:bg-surface"
        >
          {candidate.expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onRemove(candidate.id)}
          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {candidate.expanded && (
        <div className="px-4 py-4 border-t border-border bg-surface/30 space-y-4">
          {/* Resume Upload Section */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Resume (PDF/DOCX)</label>
            <div className="space-y-2">
              {/* Upload button and status */}
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingResume}
                  className="h-8 text-xs"
                >
                  {isUploadingResume ? (
                    <>
                      <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-1.5 h-3 w-3" />
                      Upload resume
                    </>
                  )}
                </Button>

                {candidate.resumeFileName && (
                  <div className="flex items-center gap-2 text-xs">
                    <File className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-muted-foreground">{candidate.resumeFileName}</span>
                    {candidate.resumeMeta && (
                      <>
                        {candidate.resumeMeta.isLikelyScanned ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-warning/20 text-warning text-xs">
                            <AlertTriangle className="h-3 w-3" />
                            Scanned? Paste text
                          </span>
                        ) : candidate.resumeMeta.charCount > 400 ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-success/20 text-success text-xs">
                            <CheckCircle className="h-3 w-3" />
                            Extracted
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs">
                            Low text
                          </span>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Paste fallback */}
              <Textarea
                value={candidate.resumeText}
                onChange={(e) => onUpdate(candidate.id, "resumeText", e.target.value)}
                placeholder="Or paste resume text here..."
                className="min-h-[100px] text-xs bg-background resize-y"
              />
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3" />
                We only use what you provide. No scraping. Proof tiers apply.
              </p>
            </div>
          </div>

          {/* Portfolio Analyzer */}
          {candidate.portfolio && (
            <div className="space-y-3">
              <PortfolioAnalyzer
                url={candidate.portfolio}
                onExtracted={(extraction) => onUpdate(candidate.id, "portfolioExtraction", extraction)}
              />
            </div>
          )}

          {/* Writing Links */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Writing Links (up to 3)</label>
            <div className="space-y-2">
              {candidate.writingLinks.map((link, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <Input
                    value={link}
                    onChange={(e) => onUpdateWritingLink(candidate.id, idx, e.target.value)}
                    placeholder="https://..."
                    className="h-8 text-xs bg-background"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveWritingLink(candidate.id, idx)}
                    className="h-7 w-7 hover:bg-destructive/10"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
              {candidate.writingLinks.length < 3 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddWritingLink(candidate.id)}
                  className="h-7 text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" /> Add writing link
                </Button>
              )}
            </div>
          </div>

          {/* LinkedIn Text */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">LinkedIn Text (paste only)</label>
            <Textarea
              value={candidate.linkedinText}
              onChange={(e) => onUpdate(candidate.id, "linkedinText", e.target.value)}
              placeholder="Paste LinkedIn about section or experience..."
              className="min-h-[60px] text-xs bg-background resize-y"
            />
          </div>

          {/* Extracurricular */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Extracurricular / Side Projects
            </label>
            <Textarea
              value={candidate.extracurricularText}
              onChange={(e) => onUpdate(candidate.id, "extracurricularText", e.target.value)}
              placeholder="Speaking engagements, open source, community work..."
              className="min-h-[60px] text-xs bg-background resize-y"
            />
          </div>

          {/* Salary Expectation */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Salary Expectation (optional)
            </label>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Input
                  type="number"
                  placeholder="Min"
                  value={candidate.salaryExpectation?.min || ""}
                  onChange={(e) => {
                    const newCandidates = [...candidates]
                    const idx = newCandidates.findIndex((c) => c.id === candidate.id)
                    if (idx >= 0) {
                      newCandidates[idx] = {
                        ...newCandidates[idx],
                        salaryExpectation: {
                          ...newCandidates[idx].salaryExpectation,
                          min: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        },
                      }
                      setCandidates(newCandidates)
                    }
                  }}
                  className="bg-background/50"
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Target"
                  value={candidate.salaryExpectation?.target || ""}
                  onChange={(e) => {
                    const newCandidates = [...candidates]
                    const idx = newCandidates.findIndex((c) => c.id === candidate.id)
                    if (idx >= 0) {
                      newCandidates[idx] = {
                        ...newCandidates[idx],
                        salaryExpectation: {
                          ...newCandidates[idx].salaryExpectation,
                          target: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        },
                      }
                      setCandidates(newCandidates)
                    }
                  }}
                  className="bg-background/50"
                />
              </div>
              <div>
                <Input
                  type="number"
                  placeholder="Max"
                  value={candidate.salaryExpectation?.max || ""}
                  onChange={(e) => {
                    const newCandidates = [...candidates]
                    const idx = newCandidates.findIndex((c) => c.id === candidate.id)
                    if (idx >= 0) {
                      newCandidates[idx] = {
                        ...newCandidates[idx],
                        salaryExpectation: {
                          ...newCandidates[idx].salaryExpectation,
                          max: e.target.value ? Number.parseInt(e.target.value) : undefined,
                        },
                      }
                      setCandidates(newCandidates)
                    }
                  }}
                  className="bg-background/50"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
