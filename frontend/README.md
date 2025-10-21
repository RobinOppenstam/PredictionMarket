# PredictMarket - Decentralized Prediction Market dApp

A full-stack prediction market platform built on Ethereum using Chainlink oracles for trustless outcome resolution. Users can bet on whether Gold or Ethereum will reach $5,000 first, with the ability to add more markets and oracles.

## 🏗️ Tech Stack

### Smart Contracts
- **Solidity ^0.8.20** - Smart contract development
- **Foundry** - Development framework, testing, and deployment
- **Chainlink Price Feeds** - Decentralized oracle network for price data
- **OpenZeppelin** - Secure, audited contract standards

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Wagmi v2** - React hooks for Ethereum
- **Viem** - TypeScript interface for Ethereum
- **shadcn/ui** - Beautiful, accessible UI components
- **Tailwind CSS** - Utility-first styling
- **Sonner** - Toast notifications

## ✨ Features

- 🎲 **Create Prediction Markets** - Owner can create markets with custom oracles
- 💰 **Place Bets** - Bet ETH on either outcome
- 📊 **Live Odds** - Real-time calculation based on pool ratios
- 🔮 **Oracle Integration** - Chainlink price feeds determine winners
- 🏆 **Claim Winnings** - Winners claim proportional share of losing pool
- 💸 **Protocol Fees** - Configurable fee system (default 2%)
- 🔄 **Market Resolution** - Anyone can resolve markets after end time
- 📱 **Responsive Design** - Works on desktop and mobile

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Foundry ([installation guide](https://book.getfoundry.sh/getting-started/installation))
- MetaMask or another Web3 wallet

### Smart Contract Setup

1. **Clone and navigate to contract directory:**
```bash
mkdir prediction-market && cd prediction-market
forge init
```

2. **Install dependencies:**
```bash
forge install OpenZeppelin/openzeppelin-contracts
forge install smartcontractkit/chainlink
```

3. **Add contracts:**
Create `src/PredictionMarket.sol` and paste the contract code.
Create `script/Deploy.s.sol` and paste the deployment script.
Create `test/PredictionMarket.t.sol` and paste the test code.

4. **Set up environment:**
```bash
cp .env.example .env
# Edit .env with your private key and RPC URLs
```

5. **Run tests:**
```bash
forge test -vvv
```

6. **Deploy to Anvil (local):**
```bash
# Terminal 1: Start Anvil
anvil

# Terminal 2: Deploy
forge script script/Deploy.s.sol:DeployLocalScript --rpc-url http://127.0.0.1:8545 --broadcast
```

7. **Deploy to Sepolia:**
```bash
forge script script/Deploy.s.sol:DeployScript --rpc-url $SEPOLIA_RPC_URL --broadcast --verify
```

### Frontend Setup

1. **Create Next.js app:**
```bash
npx create-next-app@latest frontend --typescript --tailwind --app
cd frontend
```

2. **Install dependencies:**
```bash
npm install wagmi viem @tanstack/react-query
npm install sonner lucide-react
npm install class-variance-authority clsx tailwind-merge tailwindcss-animate
```

3. **Install shadcn/ui:**
```bash
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog dropdown-menu input label progress badge
```

4. **Set up project structure:**
```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/ (shadcn components)
│   ├── MarketCard.tsx
│   ├── ConnectButton.tsx
│   ├── CreateMarketDialog.tsx
│   └── Web3Provider.tsx
├── hooks/
│   ├── useMarkets.ts
│   └── useMarketActions.ts
├── lib/
│   ├── contracts.ts
│   ├── wagmi.ts
│   └── utils.ts
└── types/
    └── index.ts
```

5. **Configure environment:**
```bash
cp .env.example .env.local
# Add your contract address and RPC URLs
```

6. **Get WalletConnect Project ID:**
- Visit [WalletConnect Cloud](https://cloud.walletconnect.com/)
- Create a project and get your Project ID
- Add to `.env.local`

7. **Run development server:**
```bash
npm run dev
```

Visit `http://localhost:3000`

## 📝 Contract Addresses

### Sepolia Testnet
- **ETH/USD Oracle:** `0x694AA1769357215DE4FAC081bf1f309aDC325306`
- **BTC/USD Oracle:** `0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43`
- **Your Contract:** Deploy and add here

### Local Development (Anvil)
Mock oracles are deployed automatically with the contract.

## 🎮 Usage

### For Users

1. **Connect Wallet** - Click "Connect Wallet" and choose your provider
2. **Browse Markets** - View active prediction markets
3. **Place Bets** - Select an outcome and enter your bet amount
4. **Monitor Progress** - Watch odds change as more bets come in
5. **Claim Winnings** - After market resolves, winners can claim their share

### For Market Creators (Owner)

1. **Create Market**:
   - Set market name and descriptions
   - Specify two Chainlink oracle addresses
   - Set target price
   - Choose duration in days

2. **Example Oracles**:
   - Gold/USD: Use BTC/USD as proxy on testnets
   - ETH/USD: Native feed available
   - Custom: Any Chainlink price feed

## 🧪 Testing

### Smart Contract Tests

```bash
# Run all tests
forge test

# Run with verbosity
forge test -vvv

# Run specific test
forge test --match-test testPlaceBet -vvv

# Gas report
forge test --gas-report

# Coverage
forge coverage
```

### Frontend Testing

```bash
# Coming soon: Add your preferred testing framework
# Example: Vitest, Jest, Playwright
```

## 🔧 Configuration

### Update Protocol Fee

```solidity
// Only owner can call
predictionMarket.setProtocolFee(300); // 3%
```

### Add New Markets

Markets can be created for any asset pair with Chainlink oracles:
- Commodities (Gold, Silver, Oil)
- Cryptocurrencies (BTC, ETH, SOL)
- Forex pairs (EUR/USD, GBP/USD)
- Stocks (via synthetic assets)

### Chainlink Oracle Finder

Find oracle addresses at: [Chainlink Data Feeds](https://docs.chain.link/data-feeds/price-feeds/addresses)

## 🏛️ Contract Architecture

```
PredictionMarket
├── Ownable (OpenZeppelin)
├── ReentrancyGuard (OpenZeppelin)
├── Markets []
│   ├── Market Details
│   ├── Oracle Addresses
│   ├── Betting Pools
│   └── Resolution Status
└── User Bets mapping
    └── marketId => user => Bet
```

## 🔐 Security Features

- ✅ ReentrancyGuard on all state-changing functions
- ✅ Ownable for admin functions
- ✅ Input validation on all parameters
- ✅ No arbitrary external calls
- ✅ Pull payment pattern for winnings
- ✅ Time-locked resolution mechanism

## 🛣️ Roadmap

- [ ] Multi-chain deployment (Polygon, Arbitrum, Optimism)
- [ ] Advanced market types (ranges, multiple outcomes)
- [ ] Liquidity pools for market making
- [ ] Governance token and DAO
- [ ] Mobile app (React Native)
- [ ] Market aggregation and discovery
- [ ] Social features (profiles, leaderboards)
- [ ] Automated market makers (AMMs)

## 📚 Resources

- [Foundry Book](https://book.getfoundry.sh/)
- [Chainlink Documentation](https://docs.chain.link/)
- [Wagmi Documentation](https://wagmi.sh/)
- [shadcn/ui](https://ui.shadcn.com/)
- [OpenZeppelin Contracts](https://docs.openzeppelin.com/contracts/)

## ⚠️ Disclaimer

This is experimental software provided as-is. Use at your own risk. Always audit smart contracts before deploying to mainnet with real funds.

## 📄 License

MIT License - see LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

---

Built with ❤️ using Chainlink Oracles