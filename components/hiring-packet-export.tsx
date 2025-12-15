"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileJson, FileText, Loader2, Check, Package } from "lucide-react"
import { buildHiringPacket, downloadHiringPacketJSON, downloadHiringPacketPDF } from "@/lib/hiring-packet"
import type { CandidateAnalysis } from "@/lib/scoring"
import type { InterviewPack } from "@/lib/interview-pack"

interface HiringPacketExportProps {
  candidate: CandidateAnalysis
  jobTitle: string
  interviewPack?: InterviewPack
}

export function HiringPacketExport({ candidate, jobTitle, interviewPack }: HiringPacketExportProps) {
  const [isExporting, setIsExporting] = useState<"json" | "pdf" | null>(null)
  const [exported, setExported] = useState<"json" | "pdf" | null>(null)

  const handleExport = async (format: "json" | "pdf") => {
    setIsExporting(format)

    // Build the packet
    const packet = buildHiringPacket({
      candidate,
      jobTitle,
      interviewPack,
    })

    // Slight delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300))

    if (format === "json") {
      downloadHiringPacketJSON(packet)
    } else {
      downloadHiringPacketPDF(packet)
    }

    setIsExporting(null)
    setExported(format)
    setTimeout(() => setExported(null), 2000)
  }

  return (
    <div className="bg-surface rounded-xl border-2 border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="h-5 w-5 text-primary" />
        <h4 className="font-black text-foreground">Export Hiring Packet</h4>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Download a complete packet with scores, evidence receipts, interview questions, risks, and mini-tasks.
      </p>

      <div className="flex gap-3">
        <Button
          onClick={() => handleExport("json")}
          disabled={isExporting !== null}
          variant="outline"
          className="flex-1 border-2 border-border rounded-xl font-bold bg-transparent"
        >
          {isExporting === "json" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : exported === "json" ? (
            <Check className="mr-2 h-4 w-4 text-success" />
          ) : (
            <FileJson className="mr-2 h-4 w-4" />
          )}
          JSON
        </Button>

        <Button
          onClick={() => handleExport("pdf")}
          disabled={isExporting !== null}
          className="flex-1 bg-primary hover:bg-primary/90 rounded-xl font-bold"
        >
          {isExporting === "pdf" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : exported === "pdf" ? (
            <Check className="mr-2 h-4 w-4" />
          ) : (
            <FileText className="mr-2 h-4 w-4" />
          )}
          PDF
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-3">
        PDF opens in a new tab for printing. JSON is machine-readable for ATS integration.
      </p>
    </div>
  )
}
