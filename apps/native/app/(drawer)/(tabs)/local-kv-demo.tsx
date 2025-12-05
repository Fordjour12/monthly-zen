import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { Container } from '@/components/container';
import { 
  localKV, 
  StorageCategory, 
  cacheAIResponse, 
  getCachedAIResponse,
  setUserPreference,
  getUserPreference,
} from '@/lib/local-kv';

export default function LocalKVDemo() {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [stats, setStats] = useState<any>(null);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const updateStats = () => {
    const storageStats = localKV.getStats();
    setStats(storageStats);
  };

  const testBasicOperations = () => {
    addResult('🧪 Testing basic operations...');
    
    try {
      // Test set/get
      const testData = { message: 'Hello Local KV!', timestamp: Date.now() };
      const success = localKV.set('test-key', testData, 5000, StorageCategory.CACHE);
      addResult(success ? '✅ Set successful' : '❌ Set failed');

      const retrieved = localKV.get('test-key', StorageCategory.CACHE);
      addResult(retrieved ? '✅ Get successful' : '❌ Get failed');

      // Test contains
      const exists = localKV.contains('test-key', StorageCategory.CACHE);
      addResult(exists ? '✅ Contains successful' : '❌ Contains failed');

      // Test delete
      const deleted = localKV.delete('test-key', StorageCategory.CACHE);
      addResult(deleted ? '✅ Delete successful' : '❌ Delete failed');

      updateStats();
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testUserPreferences = () => {
    addResult('⚙️ Testing user preferences...');
    
    try {
      // Test user preferences
      setUserPreference('theme', 'dark');
      setUserPreference('notifications', true);
      setUserPreference('language', 'en');

      addResult('✅ Preferences saved');

      const theme = getUserPreference('theme', 'light');
      const notifications = getUserPreference('notifications', false);
      const language = getUserPreference('language', 'en');

      addResult(`🎨 Theme: ${theme}`);
      addResult(`🔔 Notifications: ${notifications}`);
      addResult(`🌐 Language: ${language}`);

      updateStats();
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testAICaching = () => {
    addResult('🤖 Testing AI caching...');
    
    try {
      // Test AI response caching
      const aiData = { 
        plan: 'Test monthly plan', 
        confidence: 0.95,
        goals: ['Complete project', 'Learn React Native'],
        timeline: '4 weeks'
      };

      cacheAIResponse('test-plan', aiData);
      addResult('✅ AI response cached');

      const cachedAI = getCachedAIResponse('test-plan');
      addResult(cachedAI ? '✅ AI response retrieved' : '❌ Failed to retrieve');

      if (cachedAI && typeof cachedAI === 'object') {
        const aiData = cachedAI as any;
        addResult(`📊 Plan: ${aiData.plan || 'N/A'}`);
        addResult(`🎯 Confidence: ${aiData.confidence || 'N/A'}`);
      }

      updateStats();
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testOfflineData = () => {
    addResult('📱 Testing offline data...');
    
    try {
      // Test offline data storage
      const offlineTasks = [
        { id: '1', title: 'Task 1', status: 'pending' },
        { id: '2', title: 'Task 2', status: 'completed' },
        { id: '3', title: 'Task 3', status: 'pending' },
      ];

      localKV.set('tasks', offlineTasks, 0, StorageCategory.OFFLINE);
      addResult('✅ Offline tasks saved');

      const cachedTasks = localKV.get('tasks', StorageCategory.OFFLINE);
      addResult(cachedTasks && Array.isArray(cachedTasks) ? `✅ Retrieved ${cachedTasks.length} tasks` : '❌ Failed to retrieve');

      updateStats();
    } catch (error) {
      addResult(`❌ Error: ${error}`);
    }
  };

  const testCleanup = () => {
    addResult('🧹 Testing cleanup...');
    
    try {
      const cleaned = localKV.cleanup();
      addResult(`🧹 Cleanup completed: ${cleaned} entries removed`);
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
        <Text style={styles.title}>Local KV Storage Demo</Text>
        
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
          <TouchableOpacity style={styles.button} onPress={testBasicOperations}>
            <Text style={styles.buttonText}>Test Basic Operations</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testUserPreferences}>
            <Text style={styles.buttonText}>Test User Preferences</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testAICaching}>
            <Text style={styles.buttonText}>Test AI Caching</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testOfflineData}>
            <Text style={styles.buttonText}>Test Offline Data</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={testCleanup}>
            <Text style={styles.buttonText}>Test Cleanup</Text>
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