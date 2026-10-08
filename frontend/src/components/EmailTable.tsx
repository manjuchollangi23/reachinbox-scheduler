'use client';

import { format } from "date-fns";
import { useState } from "react";

export function EmailTable({ jobs, loading, type }: { jobs: any[], loading: boolean, type: 'PENDING' | 'SENT' | 'FAILED' }) {
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  if (loading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-gray-400 gap-3">
        <div className="w-6 h-6 border-2 border-[#00AC4F] border-t-transparent rounded-full animate-spin"></div>
        <span className="text-sm">Loading emails...</span>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="p-20 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-gray-800">No emails here</h3>
        <p className="text-sm text-gray-500 mt-1 max-w-sm">
          {type === 'PENDING' ? 'No emails scheduled at the moment. Click "Compose" to start a campaign.' :
           type === 'SENT' ? 'No sent emails yet. Dispatched campaigns will appear here.' :
           'No failed deliveries recorded. Everything is running smoothly!'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col divide-y divide-gray-100">
      {/* Email List Items */}
      {jobs.map((job) => {
        const dateStr = job.scheduledTime || job.sentAt || job.updatedAt;
        const formattedTime = dateStr ? format(new Date(dateStr), 'EEE hh:mm a') : '';

        return (
          <div
            key={job.id}
            onClick={() => setSelectedJob(selectedJob?.id === job.id ? null : job)}
            className="flex items-center gap-4 px-6 py-4 hover:bg-[#F9FAFB] cursor-pointer transition-colors group"
          >
            {/* Recipient */}
            <div className="w-48 flex-shrink-0 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                To: {job.toEmail.split('@')[0]}
              </span>
            </div>

            {/* Status / Scheduled Tag */}
            <div className="flex-shrink-0">
              {job.status === 'PENDING' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" strokeWidth="2" />
                    <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                  </svg>
                  {formattedTime} · Scheduled
                </span>
              ) : job.status === 'SENT' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#EAF7EE] text-[#00AC4F]">
                  Sent
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-100">
                  Failed
                </span>
              )}
            </div>

            {/* Subject and Snippet */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 truncate">
                {job.subject}
              </span>
              <span className="text-sm text-gray-400 truncate hidden sm:inline">
                — {job.body || 'No content preview'}
              </span>
            </div>

            {/* Error badge if failed */}
            {job.status === 'FAILED' && job.error && (
              <span className="text-xs text-red-500 truncate max-w-[140px] bg-red-50 px-2 py-0.5 rounded">
                {job.error}
              </span>
            )}

            {/* Ethereal Preview pill */}
            {job.previewUrl && (
              <a
                href={job.previewUrl}
                target="_blank"
                rel="noreferrer"
                onClick={e => e.stopPropagation()}
                className="hidden lg:inline-flex items-center gap-1 text-[11px] text-[#00AC4F] bg-[#EAF7EE] hover:bg-[#DDF2E3] px-2 py-0.5 rounded font-medium transition-colors"
                title="View rendered email in Ethereal Sandbox"
              >
                <span>📨 View Email ↗</span>
              </a>
            )}

            {/* Right Action Icons / Time */}
            <div className="flex items-center gap-3 text-gray-400 text-xs flex-shrink-0">
              <span className="hidden md:inline">{formattedTime}</span>
              <button className="opacity-0 group-hover:opacity-100 p-1 hover:text-gray-600 transition-opacity">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </button>
            </div>
          </div>
        );
      })}

      {/* Detail Slideout/Modal when an email is clicked (matches Figma Screenshot 3) */}
      {selectedJob && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 border border-gray-100 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedJob(null)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </button>
                <h3 className="font-semibold text-gray-900 text-base">{selectedJob.subject}</h3>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                selectedJob.status === 'SENT' ? 'bg-[#EAF7EE] text-[#00AC4F]' :
                selectedJob.status === 'PENDING' ? 'bg-[#FFF7ED] text-[#EA580C]' :
                'bg-red-50 text-red-600'
              }`}>
                {selectedJob.status}
              </span>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#EAF7EE] text-[#00AC4F] font-bold flex items-center justify-center text-sm">
                  {selectedJob.toEmail[0]?.toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{selectedJob.toEmail}</div>
                  <div className="text-xs text-gray-400">Scheduled / sent via ReachInbox</div>
                </div>
              </div>
              <div className="text-xs text-gray-400">
                {format(new Date(selectedJob.scheduledTime || selectedJob.createdAt), 'MMM d, yyyy h:mm a')}
              </div>
            </div>

            <div className="bg-[#F9FAFB] rounded-xl p-4 text-sm text-gray-800 whitespace-pre-wrap leading-relaxed min-h-[140px] border border-gray-100">
              {selectedJob.body}
            </div>

            {selectedJob.previewUrl && (
              <div className="mt-4 p-3 rounded-xl bg-[#EAF7EE] border border-[#CDECD4] flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[#008738]">📨 Delivered to Ethereal Sandbox</p>
                  <p className="text-[11px] text-gray-600">Simulated test SMTP captures emails for safe assignment grading without spamming external inboxes.</p>
                </div>
                <a
                  href={selectedJob.previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-[#00AC4F] hover:bg-[#009645] text-white text-xs font-medium rounded-lg whitespace-nowrap ml-3"
                >
                  View Rendered Email ↗
                </a>
              </div>
            )}

            {selectedJob.error && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-600">
                <strong>Error reason:</strong> {selectedJob.error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setSelectedJob(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
