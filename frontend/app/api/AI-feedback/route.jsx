import OpenAI from "openai";
import { supabase } from "@/services/supabaseClient";

// Debug flag based on environment variables
const DEBUG_AI_FEEDBACK = process.env.DEBUG_AI_FEEDBACK === 'true' || process.env.NODE_ENV !== 'production';
function debugLog(...args) {
  if (DEBUG_AI_FEEDBACK) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
}

export async function POST(req) {
  // DEBUGGER: Log entry point
  debugLog("--- [AI-feedback API] INITIATED ---");
  try {
    // DEBUGGER: Log raw request body
    const body = await req.json();
    debugLog("[DEBUG] Raw request body:", JSON.stringify(body, null, 2));

    const {
      interviewId,
      intervieweeName,
      question,
      candidateAnswer,
      interviewType,
      jobDescription,
      resumeSummary,
      experienceLevel
    } = body;

    debugLog("[AI-feedback] Received request:", {
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
     // DEBUGGER: Check env var presence
    debugLog("[DEBUG] OPENROUTER_API_KEY is present.");

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANNON_KEY) {
      console.error("[AI-feedback] Missing Supabase environment variables");
      return new Response(JSON.stringify({ 
        error: "Server misconfiguration: missing Supabase environment variables." 
      }), { status: 500 });
    }
    // DEBUGGER: Check env var presence
    debugLog("[DEBUG] Supabase environment variables are present.");

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const prompt = `
      As an expert AI hiring manager, your task is to provide a rigorous, evidence-based evaluation of a candidate's response. Be objective and analytical.

      **Interview Context:**
      - **Interview Type:** ${interviewType}
      - **Role Experience Level:** ${experienceLevel || "Not specified"}
      - **Job Description Context:** ${jobDescription || "Not provided"}
      - **Resume Context:** ${resumeSummary || "Not provided"}

      **Evaluation Task:**
      - **Question Asked:** "${question}"
      - **Candidate's Answer:** "${candidateAnswer}"

      **Your Analysis (in JSON format):**
      1.  **summary**: A concise, 2-line summary of the candidate's core message.
      2.  **strengths**: Identify specific strengths in the answer. Quote parts of the answer as evidence. What did they do well?
      3.  **areas_for_improvement**: Identify specific weaknesses or areas for improvement. Quote parts of the answer as evidence. How could they have answered better?
      4.  **scores (1-10)**:
          - **relevance**: Was the answer on-topic and directly addressing the question?
          - **clarity**: Was the answer well-structured, clear, and easy to understand?
          - **depth**: Did the answer demonstrate deep knowledge and insight, or was it superficial?
          - **technical_soundness**: (For Technical interviews) Was the answer technically accurate? If not applicable, rate 0.
      5.  **final_recommendation**: Based *only* on this single answer, provide a final recommendation from these exact strings: "Strong Match", "Moderate Fit", "Not Recommended". Do NOT use emojis.

      Return a single, valid JSON object with the keys: "summary", "strengths", "areas_for_improvement", "scores", "final_recommendation".
    `;
    
    // DEBUGGER: Log the full prompt
    debugLog("[DEBUG] Full prompt being sent to AI model:", prompt);

    console.log("[AI-feedback] Sending request to AI model...");
    
    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.3-8b-instruct:free",
      messages: [{ role: "user", content: prompt }],
    });
    
    // DEBUGGER: Log the full AI completion object
    debugLog("[DEBUG] Full AI completion object received:", JSON.stringify(completion, null, 2));

    const aiResponse = completion?.choices?.[0]?.message?.content;
    console.log("[AI-feedback] AI response received:", aiResponse);
    
    // DEBUGGER: Log before parsing JSON
    debugLog("[DEBUG] Attempting to parse AI response...");
    
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[DEBUG] No JSON object found in the AI response.");
      throw new Error("Could not find a valid JSON object in the AI response.");
    }
    
    const jsonString = jsonMatch[0];
    debugLog("[DEBUG] Extracted JSON string:", jsonString);

    const evaluationResult = JSON.parse(jsonString);
    debugLog("[DEBUG] Successfully parsed AI response:", evaluationResult);


    const recordToInsert = {
      interview_id: interviewId,
      name: intervieweeName,
      question: question,
      candidate_answer: candidateAnswer,
      summary: evaluationResult.summary,
      strengths: evaluationResult.strengths,
      areas_for_improvement: evaluationResult.areas_for_improvement,
      relevance: evaluationResult.scores.relevance,
      clarity: evaluationResult.scores.clarity,
      depth: evaluationResult.scores.depth,
      technical_soundness: evaluationResult.scores.technical_soundness,
      recommendation: evaluationResult.final_recommendation,
    };

    console.log("[AI-feedback] Inserting into Supabase:", recordToInsert);

    const { data, error } = await supabase
      .from('interview-feedback')
      .insert([recordToInsert])
      .select();

    if (error) {
      console.error("[AI-feedback] Error inserting into Supabase:", error);
       // DEBUGGER: Log Supabase error object
      console.error("[DEBUG] Supabase insert error object:", JSON.stringify(error, null, 2));
      throw new Error(`Failed to store evaluation in database: ${error.message}`);
    }

    console.log("[AI-feedback] Successfully inserted record:", data[0]);
     // DEBUGGER: Log Supabase success object
    console.log("[DEBUG] Supabase insert success data:", JSON.stringify(data, null, 2));

    // DEBUGGER: Log before sending final response
    console.log("[DEBUG] Sending successful response to client.");
    console.log("--- [AI-feedback API] COMPLETED ---");
    return new Response(JSON.stringify({ success: true, evaluationId: data[0].id }), { status: 200 });

  } catch (err) {
    console.error("[AI-feedback] API error:", err);
     // DEBUGGER: Log the caught error object
    console.error("[DEBUG] Error in catch block:", JSON.stringify({
      message: err.message,
      stack: err.stack,
      ...err
    }, null, 2));
    console.log("--- [AI-feedback API] FAILED ---");
    return new Response(JSON.stringify({ 
      error: err.message || "Internal Server Error",
      details: err.toString()
    }), { status: 500 });
  }
}