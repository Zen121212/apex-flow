import React, { Component, ErrorInfo, ReactNode } from 'react';
import './AIAnalysisErrorBoundary.css';

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class AIAnalysisErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('AI Analysis Error:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An error occurred during AI analysis';
      const isConfigError = errorMessage.includes('HUGGINGFACE_API_KEY');

      return (
        <div className="ai-error-boundary">
          <div className="ai-error-content">
            <div className="ai-error-icon">⚠️</div>
            <h3>AI Analysis Error</h3>
            
            {isConfigError ? (
              <>
                <p>The Hugging Face AI service is not properly configured.</p>
                <div className="ai-error-details">
                  <p>Please ensure:</p>
                  <ol>
                    <li>Hugging Face API key is configured in the environment</li>
                    <li>The API key has the correct permissions</li>
                    <li>The backend service is properly configured</li>
                  </ol>
                </div>
                <div className="ai-error-help">
                  <p>Set up instructions:</p>
                  <code>
                    export HUGGINGFACE_API_KEY=your_api_key_here
                  </code>
                </div>
              </>
            ) : (
              <>
                <p>{errorMessage}</p>
                <button 
                  className="ai-retry-button"
                  onClick={this.handleRetry}
                >
                  Try Again
                </button>
              </>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AIAnalysisErrorBoundary;