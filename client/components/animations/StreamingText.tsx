import React, { useState, useEffect, useRef } from 'react';
import { siteDesignSystem } from '../../design-system';
import { useTheme } from '../../contexts/ThemeContext';

interface StreamingTextProps {
  text: string;
  speed?: number; // Words per second
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
  autoStart?: boolean;
}

export default function StreamingText({
  text,
  speed = 8, // 8 words per second default
  onComplete,
  className = '',
  showCursor = true,
  autoStart = true
}: StreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const words = text.split(' ');
  const delayBetweenWords = 1000 / speed; // Convert words per second to ms delay

  const startStreaming = () => {
    if (isComplete || isStreaming) return;
    
    setIsStreaming(true);
    setCurrentWordIndex(0);
    setDisplayedText('');
    
    intervalRef.current = setInterval(() => {
      setCurrentWordIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        
        if (newIndex >= words.length) {
          setIsStreaming(false);
          setIsComplete(true);
          onComplete?.();
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          return prevIndex;
        }
        
        return newIndex;
      });
    }, delayBetweenWords);
  };

  const reset = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStreaming(false);
    setIsComplete(false);
    setCurrentWordIndex(0);
    setDisplayedText('');
  };

  const skipToEnd = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setCurrentWordIndex(words.length);
    setDisplayedText(text);
    setIsStreaming(false);
    setIsComplete(true);
    onComplete?.();
  };

  // Update displayed text when word index changes
  useEffect(() => {
    if (currentWordIndex > 0) {
      setDisplayedText(words.slice(0, currentWordIndex).join(' '));
    }
  }, [currentWordIndex, words]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && text && !isComplete) {
      // Small delay to ensure component is mounted
      const timer = setTimeout(startStreaming, 100);
      return () => clearTimeout(timer);
    }
  }, [text, autoStart, isComplete]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className={`streaming-text ${className}`}>
      <span 
        className="streaming-content"
        style={{ 
          fontFamily: siteDesignSystem.typography.fontFamily.primary,
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6
        }}
      >
        {displayedText}
        {isStreaming && showCursor && (
          <span 
            className="streaming-cursor"
            style={{
              color: siteDesignSystem.colors[useTheme().theme].text.primary,
              animation: 'blink 1s infinite',
              marginLeft: '2px'
            }}
          >
            |
          </span>
        )}
      </span>
      
      {/* Control buttons (hidden by default, can be enabled via props) */}
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .streaming-text {
          position: relative;
        }
        
        .streaming-content {
          display: inline-block;
          min-height: 1.2em; // Prevents layout shift
        }
        
        .streaming-cursor {
          font-weight: normal;
          user-select: none;
        }
      `}</style>
    </div>
  );
}

// Enhanced version with markdown support and syntax highlighting
interface AdvancedStreamingTextProps extends StreamingTextProps {
  markdown?: boolean;
  codeHighlighting?: boolean;
  onWordComplete?: (word: string, index: number) => void;
}

export function AdvancedStreamingText({
  text,
  speed = 8,
  onComplete,
  onWordComplete,
  className = '',
  showCursor = true,
  autoStart = true,
  markdown = false,
  codeHighlighting = false
}: AdvancedStreamingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Enhanced word splitting that preserves markdown and code blocks
  const parseWords = (text: string) => {
    if (!markdown) {
      return text.split(' ');
    }
    
    // More sophisticated parsing for markdown
    const words: string[] = [];
    let currentWord = '';
    let inCodeBlock = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '`' && nextChar === '`' && text[i + 2] === '`') {
        inCodeBlock = !inCodeBlock;
        currentWord += char + nextChar + text[i + 2];
        i += 2;
      } else if (char === ' ' && !inCodeBlock) {
        if (currentWord.trim()) {
          words.push(currentWord);
          currentWord = '';
        }
      } else {
        currentWord += char;
      }
    }
    
    if (currentWord.trim()) {
      words.push(currentWord);
    }
    
    return words;
  };

  const words = parseWords(text);
  const delayBetweenWords = 1000 / speed;

  const startStreaming = () => {
    if (isComplete || isStreaming) return;
    
    setIsStreaming(true);
    setCurrentWordIndex(0);
    setDisplayedText('');
    
    intervalRef.current = setInterval(() => {
      setCurrentWordIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        
        if (newIndex >= words.length) {
          setIsStreaming(false);
          setIsComplete(true);
          onComplete?.();
          
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          
          return prevIndex;
        }
        
        // Callback for each word completion
        onWordComplete?.(words[newIndex - 1], newIndex - 1);
        
        return newIndex;
      });
    }, delayBetweenWords);
  };

  // Update displayed text when word index changes
  useEffect(() => {
    if (currentWordIndex > 0) {
      setDisplayedText(words.slice(0, currentWordIndex).join(' '));
    }
  }, [currentWordIndex]);

  // Auto-start effect
  useEffect(() => {
    if (autoStart && text && !isComplete) {
      const timer = setTimeout(startStreaming, 100);
      return () => clearTimeout(timer);
    }
  }, [text, autoStart, isComplete]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const renderContent = () => {
    if (markdown) {
      // Basic markdown rendering (could be enhanced with a full markdown parser)
      let content = displayedText
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/`(.*?)`/g, '<code>$1</code>');
      
      return (
        <span 
          dangerouslySetInnerHTML={{ __html: content }}
          style={{ 
            fontFamily: siteDesignSystem.typography.fontFamily.primary,
            whiteSpace: 'pre-wrap',
            lineHeight: 1.6
          }}
        />
      );
    }
    
    return (
      <span 
        style={{ 
          fontFamily: siteDesignSystem.typography.fontFamily.primary,
          whiteSpace: 'pre-wrap',
          lineHeight: 1.6
        }}
      >
        {displayedText}
      </span>
    );
  };

  return (
    <div className={`advanced-streaming-text ${className}`}>
      {renderContent()}
      {isStreaming && showCursor && (
        <span 
          className="streaming-cursor"
          style={{
            color: siteDesignSystem.colors[useTheme().theme].text.primary,
            animation: 'blink 1s infinite',
            marginLeft: '2px'
          }}
        >
          |
        </span>
      )}
      
      <style jsx>{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .advanced-streaming-text code {
          background: #f1f3f4;
          padding: 2px 6px;
          border-radius: 4px;
          font-family: ${siteDesignSystem.typography.fontFamily.mono};
          font-size: 0.9em;
        }
        
        .advanced-streaming-text strong {
          font-weight: 600;
        }
        
        .advanced-streaming-text em {
          font-style: italic;
        }
      `}</style>
    </div>
  );
}