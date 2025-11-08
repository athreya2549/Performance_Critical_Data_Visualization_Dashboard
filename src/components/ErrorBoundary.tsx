import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error Details</summary>
            <pre>{this.state.error?.message}</pre>
          </details>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
            }}
          >
            Try again
          </button>
          <style jsx>{`
            .error-boundary {
              padding: 20px;
              border: 1px solid #f56565;
              border-radius: 8px;
              background-color: #fff5f5;
              color: #c53030;
            }

            h2 {
              margin: 0 0 12px;
              font-size: 18px;
            }

            details {
              margin: 12px 0;
            }

            pre {
              padding: 12px;
              background-color: #fff;
              border-radius: 4px;
              overflow-x: auto;
            }

            button {
              padding: 8px 16px;
              background-color: #c53030;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }

            button:hover {
              background-color: #9b2c2c;
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}