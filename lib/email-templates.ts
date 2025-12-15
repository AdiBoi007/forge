// FORGE - Candidate Email Templates
// Rejection and invite emails with copy functionality

import type { CandidateAnalysis } from "./scoring"
import type { WhyNotHiredReport } from "./why-not-hired"
import type { InterviewPlan } from "./interview-plans"

export interface EmailTemplate {
  subject: string
  body: string
}

export function generateRejectionEmail(
  candidate: CandidateAnalysis,
  companyName: string,
  jobTitle: string,
  whyNotHired?: WhyNotHiredReport,
): EmailTemplate {
  const firstName = candidate.name.split(" ")[0]

  if (whyNotHired) {
    // Detailed rejection with actionable feedback
    return {
      subject: `Update on your ${jobTitle} application at ${companyName}`,
      body: `Hi ${firstName},

Thank you for your interest in the ${jobTitle} position at ${companyName}. After careful evaluation using our proof-based assessment system, we've decided not to move forward at this time.

${whyNotHired.summary}

**Areas for Improvement:**
${whyNotHired.missingProof
  .slice(0, 3)
  .map((s) => `• ${s.skill}: ${s.artifactsNeeded[0]}`)
  .join("\n")}

**Recommended Next Steps:**
${whyNotHired.nextSteps
  .slice(0, 3)
  .map((s, i) => `${i + 1}. ${s}`)
  .join("\n")}

${whyNotHired.encouragement}

We'd be happy to reconsider your application in the future once you've had a chance to build more verifiable evidence of your skills.

Best regards,
${companyName} Hiring Team`,
    }
  }

  // Generic rejection
  return {
    subject: `Update on your ${jobTitle} application at ${companyName}`,
    body: `Hi ${firstName},

Thank you for taking the time to apply for the ${jobTitle} position at ${companyName}. 

After careful consideration, we've decided to move forward with other candidates whose experience more closely matches our current needs.

We appreciate your interest in ${companyName} and encourage you to apply for future positions that match your skills and experience.

Best regards,
${companyName} Hiring Team`,
  }
}

export function generateInviteEmail(
  candidate: CandidateAnalysis,
  companyName: string,
  jobTitle: string,
  interviewPlan: InterviewPlan,
  interviewerName: string,
  proposedDate?: string,
): EmailTemplate {
  const firstName = candidate.name.split(" ")[0]
  const duration =
    interviewPlan.duration === "15min" ? "15 minutes" : interviewPlan.duration === "30min" ? "30 minutes" : "60 minutes"

  const agenda = interviewPlan.sections.map((s) => `• ${s.name} (${s.minutes} min)`).join("\n")

  return {
    subject: `Interview Invitation: ${jobTitle} at ${companyName}`,
    body: `Hi ${firstName},

Thank you for your application for the ${jobTitle} position at ${companyName}. We were impressed by your background and would like to invite you to an interview.

**Interview Details:**
• Duration: ${duration}
• Interviewer: ${interviewerName}
${proposedDate ? `• Proposed Time: ${proposedDate}` : "• Please reply with your availability for the coming week"}

**What to Expect:**
${agenda}

**How to Prepare:**
• Be ready to discuss your projects in depth, especially: ${candidate.evidence
      .slice(0, 2)
      .map((e) => e.title)
      .join(", ")}
• Think about technical decisions you've made and tradeoffs involved
• Prepare questions about the role and team

Please reply to confirm your availability or suggest alternative times.

Looking forward to speaking with you!

Best regards,
${interviewerName}
${companyName}`,
  }
}

export function generateFollowUpEmail(
  candidate: CandidateAnalysis,
  companyName: string,
  jobTitle: string,
  nextSteps: string,
  interviewerName: string,
): EmailTemplate {
  const firstName = candidate.name.split(" ")[0]

  return {
    subject: `Next Steps: ${jobTitle} at ${companyName}`,
    body: `Hi ${firstName},

Thank you for taking the time to interview for the ${jobTitle} position at ${companyName}. It was great learning more about your experience.

**Next Steps:**
${nextSteps}

If you have any questions in the meantime, please don't hesitate to reach out.

Best regards,
${interviewerName}
${companyName}`,
  }
}
