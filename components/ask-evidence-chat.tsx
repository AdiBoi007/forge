"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { MessageSquare, Send, Loader2, X } from "lucide-react"
import type { CandidateAnalysis } from "@/lib/scoring"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  receipts?: string[]
}

interface AskEvidenceChatProps {
  candidate: CandidateAnalysis
  onClose?: () => void
}

// Pre-defined questions users can click
const SUGGESTED_QUESTIONS = [
  "Why is the React score high?",
  "What evidence supports their TypeScript skills?",
  "Why was this candidate flagged as risky?",
  "What are the main gaps in their profile?",
  "Summarize their strongest skills",
]

// Answer questions using ONLY the evidence (no hallucination)
function answerFromEvidence(question: string, candidate: CandidateAnalysis): { answer: string; receipts: string[] } {
  const q = question.toLowerCase()
  const receipts: string[] = []
  let answer = ""

  // Extract skill name from question
  const skillKeywords = [
    "react",
    "typescript",
    "node",
    "python",
    "javascript",
    "css",
    "html",
    "system design",
    "aws",
    "docker",
    "kubernetes",
    "sql",
    "graphql",
    "testing",
    "ci/cd",
  ]
  const mentionedSkill = skillKeywords.find((s) => q.includes(s))

  // Question about specific skill score
  if ((q.includes("why") || q.includes("what")) && (q.includes("score") || q.includes("high") || q.includes("low"))) {
    if (mentionedSkill) {
      const skill = candidate.capability.skills.find((s) => s.name.toLowerCase().includes(mentionedSkill))
      if (skill) {
        const evidence = candidate.evidence.filter((e) => e.skill.toLowerCase().includes(mentionedSkill))

        answer = `${skill.name} scored ${Math.round(skill.score * 100)}% (${skill.status}).\n\n`

        if (evidence.length > 0) {
          answer += `Evidence found:\n`
          evidence.forEach((e) => {
            answer += `- ${e.title}: ${e.whyThisMatters || e.description || "Demonstrates skill"}\n`
            receipts.push(e.url)
          })
        } else {
          answer += `No direct evidence found for this skill. Score is based on ${skill.receipts?.join(", ") || "inferred signals"}.`
        }

        if (skill.proofTier) {
          answer += `\nProof tier: ${skill.proofTier.replace(/_/g, " ")}`
        }
      }
    } else {
      // General score question
      answer = `Overall FORGE score: ${candidate.finalScore}\n`
      answer += `- Capability (CS): ${Math.round((candidate.cs || 0) * 100)}%\n`
      answer += `- Context (XS): ${Math.round((candidate.xs || 0) * 100)}%\n`
      answer += `- Gate Status: ${candidate.gateStatus}\n\n`
      answer += `Top skills:\n`
      candidate.capability.skills.slice(0, 3).forEach((s) => {
        answer += `- ${s.name}: ${Math.round(s.score * 100)}% (${s.status})\n`
      })
    }
  }

  // Question about evidence
  else if (q.includes("evidence") || q.includes("proof") || q.includes("support")) {
    if (mentionedSkill) {
      const evidence = candidate.evidence.filter((e) => e.skill.toLowerCase().includes(mentionedSkill))
      if (evidence.length > 0) {
        answer = `Evidence for ${mentionedSkill}:\n\n`
        evidence.forEach((e) => {
          answer += `**${e.title}** (${e.impact} impact)\n`
          answer += `${e.whyThisMatters || e.description || ""}\n`
          if (e.metrics) {
            const metrics = Object.entries(e.metrics)
              .filter(([, v]) => v)
              .map(([k, v]) => `${k}: ${v}`)
              .join(", ")
            if (metrics) answer += `Metrics: ${metrics}\n`
          }
          answer += `\n`
          receipts.push(e.url)
        })
      } else {
        answer = `No direct evidence found for ${mentionedSkill}. This skill may be inferred from other signals or marked as weak/missing.`
      }
    } else {
      answer = `Top evidence for ${candidate.name}:\n\n`
      candidate.evidence.slice(0, 5).forEach((e) => {
        answer += `- **${e.title}** (${e.skill}, ${e.impact} impact)\n`
        receipts.push(e.url)
      })
    }
  }

  // Question about risks
  else if (q.includes("risk") || q.includes("flag") || q.includes("concern") || q.includes("problem")) {
    if (candidate.risks.length > 0) {
      answer = `Risks identified for ${candidate.name}:\n\n`
      candidate.risks.forEach((r) => {
        answer += `- **${r.severity.toUpperCase()}**: ${r.description}\n`
      })
    } else {
      answer = "No significant risks flagged for this candidate."
    }

    if (candidate.explanations?.risks && candidate.explanations.risks.length > 0) {
      answer += `\nExplanation:\n`
      candidate.explanations.risks.forEach((r) => {
        answer += `- ${r}\n`
      })
    }
  }

  // Question about gaps
  else if (q.includes("gap") || q.includes("missing") || q.includes("weak") || q.includes("lack")) {
    const weakSkills = candidate.capability.skills.filter((s) => s.status === "Weak" || s.status === "Missing")
    if (weakSkills.length > 0) {
      answer = `Skills with gaps:\n\n`
      weakSkills.forEach((s) => {
        answer += `- **${s.name}**: ${s.status} (${Math.round(s.score * 100)}%)\n`
        if (s.receipts && s.receipts.length > 0) {
          answer += `  Reason: ${s.receipts[0]}\n`
        }
      })
    } else {
      answer = "No significant skill gaps identified. All required skills show adequate evidence."
    }

    if (candidate.explanations?.missingProof && candidate.explanations.missingProof.length > 0) {
      answer += `\nMissing proof:\n`
      candidate.explanations.missingProof.forEach((m) => {
        answer += `- ${m}\n`
      })
    }
  }

  // Summary question
  else if (q.includes("summarize") || q.includes("summary") || q.includes("strongest") || q.includes("best")) {
    const provenSkills = candidate.capability.skills
      .filter((s) => s.status === "Proven")
      .sort((a, b) => b.score - a.score)
    answer = `**${candidate.name}** - ${candidate.verdict}\n\n`
    answer += `FORGE Score: ${candidate.finalScore} (CS: ${Math.round((candidate.cs || 0) * 100)}%, XS: ${Math.round((candidate.xs || 0) * 100)}%)\n\n`

    if (provenSkills.length > 0) {
      answer += `Strongest proven skills:\n`
      provenSkills.slice(0, 3).forEach((s) => {
        answer += `- ${s.name}: ${Math.round(s.score * 100)}%\n`
      })
    }

    if (candidate.explanations?.topReasons) {
      answer += `\nTop reasons:\n`
      candidate.explanations.topReasons.forEach((r) => {
        answer += `- ${r}\n`
      })
    }
  }

  // Default fallback
  else {
    answer = `I can only answer questions based on the evidence collected for ${candidate.name}.\n\n`
    answer += `Try asking about:\n`
    answer += `- Specific skill scores (e.g., "Why is React score high?")\n`
    answer += `- Evidence for skills (e.g., "What evidence supports TypeScript?")\n`
    answer += `- Risks and concerns\n`
    answer += `- Gaps in their profile\n`
    answer += `- A summary of their strengths`
  }

  return { answer, receipts: [...new Set(receipts)] }
}

export function AskEvidenceChat({ candidate, onClose }: AskEvidenceChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `Ask me anything about ${candidate.name}'s evidence. I'll answer using only verified receipts - no hallucination.`,
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const handleSubmit = async (question: string) => {
    if (!question.trim()) return

    const userMessage: Message = { role: "user", content: question }
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate slight delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300))

    const { answer, receipts } = answerFromEvidence(question, candidate)

    const assistantMessage: Message = {
      role: "assistant",
      content: answer,
      receipts: receipts.length > 0 ? receipts : undefined,
    }

    setMessages((prev) => [...prev, assistantMessage])
    setIsLoading(false)
  }

  return (
    <div className="bg-surface rounded-xl border-2 border-border flex flex-col h-[500px]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b-2 border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h4 className="font-black text-foreground">Ask the Evidence</h4>
          <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary font-bold">NO HALLUCINATION</span>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg">
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div
              className={cn(
                "max-w-[85%] rounded-xl p-3",
                msg.role === "user" ? "bg-primary text-background" : "bg-muted/50 border border-border",
              )}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.receipts && msg.receipts.length > 0 && (
                <div className="mt-2 pt-2 border-t border-border/50">
                  <p className="text-xs font-bold mb-1 opacity-70">Sources:</p>
                  {msg.receipts.slice(0, 3).map((url, j) => (
                    <a
                      key={j}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary hover:underline block truncate"
                    >
                      {url}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted/50 border border-border rounded-xl p-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested questions */}
      <div className="px-4 py-2 border-t border-border/50 flex gap-2 overflow-x-auto">
        {SUGGESTED_QUESTIONS.slice(0, 3).map((q, i) => (
          <button
            key={i}
            onClick={() => handleSubmit(q)}
            disabled={isLoading}
            className="text-xs px-3 py-1.5 bg-muted/30 hover:bg-muted/50 rounded-full text-muted-foreground hover:text-foreground transition-colors whitespace-nowrap font-medium"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t-2 border-border">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSubmit(input)
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about their evidence..."
            disabled={isLoading}
            className="flex-1 bg-black border-2 border-border rounded-xl px-4 py-2 text-sm font-medium text-foreground focus:outline-none focus:border-primary"
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="rounded-xl bg-primary hover:bg-primary/90"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
