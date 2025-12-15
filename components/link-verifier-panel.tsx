"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Link2, CheckCircle2, XCircle, Loader2, ExternalLink, Globe, FileText, Linkedin, Github } from "lucide-react"
import type { VerificationSummary } from "@/lib/link-verifier"
import { verifyLinks, extractLinksFromCandidate } from "@/lib/link-verifier"
import type { CandidateAnalysis } from "@/lib/scoring"
import { cn } from "@/lib/utils"

interface LinkVerifierPanelProps {
  candidate: CandidateAnalysis
}

const TYPE_ICONS: Record<string, typeof Globe> = {
  portfolio: Globe,
  writing: FileText,
  github: Github,
  linkedin: Linkedin,
  other: Link2,
}

export function LinkVerifierPanel({ candidate }: LinkVerifierPanelProps) {
  const [isVerifying, setIsVerifying] = useState(false)
  const [results, setResults] = useState<VerificationSummary | null>(null)

  const handleVerify = async () => {
    setIsVerifying(true)
    try {
      const links = extractLinksFromCandidate({
        signals: (candidate as any).signals,
        evidence: candidate.evidence,
      })

      if (links.length === 0) {
        setResults({ total: 0, reachable: 0, unreachable: 0, results: [] })
        return
      }

      const summary = await verifyLinks(links.slice(0, 10)) // Limit to 10 links
      setResults(summary)
    } catch (error) {
      console.error("Link verification failed:", error)
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div className="bg-surface rounded-xl border-2 border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-primary" />
          <h4 className="font-black text-foreground">Link Verifier</h4>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleVerify}
          disabled={isVerifying}
          className="border-2 border-border rounded-xl font-bold bg-transparent"
        >
          {isVerifying ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking...
            </>
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Verify Links
            </>
          )}
        </Button>
      </div>

      {!results && !isVerifying && (
        <p className="text-sm text-muted-foreground">
          Click &quot;Verify Links&quot; to check if portfolio, writing, and evidence URLs are reachable.
        </p>
      )}

      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span className="text-sm font-bold text-success">{results.reachable} reachable</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-bold text-destructive">{results.unreachable} unreachable</span>
            </div>
          </div>

          {/* Results list */}
          {results.total === 0 ? (
            <p className="text-sm text-muted-foreground">No links found to verify.</p>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {results.results.map((result, i) => {
                const Icon = TYPE_ICONS[result.type] || Link2
                return (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-3 p-3 rounded-lg border",
                      result.reachable ? "bg-success/5 border-success/20" : "bg-destructive/5 border-destructive/20",
                    )}
                  >
                    <Icon
                      className={cn(
                        "h-4 w-4 mt-0.5 flex-shrink-0",
                        result.reachable ? "text-success" : "text-destructive",
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {result.reachable ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-success flex-shrink-0" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-destructive flex-shrink-0" />
                        )}
                        <span className="text-xs font-bold uppercase text-muted-foreground">{result.type}</span>
                        {result.statusCode && (
                          <span
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded font-mono",
                              result.statusCode >= 200 && result.statusCode < 300
                                ? "bg-success/20 text-success"
                                : "bg-destructive/20 text-destructive",
                            )}
                          >
                            {result.statusCode}
                          </span>
                        )}
                        {result.responseTimeMs && (
                          <span className="text-xs text-muted-foreground">{result.responseTimeMs}ms</span>
                        )}
                      </div>

                      {result.title && (
                        <p className="text-sm font-bold text-foreground mt-1 truncate">{result.title}</p>
                      )}

                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 truncate"
                      >
                        {result.url}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>

                      {result.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{result.description}</p>
                      )}

                      {result.error && <p className="text-xs text-destructive mt-1">Error: {result.error}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
