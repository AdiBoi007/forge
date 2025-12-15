"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { AppShell } from "@/components/app-shell"
import {
  ArrowRight,
  Play,
  Upload,
  Loader2,
  Check,
  ShieldCheck,
  FileText,
  MessageSquare,
  XCircle,
  ChevronDown,
  ChevronUp,
  Zap,
  GitBranch,
  Brain,
} from "lucide-react"
import { Pie, PieChart, Cell, XAxis, YAxis, Line, LineChart } from "recharts"
import { ChartContainer } from "@/components/ui/chart"
import { writePitchSeedToLocalStorage, PITCH_CANDIDATES } from "@/lib/pitch"
import { ImportModal } from "@/components/import-modal"
import { SEED_OUTCOMES_META } from "@/lib/ml/seed-outcomes"
import { GuidedDemoOverlay, type DemoStep } from "@/components/guided-demo-overlay"
import { generateDemoSteps, writeDemoDataToLocalStorage, DEMO_CANDIDATES_FULL } from "@/lib/demo-seed"

const funnelData = [
  { name: "Intake", value: 127, fill: "#ffffff" },
  { name: "Verified Evidence", value: 84, fill: "#cccccc" },
  { name: "τ Gate Pass", value: 52, fill: "#999999" },
  { name: "Shortlist", value: 18, fill: "#666666" },
]

const proofMixData = [
  { name: "GitHub", value: 42, fill: "#ffffff" },
  { name: "Portfolio", value: 18, fill: "#cccccc" },
  { name: "Writing", value: 12, fill: "#999999" },
  { name: "LinkedIn", value: 15, fill: "#777777" },
  { name: "Resume", value: 10, fill: "#555555" },
  { name: "Other", value: 3, fill: "#333333" },
]

const calibrationData = [
  { stage: "Pre", confidence: 62 },
  { stage: "12 labels", confidence: 71 },
  { stage: "24 labels", confidence: 79 },
  { stage: "Post", confidence: 86 },
]

const chartConfig = {
  traditional: { label: "Traditional", color: "#444444" },
  forge: { label: "FORGE", color: "#ffffff" },
  value: { label: "Value", color: "#ffffff" },
  confidence: { label: "Confidence", color: "#ffffff" },
}

const PITCH_STEPS = [
  { label: "Loading demo role", done: false },
  { label: "Validating candidates", done: false },
  { label: "Analyzing GitHub profiles", done: false },
  { label: "Scoring & ranking", done: false },
  { label: "Opening cockpit", done: false },
]

const PIPELINE_STEPS = [
  { label: "Extract Skills", icon: FileText },
  { label: "τ Gate", icon: ShieldCheck },
  { label: "CS × XS", icon: Zap },
  { label: "Interview Pack", icon: MessageSquare },
]

const OUTPUTS = [
  {
    label: "Ranked Decision List",
    description: "Candidates sorted by FORGE_SCORE with verdicts",
    contents: "Score, CS, XS, verdict, confidence",
  },
  {
    label: "Evidence Receipts",
    description: "Proof-tier tagged links to real work",
    contents: "GitHub repos, portfolios, writing samples",
  },
  {
    label: "Interview Pack",
    description: "Tailored questions per candidate",
    contents: "15/30/60-min plans, probes, mini-tasks",
  },
  {
    label: "Why Not Hired Report",
    description: "Actionable feedback for τ-filtered",
    contents: "Missing proof, next artifacts needed",
  },
  {
    label: "Shareable Hiring Packet",
    description: "One-click export for team review",
    contents: "PDF/JSON with full analysis",
  },
]

export default function LandingPage() {
  const router = useRouter()
  const [isPitchRunning, setIsPitchRunning] = useState(false)
  const [pitchStep, setPitchStep] = useState(0)
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [showExample, setShowExample] = useState(false)
  const [activePipelineStep, setActivePipelineStep] = useState(0)
  const [showGuidedDemo, setShowGuidedDemo] = useState(false)
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([])

  useState(() => {
    const interval = setInterval(() => {
      setActivePipelineStep((prev) => (prev + 1) % 4)
    }, 2000)
    return () => clearInterval(interval)
  })

  const handleRunPitchDemo = async () => {
    setIsPitchRunning(true)
    setPitchStep(0)

    try {
      writePitchSeedToLocalStorage("frontend")
      setPitchStep(1)
      await new Promise((r) => setTimeout(r, 500))

      setPitchStep(2)
      const validateRes = await fetch("/api/candidates/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usernames: PITCH_CANDIDATES }),
      })
      await validateRes.json()
      await new Promise((r) => setTimeout(r, 300))

      setPitchStep(3)
      const jobConfig = JSON.parse(localStorage.getItem("forge_job_config") || "{}")
      const analyzeRes = await fetch("/api/candidates/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: PITCH_CANDIDATES,
          skills: jobConfig.skills || [],
        }),
      })
      const analysisData = await analyzeRes.json()

      if (analysisData.success) {
        localStorage.setItem(
          "forge_analysis",
          JSON.stringify({
            candidates: analysisData.candidates,
            meta: { mode: "live", analyzedAt: new Date().toISOString() },
          }),
        )
      }

      setPitchStep(4)
      await new Promise((r) => setTimeout(r, 300))

      router.push("/results")
    } catch (error) {
      console.error("Pitch demo failed:", error)
      router.push("/results")
    }
  }

  const handleImportSuccess = () => {
    router.push("/results")
  }

  const handleRunGuidedDemo = () => {
    // Generate demo steps with action handlers
    const steps = generateDemoSteps({
      loadJobDescription: async () => {
        writeDemoDataToLocalStorage()
        await new Promise((r) => setTimeout(r, 500))
      },
      extractSkills: async () => {
        // Skills are already in the demo config
        await new Promise((r) => setTimeout(r, 500))
      },
      showCompBenchmark: async () => {
        await new Promise((r) => setTimeout(r, 500))
      },
      loadCandidates: async () => {
        localStorage.setItem("forge_candidates", JSON.stringify(DEMO_CANDIDATES_FULL))
        await new Promise((r) => setTimeout(r, 500))
      },
      runAnalysis: async () => {
        // Simulate analysis with pre-computed results
        const mockResults = [
          {
            id: "demo-elena",
            name: "Elena Rodriguez",
            github: "elenarodriguez",
            finalScore: 78,
            capabilityScore: 0.82,
            contextScore: 0.88,
            forgeScore: 0.78,
            gateStatus: "ranked",
            verdict: "Strong Hire",
            proofConfidence: 92,
            compFit: { status: "in-band", label: "In Band", xsMultiplier: 1.02 },
            capability: {
              score: 82,
              skills: [
                { name: "React", score: 95, weight: 18, status: "Proven", evidenceTier: "owned" },
                { name: "TypeScript", score: 90, weight: 16, status: "Proven", evidenceTier: "owned" },
                { name: "Next.js", score: 85, weight: 12, status: "Proven", evidenceTier: "major" },
                { name: "Testing", score: 88, weight: 10, status: "Proven", evidenceTier: "owned" },
                { name: "Performance", score: 92, weight: 10, status: "Proven", evidenceTier: "owned" },
                { name: "Accessibility", score: 85, weight: 8, status: "Proven", evidenceTier: "major" },
                { name: "CI/CD", score: 75, weight: 8, status: "Proven", evidenceTier: "major" },
                { name: "GraphQL", score: 80, weight: 6, status: "Proven", evidenceTier: "major" },
                { name: "Design Systems", score: 95, weight: 6, status: "Proven", evidenceTier: "owned" },
                { name: "Mentorship", score: 90, weight: 6, status: "Proven", evidenceTier: "major" },
              ],
            },
            context: {
              teamwork: { score: 90, raw: 90 },
              communication: { score: 88, raw: 88 },
              adaptability: { score: 85, raw: 85 },
              ownership: { score: 92, raw: 92 },
            },
            explanations: {
              topReasons: [
                "Verified React design system at Meta (200+ engineers)",
                "60% FCP improvement with metrics",
                "Published at React Conf 2023",
                "Strong mentorship track record (3 promotions)",
              ],
              risks: ["May be overqualified for mid-stage startup"],
            },
            evidence: [
              {
                skill: "React",
                snippet: "Architected React-based design system serving 200+ engineers",
                source: "Resume",
                proofTier: "owned",
                impact: "high",
              },
            ],
          },
          {
            id: "demo-sarah",
            name: "Sarah Chen",
            github: "sarahchen-dev",
            finalScore: 62,
            capabilityScore: 0.72,
            contextScore: 0.78,
            forgeScore: 0.62,
            gateStatus: "ranked",
            verdict: "Hire",
            proofConfidence: 85,
            compFit: { status: "in-band", label: "In Band", xsMultiplier: 1.02 },
            capability: {
              score: 72,
              skills: [
                { name: "React", score: 85, weight: 18, status: "Proven", evidenceTier: "owned" },
                { name: "TypeScript", score: 80, weight: 16, status: "Proven", evidenceTier: "owned" },
                { name: "Next.js", score: 75, weight: 12, status: "Proven", evidenceTier: "major" },
                { name: "Testing", score: 82, weight: 10, status: "Proven", evidenceTier: "owned" },
                { name: "Performance", score: 78, weight: 10, status: "Proven", evidenceTier: "major" },
                { name: "Accessibility", score: 70, weight: 8, status: "Weak", evidenceTier: "minor" },
                { name: "CI/CD", score: 72, weight: 8, status: "Proven", evidenceTier: "major" },
                { name: "GraphQL", score: 45, weight: 6, status: "Weak", evidenceTier: "inferred" },
                { name: "Design Systems", score: 55, weight: 6, status: "Weak", evidenceTier: "minor" },
                { name: "Mentorship", score: 70, weight: 6, status: "Proven", evidenceTier: "major" },
              ],
            },
            context: {
              teamwork: { score: 80, raw: 80 },
              communication: { score: 75, raw: 75 },
              adaptability: { score: 78, raw: 78 },
              ownership: { score: 82, raw: 82 },
            },
            explanations: {
              topReasons: [
                "Led Stripe Dashboard redesign with 40% load time improvement",
                "Component library with 95% test coverage",
                "Mentored 4 junior engineers",
              ],
              risks: ["GraphQL experience is weak (inferred only)", "Design systems depth unclear"],
            },
            evidence: [
              {
                skill: "React",
                snippet: "Led redesign of Stripe Dashboard using React 18",
                source: "Resume",
                proofTier: "owned",
                impact: "high",
              },
            ],
          },
          {
            id: "demo-priya",
            name: "Priya Sharma",
            github: "priyasharma-dev",
            finalScore: 45,
            capabilityScore: 0.88,
            contextScore: 0.72, // Reduced by comp fit penalty
            forgeScore: 0.45,
            gateStatus: "ranked",
            verdict: "Possible",
            proofConfidence: 88,
            compFit: { status: "way-above", label: "Way Above", xsMultiplier: 0.92 },
            capability: {
              score: 88,
              skills: [
                { name: "React", score: 98, weight: 18, status: "Proven", evidenceTier: "owned" },
                { name: "TypeScript", score: 95, weight: 16, status: "Proven", evidenceTier: "owned" },
                { name: "Next.js", score: 90, weight: 12, status: "Proven", evidenceTier: "owned" },
                { name: "Testing", score: 92, weight: 10, status: "Proven", evidenceTier: "owned" },
                { name: "Performance", score: 95, weight: 10, status: "Proven", evidenceTier: "owned" },
                { name: "Accessibility", score: 90, weight: 8, status: "Proven", evidenceTier: "owned" },
                { name: "CI/CD", score: 85, weight: 8, status: "Proven", evidenceTier: "major" },
                { name: "GraphQL", score: 95, weight: 6, status: "Proven", evidenceTier: "owned" },
                { name: "Design Systems", score: 88, weight: 6, status: "Proven", evidenceTier: "major" },
                { name: "Mentorship", score: 85, weight: 6, status: "Proven", evidenceTier: "major" },
              ],
            },
            context: {
              teamwork: { score: 75, raw: 82 },
              communication: { score: 72, raw: 78 },
              adaptability: { score: 70, raw: 76 },
              ownership: { score: 78, raw: 85 },
            },
            explanations: {
              topReasons: [
                "Principal Engineer at Netflix (200M+ users)",
                "GraphQL federation handling 10B+ queries/day",
                "Exceptional technical depth across all skills",
              ],
              risks: [
                "COMP MISMATCH: Asking $265k vs $240k max (-8% XS penalty)",
                "May be overqualified and leave quickly",
              ],
            },
            evidence: [
              {
                skill: "React",
                snippet: "Led frontend architecture for Netflix streaming platform",
                source: "Resume",
                proofTier: "owned",
                impact: "high",
              },
            ],
          },
          {
            id: "demo-marcus",
            name: "Marcus Johnson",
            github: "marcusj-code",
            finalScore: 28,
            capabilityScore: 0.32,
            contextScore: 0.45,
            forgeScore: 0.28,
            gateStatus: "filtered",
            verdict: "No Hire",
            proofConfidence: 35,
            compFit: { status: "in-band", label: "In Band", xsMultiplier: 1.0 },
            capability: {
              score: 32,
              skills: [
                { name: "React", score: 45, weight: 18, status: "Weak", evidenceTier: "minor" },
                { name: "TypeScript", score: 0, weight: 16, status: "Missing", evidenceTier: "none" },
                { name: "Next.js", score: 15, weight: 12, status: "Missing", evidenceTier: "inferred" },
                { name: "Testing", score: 0, weight: 10, status: "Missing", evidenceTier: "none" },
                { name: "Performance", score: 10, weight: 10, status: "Missing", evidenceTier: "inferred" },
                { name: "Accessibility", score: 5, weight: 8, status: "Missing", evidenceTier: "none" },
                { name: "CI/CD", score: 0, weight: 8, status: "Missing", evidenceTier: "none" },
                { name: "GraphQL", score: 0, weight: 6, status: "Missing", evidenceTier: "none" },
                { name: "Design Systems", score: 0, weight: 6, status: "Missing", evidenceTier: "none" },
                { name: "Mentorship", score: 0, weight: 6, status: "Missing", evidenceTier: "none" },
              ],
            },
            context: {
              teamwork: { score: 40, raw: 40 },
              communication: { score: 35, raw: 35 },
              adaptability: { score: 50, raw: 50 },
              ownership: { score: 55, raw: 55 },
            },
            explanations: {
              topReasons: [],
              risks: [
                "NO TypeScript proof (core requirement)",
                "NO Testing evidence",
                "Vague experience descriptions ('worked on improving UI')",
                "Only 15% of claimed skills verifiable",
              ],
            },
            whyNotHired: {
              summary: "Missing proof on 7 of 10 required skills. Only 32% capability score vs 40% gate requirement.",
              missingProof: [
                {
                  skill: "TypeScript",
                  currentScore: 0,
                  gap: 40,
                  artifact: "Ship a TypeScript project with proper types",
                },
                { skill: "Testing", currentScore: 0, gap: 40, artifact: "Add Jest tests to an existing project" },
                { skill: "CI/CD", currentScore: 0, gap: 30, artifact: "Set up GitHub Actions for a repo" },
              ],
              nextSteps: [
                "Convert a JavaScript project to TypeScript",
                "Add comprehensive test coverage (aim for 80%+)",
                "Set up CI/CD pipeline with automated tests",
                "Document your work with detailed READMEs",
              ],
              estimatedTime: "3-6 months with focused effort",
              encouragement: "Your React foundation is there. Focus on TypeScript and testing to level up.",
            },
            evidence: [
              {
                skill: "React",
                snippet: "Developed web applications using React",
                source: "Resume",
                proofTier: "inferred",
                impact: "low",
              },
            ],
          },
          {
            id: "demo-alex",
            name: "Alex Rivera",
            github: "alexrivera-ux",
            finalScore: 22,
            capabilityScore: 0.25,
            contextScore: 0.55,
            forgeScore: 0.22,
            gateStatus: "filtered",
            verdict: "No Hire",
            proofConfidence: 40,
            compFit: { status: "in-band", label: "In Band", xsMultiplier: 1.0 },
            capability: {
              score: 25,
              skills: [
                { name: "React", score: 25, weight: 18, status: "Weak", evidenceTier: "inferred" },
                { name: "TypeScript", score: 0, weight: 16, status: "Missing", evidenceTier: "none" },
                { name: "Next.js", score: 0, weight: 12, status: "Missing", evidenceTier: "none" },
                { name: "Testing", score: 0, weight: 10, status: "Missing", evidenceTier: "none" },
                { name: "Performance", score: 20, weight: 10, status: "Weak", evidenceTier: "inferred" },
                { name: "Accessibility", score: 75, weight: 8, status: "Proven", evidenceTier: "major" },
                { name: "CI/CD", score: 0, weight: 8, status: "Missing", evidenceTier: "none" },
                { name: "GraphQL", score: 0, weight: 6, status: "Missing", evidenceTier: "none" },
                { name: "Design Systems", score: 85, weight: 6, status: "Proven", evidenceTier: "owned" },
                { name: "Mentorship", score: 0, weight: 6, status: "Missing", evidenceTier: "none" },
              ],
            },
            context: {
              teamwork: { score: 60, raw: 60 },
              communication: { score: 65, raw: 65 },
              adaptability: { score: 50, raw: 50 },
              ownership: { score: 45, raw: 45 },
            },
            explanations: {
              topReasons: ["Strong design systems background (Figma)", "Good accessibility knowledge"],
              risks: [
                "ROLE MISMATCH: Designer applying to Frontend Engineer",
                "Missing core engineering skills (TypeScript, Testing)",
                "Basic React only ('Basic React' on resume)",
              ],
            },
            whyNotHired: {
              summary:
                "Role mismatch: Designer profile for Frontend Engineer position. Missing 6 of 10 core engineering skills.",
              missingProof: [
                {
                  skill: "TypeScript",
                  currentScore: 0,
                  gap: 40,
                  artifact: "Learn TypeScript and build a typed React app",
                },
                { skill: "Testing", currentScore: 0, gap: 40, artifact: "Learn Jest and React Testing Library" },
                { skill: "Next.js", currentScore: 0, gap: 40, artifact: "Build a Next.js application" },
              ],
              nextSteps: [
                "Consider applying for Design Engineer or Frontend Designer roles instead",
                "If pivoting to engineering: complete a frontend bootcamp",
                "Build 2-3 TypeScript React projects",
              ],
              estimatedTime: "6-12 months for full transition to engineering",
              encouragement:
                "Your design skills are valuable! Consider hybrid Design Engineer roles that leverage both skillsets.",
            },
            evidence: [
              {
                skill: "Design Systems",
                snippet: "Led design system for Figma's developer tools",
                source: "Resume",
                proofTier: "major",
                impact: "high",
              },
              {
                skill: "Accessibility",
                snippet: "Created accessibility guidelines",
                source: "Resume",
                proofTier: "major",
                impact: "medium",
              },
            ],
          },
        ]

        localStorage.setItem(
          "forge_analysis",
          JSON.stringify({
            candidates: mockResults,
            meta: { mode: "demo", analyzedAt: new Date().toISOString() },
          }),
        )
        await new Promise((r) => setTimeout(r, 1000))
      },
      navigateToResults: async () => {
        // Will navigate after demo completes
        await new Promise((r) => setTimeout(r, 500))
      },
      selectCandidate: async (id: string) => {
        // Handled in results page
        await new Promise((r) => setTimeout(r, 300))
      },
      showEvidenceTab: async () => {
        await new Promise((r) => setTimeout(r, 300))
      },
      showWhyNotHired: async () => {
        await new Promise((r) => setTimeout(r, 300))
      },
      showCompFit: async () => {
        await new Promise((r) => setTimeout(r, 300))
      },
      showInterviewPack: async () => {
        await new Promise((r) => setTimeout(r, 300))
      },
    })

    setDemoSteps(steps)
    setShowGuidedDemo(true)
  }

  const handleDemoComplete = () => {
    setShowGuidedDemo(false)
    router.push("/results")
  }

  return (
    <AppShell>
      <GuidedDemoOverlay
        isOpen={showGuidedDemo}
        onClose={() => setShowGuidedDemo(false)}
        steps={demoSteps}
        onDemoComplete={handleDemoComplete}
      />

      {/* Pitch Demo Overlay */}
      {isPitchRunning && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-8">
              <Image
                src="/forge-logo.png"
                alt="FORGE"
                width={80}
                height={80}
                className="mx-auto rounded-3xl shadow-2xl mb-6"
              />
              <h2 className="text-2xl font-black text-foreground mb-2">Running Pitch Demo</h2>
              <p className="text-muted-foreground font-bold">Analyzing real GitHub profiles...</p>
            </div>

            <div className="space-y-3 text-left">
              {PITCH_STEPS.map((step, i) => (
                <div
                  key={step.label}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    i < pitchStep
                      ? "bg-success/10 text-success"
                      : i === pitchStep
                        ? "bg-foreground/10 text-foreground"
                        : "bg-muted/30 text-muted-foreground"
                  }`}
                >
                  {i < pitchStep ? (
                    <div className="h-5 w-5 rounded-full bg-success flex items-center justify-center">
                      <Check className="h-3 w-3 text-background" />
                    </div>
                  ) : i === pitchStep ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-current" />
                  )}
                  <span className="font-bold">{step.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <ImportModal open={importModalOpen} onOpenChange={setImportModalOpen} onSuccess={handleImportSuccess} />

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION A — HERO
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="relative mx-auto max-w-7xl px-8 pt-28 pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left side - Content */}
          <div className="space-y-8">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl overflow-hidden shadow-2xl shadow-foreground/20 ring-4 ring-foreground/10">
                <Image
                  src="/forge-logo.png"
                  alt="FORGE"
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-3xl font-black tracking-tighter text-foreground">FORGE</span>
            </div>

            <div className="space-y-5">
              <h1 className="text-5xl sm:text-6xl font-black tracking-tighter text-foreground leading-[0.95] text-balance">
                Hire based on proof.
              </h1>

              <p className="text-lg text-foreground/70 max-w-lg leading-relaxed font-bold text-pretty">
                FORGE turns resumes into receipts. It gates candidates by verified capability, then ranks by context +
                outcomes calibration.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={handleRunGuidedDemo}
                disabled={isPitchRunning || showGuidedDemo}
                className="bg-foreground hover:bg-foreground/90 text-background font-black px-8 h-13 rounded-2xl text-base shadow-2xl shadow-foreground/30 transition-all hover:scale-105 ring-4 ring-foreground/20"
              >
                <Play className="mr-2 h-5 w-5" />
                Run guided demo
              </Button>
              <Link href="/job">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-3 border-border hover:border-foreground/50 font-black px-8 h-13 rounded-2xl text-base bg-transparent"
                >
                  Start from scratch
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10 border border-success/30">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="text-xs font-bold text-success">GitHub LIVE</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/10 border border-foreground/20">
                <GitBranch className="h-3 w-3 text-foreground/70" />
                <span className="text-xs font-bold text-foreground/70">Multi-signal</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/10 border border-foreground/20">
                <Brain className="h-3 w-3 text-foreground/70" />
                <span className="text-xs font-bold text-foreground/70">Outcome Calibration</span>
              </div>
            </div>

            <Button
              variant="ghost"
              onClick={() => setImportModalOpen(true)}
              className="text-muted-foreground hover:text-foreground font-bold"
            >
              <Upload className="mr-2 h-4 w-4" />
              Import existing analysis
            </Button>
          </div>

          {/* Right side - Animated Pipeline Card */}
          <div className="bg-card border-3 border-border/60 rounded-3xl p-8 shadow-2xl">
            <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em] mb-6">FORGE Pipeline</p>

            <div className="flex items-center justify-between gap-2">
              {PIPELINE_STEPS.map((step, i) => {
                const Icon = step.icon
                const isActive = i === activePipelineStep
                const isPast = i < activePipelineStep

                return (
                  <div key={step.label} className="flex-1 flex flex-col items-center">
                    <div
                      className={`h-16 w-16 rounded-2xl flex items-center justify-center mb-3 transition-all duration-500 ${
                        isActive
                          ? "bg-foreground text-background scale-110 shadow-xl shadow-foreground/30"
                          : isPast
                            ? "bg-foreground/20 text-foreground"
                            : "bg-muted/50 text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-7 w-7" strokeWidth={2.5} />
                    </div>
                    <span
                      className={`text-xs font-bold text-center transition-colors ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.label}
                    </span>

                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="absolute top-8 left-full w-full h-0.5 bg-border -translate-y-1/2" />
                    )}
                  </div>
                )
              })}
            </div>

            {/* Connector line */}
            <div className="relative h-1 bg-muted/30 rounded-full mt-6 overflow-hidden">
              <div
                className="absolute left-0 top-0 h-full bg-foreground rounded-full transition-all duration-500"
                style={{ width: `${((activePipelineStep + 1) / 4) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION B — HOW FORGE WORKS (Algorithm)
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="border-y-3 border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-black text-amber-500 uppercase tracking-[0.25em] mb-3">Algorithm v3</p>
            <h2 className="text-4xl font-black text-foreground tracking-tight">How FORGE Works</h2>
            <p className="text-muted-foreground font-bold mt-3 max-w-2xl mx-auto">
              Receipts-backed scoring that rewards real proof while still giving credit for claims
            </p>
          </div>

          {/* Formula Strip - Updated */}
          <div className="bg-background border-3 border-border rounded-2xl p-6 mb-10">
            <div className="flex items-center justify-center gap-6 flex-wrap mb-4">
              <div className="px-5 py-3 bg-foreground/5 rounded-xl">
                <span className="text-2xl font-black font-mono text-foreground">FORGE = CS × XS + LV</span>
              </div>
              <div className="px-5 py-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <span className="text-lg font-black font-mono text-amber-500">Gate: CS_verified ≥ τ (40%)</span>
              </div>
            </div>
            <p className="text-center text-sm text-muted-foreground font-bold">
              LV = Learning Velocity bonus for candidates showing growth patterns
            </p>
          </div>

          {/* 4-column explanation - v3 updated */}
          <div className="grid md:grid-cols-4 gap-5 mb-10">
            <div className="bg-card border-3 border-border/60 rounded-2xl p-5">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-3">
                <span className="text-lg font-black text-emerald-500">CS</span>
              </div>
              <h3 className="font-black text-base text-foreground mb-1">Capability Score</h3>
              <p className="text-xs text-muted-foreground font-bold">
                Skills weighted by proof tier. Verified artifacts = 100%, Claims = 15%
              </p>
            </div>

            <div className="bg-card border-3 border-border/60 rounded-2xl p-5">
              <div className="h-10 w-10 rounded-xl bg-blue-500/20 flex items-center justify-center mb-3">
                <span className="text-lg font-black text-blue-500">XS</span>
              </div>
              <h3 className="font-black text-base text-foreground mb-1">Context Score</h3>
              <p className="text-xs text-muted-foreground font-bold">
                Teamwork, ownership, communication signals with enhanced detection
              </p>
            </div>

            <div className="bg-card border-3 border-border/60 rounded-2xl p-5">
              <div className="h-10 w-10 rounded-xl bg-purple-500/20 flex items-center justify-center mb-3">
                <span className="text-lg font-black text-purple-500">LV</span>
              </div>
              <h3 className="font-black text-base text-foreground mb-1">Learning Velocity</h3>
              <p className="text-xs text-muted-foreground font-bold">
                Bonus for candidates showing growth: forks with modifications, learning patterns
              </p>
            </div>

            <div className="bg-card border-3 border-border/60 rounded-2xl p-5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-3">
                <span className="text-lg font-black text-amber-500">τ</span>
              </div>
              <h3 className="font-black text-base text-foreground mb-1">Smart Gate</h3>
              <p className="text-xs text-muted-foreground font-bold">
                Pool-relative threshold (default 40%). Adapts to your candidate quality.
              </p>
            </div>
          </div>

          {/* v3 Improvements callout */}
          <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-6 mb-8">
            <h4 className="font-black text-foreground mb-3 flex items-center gap-2">
              <span className="text-emerald-500">NEW in v3</span>
              <span className="px-2 py-0.5 bg-emerald-500 text-background text-xs font-black rounded">
                Less Rejections
              </span>
            </h4>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-bold text-foreground mb-1">Corroboration Boost</p>
                <p className="text-muted-foreground">Resume claims backed by GitHub get upgraded to Strong Signal</p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-1">Soft Must-Haves</p>
                <p className="text-muted-foreground">Missing requirements = score penalty, not auto-rejection</p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-1">Claims Count (15%)</p>
                <p className="text-muted-foreground">Unverified claims now contribute 15% instead of 0%</p>
              </div>
              <div>
                <p className="font-bold text-foreground mb-1">Related Skills</p>
                <p className="text-muted-foreground">React experience counts toward JavaScript requirements</p>
              </div>
            </div>
          </div>

          {/* Toggle Example */}
          <div className="text-center">
            <Button
              variant="outline"
              onClick={() => setShowExample(!showExample)}
              className="border-2 border-border hover:border-foreground/50 font-bold rounded-xl"
            >
              {showExample ? <ChevronUp className="mr-2 h-4 w-4" /> : <ChevronDown className="mr-2 h-4 w-4" />}
              {showExample ? "Hide example" : "Show worked example"}
            </Button>
          </div>

          {showExample && (
            <div className="mt-8 bg-card border-3 border-border/60 rounded-2xl p-6 animate-fade-in">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em] mb-4">
                Worked Example — v3 Scoring
              </p>

              <div className="grid md:grid-cols-5 gap-4 mb-6">
                <div className="bg-background/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-bold mb-1">CS_total</p>
                  <p className="text-2xl font-black text-foreground">58</p>
                </div>
                <div className="bg-background/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-bold mb-1">CS_verified</p>
                  <p className="text-2xl font-black text-foreground">42</p>
                </div>
                <div className="bg-background/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-bold mb-1">XS</p>
                  <p className="text-2xl font-black text-foreground">0.75</p>
                </div>
                <div className="bg-background/50 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground font-bold mb-1">LV bonus</p>
                  <p className="text-2xl font-black text-purple-500">+3</p>
                </div>
                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
                  <p className="text-xs text-emerald-500 font-bold mb-1">FORGE</p>
                  <p className="text-2xl font-black text-emerald-500">35</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-muted/20 rounded-xl p-4">
                  <p className="text-xs font-black text-foreground mb-2">Gate Check</p>
                  <p className="text-sm text-muted-foreground font-bold">
                    CS_verified (42) ≥ τ (40) <span className="text-emerald-500">✓ PASS</span>
                  </p>
                </div>
                <div className="bg-muted/20 rounded-xl p-4">
                  <p className="text-xs font-black text-foreground mb-2">Corroboration Applied</p>
                  <p className="text-sm text-muted-foreground font-bold">2 resume claims upgraded via GitHub match</p>
                </div>
              </div>

              <div className="bg-muted/20 rounded-xl p-4">
                <p className="text-sm text-muted-foreground font-bold">
                  <span className="text-foreground">In v2, this candidate would FAIL</span> (CS_verified 42 {"<"} τ 65).
                  In v3, they pass with adjusted threshold and get credit for corroborated claims + learning patterns.
                </p>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION C — PROOF TIER PYRAMID
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-black text-amber-500 uppercase tracking-[0.25em] mb-3">Unfair Advantage</p>
          <h2 className="text-4xl font-black text-foreground tracking-tight">Proof Tiers</h2>
        </div>

        <div className="flex flex-col items-center gap-4">
          {/* Tier 1 - Verified Artifact */}
          <div className="w-[40%] bg-success/10 border-3 border-success/40 rounded-2xl p-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <ShieldCheck className="h-5 w-5 text-success" />
              <span className="font-black text-success">Verified Artifact</span>
              <span className="text-xs font-bold text-success/70 bg-success/10 px-2 py-0.5 rounded-full">×1.0</span>
            </div>
            <p className="text-xs text-muted-foreground font-bold">
              Repo, portfolio case study, writing link, shipped product
            </p>
          </div>

          {/* Tier 2 - Strong Signals */}
          <div className="w-[55%] bg-foreground/5 border-3 border-foreground/20 rounded-2xl p-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Check className="h-5 w-5 text-foreground/70" />
              <span className="font-black text-foreground/70">Strong Signals</span>
              <span className="text-xs font-bold text-foreground/50 bg-foreground/10 px-2 py-0.5 rounded-full">
                ×0.7
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-bold">
              References in text + receipts, detailed descriptions with links
            </p>
          </div>

          {/* Tier 3 - Weak Signals */}
          <div className="w-[70%] bg-warning/5 border-3 border-warning/30 rounded-2xl p-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <span className="font-black text-warning/80">Weak Signals</span>
              <span className="text-xs font-bold text-warning/60 bg-warning/10 px-2 py-0.5 rounded-full">×0.4</span>
            </div>
            <p className="text-xs text-muted-foreground font-bold">Claims with partial context, no direct evidence</p>
          </div>

          {/* Tier 4 - Claim Only */}
          <div className="w-[85%] bg-destructive/5 border-3 border-destructive/30 rounded-2xl p-5 text-center">
            <div className="flex items-center justify-center gap-3 mb-2">
              <XCircle className="h-5 w-5 text-destructive/70" />
              <span className="font-black text-destructive/70">Claim Only</span>
              <span className="text-xs font-bold text-destructive/50 bg-destructive/10 px-2 py-0.5 rounded-full">
                ×0.0
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-bold">Unverified claims without any supporting evidence</p>
            <p className="text-xs text-destructive font-bold mt-2 flex items-center justify-center gap-1">
              <ShieldCheck className="h-3 w-3" />
              Cannot push past τ gate
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION D — OUTCOME CALIBRATION
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="border-y-3 border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-8 py-20">
          <div className="text-center mb-12">
            <p className="text-xs font-black text-amber-500 uppercase tracking-[0.25em] mb-3">Machine Learning</p>
            <h2 className="text-4xl font-black text-foreground tracking-tight">Outcome Calibration</h2>
            <p className="text-lg text-muted-foreground font-bold mt-4 max-w-2xl mx-auto">
              FORGE can calibrate ranking to your team using labeled hiring outcomes.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Calibration Effect Chart */}
            <div className="bg-card border-3 border-border/60 rounded-2xl p-6">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em] mb-4">
                Ranking Confidence
              </p>
              <ChartContainer config={chartConfig} className="h-[200px] w-full">
                <LineChart data={calibrationData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <XAxis
                    dataKey="stage"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#666", fontSize: 11, fontWeight: 700 }}
                  />
                  <YAxis
                    domain={[50, 100]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#666", fontSize: 11, fontWeight: 700 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#ffffff"
                    strokeWidth={3}
                    dot={{ fill: "#ffffff", strokeWidth: 0, r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
              <p className="text-xs text-muted-foreground font-bold text-center mt-2">Demo: Before After calibration</p>
            </div>

            {/* Seed Outcomes Panel */}
            <div className="bg-card border-3 border-border/60 rounded-2xl p-6">
              <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em] mb-4">
                Seed Outcomes Dataset
              </p>

              <div className="grid grid-cols-3 gap-3 mb-6">
                {Object.entries(SEED_OUTCOMES_META.byDept)
                  .slice(0, 6)
                  .map(([dept, count]) => (
                    <div key={dept} className="bg-background/50 rounded-xl p-3 text-center">
                      <p className="text-lg font-black text-foreground">{count}</p>
                      <p className="text-[10px] text-muted-foreground font-bold truncate">{dept}</p>
                    </div>
                  ))}
              </div>

              <div className="bg-success/10 border border-success/30 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-success">Success prediction rate</span>
                  <span className="text-xl font-black text-success">{SEED_OUTCOMES_META.successRate}%</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground font-bold text-center">
                Calibration requires ≥12 labeled examples. Until then, FORGE uses deterministic scoring.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION E — WHAT YOU GET (Outputs)
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-8 py-20">
        <div className="text-center mb-12">
          <p className="text-xs font-black text-amber-500 uppercase tracking-[0.25em] mb-3">Deliverables</p>
          <h2 className="text-4xl font-black text-foreground tracking-tight">What You Get</h2>
        </div>

        <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4">
          {OUTPUTS.map((output, i) => (
            <div
              key={output.label}
              className="bg-card border-3 border-border/60 rounded-2xl p-5 hover:border-foreground/30 transition-all"
            >
              <div className="h-10 w-10 rounded-xl bg-foreground/10 flex items-center justify-center mb-4">
                <span className="text-sm font-black text-foreground">{i + 1}</span>
              </div>
              <h3 className="font-black text-sm text-foreground mb-2">{output.label}</h3>
              <p className="text-xs text-muted-foreground font-bold mb-3">{output.description}</p>
              <p className="text-[10px] text-foreground/50 font-bold">{output.contents}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          CHARTS SECTION — τ Gate Funnel + Proof Mix Donut
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="border-y-3 border-border/60 bg-card/30">
        <div className="mx-auto max-w-6xl px-8 py-16">
          <div className="grid md:grid-cols-2 gap-8">
            {/* τ Gate Funnel */}
            <div className="bg-card border-3 border-border/60 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">τ Gate Funnel</p>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
                  DEMO
                </span>
              </div>

              <div className="space-y-3">
                {funnelData.map((item, i) => (
                  <div key={item.name} className="flex items-center gap-4">
                    <div className="w-24 text-xs font-bold text-muted-foreground">{item.name}</div>
                    <div className="flex-1 h-8 bg-muted/20 rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-foreground rounded-lg flex items-center justify-end pr-3 transition-all"
                        style={{ width: `${(item.value / funnelData[0].value) * 100}%` }}
                      >
                        <span className="text-xs font-black text-background">{item.value}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Proof Mix Donut */}
            <div className="bg-card border-3 border-border/60 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-black text-muted-foreground uppercase tracking-[0.15em]">Proof Mix</p>
                <span className="text-[10px] font-bold text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
                  DEMO
                </span>
              </div>

              <div className="flex items-center gap-6">
                <ChartContainer config={chartConfig} className="h-[160px] w-[160px]">
                  <PieChart>
                    <Pie
                      data={proofMixData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {proofMixData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ChartContainer>

                <div className="flex-1 grid grid-cols-2 gap-2">
                  {proofMixData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.fill }} />
                      <span className="text-[10px] font-bold text-muted-foreground">{item.name}</span>
                      <span className="text-[10px] font-black text-foreground">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════════
          SECTION F — CTA FOOTER
      ═══════════════════════════════════════════════════════════════════════════ */}
      <section className="mx-auto max-w-4xl px-8 py-24 text-center">
        <h2 className="text-4xl font-black text-foreground tracking-tight mb-4">Run a full demo in 60 seconds.</h2>
        <p className="text-lg text-muted-foreground font-bold mb-8">
          See real GitHub profiles analyzed with the FORGE algorithm.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
          <Button
            size="lg"
            onClick={handleRunGuidedDemo}
            disabled={isPitchRunning || showGuidedDemo}
            className="bg-foreground hover:bg-foreground/90 text-background font-black px-10 h-14 rounded-2xl text-base shadow-2xl shadow-foreground/30 transition-all hover:scale-105 ring-4 ring-foreground/20"
          >
            <Play className="mr-2 h-5 w-5" />
            Run guided demo
          </Button>
          <Link href="/job">
            <Button
              size="lg"
              variant="outline"
              className="border-3 border-border hover:border-foreground/50 font-black px-10 h-14 rounded-2xl text-base bg-transparent"
            >
              Start from scratch
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>

        {/* Compliance note */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/30 border border-border/50">
          <ShieldCheck className="h-4 w-4 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground">
            No scraping — LinkedIn must be pasted by user. FORGE does not scrape private data.
          </span>
        </div>
      </section>

      <footer className="border-t-3 border-border/60">
        <div className="mx-auto max-w-7xl px-8 py-10">
          <p className="text-[10px] text-muted-foreground/50 text-center uppercase tracking-[0.25em] font-black">
            FORGE — Proof-first hiring
          </p>
        </div>
      </footer>
    </AppShell>
  )
}
