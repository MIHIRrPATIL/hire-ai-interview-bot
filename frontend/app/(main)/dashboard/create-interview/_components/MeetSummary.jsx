import { useState } from 'react';
import { Copy, Mail, Share2, MessageCircle } from 'lucide-react';

export default function MeetSummary({ interviewTitle, interviewTypes, interviewDuration, interviewId }) {
  // Construct the dynamic meeting link
  const host = process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000';
  const meetLink = `${host}/interview/${interviewId}`;

  const summary = `An ${interviewTypes.join(' & ')} interview for the "${interviewTitle}" position has been scheduled. The duration will be ${interviewDuration} minutes. Further details will be sent to the candidate.`;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(meetLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setCopied(false);
    }
  };

  const handleShare = (type) => {
    if (type === 'email') {
      window.open(`mailto:?subject=Interview for ${interviewTitle}&body=Here is the meet link: ${meetLink}`);
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=Join the interview for ${interviewTitle}: ${encodeURIComponent(meetLink)}`);
    } else if (navigator.share) {
      navigator.share({ title: `Interview for ${interviewTitle}`, url: meetLink });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Interview Created Successfully!</h1>
        <p className="text-gray-600">Share the meeting link with your candidate or panel.</p>
      </div>
      <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
        <span className="truncate text-blue-700 font-medium flex-1">{meetLink}</span>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg hover:bg-blue-100 transition-colors"
          title="Copy link"
        >
          <Copy className="w-5 h-5 text-blue-600" />
        </button>
        {copied && <span className="text-green-600 text-xs ml-2">Copied!</span>}
      </div>
      <div className="flex gap-3 justify-center">
        <button
          onClick={() => handleShare('email')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Mail className="w-4 h-4" /> Email
        </button>
        <button
          onClick={() => handleShare('whatsapp')}
          className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp
        </button>
        <button
          onClick={() => handleShare('native')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          <Share2 className="w-4 h-4" /> Share
        </button>
      </div>
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Interview Summary</h2>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-700 whitespace-pre-line">
          {summary}
        </div>
      </div>
    </div>
  );
} 