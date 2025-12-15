"use client"

import { Minus, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

interface WeightTileProps {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  isHighest?: boolean
}

export function WeightTile({ label, description, value, onChange, isHighest }: WeightTileProps) {
  const increment = () => onChange(Math.min(100, value + 5))
  const decrement = () => onChange(Math.max(0, value - 5))

  return (
    <div
      className={cn(
        "relative bg-card border rounded-xl p-5 transition-all",
        isHighest ? "border-primary/40 shadow-lg shadow-primary/5" : "border-border hover:border-border/80",
      )}
    >
      {isHighest && (
        <div className="absolute -top-2.5 left-4 px-2 py-0.5 bg-primary/10 border border-primary/20 rounded text-[10px] font-bold text-primary uppercase tracking-wider">
          Highest
        </div>
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground capitalize mb-1">{label}</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={decrement}
            disabled={value <= 0}
            className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>

          <div className="w-12 text-center">
            <span className="text-2xl font-bold text-foreground tabular-nums">{value}</span>
          </div>

          <button
            onClick={increment}
            disabled={value >= 100}
            className="h-8 w-8 rounded-lg bg-surface border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border/80 disabled:opacity-30 disabled:pointer-events-none transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-4 h-1.5 bg-surface rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            isHighest ? "bg-primary" : "bg-muted-foreground/30",
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}
