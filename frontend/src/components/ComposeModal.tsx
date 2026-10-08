'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { toast } from 'sonner';

export function ComposeModal({ isOpen, onClose, onSuccess, senderId }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, senderId: string }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [loading, setLoading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          // Assuming single column CSV or extracting anything that looks like an email
          const text = results.data.flat().join(' ');
          const extracted = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];
          setEmails(extracted);
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !body || emails.length === 0) {
      toast.error('Please fill in all fields and upload a CSV with emails.');
      return;
    }
    
    setLoading(true);
    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/jobs/schedule`, {
        subject,
        body,
        toEmails: emails,
        scheduledTime: scheduledTime ? new Date(scheduledTime).toISOString() : new Date().toISOString(),
        delaySeconds,
        hourlyLimit,
        senderId,
      });
      toast.success('Campaign scheduled successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to schedule');
    }
    setLoading(false);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-900 border border-gray-800 p-8 text-left align-middle shadow-2xl transition-all">
                <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-white mb-6">
                  Compose Campaign
                </Dialog.Title>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Subject</label>
                    <input
                      type="text"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                      placeholder="e.g. Partnership Opportunity"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Body</label>
                    <textarea
                      rows={5}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                      placeholder="Hi there..."
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      required
                    />
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700/50">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Upload Leads (CSV)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={handleFileUpload}
                        className="block w-full text-sm text-gray-400
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-500/10 file:text-blue-500
                          hover:file:bg-blue-500/20 cursor-pointer"
                      />
                      {emails.length > 0 && (
                        <span className="text-green-400 text-sm font-medium whitespace-nowrap bg-green-400/10 px-3 py-1 rounded-full border border-green-400/20">
                          {emails.length} leads detected
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Start Time</label>
                      <input
                        type="datetime-local"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={scheduledTime}
                        onChange={e => setScheduledTime(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Delay (secs)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={delaySeconds}
                        onChange={e => setDelaySeconds(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-1">Emails / Hour</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={hourlyLimit}
                        onChange={e => setHourlyLimit(Number(e.target.value))}
                      />
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-gray-800">
                    <button
                      type="button"
                      className="px-5 py-2.5 text-sm font-medium text-gray-300 hover:text-white bg-transparent hover:bg-gray-800 rounded-lg transition-colors"
                      onClick={onClose}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                      )}
                      Schedule Campaign
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
