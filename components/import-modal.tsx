"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Upload, AlertCircle, CheckCircle, FileJson } from "lucide-react"
import { importAnalysisJson } from "@/lib/portable"

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ImportModal({ open, onOpenChange, onSuccess }: ImportModalProps) {
  const [jsonText, setJsonText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImport = () => {
    setError(null)
    setSuccess(false)

    if (!jsonText.trim()) {
      setError("Please paste JSON or upload a file")
      return
    }

    const result = importAnalysisJson(jsonText)
    if (result.ok) {
      setSuccess(true)
      setTimeout(() => {
        onOpenChange(false)
        onSuccess()
      }, 1000)
    } else {
      setError(result.error)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      setJsonText(text)
      setError(null)
    }
    reader.onerror = () => {
      setError("Failed to read file")
    }
    reader.readAsText(file)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card border-3 border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            Import Analysis
          </DialogTitle>
          <DialogDescription className="text-muted-foreground font-bold">
            Paste JSON or upload a FORGE analysis file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border hover:border-foreground/50 h-20 rounded-xl"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload JSON file
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center">
              <span className="bg-card px-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                or paste JSON
              </span>
            </div>
            <div className="border-t border-border" />
          </div>

          <Textarea
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value)
              setError(null)
              setSuccess(false)
            }}
            placeholder='{"version": "1.0", "candidates": [...], "job": {...}}'
            rows={8}
            className="font-mono text-xs bg-surface border-border"
          />

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border-2 border-destructive/30 text-destructive text-sm font-bold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border-2 border-success/30 text-success text-sm font-bold">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Import successful! Redirecting...
            </div>
          )}

          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 border-2 border-border rounded-xl font-black"
            >
              Cancel
            </Button>
            <Button
              onClick={handleImport}
              disabled={!jsonText.trim() || success}
              className="flex-1 bg-foreground hover:bg-foreground/90 text-background rounded-xl font-black"
            >
              Import
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
