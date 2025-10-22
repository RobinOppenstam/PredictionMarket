// PRODUCTION MODE: 24-hour daily markets
// Use this config for testnet/mainnet deployments

function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight UTC
  return Math.floor(midnight.getTime() / 1000);
}

function getOneMinuteAfterMidnight() {
  return getNextMidnight() + 60; // 60 seconds after midnight
}

module.exports = {
  getNextMidnight,
  getOneMinuteAfterMidnight
};
