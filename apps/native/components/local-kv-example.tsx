import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { localKV, StorageCategory, cacheAIResponse, getCachedAIResponse } from '../lib/local-kv';

export default function LocalKVExample() {
  const [stats, setStats] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    updateStats();
  }, []);

  const updateStats = () => {
    const storageStats = localKV.getStats();
    setStats(storageStats);
  };

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testBasicOperations = async () => {
    addResult('🧪 Starting basic operations test...');
    
    try {
      // Test set/get
      const testData = { message: 'Hello Local KV!', timestamp: Date.now() };
      const success = localKV.set('test-key', testData, 5000, StorageCategory.CACHE);
      addResult(success ? '✅ Set operation successful' : '❌ Set operation failed');

      const retrieved = localKV.get('test-key', StorageCategory.CACHE);
      addResult(retrieved ? '✅ Get operation successful' : '❌ Get operation failed');

      // Test contains
      const exists = localKV.contains('test-key', StorageCategory.CACHE);
      addResult(exists ? '✅ Contains operation successful' : '❌ Contains operation failed');

      // Test delete
      const deleted = localKV.delete('test-key', StorageCategory.CACHE);
      addResult(deleted ? '✅ Delete operation successful' : '❌ Delete operation failed');

      // Verify deletion
      const afterDelete = localKV.get('test-key', StorageCategory.CACHE);
      addResult(!afterDelete ? '✅ Deletion verified' : '❌ Deletion failed');

      updateStats();
    } catch (error) {
      addResult(`❌ Error in basic operations: ${error}`);
    }
  };

  const testAIResponseCaching = async () => {
    addResult('🤖 Testing AI response caching...');
    
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
      addResult(cachedAI ? '✅ AI response retrieved from cache' : '❌ Failed to retrieve AI response');

      if (cachedAI && typeof cachedAI === 'object') {
        const aiData = cachedAI as any;
        addResult(`📊 Plan: ${aiData.plan || 'N/A'}`);
        addResult(`🎯 Confidence: ${aiData.confidence || 'N/A'}`);
      }

      updateStats();
    } catch (error) {
      addResult(`❌ Error in AI caching: ${error}`);
    }
  };

  const testUserPreferences = async () => {
    addResult('⚙️ Testing user preferences...');
    
    try {
      // Test user preferences
      localKV.set('theme', 'dark', 0, StorageCategory.USER_PREFS);
      localKV.set('notifications', true, 0, StorageCategory.USER_PREFS);
      localKV.set('language', 'en', 0, StorageCategory.USER_PREFS);

      addResult('✅ User preferences saved');

      const theme = localKV.get('theme', StorageCategory.USER_PREFS);
      const notifications = localKV.get('notifications', StorageCategory.USER_PREFS);
      const language = localKV.get('language', StorageCategory.USER_PREFS);

      addResult(`🎨 Theme: ${theme}`);
      addResult(`🔔 Notifications: ${notifications}`);
      addResult(`🌐 Language: ${language}`);

      updateStats();
    } catch (error) {
      addResult(`❌ Error in user preferences: ${error}`);
    }
  };

  const testOfflineData = async () => {
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
      addResult(cachedTasks && Array.isArray(cachedTasks) ? `✅ Retrieved ${cachedTasks.length} offline tasks` : '❌ Failed to retrieve tasks');

      updateStats();
    } catch (error) {
      addResult(`❌ Error in offline data: ${error}`);
    }
  };

  const testCleanup = async () => {
    addResult('🧹 Testing cleanup...');
    
    try {
      // Add some test data with short TTL
      localKV.set('temp1', 'data1', 1, StorageCategory.CACHE); // 1ms TTL
      localKV.set('temp2', 'data2', 1, StorageCategory.CACHE); // 1ms TTL
      localKV.set('persistent', 'data3', 0, StorageCategory.USER_PREFS); // No TTL

      addResult('✅ Test data added');

      // Wait a bit then cleanup
      setTimeout(() => {
        const cleaned = localKV.cleanup();
        addResult(`🧹 Cleanup completed: ${cleaned} entries removed`);

        // Verify cleanup
        const temp1 = localKV.get('temp1', StorageCategory.CACHE);
        const temp2 = localKV.get('temp2', StorageCategory.CACHE);
        const persistent = localKV.get('persistent', StorageCategory.USER_PREFS);

        addResult(temp1 ? '❌ temp1 still exists' : '✅ temp1 cleaned up');
        addResult(temp2 ? '❌ temp2 still exists' : '✅ temp2 cleaned up');
        addResult(persistent ? '✅ persistent data preserved' : '❌ persistent data lost');

        updateStats();
      }, 100);
    } catch (error) {
      addResult(`❌ Error in cleanup: ${error}`);
    }
  };

  const testCategoryOperations = async () => {
    addResult('📂 Testing category operations...');
    
    try {
      // Add data to different categories
      localKV.set('cache-data', 'cache-value', 5000, StorageCategory.CACHE);
      localKV.set('pref-data', 'pref-value', 0, StorageCategory.USER_PREFS);
      localKV.set('session-data', 'session-value', 5000, StorageCategory.SESSION);
      localKV.set('offline-data', 'offline-value', 0, StorageCategory.OFFLINE);

      addResult('✅ Data added to all categories');

      // Get keys by category
      const cacheKeys = localKV.getKeys(StorageCategory.CACHE);
      const prefKeys = localKV.getKeys(StorageCategory.USER_PREFS);
      const sessionKeys = localKV.getKeys(StorageCategory.SESSION);
      const offlineKeys = localKV.getKeys(StorageCategory.OFFLINE);

      addResult(`📂 Cache keys: ${cacheKeys.length}`);
      addResult(`⚙️ Pref keys: ${prefKeys.length}`);
      addResult(`🔄 Session keys: ${sessionKeys.length}`);
      addResult(`📱 Offline keys: ${offlineKeys.length}`);

      // Clear one category
      const cleared = localKV.clear(StorageCategory.SESSION);
      addResult(cleared ? '✅ Session category cleared' : '❌ Failed to clear session');

      updateStats();
    } catch (error) {
      addResult(`❌ Error in category operations: ${error}`);
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

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Local KV Storage Test</Text>
      
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

        <TouchableOpacity style={styles.button} onPress={testAIResponseCaching}>
          <Text style={styles.buttonText}>Test AI Caching</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testUserPreferences}>
          <Text style={styles.buttonText}>Test User Preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testOfflineData}>
          <Text style={styles.buttonText}>Test Offline Data</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testCleanup}>
          <Text style={styles.buttonText}>Test Cleanup</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={testCategoryOperations}>
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