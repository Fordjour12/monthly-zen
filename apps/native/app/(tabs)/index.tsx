import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, Alert, Pressable, } from 'react-native';
import { useThemeColor, Card } from 'heroui-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orpc } from '@/utils/orpc';
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

// Mock data for now until API endpoints are ready


export default function DashboardScreen() {
   const themeColorBackground = useThemeColor('background');
   const themeColorForeground = useThemeColor('foreground');

   const queryClient = useQueryClient();
   const [refreshing, setRefreshing] = useState(false);


   const router = useRouter();




   return (
      <ScrollView
         style={[styles.container, { backgroundColor: themeColorBackground }]}
         contentContainerStyle={styles.content}
        >
         <View style={styles.header}>
            <Text style={[styles.greeting, { color: themeColorForeground }]}>Good Morning,</Text>
            <Text style={[styles.name, { color: themeColorForeground }]}>Phantom</Text>
         </View>

         <View style={{ height: 40 }} />
      </ScrollView>
   );
}

const styles = StyleSheet.create({
   container: {
      flex: 1,
   },
   content: {
      padding: 20,
   },
   header: {
      marginBottom: 24,
      marginTop: 10,
   },
   greeting: {
      fontSize: 16,
      opacity: 0.7,
   },
   name: {
      fontSize: 28,
      fontWeight: 'bold',
   },
   sectionTitle: {
      fontSize: 20,
      fontWeight: '700',
      marginBottom: 16,
      marginTop: 8,
   },
});
