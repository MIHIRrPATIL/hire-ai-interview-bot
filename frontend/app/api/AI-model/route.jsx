import OpenAI from "openai";

export async function POST(req) {
  try {
    const { jobPosition, jobDescription, duartion, type } = await req.json();
    console.log("[AI-model] Received:", { jobPosition, jobDescription, duartion, type });

    if (!process.env.OPENROUTER_API_KEY) {
      console.error("[AI-model] Missing OPENROUTER_API_KEY env variable");
      return new Response(JSON.stringify({ error: "Server misconfiguration: missing API key." }), { status: 500 });
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    let completion;
    try {
      completion = await openai.chat.completions.create({
        model: "meta-llama/llama-3.3-8b-instruct:free",
        messages: [
          { role: "user", content: jobDescription }
        ],
      });
    } catch (aiErr) {
      console.error("[AI-model] Error from OpenAI/OpenRouter:", aiErr);
      return new Response(JSON.stringify({ error: "Failed to get response from AI service." }), { status: 500 });
    }

    const aiMessage = completion?.choices?.[0]?.message?.content;
    console.log("[AI-model] AI raw response:", aiMessage);

    let questions = [];
    try {
      questions = JSON.parse(aiMessage);
      if (!Array.isArray(questions)) throw new Error("AI response is not an array");
    } catch (parseErr) {
      console.error("[AI-model] Failed to parse AI response as JSON:", aiMessage);
      return new Response(JSON.stringify({ error: "AI did not return valid questions JSON." }), { status: 500 });
    }

    return new Response(JSON.stringify({ questions }), { status: 200 });
  } catch (err) {
    console.error("[AI-model] API error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal Server Error" }), { status: 500 });
  }
}