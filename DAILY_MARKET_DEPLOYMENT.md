# Daily Over/Under Market Deployment Guide

This guide will help you deploy and set up the daily Bitcoin over/under prediction market.

## What's New

The smart contract now supports two types of markets:

1. **RACE Markets** - Original functionality (first to reach target price wins)
2. **DAILY_OVER_UNDER Markets** - New! Daily Bitcoin price prediction (Over/Under)

## Prerequisites

- Anvil running locally (`anvil` in a terminal)
- Contracts compiled (`forge build` in contracts directory)
- Frontend dependencies installed (`npm install` in frontend directory)
- Automation service dependencies installed (`npm install` in automation-service directory)

## Step 1: Deploy Updated Contract

```bash
cd contracts

# Deploy the updated PredictionMarket contract
forge script script/Deploy.s.sol:DeployScript --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

After deployment, note the three addresses:
- **PredictionMarket**: Your main contract
- **MockGoldOracle**: Oracle for Gold price
- **MockETHOracle**: Oracle for ETH price (can be used as Bitcoin oracle for testing)

## Step 2: Update Frontend Environment

Update `frontend/.env.local` with the new contract address:

```bash
cd ../frontend

# Edit .env.local
NEXT_PUBLIC_CONTRACT_ADDRESS=<YOUR_NEW_PREDICTION_MARKET_ADDRESS>
```

## Step 3: Update Automation Service Environment

Update `automation-service/.env` with the contract and oracle addresses:

```bash
cd ../automation-service

# Edit .env
RPC_URL=http://localhost:8545
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
CONTRACT_ADDRESS=<YOUR_PREDICTION_MARKET_ADDRESS>
BITCOIN_ORACLE_ADDRESS=<YOUR_MOCK_ETH_ORACLE_ADDRESS>  # Using ETH oracle as Bitcoin for testing
```

## Step 4: Set Automation Service Address in Contract

The automation service needs permission to create and resolve daily markets:

```bash
# Get the automation service address (default is first Anvil account)
# Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

# Set it as the automation service in the contract
cast send <YOUR_PREDICTION_MARKET_ADDRESS> \
  "setAutomationService(address)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Step 5: Start All Services

You'll need **3 terminal windows**:

### Terminal 1: Anvil
```bash
anvil
```

### Terminal 2: Automation Service
```bash
cd automation-service
npm start
```

The automation service will:
- Check every minute for markets to resolve/create
- Create the first daily market immediately
- Resolve markets at midnight (00:00)
- Create new markets at 00:01 (1 minute after midnight)

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```

Visit http://localhost:3000 to see the application.

## How Daily Markets Work

### Market Creation
- Automation service creates market at 00:01 (1 minute after midnight)
- Fetches current Bitcoin price from oracle as "starting price"
- Sets market name: "Daily Bitcoin Over/Under"
- Sets outcomes: "Over" (price goes up) vs "Under" (price goes down or stays same)
- Sets end time to next midnight (00:00)

### Betting
- Users can bet "Over" or "Under" throughout the day
- "Over" wins if closing price > starting price
- "Under" wins if closing price <= starting price

### Resolution
- Automation service resolves at midnight (00:00)
- Compares closing price to starting price
- Winners share the losing pool (parimutuel betting)
- 2% protocol fee is deducted from winnings

### Claiming
- Winners can claim their winnings after resolution
- Payout = original bet + share of losing pool (minus 2% fee)

## Testing with Faster Intervals

For testing, you may want markets to resolve faster than daily. Edit `automation-service/index.js`:

```javascript
// Instead of next midnight, use 5 minutes from now
function getNextMidnight() {
  return Math.floor(Date.now() / 1000) + (5 * 60); // 5 minutes
}
```

This will create markets that resolve every 5 minutes instead of daily.

## Updating Oracle Prices

To simulate price changes for testing:

```bash
# Update the mock oracle price (example: set Bitcoin to $95,000)
cast send <BITCOIN_ORACLE_ADDRESS> \
  "updateAnswer(int256)" \
  9500000000000 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Manually Creating a Daily Market

If you want to manually create a daily market without the automation service:

```bash
# Calculate midnight timestamp (example: 1698105600 for specific date)
# Or use: date -d "tomorrow 00:00:00" +%s

cast send <PREDICTION_MARKET_ADDRESS> \
  "createDailyOverUnder(address,uint256)" \
  <BITCOIN_ORACLE_ADDRESS> \
  <MIDNIGHT_TIMESTAMP> \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Manually Resolving a Daily Market

```bash
cast send <PREDICTION_MARKET_ADDRESS> \
  "resolveMarket(uint256)" \
  <MARKET_ID> \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Creating Traditional RACE Markets

The original RACE market functionality still works:

```bash
cast send <PREDICTION_MARKET_ADDRESS> \
  "createMarket(string,string,string,address,address,int256,uint256)" \
  "Gold vs ETH to \$5000" \
  "Gold reaches \$5000 first" \
  "ETH reaches \$5000 first" \
  <GOLD_ORACLE_ADDRESS> \
  <ETH_ORACLE_ADDRESS> \
  500000000000 \
  30 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Troubleshooting

**Automation service shows "Only owner or automation service" error:**
- Make sure you ran `setAutomationService()` with the correct address

**Markets not appearing in frontend:**
- Check that CONTRACT_ADDRESS in frontend/.env.local matches deployed address
- Refresh the page or click the refresh button
- Check browser console for errors

**Oracle prices not updating:**
- Verify oracle address is correct
- Make sure you're sending the price with correct decimals (8 decimals, so $95,000 = 9500000000000)

**Markets not resolving:**
- Check that current timestamp >= market.endTime
- For daily markets, can only resolve at or after midnight

## Architecture Summary

```
┌─────────────┐
│   Anvil     │  Local blockchain
│  (Chain)    │
└──────┬──────┘
       │
       ├──────────┐──────────┐
       │          │          │
┌──────▼──────┐  │   ┌──────▼──────┐
│  Frontend   │  │   │ Automation  │
│  (Next.js)  │  │   │   Service   │
│             │  │   │  (Node.js)  │
└──────┬──────┘  │   └──────┬──────┘
       │         │          │
       │    ┌────▼──────────▼─────┐
       │    │  PredictionMarket   │
       └────►   Smart Contract    │
            │                     │
            │  - RACE markets     │
            │  - DAILY markets    │
            └─────────────────────┘
```

## Next Steps

- Deploy to a testnet (Sepolia, etc.) for persistent testing
- Integrate real Chainlink Bitcoin oracle
- Add more oracle options (ETH, SOL, etc.)
- Implement frontend filters to separate RACE vs DAILY markets
- Add historical data and statistics
