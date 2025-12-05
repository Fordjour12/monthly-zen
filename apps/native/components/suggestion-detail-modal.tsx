import React from 'react';
import { View, Text, ScrollView, Modal, Pressable } from 'react-native';
import { Card, useThemeColor } from 'heroui-native';
import { Ionicons } from '@expo/vector-icons';
import { SuggestionContentRenderer, formatSuggestion } from '@/lib/suggestion-formatter';

interface SuggestionDetailModalProps {
   visible: boolean;
   suggestion: any;
   onClose: () => void;
}

export function SuggestionDetailModal({
   visible,
   suggestion,
   onClose,
}: SuggestionDetailModalProps) {
   const foregroundColor = useThemeColor("foreground");
   const mutedColor = useThemeColor("muted");

   if (!suggestion) return null;

   const formatted = formatSuggestion(suggestion);

   return (
      <Modal
         visible={visible}
         animationType="slide"
         presentationStyle="pageSheet"
         onRequestClose={onClose}
      >
         <View className="flex-1 bg-background">
            {/* Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-border">
               <View className="flex-1">
                  <Text className="text-xl font-semibold text-foreground">
                     {formatted.title}
                  </Text>
                  <Text className="text-sm text-muted-foreground">
                     {formatted.displayInfo?.relativeTime}
                  </Text>
               </View>
               <Pressable onPress={onClose} className="p-2">
                  <Ionicons name="close" size={24} color={foregroundColor} />
               </Pressable>
            </View>

            {/* Content */}
            <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
               <SuggestionContentRenderer suggestion={suggestion} />
            </ScrollView>
         </View>
      </Modal>
   );
}