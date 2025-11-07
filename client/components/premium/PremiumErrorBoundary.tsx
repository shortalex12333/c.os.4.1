import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class PremiumErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Generate unique error ID for tracking
    const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      hasError: true,
      error,
      errorId
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for monitoring
    console.error('PremiumErrorBoundary caught an error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    });

    // Send to error tracking service
    if (typeof window !== 'undefined' && window.localStorage) {
      const errorLog = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href
      };
      
      try {
        const existingErrors = JSON.parse(localStorage.getItem('celesteos_errors') || '[]');
        existingErrors.push(errorLog);
        // Keep only last 10 errors
        if (existingErrors.length > 10) {
          existingErrors.splice(0, existingErrors.length - 10);
        }
        localStorage.setItem('celesteos_errors', JSON.stringify(existingErrors));
      } catch (e) {
        console.warn('Failed to store error log:', e);
      }
    }

    this.setState({
      error,
      errorInfo
    });

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError } = this.state;
    
    if (hasError && prevProps.resetKeys !== resetKeys) {
      if (resetKeys) {
        const hasResetKeyChanged = resetKeys.some((key, index) => 
          prevProps.resetKeys?.[index] !== key
        );
        
        if (hasResetKeyChanged) {
          this.resetErrorBoundary();
        }
      }
    }
    
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
    }
  }

  resetErrorBoundary = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: ''
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleFallbackMode = () => {
    // Store fallback preference
    localStorage.setItem('celesteos_fallback_mode', 'true');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default premium error UI
      return (
        <Card className="max-w-2xl mx-auto mt-8 border-red-200 dark:border-red-800">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle className="text-red-900 dark:text-red-100">
              Premium Feature Temporarily Unavailable
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center text-gray-600 dark:text-gray-400">
              <p className="mb-2">
                A premium animation component encountered an error and has been safely contained.
              </p>
              <p className="text-sm">
                Yacht operations continue normally. Error ID: <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">{this.state.errorId}</code>
              </p>
            </div>

            {/* Error Details (Development Mode) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <summary className="cursor-pointer font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Technical Details (Development Only)
                </summary>
                <div className="text-xs font-mono text-gray-600 dark:text-gray-400 space-y-2">
                  <div>
                    <strong>Error:</strong> {this.state.error.message}
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap mt-1 text-xs">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Retry Premium Features
              </Button>
              
              <Button 
                variant="outline"
                onClick={this.handleFallbackMode}
                className="flex items-center gap-2"
              >
                <Home size={16} />
                Switch to Stable Mode
              </Button>
            </div>

            {/* Crew Instructions */}
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                For Yacht Crew:
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• All core yacht systems remain fully operational</li>
                <li>• Maritime AI diagnostics continue functioning normally</li>
                <li>• Report this error ID to technical support if issue persists</li>
                <li>• Use "Stable Mode" for critical operations if needed</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export const withPremiumErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) => {
  const WrappedComponent = (props: P) => (
    <PremiumErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </PremiumErrorBoundary>
  );
  
  WrappedComponent.displayName = `withPremiumErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

export default PremiumErrorBoundary;