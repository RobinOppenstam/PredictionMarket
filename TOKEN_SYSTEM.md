# Token System Documentation

## Overview

The prediction market now uses custom ERC20 tokens instead of native ETH for betting. This makes it easier for users to test without needing testnet ETH for every bet.

## Tokens

### pUSD (Prediction USD)
- **Purpose**: Stablecoin pegged to $1 USD for placing bets
- **Symbol**: pUSD
- **Decimals**: 18
- **Initial Supply**: 10,000,000 pUSD (minted to deployer)
- **Contract**: `PredictionUSD.sol`

**Features**:
- Mintable by faucet contract
- Burnable by token holders
- Owner can set faucet address

### pETH (Prediction ETH)
- **Purpose**: Token that mirrors real-time ETH value
- **Symbol**: pETH
- **Decimals**: 18
- **Initial Supply**: 10,000 pETH (minted to deployer)
- **Contract**: `PredictionETH.sol`

**Features**:
- Tracks ETH/USD price via Chainlink oracle
- Mintable by faucet contract
- Burnable by token holders
- Owner can update price feed address
- Function to get current ETH/USD price

## Token Faucet

### Overview
Free token distribution system that allows users to claim betting tokens every 24 hours.

**Contract**: `TokenFaucet.sol`

### Claim Amounts
- **5,000 pUSD** per claim
- **1 pETH** per claim
- **Cooldown**: 24 hours between claims

### Functions

#### `claim()`
Claim tokens from the faucet. Can only be called once every 24 hours.

```solidity
function claim() external nonReentrant
```

**Emits**: `TokensClaimed(address user, uint256 pUsdAmount, uint256 pEthAmount, uint256 timestamp)`

#### `canClaim(address user)`
Check if a user can claim tokens.

```solidity
function canClaim(address user) public view returns (bool able, uint256 timeUntilNextClaim)
```

**Returns**:
- `able`: Whether the user can claim now
- `timeUntilNextClaim`: Seconds until next claim (0 if can claim now)

### Admin Functions

#### `setTokens(address _pUSD, address _pETH)`
Update token addresses (owner only)

#### `resetClaimTime(address user)`
Reset claim cooldown for a user (owner only, useful for testing)

## Updated PredictionMarket Contract

### Key Changes

1. **Constructor now requires token addresses**:
```solidity
constructor(address _pUSD, address _pETH)
```

2. **placeBet now uses ERC20 tokens**:
```solidity
function placeBet(uint256 _marketId, bool _betOnA, uint256 _amount) external
```
- Users must first approve the PredictionMarket contract to spend their pUSD
- Contract uses `safeTransferFrom` to transfer pUSD from user

3. **claimWinnings pays out in pUSD**:
- Winnings are paid in pUSD tokens
- Fees are collected in pUSD tokens

4. **New admin function**:
```solidity
function setTokens(address _pUSD, address _pETH) external onlyOwner
```

## Deployment Order

1. Deploy pUSD token
2. Deploy pETH token (requires ETH/USD oracle address)
3. Deploy TokenFaucet (requires pUSD and pETH addresses)
4. Set faucet address in pUSD token
5. Set faucet address in pETH token
6. Deploy PredictionMarket (requires pUSD and pETH addresses)
7. Create initial markets

## Usage Flow

### For Users:

1. **Get Tokens**:
   - Visit faucet page
   - Click "Claim Tokens"
   - Receive 5,000 pUSD + 1 pETH
   - Wait 24 hours before claiming again

2. **Place Bet**:
   - Approve PredictionMarket contract to spend pUSD
   - Enter bet amount
   - Click "Place Bet"
   - Tokens are transferred to market contract

3. **Claim Winnings**:
   - After market resolves, if you won
   - Click "Claim Winnings"
   - Receive pUSD payout (original bet + share of losing pool - fees)

### For Developers:

#### Approve Tokens (Frontend)
```typescript
// Approve PredictionMarket to spend pUSD
const pUsdContract = new ethers.Contract(pUsdAddress, pUsdAbi, signer);
await pUsdContract.approve(marketAddress, amount);
```

#### Place Bet
```typescript
const marketContract = new ethers.Contract(marketAddress, marketAbi, signer);
await marketContract.placeBet(marketId, betOnA, amount);
```

#### Check Faucet Status
```typescript
const faucetContract = new ethers.Contract(faucetAddress, faucetAbi, provider);
const [canClaim, timeLeft] = await faucetContract.canClaim(userAddress);
```

#### Claim from Faucet
```typescript
const faucetContract = new ethers.Contract(faucetAddress, faucetAbi, signer);
await faucetContract.claim();
```

## Contract Addresses

### Sepolia Testnet
(To be filled after deployment)
```
pUSD: 0x...
pETH: 0x...
TokenFaucet: 0x...
PredictionMarket: 0x...
```

### Local Development (Anvil)
Run deployment script to get addresses:
```bash
forge script script/Deploy.s.sol:DeployLocalScript --rpc-url http://localhost:8545 --broadcast
```

## Token ABIs

### pUSD/pETH Interface
```solidity
interface IERC20 {
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transfer(address to, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}
```

### TokenFaucet Interface
```solidity
interface ITokenFaucet {
    function claim() external;
    function canClaim(address user) external view returns (bool able, uint256 timeUntilNextClaim);
}
```

## Security Considerations

1. **Token Approvals**: Users should only approve the amount they intend to bet, not unlimited approvals
2. **Faucet Cooldown**: 24-hour cooldown prevents faucet abuse
3. **Minting Permissions**: Only the faucet contract can mint new tokens
4. **ReentrancyGuard**: All state-changing functions use reentrancy protection
5. **SafeERC20**: Uses OpenZeppelin's SafeERC20 for secure token transfers

## Testing

### Local Testing
```bash
# Deploy contracts
forge script script/Deploy.s.sol:DeployLocalScript --rpc-url http://localhost:8545 --broadcast

# Claim from faucet (via cast)
cast send <FAUCET_ADDRESS> "claim()" --rpc-url http://localhost:8545 --private-key <YOUR_KEY>

# Check balances
cast call <pUSD_ADDRESS> "balanceOf(address)(uint256)" <YOUR_ADDRESS> --rpc-url http://localhost:8545
```

### Frontend Testing
1. Connect wallet to local network
2. Use faucet to get tokens
3. Check token balances in UI
4. Approve tokens and place bets
5. Verify transactions in blockchain explorer

## Migration from ETH to Tokens

### Breaking Changes
1. `placeBet` signature changed:
   - Old: `placeBet(uint256 _marketId, bool _betOnA) external payable`
   - New: `placeBet(uint256 _marketId, bool _betOnA, uint256 _amount) external`

2. Constructor signature changed:
   - Old: `constructor()`
   - New: `constructor(address _pUSD, address _pETH)`

3. No more `receive()` function (contract doesn't accept ETH)

### Frontend Updates Required
1. Add token approval flow before betting
2. Display token balances (pUSD and pETH)
3. Add faucet claim button
4. Show faucet cooldown timer
5. Update bet placement to use `placeBet` with amount parameter
6. Remove ETH balance checks, use pUSD balance instead

## Future Enhancements

1. **Multi-Token Betting**: Allow betting with pETH in addition to pUSD
2. **Token Swap**: Add DEX-style swap between pUSD and pETH
3. **Staking**: Allow users to stake pUSD/pETH for rewards
4. **Governance**: Use tokens for protocol governance voting
5. **Dynamic Faucet**: Adjust faucet amounts based on market activity
