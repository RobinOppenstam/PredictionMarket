export enum MarketType {
  RACE = 0,
  DAILY_OVER_UNDER = 1,
}

export interface Market {
  id: number;
  name: string;
  outcomeA: string;
  outcomeB: string;
  oracleA: string;
  oracleB: string;
  targetPrice: bigint;
  totalPoolA: bigint;
  totalPoolB: bigint;
  endTime: number;
  resolved: boolean;
  outcomeAWon: boolean;
  marketType: MarketType;
  creationPrice: bigint;
  isAutomatic: boolean;
  userBet?: {
    amount: bigint;
    betOnA: boolean;
  } | null;
}

export interface OraclePrice {
  price: bigint;
  timestamp: number;
}