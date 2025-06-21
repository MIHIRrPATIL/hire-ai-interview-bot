import { supabase } from "@/services/supabaseClient";

export async function POST(req) {
  try {
    const {
      interviewId,
      intervieweeName,
      question,
      candidateAnswer,
      interviewType,
      experienceLevel
    } = await req.json();

    console.log("[AI-feedback-test] Received request:", {
      interviewId,
      intervieweeName,
      question: question?.substring(0, 50) + "...",
      interviewType,
      experienceLevel
    });

    // Check for required environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANNON_KEY) {
      console.error("[AI-feedback-test] Missing Supabase environment variables");
      return new Response(JSON.stringify({ 
        error: "Server misconfiguration: missing Supabase environment variables." 
      }), { status: 500 });
    }

    // Simulate AI evaluation result
    const evaluationResult = {
      clarity: 8,
      relevance: 9,
      depth: 7,
      confidence: 8,
      communication: 8,
      summary: "Strong technical response demonstrating good React knowledge and practical experience.",
      final_recommendation: "Strong Match",
      red_flags: { none: "No red flags detected" }
    };

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

    console.log("[AI-feedback-test] Inserting into Supabase:", recordToInsert);

    const { data, error } = await supabase
      .from('interview-feedback')
      .insert([recordToInsert])
      .select();

    if (error) {
      console.error("[AI-feedback-test] Error inserting into Supabase:", error);
      throw new Error(`Failed to store evaluation in database: ${error.message}`);
    }

    console.log("[AI-feedback-test] Successfully inserted record:", data[0]);

    return new Response(JSON.stringify({ 
      success: true, 
      evaluationId: data[0].id,
      message: "Test evaluation stored successfully"
    }), { status: 200 });

  } catch (err) {
    console.error("[AI-feedback-test] API error:", err);
    return new Response(JSON.stringify({ 
      error: err.message || "Internal Server Error",
      details: err.toString()
    }), { status: 500 });
  }
} 