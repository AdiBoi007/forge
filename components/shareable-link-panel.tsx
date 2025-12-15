"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Share2, Copy, Check, Link2, Clock, Eye, Trash2 } from "lucide-react"
import {
  createShareableLink,
  saveShareableAnalysis,
  getShareUrl,
  getStoredShares,
  deleteShare,
  type ShareableAnalysis,
} from "@/lib/shareable-link"
import type { CandidateAnalysis } from "@/lib/scoring"

interface ShareableLinkPanelProps {
  candidates: CandidateAnalysis[]
  jobTitle: string
}

export function ShareableLinkPanel({ candidates, jobTitle }: ShareableLinkPanelProps) {
  const [shareLink, setShareLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [existingShares, setExistingShares] = useState<ShareableAnalysis[]>(() => {
    if (typeof window === "undefined") return []
    return Object.values(getStoredShares())
  })

  const handleCreateLink = () => {
    const share = createShareableLink({
      jobTitle,
      candidateIds: candidates.map((c) => c.id),
      analysisData: { candidates, jobTitle },
      expiresInHours: 168, // 7 days
      maxViews: 50,
    })

    saveShareableAnalysis(share)
    const url = getShareUrl(share.token)
    setShareLink(url)
    setExistingShares((prev) => [...prev, share])
  }

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleDelete = (token: string) => {
    deleteShare(token)
    setExistingShares((prev) => prev.filter((s) => s.token !== token))
    if (shareLink?.includes(token)) {
      setShareLink(null)
    }
  }

  return (
    <div className="bg-surface rounded-xl border-2 border-border p-4">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="h-5 w-5 text-primary" />
        <h4 className="font-black text-foreground">Share with Team</h4>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Create a read-only link for your hiring team. No login required.
      </p>

      {!shareLink ? (
        <Button onClick={handleCreateLink} className="w-full bg-primary hover:bg-primary/90 rounded-xl font-bold">
          <Link2 className="mr-2 h-4 w-4" />
          Create Shareable Link
        </Button>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 bg-black border-2 border-border rounded-lg px-3 py-2 text-sm font-mono text-foreground"
            />
            <Button onClick={handleCopy} variant="outline" className="border-2 border-border rounded-lg bg-transparent">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Expires in 7 days
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              Max 50 views
            </span>
          </div>

          <Button
            onClick={handleCreateLink}
            variant="outline"
            size="sm"
            className="w-full border-2 border-border rounded-lg font-bold bg-transparent"
          >
            Create New Link
          </Button>
        </div>
      )}

      {/* Existing shares */}
      {existingShares.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <h5 className="text-xs font-bold text-muted-foreground mb-2">Active Links</h5>
          <div className="space-y-2 max-h-[150px] overflow-y-auto">
            {existingShares.slice(-5).map((share) => (
              <div key={share.token} className="flex items-center justify-between text-xs bg-black/30 rounded-lg p-2">
                <div>
                  <p className="font-bold text-foreground truncate max-w-[150px]">{share.jobTitle}</p>
                  <p className="text-muted-foreground">
                    {share.views}/{share.maxViews} views
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(share.token)}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
