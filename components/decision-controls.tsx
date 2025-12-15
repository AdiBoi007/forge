"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ThumbsUp, ThumbsDown, X, Check, Clock } from "lucide-react"
import type { Decision } from "@/lib/portable"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "forge_decisions"

interface DecisionControlsProps {
  candidateId: string
  candidateName: string
  onDecisionChange?: (decision: Decision) => void
}

export function DecisionControls({ candidateId, candidateName, onDecisionChange }: DecisionControlsProps) {
  const [decision, setDecision] = useState<Decision>({
    candidateId,
    status: "none",
    notes: "",
    nextStep: "none",
    updatedAt: new Date().toISOString(),
  })
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const decisions: Record<string, Decision> = JSON.parse(stored)
        if (decisions[candidateId]) {
          setDecision(decisions[candidateId])
        }
      }
    } catch (e) {
      console.error("Failed to load decisions:", e)
    }
  }, [candidateId])

  const saveDecision = useCallback(
    (newDecision: Decision) => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const decisions: Record<string, Decision> = stored ? JSON.parse(stored) : {}
        decisions[candidateId] = newDecision
        localStorage.setItem(STORAGE_KEY, JSON.stringify(decisions))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        onDecisionChange?.(newDecision)
      } catch (e) {
        console.error("Failed to save decision:", e)
      }
    },
    [candidateId, onDecisionChange],
  )

  const handleStatusChange = (status: Decision["status"]) => {
    const newDecision = { ...decision, status, updatedAt: new Date().toISOString() }
    setDecision(newDecision)
    saveDecision(newDecision)
  }

  const handleNextStepChange = (nextStep: Decision["nextStep"]) => {
    const newDecision = { ...decision, nextStep, updatedAt: new Date().toISOString() }
    setDecision(newDecision)
    saveDecision(newDecision)
  }

  const handleNotesChange = (notes: string) => {
    const newDecision = { ...decision, notes, updatedAt: new Date().toISOString() }
    setDecision(newDecision)
  }

  const handleNotesBlur = () => {
    saveDecision(decision)
  }

  return (
    <div className="space-y-4 p-5 bg-surface border-2 border-border rounded-2xl">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-foreground uppercase tracking-wider">Decision</h4>
        {saved && (
          <span className="text-xs font-bold text-success flex items-center gap-1">
            <Check className="h-3 w-3" />
            Saved
          </span>
        )}
      </div>

      {/* Status Buttons */}
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => handleStatusChange("shortlisted")}
          className={cn(
            "flex-1 rounded-xl font-black transition-all",
            decision.status === "shortlisted"
              ? "bg-success hover:bg-success/90 text-background"
              : "bg-success/10 hover:bg-success/20 text-success border-2 border-success/30",
          )}
        >
          <ThumbsUp className="mr-1.5 h-4 w-4" />
          Shortlist
        </Button>
        <Button
          size="sm"
          onClick={() => handleStatusChange("rejected")}
          className={cn(
            "flex-1 rounded-xl font-black transition-all",
            decision.status === "rejected"
              ? "bg-destructive hover:bg-destructive/90 text-background"
              : "bg-destructive/10 hover:bg-destructive/20 text-destructive border-2 border-destructive/30",
          )}
        >
          <ThumbsDown className="mr-1.5 h-4 w-4" />
          Reject
        </Button>
        {decision.status !== "none" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusChange("none")}
            className="px-3 rounded-xl border-2 border-border"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Next Step Dropdown */}
      <div>
        <label className="block text-xs font-bold text-muted-foreground mb-2">Next Step</label>
        <Select value={decision.nextStep} onValueChange={handleNextStepChange}>
          <SelectTrigger className="w-full bg-background border-2 border-border rounded-xl">
            <SelectValue placeholder="Select next step" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No action</SelectItem>
            <SelectItem value="screen">Phone Screen</SelectItem>
            <SelectItem value="tech">Technical Interview</SelectItem>
            <SelectItem value="final">Final Round</SelectItem>
            <SelectItem value="hold">On Hold</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-bold text-muted-foreground mb-2">Notes</label>
        <Textarea
          value={decision.notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          onBlur={handleNotesBlur}
          placeholder={`Notes about ${candidateName}...`}
          rows={3}
          className="bg-background border-2 border-border rounded-xl text-sm resize-none"
        />
      </div>

      {decision.updatedAt && decision.status !== "none" && (
        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Updated {new Date(decision.updatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  )
}

export function getDecisions(): Record<string, Decision> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}
