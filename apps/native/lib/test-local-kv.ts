import { localKV, StorageCategory, cacheAIResponse, getCachedAIResponse } from './local-kv';

// Test the local KV implementation
export function testLocalKV() {
  console.log('🧪 Testing Local KV Implementation...');

  // Test basic set/get
  const testData = { message: 'Hello World', timestamp: Date.now() };
  const success = localKV.set('test-key', testData, 5000, StorageCategory.CACHE);
  console.log('✅ Set operation:', success);

  const retrieved = localKV.get('test-key', StorageCategory.CACHE);
  console.log('✅ Get operation:', retrieved);

  // Test AI response caching
  const aiData = { plan: 'Test plan', confidence: 0.9 };
  cacheAIResponse('ai-test', aiData);
  console.log('✅ AI Response cached');

  const cachedAI = getCachedAIResponse('ai-test');
  console.log('✅ AI Response retrieved:', cachedAI);

  // Test stats
  const stats = localKV.getStats();
  console.log('✅ Storage stats:', stats);

  // Test cleanup
  const cleaned = localKV.cleanup();
  console.log('✅ Cleanup completed:', cleaned, 'entries removed');

  console.log('🎉 Local KV test completed!');
}

// Export for easy testing
export { localKV, StorageCategory, cacheAIResponse, getCachedAIResponse };