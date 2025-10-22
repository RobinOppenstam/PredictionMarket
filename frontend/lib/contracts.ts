import PredictionMarketAbi from '../contracts/PredictionMarket.json';

export const PREDICTION_MARKET_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
export const pUSD_ADDRESS = process.env.NEXT_PUBLIC_PUSD_ADDRESS as `0x${string}`;
export const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS as `0x${string}`;

export const PREDICTION_MARKET_ABI = PredictionMarketAbi as any;
