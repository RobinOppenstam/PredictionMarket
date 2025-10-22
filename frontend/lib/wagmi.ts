import { http } from 'wagmi';
import { sepolia, foundry } from 'wagmi/chains';
import { getDefaultConfig } from '@rainbow-me/rainbowkit';

export const config = getDefaultConfig({
  appName: 'PredictMarket',
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '',
  chains: [sepolia, foundry],
  transports: {
    [sepolia.id]: http(process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL),
    [foundry.id]: http('http://127.0.0.1:8545'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}