"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Globe,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Briefcase,
  Code2,
  MessageSquare,
  Link2,
  RefreshCw,
  Wifi,
  Download,
  FileSearch,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileCode,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { extractFromHtml, type PortfolioExtraction } from "@/lib/portfolio-extract"

interface PortfolioAnalyzerProps {
  url: string
  onExtracted?: (extraction: PortfolioExtraction) => void
}

type ProgressStep = "connecting" | "fetching" | "parsing" | "extracting" | "done" | "error"

const PROGRESS_STEPS: { key: ProgressStep; label: string; icon: typeof Wifi }[] = [
  { key: "connecting", label: "Connecting", icon: Wifi },
  { key: "fetching", label: "Fetching", icon: Download },
  { key: "parsing", label: "Parsing", icon: FileSearch },
  { key: "extracting", label: "Extracting", icon: Sparkles },
]

const FETCH_TIMEOUT_MS = 20000 // 20 second timeout

export function PortfolioAnalyzer({ url, onExtracted }: PortfolioAnalyzerProps) {
  const [loading, setLoading] = useState(false)
  const [extraction, setExtraction] = useState<PortfolioExtraction | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<ProgressStep | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [showHtmlFallback, setShowHtmlFallback] = useState(false)
  const [htmlContent, setHtmlContent] = useState("")
  const [processingHtml, setProcessingHtml] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const timeIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const isValidUrl = (urlString: string): boolean => {
    if (!urlString || typeof urlString !== "string") return false
    const trimmed = urlString.trim()
    if (!trimmed) return false
    try {
      const parsed = new URL(trimmed)
      return parsed.protocol === "http:" || parsed.protocol === "https:"
    } catch {
      return false
    }
  }

  const canAnalyze = isValidUrl(url)

  const cleanup = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
    if (timeIntervalRef.current) {
      clearInterval(timeIntervalRef.current)
      timeIntervalRef.current = null
    }
  }

  const processHtmlContent = () => {
    if (!htmlContent.trim()) {
      setError("Please paste HTML content")
      return
    }

    setProcessingHtml(true)
    setError(null)

    try {
      const trimmedUrl = url?.trim() || "https://portfolio.example.com"
      const result = extractFromHtml(htmlContent, trimmedUrl)
      setExtraction(result)
      onExtracted?.(result)
      setShowHtmlFallback(false)
      setHtmlContent("")
    } catch (e) {
      setError("Failed to parse HTML content")
    } finally {
      setProcessingHtml(false)
    }
  }

  const analyze = async () => {
    const trimmedUrl = url?.trim()
    if (!canAnalyze || !trimmedUrl) {
      setError("Please enter a valid URL (e.g., https://example.com)")
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    cleanup()
    setLoading(true)
    setError(null)
    setExtraction(null)
    setElapsedTime(0)
    setShowHtmlFallback(false)

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    let stepIndex = 0
    setCurrentStep(PROGRESS_STEPS[0].key)

    progressIntervalRef.current = setInterval(() => {
      stepIndex++
      if (stepIndex < PROGRESS_STEPS.length - 1) {
        setCurrentStep(PROGRESS_STEPS[stepIndex].key)
      } else if (stepIndex === PROGRESS_STEPS.length - 1) {
        setCurrentStep("extracting")
      }
    }, 1500)

    const startTime = Date.now()
    timeIntervalRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000))
    }, 1000)

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        abortController.abort()
        reject(new Error("Request timed out after 20 seconds"))
      }, FETCH_TIMEOUT_MS)
    })

    try {
      const fetchPromise = fetch("/api/portfolio/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmedUrl }),
        signal: abortController.signal,
      })

      const response = await Promise.race([fetchPromise, timeoutPromise])
      const data = await response.json()

      cleanup()

      if (data.success) {
        setCurrentStep("done")
        setExtraction(data.extraction)
        onExtracted?.(data.extraction)
      } else {
        setCurrentStep("error")
        setError(data.error || "Failed to analyze portfolio")
        setShowHtmlFallback(true)
      }
    } catch (e) {
      cleanup()
      setCurrentStep("error")

      if (e instanceof Error) {
        if (e.name === "AbortError" || e.message.includes("timed out")) {
          setError("Request timed out - try the manual HTML paste option below")
        } else {
          setError(e.message || "Network error - try the manual HTML paste option below")
        }
      } else {
        setError("Network error - try the manual HTML paste option below")
      }
      setShowHtmlFallback(true)
    } finally {
      cleanup()
      setTimeout(() => {
        setLoading(false)
        if (currentStep !== "done" && currentStep !== "error") {
          setCurrentStep(null)
        }
      }, 500)
    }
  }

  const ProgressIndicator = () => {
    if (!currentStep) return null

    const isError = currentStep === "error"
    const isDone = currentStep === "done"
    const currentIndex = isDone
      ? PROGRESS_STEPS.length
      : isError
        ? PROGRESS_STEPS.findIndex((s) => s.key === "extracting")
        : PROGRESS_STEPS.findIndex((s) => s.key === currentStep)

    return (
      <div className="p-3 bg-muted/30 rounded-lg border border-border/50 space-y-3">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${
              isError ? "bg-rose-500" : "bg-gradient-to-r from-cyan-500 to-emerald-500"
            }`}
            style={{ width: `${((currentIndex + 1) / PROGRESS_STEPS.length) * 100}%` }}
          />
        </div>

        <div className="flex justify-between">
          {PROGRESS_STEPS.map((step, index) => {
            const Icon = step.icon
            const isActive = step.key === currentStep
            const isComplete = isDone || currentIndex > index
            const isFailed = isError && step.key === "extracting"

            return (
              <div
                key={step.key}
                className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                  isFailed
                    ? "text-rose-400"
                    : isActive
                      ? "text-cyan-400 scale-110"
                      : isComplete
                        ? "text-emerald-400"
                        : "text-muted-foreground/50"
                }`}
              >
                <div
                  className={`p-1.5 rounded-full ${
                    isFailed
                      ? "bg-rose-400/20 ring-2 ring-rose-400/50"
                      : isActive
                        ? "bg-cyan-400/20 ring-2 ring-cyan-400/50"
                        : isComplete
                          ? "bg-emerald-400/20"
                          : "bg-muted/50"
                  }`}
                >
                  {isFailed ? (
                    <XCircle className="h-3.5 w-3.5" />
                  ) : isComplete && !isActive ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Icon className={`h-3.5 w-3.5 ${isActive ? "animate-pulse" : ""}`} />
                  )}
                </div>
                <span className="text-[10px] font-medium">{step.label}</span>
              </div>
            )
          })}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          {currentStep === "connecting" && "Establishing connection..."}
          {currentStep === "fetching" && "Downloading page content..."}
          {currentStep === "parsing" && "Parsing HTML structure..."}
          {currentStep === "extracting" && (
            <span>
              Extracting projects & skills...
              {elapsedTime > 5 && <span className="text-amber-400 ml-2">({elapsedTime}s)</span>}
            </span>
          )}
          {currentStep === "done" && "Analysis complete!"}
          {currentStep === "error" && "Extraction failed"}
        </div>
      </div>
    )
  }

  const HtmlFallbackUI = () => {
    if (!showHtmlFallback) return null

    return (
      <div className="p-4 bg-muted/30 rounded-lg border border-amber-400/30 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-amber-400">
          <FileCode className="h-4 w-4" />
          Manual HTML Paste (Fallback)
        </div>
        <p className="text-xs text-muted-foreground">
          The website blocked our request. You can paste the HTML source code directly:
        </p>
        <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
          <li>
            Open <span className="text-cyan-400">{url}</span> in your browser
          </li>
          <li>Right-click and select "View Page Source" (or press Ctrl+U / Cmd+Option+U)</li>
          <li>Select all (Ctrl+A / Cmd+A) and copy (Ctrl+C / Cmd+C)</li>
          <li>Paste the HTML below</li>
        </ol>
        <Textarea
          value={htmlContent}
          onChange={(e) => setHtmlContent(e.target.value)}
          placeholder="Paste HTML source code here..."
          className="min-h-[120px] text-xs font-mono bg-background"
        />
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={processHtmlContent}
            disabled={!htmlContent.trim() || processingHtml}
            className="h-7 text-xs"
          >
            {processingHtml ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-3 w-3 mr-1" />
                Extract from HTML
              </>
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowHtmlFallback(false)} className="h-7 text-xs">
            Cancel
          </Button>
          <span className="text-[10px] text-muted-foreground ml-auto">
            {htmlContent.length > 0 && `${(htmlContent.length / 1024).toFixed(1)} KB`}
          </span>
        </div>
      </div>
    )
  }

  const qualityColor = {
    high: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
    medium: "text-amber-400 bg-amber-400/10 border-amber-400/30",
    low: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  }

  const tierColor = {
    owned_artifact: "text-emerald-400",
    linked_artifact: "text-cyan-400",
    third_party: "text-amber-400",
    claim_only: "text-muted-foreground",
  }

  if (!url || !url.trim()) {
    return (
      <div className="text-xs text-muted-foreground p-3 border border-dashed rounded-lg">
        Add a portfolio URL above to analyze
      </div>
    )
  }

  if (!canAnalyze) {
    return (
      <div className="text-xs text-amber-400 p-3 border border-amber-400/30 rounded-lg flex items-center gap-2">
        <AlertTriangle className="h-3 w-3" />
        Enter a valid URL starting with http:// or https://
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={analyze}
          disabled={loading || !canAnalyze}
          className="h-7 text-xs bg-transparent"
        >
          {loading ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              Analyzing...
            </>
          ) : extraction ? (
            <>
              <RefreshCw className="h-3 w-3 mr-1" />
              Re-analyze
            </>
          ) : (
            <>
              <Globe className="h-3 w-3 mr-1" />
              Analyze Portfolio
            </>
          )}
        </Button>

        {extraction && !loading && (
          <Badge className={qualityColor[extraction.overallQuality]}>
            {extraction.overallQuality.toUpperCase()} QUALITY
          </Badge>
        )}

        {!loading && !extraction && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowHtmlFallback(!showHtmlFallback)}
            className="h-7 text-xs text-muted-foreground"
          >
            <FileCode className="h-3 w-3 mr-1" />
            Paste HTML
            {showHtmlFallback ? <ChevronUp className="h-3 w-3 ml-1" /> : <ChevronDown className="h-3 w-3 ml-1" />}
          </Button>
        )}
      </div>

      {loading && <ProgressIndicator />}

      {error && !loading && (
        <div className="flex items-center gap-2 text-xs text-rose-400 p-2 bg-rose-400/10 rounded">
          <AlertTriangle className="h-3 w-3" />
          {error}
        </div>
      )}

      <HtmlFallbackUI />

      {extraction && !loading && (
        <Card className="border-border/50 bg-muted/20">
          <CardHeader className="py-3 px-4">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              {extraction.title || "Portfolio"}
              <a href={url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </a>
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0 px-4 pb-4 space-y-4">
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-lg font-bold">{extraction.projectCount}</div>
                <div className="text-[10px] text-muted-foreground">Projects</div>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-lg font-bold">{extraction.skills.length}</div>
                <div className="text-[10px] text-muted-foreground">Skills</div>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-lg font-bold">{extraction.testimonialCount}</div>
                <div className="text-[10px] text-muted-foreground">Testimonials</div>
              </div>
              <div className="p-2 bg-muted/30 rounded">
                <div className="text-lg font-bold">{Math.round(extraction.reliability * 100)}%</div>
                <div className="text-[10px] text-muted-foreground">Reliability</div>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Proof tier:</span>
              <span className={tierColor[extraction.proofTier]}>{extraction.proofTier.replace(/_/g, " ")}</span>
            </div>

            {extraction.projects.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs font-medium mb-2">
                  <Code2 className="h-3 w-3" />
                  Projects Detected
                </div>
                <div className="space-y-2">
                  {extraction.projects.slice(0, 3).map((project, i) => (
                    <div key={i} className="p-2 bg-muted/30 rounded text-xs">
                      <div className="font-medium flex items-center gap-2">
                        {project.title}
                        {project.hasLiveDemo && (
                          <Badge variant="outline" className="h-4 text-[10px]">
                            DEMO
                          </Badge>
                        )}
                        {project.hasCaseStudy && (
                          <Badge variant="outline" className="h-4 text-[10px]">
                            CASE STUDY
                          </Badge>
                        )}
                      </div>
                      {project.technologies.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {project.technologies.map((tech, j) => (
                            <Badge key={j} variant="secondary" className="h-4 text-[10px]">
                              {tech}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {extraction.skills.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs font-medium mb-2">
                  <Briefcase className="h-3 w-3" />
                  Skills Mentioned
                </div>
                <div className="flex flex-wrap gap-1">
                  {extraction.skills.slice(0, 10).map((skill, i) => (
                    <Badge key={i} variant={skill.hasProject ? "default" : "outline"} className="text-[10px]">
                      {skill.skill}
                      {skill.frequency > 1 && <span className="ml-1 opacity-60">×{skill.frequency}</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {extraction.testimonials.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs font-medium mb-2">
                  <MessageSquare className="h-3 w-3" />
                  Testimonials
                </div>
                {extraction.testimonials.slice(0, 2).map((t, i) => (
                  <div key={i} className="p-2 bg-muted/30 rounded text-xs italic">
                    "{t.text.slice(0, 150)}..."
                    {t.author && <div className="text-muted-foreground mt-1 not-italic">— {t.author}</div>}
                  </div>
                ))}
              </div>
            )}

            {extraction.socialLinks.length > 0 && (
              <div>
                <div className="flex items-center gap-1 text-xs font-medium mb-2">
                  <Link2 className="h-3 w-3" />
                  Linked Profiles
                </div>
                <div className="flex flex-wrap gap-2">
                  {extraction.socialLinks.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {link.platform}
                      <ExternalLink className="h-2 w-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {extraction.warnings.length > 0 && (
              <div className="space-y-1">
                {extraction.warnings.map((warning, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-amber-400">
                    <AlertTriangle className="h-3 w-3 mt-0.5 shrink-0" />
                    {warning}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
