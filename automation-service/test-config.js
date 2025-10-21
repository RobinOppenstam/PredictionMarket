// Test configuration for faster market cycles
// Replace the timing functions in index.js with these for testing

// Resolve markets every 5 minutes instead of daily
function getNextMidnight() {
  const now = Math.floor(Date.now() / 1000);
  return now + (5 * 60); // 5 minutes from now
}

// Create new market 10 seconds after resolution
function getOneMinuteAfterMidnight() {
  return getNextMidnight() + 10; // 10 seconds after "midnight"
}

// Instructions:
// 1. Copy these functions to index.js
// 2. Replace the original getNextMidnight() and getOneMinuteAfterMidnight()
// 3. Markets will now resolve every 5 minutes instead of daily
// 4. Perfect for quick testing!

module.exports = { getNextMidnight, getOneMinuteAfterMidnight };
