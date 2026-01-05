import { cn } from "heroui-native";
import { type PropsWithChildren } from "react";
import { ScrollView, View, type ViewProps } from "react-native";
import Animated, { type AnimatedProps, FadeIn } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const AnimatedView = Animated.createAnimatedComponent(View);

type Props = AnimatedProps<ViewProps> & {
  className?: string;
  withScroll?: boolean;
  scrollProps?: React.ComponentProps<typeof ScrollView>;
};

export function Container({
  children,
  className,
  withScroll = true,
  scrollProps,
  ...props
}: PropsWithChildren<Props>) {
  const insets = useSafeAreaInsets();

  const content = (
    <AnimatedView
      className={cn("flex-1 bg-background", className)}
      style={{
        paddingBottom: insets.bottom,
      }}
      entering={FadeIn.duration(400)}
      {...props}
    >
      {children}
    </AnimatedView>
  );

  if (withScroll) {
    return (
      <View className="flex-1 bg-background">
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          {...scrollProps}
        >
          {content}
        </ScrollView>
      </View>
    );
  }

  return content;
}
