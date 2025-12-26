import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch JavaScript errors anywhere in the component tree.
 * Displays a user-friendly error message and allows users to restart the app.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourApp />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console for debugging
    console.error("[ErrorBoundary] Caught an error:", error, errorInfo);

    // Store error info in state for display
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    // Reload the app to recover from the error
    // In production, you might want to use a more sophisticated recovery mechanism
    this.handleReset();
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View className="flex-1 bg-background p-6 items-center justify-center">
          <View className="w-full max-w-md">
            <View className="items-center mb-6">
              <View className="w-20 h-20 bg-destructive/10 rounded-full items-center justify-center mb-4">
                <Ionicons name="alert-circle" size={40} className="text-destructive" />
              </View>
              <Text className="text-2xl font-bold text-foreground mb-2">
                Oops! Something went wrong
              </Text>
              <Text className="text-center text-muted-foreground">
                An unexpected error occurred. Don't worry, your data is safe.
              </Text>
            </View>

            <View className="space-y-3 w-full">
              <TouchableOpacity
                onPress={this.handleReload}
                className="bg-primary p-4 rounded-lg items-center"
                accessibilityLabel="Try again"
                accessibilityHint="Reload the app and try again"
                accessibilityRole="button"
              >
                <Text className="text-primary-foreground font-medium">Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={this.handleReset}
                className="border border-border p-4 rounded-lg items-center"
                accessibilityLabel="Go back"
                accessibilityHint="Return to the app and clear the error"
                accessibilityRole="button"
              >
                <Text className="text-foreground font-medium">Go Back</Text>
              </TouchableOpacity>
            </View>

            {/* Show error details in development mode */}
            {__DEV__ && this.state.error && (
              <View className="mt-6">
                <TouchableOpacity
                  onPress={() => {
                    // Toggle error details visibility
                    // You might want to add state for this
                  }}
                  className="mb-2"
                >
                  <Text className="text-sm text-muted-foreground">
                    Error Details (Development Only)
                  </Text>
                </TouchableOpacity>
                <ScrollView className="max-h-40 bg-muted/50 p-3 rounded-lg">
                  <Text className="text-xs text-destructive font-mono">
                    {this.state.error.toString()}
                    {"\n\n"}
                    {this.state.errorInfo?.componentStack}
                  </Text>
                </ScrollView>
              </View>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

/**
 * Functional wrapper component for easier use
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode,
): React.ComponentType<P> {
  return (props: P) => (
    <ErrorBoundary fallback={fallback}>
      <Component {...props} />
    </ErrorBoundary>
  );
}
