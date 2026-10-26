import { NextResponse } from "next/server";

const fallback = "Can't help with that you can ask a different question";
const topicPattern = /\b(todo|to-do|task|checklist|streak|daily|routine|time management|time-management|schedule|scheduling|plan|planning|organize|organisation|productivity|study|studies|studying|student|learning|learn|class|lecture|homework|assignment|exam|test|revision|revise|flashcard|focus|break|pomodoro|semester|school|college|university)\b/i;

function isAllowedQuestion(message: string) {
  return message.trim().length > 0 && message.trim().length <= 1000 && topicPattern.test(message);
}

export async function POST(request: Request) {
  let message = "";
  try {
    ({ message } = await request.json());
  } catch {
    return NextResponse.json({ reply: fallback }, { status: 400 });
  }

  if (typeof message !== "string" || !isAllowedQuestion(message)) {
    return NextResponse.json({ reply: fallback });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) return NextResponse.json({ reply: "The study coach is not configured yet. Add GEMINI_API_KEY to the server environment." }, { status: 503 });

  const model = process.env.GEMINI_MODEL?.trim() || "gemini-flash-lite-latest";
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: "You are Daymark's focused study and time-management coach. Only answer questions about todo lists, task planning, time management, productivity routines, study planning, focus, revision, exams, homework, or managing academic work. If the user asks anything outside those topics, reply exactly: Can't help with that you can ask a different question. Be concise, practical, and encouraging. Do not claim to access the user's private data. Keep replies under 120 words." }],
      },
      contents: [{ role: "user", parts: [{ text: message.trim() }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 300 },
    }),
  });

  if (!response.ok) {
    const providerError = await response.text();
    console.error("Gemini request failed", response.status, providerError.slice(0, 500));
    if (response.status === 401 || response.status === 403) return NextResponse.json({ reply: "The Gemini API key is invalid or has been revoked. Add a new key in .env.local and restart the server." }, { status: 502 });
    if (response.status === 404) return NextResponse.json({ reply: `The Gemini model "${model}" is unavailable. Set GEMINI_MODEL to gemini-flash-lite-latest.` }, { status: 502 });
    return NextResponse.json({ reply: "The study coach is unavailable right now. Please try again shortly." }, { status: 502 });
  }
  const data = await response.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return NextResponse.json({ reply: typeof reply === "string" && reply.trim() ? reply.trim() : "The study coach could not form a reply. Please try again." });
}