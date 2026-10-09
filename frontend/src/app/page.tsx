'use client';

import { useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace('/dashboard');
    } else if (status === "unauthenticated") {
      router.replace('/auth/signin');
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
      <div className="w-8 h-8 border-3 border-[#00AC4F] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}
