# PredictMarket

A decentralized prediction market platform where users can bet on real-world events using blockchain technology and Chainlink oracles.

## What is PredictMarket?

PredictMarket is a trustless betting platform that allows users to speculate on future outcomes of various events. Using smart contracts on Ethereum, the platform ensures transparent, automated, and fair resolution of markets based on real-world data from Chainlink price feeds.

## Key Features

### 🎯 Multiple Market Types
- **Daily Over/Under Markets**: Bet on whether Bitcoin will end the day higher or lower than the opening price
- **Price Race Markets**: Predict which asset will reach a target price first (e.g., Gold vs ETH to $5,000)

### 💰 Simple Token System
- **pUSD**: The betting currency used across all markets
- **Token Faucet**: Get $10,000 pUSD every 24 hours to start betting
- All bets and winnings are denominated in pUSD

### 🔮 Powered by Chainlink Oracles
- Real-time price data from trusted Chainlink price feeds
- Automated market resolution based on oracle data
- Support for BTC/USD, ETH/USD, Gold/USD, and more

### 📊 Dynamic Odds & Pool-Based Betting
- Odds adjust in real-time based on how much is bet on each outcome
- The more people bet on one side, the lower the potential payout
- Winners share the losing pool proportionally to their bet size

### 🏆 Fair & Transparent
- All logic executed on-chain via smart contracts
- 2% protocol fee on winnings
- Claim your winnings instantly after market resolution
- No centralized authority can manipulate outcomes

## How It Works

1. **Connect Wallet**: Connect your Web3 wallet to the platform
2. **Claim Tokens**: Visit the faucet to claim free pUSD tokens
3. **Browse Markets**: View active markets with live odds and time remaining
4. **Place Bets**: Select an outcome and bet your pUSD
5. **Wait for Resolution**: Markets resolve automatically using Chainlink oracles
6. **Claim Winnings**: If you win, claim your payout with one click

## Project Structure

```
prediction-market/
├── contracts/         # Smart contracts (Solidity + Foundry)
├── frontend/          # Web interface (Next.js + TypeScript)
└── automation-service/ # Background service for daily market creation
```

## Getting Started

Each component has its own setup instructions:
- **Contracts**: See [contracts/README.md](contracts/README.md)
- **Frontend**: See [frontend/README.md](frontend/README.md)
- **Automation**: See [automation-service/README.md](automation-service/README.md)

## Technology Stack

- **Smart Contracts**: Solidity 0.8.20, OpenZeppelin, Chainlink
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Wagmi, Viem
- **Blockchain**: Ethereum (Sepolia testnet ready)
- **Oracles**: Chainlink Price Feeds

## Live Markets

PredictMarket automatically creates new daily Bitcoin over/under markets at midnight, giving users fresh betting opportunities every day. Additional markets can be created for special events or long-term predictions.
