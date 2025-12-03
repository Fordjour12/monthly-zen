#!/usr/bin/env node

// Simple script to reset rate limits by accessing the global limiter
import globalRateLimiter from './packages/api/src/rate-limiting/simple-limiter.ts';

// Reset both daily and monthly usage on the global limiter
console.log('Resetting rate limits...');
globalRateLimiter.resetDailyUsage();
globalRateLimiter.resetMonthlyUsage();
console.log('Rate limits reset successfully!');