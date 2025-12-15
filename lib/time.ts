// Time utilities for FORGE
// Used for activity scoring and recency calculations

/**
 * Calculate days since a given ISO date string
 */
export function daysSince(dateIso: string): number {
  const date = new Date(dateIso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

/**
 * Check if a date is within the recent activity window
 * Default: 90 days
 */
export function isRecentlyActive(updatedAtIso: string, days = 90): boolean {
  return daysSince(updatedAtIso) <= days
}

/**
 * Format a date as relative time (e.g., "3 days ago", "2 months ago")
 */
export function formatRelativeTime(dateIso: string): string {
  const days = daysSince(dateIso)

  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  if (days < 365) return `${Math.floor(days / 30)} months ago`
  return `${Math.floor(days / 365)} years ago`
}

/**
 * Calculate years active from account creation date
 */
export function yearsActive(createdAtIso: string): number {
  const days = daysSince(createdAtIso)
  return Math.round((days / 365) * 10) / 10 // One decimal place
}
