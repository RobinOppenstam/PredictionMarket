# Daily Bitcoin Over/Under Automation Service

This service automatically manages daily Bitcoin over/under prediction markets.

## What It Does

- **Every minute**, checks if there's an active daily market
- **At midnight (00:00)**, resolves the current daily market
- **At 00:01** (1 minute after midnight), creates a new daily market with the current Bitcoin price

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure `.env` file:
```bash
cp .env.example .env
# Edit .env with your settings
```

3. **Important**: Set the automation service address in the smart contract:
```bash
# Get the address of the wallet used by automation service
# (default is first Anvil account: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)

# Set it as the automation service in the contract
cast send YOUR_CONTRACT_ADDRESS \
  "setAutomationService(address)" \
  0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
  --rpc-url http://localhost:8545 \
  --private-key YOUR_PRIVATE_KEY
```

## Running

```bash
npm start
```

The service will:
- Run continuously in the foreground
- Log all actions to console
- Check every minute for tasks to execute

## How It Works

### Market Creation
When creating a new daily market:
- Fetches current Bitcoin price from the oracle
- Sets market name: "Daily Bitcoin Over/Under"
- Sets outcomes: "Over" vs "Under"
- Sets end time to next midnight (00:00)
- Uses the current price as the target price

### Market Resolution
At midnight:
- Resolves the market by comparing closing price to creation price
- "Over" wins if closing price > creation price
- "Under" wins if closing price <= creation price

### Automation Logic
```
Every minute:
  Check if there's an active daily market

  If market exists and is not resolved:
    - If current time >= midnight: Resolve market
    - Wait 60 seconds, then create new market

  If market exists and is resolved:
    - If 60+ seconds have passed: Create new market

  If no active market:
    - Create new market immediately
```

## Testing

For faster testing (instead of waiting for midnight), you can modify the code to use shorter intervals. For example, change `getNextMidnight()` to return a timestamp 5 minutes from now.

## Environment Variables

- `RPC_URL` - Blockchain RPC endpoint (default: http://localhost:8545)
- `PRIVATE_KEY` - Private key for automation service wallet
- `CONTRACT_ADDRESS` - PredictionMarket contract address
- `BITCOIN_ORACLE_ADDRESS` - Bitcoin price oracle address

## Troubleshoths

**Error: "Only owner or automation service"**
- Make sure you've set the automation service address in the contract using `setAutomationService()`

**Markets not being created**
- Check that the oracle address is correct
- Verify RPC connection is working
- Check console logs for error messages

**Markets not resolving**
- Ensure enough time has passed (must be at or after midnight)
- Check that the oracle is returning valid price data
