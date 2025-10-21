# Daily Bitcoin Over/Under Markets - Implementation Summary

## Overview

I've successfully implemented automatic daily Bitcoin over/under prediction markets that resolve at midnight and automatically create new markets the next day.

## What Was Built

### 1. Smart Contract Updates ([contracts/src/PredictionMarket.sol](contracts/src/PredictionMarket.sol))

**New Features:**
- `MarketType` enum with `RACE` and `DAILY_OVER_UNDER` types
- Extended `Market` struct with:
  - `marketType`: Type of market (RACE or DAILY_OVER_UNDER)
  - `creationPrice`: Starting price for daily markets
  - `isAutomatic`: Flag for automation-managed markets
- `createDailyOverUnder()`: Creates daily over/under markets
- `setAutomationService()`: Grants automation service permission
- Updated `resolveMarket()`: Handles both market types differently
  - Daily markets: Compare closing price to starting price
  - Race markets: Original logic (first to target wins)

**Resolution Logic for Daily Markets:**
- Can only resolve at or after midnight (endTime)
- "Over" wins if closing price > starting price
- "Under" wins if closing price <= starting price

### 2. Automation Service ([automation-service/](automation-service/))

**Node.js service that runs continuously:**
- Checks every minute for markets to resolve/create
- At midnight (00:00): Resolves yesterday's daily market
- At 00:01 (1 minute after): Creates new daily market
- Uses ethers.js v6 and node-cron for scheduling

**Files:**
- `index.js`: Main automation logic
- `package.json`: Dependencies (ethers, node-cron, dotenv)
- `.env`: Configuration (RPC URL, private key, addresses)
- `README.md`: Setup and usage instructions

### 3. Frontend Updates

**Type Definitions ([frontend/types/index.ts](frontend/types/index.ts)):**
- Added `MarketType` enum
- Extended `Market` interface with new fields

**Hooks ([frontend/hooks/useMarkets.ts](frontend/hooks/useMarkets.ts)):**
- Updated to fetch new market fields from contract

**UI ([frontend/components/MarketCard.tsx](frontend/components/MarketCard.tsx)):**
- Shows "Starting Price" for daily markets instead of "Target Price"
- Displays "Will resolve at midnight (00:00)" message
- Same betting and claiming UI works for both market types

### 4. Documentation

- **[DAILY_MARKET_DEPLOYMENT.md](DAILY_MARKET_DEPLOYMENT.md)**: Complete deployment guide
- **[automation-service/README.md](automation-service/README.md)**: Automation service docs
- **[DAILY_MARKETS_SUMMARY.md](DAILY_MARKETS_SUMMARY.md)**: This file

## How It Works

### Daily Market Lifecycle

```
00:01 - Market Created
│       Starting Price: $94,500 (current BTC price)
│       Outcomes: Over | Under
│
├── Users bet throughout the day
│
23:59 - Betting still open
│
00:00 - Market Resolves
│       Closing Price: $95,200
│       Winner: Over (because $95,200 > $94,500)
│       Winners can now claim
│
00:01 - New Market Created
        Starting Price: $95,200 (new current price)
        Cycle repeats...
```

### Automation Flow

```javascript
Every minute:
  ├─ Get active daily market
  │
  ├─ If market exists and NOT resolved:
  │   └─ If time >= midnight:
  │       ├─ Resolve market
  │       └─ Wait 60s, then create new market
  │
  ├─ If market exists and IS resolved:
  │   └─ If 60+ seconds passed:
  │       └─ Create new market
  │
  └─ If no active market:
      └─ Create new market immediately
```

## Deployment Steps

1. **Deploy updated contract** with `forge script`
2. **Update frontend** `.env.local` with new contract address
3. **Update automation service** `.env` with contract and oracle addresses
4. **Set automation service address** in contract with `setAutomationService()`
5. **Start all services**: Anvil + Automation Service + Frontend

See [DAILY_MARKET_DEPLOYMENT.md](DAILY_MARKET_DEPLOYMENT.md) for detailed commands.

## Testing

### Quick Testing (5-minute markets instead of daily)

Edit `automation-service/index.js`:

```javascript
function getNextMidnight() {
  // Instead of next midnight, resolve in 5 minutes
  return Math.floor(Date.now() / 1000) + (5 * 60);
}
```

### Simulate Price Changes

```bash
# Update Bitcoin price to $95,000
cast send <ORACLE_ADDRESS> \
  "updateAnswer(int256)" \
  9500000000000 \
  --rpc-url http://localhost:8545 \
  --private-key <KEY>
```

## Architecture

```
┌──────────────────────────────────────────┐
│          Frontend (Next.js)              │
│  - Displays both RACE and DAILY markets  │
│  - Shows starting price for daily        │
│  - Same betting/claiming UI              │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│      PredictionMarket Contract           │
│                                          │
│  ┌─────────────────┬─────────────────┐  │
│  │  RACE Markets   │ DAILY Markets   │  │
│  ├─────────────────┼─────────────────┤  │
│  │ First to target │ Over vs Under   │  │
│  │ Early resolution│ Midnight only   │  │
│  │ Manual creation │ Auto creation   │  │
│  └─────────────────┴─────────────────┘  │
└────────────▲─────────────────────────────┘
             │
             │
┌────────────┴─────────────────────────────┐
│    Automation Service (Node.js)          │
│  - Creates daily markets at 00:01        │
│  - Resolves markets at 00:00             │
│  - Runs continuously, checks every min   │
└──────────────────────────────────────────┘
```

## Key Design Decisions

1. **Two Market Types**: Kept original RACE markets, added new DAILY type
   - Allows both types to coexist
   - Clean separation of concerns

2. **Automation Service**: Off-chain automation (Option B)
   - Simpler for local development
   - Can migrate to Chainlink Automation later
   - No LINK tokens needed for testing

3. **Permission System**: `automationService` address
   - Only owner or automation service can create daily markets
   - Prevents unauthorized market creation

4. **Resolution Time**: Strict midnight enforcement
   - Daily markets can ONLY resolve at/after endTime
   - Prevents early resolution
   - Ensures fair betting period

5. **Price Comparison**: Over vs Under logic
   - "Over" wins if closing > starting
   - "Under" wins if closing <= starting
   - Simple, clear, easy to understand

## Future Enhancements

- [ ] Deploy to testnet (Sepolia)
- [ ] Integrate real Chainlink BTC/USD oracle
- [ ] Add frontend filter to separate RACE vs DAILY markets
- [ ] Support multiple daily markets (BTC, ETH, SOL, etc.)
- [ ] Add historical data and charts
- [ ] Implement Chainlink Automation for decentralized automation
- [ ] Add market statistics (volume, participation, etc.)
- [ ] Support custom time intervals (hourly, weekly, etc.)

## Backwards Compatibility

✅ All existing functionality preserved:
- Original RACE markets still work
- Same betting mechanism
- Same claiming process
- Frontend displays both types

## Files Changed/Added

### Modified:
- `contracts/src/PredictionMarket.sol` - Added daily market support
- `contracts/foundry.toml` - Enabled via-ir for compilation
- `frontend/types/index.ts` - Added MarketType enum and fields
- `frontend/hooks/useMarkets.ts` - Fetch new market fields
- `frontend/components/MarketCard.tsx` - Display daily markets

### Added:
- `automation-service/` - Complete automation service
  - `index.js`
  - `package.json`
  - `.env.example`
  - `README.md`
- `DAILY_MARKET_DEPLOYMENT.md` - Deployment guide
- `DAILY_MARKETS_SUMMARY.md` - This summary

## Questions & Answers

**Q: Can I still create regular RACE markets?**
A: Yes! The `createMarket()` function still works exactly as before.

**Q: Do I need to run the automation service?**
A: Only if you want automatic daily markets. You can also manually create and resolve daily markets using cast commands.

**Q: Can I have multiple daily markets at once?**
A: Yes! The automation service currently manages one "automatic" daily market, but you can manually create additional daily markets with different oracles.

**Q: What happens if the automation service crashes?**
A: Simply restart it. It will check the current state and resume. If a market needed resolution, you can manually resolve it with `cast send`.

**Q: Can I change the resolution time from midnight?**
A: Yes! Edit `getNextMidnight()` in `automation-service/index.js` to return any timestamp you want.
