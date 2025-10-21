# Complete Math Logic Walkthrough

## Market Structure

The prediction market is a **parimutuel betting system** (similar to horse racing). All bets go into pools, and winners share the losing pool proportionally.

## 1. Pool Tracking

```typescript
totalPoolA = sum of all bets on outcome A
totalPoolB = sum of all bets on outcome B
totalPool = totalPoolA + totalPoolB
```

**Example:**
- Pool A (Gold reaches $5000 first): 0.23 ETH
- Pool B (ETH reaches $5000 first): 2 ETH
- Total Pool: 2.23 ETH

## 2. Odds Calculation

Odds represent market sentiment (not probability):

```typescript
oddsA = (totalPoolA / totalPool) × 100%
oddsB = (totalPoolB / totalPool) × 100%
```

**Example:**
- Odds A = (0.23 / 2.23) × 100% = **10.3%**
- Odds B = (2.00 / 2.23) × 100% = **89.7%**

## 3. Potential Winnings Formula

When you win, you receive:
1. **Your original bet back**
2. **Your proportional share of the losing pool** (minus protocol fee)

```typescript
// Step 1: Identify pools
winningPool = betOnA ? totalPoolA : totalPoolB
losingPool = betOnA ? totalPoolB : totalPoolA

// Step 2: Calculate your share of losing pool
yourShare = (yourBet / winningPool) × losingPool

// Step 3: Apply protocol fee (2%)
yourShareAfterFee = yourShare × 0.98

// Step 4: Calculate total payout
totalPayout = yourBet + yourShareAfterFee
profit = yourShareAfterFee
```

## 4. Real Example

**Your position:**
- Bet: 0.23 ETH on "Gold reaches $5000 first"
- Pool A: 0.23 ETH (100% is yours!)
- Pool B: 2 ETH

**If Gold wins:**

```typescript
winningPool = 0.23 ETH
losingPool = 2.00 ETH

// Your share of losing pool
yourShare = (0.23 / 0.23) × 2.00 = 2.00 ETH
// (you get 100% since you're the only one on this side!)

// After 2% fee
yourShareAfterFee = 2.00 × 0.98 = 1.96 ETH

// Total payout
totalPayout = 0.23 + 1.96 = 2.19 ETH
profit = 1.96 ETH (852% return!)
```

## 5. Why the High Return?

Your bet has a **very high potential return** because:
1. You're the ONLY person betting on Gold (you own 100% of Pool A)
2. Pool B has 2 ETH that you'd win almost entirely
3. This is a **contrarian bet** - the market thinks ETH is much more likely to reach $5000 first (89.7% vs 10.3%)

## 6. Fee Structure

```solidity
protocolFee = 200 basis points = 200/10000 = 2%
FEE_PERCENT = 1 - 0.02 = 0.98
```

The 2% fee is deducted from your share of the losing pool, not from your original bet.

## 7. Dynamic Odds Example

If someone else bets 0.77 ETH on Gold:
- Pool A becomes: 1.00 ETH
- Pool B stays: 2.00 ETH

Your new potential winnings:

```typescript
yourShare = (0.23 / 1.00) × 2.00 = 0.46 ETH
afterFee = 0.46 × 0.98 = 0.4508 ETH
totalPayout = 0.23 + 0.4508 = 0.6808 ETH
profit = 0.4508 ETH (196% return)
```

Your return decreased because you now only own 23% of the winning pool instead of 100%.

## 8. Implementation in Code

### Frontend Calculation (TypeScript)

```typescript
const calculatePotentialWinnings = () => {
  if (!market.userBet || market.resolved) return null;

  const betAmount = market.userBet.amount;
  const betOnA = market.userBet.betOnA;

  const winningPool = betOnA ? market.totalPoolA : market.totalPoolB;
  const losingPool = betOnA ? market.totalPoolB : market.totalPoolA;

  if (winningPool === BigInt(0)) return null;

  // Protocol fee is 2% (200 basis points / 10000)
  const FEE_PERCENT = 0.98; // 1 - (200/10000) = 0.98

  // Convert everything to ETH (not Wei) for calculation
  const betAmountEth = Number(formatEther(betAmount));
  const winningPoolEth = Number(formatEther(winningPool));
  const losingPoolEth = Number(formatEther(losingPool));

  // Calculate share of losing pool
  // Formula: (userBet / winningPool) * losingPool * (1 - fee)
  const userShare = (betAmountEth / winningPoolEth) * losingPoolEth * FEE_PERCENT;

  // Total payout = original bet + share of losing pool
  const totalPayout = betAmountEth + userShare;
  const profit = userShare;

  return { totalPayout, profit };
};
```

### Smart Contract Calculation (Solidity)

```solidity
// In claimWinnings function
uint256 winningPool = market.outcomeAWon ? market.totalPoolA : market.totalPoolB;
uint256 losingPool = market.outcomeAWon ? market.totalPoolB : market.totalPoolA;

// User's share of losing pool
uint256 userShare = (userBet * losingPool) / winningPool;

// Apply protocol fee (2% = 200 basis points)
uint256 fee = (userShare * protocolFee) / FEE_DENOMINATOR;
uint256 userShareAfterFee = userShare - fee;

// Total payout
uint256 payout = userBet + userShareAfterFee;
```

## 9. Key Concepts

### Parimutuel System
- All bets go into pools
- Winners split the losing pool proportionally
- No house edge, just a protocol fee
- Odds change dynamically as bets come in

### Early Bet Advantage
- Being first on an unpopular side = potentially huge returns
- Risk: If odds stay lopsided, the outcome might be very unlikely
- Reward: If you're right, you capture most of the losing pool

### Market Efficiency
- Popular outcomes have lower returns (more people splitting the losing pool)
- Unpopular outcomes have higher returns (fewer people to split with)
- This creates natural market balance

## 10. UI Display

The interface shows:
- **Potential Payout**: Total ETH you'll receive (original bet + profit)
- **Potential Profit**: Net gain (profit only)
- **Fee notice**: Reminds users about the 2% protocol fee

This system incentivizes early bets on unpopular outcomes (higher returns) and creates dynamic odds based on market participation!
