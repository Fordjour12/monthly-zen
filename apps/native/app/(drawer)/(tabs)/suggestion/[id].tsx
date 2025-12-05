import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSuggestion } from '@/hooks/use-suggestions';
import { MonthlyPlanViewer } from '@/lib/monthly-plan';

export default function SuggestionDetailScreen() {
   const { id } = useLocalSearchParams<{ id: string }>();
   const { suggestion, isLoading, error } = useSuggestion(id || '');

   if (isLoading) {
      return (
         <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#4CAF50" />
            <Text style={styles.loadingText}>Loading suggestion...</Text>
         </View>
      );
   }

   if (error) {
      return (
         <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Failed to load suggestion</Text>
            <Text style={styles.errorDetail}>{error.message}</Text>
         </View>
      );
   }

   if (!suggestion) {
      return (
         <View style={styles.centerContainer}>
            <Text style={styles.errorText}>Suggestion not found</Text>
         </View>
      );
   }

   // Parse the content data based on suggestion type
   const parseSuggestionContent = () => {
      try {
         // If content is already an object, return as is
         if (typeof suggestion.content === 'object') {
            return suggestion.content;
         }
         
         // If content is a string, try to parse as JSON
         if (typeof suggestion.content === 'string') {
            // Try to parse as JSON first
            try {
               return JSON.parse(suggestion.content);
            } catch {
               // If JSON parsing fails, return as plain text
               return suggestion.content;
            }
         }
         
         return suggestion.content;
      } catch (error) {
         console.error('Error parsing suggestion content:', error);
         return suggestion.content;
      }
   };

   const parsedContent = parseSuggestionContent();

   const renderContent = () => {
      // For plan type suggestions, use MonthlyPlanViewer
      if (suggestion.type === 'plan') {
         return <MonthlyPlanViewer data={parsedContent} />;
      }

      // For other types, render basic content
      return (
         <View style={styles.contentContainer}>
            <Text style={styles.title}>{suggestion.title}</Text>
            <Text style={styles.description}>{suggestion.description}</Text>
            
            <View style={styles.separator} />
            
            {/* Render content based on type */}
            {typeof parsedContent === 'string' ? (
               <Text style={styles.textContent}>{parsedContent}</Text>
            ) : typeof parsedContent === 'object' ? (
               <Text style={styles.jsonContent}>
                  {JSON.stringify(parsedContent, null, 2)}
               </Text>
            ) : null}
         </View>
      );
   };

   return (
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
         {renderContent()}
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
      backgroundColor: '#fff',
   },
   centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20,
   },
   loadingText: {
      marginTop: 10,
      fontSize: 16,
      color: '#666',
   },
   errorText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#d32f2f',
      marginBottom: 8,
   },
   errorDetail: {
      fontSize: 14,
      color: '#666',
      textAlign: 'center',
   },
   contentContainer: {
      padding: 20,
   },
   title: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#1A237E',
      marginBottom: 10,
   },
   description: {
      fontSize: 16,
      color: '#666',
      lineHeight: 24,
      marginBottom: 20,
   },
   separator: {
      height: 1,
      backgroundColor: '#E0E0E0',
      marginVertical: 15,
   },
   textContent: {
      fontSize: 14,
      lineHeight: 22,
      color: '#333',
   },
   jsonContent: {
      fontSize: 12,
      fontFamily: 'monospace',
      color: '#333',
      backgroundColor: '#f5f5f5',
      padding: 10,
      borderRadius: 8,
   },
});