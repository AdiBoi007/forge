// FORGE - Shareable Analysis Links
// Generate tokenized read-only links for hiring team review

import { createHash } from "crypto"

export interface ShareableAnalysis {
  token: string
  createdAt: string
  expiresAt: string
  jobTitle: string
  candidateIds: string[]
  analysisData: string // JSON stringified
  views: number
  maxViews: number
}

// Simple token generation (in production, use proper crypto)
export function generateShareToken(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 10)
  return `forge_${timestamp}_${random}`
}

// Hash for verification
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").substring(0, 16)
}

export function createShareableLink(params: {
  jobTitle: string
  candidateIds: string[]
  analysisData: object
  expiresInHours?: number
  maxViews?: number
}): ShareableAnalysis {
  const { jobTitle, candidateIds, analysisData, expiresInHours = 168, maxViews = 50 } = params

  const token = generateShareToken()
  const now = new Date()
  const expires = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000)

  return {
    token,
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    jobTitle,
    candidateIds,
    analysisData: JSON.stringify(analysisData),
    views: 0,
    maxViews,
  }
}

export function isShareLinkValid(share: ShareableAnalysis): { valid: boolean; reason?: string } {
  const now = new Date()
  const expires = new Date(share.expiresAt)

  if (now > expires) {
    return { valid: false, reason: "Link has expired" }
  }

  if (share.views >= share.maxViews) {
    return { valid: false, reason: "Maximum views reached" }
  }

  return { valid: true }
}

// Store in localStorage (in production, use database)
const SHARE_STORAGE_KEY = "forge_shared_analyses"

export function saveShareableAnalysis(share: ShareableAnalysis): void {
  if (typeof window === "undefined") return

  const existing = getStoredShares()
  existing[share.token] = share
  localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(existing))
}

export function getStoredShares(): Record<string, ShareableAnalysis> {
  if (typeof window === "undefined") return {}

  try {
    const stored = localStorage.getItem(SHARE_STORAGE_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export function getShareByToken(token: string): ShareableAnalysis | null {
  const shares = getStoredShares()
  return shares[token] || null
}

export function incrementShareViews(token: string): void {
  const shares = getStoredShares()
  if (shares[token]) {
    shares[token].views += 1
    localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(shares))
  }
}

export function deleteShare(token: string): void {
  const shares = getStoredShares()
  delete shares[token]
  localStorage.setItem(SHARE_STORAGE_KEY, JSON.stringify(shares))
}

export function getShareUrl(token: string): string {
  if (typeof window === "undefined") return ""
  return `${window.location.origin}/shared/${token}`
}
