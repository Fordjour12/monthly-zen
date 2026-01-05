import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  AlertCircleIcon,
  RefreshIcon,
  ArrowLeft01Icon,
  AiMagicIcon,
} from "@hugeicons/core-free-icons";
import * as Haptics from "expo-haptics";
import Animated, { FadeInUp, FadeInDown } from "react-native-reanimated";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

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
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Synaptic failure:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View className="flex-1 bg-background items-center justify-center px-10">
          <Animated.View
            entering={FadeInUp.duration(800)}
            className="w-24 h-24 rounded-[32px] bg-danger/10 items-center justify-center mb-10 border border-danger/20 shadow-2xl shadow-danger/10"
          >
            <HugeiconsIcon icon={AlertCircleIcon} size={36} color="var(--danger)" />
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(200).duration(600)}
            className="items-center mb-12"
          >
            <Text className="text-[10px] font-sans-bold text-danger uppercase tracking-[3px] mb-4">
              Synaptic Map Interrupted
            </Text>
            <Text className="text-2xl font-sans-bold text-foreground text-center tracking-tight mb-4">
              Neural Node Failure
            </Text>
            <Text className="text-base font-sans text-muted-foreground text-center leading-7 opacity-70">
              An unexpected anomaly occurred during neural transmission. Your current state has been
              preserved.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(600)} className="w-full gap-y-4">
            <TouchableOpacity
              onPress={this.handleReset}
              className="bg-foreground h-16 rounded-[24px] flex-row items-center justify-center gap-x-3 shadow-xl"
            >
              <HugeiconsIcon icon={RefreshIcon} size={20} color="var(--background)" />
              <Text className="text-sm font-sans-bold text-background uppercase tracking-widest">
                Reinitialize Sync
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={this.handleReset} // Could be improved if navigation is accessible
              className="h-16 rounded-[24px] bg-surface border border-border/50 flex-row items-center justify-center gap-x-3"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="var(--foreground)" />
              <Text className="text-sm font-sans-bold text-foreground uppercase tracking-widest">
                Safe Mode Revert
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {__DEV__ && this.state.error && (
            <Animated.View entering={FadeInDown.delay(600)} className="mt-12 w-full">
              <View className="flex-row items-center gap-x-2 mb-3 ml-1 opacity-40">
                <HugeiconsIcon icon={AiMagicIcon} size={12} color="var(--muted-foreground)" />
                <Text className="text-[10px] font-sans-bold text-muted-foreground uppercase tracking-widest">
                  Diagnostic Telemetry
                </Text>
              </View>
              <ScrollView className="max-h-40 bg-surface/50 border border-border/30 p-4 rounded-2xl">
                <Text className="text-[11px] text-danger font-mono leading-5">
                  {this.state.error.toString()}
                  {"\n\n"}
                  {this.state.errorInfo?.componentStack}
                </Text>
              </ScrollView>
            </Animated.View>
          )}
        </View>
      );
    }

    return this.props.children;
  }
}

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
