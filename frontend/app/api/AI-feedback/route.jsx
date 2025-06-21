import OpenAI from "openai";
import { supabase } from "@/services/supabaseClient";

export async function POST(req) {
  try {
    const {
      interviewId,
      intervieweeName,
      question,
      candidateAnswer,
      interviewType,
      jobDescription,
      resumeSummary,
      experienceLevel
    } = await req.json();

    console.log("[AI-feedback] Received request:", {
      interviewId,
      intervieweeName,
      question: question?.substring(0, 50) + "...",
      interviewType,
      experienceLevel
    });

    // Check for required environment variables
    if (!process.env.OPENROUTER_API_KEY) {
      console.error("[AI-feedback] Missing OPENROUTER_API_KEY env variable");
      return new Response(JSON.stringify({ 
        error: "Server misconfiguration: missing OPENROUTER_API_KEY environment variable." 
      }), { status: 500 });
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANNON_KEY) {
      console.error("[AI-feedback] Missing Supabase environment variables");
      return new Response(JSON.stringify({ 
        error: "Server misconfiguration: missing Supabase environment variables." 
      }), { status: 500 });
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const prompt = `
      You are an expert AI interview evaluator. Analyze the response of a candidate in a structured and role-appropriate way. Evaluate based on both technical and soft skills, depending on the interview type.

      Your task:
      Given:
      - The interview **type**: ${interviewType}
      - The **question** asked: "${question}"
      - The **candidate's answer**: "${candidateAnswer}"
      - (Optional) The **job description**: ${jobDescription || "Not provided"}
      - (Optional) The **resume summary**: ${resumeSummary || "Not provided"}
      - The **expected experience level**: ${experienceLevel || "Not specified"}

      You should:
      1. Score the response across the following dimensions (1 to 10):
         - Clarity (structure and articulation)
         - Relevance (how well it answers the question)
         - Depth (level of insight, technical rigor)
         - Confidence (tone, certainty)
         - Communication (grammar, coherence, pacing)

      2. Provide a **1–2 line summary** of the answer.

      3. Provide a **final recommendation** from:
         - ✅ Strong Match
         - ⚠️ Moderate Fit
         - ❌ Not Recommended

      4. Mention any **red flags**, if noticed.

      Return the output in a single JSON object with the following keys: "clarity", "relevance", "depth", "confidence", "communication", "summary", "final_recommendation", "red_flags". The red_flags should be a JSON object.
    `;

    console.log("[AI-feedback] Sending request to AI model...");
    
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.3-8b-instruct:free",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const aiResponse = completion?.choices?.[0]?.message?.content;
    console.log("[AI-feedback] AI response received:", aiResponse);
    
    const evaluationResult = JSON.parse(aiResponse);

    const recordToInsert = {
      interview_id: interviewId,
      name: intervieweeName,
      question: question,
      clarity: evaluationResult.clarity,
      relevance: evaluationResult.relevance,
      depth: evaluationResult.depth,
      confidence: evaluationResult.confidence,
      communication: evaluationResult.communication,
      summary: evaluationResult.summary,
      "red flags": evaluationResult.red_flags,
    };

    console.log("[AI-feedback] Inserting into Supabase:", recordToInsert);

    const { data, error } = await supabase
      .from('interview-feedback')
      .insert([recordToInsert])
      .select();

    if (error) {
      console.error("[AI-feedback] Error inserting into Supabase:", error);
      throw new Error(`Failed to store evaluation in database: ${error.message}`);
    }

    console.log("[AI-feedback] Successfully inserted record:", data[0]);

    return new Response(JSON.stringify({ success: true, evaluationId: data[0].id }), { status: 200 });

  } catch (err) {
    console.error("[AI-feedback] API error:", err);
    return new Response(JSON.stringify({ 
      error: err.message || "Internal Server Error",
      details: err.toString()
    }), { status: 500 });
  }
}