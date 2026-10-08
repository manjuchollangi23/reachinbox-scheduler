'use client';

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import axios from 'axios';
import { ComposeModal } from "@/components/ComposeModal";
import { EmailTable } from "@/components/EmailTable";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'SCHEDULED' | 'SENT'>('SCHEDULED');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push('/');
    }
  }, [status, router]);

  const fetchJobs = async () => {
    if (!session?.user?.email) return;
    setLoading(true);
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/jobs`, {
        params: { senderId: session.user.email, status: activeTab === 'SCHEDULED' ? 'PENDING' : 'SENT' }
      });
      setJobs(res.data);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (status === "authenticated") {
      fetchJobs();
    }
  }, [status, activeTab, session]);

  if (status === "loading" || !session) {
    return <div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div></div>;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-800 ring-2 ring-blue-500">
            {session.user?.image ? (
              <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl font-bold">{session.user?.name?.[0]}</div>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-lg leading-tight">{session.user?.name}</h2>
            <p className="text-sm text-gray-400">{session.user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              // Mock connect slack flow
              alert('Redirecting to Slack OAuth...');
            }}
            className="px-4 py-2 rounded-md bg-gray-800 hover:bg-gray-700 text-sm font-medium transition-colors border border-gray-700"
          >
            Connect Slack
          </button>
          <button
            onClick={() => signOut()}
            className="px-4 py-2 rounded-md bg-red-600/10 text-red-500 hover:bg-red-600/20 text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-6 flex flex-col">
        <div className="flex items-center justify-between mb-8 mt-4">
          <h1 className="text-3xl font-bold">Campaigns</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
            Compose New Email
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-6 border-b border-gray-800 mb-6">
          {(['SCHEDULED', 'SENT'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === tab ? 'text-white border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-300'}`}
            >
              {tab === 'SCHEDULED' ? 'Scheduled Emails' : 'Sent Emails'}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden flex-1 flex flex-col">
          <EmailTable jobs={jobs} loading={loading} type={activeTab} />
        </div>
      </main>
      
      <ComposeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          setIsModalOpen(false);
          setActiveTab('SCHEDULED');
          fetchJobs();
        }} 
        senderId={session.user?.email || ''} 
      />
    </div>
  );
}
