import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from "react-native";
import { Container } from "@/components/container";
import { 
  localKV, 
  StorageCategory, 
  setUserPreference, 
  getUserPreference 
} from "@/lib/local-kv";

export default function LocalKVIntegrationExample() {
  const [stats, setStats] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const updateStats = () => {
    const storageStats = localKV.getStats();
    setStats(storageStats);
  };

  const testTaskCaching = () => {
    addResult('📋 Testing task caching...');
    
    try {
      // Simulate task data
      const tasks = [
        { id: '1', title: 'Complete project proposal', status: 'pending', priority: 'high' },
        { id: '2', title: 'Review code changes', status: 'completed', priority: 'medium' },
        { id: '3', title: 'Update documentation', status: 'pending', priority: 'low' },
      ];

      // Cache tasks for offline use
      localKV.set('user-tasks', tasks, 0, StorageCategory.OFFLINE);
      addResult('✅ Tasks cached for offline use');

      // Retrieve cached tasks
      const cachedTasks = localKV.get('user-tasks', StorageCategory.OFFLINE);
      addResult(cachedTasks && Array.isArray(cachedTasks) ? `✅ Retrieved ${cachedTasks.length} cached tasks` : '❌ Failed to retrieve tasks');

      // Test task filtering
      const pendingTasks = cachedTasks && Array.isArray(cachedTasks) 
        ? cachedTasks.filter((task: any) => task.status === 'pending')
        : [];
      addResult(pendingTasks ? `✅ Found ${pendingTasks.length} pending tasks` : '❌ Failed to filter tasks');

      updateStats();
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testUserPreferences = () => {
    addResult('⚙️ Testing user preferences...');
    
    try {
      // Save user preferences
      setUserPreference('taskView', 'list');
      setUserPreference('showCompleted', true);
      setUserPreference('defaultPriority', 'medium');
      setUserPreference('autoSave', true);

      addResult('✅ User preferences saved');

      // Retrieve preferences
      const taskView = getUserPreference('taskView', 'grid');
      const showCompleted = getUserPreference('showCompleted', false);
      const defaultPriority = getUserPreference('defaultPriority', 'medium');
      const autoSave = getUserPreference('autoSave', false);

      addResult(`📱 Task View: ${taskView}`);
      addResult(`👁️ Show Completed: ${showCompleted}`);
      addResult(`⭐ Default Priority: ${defaultPriority}`);
      addResult(`💾 Auto Save: ${autoSave}`);

      updateStats();
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testAICaching = () => {
    addResult('🤖 Testing AI response caching...');
    
    try {
      // Simulate AI response
      const aiResponse = {
        plan: 'Monthly development plan',
        confidence: 0.92,
        suggestions: [
          'Focus on core features first',
          'Allocate time for testing',
          'Schedule regular code reviews'
        ],
        timeline: '4 weeks',
        priority: 'high'
      };

      // Cache AI response
      localKV.set('ai-plan-123', aiResponse, 2 * 60 * 60 * 1000, StorageCategory.CACHE); // 2 hours
      addResult('✅ AI response cached');

      // Retrieve cached AI response
      const cachedAI = localKV.get('ai-plan-123', StorageCategory.CACHE);
      addResult(cachedAI ? '✅ AI response retrieved from cache' : '❌ Failed to retrieve AI response');

      if (cachedAI && typeof cachedAI === 'object') {
        const aiData = cachedAI as any;
        addResult(`📊 Plan: ${aiData.plan || 'N/A'}`);
        addResult(`🎯 Confidence: ${aiData.confidence || 'N/A'}`);
        addResult(`💡 Suggestions: ${aiData.suggestions?.length || 0}`);
      }

      updateStats();
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testPerformance = () => {
    addResult('⚡ Testing performance...');
    
    try {
      const iterations = 1000;
      const testData = { test: 'performance', data: new Array(100).fill('x') };

      // Test write performance
      const writeStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        localKV.set(`perf-test-${i}`, testData, 60000, StorageCategory.CACHE);
      }
      const writeTime = Date.now() - writeStart;

      // Test read performance
      const readStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        localKV.get(`perf-test-${i}`, StorageCategory.CACHE);
      }
      const readTime = Date.now() - readStart;

      addResult(`✅ Write: ${iterations} operations in ${writeTime}ms (${(writeTime/iterations).toFixed(2)}ms/op)`);
      addResult(`✅ Read: ${iterations} operations in ${readTime}ms (${(readTime/iterations).toFixed(2)}ms/op)`);

      // Cleanup test data
      for (let i = 0; i < iterations; i++) {
        localKV.delete(`perf-test-${i}`, StorageCategory.CACHE);
      }

      updateStats();
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testCategories = () => {
    addResult('📂 Testing storage categories...');
    
    try {
      // Add data to different categories
      localKV.set('cache-data', 'temporary cache', 5000, StorageCategory.CACHE);
      localKV.set('pref-theme', 'dark', 0, StorageCategory.USER_PREFS);
      localKV.set('session-token', 'abc123', 30000, StorageCategory.SESSION);
      localKV.set('offline-backup', 'important data', 0, StorageCategory.OFFLINE);
      localKV.set('secret-key', 'encrypted-value', 0, StorageCategory.SECURE);

      addResult('✅ Data added to all categories');

      // Count keys in each category
      const cacheKeys = localKV.getKeys(StorageCategory.CACHE);
      const prefKeys = localKV.getKeys(StorageCategory.USER_PREFS);
      const sessionKeys = localKV.getKeys(StorageCategory.SESSION);
      const offlineKeys = localKV.getKeys(StorageCategory.OFFLINE);
      const secureKeys = localKV.getKeys(StorageCategory.SECURE);

      addResult(`📂 Cache: ${cacheKeys.length} keys`);
      addResult(`⚙️ Preferences: ${prefKeys.length} keys`);
      addResult(`🔄 Session: ${sessionKeys.length} keys`);
      addResult(`📱 Offline: ${offlineKeys.length} keys`);
      addResult(`🔒 Secure: ${secureKeys.length} keys`);

      updateStats();
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const clearAllData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all cached data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear All', 
          style: 'destructive',
          onPress: () => {
            localKV.clear();
            addResult('🗑️ All data cleared');
            updateStats();
          }
        }
      ]
    );
  };

  const clearResults = () => {
    setTestResults([]);
  };

  // Initialize stats on mount
  React.useEffect(() => {
    updateStats();
  }, []);

  return (
    <Container>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Local KV Integration Demo</Text>
        
        {stats && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Storage Statistics</Text>
            <Text style={styles.statText}>Total Keys: {stats.totalKeys}</Text>
            <Text style={styles.statText}>Cache Size: {stats.cacheSize} MB</Text>
            <Text style={styles.statText}>Hit Rate: {stats.hitRate}%</Text>
            <Text style={styles.statText}>Miss Rate: {stats.missRate}%</Text>
            <Text style={styles.statText}>Evictions: {stats.evictionCount}</Text>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={testTaskCaching}>
            <Text style={styles.buttonText}>Test Task Caching</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testUserPreferences}>
            <Text style={styles.buttonText}>Test User Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testAICaching}>
            <Text style={styles.buttonText}>Test AI Caching</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testPerformance}>
            <Text style={styles.buttonText}>Test Performance</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testCategories}>
            <Text style={styles.buttonText}>Test Categories</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.dangerButton]} onPress={clearAllData}>
            <Text style={styles.buttonText}>Clear All Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={clearResults}>
            <Text style={styles.buttonText}>Clear Results</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.resultsContainer}>
          <Text style={styles.resultsTitle}>Test Results</Text>
          <ScrollView style={styles.resultsScroll} nestedScrollEnabled={true}>
            {testResults.map((result, index) => (
              <Text key={index} style={styles.resultText}>
                {result}
              </Text>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statText: {
    fontSize: 14,
    marginBottom: 5,
  },
  buttonContainer: {
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
  },
  secondaryButton: {
    backgroundColor: '#6c757d',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    minHeight: 200,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  resultsScroll: {
    flex: 1,
    padding: 15,
  },
  resultText: {
    fontSize: 12,
    marginBottom: 5,
    fontFamily: 'monospace',
  },
});