'use client';

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, { title: string; description: string; fix: string }> = {
    OAuthCallback: {
      title: "Google OAuth Callback Failed",
      description: "Google returned an error during the sign-in flow.",
      fix: "Your Google OAuth app is likely in 'Testing' mode. You need to add your Google email address as a Test User in Google Cloud Console under 'OAuth consent screen → Test users'.",
    },
    OAuthSignin: {
      title: "OAuth Sign-in Error",
      description: "Could not initiate the Google sign-in process.",
      fix: "Check that your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local are correct, and that 'http://localhost:3000/api/auth/callback/google' is listed in Authorized Redirect URIs.",
    },
    Callback: {
      title: "Callback Error",
      description: "An error occurred in the authentication callback.",
      fix: "Ensure your redirect URIs are correctly set up in Google Cloud Console.",
    },
    AccessDenied: {
      title: "Access Denied",
      description: "You don't have permission to sign in.",
      fix: "If your OAuth app is in Testing mode, you must be added as a Test User.",
    },
  };

  const info = errorMessages[error ?? ""] ?? {
    title: `Auth Error: ${error ?? "Unknown"}`,
    description: "An unexpected authentication error occurred.",
    fix: "Please check your OAuth configuration and try again.",
  };

  return (
    <div className="w-full max-w-lg bg-white rounded-2xl border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.04)] p-8">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-2xl">⚠️</span>
        <h1 className="text-xl font-bold text-gray-900">{info.title}</h1>
      </div>
      <p className="text-gray-600 mb-4 text-sm">{info.description}</p>
      
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 mb-6">
        <h2 className="text-amber-800 font-semibold mb-1 text-xs">How to fix:</h2>
        <p className="text-amber-900 text-xs leading-relaxed">{info.fix}</p>
      </div>

      <div className="flex gap-3">
        <Link
          href="/auth/signin"
          className="flex-1 text-center px-4 py-2.5 bg-[#00AC4F] hover:bg-[#009645] text-white rounded-lg text-sm font-medium transition-colors"
        >
          Try Again
        </Link>
        <a
          href="https://console.cloud.google.com/apis/credentials/consent"
          target="_blank"
          className="flex-1 text-center px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
        >
          Open Google Console ↗
        </a>
      </div>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-gray-900 flex flex-col items-center justify-center px-6">
      <Suspense fallback={
        <div className="w-full max-w-lg bg-white rounded-2xl p-8 border border-gray-100 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#00AC4F] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <AuthErrorContent />
      </Suspense>
    </div>
  );
}

