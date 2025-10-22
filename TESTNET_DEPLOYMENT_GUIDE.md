# Testnet Deployment Guide (Sepolia)

This guide will walk you through deploying the Prediction Market with daily Bitcoin over/under markets to Sepolia testnet.

## Prerequisites

- [ ] Sepolia testnet ETH (get from [Alchemy faucet](https://sepoliafaucet.com/) or [Chainlink faucet](https://faucets.chain.link/sepolia))
- [ ] Alchemy account with Sepolia RPC endpoint
- [ ] Two separate wallets:
  - **Deployer wallet**: Will own the contract and pay for deployment
  - **Automation wallet**: Will run the automation service (needs ~0.5 ETH for gas)

## Step 1: Prepare Your Environment Variables

### 1.1 Contract Deployment (.env in contracts folder)

```bash
cd contracts
```

Create/update `contracts/.env`:

```env
# Your deployer wallet private key (must have Sepolia ETH)
PRIVATE_KEY=your_deployer_private_key_here

# Alchemy Sepolia RPC URL
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Etherscan API key for contract verification
ETHERSCAN_API_KEY=your_etherscan_api_key
```

**Security Note**: NEVER commit your private keys to git!

---

## Step 2: Deploy Smart Contracts

### 2.1 Deploy to Sepolia

```bash
cd contracts

# Deploy the contract
forge script script/Deploy.s.sol:DeployScript \
  --rpc-url $SEPOLIA_RPC_URL \
  --broadcast \
  --verify \
  --etherscan-api-key $ETHERSCAN_API_KEY
```

### 2.2 Save Deployment Addresses

The script will output important addresses. **Save these**:

```
PredictionMarket deployed to: 0x... (SAVE THIS!)
Bitcoin Oracle: 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
Gold Oracle: 0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea
ETH Oracle: 0x694AA1769357215DE4FAC081bf1f309aDC325306
```

**You need**:
- PredictionMarket contract address
- Bitcoin Oracle address (0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43)

---

## Step 3: Set Automation Service Address

You need to authorize your automation wallet to create/resolve markets.

### 3.1 Using Cast (Foundry)

```bash
# Replace with your actual addresses
MARKET_ADDRESS=0x...  # Your deployed PredictionMarket address
AUTOMATION_WALLET=0x...  # Your automation wallet address (NOT private key!)

cast send $MARKET_ADDRESS \
  "setAutomationService(address)" \
  $AUTOMATION_WALLET \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $PRIVATE_KEY
```

### 3.2 Verify It Worked

```bash
cast call $MARKET_ADDRESS "automationService()(address)" --rpc-url $SEPOLIA_RPC_URL
```

Should return your automation wallet address.

---

## Step 4: Configure Automation Service

### 4.1 Setup Environment Variables

```bash
cd ../automation-service
```

Create/update `automation-service/.env`:

```env
# Sepolia RPC URL
RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# Automation wallet private key (NOT the deployer key!)
PRIVATE_KEY=your_automation_wallet_private_key

# PredictionMarket contract address from Step 2
CONTRACT_ADDRESS=0x...

# Bitcoin oracle address (Sepolia)
BITCOIN_ORACLE_ADDRESS=0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43

# Use production config (24-hour markets)
USE_PRODUCTION_CONFIG=true
```

### 4.2 Install Dependencies

```bash
npm install
```

### 4.3 Test the Configuration

```bash
# Quick test run (will check connection and market status)
node index.js
```

Press Ctrl+C after you see it's working correctly.

---

## Step 5: Run Automation Service

You have several options for running the automation service:

### Option A: Local Machine (for testing)

```bash
cd automation-service
npm start
```

**Pros**: Easy to monitor and debug
**Cons**: Must keep your computer running 24/7

### Option B: VPS/Cloud Server (recommended)

Deploy to a cloud server like:
- DigitalOcean ($6/month)
- AWS EC2
- Google Cloud
- Heroku

**Setup on Ubuntu VPS**:

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone your repo
git clone YOUR_REPO_URL
cd prediction-market/automation-service

# Install dependencies
npm install

# Create .env file with your production values
nano .env

# Install PM2 for process management
sudo npm install -g pm2

# Start the service
pm2 start index.js --name prediction-market-automation

# Make it auto-start on server reboot
pm2 startup
pm2 save

# Monitor logs
pm2 logs prediction-market-automation
```

### Option C: Docker (advanced)

Create `automation-service/Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]
```

Run with:
```bash
docker build -t prediction-market-automation .
docker run -d --env-file .env --name automation prediction-market-automation
```

---

## Step 6: Configure Frontend

### 6.1 Update Frontend Environment

```bash
cd ../frontend
```

Update `frontend/.env.local`:

```env
# Your deployed contract address
NEXT_PUBLIC_CONTRACT_ADDRESS=0x...

# Sepolia RPC URL
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_API_KEY

# WalletConnect Project ID
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### 6.2 Update Chain Configuration

The frontend is already configured for Sepolia. Just verify in `frontend/app/providers.tsx` that Sepolia is included in the chains.

### 6.3 Test Locally

```bash
npm run dev
```

Visit http://localhost:3000 and connect with MetaMask on Sepolia network.

---

## Step 7: Deploy Frontend

### Option A: Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_CONTRACT_ADDRESS`
   - `NEXT_PUBLIC_SEPOLIA_RPC_URL`
   - `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID`
5. Deploy!

### Option B: Netlify

1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy the `out` folder to Netlify

### Option C: Self-hosted

```bash
npm run build
npm start  # Runs on port 3000
```

---

## Verification Checklist

After deployment, verify everything is working:

- [ ] Smart contract is deployed and verified on Sepolia Etherscan
- [ ] Automation service address is set in the contract
- [ ] Automation service is running and creating markets every 24 hours
- [ ] Frontend connects to Sepolia network
- [ ] Can place bets on markets
- [ ] Markets show correct countdown timers
- [ ] Markets auto-resolve after 24 hours
- [ ] Can claim winnings after market resolution

---

## Monitoring & Maintenance

### Check Automation Service Logs

**PM2**:
```bash
pm2 logs prediction-market-automation
```

**Docker**:
```bash
docker logs -f automation
```

### Monitor Market Creation

Markets should be created at midnight UTC every day. Check the logs around that time.

### Check Automation Wallet Balance

The automation wallet needs ETH for gas. Monitor and refill when needed:

```bash
cast balance YOUR_AUTOMATION_WALLET --rpc-url $SEPOLIA_RPC_URL
```

### Emergency Stop

If you need to stop market creation:

```bash
# Revoke automation service access
cast send $MARKET_ADDRESS \
  "setAutomationService(address)" \
  0x0000000000000000000000000000000000000000 \
  --rpc-url $SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY
```

---

## Testnet Specifics

### Chainlink Oracles on Sepolia

- **BTC/USD**: `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43`
- **ETH/USD**: `0x694AA1769357215DE4FAC081bf1f309aDC325306`
- **Gold/USD**: `0xC5981F461d74c46eB4b0CF3f4Ec79f025573B0Ea`

### Get Testnet ETH

- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Chainlink Faucet](https://faucets.chain.link/sepolia)
- [Infura Faucet](https://www.infura.io/faucet/sepolia)

### Sepolia Block Explorer

View your contract and transactions:
- https://sepolia.etherscan.io

---

## Troubleshooting

### "Insufficient funds" error

Your automation wallet needs more Sepolia ETH. Get some from faucets.

### Markets not being created

1. Check automation service logs
2. Verify automation wallet is authorized: `cast call $MARKET_ADDRESS "automationService()(address)"`
3. Check automation wallet has ETH for gas
4. Verify `USE_PRODUCTION_CONFIG=true` in automation service .env

### Frontend not connecting

1. Make sure MetaMask is on Sepolia network
2. Verify `NEXT_PUBLIC_CONTRACT_ADDRESS` is correct
3. Check browser console for errors

### Markets resolving immediately

You might be using test config instead of production config. Make sure `USE_PRODUCTION_CONFIG=true` in automation service.

---

## Next Steps: Mainnet Deployment

Once everything works on Sepolia:

1. Use same deployment process but with mainnet RPC URLs
2. Use Chainlink mainnet oracle addresses
3. Ensure automation wallet is well-funded (mainnet gas is expensive!)
4. Consider multi-sig wallet for contract ownership
5. Get a professional audit before handling real money

---

## Support

- Foundry docs: https://book.getfoundry.sh/
- Chainlink price feeds: https://docs.chain.link/data-feeds/price-feeds/addresses
- Next.js deployment: https://nextjs.org/docs/deployment

Good luck with your deployment! 🚀
