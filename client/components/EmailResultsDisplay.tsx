import React from 'react';
import EmailThreadCard from './EmailThreadCard';

interface EmailResult {
  id: string;
  subject: string;
  from: {
    name: string;
    address: string;
  };
  receivedDateTime: string;
  bodyPreview: string;
  attachments?: string[];
  hasAttachments: boolean;
  importance: string;
  conversationId: string;
}

interface EmailResultsDisplayProps {
  results: EmailResult[];
  onEmailInteraction?: (emailId: string, action: 'helpful' | 'not-helpful' | 'feedback') => void;
  onEmailClose?: (emailId: string) => void;
  onEmailMinimize?: (emailId: string) => void;
}

export default function EmailResultsDisplay({ 
  results, 
  onEmailInteraction, 
  onEmailClose, 
  onEmailMinimize 
}: EmailResultsDisplayProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateString;
    }
  };

  const extractSummaryFromBody = (bodyPreview: string): string[] => {
    // Try to extract bullet points or numbered lists
    const lines = bodyPreview.split(/[.\n]/).filter(line => line.trim().length > 0);
    return lines.slice(0, 3).map(line => line.trim());
  };

  if (!results || results.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 text-lg">No email results found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {results.map((email) => (
        <EmailThreadCard
          key={email.id}
          title={email.subject}
          subtitle={email.bodyPreview}
          summary={extractSummaryFromBody(email.bodyPreview)}
          senderName={email.from.name}
          senderEmail={email.from.address}
          date={formatDate(email.receivedDateTime)}
          subject={email.subject}
          attachments={email.attachments || []}
          onHelpful={() => onEmailInteraction?.(email.id, 'helpful')}
          onNotHelpful={() => onEmailInteraction?.(email.id, 'not-helpful')}
          onLeaveFeedback={() => onEmailInteraction?.(email.id, 'feedback')}
          onClose={() => onEmailClose?.(email.id)}
          onMinimize={() => onEmailMinimize?.(email.id)}
        />
      ))}
    </div>
  );
}