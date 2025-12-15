"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Check, Mail, X, Send } from "lucide-react"
import type { EmailTemplate } from "@/lib/email-templates"
import { cn } from "@/lib/utils"

interface EmailComposerProps {
  template: EmailTemplate
  type: "rejection" | "invite" | "followup"
  onClose?: () => void
}

export function EmailComposer({ template, type, onClose }: EmailComposerProps) {
  const [subject, setSubject] = useState(template.subject)
  const [body, setBody] = useState(template.body)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    const fullEmail = `Subject: ${subject}\n\n${body}`
    navigator.clipboard.writeText(fullEmail)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyBodyOnly = () => {
    navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const typeConfig = {
    rejection: { label: "Rejection Email", icon: X, color: "text-destructive" },
    invite: { label: "Interview Invite", icon: Send, color: "text-success" },
    followup: { label: "Follow-up Email", icon: Mail, color: "text-primary" },
  }

  const config = typeConfig[type]
  const Icon = config.icon

  return (
    <div className="bg-surface rounded-xl border-2 border-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-5 w-5", config.color)} />
          <h4 className="font-black text-foreground">{config.label}</h4>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyBodyOnly}
            className="border-2 border-border rounded-lg font-bold bg-transparent"
          >
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            Copy Body
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="border-2 border-border rounded-lg font-bold bg-transparent"
          >
            {copied ? <Check className="mr-1.5 h-3.5 w-3.5" /> : <Copy className="mr-1.5 h-3.5 w-3.5" />}
            Copy All
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="rounded-lg">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-muted-foreground mb-1 block">Subject</label>
        <input
          type="text"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-black border-2 border-border rounded-lg px-3 py-2 text-sm font-medium text-foreground focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="text-xs font-bold text-muted-foreground mb-1 block">Body</label>
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="bg-black border-2 border-border rounded-lg text-sm font-medium resize-none"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Edit the template above, then copy to your email client. Placeholders like company name may need adjustment.
      </p>
    </div>
  )
}
