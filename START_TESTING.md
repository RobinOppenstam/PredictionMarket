# Quick Start Guide - 5 Minute Testing Mode

## ✅ Deployment Complete!

Your contracts have been deployed and configured for 5-minute market cycles.

### Deployed Addresses

```
PredictionMarket:       0x610178dA211FEF7D417bC0e6FeD39F05609AD788
Gold Oracle:            0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea
ETH/BTC Oracle:         0x694AA1769357215DE4FAC081bf1f309aDC325306
Automation Service:     0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

### Configuration

- ✅ Automation service configured with 5-minute market cycles
- ✅ Contract set with automation service address
- ✅ Frontend environment updated
- ✅ All services ready to start

## Starting the Services

You'll need **3 terminal windows**:

### Terminal 1: Anvil (Already Running)
If Anvil isn't running, start it:
```bash
anvil
```

Keep this running in the background.

### Terminal 2: Automation Service
```bash
cd automation-service
npm start
```

**What you'll see:**
```
Initializing automation service...
Connected to RPC: http://localhost:8545
Automation service address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Contract address: 0x610178dA211FEF7D417bC0e6FeD39F05609AD788

Starting automation service...
Checking every minute for markets to resolve/create
Press Ctrl+C to stop
========================

[12:34:56 PM] Checking for tasks...
No active daily market found. Creating one...
Creating new daily over/under market...
Market will end at: [5 minutes from now]
Transaction sent: 0x...
Market created! Gas used: 300794
```

The service will:
- Create a daily market immediately
- Resolve it after 5 minutes
- Create a new one 10 seconds later
- Repeat forever

### Terminal 3: Frontend
```bash
cd frontend
npm run dev
```

Then open http://localhost:3000

## How to Test

### 1. See the Daily Market

Once the automation service starts, you should see a market called:
**"Daily Bitcoin Over/Under"**

- Starting Price: $1,800 (current ETH oracle price)
- Outcomes: "Over" vs "Under"
- Time remaining: ~5 minutes

### 2. Place a Bet

1. Connect your wallet (use MetaMask with Anvil/Localhost network)
2. Import an Anvil test account:
   - Private key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` (Account #1)
   - This account has 10,000 ETH
3. Click "Over" or "Under"
4. Enter amount (e.g., 0.5 ETH)
5. Click "Bet" and confirm transaction

### 3. Wait for Resolution (5 minutes)

Watch the countdown timer. The market will automatically resolve in 5 minutes.

**To speed up testing, update the price:**

```bash
# Increase price (Over wins)
cast send 0x694AA1769357215DE4FAC081bf1f309aDC325306 \
  "updateAnswer(int256)" \
  2000_00000000 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# Or decrease price (Under wins)
cast send 0x694AA1769357215DE4FAC081bf1f309aDC325306 \
  "updateAnswer(int256)" \
  1500_00000000 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### 4. See Results & Claim

After 5 minutes:
- Market automatically resolves
- You'll see either "You Won! 🎉" or "You Lost 😔"
- If you won, click "Claim Winnings"
- A new market is created 10 seconds later

### 5. Create a RACE Market (Optional)

You can also create traditional race markets:

```bash
cast send 0x610178dA211FEF7D417bC0e6FeD39F05609AD788 \
  "createMarket(string,string,string,address,address,int256,uint256)" \
  "Gold vs ETH to \$2500" \
  "Gold reaches \$2500 first" \
  "ETH reaches \$2500 first" \
  0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea \
  0x694AA1769357215DE4FAC081bf1f309aDC325306 \
  250000000000 \
  30 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Testing Scenarios

### Scenario 1: Quick Win/Loss Cycle
1. Start all services
2. Wait for market to be created
3. Bet on "Over" with 1 ETH
4. Increase oracle price immediately
5. Wait 5 minutes for resolution
6. Claim winnings
7. See new market created

### Scenario 2: Multiple Players
1. Open two browsers (or incognito)
2. Import different Anvil accounts
3. One bets "Over", one bets "Under"
4. Change price
5. Wait for resolution
6. Winner claims, loser gets nothing

### Scenario 3: Market Cycle
1. Watch the automation service logs
2. See markets being created every ~5 minutes
3. Multiple markets resolve and new ones created
4. All automatic!

## Troubleshooting

**Markets not appearing?**
- Check automation service is running
- Check contract address in frontend/.env.local
- Refresh the page

**"Only owner or automation service" error?**
- Verify setAutomationService was called (done ✅)
- Check automation service address is correct

**Transactions failing?**
- Make sure you're connected to Localhost (Chain ID 31337)
- Check you have enough ETH in your account
- Verify you imported an Anvil account

**Prices not updating?**
- The oracle price is mocked, so use cast send to update it
- Format: Price with 8 decimals (e.g., $1800 = 1800_00000000)

## Useful Commands

### Check Current Oracle Price
```bash
cast call 0x694AA1769357215DE4FAC081bf1f309aDC325306 "latestRoundData()" --rpc-url http://localhost:8545
```

### Check Market Count
```bash
cast call 0x610178dA211FEF7D417bC0e6FeD39F05609AD788 "getMarketCount()" --rpc-url http://localhost:8545
```

### Check Your Balance
```bash
cast balance 0xYOUR_ADDRESS --rpc-url http://localhost:8545
```

### Manually Resolve Market
```bash
cast send 0x610178dA211FEF7D417bC0e6FeD39F05609AD788 \
  "resolveMarket(uint256)" \
  1 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

## Stopping Services

1. **Automation Service**: Press `Ctrl+C` in Terminal 2
2. **Frontend**: Press `Ctrl+C` in Terminal 3
3. **Anvil**: Press `Ctrl+C` in Terminal 1 (will clear all data)

## Switching to Production Mode

To use real daily markets (midnight resolution):

Edit `automation-service/index.js`:
1. Comment out the TESTING MODE functions (lines 37-47)
2. Uncomment the PRODUCTION MODE functions (lines 49-59)
3. Restart the automation service

## Next Steps

- ✅ Test betting and claiming
- ✅ Try both Over and Under outcomes
- ✅ Watch multiple market cycles
- ✅ Test with multiple users
- Deploy to testnet (Sepolia) when ready
- Integrate real Chainlink BTC/USD oracle

Have fun testing! 🚀
