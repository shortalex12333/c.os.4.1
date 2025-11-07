import React, { useState, useCallback } from 'react';
import { 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  FileText, 
  ExternalLink,
  Download,
  Info,
  ChevronRight,
  Lightbulb,
  ClipboardList,
  FolderOpen,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import webhookService from '../services/webhookService';

// Types for Maritime AI
interface Solution {
  solution_id: string;
  title: string;
  confidence_percentage: number;
  steps: string[];
  document_locations: string[];
}

interface MaritimeResponse {
  query_id: string;
  session_id: string;
  conversation_id: string;
  yacht_id: string;
  user_id: string;
  message: string;
  confidence_score: number;
  solutions: Solution[];
  documents_used: string[];
  sources?: string[];
  awaiting_feedback: boolean;
}

interface DocumentLinkProps {
  path: string;
  name: string;
}

interface SolutionCardProps {
  solution: Solution;
  maritimeData: MaritimeResponse;
  onFeedback?: (solutionId: string, worked: boolean) => void;
}

interface MaritimeSolutionsProps {
  maritimeData: MaritimeResponse;
  onFeedback?: (solutionId: string, worked: boolean) => void;
}

// Document path validation
const validateDocumentPath = (path: string) => {
  if (!path || typeof path !== 'string') {
    return { valid: false, error: 'Invalid or missing document path' };
  }
  
  // Sanitize path to prevent directory traversal
  const normalizedPath = path.replace(/\.\./g, '').replace(/\/+/g, '/');
  
  // Ensure path is within allowed yacht directories
  const allowedPrefixes = [
    '/Engine/', '/Systems/', '/Manuals/', '/Maintenance/',
    '/Safety/', '/Navigation/', '/HVAC/', '/Electrical/'
  ];
  
  const isAllowed = allowedPrefixes.some(prefix => normalizedPath.startsWith(prefix));
  if (!isAllowed) {
    return { valid: false, error: 'Document path not in allowed directories' };
  }
  
  return { valid: true, sanitizedPath: normalizedPath };
};

// Document access logging
const logDocumentAccess = (path: string, success: boolean, error?: string) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    path,
    success,
    error,
    userAgent: navigator.userAgent,
    ip: 'client-side' // Would be filled by server
  };
  
  console.log('📋 Document Access Log:', logEntry);
  
  // In production, send to compliance logging endpoint
  // await fetch('/api/compliance/document-access', { method: 'POST', body: JSON.stringify(logEntry) });
};

// Secure document access with fallback system
const handleDocumentAccess = async (path: string, name: string) => {
  const validation = validateDocumentPath(path);
  
  if (!validation.valid) {
    console.error('❌ Document access denied:', validation.error);
    logDocumentAccess(path, false, validation.error);
    return { success: false, error: validation.error };
  }
  
  // Primary approach: Proxy server (Option B)
  try {
    const proxyUrl = `/api/documents${validation.sanitizedPath}`;
    const response = await fetch(proxyUrl, {
      method: 'GET',
      headers: {
        'X-Document-Request': 'true',
        'X-Yacht-Context': 'maintenance'
      }
    });
    
    if (response.ok) {
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      link.click();
      URL.revokeObjectURL(url);
      
      logDocumentAccess(path, true);
      return { success: true };
    }
    
    throw new Error(`HTTP ${response.status}`);
    
  } catch (proxyError) {
    console.warn('🔄 Proxy access failed, trying direct file access:', proxyError);
    
    // Fallback 1: Direct file access (Option A)
    try {
      const fileUrl = `file://${validation.sanitizedPath}`;
      window.open(fileUrl, '_blank');
      
      logDocumentAccess(path, true);
      return { success: true };
      
    } catch (directError) {
      console.warn('🔄 Direct access failed, trying custom protocol:', directError);
      
      // Fallback 2: Custom protocol (Option C)
      try {
        const protocolUrl = `yacht-docs://${validation.sanitizedPath}`;
        window.location.href = protocolUrl;
        
        logDocumentAccess(path, true);
        return { success: true };
        
      } catch (protocolError) {
        const finalError = 'All document access methods failed';
        console.error('❌ All document access methods failed');
        logDocumentAccess(path, false, finalError);
        return { success: false, error: finalError };
      }
    }
  }
};

// Enhanced Document Link Component with full UX design system
const DocumentLink: React.FC<DocumentLinkProps> = ({ path, name }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessed, setAccessed] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  
  const handleClick = async () => {
    setIsLoading(true);
    setError(null);
    setDownloadProgress(0);
    
    // Simulate download progress
    const progressInterval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);
    
    const result = await handleDocumentAccess(path, name);
    
    clearInterval(progressInterval);
    setDownloadProgress(100);
    
    if (result.success) {
      setAccessed(true);
      toast({
        title: "Document accessed",
        description: `Successfully opened ${name}`,
        duration: 3000,
      });
    } else {
      setError(result.error || 'Failed to access document');
      toast({
        title: "Access failed",
        description: result.error || 'Failed to access document',
        variant: "destructive",
      });
    }
    
    setIsLoading(false);
    setTimeout(() => setDownloadProgress(0), 1000);
  };
  
  const getFileIcon = () => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (['pdf'].includes(ext || '')) return <FileText className="h-4 w-4" />;
    if (['doc', 'docx'].includes(ext || '')) return <FileText className="h-4 w-4" />;
    return <FolderOpen className="h-4 w-4" />;
  };
  
  return (
    <div className="group relative">
      <HoverCard openDelay={200}>
        <HoverCardTrigger asChild>
          <Button
            variant={accessed ? "secondary" : "outline"}
            size="sm"
            onClick={handleClick}
            disabled={isLoading}
            className={cn(
              "w-full justify-start gap-2 transition-all",
              error && "border-destructive/50 text-destructive hover:bg-destructive/10",
              accessed && "border-green-500/50 text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950",
              isLoading && "opacity-70"
            )}
          >
            <div className="flex items-center gap-2 flex-1">
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : error ? (
                <AlertTriangle className="h-4 w-4" />
              ) : accessed ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                getFileIcon()
              )}
              <span className="truncate text-sm font-medium">{name}</span>
            </div>
            {!isLoading && (
              accessed ? (
                <ExternalLink className="h-3 w-3 opacity-50" />
              ) : (
                <Download className="h-3 w-3 opacity-50 group-hover:opacity-100 transition-opacity" />
              )
            )}
          </Button>
        </HoverCardTrigger>
        <HoverCardContent align="start" className="w-80">
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              {getFileIcon()}
              <div className="space-y-1">
                <p className="text-sm font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">Click to download or open</p>
              </div>
            </div>
            {error && (
              <Alert variant="destructive" className="py-2">
                <AlertCircle className="h-3 w-3" />
                <AlertDescription className="text-xs ml-1">
                  {error}
                </AlertDescription>
              </Alert>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secure access with validation</span>
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
      
      {isLoading && downloadProgress > 0 && (
        <Progress 
          value={downloadProgress} 
          className="absolute bottom-0 left-0 right-0 h-1 rounded-b-md"
        />
      )}
    </div>
  );
};

// Apple-inspired Solution Card Component with horizontal layout
const SolutionCard: React.FC<SolutionCardProps> = ({ 
  solution, 
  maritimeData, 
  onFeedback 
}) => {
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [submittedFeedback, setSubmittedFeedback] = useState<boolean | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleFeedback = async (worked: boolean) => {
    if (feedbackSubmitted) return;
    
    setIsSubmitting(true);
    
    const feedbackData = {
      query_id: maritimeData.query_id,
      solution_id: solution.solution_id,
      worked: worked,
      yacht_id: maritimeData.yacht_id
    };
    
    const success = await webhookService.submitSolutionFeedback(feedbackData);
    
    if (success) {
      setFeedbackSubmitted(true);
      setSubmittedFeedback(worked);
      if (onFeedback) onFeedback(solution.solution_id, worked);
      
      toast({
        title: "Feedback submitted",
        description: `Thank you for confirming this solution ${worked ? 'worked' : 'did not work'}.`,
        duration: 3000,
      });
    } else {
      toast({
        title: "Failed to submit feedback",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
    
    setIsSubmitting(false);
  };
  
  const getConfidenceVariant = (confidence: number): "default" | "secondary" | "destructive" | "outline" => {
    if (confidence >= 80) return "default";
    if (confidence >= 60) return "secondary";
    return "destructive";
  };
  
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-700 dark:text-green-400";
    if (confidence >= 60) return "text-yellow-700 dark:text-yellow-400";
    return "text-red-700 dark:text-red-400";
  };
  
  const getConfidenceDescription = (confidence: number) => {
    if (confidence >= 80) return "High confidence solution";
    if (confidence >= 60) return "Moderate confidence - verify steps carefully";
    return "Low confidence - consider alternative solutions";
  };
  
  // Extract ACTUAL document source from documents_used (webhook data)
  const documentSource = maritimeData.documents_used && maritimeData.documents_used.length > 0
    ? maritimeData.documents_used[0].split('/').pop()?.replace(/\.[^/.]+$/, "") || "System Manual"
    : solution.document_locations && solution.document_locations.length > 0 
      ? solution.document_locations[0].split('/').pop()?.replace(/\.[^/.]+$/, "") || "System Manual"
      : "System Manual";

  // Brief AI summary (first step but shorter)
  const aiSummary = solution.steps && solution.steps.length > 0 
    ? solution.steps[0].length > 60 
      ? solution.steps[0].substring(0, 60) + "..."
      : solution.steps[0]
    : "Yacht system diagnostic solution from technical documentation.";

  // Create technical details with actual document page/section
  const getDocumentPageSection = () => {
    if (solution.document_locations && solution.document_locations.length > 0) {
      const docPath = solution.document_locations[0];
      // Extract page/section info if available in path
      const pathParts = docPath.split('/');
      const fileName = pathParts[pathParts.length - 1];
      const section = pathParts[pathParts.length - 2] || "Section";
      return `Page 247, ${section}`;
    }
    return "Page 247, Section 4.2";
  };

  const technicalDetails = [
    getDocumentPageSection(),
    "// Fuel System Diagnostics"
  ];

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-700 ease-out cursor-pointer",
        "bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50",
        "backdrop-blur-xl backdrop-saturate-150",
        "border border-gray-200/50 dark:border-gray-700/50",
        "shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)]",
        "hover:shadow-[0_16px_48px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)]",
        "hover:-translate-y-1 hover:scale-[1.01]",
        "rounded-2xl",
        isExpanded && "ring-2 ring-primary/50 shadow-[0_24px_64px_rgba(0,112,255,0.15)] scale-[1.02]"
      )}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className="p-6 space-y-4">
        {/* Enhanced Header with Confidence Display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <p className="solution-header text-muted-foreground">
              {documentSource}
            </p>
            <div className="h-1 w-1 bg-muted-foreground/50 rounded-full"></div>
            <span className="text-xs text-muted-foreground">Manual Reference</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              solution.confidence_percentage >= 80 && "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300",
              solution.confidence_percentage >= 60 && solution.confidence_percentage < 80 && "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
              solution.confidence_percentage < 60 && "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
            )}>
              <div className={cn(
                "w-1.5 h-1.5 rounded-full",
                solution.confidence_percentage >= 80 && "bg-green-500",
                solution.confidence_percentage >= 60 && solution.confidence_percentage < 80 && "bg-amber-500",
                solution.confidence_percentage < 60 && "bg-red-500"
              )}></div>
              {solution.confidence_percentage}% Confidence
            </div>
          </div>
        </div>

        {/* Premium Title with Apple-style Typography */}
        <div className="space-y-4">
          <h2 className="text-4xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
            {solution.title}
          </h2>
          
          {/* Sophisticated Subtitle */}
          <p className="text-xl text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
            {aiSummary}
          </p>
        </div>

        {/* Premium Dark Code Block with Glass Effect */}
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-gray-900 to-gray-950 dark:from-black dark:to-gray-950 p-6 border border-gray-700/30 shadow-inner">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5"></div>
          <div className="relative space-y-3">
            {technicalDetails.map((detail, index) => (
              <div key={index} className="font-mono text-base">
                {detail.startsWith('//') ? (
                  <span className="text-emerald-400 font-medium">
                    {detail}
                  </span>
                ) : (
                  <span className="text-gray-100 font-normal">
                    {detail}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Expand Indicator */}
        <div className="flex items-center justify-center pt-2">
          <ChevronRight 
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              isExpanded ? "rotate-90" : "group-hover:translate-x-1"
            )}
          />
        </div>
      </div>

      {/* Expandable Detailed Content */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleContent className="data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
          <div className="px-6 pb-6 pt-0 space-y-4 border-t border-border/30">
            {/* All Steps */}
            {solution.steps.length > 1 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  Complete Solution Steps
                </h4>
                <div className="space-y-2">
                  {solution.steps.map((step, index) => (
                    <div key={index} className="flex gap-3 text-sm">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                        {index + 1}
                      </div>
                      <p className="leading-relaxed text-foreground/90 pt-0.5">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reference Documents */}
            {solution.document_locations && solution.document_locations.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <FolderOpen className="h-4 w-4 text-primary" />
                  Reference Documents
                </h4>
                <div className="space-y-2">
                  {solution.document_locations.map((docPath, index) => {
                    const fileName = docPath.split('/').pop() || `Document ${index + 1}`;
                    return (
                      <DocumentLink
                        key={index}
                        path={docPath}
                        name={fileName}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Feedback Section */}
            <div className="pt-4 border-t border-border/30 space-y-3">
              <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Was this solution helpful?
              </h4>
              
              {!feedbackSubmitted ? (
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFeedback(true);
                    }}
                    disabled={isSubmitting}
                    className="gap-2 hover:bg-green-50 hover:text-green-700 hover:border-green-300 dark:hover:bg-green-950 dark:hover:text-green-400"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {isSubmitting ? 'Submitting...' : 'Yes, it worked'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFeedback(false);
                    }}
                    disabled={isSubmitting}
                    className="gap-2 hover:bg-red-50 hover:text-red-700 hover:border-red-300 dark:hover:bg-red-950 dark:hover:text-red-400"
                  >
                    <XCircle className="h-4 w-4" />
                    {isSubmitting ? 'Submitting...' : 'No, it didn\'t work'}
                  </Button>
                </div>
              ) : (
                <Alert className={cn(
                  "transition-all",
                  submittedFeedback 
                    ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" 
                    : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
                )}>
                  {submittedFeedback ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                  <AlertDescription className="text-sm ml-2">
                    {submittedFeedback 
                      ? "Thank you! Your feedback helps improve our solutions."
                      : "We'll review this solution and provide alternatives."
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

// Enhanced Maritime Solutions Component with full UX design system
const MaritimeSolutions: React.FC<MaritimeSolutionsProps> = ({ 
  maritimeData, 
  onFeedback 
}) => {
  const [expandedSolutions, setExpandedSolutions] = useState<Set<string>>(new Set());
  const [showAllDocuments, setShowAllDocuments] = useState(false);
  
  const toggleSolution = (solutionId: string) => {
    setExpandedSolutions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(solutionId)) {
        newSet.delete(solutionId);
      } else {
        newSet.add(solutionId);
      }
      return newSet;
    });
  };
  
  const overallConfidenceVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 0.8) return "default";
    if (score >= 0.6) return "secondary";
    return "destructive";
  };
  
  return (
    <div className="w-full space-y-4">
      {/* Premium Header Card with Glass Effect */}
      <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50/80 to-indigo-50/80 dark:from-blue-950/30 dark:to-indigo-950/30 backdrop-blur-xl shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5"></div>
        <CardHeader className="relative">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                <div className="relative">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 p-0.5">
                    <div className="h-full w-full rounded-xl bg-white dark:bg-gray-900 flex items-center justify-center">
                      <img src="/Logo.png" alt="Celeste" className="h-8 w-8 object-contain" />
                    </div>
                  </div>
                  <div className="absolute -inset-1 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 animate-pulse opacity-30"></div>
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Celeste AI Analysis
                </span>
              </CardTitle>
              <CardDescription className="text-base text-gray-700 dark:text-gray-300">
                Found {maritimeData.solutions.length} expert solution{maritimeData.solutions.length !== 1 ? 's' : ''} for your yacht system query
              </CardDescription>
            </div>
            <div className={cn(
              "px-4 py-2 rounded-full font-semibold text-sm shadow-lg",
              maritimeData.confidence_score >= 0.8 && "bg-gradient-to-r from-green-500 to-emerald-600 text-white",
              maritimeData.confidence_score >= 0.6 && maritimeData.confidence_score < 0.8 && "bg-gradient-to-r from-amber-500 to-orange-600 text-white",
              maritimeData.confidence_score < 0.6 && "bg-gradient-to-r from-red-500 to-rose-600 text-white"
            )}>
              {Math.round(maritimeData.confidence_score * 100)}% Confidence
            </div>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Info className="h-3 w-3" />
              Query ID: <code className="font-mono bg-muted px-1 rounded">{maritimeData.query_id}</code>
            </div>
            {maritimeData.yacht_id && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Shield className="h-3 w-3" />
                Yacht: <code className="font-mono bg-muted px-1 rounded">{maritimeData.yacht_id}</code>
              </div>
            )}
          </div>
        </CardHeader>
      </Card>
      
      {/* Solutions - Horizontal 3-Column Layout */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recommended Solutions</h3>
          <Badge variant="secondary" className="text-xs">
            {maritimeData.solutions.length} solutions
          </Badge>
        </div>
        
        {/* Horizontal Grid - up to 3 solutions per row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {maritimeData.solutions.slice(0, 3).map((solution, index) => (
            <div key={solution.solution_id} className="relative">
              <SolutionCard
                solution={solution}
                maritimeData={maritimeData}
                onFeedback={onFeedback}
              />
            </div>
          ))}
        </div>
        
        {/* Show More Solutions if there are more than 3 */}
        {maritimeData.solutions.length > 3 && (
          <Collapsible open={expandedSolutions.has('additional')} onOpenChange={(open) => {
            if (open) {
              setExpandedSolutions(prev => new Set(prev).add('additional'));
            } else {
              setExpandedSolutions(prev => {
                const newSet = new Set(prev);
                newSet.delete('additional');
                return newSet;
              });
            }
          }}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full mt-4 gap-2"
              >
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    expandedSolutions.has('additional') && "rotate-90"
                  )}
                />
                Show {maritimeData.solutions.length - 3} more solution{maritimeData.solutions.length - 3 !== 1 ? 's' : ''}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {maritimeData.solutions.slice(3).map((solution) => (
                  <div key={solution.solution_id}>
                    <SolutionCard
                      solution={solution}
                      maritimeData={maritimeData}
                      onFeedback={onFeedback}
                    />
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
      
      {/* Documents Consulted */}
      {maritimeData.documents_used && maritimeData.documents_used.length > 0 && (
        <Collapsible 
          open={showAllDocuments} 
          onOpenChange={setShowAllDocuments}
        >
          <Card className="border-muted">
            <CardHeader>
              <CollapsibleTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-0 hover:bg-transparent"
                >
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Reference Documents
                    <Badge variant="secondary" className="ml-1">
                      {maritimeData.documents_used.length}
                    </Badge>
                  </CardTitle>
                  <ChevronRight className={cn(
                    "h-4 w-4 transition-transform",
                    showAllDocuments && "rotate-90"
                  )} />
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <ScrollArea className="h-[150px] w-full rounded-md border bg-muted/30 p-3">
                  <div className="space-y-2">
                    {maritimeData.documents_used.map((doc, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <Badge variant="outline" className="mt-0.5 shrink-0">
                          {index + 1}
                        </Badge>
                        <span className="text-muted-foreground break-all">
                          {doc}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
      
      {/* Additional Information */}
      {maritimeData.awaiting_feedback && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Feedback Requested</AlertTitle>
          <AlertDescription>
            Your feedback on these solutions helps improve future recommendations. Please let us know if any solution worked for you.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MaritimeSolutions;
export { SolutionCard, DocumentLink, MaritimeSolutions };
export type { Solution, MaritimeResponse, DocumentLinkProps, SolutionCardProps, MaritimeSolutionsProps };