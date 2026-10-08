import { format } from "date-fns";

export function EmailTable({ jobs, loading, type }: { jobs: any[], loading: boolean, type: 'SCHEDULED' | 'SENT' }) {
  if (loading) {
    return <div className="p-12 flex justify-center text-gray-500">Loading jobs...</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="p-16 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
        </div>
        <h3 className="text-lg font-medium text-gray-300">No emails found</h3>
        <p className="text-gray-500 mt-1">You haven't {type === 'SCHEDULED' ? 'scheduled' : 'sent'} any emails yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-auto w-full">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-gray-800 text-gray-400">
          <tr>
            <th className="px-6 py-4 font-medium">To</th>
            <th className="px-6 py-4 font-medium">Subject</th>
            <th className="px-6 py-4 font-medium">{type === 'SCHEDULED' ? 'Scheduled For' : 'Sent At'}</th>
            <th className="px-6 py-4 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          {jobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-800/50 transition-colors">
              <td className="px-6 py-4 text-gray-300">{job.toEmail}</td>
              <td className="px-6 py-4 max-w-[300px] truncate">{job.subject}</td>
              <td className="px-6 py-4 text-gray-400">
                {type === 'SCHEDULED' ? format(new Date(job.scheduledTime), 'MMM d, yyyy HH:mm') : (job.sentAt ? format(new Date(job.sentAt), 'MMM d, yyyy HH:mm') : 'N/A')}
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  job.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20' :
                  job.status === 'SENT' ? 'bg-green-500/10 text-green-500 border border-green-500/20' :
                  'bg-red-500/10 text-red-500 border border-red-500/20'
                }`}>
                  {job.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
