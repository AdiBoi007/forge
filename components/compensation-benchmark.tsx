"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  ChevronDown,
  ChevronUp,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  Upload,
  Info,
  FileSpreadsheet,
  X,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type CompBenchmarkResult, formatCurrency, type Seniority } from "@/lib/compensation"

interface CompensationBenchmarkProps {
  extractedSkills?: string[]
  roleTitle?: string
  onBudgetSet?: (budget: { min: number; max: number; currency: string }) => void
}

const LOCATIONS = [
  "San Francisco",
  "New York",
  "Seattle",
  "Los Angeles",
  "Austin",
  "Denver",
  "Boston",
  "London",
  "Berlin",
  "Sydney",
  "Toronto",
  "Singapore",
  "Remote",
]

const CURRENCIES = ["USD", "GBP", "EUR", "AUD"]

const SENIORITIES: Seniority[] = ["Intern", "Junior", "Mid", "Senior", "Lead"]

const INDUSTRIES = [
  "Fintech",
  "FAANG",
  "Crypto/Web3",
  "AI/ML Startups",
  "Enterprise SaaS",
  "E-commerce",
  "Healthcare",
  "Government",
  "Non-profit",
  "Agency",
]

const COMPANY_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"]

export function CompensationBenchmark({
  extractedSkills = [],
  roleTitle = "",
  onBudgetSet,
}: CompensationBenchmarkProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<CompBenchmarkResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [location, setLocation] = useState("San Francisco")
  const [currency, setCurrency] = useState("USD")
  const [seniority, setSeniority] = useState<Seniority>("Mid")
  const [industry, setIndustry] = useState<string>("Any")
  const [companySize, setCompanySize] = useState<string>("Any")
  const [customRoleTitle, setCustomRoleTitle] = useState(roleTitle)
  const [selectedSkills, setSelectedSkills] = useState<string[]>(extractedSkills.slice(0, 5))

  // CSV upload state
  const [customData, setCustomData] = useState<
    Array<{
      roleTitle: string
      location: string
      seniority: string
      currency: string
      p10: number
      p50: number
      p90: number
      sourceName: string
    }>
  >([])
  const [csvError, setCsvError] = useState<string | null>(null)
  const [showCsvPreview, setShowCsvPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvError(null)
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result as string
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length < 2) {
          throw new Error("CSV must have a header row and at least one data row")
        }

        const header = lines[0]
          .toLowerCase()
          .split(",")
          .map((h) => h.trim())
        const requiredCols = ["roletitle", "location", "seniority", "currency", "p10", "p50", "p90"]
        const missingCols = requiredCols.filter((col) => !header.includes(col))

        if (missingCols.length > 0) {
          throw new Error(`Missing required columns: ${missingCols.join(", ")}`)
        }

        const colIndex = (name: string) => header.indexOf(name)
        const parsed: typeof customData = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim())
          if (values.length < header.length) continue

          const row = {
            roleTitle: values[colIndex("roletitle")] || "",
            location: values[colIndex("location")] || "",
            seniority: values[colIndex("seniority")] || "Mid",
            currency: values[colIndex("currency")] || "USD",
            p10: Number.parseFloat(values[colIndex("p10")]) || 0,
            p50: Number.parseFloat(values[colIndex("p50")]) || 0,
            p90: Number.parseFloat(values[colIndex("p90")]) || 0,
            sourceName: values[colIndex("sourcename")] || "Custom CSV",
          }

          if (row.roleTitle && row.p50 > 0) {
            parsed.push(row)
          }
        }

        if (parsed.length === 0) {
          throw new Error("No valid data rows found in CSV")
        }

        setCustomData(parsed)
        setShowCsvPreview(true)
      } catch (err) {
        setCsvError(err instanceof Error ? err.message : "Failed to parse CSV")
      }
    }

    reader.readAsText(file)
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleEstimate = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/comp/benchmark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roleTitle: customRoleTitle || roleTitle || "Software Engineer",
          location,
          currency,
          seniority,
          industry: industry === "Any" ? undefined : industry,
          companySize: companySize === "Any" ? undefined : companySize,
          skills: selectedSkills,
          customData: customData.length > 0 ? customData : undefined,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error || "Failed to get benchmark")
      }

      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to calculate benchmark")
    } finally {
      setIsLoading(false)
    }
  }

  const handleUseBudget = () => {
    if (result && onBudgetSet) {
      onBudgetSet({
        min: result.p10,
        max: result.p90,
        currency: result.currency,
      })
    }
  }

  const confidenceColor = {
    LOW: "bg-rose-500/20 text-rose-400 border-rose-500/30",
    MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    HIGH: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  }

  return (
    <Card className="border-border/50 bg-muted/30">
      <CardHeader className="cursor-pointer select-none" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-emerald-400" />
            <CardTitle className="text-lg font-display">Compensation Benchmark</CardTitle>
            <Badge variant="outline" className="text-xs">
              Optional
            </Badge>
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-6">
          {/* Inputs Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {/* Role Title */}
            <div className="col-span-2 md:col-span-1">
              <label className="text-sm text-muted-foreground mb-1.5 block">Role Title</label>
              <Input
                value={customRoleTitle}
                onChange={(e) => setCustomRoleTitle(e.target.value)}
                placeholder="e.g., Senior Frontend Engineer"
                className="bg-background/50"
              />
            </div>

            {/* Location */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Location</label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATIONS.map((loc) => (
                    <SelectItem key={loc} value={loc}>
                      {loc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Currency</label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((cur) => (
                    <SelectItem key={cur} value={cur}>
                      {cur}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seniority */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">Seniority</label>
              <Select value={seniority} onValueChange={(v) => setSeniority(v as Seniority)}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SENIORITIES.map((sen) => (
                    <SelectItem key={sen} value={sen}>
                      {sen}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Industry (optional) */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                Industry <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <Select value={industry} onValueChange={setIndustry}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Any</SelectItem>
                  {INDUSTRIES.map((ind) => (
                    <SelectItem key={ind} value={ind}>
                      {ind}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Company Size (optional) */}
            <div>
              <label className="text-sm text-muted-foreground mb-1.5 block">
                Company Size <span className="text-muted-foreground/50">(optional)</span>
              </label>
              <Select value={companySize} onValueChange={setCompanySize}>
                <SelectTrigger className="bg-background/50">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Any">Any</SelectItem>
                  {COMPANY_SIZES.map((size) => (
                    <SelectItem key={size} value={size}>
                      {size} employees
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Skills */}
          {extractedSkills.length > 0 && (
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">
                Skills (from JD) - select up to 5 for premium calculation
              </label>
              <div className="flex flex-wrap gap-2">
                {extractedSkills.slice(0, 10).map((skill) => (
                  <Badge
                    key={skill}
                    variant={selectedSkills.includes(skill) ? "default" : "outline"}
                    className={`cursor-pointer transition-colors ${
                      selectedSkills.includes(skill)
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => {
                      if (selectedSkills.includes(skill)) {
                        setSelectedSkills(selectedSkills.filter((s) => s !== skill))
                      } else if (selectedSkills.length < 5) {
                        setSelectedSkills([...selectedSkills, skill])
                      }
                    }}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={handleEstimate} disabled={isLoading} className="bg-emerald-600 hover:bg-emerald-700">
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Estimate Market Band
                </>
              )}
            </Button>

            <input ref={fileInputRef} type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                    className={customData.length > 0 ? "border-emerald-500/50 text-emerald-400" : ""}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload custom salary CSV</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {customData.length > 0 && (
              <Badge
                variant="outline"
                className="gap-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/30 cursor-pointer"
                onClick={() => setShowCsvPreview(!showCsvPreview)}
              >
                <FileSpreadsheet className="h-3 w-3" />
                {customData.length} custom rows
              </Badge>
            )}
          </div>

          {csvError && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{csvError}</span>
            </div>
          )}

          {showCsvPreview && customData.length > 0 && (
            <div className="p-4 rounded-lg bg-background/50 border border-border/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                  <span className="font-medium text-sm">Custom Salary Data</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => {
                    setCustomData([])
                    setShowCsvPreview(false)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="max-h-40 overflow-auto">
                <table className="w-full text-xs">
                  <thead className="text-muted-foreground">
                    <tr className="border-b border-border/30">
                      <th className="text-left py-1.5 pr-2">Role</th>
                      <th className="text-left py-1.5 pr-2">Location</th>
                      <th className="text-left py-1.5 pr-2">Level</th>
                      <th className="text-right py-1.5 pr-2">P10</th>
                      <th className="text-right py-1.5 pr-2">P50</th>
                      <th className="text-right py-1.5">P90</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customData.slice(0, 10).map((row, i) => (
                      <tr key={i} className="border-b border-border/20">
                        <td className="py-1.5 pr-2 truncate max-w-24">{row.roleTitle}</td>
                        <td className="py-1.5 pr-2">{row.location}</td>
                        <td className="py-1.5 pr-2">{row.seniority}</td>
                        <td className="py-1.5 pr-2 text-right text-muted-foreground">
                          {formatCurrency(row.p10, row.currency)}
                        </td>
                        <td className="py-1.5 pr-2 text-right">{formatCurrency(row.p50, row.currency)}</td>
                        <td className="py-1.5 text-right text-muted-foreground">
                          {formatCurrency(row.p90, row.currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {customData.length > 10 && (
                  <div className="text-xs text-muted-foreground mt-2">+ {customData.length - 10} more rows</div>
                )}
              </div>

              <div className="text-xs text-muted-foreground">
                Custom data will be prioritized over seed data when calculating benchmarks.
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4 p-4 rounded-lg bg-background/50 border border-border/50">
              {/* Salary Band */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-sm text-muted-foreground">Estimated Salary Band</div>
                  <div className="flex items-baseline gap-4">
                    <div className="text-sm text-muted-foreground">
                      P10: <span className="text-foreground">{formatCurrency(result.p10, result.currency)}</span>
                    </div>
                    <div className="text-2xl font-bold text-emerald-400">
                      {formatCurrency(result.p50, result.currency)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      P90: <span className="text-foreground">{formatCurrency(result.p90, result.currency)}</span>
                    </div>
                  </div>
                </div>

                <Badge className={confidenceColor[result.confidence]}>{result.confidence} confidence</Badge>
              </div>

              {/* Visual Bar */}
              <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                <div className="absolute left-[10%] right-[10%] h-full bg-gradient-to-r from-emerald-600/50 via-emerald-500 to-emerald-600/50 rounded-full" />
                <div className="absolute left-[10%] top-0 -translate-x-1/2 h-full w-0.5 bg-emerald-400/50" />
                <div className="absolute left-[50%] top-0 -translate-x-1/2 h-full w-1 bg-emerald-400" />
                <div className="absolute left-[90%] top-0 -translate-x-1/2 h-full w-0.5 bg-emerald-400/50" />
              </div>

              {/* Confidence Reason */}
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <Info className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{result.confidenceReason}</span>
              </div>

              {/* Drivers */}
              {result.drivers.length > 0 && (
                <div>
                  <div className="text-sm font-medium mb-2">Drivers</div>
                  <ul className="space-y-1">
                    {result.drivers.map((driver, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        {driver}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Use as Budget Button */}
              <Button variant="outline" onClick={handleUseBudget} className="w-full mt-2 bg-transparent">
                <DollarSign className="h-4 w-4 mr-2" />
                Use P10-P90 as Budget Range
              </Button>

              {/* Source Notes */}
              <div className="text-xs text-muted-foreground/60 pt-2 border-t border-border/30">
                Sources: {result.sourceNotes.join(" • ")}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
