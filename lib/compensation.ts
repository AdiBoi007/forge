import compSeedData from "@/data/comp_seed.json"

export type Seniority = "Intern" | "Junior" | "Mid" | "Senior" | "Lead"
export type EmploymentType = "Full-time" | "Part-time" | "Contract"
export type Confidence = "LOW" | "MEDIUM" | "HIGH"

export interface CustomCompData {
  roleTitle: string
  location: string
  seniority: string
  currency: string
  p10: number
  p50: number
  p90: number
  sourceName: string
}

export interface CompBenchmarkRequest {
  roleTitle: string
  location: string
  currency: string
  seniority: Seniority
  industry?: string
  companySize?: string
  employmentType?: EmploymentType
  skills?: string[]
  customData?: CustomCompData[] // Added custom data support
}

export interface CompBenchmarkResult {
  p10: number
  p50: number
  p90: number
  confidence: Confidence
  confidenceReason: string
  drivers: string[]
  sourceNotes: string[]
  matchedRoles: number
  currency: string
}

export interface CompFit {
  status: "in-band" | "slightly-above" | "way-above" | "slightly-below" | "way-below" | "unknown"
  label: string
  icon: string
  xsMultiplier: number
  note: string
}

// Fuzzy match role titles
function fuzzyRoleMatch(query: string, candidate: string): number {
  const q = query
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .trim()
  const c = candidate
    .toLowerCase()
    .replace(/[^a-z0-9]/g, " ")
    .trim()

  if (q === c) return 1.0
  if (c.includes(q) || q.includes(c)) return 0.8

  // Check for key role words
  const roleWords = ["engineer", "developer", "designer", "manager", "recruiter", "analyst", "scientist"]
  const qWords = q.split(/\s+/)
  const cWords = c.split(/\s+/)

  let matchScore = 0
  for (const word of qWords) {
    if (cWords.includes(word)) matchScore += 0.3
    if (roleWords.includes(word) && cWords.some((cw) => roleWords.includes(cw))) matchScore += 0.1
  }

  // Check for type matches
  const typeMap: Record<string, string[]> = {
    frontend: ["frontend", "front-end", "react", "vue", "angular", "ui"],
    backend: ["backend", "back-end", "server", "api", "node", "python", "go"],
    fullstack: ["fullstack", "full-stack", "full stack"],
    devops: ["devops", "sre", "platform", "infrastructure"],
    data: ["data", "analytics", "bi"],
    ml: ["ml", "machine learning", "ai", "deep learning"],
  }

  for (const [type, keywords] of Object.entries(typeMap)) {
    const qHasType = keywords.some((k) => q.includes(k))
    const cHasType = keywords.some((k) => c.includes(k))
    if (qHasType && cHasType) matchScore += 0.2
  }

  return Math.min(matchScore, 0.9)
}

// Calculate compensation benchmark
export function calculateCompBenchmark(req: CompBenchmarkRequest): CompBenchmarkResult {
  const { roleTitle, location, currency, seniority, industry, companySize, skills = [], customData } = req

  type RoleData = {
    title: string
    location: string
    seniority: string
    currency: string
    p10: number
    p50: number
    p90: number
    source: string
    isCustom: boolean
  }

  const allRoles: RoleData[] = [
    // Custom data first (higher priority)
    ...(customData || []).map((d) => ({
      title: d.roleTitle,
      location: d.location,
      seniority: d.seniority,
      currency: d.currency,
      p10: d.p10,
      p50: d.p50,
      p90: d.p90,
      source: d.sourceName || "Custom CSV",
      isCustom: true,
    })),
    // Seed data
    ...compSeedData.roles.map((r) => ({
      title: r.title,
      location: r.location,
      seniority: r.seniority,
      currency: r.currency,
      p10: r.p10,
      p50: r.p50,
      p90: r.p90,
      source: "Seed dataset",
      isCustom: false,
    })),
  ]

  // Find matching roles
  const matches: { role: RoleData; score: number }[] = []

  for (const role of allRoles) {
    let score = 0

    // Role title match
    const titleMatch = fuzzyRoleMatch(roleTitle, role.title)
    if (titleMatch < 0.3) continue
    score += titleMatch * 0.4

    // Seniority match
    if (role.seniority === seniority) {
      score += 0.3
    } else {
      const seniorityOrder = ["Intern", "Junior", "Mid", "Senior", "Lead"]
      const diff = Math.abs(seniorityOrder.indexOf(seniority) - seniorityOrder.indexOf(role.seniority as Seniority))
      if (diff <= 1) score += 0.15
    }

    // Location match
    const locLower = location.toLowerCase()
    const roleLocLower = role.location.toLowerCase()
    if (roleLocLower === locLower) {
      score += 0.2
    } else if (roleLocLower === "remote" || locLower.includes("remote")) {
      score += 0.1
    }

    // Currency match
    if (role.currency === currency) {
      score += 0.1
    }

    if (role.isCustom) {
      score += 0.15
    }

    matches.push({ role, score })
  }

  // Sort by score and take top matches
  matches.sort((a, b) => b.score - a.score)
  const topMatches = matches.slice(0, 5)

  if (topMatches.length === 0) {
    // Fallback: use broad averages
    return {
      p10: 80000,
      p50: 120000,
      p90: 180000,
      confidence: "LOW",
      confidenceReason: "No matching roles found - using broad market averages",
      drivers: ["No specific data for this role/location combination"],
      sourceNotes: ["Fallback estimates based on general market data"],
      matchedRoles: 0,
      currency,
    }
  }

  // Calculate weighted averages
  const totalWeight = topMatches.reduce((sum, m) => sum + m.score, 0)
  let p10 = 0,
    p50 = 0,
    p90 = 0

  for (const match of topMatches) {
    const weight = match.score / totalWeight
    // Convert currency if needed
    let multiplier = 1
    if (match.role.currency !== currency) {
      const conversions: Record<string, Record<string, number>> = {
        USD: { GBP: 0.79, EUR: 0.92, AUD: 1.53 },
        GBP: { USD: 1.27, EUR: 1.17, AUD: 1.94 },
        EUR: { USD: 1.09, GBP: 0.86, AUD: 1.66 },
        AUD: { USD: 0.65, GBP: 0.52, EUR: 0.6 },
      }
      multiplier = conversions[match.role.currency]?.[currency] || 1
    }

    p10 += match.role.p10 * multiplier * weight
    p50 += match.role.p50 * multiplier * weight
    p90 += match.role.p90 * multiplier * weight
  }

  // Apply skill premiums
  let skillMultiplier = 1
  const skillDrivers: string[] = []
  const skillPremiums = compSeedData.skillPremiums as Record<string, number>

  for (const skill of skills) {
    const premium = skillPremiums[skill]
    if (premium && premium > 1) {
      skillMultiplier *= premium
      skillDrivers.push(`${skill} premium (+${Math.round((premium - 1) * 100)}%)`)
    }
  }
  skillMultiplier = Math.min(skillMultiplier, 1.25)

  // Apply industry multiplier
  let industryMultiplier = 1
  const industryDrivers: string[] = []
  if (industry) {
    const indMult = (compSeedData.industryMultipliers as Record<string, number>)[industry]
    if (indMult) {
      industryMultiplier = indMult
      if (indMult > 1) {
        industryDrivers.push(`${industry} industry premium (+${Math.round((indMult - 1) * 100)}%)`)
      } else if (indMult < 1) {
        industryDrivers.push(`${industry} industry adjustment (${Math.round((indMult - 1) * 100)}%)`)
      }
    }
  }

  // Apply company size multiplier
  let sizeMultiplier = 1
  const sizeDrivers: string[] = []
  if (companySize) {
    const sizeMult = (compSeedData.companySizeMultipliers as Record<string, number>)[companySize]
    if (sizeMult) {
      sizeMultiplier = sizeMult
      if (sizeMult > 1) {
        sizeDrivers.push(`Large company premium (+${Math.round((sizeMult - 1) * 100)}%)`)
      } else if (sizeMult < 1) {
        sizeDrivers.push(`Small company adjustment (${Math.round((sizeMult - 1) * 100)}%)`)
      }
    }
  }

  // Apply location premium if different from SF baseline
  const locationDrivers: string[] = []
  const locMult = (compSeedData.locationMultipliers as Record<string, number>)[location]
  if (locMult && locMult !== 1) {
    if (locMult > 0.9) {
      locationDrivers.push(`${location} market (high cost of living)`)
    } else if (locMult < 0.8) {
      locationDrivers.push(`${location} market adjustment (${Math.round((locMult - 1) * 100)}%)`)
    }
  }

  // Final calculation
  const totalMultiplier = skillMultiplier * industryMultiplier * sizeMultiplier
  p10 = Math.round(p10 * totalMultiplier)
  p50 = Math.round(p50 * totalMultiplier)
  p90 = Math.round(p90 * totalMultiplier)

  const customMatchCount = topMatches.filter((m) => m.role.isCustom).length
  let confidence: Confidence = "MEDIUM"
  let confidenceReason = ""

  if (customMatchCount >= 2) {
    confidence = "HIGH"
    confidenceReason = `Using ${customMatchCount} matches from your custom data`
  } else if (topMatches.length >= 3 && topMatches[0].score > 0.7) {
    confidence = "HIGH"
    confidenceReason = `Strong matches found (${topMatches.length} similar roles)`
  } else if (topMatches.length < 2 || topMatches[0].score < 0.5) {
    confidence = "LOW"
    confidenceReason = "Limited matching data - estimates may vary significantly"
  } else {
    confidenceReason = `Moderate matches (${topMatches.length} partially similar roles)`
  }

  // Combine all drivers
  const drivers = [
    `${seniority} level baseline`,
    ...locationDrivers,
    ...skillDrivers.slice(0, 3),
    ...industryDrivers,
    ...sizeDrivers,
  ].filter(Boolean)

  const sourceNotes = [
    customMatchCount > 0 ? `Custom CSV data (${customMatchCount} matches)` : null,
    "Seed dataset (demo)",
    `Matched ${topMatches.length} similar roles`,
    "Role-level-location normalization applied",
  ].filter(Boolean) as string[]

  return {
    p10,
    p50,
    p90,
    confidence,
    confidenceReason,
    drivers,
    sourceNotes,
    matchedRoles: topMatches.length,
    currency,
  }
}

// Calculate comp fit for a candidate
export function calculateCompFit(
  candidateExpectation: { min?: number; max?: number; target?: number } | undefined,
  benchmark: CompBenchmarkResult,
): CompFit {
  if (
    !candidateExpectation ||
    (!candidateExpectation.min && !candidateExpectation.max && !candidateExpectation.target)
  ) {
    return {
      status: "unknown",
      label: "No salary info",
      icon: "○",
      xsMultiplier: 1.0,
      note: "Candidate has not provided salary expectations",
    }
  }

  const candidateTarget =
    candidateExpectation.target ||
    (candidateExpectation.min && candidateExpectation.max
      ? (candidateExpectation.min + candidateExpectation.max) / 2
      : candidateExpectation.min || candidateExpectation.max || 0)

  const { p10, p50, p90 } = benchmark

  if (candidateTarget <= p50) {
    return {
      status: "in-band",
      label: "In band",
      icon: "✓",
      xsMultiplier: 1.02,
      note: `Expectation (${formatCurrency(candidateTarget, benchmark.currency)}) is at or below median`,
    }
  }

  if (candidateTarget <= p90) {
    return {
      status: "slightly-above",
      label: "Slightly above",
      icon: "△",
      xsMultiplier: 0.98,
      note: `Expectation (${formatCurrency(candidateTarget, benchmark.currency)}) is above median but within P90`,
    }
  }

  if (candidateTarget > p90 * 1.15) {
    return {
      status: "way-above",
      label: "Way above",
      icon: "✗",
      xsMultiplier: 0.92,
      note: `Expectation (${formatCurrency(candidateTarget, benchmark.currency)}) exceeds P90 by >15%`,
    }
  }

  return {
    status: "slightly-above",
    label: "Above P90",
    icon: "△",
    xsMultiplier: 0.95,
    note: `Expectation (${formatCurrency(candidateTarget, benchmark.currency)}) is above P90`,
  }
}

function formatCurrency(amount: number, currency: string): string {
  const symbols: Record<string, string> = { USD: "$", GBP: "£", EUR: "€", AUD: "A$" }
  const symbol = symbols[currency] || currency + " "
  return `${symbol}${amount.toLocaleString()}`
}

export { formatCurrency }
