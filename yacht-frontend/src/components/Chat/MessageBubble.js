import React from 'react';
import { DollarSign, TrendingUp, Target, Users, BarChart3, Zap, Brain, Building } from 'lucide-react';

// Category icons mapping for new API specification
const categoryIcons = {
  sales: DollarSign,
  marketing: TrendingUp,
  operations: BarChart3,
  finance: DollarSign,
  mindset: Brain,
  strategy: Target,
  general: Zap
};

// Enhanced message formatting utilities
const formatMessage = (text) => {
  if (!text) return '';
  
  // Handle code blocks first (before other formatting)
  text = text.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  text = text.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Handle bold text **text**
  text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Handle italic text *text*
  text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  
  // Handle numbered lists (1. 2. 3.)
  text = text.replace(/^[\s]*(\d+)\.\s+(.+)$/gm, '<li data-number="$1">$2</li>');
  text = text.replace(/(<li data-number="[^"]+">.*<\/li>)/s, '<ol>$1</ol>');
  
  // Handle bullet points (- or •)
  text = text.replace(/^[\s]*[-•]\s+(.+)$/gm, '<li>$1</li>');
  text = text.replace(/(<li>(?:(?!<li>)[\s\S])*<\/li>)/g, '<ul>$1</ul>');
  
  // Handle links [text](url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
  
  // Handle line breaks (double newline to paragraph)
  text = text.replace(/\n\n/g, '</p><p>');
  text = `<p>${text}</p>`;
  
  // Clean up empty paragraphs
  text = text.replace(/<p><\/p>/g, '');
  
  return text;
};

const MessageBubble = React.memo(({ 
  message, 
  isUser, 
  category, 
  confidence, 
  responseTime, 
  stage,
  fadeIn = false,
  timestamp
}) => {
  const CategoryIcon = categoryIcons[category] || Zap;
  const isMobile = window.innerWidth < 640;
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
      role="log"
      aria-live="polite"
      data-testid={isUser ? 'user-message' : 'ai-message'}
    >
      <div className={`${isUser ? 'order-2' : 'order-1'}`}>
        {!isUser && category && (
          <div className="flex items-center gap-2 mb-2">
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
              <CategoryIcon size={12} />
              <span className="capitalize">{category}</span>
            </div>
            {confidence && (
              <div className="text-xs text-gray-500">
                {Math.round(confidence * 100)}% confident
              </div>
            )}
            {responseTime && (
              <div className="text-xs text-gray-500">
                {responseTime}ms
              </div>
            )}
            {stage && (
              <div className="text-xs text-gray-500 capitalize">
                Stage: {stage}
              </div>
            )}
          </div>
        )}
        <div 
          className={`${
            isUser 
              ? 'message-user ml-4' 
              : `message-ai mr-4 ${category ? `category-${category}` : ''}`
          }`}
          style={{ 
            fontSize: isMobile ? '14px' : '15px',
            lineHeight: '1.6'
          }}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-words">{message}</p>
          ) : (
            <div 
              dangerouslySetInnerHTML={{ __html: formatMessage(message) }}
              className="prose prose-sm max-w-none [&>p]:mb-4 [&>p:last-child]:mb-0 [&>ul]:mb-4 [&>ul]:pl-4 [&>li]:mb-1 [&>pre]:bg-gray-800 [&>pre]:text-white [&>pre]:p-3 [&>pre]:rounded [&>pre]:overflow-x-auto [&>code]:bg-gray-200 [&>code]:px-1 [&>code]:rounded [&>code]:text-sm [&>strong]:font-semibold"
            />
          )}
        </div>
        {timestamp && (
          <div className={`text-xs text-gray-400 mt-1 ${isUser ? 'text-right mr-4' : 'ml-4'}`}>
            {new Date(timestamp).toLocaleTimeString([], { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        )}
      </div>
    </div>
  );
});

export default MessageBubble;