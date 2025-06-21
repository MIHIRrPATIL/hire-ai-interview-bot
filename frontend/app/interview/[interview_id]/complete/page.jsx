"use client";
import React from "react";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function InterviewComplete() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col items-center">
        <CheckCircle className="w-16 h-16 text-green-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2 text-gray-900">Interview Complete</h1>
        <p className="text-gray-700 mb-6 text-center">
          The call has ended and your responses have been successfully acquired and evaluated.<br />
          Thank you for participating in the interview!
        </p>
        {/* <Button onClick={() => router.push("/")}>Return to Home</Button> */}
      </div>
    </div>
  );
} 