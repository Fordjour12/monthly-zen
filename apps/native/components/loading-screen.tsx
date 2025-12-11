import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useThemeColor } from 'heroui-native';

interface LoadingScreenProps {
  message?: string;
  size?: 'small' | 'large';
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  size = 'large',
}) => {
  const themeColorBackground = useThemeColor('background');
  const themeColorForeground = useThemeColor('foreground');

  return (
    <View style={[styles.container, { backgroundColor: themeColorBackground }]}>
      <View style={styles.content}>
        <ActivityIndicator size={size} color={themeColorForeground} />
        <Text style={[styles.message, { color: themeColorForeground }]}>
          {message}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  message: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});