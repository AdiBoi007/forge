"use client"

import type React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Image from "next/image"
import { FileSearch, Users, BarChart3 } from "lucide-react"
import { cn } from "@/lib/utils"

const steps = [
  { href: "/job", label: "Define", icon: FileSearch, step: 1 },
  { href: "/candidates", label: "Candidates", icon: Users, step: 2 },
  { href: "/results", label: "Results", icon: BarChart3, step: 3 },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLanding = pathname === "/"
  const currentStep = steps.findIndex((s) => pathname.startsWith(s.href)) + 1

  return (
    <div className="min-h-screen bg-background grid-background">
      <div className="fixed inset-0 radial-glow pointer-events-none" />

      <nav className="sticky top-0 z-50 border-b-[3px] border-border/60 bg-background/95 backdrop-blur-2xl">
        <div className="mx-auto max-w-7xl px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="h-12 w-12 rounded-2xl overflow-hidden shadow-2xl shadow-foreground/20 ring-4 ring-foreground/10">
              <Image src="/forge-logo.png" alt="FORGE" width={48} height={48} className="w-full h-full object-cover" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-foreground">FORGE</span>
          </Link>

          {!isLanding && (
            <div className="flex items-center gap-1.5 bg-card rounded-2xl p-2 border-[3px] border-border/60 shadow-xl">
              {steps.map((step) => {
                const isActive = pathname.startsWith(step.href)
                const isPast = currentStep > step.step
                const isFuture = currentStep < step.step

                return (
                  <Link
                    key={step.href}
                    href={isFuture ? "#" : step.href}
                    className={cn(
                      "flex items-center gap-3 px-5 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-[0.1em]",
                      isActive && "bg-foreground/10 text-foreground ring-2 ring-foreground/20",
                      isPast && !isActive && "text-muted-foreground hover:text-foreground hover:bg-surface",
                      isFuture && "text-muted-foreground/30 pointer-events-none",
                    )}
                  >
                    <span
                      className={cn(
                        "h-6 w-6 rounded-full text-[11px] flex items-center justify-center font-black border-2",
                        isActive && "bg-foreground text-background border-foreground",
                        isPast && !isActive && "bg-success/20 text-success border-success/40",
                        isFuture && "bg-surface text-muted-foreground/30 border-border/40",
                      )}
                    >
                      {isPast && !isActive ? "✓" : step.step}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </nav>

      <main className="relative">{children}</main>
    </div>
  )
}
