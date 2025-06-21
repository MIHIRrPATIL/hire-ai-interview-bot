'use client'

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useRouter } from "next/navigation";
import Image from 'next/image';

export default function Home() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      } else {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <Image src="/favicon.ico" alt="AI Interview Logo" width={64} height={64} />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">
          AI Interview Platform
        </h1>
        <p className="text-xl text-gray-600 max-w-md">
          Welcome to the AI-powered interview platform for interviewers
        </p>
        <div className="space-y-4">
          <Link 
            href="/auth" 
            className="inline-block bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </div>
  );
}
