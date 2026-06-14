const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini"

const baseContext = {
  name: "Darshan Sawant",
  summary:
    "Darshan Sawant designs intelligent digital experiences across UX, AI, visual design, and product systems.",
  sources: [
    ["Home", "https://darshansawant.com/"],
    ["Works", "https://darshansawant.com/works"],
    ["AI Lab", "https://darshansawant.com/labs"],
    ["About", "https://darshansawant.com/about"],
    ["Experience", "https://darshansawant.com/about"],
    ["Visual Design", "https://darshansawant.com/visual-design"],
  ],
  projects: [
    "Eltropy: BFSI communication and customer engagement product work.",
    "Multiplyrr: product experience for growth, creators, and operational workflows.",
    "Sugarlogger: healthcare/LIMS reporting experience and product design.",
    "Oracle: UX work across dashboard and waitlist experiences.",
    "Tekhne: enterprise admin panel work that scaled to 500+ active users per instance.",
    "Godrej: corporate, product, and visual design context.",
  ],
  skills: [
    "UX",
    "AI",
    "BFSI",
    "product design",
    "visual design",
    "design systems",
    "dashboards",
    "enterprise",
    "LIMS",
    "agentic interfaces",
  ],
}

const recruiterPitch =
  "Hiring angle: Darshan is worth a recruiter or hiring manager conversation when the role needs someone who can connect UX craft, enterprise product thinking, AI curiosity, and visual polish without needing every requirement to be spoon-fed."

function setCors(response) {
  response.setHeader("Access-Control-Allow-Origin", "*")
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  response.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

function sourceStrings(labels = []) {
  const selected = labels.length
    ? baseContext.sources.filter(([label]) =>
        labels.some((item) => label.toLowerCase().includes(item.toLowerCase()))
      )
    : baseContext.sources.slice(0, 4)

  return selected.map(([label, url]) => `${label}|${url}`)
}

function fallbackChat(question = "", page = "") {
  const q = `${question} ${page}`.toLowerCase()
  let content = `${baseContext.name} ${baseContext.summary}`
  let labels = ["Home", "About"]

  if (q.includes("eltropy")) {
    content =
      "Eltropy is a BFSI-focused case study in Darshan's portfolio, showing product thinking around customer communication, enterprise workflows, and UX clarity. " +
      recruiterPitch
    labels = ["Works"]
  } else if (q.includes("multiplyrr")) {
    content =
      "Multiplyrr highlights Darshan's product experience across growth, creator, and operational workflows, with emphasis on clear interaction design. " +
      recruiterPitch
    labels = ["Works"]
  } else if (q.includes("sugarlogger")) {
    content =
      "Sugarlogger shows Darshan's healthcare and LIMS-facing product work, including reporting workflows and interface design for complex information. " +
      recruiterPitch
    labels = ["Works"]
  } else if (q.includes("lab") || q.includes("ai")) {
    content =
      "Darshan's AI Lab explores agentic interfaces, AI-assisted UX workflows, and practical product experiments. " +
      recruiterPitch
    labels = ["AI Lab"]
  } else if (q.includes("visual")) {
    content =
      "Darshan's visual design work spans brand, campaign, interface, and polished communication design across product contexts. " +
      recruiterPitch
    labels = ["Visual Design"]
  } else if (q.includes("work") || q.includes("project") || q.includes("case")) {
    content = `${baseContext.projects.join(" ")} ${recruiterPitch}`
    labels = ["Works", "AI Lab"]
  }

  return {
    message: {
      role: "assistant",
      content,
      sources: sourceStrings(labels),
    },
  }
}

function fallbackRecruiter(jobDescription = "") {
  const jd = jobDescription.toLowerCase()
  const matchedSkills = baseContext.skills.filter((skill) => jd.includes(skill.toLowerCase()))
  const score = Math.max(64, Math.min(92, 72 + matchedSkills.length * 3))

  return {
    result: {
      score,
      label: score >= 85 ? "Strong Signal" : score >= 76 ? "Good Signal" : "Focused Signal",
      summary:
        "Darshan's portfolio shows relevant UX, AI, dashboard, enterprise, and product design experience for this role. He should be considered for an interview if the team values a designer who can move between product systems, AI-facing workflows, and polished execution.",
      bullets: [
        "Relevant work includes Oracle, Tekhne, Eltropy, Sugarlogger, Multiplyrr, and AI Lab experiments.",
        "The portfolio supports strengths in UX, AI-facing product thinking, dashboards, enterprise workflows, and visual design.",
        "Confirm exact seniority, team size, and private project details during the interview.",
      ],
      strengths: matchedSkills.length ? matchedSkills.slice(0, 6) : baseContext.skills.slice(0, 6),
      relevantWork: ["Eltropy", "Multiplyrr", "Sugarlogger", "Oracle", "Tekhne", "AI Lab"],
      gaps: ["Confirm role-specific domain depth, team ownership, and metrics in interview."],
      sources: sourceStrings(["Works", "AI Lab", "About", "Experience"]),
      followUps: [
        "Which projects are most relevant to this JD?",
        "What should I ask Darshan in the interview?",
      ],
    },
  }
}

async function callOpenAI(request) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured in Vercel.")
  }

  const modeInstruction =
    request.mode === "recruiter"
      ? [
          "Analyze the pasted job description against the portfolio.",
          "Return JSON with result: { score, label, summary, bullets, strengths, relevantWork, gaps, sources, followUps }.",
          "Score must be an integer from 0 to 100 and must match the written assessment.",
          "If the written assessment is positive or highly relevant, score should normally be 72-92, not single digits.",
          "Use lower scores only when the JD has almost no overlap with UX, product design, enterprise software, AI, BFSI, healthcare, dashboards, or visual design.",
        ].join(" ")
      : [
          "Answer the question from the portfolio context.",
          "Return JSON with message: { role: 'assistant', content, sources, followUps }.",
          "Every answer should include a concise hiring-manager angle explaining why Darshan is worth considering, without exaggerating or inventing facts.",
        ].join(" ")

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      input: [
        {
          role: "system",
          content: [
            "You are Darshan Sawant's portfolio AI assistant.",
            "Use only the supplied portfolio context and request payload.",
            "Do not invent companies, metrics, dates, roles, awards, or case studies.",
            "Keep answers concise, specific, and useful for portfolio visitors and recruiters.",
            "Be persuasive but evidence-led: pitch Darshan as someone worth speaking with, while clearly naming what should be confirmed in interview.",
            "Return strict JSON only.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction: modeInstruction,
            portfolioContext: baseContext,
            page: request.page || "",
            contextVersion: request.contextVersion || "",
            widgetSeed: request.portfolioSeed || null,
            request,
          }),
        },
      ],
      text: { format: { type: "json_object" } },
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`OpenAI request failed with ${response.status}: ${details.slice(0, 400)}`)
  }

  const data = await response.json()
  const outputText =
    data.output_text ||
    data.output
      ?.flatMap((item) => item.content || [])
      .map((item) => item.text || "")
      .join("")

  if (!outputText) throw new Error("OpenAI returned an empty response.")
  const parsed = JSON.parse(outputText)
  if (request.mode === "recruiter" && parsed?.result) {
    parsed.result.score = normalizeScore(parsed.result.score, parsed.result.summary, parsed.result.label)
    parsed.result.label = labelForScore(parsed.result.score)
  }
  return parsed
}

function labelForScore(score) {
  if (score >= 85) return "Strong Signal"
  if (score >= 74) return "Good Signal"
  if (score >= 60) return "Focused Signal"
  return "Limited Signal"
}

function normalizeScore(score, summary = "", label = "") {
  const numeric = Number(score)
  const safeScore = Number.isFinite(numeric) ? Math.round(numeric) : 68
  const language = `${summary} ${label}`.toLowerCase()
  const positive = /highly relevant|strong alignment|strong match|good match|closely match|relevant/.test(language)
  if (positive && safeScore < 60) return 74
  return Math.max(0, Math.min(100, safeScore))
}

export default async function handler(request, response) {
  setCors(response)

  if (request.method === "OPTIONS") {
    response.status(204).end()
    return
  }

  if (request.method !== "POST") {
    response.status(405).json({ error: "Method not allowed." })
    return
  }

  let body = {}
  try {
    body = typeof request.body === "string" ? JSON.parse(request.body) : request.body || {}
  } catch {
    response.status(400).json({ error: "Invalid JSON body." })
    return
  }

  if (body.mode === "recruiter" && !body.jobDescription?.trim()) {
    response.status(400).json({ error: "Job description is required." })
    return
  }

  if (body.mode !== "recruiter" && !body.question?.trim()) {
    response.status(400).json({ error: "Question is required." })
    return
  }

  try {
    const data = await callOpenAI(body)
    response.status(200).json(data)
  } catch (error) {
    const fallback =
      body.mode === "recruiter"
        ? fallbackRecruiter(body.jobDescription || "")
        : fallbackChat(body.question || "", body.page || "")

    response.status(200).json({
      ...fallback,
      warning: error instanceof Error ? error.message : "AI fallback used.",
    })
  }
}
