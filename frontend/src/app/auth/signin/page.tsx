'use client';

import { signIn } from "next-auth/react";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [email, setEmail] = useState("demo@example.com");
  const [password, setPassword] = useState("demo");
  const [loading, setLoading] = useState(false);

  const errorMessages: Record<string, string> = {
    OAuthCallback: "Google sign-in failed. Please ensure test users are configured or use demo credentials.",
    OAuthSignin: "Could not start Google sign-in.",
    Callback: "Callback error. Check your Google credentials.",
    Default: "An error occurred during sign in.",
  };

  const handleDemoSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", {
      email,
      password,
      callbackUrl: "/dashboard",
    });
    setLoading(false);
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-100 shadow-[0_4px_25px_rgba(0,0,0,0.04)] p-8">
      <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
        Login
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs">
          {errorMessages[error] ?? errorMessages.Default}
        </div>
      )}

      {/* Login with Google */}
      <button
        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
        className="w-full py-2.5 px-4 bg-[#EAF7EE] hover:bg-[#DDF2E3] text-[#00A343] font-medium text-sm rounded-lg flex items-center justify-center gap-2.5 transition-colors border border-[#CDECD4]/50 mb-4 cursor-pointer"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Login with Google
      </button>

      {/* Divider */}
      <div className="relative flex items-center justify-center my-4">
        <div className="border-t border-gray-200 w-full"></div>
        <span className="bg-white px-3 text-[11px] text-gray-400 absolute">
          or sign up through email
        </span>
      </div>

      {/* Credentials Form */}
      <form onSubmit={handleDemoSignIn} className="space-y-3 mt-4">
        <div>
          <input
            type="text"
            placeholder="Email ID"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full bg-[#F4F5F7] border-0 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#00AC4F] outline-none"
            required
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full bg-[#F4F5F7] border-0 rounded-lg px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#00AC4F] outline-none"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-[#00AC4F] hover:bg-[#009B47] text-white font-medium text-sm rounded-lg transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
        >
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>

      <p className="mt-4 text-[11px] text-gray-400 text-center">
        Demo login: use any email with password <span className="font-semibold text-gray-600">demo</span>
      </p>
    </div>
  );
}

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
      <Suspense fallback={
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 border border-gray-100 flex justify-center">
          <div className="w-6 h-6 border-2 border-[#00AC4F] border-t-transparent rounded-full animate-spin"></div>
        </div>
      }>
        <SignInContent />
      </Suspense>
    </div>
  );
}
