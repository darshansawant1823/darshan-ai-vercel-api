const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini"
const FIREWALL_ENABLED = process.env.FIREWALL_ENABLED !== "false"
const AI_KILL_SWITCH = process.env.AI_KILL_SWITCH === "true"
const OWNER_BYPASS_TOKEN = process.env.OWNER_BYPASS_TOKEN || ""
const MAX_CHAT_CHARS = Number(process.env.MAX_CHAT_CHARS || 700)
const MAX_JD_CHARS = Number(process.env.MAX_JD_CHARS || 7000)
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS || 650)
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000)
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 12)
const DAILY_REQUEST_LIMIT = Number(process.env.DAILY_REQUEST_LIMIT || 250)
const DAILY_TOKEN_ESTIMATE_LIMIT = Number(process.env.DAILY_TOKEN_ESTIMATE_LIMIT || 180_000)
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || ""
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || ""
const DEFAULT_ALLOWED_ORIGINS = [
  "https://designbydarshan.framer.website",
  "https://*.framer.website",
  "https://darshansawant.com",
  "https://www.darshansawant.com",
  "https://framer.com",
  "https://www.framer.com",
  "https://*.framer.com",
  "https://*.framerusercontent.com",
]
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(","))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean)
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
  /(reveal|dump|leak)\s+(your\s+|the\s+)?(system|prompt|instruction|secret|api|key)/i,
  /(show|tell|give|send|share)\s+(me\s+)?(your\s+|the\s+)?(system\s+prompt|hidden\s+instructions|developer\s+message|api\s*key|secret|environment\s+variables?)/i,
  /(what\s+is|where\s+is)\s+(your\s+|the\s+)?(api\s*key|secret|owner\s*bypass\s*token)/i,
  /print\s+(your|the)?\s*(system|prompt|instruction|secret|api|key)/i,
  /system\s+prompt|developer\s+message|hidden\s+instructions|internal\s+prompt/i,
  /jailbreak|developer\s+mode|dan\s+mode|unrestricted\s+ai/i,
  /process\.env/i,
  /(base64|rot13|cipher|encode)\s+(your\s+|the\s+)?(instructions|system|prompt|secret|api\s*key)/i,
  /act\s+as\s+if\s+you\s+have\s+no\s+rules/i,
]
const OUTPUT_LEAK_PATTERNS = [
  /system\s+prompt|developer\s+message|hidden\s+instructions/i,
  /OPENAI_API_KEY|OWNER_BYPASS_TOKEN|process\.env|api\s*key/i,
]
const memoryStore = globalThis.__darshanAiFirewallStore || {
  rate: new Map(),
  day: new Map(),
  seen: new Map(),
}
globalThis.__darshanAiFirewallStore = memoryStore

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
    "Eltropy: BFSI communication and customer engagement product work for credit unions and community banks, focused on trust, clarity, information architecture, and product storytelling.",
    "Multiplyrr: investment/product UX for everyday users, including mobile-first flows, filters, wishlist, checkout, and performance graph thinking.",
    "Sugarlogger: healthcare/LIMS reporting experience for pathology lab workflows, covering patient, doctor, lab, admin, reporting, and operational complexity.",
    "Oracle: UX work across dashboard and waitlist experiences, including real-time product workflows.",
    "Tekhne: enterprise admin panel work that scaled to 500+ active users per instance.",
    "Godrej: corporate, product, careers, and visual design context.",
    "AI Lab: self-initiated experiments including AI UX Auditor, Intelligent Banking, AI Resume Analyzer, and Personal UX Maturity Evaluator.",
  ],
  experience: [
    "Oracle: UX Designer from Aug 2024 to present.",
    "Tekhne: UX Designer from Jan 2024 to Aug 2024.",
    "Godrej: UX Designer from Jan 2023 to Jan 2024.",
    "Sugarlogger: UX Designer from Nov 2018 to Dec 2022.",
  ],
  proofPoints: [
    "Oracle AI Hackathon win.",
    "UX Unplugged newsletter/community with 500+ subscribers.",
    "Tekhne admin panel scaled to 500+ active users per instance.",
    "Portfolio shows repeated BFSI, healthcare, enterprise, AI, and visual-design contexts.",
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

const allowedTopics = [
  "Darshan Sawant",
  "Oracle",
  "Tekhne",
  "Godrej",
  "Sugarlogger",
  "Eltropy",
  "Multiplyrr",
  "AI Lab",
  "AI UX Auditor",
  "Intelligent Banking",
  "AI Resume Analyzer",
  "Personal UX Maturity Evaluator",
  "UX Unplugged",
]

function setCors(response) {
  response.setHeader("Vary", "Origin")
  response.setHeader("Access-Control-Allow-Origin", "null")
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Owner-Token")
}

function setCorsForRequest(request, response) {
  const origin = request.headers.origin || ""
  if (!origin || originAllowed(origin)) {
    response.setHeader("Access-Control-Allow-Origin", origin || "*")
  } else {
    response.setHeader("Access-Control-Allow-Origin", "null")
  }
  response.setHeader("Vary", "Origin")
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Owner-Token")
}

function getClientIp(request) {
  const forwarded = request.headers["x-forwarded-for"]
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded
  return (value || request.headers["x-real-ip"] || request.socket?.remoteAddress || "unknown")
    .split(",")[0]
    .trim()
}

function hashString(value) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index)
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
  }
  return (hash >>> 0).toString(16)
}

function todayKey() {
  return new Date().toISOString().slice(0, 10)
}

function estimateTokens(text) {
  return Math.ceil(String(text || "").length / 4)
}

function ownerBypass(request) {
  if (!OWNER_BYPASS_TOKEN) return false
  return request.headers["x-owner-token"] === OWNER_BYPASS_TOKEN
}

function sameOriginAllowed(request) {
  const origin = request.headers.origin || ""
  return !origin || originAllowed(origin)
}

function originAllowed(origin) {
  return ALLOWED_ORIGINS.some((allowed) => {
    if (allowed === origin) return true
    if (!allowed.includes("*")) return false
    const pattern = allowed.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace("\\*", ".*")
    return new RegExp(`^${pattern}$`).test(origin)
  })
}

function checkRateLimit(ip, tokenEstimate) {
  const now = Date.now()
  const rateKey = ip
  const bucket = (memoryStore.rate.get(rateKey) || []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)
  if (bucket.length >= RATE_LIMIT_MAX) return { ok: false, reason: "Too many requests. Please try again in a minute." }
  bucket.push(now)
  memoryStore.rate.set(rateKey, bucket)

  const dailyKey = `${todayKey()}:${ip}`
  const daily = memoryStore.day.get(dailyKey) || { count: 0, tokens: 0 }
  if (daily.count >= DAILY_REQUEST_LIMIT) return { ok: false, reason: "Daily request limit reached for this visitor." }
  if (daily.tokens + tokenEstimate >= DAILY_TOKEN_ESTIMATE_LIMIT) return { ok: false, reason: "Daily AI usage limit reached for this visitor." }
  daily.count += 1
  daily.tokens += tokenEstimate
  memoryStore.day.set(dailyKey, daily)
  return { ok: true }
}

async function redisCommand(command) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null
  const result = await fetch(UPSTASH_REDIS_REST_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  })
  if (!result.ok) throw new Error(`Redis command failed: ${result.status}`)
  return await result.json()
}

async function checkPersistentLimits(ip, tokenEstimate) {
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null
  const minuteKey = `fw:${todayKey()}:minute:${Math.floor(Date.now() / RATE_LIMIT_WINDOW_MS)}:${ip}`
  const dailyCountKey = `fw:${todayKey()}:count:${ip}`
  const dailyTokenKey = `fw:${todayKey()}:tokens:${ip}`

  const minute = await redisCommand(["INCR", minuteKey])
  if (minute?.result === 1) await redisCommand(["EXPIRE", minuteKey, Math.ceil(RATE_LIMIT_WINDOW_MS / 1000) + 5])
  if (Number(minute?.result || 0) > RATE_LIMIT_MAX) return { ok: false, reason: "Too many requests. Please try again in a minute." }

  const count = await redisCommand(["INCR", dailyCountKey])
  if (count?.result === 1) await redisCommand(["EXPIRE", dailyCountKey, 90_000])
  if (Number(count?.result || 0) > DAILY_REQUEST_LIMIT) return { ok: false, reason: "Daily request limit reached for this visitor." }

  const tokens = await redisCommand(["INCRBY", dailyTokenKey, tokenEstimate])
  if (Number(tokens?.result || 0) === tokenEstimate) await redisCommand(["EXPIRE", dailyTokenKey, 90_000])
  if (Number(tokens?.result || 0) > DAILY_TOKEN_ESTIMATE_LIMIT) return { ok: false, reason: "Daily AI usage limit reached for this visitor." }

  return { ok: true }
}

function repeatedPayload(ip, payloadText) {
  const key = `${ip}:${hashString(payloadText)}`
  const now = Date.now()
  const seen = memoryStore.seen.get(key) || { count: 0, firstSeen: now }
  if (now - seen.firstSeen > 10 * 60_000) {
    memoryStore.seen.set(key, { count: 1, firstSeen: now })
    return false
  }
  seen.count += 1
  memoryStore.seen.set(key, seen)
  return seen.count > 8
}

function firewallReject(response, reason, status = 429) {
  response.status(status).json({
    error: reason,
    firewall: { blocked: true, reason },
  })
}

async function inspectInput(body, request) {
  const mode = body.mode === "recruiter" ? "recruiter" : "chat"
  const question = String(body.question || "")
  const jd = String(body.jobDescription || "")
  const primaryText = mode === "recruiter" ? jd : question
  const tokenEstimate = estimateTokens(`${question}\n${jd}`) + MAX_OUTPUT_TOKENS

  if (AI_KILL_SWITCH) return { ok: false, status: 503, reason: "AI is temporarily disabled." }
  if (!sameOriginAllowed(request)) return { ok: false, status: 403, reason: "This origin is not allowed to use the AI endpoint." }
  if (mode === "chat" && question.length > MAX_CHAT_CHARS) return { ok: false, status: 413, reason: `Question is too long. Keep it under ${MAX_CHAT_CHARS} characters.` }
  if (mode === "recruiter" && jd.length > MAX_JD_CHARS) return { ok: false, status: 413, reason: `Job description is too long. Keep it under ${MAX_JD_CHARS} characters.` }
  if (SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(primaryText))) return { ok: false, status: 400, reason: "This request looks like a prompt attack or secret-extraction attempt." }

  const ip = getClientIp(request)
  if (repeatedPayload(ip, primaryText)) return { ok: false, status: 429, reason: "Repeated request pattern detected." }
  try {
    const persistent = await checkPersistentLimits(ip, tokenEstimate)
    if (persistent && !persistent.ok) return { ok: false, status: 429, reason: persistent.reason }
    if (persistent?.ok) return { ok: true }
  } catch (error) {
    console.warn("Persistent firewall limit failed; falling back to memory limit.", error)
  }
  const rate = checkRateLimit(ip, tokenEstimate)
  if (!rate.ok) return { ok: false, status: 429, reason: rate.reason }
  return { ok: true }
}

function inspectOutput(data) {
  const text = JSON.stringify(data)
  if (!OUTPUT_LEAK_PATTERNS.some((pattern) => pattern.test(text))) return data
  return {
    message: {
      role: "assistant",
      content:
        "I can't share hidden instructions, secrets, or internal configuration. From the public portfolio, recruiters should review Darshan's Works, AI Lab, and About pages for verified evidence.",
      sources: sourceStrings(["Works", "AI Lab", "About"]),
      followUps: ["Which portfolio proof points should I review?", "What should I ask Darshan in an interview?", "Which AI Lab project is most relevant?"],
    },
    firewall: { outputFiltered: true },
  }
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
      followUps: defaultFollowUps(q),
    },
  }
}

function defaultFollowUps(seed = "") {
  const ai = seed.includes("ai")
  const bfsi = seed.includes("bfsi") || seed.includes("bank") || seed.includes("finance")
  const healthcare = seed.includes("lims") || seed.includes("health")
  if (ai) return ["Which AI Lab project is strongest?", "How does this connect to UX work?", "What should a recruiter ask next?"]
  if (bfsi) return ["Which BFSI case study should I review?", "How does Eltropy prove fit?", "What should I ask in an interview?"]
  if (healthcare) return ["What did Sugarlogger solve?", "How did he handle complex workflows?", "What evidence should recruiters verify?"]
  return ["Which project proves this best?", "What should a hiring manager ask?", "Where can I see this in the portfolio?"]
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
          "Return JSON exactly as { message: { role: 'assistant', content, sources, followUps } }.",
          "sources must be inside message and must be labels or label|url strings from portfolioContext.sources only.",
          "followUps must be inside message and must contain 3 fresh, context-specific questions. Do not reuse generic follow-ups.",
          "Every answer should include a concise hiring-manager angle explaining why Darshan is worth considering, without exaggerating or inventing facts.",
          "Use recentMessages to avoid repeating the same opening, sentence structure, examples, and follow-up questions.",
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
            `Allowed portfolio topics are: ${allowedTopics.join(", ")}.`,
            "If the user asks something outside the portfolio, say the portfolio does not show that and redirect to relevant portfolio evidence.",
            "Keep answers concise, specific, and useful for portfolio visitors and recruiters.",
            "Be persuasive but evidence-led: pitch Darshan as someone worth speaking with, while clearly naming what should be confirmed in interview.",
            "Avoid sounding templated. Vary wording, examples, and follow-up questions while staying accurate.",
            "Return strict JSON only.",
          ].join(" "),
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction: modeInstruction,
            portfolioContext: baseContext,
            page: request.page || "",
            recentMessages: Array.isArray(request.recentMessages) ? request.recentMessages.slice(-8) : [],
            contextVersion: request.contextVersion || "",
            widgetSeed: request.portfolioSeed || null,
            request,
          }),
        },
      ],
      text: { format: { type: "json_object" } },
      max_output_tokens: MAX_OUTPUT_TOKENS,
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
    parsed.result.sources = normalizeSources(parsed.result.sources || parsed.sources)
    parsed.result.followUps = normalizeFollowUps(parsed.result.followUps || parsed.followUps, request)
  } else {
    normalizeChatResponse(parsed, request)
  }
  return parsed
}

function normalizeChatResponse(parsed, request) {
  if (!parsed.message) {
    parsed.message = {
      role: "assistant",
      content: parsed.content || "The portfolio does not show enough evidence to answer that directly. A recruiter should review Darshan's Works, AI Lab, and About pages for verified context.",
    }
  }
  parsed.message.role = "assistant"
  parsed.message.content = String(parsed.message.content || "").trim()
  parsed.message.sources = normalizeSources(parsed.message.sources || parsed.sources)
  parsed.message.followUps = normalizeFollowUps(parsed.message.followUps || parsed.followUps, request)
  delete parsed.sources
  delete parsed.followUps
}

function normalizeSources(sources) {
  const allowed = new Map(baseContext.sources.map(([label, url]) => [label.toLowerCase(), `${label}|${url}`]))
  const normalized = []
  for (const raw of Array.isArray(sources) ? sources : []) {
    const value = String(raw)
    const [label, url] = value.includes("|") ? value.split("|") : [value, ""]
    const key = label.trim().toLowerCase()
    if (allowed.has(key)) normalized.push(allowed.get(key))
    else if (url && baseContext.sources.some(([, sourceUrl]) => sourceUrl === url.trim())) normalized.push(`${label.trim()}|${url.trim()}`)
  }
  return Array.from(new Set(normalized)).slice(0, 4)
}

function normalizeFollowUps(followUps, request) {
  const cleaned = (Array.isArray(followUps) ? followUps : [])
    .map((item) => String(item).trim())
    .filter((item) => item.length > 8 && item.endsWith("?"))
  if (cleaned.length >= 3) return Array.from(new Set(cleaned)).slice(0, 3)
  return defaultFollowUps(normalize(`${request.question || ""} ${request.jobDescription || ""} ${request.page || ""}`))
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
  setCorsForRequest(request, response)

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

  if (FIREWALL_ENABLED && !ownerBypass(request)) {
    const inspection = await inspectInput(body, request)
    if (!inspection.ok) {
      firewallReject(response, inspection.reason, inspection.status)
      return
    }
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
    response.status(200).json(FIREWALL_ENABLED && !ownerBypass(request) ? inspectOutput(data) : data)
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
