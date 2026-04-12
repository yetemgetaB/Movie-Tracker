import { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
  resetKey?: string; // changes to this key auto-reset the boundary
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  componentDidUpdate(prevProps: Props) {
    // Auto-reset when resetKey changes (e.g. route change)
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-6 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle size={32} className="text-destructive" />
          </div>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            {this.props.fallbackMessage || "An unexpected error occurred. Try refreshing the page."}
          </p>
          {this.state.error && (
            <details className="text-xs text-muted-foreground/60 max-w-md">
              <summary className="cursor-pointer hover:text-muted-foreground">Error details</summary>
              <pre className="mt-2 p-2 rounded bg-secondary/50 overflow-auto text-left">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="flex gap-2">
            <Button onClick={this.handleReset} className="gap-2">
              <RefreshCw size={14} /> Try Again
            </Button>
            <Button variant="outline" onClick={this.handleGoHome} className="gap-2">
              <Home size={14} /> Go Home
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
