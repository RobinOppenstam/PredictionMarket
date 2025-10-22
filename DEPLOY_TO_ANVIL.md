# Deploy to Anvil - Step by Step Guide

Complete guide to deploy the pUSD-only prediction market system to Anvil (local blockchain).

---

## Prerequisites

- [ ] Foundry installed (forge, anvil, cast)
- [ ] Node.js and npm installed
- [ ] MetaMask or another Web3 wallet

---

## Step 1: Start Anvil

Open a new terminal and start Anvil:

```bash
anvil
```

**Expected Output**:
```
Available Accounts
==================
(0) 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
(1) 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 (10000 ETH)
...

Private Keys
==================
(0) 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
(1) 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
...

Listening on 127.0.0.1:8545
```

**✅ Keep this terminal open!** Anvil must stay running.

---

## Step 2: Deploy Smart Contracts

Open a **new terminal** and navigate to the contracts directory:

```bash
cd contracts
```

### Deploy all contracts:

```bash
~/.foundry/bin/forge script script/Deploy.s.sol:DeployLocalScript \
  --rpc-url http://localhost:8545 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Expected Output**:
```
=== Deploying LOCAL Prediction Market System ===

1. Deploying mock oracles...
   BTC Oracle: 0xc351628EB244ec633d5f21fBD6621e1a683B1181
   ETH Oracle: 0xFD471836031dc5108809D173A067e8486B9047A3
   Gold Oracle: 0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc

2. Deploying pUSD...
   pUSD deployed to: 0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f

3. Deploying Token Faucet...
   Faucet deployed to: 0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07

4. Configuring permissions...
   Faucet permissions granted

5. Deploying PredictionMarket...
   PredictionMarket deployed to: 0x922D6956C99E12DFeB3224DEA977D0939758A1Fe

6. Creating initial markets...
   Race market created (Market ID: 0)
   Daily Bitcoin market created (Market ID: 1, 5 min duration)

=== DEPLOYMENT SUMMARY ===

Token:
  pUSD: 0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f

Faucet:
  Address: 0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07

Prediction Market:
  Address: 0x922D6956C99E12DFeB3224DEA977D0939758A1Fe

Mock Oracles:
  BTC/USD: 0xc351628EB244ec633d5f21fBD6621e1a683B1181
  ETH/USD: 0xFD471836031dc5108809D173A067e8486B9047A3
  Gold/USD: 0xcbEAF3BDe82155F56486Fb5a1072cb8baAf547cc
```

**📝 IMPORTANT**: Copy these addresses! You'll need them in the next step.

---

## Step 3: Update Frontend Environment Variables

Open the frontend `.env.local` file:

```bash
cd ../frontend
nano .env.local
```

Update with your deployed addresses:

```env
# Smart Contract
NEXT_PUBLIC_CONTRACT_ADDRESS=0x922D6956C99E12DFeB3224DEA977D0939758A1Fe

# Token Contract (UPDATE THIS!)
NEXT_PUBLIC_PUSD_ADDRESS=0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f
NEXT_PUBLIC_FAUCET_ADDRESS=0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07

# RPC URLs
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_INFURA_KEY

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=YOUR_PROJECT_ID

# Deployment (for Foundry)
PRIVATE_KEY=YOUR_PRIVATE_KEY

# Etherscan (for verification)
ETHERSCAN_API_KEY=YOUR_API_KEY
```

**Save and exit** (Ctrl+X, Y, Enter in nano)

---

## Step 4: Update Automation Service Environment Variables

Open the automation service `.env` file:

```bash
cd ../automation-service
nano .env
```

Update with your deployed addresses:

```env
# RPC endpoint for blockchain connection
RPC_URL=http://localhost:8545

# Private key for the automation service wallet
PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

# PredictionMarket contract address (UPDATE THIS!)
CONTRACT_ADDRESS=0x922D6956C99E12DFeB3224DEA977D0939758A1Fe

# Bitcoin oracle address (UPDATE THIS!)
BITCOIN_ORACLE_ADDRESS=0xc351628EB244ec633d5f21fBD6621e1a683B1181
```

**Save and exit**

---

## Step 5: Set Automation Service Address in Contract

The automation service needs permission to create markets. Set it:

```bash
cd ../contracts

~/.foundry/bin/cast send \
  0x922D6956C99E12DFeB3224DEA977D0939758A1Fe \
  "setAutomationService(address)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Verify it worked**:

```bash
~/.foundry/bin/cast call \
  0x922D6956C99E12DFeB3224DEA977D0939758A1Fe \
  "automationService()(address)" \
  --rpc-url http://localhost:8545
```

**Expected**: Should return `0x000000000000000000000000f39fd6e51aad88f6f4ce6ab8827279cfffb92266`

---

## Step 6: Start Automation Service

Open a **new terminal**:

```bash
cd automation-service
node index.js
```

**Expected Output**:
```
Initializing automation service...
Using config: ./test-config.js
Connected to RPC: http://localhost:8545
Automation service address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Contract address: 0x922D6956C99E12DFeB3224DEA977D0939758A1Fe
Oracle address: 0xc351628EB244ec633d5f21fBD6621e1a683B1181

Starting automation service...
Checking every minute for markets to resolve/create
========================

[TIME] Checking for tasks...
Active daily market found (ID: 1)
End time: [DATE]
Resolved: false
Time until end: 295s
Market is active. Waiting for end time...
---
```

**✅ Keep this terminal open!** The service will auto-create and resolve markets every 5 minutes.

---

## Step 7: Start Frontend

Open a **new terminal**:

```bash
cd frontend
npm install  # First time only
npm run dev
```

**Expected Output**:
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - ready started server on 0.0.0.0:3000, url: http://localhost:3000
```

---

## Step 8: Configure MetaMask for Anvil

### Add Anvil Network to MetaMask:

1. Open MetaMask
2. Click network dropdown → **Add Network**
3. Click **Add a network manually**
4. Enter:
   - **Network Name**: Anvil Local
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH
5. Click **Save**

### Import Anvil Account:

1. Click account icon → **Import Account**
2. Select **Private Key**
3. Paste: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
4. Click **Import**

**✅ You should now see 10,000 ETH in your wallet!**

---

## Step 9: Test the Application

### Open the Frontend:

Go to: **http://localhost:3000**

### Test Flow:

#### **1. Connect Wallet**
- Click "Connect Wallet"
- Select MetaMask
- Approve connection
- ✅ You should see your address in the header

#### **2. Check Initial State**
- You should see:
  - pUSD Balance: 0.00 pUSD
  - Faucet card with "Claim Tokens" button
  - 2 markets (Race market and Daily Bitcoin market)

#### **3. Claim Tokens from Faucet**
- Click "Claim Tokens" in the Faucet card
- Approve transaction in MetaMask
- Wait for confirmation (should be instant)
- ✅ Your balance should update to: **10,000 pUSD**

#### **4. Place a Bet**
- Select a market (try the Daily Bitcoin market)
- Click either "Over" or "Under"
- Enter bet amount (e.g., 100)
- Click "Approve 100 pUSD"
- Approve in MetaMask
- Wait a moment...
- Button should auto-change to "Bet 100 pUSD on Over"
- Click the bet button
- Approve in MetaMask
- ✅ You should see:
  - Your pUSD balance decreased by 100
  - "Your Position" card showing your bet
  - Pool sizes updated

#### **5. Wait for Market Resolution**
- Daily Bitcoin markets resolve in 5 minutes
- Watch the countdown timer
- The automation service will auto-resolve it
- ✅ If you won, you'll see "You Won! 🎉" card
- Click "Claim Winnings"
- Receive payout in pUSD!

#### **6. Claim More Tokens (24hr cooldown)**
- After claiming once, you'll see a countdown timer
- For testing, you can reset it using cast:

```bash
~/.foundry/bin/cast send \
  0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07 \
  "resetClaimTime(address)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://localhost:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## Step 10: Monitor Everything

You should have **4 terminals open**:

### **Terminal 1: Anvil**
```
Listening on 127.0.0.1:8545
eth_blockNumber
eth_call
...
```
Shows all blockchain activity

### **Terminal 2: Automation Service**
```
[TIME] Checking for tasks...
Active daily market found (ID: 1)
Time until end: 250s
Market is active. Waiting for end time...
```
Shows market automation status

### **Terminal 3: Frontend**
```
  ▲ Next.js 14.x.x
  - Local:        http://localhost:3000
  - compiled client and server successfully
```
Your Next.js app

### **Terminal 4: Commands**
Use this for running cast commands and deployment

---

## Troubleshooting

### **Issue**: "Contract not deployed" error in frontend

**Solution**: Check that addresses in `.env.local` match deployment output

```bash
# Verify contract exists
cd contracts
~/.foundry/bin/cast code 0x922D6956C99E12DFeB3224DEA977D0939758A1Fe --rpc-url http://localhost:8545
```

Should return bytecode (long hex string), not `0x`

---

### **Issue**: Faucet claim fails

**Solution**: Check that faucet has permission to mint tokens

```bash
# Check pUSD faucet address
~/.foundry/bin/cast call 0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f "faucet()(address)" --rpc-url http://localhost:8545
```

Should return faucet address

---

### **Issue**: Approval transaction fails

**Solution**: Make sure you have enough ETH for gas

```bash
# Check ETH balance
~/.foundry/bin/cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545
```

---

### **Issue**: Automation service not creating markets

**Solution**: Verify automation service is authorized

```bash
~/.foundry/bin/cast call 0x922D6956C99E12DFeB3224DEA977D0939758A1Fe "automationService()(address)" --rpc-url http://localhost:8545
```

Should match automation wallet address (with leading zeros padded)

---

### **Issue**: Frontend shows old data

**Solution**:
1. Hard refresh (Ctrl+Shift+R)
2. Clear browser cache
3. Restart frontend dev server

---

### **Issue**: "Anvil not found" when deploying

**Solution**: Use full path to forge:

```bash
~/.foundry/bin/forge script script/Deploy.s.sol:DeployLocalScript ...
```

---

## Quick Restart (After First Setup)

If you need to restart everything:

### **1. Stop All Services**
- Ctrl+C in all terminal windows

### **2. Restart Anvil (Fresh State)**
```bash
# Anvil stores no persistent state, just restart it
anvil
```

### **3. Redeploy Contracts**
```bash
cd contracts
~/.foundry/bin/forge script script/Deploy.s.sol:DeployLocalScript --rpc-url http://localhost:8545 --broadcast --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### **4. Update .env files** with new addresses

### **5. Set automation service** in contract (see Step 5)

### **6. Restart services**:
```bash
# Terminal 1: Anvil (already running)

# Terminal 2: Automation
cd automation-service && node index.js

# Terminal 3: Frontend
cd frontend && npm run dev
```

---

## Useful Commands

### Check Token Balance:
```bash
# pUSD balance
~/.foundry/bin/cast call 0x1429859428C0aBc9C2C47C8Ee9FBaf82cFA0F20f "balanceOf(address)(uint256)" 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://localhost:8545
```

### Check Market Count:
```bash
~/.foundry/bin/cast call 0x922D6956C99E12DFeB3224DEA977D0939758A1Fe "getMarketCount()(uint256)" --rpc-url http://localhost:8545
```

### Update Oracle Price (for testing):
```bash
# Set BTC price to $96,000 (8 decimals: 96000 * 10^8)
~/.foundry/bin/cast send 0xc351628EB244ec633d5f21fBD6621e1a683B1181 "updateAnswer(int256)" 9600000000000 --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

### Give Yourself More Tokens (for testing):
```bash
# Claim another 10,000 pUSD from faucet
~/.foundry/bin/cast send 0xB0D4afd8879eD9F52b28595d31B441D079B2Ca07 "claim()" --rpc-url http://localhost:8545 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

---

## Success Checklist

- [ ] Anvil running (Terminal 1)
- [ ] Contracts deployed successfully
- [ ] Environment variables updated
- [ ] Automation service running (Terminal 2)
- [ ] Frontend running on http://localhost:3000 (Terminal 3)
- [ ] MetaMask connected to Anvil network
- [ ] Can claim 10,000 pUSD from faucet
- [ ] Can place bets on markets with pUSD
- [ ] Can see live countdown timers
- [ ] Automation service auto-resolves markets
- [ ] Can claim winnings in pUSD

---

## 🎉 You're Done!

Your complete pUSD-only prediction market is now running on Anvil!

### What Changed (pUSD-Only System):
- ✅ **Removed pETH** - System now uses only pUSD
- ✅ **Increased faucet** - Now gives 10,000 pUSD (was 5,000 pUSD + 1 pETH)
- ✅ **Simplified UI** - No token selection needed
- ✅ **Fair betting** - All users bet with same currency
- ✅ **Correct odds** - No mixed-token pool issues

**Enjoy testing!** 🚀

For testnet deployment, see [TESTNET_DEPLOYMENT_GUIDE.md](TESTNET_DEPLOYMENT_GUIDE.md)
