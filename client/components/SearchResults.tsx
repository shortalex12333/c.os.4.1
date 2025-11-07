import React, { useState, useEffect } from 'react';
import CascadeCard, { CardType } from './CascadeCard';
import { useTheme } from '../contexts/ThemeContext';

interface SearchResult {
  id: string;
  type: CardType;
  data: any; // This matches CascadeCard data structure
}

interface SearchResultsProps {
  query: string;
  searchType: 'email' | 'nas';
  results: SearchResult[];
}

export default function SearchResults({ query, searchType, results }: SearchResultsProps) {
  const { theme } = useTheme();
  const [displayedResults, setDisplayedResults] = useState<SearchResult[]>([]);
  const [removedCards, setRemovedCards] = useState<Set<string>>(new Set());
  
  // Lazy load effect - show results with slight delay for better UX
  useEffect(() => {
    if (results.length > 0) {
      // Clear previous results first
      setDisplayedResults([]);
      setRemovedCards(new Set());
      
      // Lazy load each card with staggered animation
      results.slice(0, 3).forEach((result, index) => {
        setTimeout(() => {
          setDisplayedResults(prev => [...prev, result]);
        }, 150 * (index + 1)); // 150ms delay between each card
      });
    }
  }, [results]);
  
  const handleCardClose = (cardId: string) => {
    setRemovedCards(prev => new Set(prev).add(cardId));
    
    // Optionally remove from displayed results after animation
    setTimeout(() => {
      setDisplayedResults(prev => prev.filter(r => r.id !== cardId));
    }, 300);
  };
  
  return (
    <div className="search-results-container">
      {/* Search Context Header */}
      <div className="mb-6">
        <h2 className={`text-2xl font-medium ${
          theme === 'light' ? 'text-gray-800' : 'text-gray-200'
        }`}>
          {searchType === 'nas' ? (
            <>Hmmm, here's what I found for "<span className="font-semibold">{query}</span>"</>
          ) : (
            <>Email search results for "<span className="font-semibold">{query}</span>"</>
          )}
        </h2>
      </div>
      
      {/* Results Container with spacing */}
      <div className="space-y-4">
        {displayedResults
          .filter(result => !removedCards.has(result.id))
          .map((result, index) => (
            <div
              key={result.id}
              className={`
                transform transition-all duration-300 ease-out
                ${removedCards.has(result.id) ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}
              `}
              style={{
                animation: 'slideIn 0.3s ease-out forwards',
                animationDelay: `${index * 0.15}s`,
                opacity: 0
              }}
            >
              <CascadeCard
                type={result.type}
                data={result.data}
                onClose={() => handleCardClose(result.id)}
              />
            </div>
          ))}
      </div>
      
      {/* Loading indicator for lazy loading */}
      {results.length > displayedResults.length && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        </div>
      )}
      
      {/* No results message */}
      {results.length === 0 && (
        <div className={`text-center py-12 ${
          theme === 'light' ? 'text-gray-500' : 'text-gray-400'
        }`}>
          <p className="text-lg">No results found. Try a different search term.</p>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}