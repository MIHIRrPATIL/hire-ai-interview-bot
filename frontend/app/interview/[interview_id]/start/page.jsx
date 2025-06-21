"use client";
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  PhoneOff, 
  User, 
  Bot, 
  MessageSquare,
  Shield,
  Clock,
  Users,
  Sparkles,
  Loader2
} from "lucide-react";
import { useInterviewData } from "@/context/InterviewData";
import Vapi from "@vapi-ai/web";
import { useRouter } from "next/navigation";

export const assistantOptions = {
    name: "AI Recruiter",
    firstMessage: "Hi {{userName}}, how are you? Ready for your interview on {{JobPosition}}?",
    transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
    },
    voice: {
        provider: "playht",
        voiceId: "jennifer",
    },
    model: {
        provider: "openai",
        model: "gpt-4",
        messages: [
            {
                role: "system",
                content: `
  You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
"Hey there! Welcome to your {{jobPosition}} interview. Let's get started with a few questions!"
Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below Are the questions ask one by one:
Questions: {{questionList}}
If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversation natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note:
"Thanks for chatting! Hope to see you crushing projects soon!"
Key Guidelines:
✅ Be friendly, engaging, and witty 🎤
✅ Keep responses short and natural, like a real conversation
✅ Adapt based on the candidate's confidence level
✅ Ensure the interview remains focused on the questions provided.
`.trim(),
            },
        ],
    },
};

export default function StartInterview() {
  const { interviewData } = useInterviewData();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [duration, setDuration] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const videoRef = useRef(null);
  const transcriptContainerRef = useRef(null);
  
  const [showTranscript, setShowTranscript] = useState(true);

  const vapiRef = useRef(null);
  const [isVapiActive, setIsVapiActive] = useState(false);
  const [isVapiLoading, setIsVapiLoading] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [conversation, setConversation] = useState([]);
  const conversationRef = useRef(conversation);
  const interviewDataRef = useRef(interviewData);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    conversationRef.current = conversation;
  }, [conversation]);

  useEffect(() => {
    interviewDataRef.current = interviewData;
  }, [interviewData]);

  useEffect(() => {
    setIsMounted(true);
    const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || "");
    vapiRef.current = vapiInstance;

    vapiInstance.on("call-start", () => {
      setIsVapiLoading(false);
      setIsVapiActive(true);
      setDuration(0);
      setConversation([]);
    });
    vapiInstance.on("call-end", async () => {
      console.log("[DEBUG] Call ended event triggered");
      setIsVapiLoading(false);
      setIsVapiActive(false);
      
      const finalConversation = conversationRef.current;
      const finalInterviewData = interviewDataRef.current;

      console.log("[DEBUG] Final conversation:", finalConversation);
      console.log("[DEBUG] Final interview data:", finalInterviewData);

      if (finalInterviewData?.interview_id && finalConversation?.length > 0) {
        console.log("[DEBUG] Starting processing...");
        setProcessing(true);
        
        // Assume conversation is an array of {role, text, isFinal}
        // We'll pair up questions and answers (AI: question, You: answer)
        const qaPairs = [];
        let lastQuestion = null;
        for (const msg of finalConversation) {
          console.log("[DEBUG] Processing message:", msg);
          if (msg.role === "AI") {
            lastQuestion = msg.text;
            console.log("[DEBUG] Found AI question:", lastQuestion);
          } else if (msg.role === "You" && lastQuestion) {
            qaPairs.push({ question: lastQuestion, answer: msg.text });
            console.log("[DEBUG] Added Q&A pair:", { question: lastQuestion, answer: msg.text });
            lastQuestion = null;
          }
        }
        
        console.log("[DEBUG] Total Q&A pairs found:", qaPairs.length);
        
        // Send each Q&A pair to the API
        for (const pair of qaPairs) {
          console.log("[DEBUG] Sending API request for pair:", pair);
          try {
            const response = await fetch("/api/AI-feedback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                interviewId: finalInterviewData.interview_id,
                intervieweeName: finalInterviewData.intervieweeName,
                question: pair.question,
                candidateAnswer: pair.answer,
                interviewType: finalInterviewData.type,
                jobDescription: finalInterviewData.jobDescription,
                resumeSummary: finalInterviewData.resumeSummary,
                experienceLevel: finalInterviewData.experienceLevel,
              }),
            });
            
            const result = await response.json();
            console.log("[DEBUG] API response:", result);
            
            if (!response.ok) {
              console.error("[DEBUG] API error:", result);
            }
          } catch (error) {
            console.error("[DEBUG] API call failed:", error);
          }
        }
        
        console.log("[DEBUG] Processing complete, redirecting...");
        setProcessing(false);
        router.push(`/interview/${finalInterviewData.interview_id}/complete`);
      } else {
        console.log("[DEBUG] Missing data - interview_id:", finalInterviewData?.interview_id, "conversation length:", finalConversation?.length);
      }
    });
    vapiInstance.on("speech-start", () => setIsAISpeaking(true));
    vapiInstance.on("speech-end", () => setIsAISpeaking(false));
    
    vapiInstance.on("message", (message) => {
      if (message.type === 'transcript' && message.transcript) {
        const role = message.role === 'assistant' ? 'AI' : 'You';
        setConversation(prev => {
          const lastMessage = prev[prev.length - 1];
          if (lastMessage?.role === role && !lastMessage.isFinal) {
            const newConversation = [...prev];
            newConversation[newConversation.length - 1] = { ...newConversation[newConversation.length - 1], text: message.transcript, isFinal: message.transcriptType === 'final' };
            return newConversation;
          } else {
            return [...prev, { role, text: message.transcript, isFinal: message.transcriptType === 'final' }];
          }
        });
      }
    });

    return () => vapiInstance.stop();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isVapiActive || isVapiLoading) setDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isVapiActive, isVapiLoading]);

  useEffect(() => {
    let localStream;
    async function getMedia() {
      setLoading(true);
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(localStream);
      } catch (err) {
        setStream(null);
      } finally {
        setLoading(false);
      }
    }
    getMedia();
    return () => localStream?.getTracks().forEach(track => track.stop());
  }, []);
  
  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = (stream && camOn) ? stream : null;
  }, [stream, camOn]);

  useEffect(() => {
    if (transcriptContainerRef.current) transcriptContainerRef.current.scrollTop = transcriptContainerRef.current.scrollHeight;
  }, [conversation]);

  const startInterviewCall = () => {
    if (!vapiRef.current || !interviewData) return alert("Interview data not available.");
    setIsVapiLoading(true);
    const { intervieweeName, jobPosition, questionList } = interviewData;
    const formattedQuestions = (questionList || []).map((q, i) => `${i + 1}. ${q.text}`).join('\n');
    const newAssistantOptions = JSON.parse(JSON.stringify(assistantOptions));
    newAssistantOptions.firstMessage = newAssistantOptions.firstMessage.replace("{{userName}}", intervieweeName || "there").replace("{{JobPosition}}", jobPosition || "the position");
    newAssistantOptions.model.messages[0].content = newAssistantOptions.model.messages[0].content.replace("{{jobPosition}}", jobPosition || "this role").replace("{{questionList}}", formattedQuestions || "No questions provided.");
    vapiRef.current.start(newAssistantOptions);
  };

  const endInterviewCall = () => vapiRef.current?.stop();
  const handleToggleCam = () => { if (stream) { stream.getVideoTracks().forEach(track => track.enabled = !camOn); setCamOn(v => !v); } };
  const handleToggleMic = () => {
    const newMicState = !micOn;
    setMicOn(newMicState);
    if (isVapiActive) vapiRef.current?.setMuted(!newMicState);
    else if (stream) stream.getAudioTracks().forEach(track => track.enabled = newMicState);
  };
  const handleLeave = () => {
    endInterviewCall();
    if (stream) stream.getTracks().forEach(track => track.stop());
    window.location.href = "/";
  };

  // Add a test function to manually trigger the complete flow
  const testCompleteFlow = async () => {
    console.log("[DEBUG] Manual test complete flow triggered");
    const finalConversation = conversationRef.current;
    const finalInterviewData = interviewDataRef.current;
    
    console.log("[DEBUG] Test - Final conversation:", finalConversation);
    console.log("[DEBUG] Test - Final interview data:", finalInterviewData);
    
    if (finalInterviewData?.interview_id) {
      setProcessing(true);
      // Simulate a simple API call
      try {
        const response = await fetch("/api/AI-feedback/test", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            interviewId: finalInterviewData.interview_id,
            intervieweeName: finalInterviewData.intervieweeName || "Test User",
            question: "Test question",
            candidateAnswer: "Test answer",
            interviewType: finalInterviewData.type || "Technical",
            experienceLevel: finalInterviewData.experienceLevel || "Mid-level",
          }),
        });
        
        const result = await response.json();
        console.log("[DEBUG] Test API response:", result);
        
        setProcessing(false);
        router.push(`/interview/${finalInterviewData.interview_id}/complete`);
      } catch (error) {
        console.error("[DEBUG] Test API call failed:", error);
        setProcessing(false);
      }
    }
  };

  const formatDuration = (seconds) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;

  const renderAIState = () => {
    if (!isVapiActive && !isVapiLoading) {
      return (
        <>
          <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/50 mb-8">
            <Bot className="w-16 h-16 text-white" />
          </div>
          <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">AI Interviewer</h3>
          <p className="text-blue-700 text-center mb-6 max-w-sm">Ready to begin? Press start to connect with the AI.</p>
          <Button onClick={startInterviewCall} size="lg" className="rounded-full shadow-lg">
            <Sparkles className="w-5 h-5 mr-2" />
            Start AI Interview
          </Button>
        </>
      );
    }
    if (isVapiLoading) {
      return (
        <div className="flex flex-col items-center text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
          <h3 className="text-2xl font-semibold text-blue-800">Connecting to AI...</h3>
          <p className="text-blue-600">Please wait a moment.</p>
        </div>
      );
    }
    if (isVapiActive) {
      return (
        <div className="w-full h-full flex flex-col text-center">
          <div className={`relative mb-4 transition-transform duration-300 ${isAISpeaking ? 'scale-110' : ''}`}>
            <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/50">
              <Bot className="w-12 h-12 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-blue-800 mb-4">{isAISpeaking ? "AI is speaking..." : "Listening..."}</h3>
          {showTranscript ? (
            <div ref={transcriptContainerRef} className="flex-1 bg-white/50 rounded-xl p-4 overflow-y-auto text-left w-full">
              <div className="whitespace-pre-wrap text-sm text-gray-700 font-sans space-y-2">
                {conversation.map((msg, index) => (
                  <div key={index}>
                    <span className={`font-bold ${msg.role === 'AI' ? 'text-blue-600' : 'text-green-600'}`}>{msg.role}: </span>
                    <span>{msg.text}</span>
                    {!msg.isFinal && <span className="inline-block w-1.5 h-4 bg-gray-500 ml-1 animate-pulse align-middle"></span>}
                  </div>
                ))}
                {conversation.length === 0 && <span className="text-gray-500">Transcript will appear here...</span>}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white/50 rounded-xl p-4 text-center">
                <MessageSquare className="w-10 h-10 text-blue-400 mb-3"/>
                <p className="text-blue-600 font-medium">Transcript is hidden</p>
                <p className="text-blue-500 text-sm">Click the chat icon to show it.</p>
            </div>
          )}
        </div>
      );
    }
  };

  if (processing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
          <span className="text-blue-600 text-2xl mb-4 animate-spin">⏳</span>
          <h2 className="text-xl font-semibold mb-2">Processing your responses...</h2>
          <p className="text-gray-600">Please wait while we evaluate your interview answers.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-white/80 backdrop-blur-lg border border-white/40 rounded-3xl shadow-xl px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-6">
                  <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                          <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <div>
                          <h1 className="font-bold text-gray-900 text-lg">{interviewData?.jobPosition || "Interview Portal"}</h1>
                          <p className="text-xs text-blue-600">Professional AI Interview</p>
                      </div>
                  </div>
                  <div className="hidden md:flex items-center space-x-6">
                      <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
                          <Shield className="w-4 h-4 text-green-600" />
                          <span className="text-sm font-medium text-green-700">Secure Session</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-full">
                          <Clock className="w-4 h-4 text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">{isMounted ? formatDuration(duration) : '--:--'}</span>
                      </div>
                      <div className="flex items-center space-x-2 bg-indigo-50 px-3 py-1.5 rounded-full">
                          <Users className="w-4 h-4 text-indigo-600" />
                          <span className="text-sm font-medium text-indigo-700">2 participants</span>
                      </div>
                  </div>
              </div>
              <div className="flex items-center space-x-3">
                  <div className="bg-gray-50 px-3 py-1.5 rounded-full">
                      <span className="text-sm font-medium text-gray-700">{isMounted ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row gap-6 h-[calc(100vh-200px)]">
          <div className="flex-1 grid grid-cols-1">
            <div className="bg-white/70 backdrop-blur-lg border border-white/50 rounded-3xl shadow-2xl overflow-hidden">
              <div className="relative h-full bg-gradient-to-br from-blue-50 to-indigo-50">
                {stream && camOn ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover rounded-3xl" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-4 shadow-lg">
                      <User className="w-12 h-12 text-blue-500" />
                    </div>
                    <span className="text-blue-700 text-lg font-medium">Camera is off</span>
                  </div>
                )}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-lg border border-white/50">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-semibold text-gray-800">{interviewData?.intervieweeName || "You"}</span>
                    {!micOn && <MicOff className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm rounded-3xl">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
                      <span className="text-blue-700 font-medium">Connecting camera...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="w-full xl:w-[450px] h-full">
            <div className={`bg-gradient-to-br from-blue-400/20 to-indigo-500/20 backdrop-blur-lg border border-blue-200/50 rounded-3xl shadow-2xl overflow-hidden transition-all duration-500 h-full flex flex-col ${isAISpeaking ? "ring-4 ring-blue-400 shadow-blue-400/50" : ""}`}>
              <div className="w-full h-full flex flex-col items-center justify-center p-6 relative">
                {renderAIState()}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-3 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/30 backdrop-blur-xl border border-white/50 rounded-full shadow-2xl px-4 py-2">
          <div className="flex items-center space-x-4">
            <Button onClick={handleToggleMic} disabled={!stream} className={`w-10 h-10 rounded-full transition-all ${micOn ? 'bg-blue-500' : 'bg-red-500'} text-white`}>
              {micOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>
            <Button onClick={handleToggleCam} disabled={!stream} className={`w-10 h-10 rounded-full transition-all ${camOn ? 'bg-blue-500' : 'bg-red-500'} text-white`}>
              {camOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
            <Button onClick={() => setShowTranscript(s => !s)} className={`w-10 h-10 rounded-full transition-all text-white ${showTranscript ? 'bg-blue-500' : 'bg-gray-600'}`}>
              <MessageSquare className="w-6 h-6" />
            </Button>
            <div className="w-px h-8 bg-gray-300 mx-2"></div>
            <Button 
              onClick={handleLeave}
              variant="destructive" 
              size="sm"
              className="rounded-full"
            >
              <PhoneOff className="w-4 h-4 mr-2" />
              Leave Call
            </Button>
            
            {/* Test button for debugging */}
            <Button 
              onClick={testCompleteFlow}
              variant="outline" 
              size="sm"
              className="rounded-full ml-2"
            >
              Test Complete Flow
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}