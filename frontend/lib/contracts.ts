export const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;

export const PREDICTION_MARKET_ABI = [
  {
    "type": "constructor",
    "inputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "createMarket",
    "inputs": [
      { "name": "_name", "type": "string" },
      { "name": "_outcomeA", "type": "string" },
      { "name": "_outcomeB", "type": "string" },
      { "name": "_oracleA", "type": "address" },
      { "name": "_oracleB", "type": "address" },
      { "name": "_targetPrice", "type": "int256" },
      { "name": "_durationInDays", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "placeBet",
    "inputs": [
      { "name": "_marketId", "type": "uint256" },
      { "name": "_betOnA", "type": "bool" }
    ],
    "outputs": [],
    "stateMutability": "payable"
  },
  {
    "type": "function",
    "name": "resolveMarket",
    "inputs": [
      { "name": "_marketId", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "claimWinnings",
    "inputs": [
      { "name": "_marketId", "type": "uint256" }
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "type": "function",
    "name": "getMarketCount",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMarket",
    "inputs": [
      { "name": "_marketId", "type": "uint256" }
    ],
    "outputs": [
      {
        "type": "tuple",
        "components": [
          { "name": "name", "type": "string" },
          { "name": "outcomeA", "type": "string" },
          { "name": "outcomeB", "type": "string" },
          { "name": "oracleA", "type": "address" },
          { "name": "oracleB", "type": "address" },
          { "name": "targetPrice", "type": "int256" },
          { "name": "totalPoolA", "type": "uint256" },
          { "name": "totalPoolB", "type": "uint256" },
          { "name": "endTime", "type": "uint256" },
          { "name": "resolved", "type": "bool" },
          { "name": "outcomeAWon", "type": "bool" },
          { "name": "fee", "type": "uint256" }
        ]
      }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getUserBet",
    "inputs": [
      { "name": "_marketId", "type": "uint256" },
      { "name": "_user", "type": "address" }
    ],
    "outputs": [
      { "name": "amount", "type": "uint256" },
      { "name": "betOnA", "type": "bool" },
      { "name": "hasBet", "type": "bool" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "getMarketOdds",
    "inputs": [
      { "name": "_marketId", "type": "uint256" }
    ],
    "outputs": [
      { "name": "oddsA", "type": "uint256" },
      { "name": "oddsB", "type": "uint256" },
      { "name": "totalPool", "type": "uint256" }
    ],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "owner",
    "inputs": [],
    "outputs": [{ "name": "", "type": "address" }],
    "stateMutability": "view"
  },
  {
    "type": "function",
    "name": "protocolFee",
    "inputs": [],
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view"
  },
  {
    "type": "event",
    "name": "MarketCreated",
    "inputs": [
      { "name": "marketId", "type": "uint256", "indexed": true },
      { "name": "name", "type": "string", "indexed": false },
      { "name": "outcomeA", "type": "string", "indexed": false },
      { "name": "outcomeB", "type": "string", "indexed": false },
      { "name": "targetPrice", "type": "int256", "indexed": false },
      { "name": "endTime", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "BetPlaced",
    "inputs": [
      { "name": "marketId", "type": "uint256", "indexed": true },
      { "name": "user", "type": "address", "indexed": true },
      { "name": "betOnA", "type": "bool", "indexed": false },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "MarketResolved",
    "inputs": [
      { "name": "marketId", "type": "uint256", "indexed": true },
      { "name": "outcomeAWon", "type": "bool", "indexed": false },
      { "name": "priceA", "type": "int256", "indexed": false },
      { "name": "priceB", "type": "int256", "indexed": false }
    ]
  },
  {
    "type": "event",
    "name": "WinningsClaimed",
    "inputs": [
      { "name": "marketId", "type": "uint256", "indexed": true },
      { "name": "user", "type": "address", "indexed": true },
      { "name": "amount", "type": "uint256", "indexed": false }
    ]
  }
] as const;