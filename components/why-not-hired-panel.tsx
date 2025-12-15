"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { XCircle, Clock, ArrowRight, Copy, Check, Lightbulb, Target } from "lucide-react"
import { generateWhyNotHiredReport, formatWhyNotHiredEmail } from "@/lib/why-not-hired"
import type { CandidateAnalysis } from "@/lib/scoring"
import { cn } from "@/lib/utils"

interface WhyNotHiredPanelProps {
  candidate: CandidateAnalysis
  tau: number
  companyName?: string
}

export function WhyNotHiredPanel({ candidate, tau, companyName = "Your Company" }: WhyNotHiredPanelProps) {
  const [copied, setCopied] = useState(false)

  const report = generateWhyNotHiredReport(candidate, tau)

  const handleCopyEmail = () => {
    const email = formatWhyNotHiredEmail(report, companyName)
    navigator.clipboard.writeText(email)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-destructive/5 rounded-xl border-2 border-destructive/30 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-destructive" />
          <h4 className="font-black text-foreground">Why Not Hired</h4>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleCopyEmail}
          className="border-2 border-destructive/30 rounded-xl font-bold bg-transparent text-destructive hover:bg-destructive/10"
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy Email
            </>
          )}
        </Button>
      </div>

      {/* Summary */}
      <p className="text-sm text-muted-foreground">{report.summary}</p>

      {/* Missing Proof */}
      {report.missingProof.length > 0 && (
        <div>
          <h5 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-destructive" />
            Missing Proof
          </h5>
          <div className="space-y-3">
            {report.missingProof.map((item, i) => (
              <div key={i} className="bg-black/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground">{item.skill}</span>
                  <span
                    className={cn(
                      "text-xs px-2 py-0.5 rounded font-bold",
                      item.currentStatus === "Weak"
                        ? "bg-warning/20 text-warning"
                        : "bg-destructive/20 text-destructive",
                    )}
                  >
                    {item.currentScore}% ({item.currentStatus})
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  Gap: ~{item.gapPoints} points needed to pass threshold
                </p>
                <div className="space-y-1">
                  {item.artifactsNeeded.map((artifact, j) => (
                    <div key={j} className="flex items-start gap-2 text-xs">
                      <ArrowRight className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{artifact}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div>
        <h5 className="font-bold text-foreground text-sm mb-2 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-warning" />
          Next Steps
        </h5>
        <ol className="space-y-2">
          {report.nextSteps.map((step, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <span className="font-black text-primary">{i + 1}.</span>
              <span className="text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Time estimate */}
      <div className="flex items-center gap-2 p-3 bg-black/30 rounded-lg">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          <span className="font-bold text-foreground">Estimated time to qualify:</span> {report.estimatedTimeToQualify}
        </span>
      </div>

      {/* Encouragement */}
      <p className="text-sm text-success italic">{report.encouragement}</p>
    </div>
  )
}
