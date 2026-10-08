'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import axios from 'axios';
import Papa from 'papaparse';
import { toast } from 'sonner';

export function ComposeModal({
  isOpen,
  onClose,
  onSuccess,
  senderId
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  senderId: string;
}) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [scheduledTime, setScheduledTime] = useState('');
  const [delaySeconds, setDelaySeconds] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(200);
  const [showSchedulePopover, setShowSchedulePopover] = useState(false);
  const [loading, setLoading] = useState(false);

  const parseEmails = (text: string) => {
    const matched = text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi) || [];
    return Array.from(new Set(matched));
  };

  const addEmail = (raw: string) => {
    const extracted = parseEmails(raw);
    if (extracted.length > 0) {
      setEmails(prev => Array.from(new Set([...prev, ...extracted])));
      setEmailInput('');
    }
  };

  const removeEmail = (emailToRemove: string) => {
    setEmails(prev => prev.filter(e => e !== emailToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(emailInput);
    }
  };

  const handleLoadSample = () => {
    const sample = ['sarah.wilson@acme.corp', 'john.smith@domain.io', 'amanda.clark@techstart.com'];
    setEmails(prev => Array.from(new Set([...prev, ...sample])));
    toast.info('Sample recipient leads loaded');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      Papa.parse(file, {
        complete: (results) => {
          const text = results.data.flat().join(' ');
          const extracted = parseEmails(text);
          if (extracted.length > 0) {
            setEmails(prev => Array.from(new Set([...prev, ...extracted])));
            toast.success(`${extracted.length} leads loaded from CSV`);
          } else {
            toast.error('No valid emails found in the file.');
          }
        }
      });
    }
  };

  const applySchedulePreset = (offsetHours: number, hourOfDay = 10) => {
    const target = new Date();
    target.setDate(target.getDate() + 1);
    target.setHours(hourOfDay, 0, 0, 0);
    // Format to local datetime-local string
    const tzOffset = target.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(target.getTime() - tzOffset)).toISOString().slice(0, 16);
    setScheduledTime(localISOTime);
    setShowSchedulePopover(false);
    toast.info(`Scheduled for ${target.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  };

  const handleSubmit = async (isSendNow = false) => {
    const finalEmails = [...emails];
    if (emailInput.trim()) {
      const extra = parseEmails(emailInput);
      finalEmails.push(...extra);
    }
    const uniqueEmails = Array.from(new Set(finalEmails));

    if (!subject.trim() || !body.trim() || uniqueEmails.length === 0) {
      toast.error('Please enter Subject, Body, and at least one recipient email.');
      return;
    }

    setLoading(true);
    try {
      const scheduledIso = (isSendNow || !scheduledTime)
        ? new Date().toISOString()
        : new Date(scheduledTime).toISOString();

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/jobs/schedule`, {
        subject,
        body,
        toEmails: uniqueEmails,
        scheduledTime: scheduledIso,
        delaySeconds,
        hourlyLimit,
        senderId,
      });

      toast.success(isSendNow ? 'Campaign dispatched immediately!' : 'Campaign scheduled successfully!');
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to schedule campaign');
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
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-98"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-98"
            >
              <Dialog.Panel className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-gray-100 p-6 text-left align-middle transition-all relative">
                
                {/* Header matching Figma: "← Compose New Email" + right action buttons */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
                      title="Back to inbox"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                    </button>
                    <Dialog.Title as="h3" className="text-lg font-semibold text-gray-900">
                      Compose New Email
                    </Dialog.Title>
                  </div>

                  <div className="flex items-center gap-3 relative">
                    {/* Attach Icon */}
                    <button
                      type="button"
                      onClick={() => toast.info('File attachment feature ready for S3 / Cloud Storage upload.')}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Attach file"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                    </button>

                    {/* Clock / Schedule trigger */}
                    <button
                      type="button"
                      onClick={() => setShowSchedulePopover(!showSchedulePopover)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Schedule send time"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="10" strokeWidth="2" />
                        <polyline points="12 6 12 12 16 14" strokeWidth="2" />
                      </svg>
                    </button>

                    {/* Send Later Button (Figma Screenshot 1, 2) */}
                    <button
                      type="button"
                      onClick={() => setShowSchedulePopover(!showSchedulePopover)}
                      className="px-4 py-2 border border-[#00AC4F] text-[#00AC4F] hover:bg-[#EAF7EE] text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      <span>Send Later</span>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Send Now Button */}
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSubmit(true)}
                      className="px-4 py-2 bg-[#00AC4F] hover:bg-[#009645] text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-60 flex items-center gap-1.5"
                    >
                      {loading ? 'Sending...' : 'Send Now'}
                    </button>

                    {/* Schedule Popover (Figma Screenshot 2 bottom) */}
                    {showSchedulePopover && (
                      <div className="absolute top-12 right-0 w-80 bg-white rounded-xl shadow-xl border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                        <h4 className="text-sm font-bold text-gray-900 mb-3">Send Later</h4>
                        
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-500 mb-1">Pick date & time</label>
                          <input
                            type="datetime-local"
                            value={scheduledTime}
                            onChange={e => setScheduledTime(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-lg p-2 text-gray-800 focus:ring-1 focus:ring-[#00AC4F] outline-none"
                          />
                        </div>

                        <div className="space-y-1.5 border-t border-gray-100 pt-3">
                          <button
                            type="button"
                            onClick={() => applySchedulePreset(24, 10)}
                            className="w-full text-left text-xs py-1.5 px-2 rounded hover:bg-gray-50 text-gray-700 flex justify-between"
                          >
                            <span>Tomorrow, 10:00 AM</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applySchedulePreset(24, 11)}
                            className="w-full text-left text-xs py-1.5 px-2 rounded hover:bg-gray-50 text-gray-700 flex justify-between"
                          >
                            <span>Tomorrow, 11:00 AM</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => applySchedulePreset(24, 15)}
                            className="w-full text-left text-xs py-1.5 px-2 rounded hover:bg-gray-50 text-gray-700 flex justify-between"
                          >
                            <span>Tomorrow, 3:00 PM</span>
                          </button>
                        </div>

                        <div className="flex justify-end gap-2 border-t border-gray-100 pt-3 mt-3">
                          <button
                            type="button"
                            onClick={() => setShowSchedulePopover(false)}
                            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowSchedulePopover(false);
                              handleSubmit(false);
                            }}
                            className="px-4 py-1.5 bg-[#00AC4F] text-white text-xs font-medium rounded-lg hover:bg-[#009645]"
                          >
                            Schedule
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form Fields matching Figma */}
                <div className="space-y-4">
                  {/* From Field */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-16">From</span>
                    <div className="inline-flex items-center gap-2 bg-[#F4F5F7] px-3 py-1.5 rounded-lg text-sm text-gray-800">
                      <span>{senderId || 'oliver.brown@domain.io'}</span>
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* To Field with Recipient Pills + Upload List button */}
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-medium text-gray-500 w-16 pt-2">To</span>
                    <div className="flex-1 bg-white border border-gray-200 rounded-lg p-2 min-h-[46px] flex flex-wrap items-center gap-1.5 focus-within:ring-2 focus-within:ring-[#00AC4F]/20 focus-within:border-[#00AC4F]">
                      {/* Recipient Pills (Figma Screenshot 3 bottom) */}
                      {emails.map((em) => (
                        <span
                          key={em}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#EAF7EE] text-[#00AC4F] text-xs font-medium rounded-md"
                        >
                          {em}
                          <button
                            type="button"
                            onClick={() => removeEmail(em)}
                            className="text-[#00AC4F]/70 hover:text-[#00AC4F] ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      {/* Recipient Input */}
                      <input
                        type="text"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={() => addEmail(emailInput)}
                        placeholder={emails.length === 0 ? "recipient@example.com (press Enter or comma)" : "Add more..."}
                        className="flex-1 min-w-[200px] border-none outline-none text-sm text-gray-800 placeholder-gray-400 bg-transparent px-1 py-1"
                      />

                      {/* Right upload action inside/beside the box */}
                      <div className="flex items-center gap-2 ml-auto pr-1">
                        <button
                          type="button"
                          onClick={handleLoadSample}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          + Sample Leads
                        </button>

                        <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-[#00AC4F] hover:text-[#009645] font-medium bg-[#EAF7EE] px-2.5 py-1 rounded">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                          </svg>
                          <span>Upload List</span>
                          <input
                            type="file"
                            accept=".csv,.txt"
                            onChange={handleFileUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Subject Field */}
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-500 w-16">Subject</span>
                    <input
                      type="text"
                      placeholder="Subject"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#00AC4F]/20 focus:border-[#00AC4F] outline-none"
                    />
                  </div>

                  {/* Inline Delay & Hourly Limit (Figma Screenshot 1, 2) */}
                  <div className="flex items-center gap-6 py-2 border-y border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-600">Delay between 2 emails:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={delaySeconds}
                          onChange={e => setDelaySeconds(Number(e.target.value))}
                          className="w-16 bg-[#F4F5F7] border border-gray-200 rounded px-2 py-1 text-xs text-center text-gray-800 font-medium focus:ring-1 focus:ring-[#00AC4F] outline-none"
                        />
                        <span className="text-xs text-gray-400">secs</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-gray-600">Hourly Limit:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          value={hourlyLimit}
                          onChange={e => setHourlyLimit(Number(e.target.value))}
                          className="w-20 bg-[#F4F5F7] border border-gray-200 rounded px-2 py-1 text-xs text-center text-gray-800 font-medium focus:ring-1 focus:ring-[#00AC4F] outline-none"
                        />
                        <span className="text-xs text-gray-400">/hr</span>
                      </div>
                    </div>

                    {scheduledTime && (
                      <div className="ml-auto flex items-center gap-1.5 text-xs text-[#EA580C] bg-[#FFF7ED] px-2.5 py-1 rounded">
                        <span>🕒 {new Date(scheduledTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                        <button onClick={() => setScheduledTime('')} className="hover:font-bold">×</button>
                      </div>
                    )}
                  </div>

                  {/* Rich Text Editor Simulation Toolbar (Figma Toolbar) */}
                  <div className="border border-gray-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#00AC4F]/20 focus-within:border-[#00AC4F]">
                    <div className="bg-[#FAFAFA] border-b border-gray-200 px-3 py-2 flex flex-wrap items-center gap-2 text-gray-600 text-xs">
                      {/* Undo / Redo */}
                      <button type="button" className="p-1 hover:bg-gray-200 rounded">↶</button>
                      <button type="button" className="p-1 hover:bg-gray-200 rounded">↷</button>
                      <div className="h-4 w-px bg-gray-300 mx-1"></div>

                      {/* Font options */}
                      <span className="font-semibold px-1 hover:bg-gray-200 rounded cursor-pointer">Tt ⌄</span>
                      <button type="button" className="font-bold px-1.5 py-0.5 hover:bg-gray-200 rounded">B</button>
                      <button type="button" className="italic px-1.5 py-0.5 hover:bg-gray-200 rounded">I</button>
                      <button type="button" className="underline px-1.5 py-0.5 hover:bg-gray-200 rounded">U</button>
                      <button type="button" className="line-through px-1.5 py-0.5 hover:bg-gray-200 rounded">S</button>
                      <div className="h-4 w-px bg-gray-300 mx-1"></div>

                      {/* Alignment */}
                      <button type="button" className="px-1.5 py-0.5 hover:bg-gray-200 rounded">≡</button>
                      <button type="button" className="px-1.5 py-0.5 hover:bg-gray-200 rounded">• List</button>
                      <button type="button" className="px-1.5 py-0.5 hover:bg-gray-200 rounded">1. List</button>
                      <div className="h-4 w-px bg-gray-300 mx-1"></div>

                      {/* Link & Media */}
                      <button type="button" className="px-1.5 py-0.5 hover:bg-gray-200 rounded">🔗</button>
                      <button type="button" className="px-1.5 py-0.5 hover:bg-gray-200 rounded">📷</button>
                      <button type="button" className="px-1.5 py-0.5 hover:bg-gray-200 rounded">❝</button>
                    </div>

                    <textarea
                      rows={8}
                      placeholder="Type Your Reply..."
                      value={body}
                      onChange={e => setBody(e.target.value)}
                      className="w-full p-4 border-none outline-none text-sm text-gray-800 placeholder-gray-400 resize-none font-sans leading-relaxed"
                    />
                  </div>
                </div>

                {/* Footer Controls */}
                <div className="mt-5 flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="text-xs text-gray-400">
                    {emails.length} recipient{emails.length !== 1 ? 's' : ''} targeted
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      disabled={loading}
                      onClick={() => handleSubmit(false)}
                      className="px-5 py-2 bg-[#00AC4F] hover:bg-[#009645] text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-60 flex items-center gap-2"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                      {scheduledTime ? 'Schedule Campaign' : 'Send Campaign'}
                    </button>
                  </div>
                </div>

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
