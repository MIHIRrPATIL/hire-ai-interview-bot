"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Clock, Briefcase, User, CheckCircle } from "lucide-react";
import { useInterviewData } from "@/context/InterviewData";
import { useRouter } from "next/navigation";

export default function InterviewLanding() {
  const params = useParams();
  const interviewId = params.interview_id;
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  const { setInterviewData } = useInterviewData();
  const router = useRouter();

  useEffect(() => {
    const fetchInterview = async () => {
      if (!interviewId) {
        setError("Invalid interview link.");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");
      try {
        const { data, error } = await supabase
          .from("interviews")
          .select("jobPosition, duration, type")
          .eq("interview_id", interviewId)
          .single();
        if (error || !data) {
          setError("Interview not found.");
        } else {
          setInterview(data);
        }
      } catch (err) {
        setError("Failed to load interview details.");
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [interviewId]);

  const handleContinue = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (!name.trim()) return;
    // Fetch all interview details from Supabase
    try {
      const { data, error } = await supabase
        .from("interviews")
        .select("*")
        .eq("interview_id", interviewId)
        .single();
      if (error || !data) {
        setError("Interview not found.");
        return;
      }
      setInterviewData({ ...data, intervieweeName: name });
      console.log("Full interview data:", { ...data, intervieweeName: name });
      router.push(`/interview/${interviewId}/start`);
    } catch (err) {
      setError("Failed to fetch interview details.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4 shadow-lg">
            <Briefcase className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Interview Portal
          </h1>
          <p className="text-gray-600">
            Welcome to your professional interview session
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-500">Loading interview details...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-red-600 text-2xl">!</span>
              </div>
              <p className="text-red-600 font-medium text-lg">{error}</p>
              <p className="text-gray-500 mt-2">Please check your interview link and try again.</p>
            </div>
          ) : (
            <>
              {/* Interview Details Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <h2 className="text-xl font-semibold mb-4">Interview Details</h2>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3">
                    <Briefcase className="w-5 h-5 text-blue-200" />
                    <div>
                      <span className="text-blue-200 text-sm">Position</span>
                      <p className="font-medium">{interview.jobPosition || "Not specified"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-blue-200" />
                    <div>
                      <span className="text-blue-200 text-sm">Duration</span>
                      <p className="font-medium">{interview.duration ? `${interview.duration} minutes` : "Not specified"}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Section */}
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="w-5 h-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Please introduce yourself
                    </h3>
                  </div>
                  <p className="text-gray-600 text-sm">
                    Enter your full name to begin the interview process
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Enter your full name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      onBlur={() => setTouched(true)}
                      className={`h-12 text-base ${
                        touched && !name.trim() 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
                      }`}
                      aria-invalid={touched && !name.trim()}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleContinue(e);
                        }
                      }}
                    />
                    {touched && !name.trim() && (
                      <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                        <span className="w-4 h-4 text-red-500">!</span>
                        Please enter your name to continue
                      </p>
                    )}
                  </div>

                  <Button 
                    onClick={handleContinue}
                    disabled={!name.trim()} 
                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-base font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    {name.trim() ? (
                      <span className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5" />
                        Start Interview
                      </span>
                    ) : (
                      'Enter Name to Continue'
                    )}
                  </Button>
                </div>

                {/* Footer */}
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 text-center">
                    Make sure you're in a quiet environment with stable internet connection
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Additional Tips */}
        {!loading && !error && (
          <div className="mt-6 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <h4 className="font-medium text-gray-800 mb-2 text-sm">Before you begin:</h4>
            <ul className="text-xs text-gray-600 space-y-1">
              <li>• Ensure you have a stable internet connection</li>
              <li>• Find a quiet, well-lit space</li>
              <li>• Test your camera and microphone</li>
              <li>• Have your resume ready for reference</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}