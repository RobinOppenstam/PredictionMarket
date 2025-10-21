const { ethers } = require('ethers');
const cron = require('node-cron');
require('dotenv').config();

// Configuration
const RPC_URL = process.env.RPC_URL || 'http://localhost:8545';
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const BITCOIN_ORACLE_ADDRESS = process.env.BITCOIN_ORACLE_ADDRESS;

// Contract ABI - only the functions we need
const CONTRACT_ABI = [
  'function createDailyOverUnder(address _oracle, uint256 _endTime) external',
  'function resolveMarket(uint256 _marketId) external',
  'function getMarketCount() external view returns (uint256)',
  'function getMarket(uint256 _marketId) external view returns (tuple(string name, string outcomeA, string outcomeB, address oracleA, address oracleB, int256 targetPrice, uint256 totalPoolA, uint256 totalPoolB, uint256 endTime, bool resolved, bool outcomeAWon, uint256 fee, uint8 marketType, int256 creationPrice, bool isAutomatic))',
];

// Oracle ABI - for updating price
const ORACLE_ABI = [
  'function updateAnswer(int256 _answer) external',
  'function latestRoundData() external view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)',
];

let provider;
let wallet;
let contract;
let oracle;

// Initialize connection
async function initialize() {
  console.log('Initializing automation service...');

  provider = new ethers.JsonRpcProvider(RPC_URL);
  wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, wallet);
  oracle = new ethers.Contract(BITCOIN_ORACLE_ADDRESS, ORACLE_ABI, wallet);

  console.log('Connected to RPC:', RPC_URL);
  console.log('Automation service address:', wallet.address);
  console.log('Contract address:', CONTRACT_ADDRESS);
  console.log('Oracle address:', BITCOIN_ORACLE_ADDRESS);
  console.log('');
}

// TESTING MODE: Resolve markets every 5 minutes instead of daily
// For production, use the commented-out functions below
function getNextMidnight() {
  const now = Math.floor(Date.now() / 1000);
  return now + (5 * 60); // 5 minutes from now
}

// Create new market 10 seconds after resolution
function getOneMinuteAfterMidnight() {
  return getNextMidnight() + 10; // 10 seconds after "midnight"
}

/* PRODUCTION MODE: Uncomment these for real daily markets
function getNextMidnight() {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0); // Next midnight
  return Math.floor(midnight.getTime() / 1000);
}

function getOneMinuteAfterMidnight() {
  return getNextMidnight() + 60;
}
*/

// Check if there's an active daily market
async function getActiveDailyMarket() {
  try {
    const marketCount = await contract.getMarketCount();

    for (let i = marketCount - 1n; i >= 0n; i--) {
      const market = await contract.getMarket(i);

      // Check if it's a DAILY_OVER_UNDER market (marketType = 1)
      // Convert to Number for comparison
      if (Number(market.marketType) === 1 && market.isAutomatic && !market.resolved) {
        return {
          id: i,
          ...market
        };
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting active daily market:', error.message);
    return null;
  }
}

// Create a new daily over/under market
async function createDailyMarket() {
  try {
    console.log('Creating new daily over/under market...');

    // Get current price
    const roundData = await oracle.latestRoundData();
    const currentPrice = roundData.answer;
    console.log('Current price:', ethers.formatUnits(currentPrice, 8));

    // Random change with 50/50 chance of increment or decrement (41-341)
    const randomAmount = Math.floor(Math.random() * 301) + 41; // Random between 41 and 341
    const isIncrement = Math.random() >= 0.5; // 50/50 chance
    const priceChange = isIncrement ? randomAmount : -randomAmount;
    const newPrice = currentPrice + BigInt(priceChange * 1e8); // Convert to 8 decimals

    console.log(`Updating price by ${isIncrement ? '+' : ''}$${priceChange} to $${ethers.formatUnits(newPrice, 8)}`);
    const updateTx = await oracle.updateAnswer(newPrice);
    const updateReceipt = await updateTx.wait();
    console.log('Price updated! Tx:', updateReceipt.hash);

    // Small delay to ensure nonce is updated
    await new Promise(resolve => setTimeout(resolve, 500));

    const endTime = getNextMidnight();
    console.log('Market will end at:', new Date(endTime * 1000).toLocaleString());

    const tx = await contract.createDailyOverUnder(
      BITCOIN_ORACLE_ADDRESS,
      endTime
    );

    console.log('Transaction sent:', tx.hash);
    const receipt = await tx.wait();
    console.log('Market created! Gas used:', receipt.gasUsed.toString());
    console.log('');

    return true;
  } catch (error) {
    console.error('Error creating daily market:', error.message);
    return false;
  }
}

// Resolve the daily market
async function resolveDailyMarket(marketId) {
  try {
    console.log(`Resolving daily market #${marketId}...`);

    const tx = await contract.resolveMarket(marketId);
    console.log('Transaction sent:', tx.hash);

    const receipt = await tx.wait();
    console.log('Market resolved! Gas used:', receipt.gasUsed.toString());
    console.log('');

    return true;
  } catch (error) {
    console.error('Error resolving market:', error.message);
    return false;
  }
}

// Main job that runs every minute
async function checkAndExecute() {
  const now = Math.floor(Date.now() / 1000);
  const currentTime = new Date().toLocaleTimeString();

  console.log(`[${currentTime}] Checking for tasks...`);

  try {
    const activeDailyMarket = await getActiveDailyMarket();

    if (activeDailyMarket) {
      // Access using array indices since contract returns a tuple
      const marketEndTime = Number(activeDailyMarket[8]); // endTime is index 8
      const resolved = activeDailyMarket[9]; // resolved is index 9

      console.log(`Active daily market found (ID: ${activeDailyMarket.id})`);
      console.log(`End time: ${new Date(marketEndTime * 1000).toLocaleString()}`);
      console.log(`Resolved: ${resolved}`);
      console.log(`Time until end: ${Math.max(0, marketEndTime - now)}s`);

      // Check if it's time to resolve (at or after end time)
      if (!resolved && now >= marketEndTime) {
        console.log('Time to resolve the market!');
        const success = await resolveDailyMarket(activeDailyMarket.id);

        if (success) {
          // Wait 10 seconds then create new market
          console.log('Waiting 10 seconds before creating new market...');
          setTimeout(async () => {
            await createDailyMarket();
          }, 10000);
        }
      } else if (resolved) {
        // Market is resolved but new one hasn't been created yet
        const tenSecondsAfter = marketEndTime + 10;
        if (now >= tenSecondsAfter) {
          console.log('Creating new daily market (10 seconds after resolution)...');
          await createDailyMarket();
        }
      } else {
        // Market is active and not yet ready to resolve
        console.log('Market is active. Waiting for end time...');
      }
    } else {
      // No active daily market - create one
      console.log('No active daily market found. Creating one...');
      await createDailyMarket();
    }

  } catch (error) {
    console.error('Error in checkAndExecute:', error.message);
  }

  console.log('---');
}

// Start the service
async function start() {
  await initialize();

  console.log('Starting automation service...');
  console.log('Checking every minute for markets to resolve/create');
  console.log('Press Ctrl+C to stop');
  console.log('========================');
  console.log('');

  // Run immediately on start
  await checkAndExecute();

  // Then run every minute
  cron.schedule('* * * * *', async () => {
    await checkAndExecute();
  });
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down automation service...');
  process.exit(0);
});

// Start the service
start().catch(console.error);
