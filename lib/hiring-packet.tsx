// FORGE - Hiring Packet Export
// One-click PDF/JSON export with all candidate data

import type { CandidateAnalysis } from "./scoring"
import type { InterviewPack } from "./interview-pack"
import type { WhyNotHiredReport } from "./why-not-hired"

export interface HiringPacket {
  meta: {
    generatedAt: string
    version: string
    jobTitle: string
    candidateName: string
  }
  summary: {
    overallScore: number
    verdict: string
    cs: number
    xs: number
    proofConfidence: number
    gateStatus: string
  }
  skillBreakdown: Array<{
    skill: string
    score: number
    weight: number
    status: string
    proofTier: string
    evidence: string[]
  }>
  contextSignals: {
    teamwork: { score: number; source: string }
    communication: { score: number; source: string }
    adaptability: { score: number; source: string }
    ownership: { score: number; source: string }
  }
  topEvidence: Array<{
    title: string
    url: string
    skill: string
    impact: string
    why: string
  }>
  risks: Array<{
    severity: string
    description: string
  }>
  explanations: {
    topReasons: string[]
    risks: string[]
    missingProof: string[]
  }
  interviewPack?: Partial<InterviewPack>
  whyNotHired?: WhyNotHiredReport
}

export function buildHiringPacket(params: {
  candidate: CandidateAnalysis
  jobTitle: string
  interviewPack?: InterviewPack
  whyNotHiredReport?: WhyNotHiredReport
}): HiringPacket {
  const { candidate, jobTitle, interviewPack, whyNotHiredReport } = params

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      version: "1.0.0",
      jobTitle,
      candidateName: candidate.name,
    },
    summary: {
      overallScore: candidate.finalScore,
      verdict: candidate.verdict,
      cs: Math.round((candidate.cs || 0) * 100),
      xs: Math.round((candidate.xs || 0) * 100),
      proofConfidence: candidate.proofConfidence,
      gateStatus: candidate.gateStatus,
    },
    skillBreakdown: candidate.capability.skills.map((s) => ({
      skill: s.name,
      score: Math.round(s.score * 100),
      weight: s.weight,
      status: s.status,
      proofTier: s.proofTier || "unknown",
      evidence: s.receipts || [],
    })),
    contextSignals: {
      teamwork: { score: candidate.context.teamwork.score, source: candidate.context.teamwork.source },
      communication: { score: candidate.context.communication.score, source: candidate.context.communication.source },
      adaptability: { score: candidate.context.adaptability.score, source: candidate.context.adaptability.source },
      ownership: { score: candidate.context.ownership.score, source: candidate.context.ownership.source },
    },
    topEvidence: candidate.evidence.slice(0, 5).map((e) => ({
      title: e.title,
      url: e.url,
      skill: e.skill,
      impact: e.impact,
      why: e.whyThisMatters || "",
    })),
    risks: candidate.risks.map((r) => ({
      severity: r.severity,
      description: r.description,
    })),
    explanations: {
      topReasons: candidate.explanations?.topReasons || [],
      risks: candidate.explanations?.risks || [],
      missingProof: candidate.explanations?.missingProof || [],
    },
    interviewPack: interviewPack
      ? {
          sections: interviewPack.sections,
          miniTasks: interviewPack.miniTasks,
          areasToProbe: interviewPack.areasToProbe,
        }
      : undefined,
    whyNotHired: whyNotHiredReport,
  }
}

export function downloadHiringPacketJSON(packet: HiringPacket): void {
  const blob = new Blob([JSON.stringify(packet, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `hiring-packet-${packet.meta.candidateName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export function generateHiringPacketHTML(packet: HiringPacket): string {
  const verdictColor =
    packet.summary.verdict === "Strong Hire"
      ? "#4ade80"
      : packet.summary.verdict === "Possible"
        ? "#ffffff"
        : packet.summary.verdict === "Risky but High Potential"
          ? "#fbbf24"
          : "#ef4444"

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Hiring Packet - ${packet.meta.candidateName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #000; color: #fff; padding: 40px; line-height: 1.6; }
    .header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 2px solid #333; }
    .logo { font-size: 24px; font-weight: 900; }
    .meta { text-align: right; color: #888; font-size: 12px; }
    .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 40px; }
    .stat { background: #111; border: 2px solid #333; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-value { font-size: 32px; font-weight: 900; }
    .stat-label { font-size: 12px; color: #888; margin-top: 4px; }
    .section { margin-bottom: 40px; }
    .section-title { font-size: 18px; font-weight: 900; margin-bottom: 16px; padding-bottom: 8px; border-bottom: 1px solid #333; }
    .skill-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #222; }
    .skill-name { font-weight: 600; }
    .skill-score { font-weight: 900; }
    .evidence-card { background: #111; border: 2px solid #333; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .evidence-title { font-weight: 700; margin-bottom: 4px; }
    .evidence-meta { font-size: 12px; color: #888; }
    .risk { background: #1a0a0a; border: 2px solid #5c2020; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .question { background: #111; border-radius: 12px; padding: 16px; margin-bottom: 12px; }
    .question-text { font-weight: 600; margin-bottom: 8px; }
    .question-context { font-size: 12px; color: #888; }
    .verdict { display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: 900; background: ${verdictColor}20; color: ${verdictColor}; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 2px solid #333; text-align: center; color: #666; font-size: 12px; }
    @media print { body { background: #fff; color: #000; } .stat, .evidence-card, .question { background: #f5f5f5; border-color: #ddd; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">FORGE Hiring Packet</div>
    <div class="meta">
      <div>${packet.meta.jobTitle}</div>
      <div>Generated: ${new Date(packet.meta.generatedAt).toLocaleDateString()}</div>
    </div>
  </div>

  <h1 style="font-size: 36px; margin-bottom: 8px;">${packet.meta.candidateName}</h1>
  <div class="verdict">${packet.summary.verdict}</div>

  <div class="summary" style="margin-top: 32px;">
    <div class="stat">
      <div class="stat-value">${packet.summary.overallScore}</div>
      <div class="stat-label">FORGE Score</div>
    </div>
    <div class="stat">
      <div class="stat-value">${packet.summary.cs}%</div>
      <div class="stat-label">Capability (CS)</div>
    </div>
    <div class="stat">
      <div class="stat-value">${packet.summary.xs}%</div>
      <div class="stat-label">Context (XS)</div>
    </div>
    <div class="stat">
      <div class="stat-value">${packet.summary.proofConfidence}%</div>
      <div class="stat-label">Proof Confidence</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Skill Breakdown</div>
    ${packet.skillBreakdown
      .map(
        (s) => `
      <div class="skill-row">
        <span class="skill-name">${s.skill} <span style="color: #666; font-size: 12px;">(${s.weight}% weight)</span></span>
        <span class="skill-score" style="color: ${s.status === "Proven" ? "#4ade80" : s.status === "Weak" ? "#fbbf24" : "#ef4444"}">
          ${s.score}% - ${s.status}
        </span>
      </div>
    `,
      )
      .join("")}
  </div>

  <div class="section">
    <div class="section-title">Top Evidence</div>
    ${packet.topEvidence
      .map(
        (e) => `
      <div class="evidence-card">
        <div class="evidence-title">${e.title}</div>
        <div class="evidence-meta">${e.skill} | ${e.impact} impact</div>
        ${e.why ? `<div style="margin-top: 8px; font-size: 14px;">${e.why}</div>` : ""}
        <div style="margin-top: 8px;"><a href="${e.url}" style="color: #6b8aff; font-size: 12px;">${e.url}</a></div>
      </div>
    `,
      )
      .join("")}
  </div>

  ${
    packet.risks.length > 0
      ? `
  <div class="section">
    <div class="section-title">Risks</div>
    ${packet.risks
      .map(
        (r) => `
      <div class="risk">
        <div style="font-weight: 700; color: #ef4444; margin-bottom: 4px;">${r.severity.toUpperCase()}</div>
        <div>${r.description}</div>
      </div>
    `,
      )
      .join("")}
  </div>
  `
      : ""
  }

  ${
    packet.interviewPack
      ? `
  <div class="section">
    <div class="section-title">Interview Questions</div>
    ${packet.interviewPack.sections?.deepDives
      ?.slice(0, 3)
      .map(
        (q) => `
      <div class="question">
        <div class="question-text">${q.question}</div>
        <div class="question-context">Based on: ${q.basedOn}</div>
      </div>
    `,
      )
      .join("")}
  </div>

  <div class="section">
    <div class="section-title">Mini Tasks</div>
    ${packet.interviewPack.miniTasks
      ?.map(
        (t) => `
      <div class="evidence-card">
        <div class="evidence-title">${t.title}</div>
        <div style="margin: 8px 0;">${t.prompt}</div>
        <div class="evidence-meta">Timebox: ${t.timebox} | Evaluates: ${t.evaluates.join(", ")}</div>
      </div>
    `,
      )
      .join("")}
  </div>
  `
      : ""
  }

  <div class="footer">
    Generated by FORGE | Proof-First Hiring Platform
  </div>
</body>
</html>`
}

export function downloadHiringPacketPDF(packet: HiringPacket): void {
  // Generate HTML and open in new window for printing
  const html = generateHiringPacketHTML(packet)
  const printWindow = window.open("", "_blank")
  if (printWindow) {
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => {
      printWindow.print()
    }, 500)
  }
}
