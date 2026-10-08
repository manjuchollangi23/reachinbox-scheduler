'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import axios from 'axios';
import { ComposeModal } from "@/components/ComposeModal";
import { EmailTable } from "@/components/EmailTable";

type TabType = 'PENDING' | 'SENT' | 'FAILED';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('PENDING');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [stats, setStats] = useState({ pending: 0, sent: 0, failed: 0 });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const fetchJobs = useCallback(async (silent = false) => {
    if (!session?.user?.email) return;
    if (!silent) setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/jobs`, {
        params: { senderId: session.user.email, status: activeTab }
      });
      setJobs(res.data);
    } catch (e) {
      console.error('Failed to fetch jobs:', e);
    }
    if (!silent) setLoading(false);
  }, [session?.user?.email, activeTab]);

  const fetchStats = useCallback(async () => {
    if (!session?.user?.email) return;
    try {
      const [pending, sent, failed] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/jobs`, { params: { senderId: session.user.email, status: 'PENDING' } }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/jobs`, { params: { senderId: session.user.email, status: 'SENT' } }),
        axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/jobs`, { params: { senderId: session.user.email, status: 'FAILED' } }),
      ]);
      setStats({ pending: pending.data.length, sent: sent.data.length, failed: failed.data.length });
    } catch (e) {
      console.error('Failed to fetch stats:', e);
    }
  }, [session?.user?.email]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchJobs(false);
      fetchStats();
      const interval = setInterval(() => {
        fetchJobs(true);
        fetchStats();
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [status, activeTab, fetchJobs, fetchStats]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !session?.user?.email) return;
    setSearchLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/search`, {
        params: { q: searchQuery, senderId: session.user.email }
      });
      setSearchResults(res.data);
    } catch {
      setSearchResults([]);
    }
    setSearchLoading(false);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults(null);
  };

  if (status === "loading" || !session) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#00AC4F]"></div>
      </div>
    );
  }

  const displayJobs = searchResults !== null ? searchResults : jobs;

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#111827] flex flex-col md:flex-row">
      {/* Sidebar matching Figma Screenshots 1 & 2 */}
      <aside className="w-full md:w-64 bg-white border-r border-gray-100 flex flex-col p-4 flex-shrink-0">
        {/* Logo "ONG" / ReachInbox */}
        <div className="flex items-center gap-2.5 px-2 py-3 mb-2">
          <div className="w-8 h-8 rounded-lg bg-[#00AC4F] text-white flex items-center justify-center font-extrabold text-base shadow-sm">
            O
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight text-gray-900">ONG</span>
            <span className="text-[10px] text-gray-400 block -mt-1 font-medium">Outbox Labs</span>
          </div>
        </div>

        {/* User profile dropdown pill */}
        <div className="bg-[#F8F9FA] hover:bg-[#F2F4F7] transition-colors p-2.5 rounded-xl border border-gray-100 flex items-center justify-between mb-4 cursor-pointer">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
              {session.user?.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-700 bg-gray-200">
                  {session.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-gray-900 truncate leading-tight">
                {session.user?.name || 'Oliver Brown'}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {session.user?.email || 'oliver.brown@domain.io'}
              </p>
            </div>
          </div>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>

        {/* Compose Button (Figma style) */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full py-2.5 px-4 border border-[#00AC4F] text-[#00AC4F] hover:bg-[#EAF7EE] font-medium text-sm rounded-lg transition-colors flex items-center justify-center gap-2 mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          <span>Compose</span>
        </button>

        {/* Menu Section */}
        <div className="px-2 mb-1.5 mt-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            CORE
          </span>
        </div>

        <nav className="space-y-1 flex-1">
          {/* Scheduled Nav Item */}
          <button
            onClick={() => { setActiveTab('PENDING'); clearSearch(); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'PENDING' && searchResults === null
                ? 'bg-[#EAF7EE] text-[#00AC4F]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" strokeWidth="2" />
                <polyline points="12 6 12 12 16 14" strokeWidth="2" />
              </svg>
              <span>Scheduled</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'PENDING' && searchResults === null
                ? 'bg-[#D1F2D9] text-[#008738] font-bold'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {stats.pending}
            </span>
          </button>

          {/* Sent Nav Item */}
          <button
            onClick={() => { setActiveTab('SENT'); clearSearch(); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'SENT' && searchResults === null
                ? 'bg-[#EAF7EE] text-[#00AC4F]'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              <span>Sent</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'SENT' && searchResults === null
                ? 'bg-[#D1F2D9] text-[#008738] font-bold'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {stats.sent}
            </span>
          </button>

          {/* Failed Nav Item */}
          <button
            onClick={() => { setActiveTab('FAILED'); clearSearch(); }}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'FAILED' && searchResults === null
                ? 'bg-red-50 text-red-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Failed</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              activeTab === 'FAILED' && searchResults === null
                ? 'bg-red-100 text-red-600 font-bold'
                : 'bg-gray-100 text-gray-500'
            }`}>
              {stats.failed}
            </span>
          </button>
        </nav>

        {/* Sidebar Footer */}
        <div className="pt-4 border-t border-gray-100 space-y-2 mt-auto">
          <button
            onClick={() => alert('Connect Slack Webhook in your environment or server configuration to receive instant rate-limit breach alerts.')}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <span>🔔</span>
            <span>Slack Alerts Active</span>
          </button>
          <button
            onClick={() => signOut({ callbackUrl: '/auth/signin' })}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Mail Area */}
      <main className="flex-1 flex flex-col min-w-0 p-4 md:p-6 overflow-hidden">
        {/* Top Header / Search Bar */}
        <div className="flex items-center justify-between gap-4 pb-4">
          <form onSubmit={handleSearch} className="flex-1 max-w-lg relative">
            <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search emails..."
              className="w-full bg-[#F4F5F7] border-0 rounded-lg pl-10 pr-20 py-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#00AC4F] outline-none"
            />
            {searchResults !== null ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 px-2 py-1 rounded"
              >
                Clear
              </button>
            ) : (
              <button
                type="submit"
                disabled={searchLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-[#00AC4F] hover:bg-[#EAF7EE] px-2 py-1 rounded"
              >
                {searchLoading ? '...' : 'Search'}
              </button>
            )}
          </form>

          {/* Quick status indicator */}
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-gray-400">
              <span className="w-2 h-2 rounded-full bg-[#00AC4F] animate-pulse"></span>
              Live Sync
            </span>
          </div>
        </div>

        {/* Email Container (Figma Inbox List) */}
        <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden flex flex-col">
          {searchResults !== null && (
            <div className="px-6 py-3 bg-[#F8F9FA] border-b border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>Showing {searchResults.length} search results for &ldquo;{searchQuery}&rdquo;</span>
              <button onClick={clearSearch} className="text-[#00AC4F] hover:underline font-medium">Reset view</button>
            </div>
          )}
          <EmailTable jobs={displayJobs} loading={loading || searchLoading} type={activeTab} />
        </div>
      </main>

      {/* Compose Modal */}
      <ComposeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          setActiveTab('PENDING');
          fetchJobs();
          fetchStats();
        }}
        senderId={(session.user as any)?.id || session.user?.email || ''}
      />
    </div>
  );
}

