import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, Copy } from 'lucide-react';

interface RAGSolution {
  id: string;
  title: string;
  confidence: 'low' | 'medium' | 'high';
  source: {
    title: string;
    page?: number;
  };
  content: string;
}

interface RAGSolutionCardProps {
  solutions: RAGSolution[];
}

export function RAGSolutionCard({ solutions }: RAGSolutionCardProps) {
  const [expandedSolutions, setExpandedSolutions] = useState<Set<string>>(new Set([solutions[0]?.id]));

  const toggleSolution = (solutionId: string) => {
    const newExpanded = new Set(expandedSolutions);
    if (newExpanded.has(solutionId)) {
      newExpanded.delete(solutionId);
    } else {
      newExpanded.add(solutionId);
    }
    setExpandedSolutions(newExpanded);
  };

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {solutions.map((solution, index) => {
        const isExpanded = expandedSolutions.has(solution.id);
        
        return (
          <div
            key={solution.id}
            className={`
              ${index > 0 ? 'border-t border-gray-100' : ''}
              ${isExpanded ? 'bg-blue-50/30' : 'hover:bg-gray-50'}
              transition-colors duration-200
            `}
          >
            {/* Header */}
            <button
              onClick={() => toggleSolution(solution.id)}
              className="w-full p-4 text-left flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 
                    className="text-gray-900 font-medium"
                    style={{
                      fontSize: '16px',
                      lineHeight: '24px',
                      fontFamily: 'Eloquia Display, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    {solution.title}
                  </h3>
                  
                  <span 
                    className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${solution.confidence === 'high' 
                        ? 'bg-green-100 text-green-800' 
                        : solution.confidence === 'medium'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-600'
                      }
                    `}
                    style={{
                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    {solution.confidence} confidence
                  </span>
                </div>
                
                <div 
                  className="text-sm text-gray-600 flex items-center gap-1"
                  style={{
                    fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                  }}
                >
                  <ExternalLink className="w-3 h-3" />
                  {solution.source.title}
                  {solution.source.page && ` (p. ${solution.source.page})`}
                </div>
              </div>
              
              <div className="ml-4">
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </button>
            
            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4">
                <div className="border-t border-gray-100 pt-4">
                  <div 
                    className="text-gray-800 mb-4"
                    style={{
                      fontSize: '15px',
                      lineHeight: '24px',
                      fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                    }}
                  >
                    {solution.content}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <button
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                      style={{
                        fontFamily: 'Eloquia Text, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
                      }}
                    >
                      <ExternalLink className="w-4 h-4" />
                      View source
                    </button>
                    
                    <button
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}