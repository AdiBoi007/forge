"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Clock, Copy, Check, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react"
import type { InterviewPlan } from "@/lib/interview-plans"
import { cn } from "@/lib/utils"

interface InterviewPlanViewerProps {
  plans: {
    "15min": InterviewPlan
    "30min": InterviewPlan
    "60min": InterviewPlan
  }
  candidateName: string
}

export function InterviewPlanViewer({ plans, candidateName }: InterviewPlanViewerProps) {
  const [selectedDuration, setSelectedDuration] = useState<"15min" | "30min" | "60min">("30min")
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1]))
  const [copied, setCopied] = useState(false)

  const plan = plans[selectedDuration]

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedSections(newExpanded)
  }

  const copyPlanAsText = () => {
    const text = `Interview Plan for ${candidateName} (${plan.totalMinutes} min)

${plan.sections
  .map(
    (s) => `## ${s.name} (${s.minutes} min)
${s.questions.map((q) => `- ${q.question}\n  Context: ${q.context}\n  Time: ${q.timeGuide}`).join("\n")}
Notes: ${s.notes}`,
  )
  .join("\n\n")}

CLOSING QUESTIONS:
${plan.closingQuestions.map((q) => `- ${q}`).join("\n")}

RED FLAGS TO WATCH:
${plan.redFlags.map((r) => `- ${r}`).join("\n")}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Duration selector */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {(["15min", "30min", "60min"] as const).map((d) => (
            <Button
              key={d}
              variant={selectedDuration === d ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedDuration(d)}
              className={cn(
                "rounded-xl font-bold",
                selectedDuration === d ? "bg-foreground text-background" : "border-2 border-border",
              )}
            >
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              {d === "15min" ? "15 min" : d === "30min" ? "30 min" : "60 min"}
            </Button>
          ))}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyPlanAsText}
          className="border-2 border-border rounded-xl font-bold bg-transparent"
        >
          {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
          {copied ? "Copied!" : "Copy Plan"}
        </Button>
      </div>

      {/* Timeline bar */}
      <div className="flex h-3 rounded-full overflow-hidden bg-surface border border-border">
        {plan.sections.map((section, i) => (
          <div
            key={i}
            className={cn(
              "h-full transition-all",
              i % 4 === 0 ? "bg-primary" : i % 4 === 1 ? "bg-success" : i % 4 === 2 ? "bg-warning" : "bg-purple-500",
            )}
            style={{ width: `${(section.minutes / plan.totalMinutes) * 100}%` }}
            title={`${section.name} (${section.minutes} min)`}
          />
        ))}
      </div>

      {/* Sections */}
      <div className="space-y-3">
        {plan.sections.map((section, i) => (
          <div key={i} className="bg-surface rounded-xl border-2 border-border overflow-hidden">
            <button
              onClick={() => toggleSection(i)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "h-8 w-8 rounded-lg flex items-center justify-center font-black text-sm",
                    i % 4 === 0
                      ? "bg-primary/20 text-primary"
                      : i % 4 === 1
                        ? "bg-success/20 text-success"
                        : i % 4 === 2
                          ? "bg-warning/20 text-warning"
                          : "bg-purple-500/20 text-purple-400",
                  )}
                >
                  {section.minutes}m
                </div>
                <span className="font-bold text-foreground">{section.name}</span>
              </div>
              {expandedSections.has(i) ? (
                <ChevronUp className="h-5 w-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-5 w-5 text-muted-foreground" />
              )}
            </button>

            {expandedSections.has(i) && (
              <div className="px-4 pb-4 space-y-3">
                {section.questions.map((q, qi) => (
                  <div key={qi} className="bg-black/30 rounded-lg p-3">
                    <p className="font-bold text-foreground text-sm">{q.question}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="text-muted-foreground">{q.context}</span>
                      <span className="text-primary font-bold">{q.timeGuide}</span>
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground italic">Notes: {section.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Closing & Red Flags */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-surface rounded-xl p-4 border-2 border-border">
          <h5 className="font-black text-foreground text-sm mb-3">Closing Questions</h5>
          <ul className="space-y-2">
            {plan.closingQuestions.map((q, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                {q}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-destructive/10 rounded-xl p-4 border-2 border-destructive/30">
          <h5 className="font-black text-destructive text-sm mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Red Flags
          </h5>
          <ul className="space-y-2">
            {plan.redFlags.map((r, i) => (
              <li key={i} className="text-sm text-destructive/80 flex items-start gap-2">
                <span>•</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
