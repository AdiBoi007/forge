// OpenAI Helper for Structured JSON Extraction
// ============================================

const OPENAI_TIMEOUT_MS = 4500

export function hasOpenAIKey(): boolean {
  return !!process.env.OPENAI_API_KEY
}

export type OpenAIResult<T> = { ok: true; data: T } | { ok: false; error: string }

export async function callOpenAIJson<T>(
  systemPrompt: string,
  userPrompt: string,
  model = "gpt-4o-mini",
): Promise<OpenAIResult<T>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return { ok: false, error: "OPENAI_API_KEY not configured" }
  }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS)

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    })

    clearTimeout(timeout)

    if (!response.ok) {
      const errorText = await response.text()
      return { ok: false, error: `OpenAI API error: ${response.status} - ${errorText}` }
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return { ok: false, error: "No content in OpenAI response" }
    }

    try {
      const parsed = JSON.parse(content) as T
      return { ok: true, data: parsed }
    } catch {
      return { ok: false, error: "Failed to parse OpenAI JSON response" }
    }
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return { ok: false, error: "OpenAI request timeout" }
      }
      return { ok: false, error: error.message }
    }
    return { ok: false, error: "Unknown OpenAI error" }
  }
}
