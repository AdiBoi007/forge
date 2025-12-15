"use client"

interface ScoreBarProps {
  capability: number
  context: number
  penalties?: number
}

export function ScoreBar({ capability, context, penalties = 0 }: ScoreBarProps) {
  const total = capability + context
  const capabilityWidth = (capability / 100) * 100
  const contextWidth = (context / 100) * 100
  const penaltyWidth = (penalties / 100) * 100

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Score composition</span>
        <span className="font-medium text-foreground">{Math.round(capability + context - penalties)}/100</span>
      </div>

      <div className="h-3 bg-surface rounded-full overflow-hidden flex">
        <div
          className="h-full bg-primary score-bar-animated"
          style={{ width: `${capabilityWidth}%` }}
          title={`Capability: ${capability}`}
        />
        <div
          className="h-full bg-success score-bar-animated"
          style={{ width: `${contextWidth}%`, animationDelay: "0.2s" }}
          title={`Context: ${context}`}
        />
        {penalties > 0 && (
          <div
            className="h-full bg-destructive score-bar-animated"
            style={{ width: `${penaltyWidth}%`, animationDelay: "0.4s" }}
            title={`Penalties: -${penalties}`}
          />
        )}
      </div>

      <div className="flex items-center gap-4 text-[11px]">
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">Capability ({Math.round(capability)})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-2 w-2 rounded-full bg-success" />
          <span className="text-muted-foreground">Context ({Math.round(context)})</span>
        </div>
        {penalties > 0 && (
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-muted-foreground">Penalties (-{penalties})</span>
          </div>
        )}
      </div>
    </div>
  )
}
