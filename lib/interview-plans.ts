// FORGE - Interview Time Plans
// Auto-generate 15-min, 30-min, 60-min interview plans

import type { CandidateAnalysis } from "./scoring"
import type { InterviewPack } from "./interview-pack"

export interface InterviewPlan {
  duration: "15min" | "30min" | "60min"
  totalMinutes: number
  sections: Array<{
    name: string
    minutes: number
    questions: Array<{
      question: string
      context: string
      timeGuide: string
    }>
    notes: string
  }>
  closingQuestions: string[]
  redFlags: string[]
}

export function generateInterviewPlan(
  candidate: CandidateAnalysis,
  pack: InterviewPack,
  duration: "15min" | "30min" | "60min",
): InterviewPlan {
  const totalMinutes = duration === "15min" ? 15 : duration === "30min" ? 30 : 60

  if (duration === "15min") {
    return {
      duration,
      totalMinutes,
      sections: [
        {
          name: "Quick Intro",
          minutes: 2,
          questions: [
            {
              question: "Tell me briefly about your most impactful project.",
              context: "Warm-up, assess communication",
              timeGuide: "Keep to 2 min max",
            },
          ],
          notes: "Watch for conciseness and ability to highlight key points",
        },
        {
          name: "Technical Probe",
          minutes: 8,
          questions: [
            pack.sections.deepDives[0]
              ? {
                  question: pack.sections.deepDives[0].question,
                  context: pack.sections.deepDives[0].basedOn,
                  timeGuide: "4 min + 2 min follow-up",
                }
              : {
                  question: "Walk me through a technical decision you made recently.",
                  context: "General technical depth",
                  timeGuide: "4 min + 2 min follow-up",
                },
            pack.sections.riskProbes[0]
              ? {
                  question: pack.sections.riskProbes[0].question,
                  context: pack.sections.riskProbes[0].basedOn,
                  timeGuide: "2 min quick probe",
                }
              : {
                  question: "What's an area you're actively improving?",
                  context: "Self-awareness check",
                  timeGuide: "2 min quick probe",
                },
          ],
          notes: "Focus on depth over breadth - pick ONE area to go deep",
        },
        {
          name: "Closing",
          minutes: 5,
          questions: [
            {
              question: "What questions do you have for us?",
              context: "Gauge interest and preparation",
              timeGuide: "3-4 min",
            },
          ],
          notes: "Note what they ask - reveals priorities and research",
        },
      ],
      closingQuestions: ["Any concerns about the role?", "Timeline for making a decision?"],
      redFlags: [
        "Cannot articulate their work clearly in limited time",
        "Deflects from gap questions",
        "No questions prepared",
      ],
    }
  }

  if (duration === "30min") {
    return {
      duration,
      totalMinutes,
      sections: [
        {
          name: "Introduction",
          minutes: 3,
          questions: [
            {
              question: "Walk me through your background and what brought you here.",
              context: "Warm-up, assess narrative ability",
              timeGuide: "3 min max",
            },
          ],
          notes: "Listen for coherent career narrative",
        },
        {
          name: "Deep Dive",
          minutes: 12,
          questions: pack.sections.deepDives.slice(0, 2).map((q) => ({
            question: q.question,
            context: q.basedOn,
            timeGuide: "5-6 min each",
          })),
          notes: "Go deep on their strongest work - this is where signal is",
        },
        {
          name: "Gap Assessment",
          minutes: 8,
          questions: pack.sections.riskProbes.slice(0, 2).map((q) => ({
            question: q.question,
            context: q.basedOn,
            timeGuide: "3-4 min each",
          })),
          notes: "Probe weak areas directly but respectfully",
        },
        {
          name: "Culture Fit",
          minutes: 4,
          questions: [
            pack.sections.cultureProbes[0]
              ? {
                  question: pack.sections.cultureProbes[0].question,
                  context: pack.sections.cultureProbes[0].basedOn,
                  timeGuide: "4 min",
                }
              : {
                  question: "Tell me about a time you disagreed with a teammate.",
                  context: "Collaboration style",
                  timeGuide: "4 min",
                },
          ],
          notes: "Look for respectful disagreement patterns",
        },
        {
          name: "Closing",
          minutes: 3,
          questions: [
            {
              question: "What questions do you have?",
              context: "Interest and preparation",
              timeGuide: "3 min",
            },
          ],
          notes: "Quality of questions reveals depth of interest",
        },
      ],
      closingQuestions: ["What's most important to you in your next role?", "Any concerns about what we've discussed?"],
      redFlags: [
        "Vague answers on their own projects",
        "Blames others for failures",
        "Cannot discuss tradeoffs",
        "Overconfident on weak areas",
      ],
    }
  }

  // 60 min full interview
  return {
    duration,
    totalMinutes,
    sections: [
      {
        name: "Introduction & Background",
        minutes: 5,
        questions: [
          {
            question: "Tell me about your journey - how did you get to where you are today?",
            context: "Career narrative and motivation",
            timeGuide: "4-5 min",
          },
        ],
        notes: "Look for intentional career moves and learning orientation",
      },
      {
        name: "Technical Deep Dives",
        minutes: 20,
        questions: pack.sections.deepDives.map((q) => ({
          question: q.question,
          context: q.basedOn,
          timeGuide: "6-7 min each",
        })),
        notes: "This is the core - spend time here. Follow up on interesting threads.",
      },
      {
        name: "Architecture & Tradeoffs",
        minutes: 10,
        questions: pack.sections.tradeoffs.map((q) => ({
          question: q.question,
          context: q.basedOn,
          timeGuide: "5 min each",
        })),
        notes: "Looking for systems thinking and decision-making framework",
      },
      {
        name: "Gap Assessment",
        minutes: 10,
        questions: pack.sections.riskProbes.map((q) => ({
          question: q.question,
          context: q.basedOn,
          timeGuide: "5 min each",
        })),
        notes: "Direct but respectful probing of weak areas",
      },
      {
        name: "Culture & Collaboration",
        minutes: 8,
        questions: pack.sections.cultureProbes.map((q) => ({
          question: q.question,
          context: q.basedOn,
          timeGuide: "4 min each",
        })),
        notes: "Assess team fit and communication style",
      },
      {
        name: "Candidate Questions & Close",
        minutes: 7,
        questions: [
          {
            question: "What questions do you have about the role, team, or company?",
            context: "Interest and preparation",
            timeGuide: "5-6 min for questions",
          },
          {
            question: "Is there anything you'd like to add that we haven't covered?",
            context: "Give space for self-advocacy",
            timeGuide: "1-2 min",
          },
        ],
        notes: "Strong candidates have thoughtful, specific questions",
      },
    ],
    closingQuestions: [
      "What's your ideal timeline for making a decision?",
      "Are you interviewing elsewhere?",
      "Any concerns about the role we should address?",
    ],
    redFlags: [
      "Cannot explain their own code/decisions",
      "Takes credit for team work without acknowledgment",
      "Defensive when probed on gaps",
      "No curiosity about the role or company",
      "Inconsistent stories across questions",
      "Overpromises on weak areas",
    ],
  }
}

export function generateInterviewPlans(
  candidate: CandidateAnalysis,
  skills: Array<{ name: string; weight: number }>,
): { "15min": InterviewPlan; "30min": InterviewPlan; "60min": InterviewPlan } {
  // Create a minimal interview pack if candidate doesn't have one
  const pack: InterviewPack = candidate.interviewPack || {
    meta: { mode: "template", generatedAt: new Date().toISOString() },
    sections: {
      deepDives: candidate.capability.skills
        .filter((s) => s.status === "Proven")
        .slice(0, 3)
        .map((s) => ({
          question: `Tell me about your experience with ${s.name}. What's the most complex problem you've solved?`,
          basedOn: `${s.name} scored ${Math.round(s.score * 100)}%`,
          whyAsk: `Verify depth of ${s.name} knowledge`,
        })),
      tradeoffs: [
        {
          question: "Describe a technical decision where you had to balance competing priorities.",
          basedOn: "Architecture skills",
          whyAsk: "Assess systems thinking",
        },
      ],
      riskProbes: candidate.capability.skills
        .filter((s) => s.status === "Weak" || s.status === "Missing")
        .slice(0, 2)
        .map((s) => ({
          question: `Your ${s.name} evidence is limited. How would you approach ramping up in this area?`,
          basedOn: `${s.name} marked as ${s.status}`,
          whyAsk: "Probe gap awareness",
        })),
      cultureProbes: [
        {
          question: "Tell me about a time you received tough feedback. How did you handle it?",
          basedOn: "Communication signals",
          whyAsk: "Assess receptiveness to feedback",
        },
      ],
    },
    miniTasks: [],
    areasToProbe: candidate.explanations?.missingProof || [],
  }

  return {
    "15min": generateInterviewPlan(candidate, pack, "15min"),
    "30min": generateInterviewPlan(candidate, pack, "30min"),
    "60min": generateInterviewPlan(candidate, pack, "60min"),
  }
}
