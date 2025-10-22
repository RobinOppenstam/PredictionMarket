'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import Faucet from '@/components/Faucet';
import { ConnectButton } from '@/components/ConnectButton';
import { Loader2, TrendingUp } from 'lucide-react';

export default function FaucetPage() {
  const { isConnected } = useAccount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {!mounted ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : !isConnected ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
              <TrendingUp className="w-10 h-10 text-purple-400" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Connect Your Wallet</h2>
            <p className="text-slate-400 mb-8 text-center max-w-md">
              Connect your wallet to claim free tokens from the faucet
            </p>
            <ConnectButton />
          </div>
        ) : (
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-white mb-2">Token Faucet</h1>
              <p className="text-slate-400">
                Claim free tokens to start betting on prediction markets
              </p>
            </div>
            <Faucet />
          </div>
        )}
      </div>
    </main>
  );
}
