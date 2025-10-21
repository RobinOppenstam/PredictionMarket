'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { formatEther } from 'viem';
import { MarketCard } from '@/components/MarketCard';
import { CreateMarketDialog } from '@/components/CreateMarketDialog';
import { ConnectButton } from '@/components/ConnectButton';
import { useMarkets } from '@/hooks/useMarkets';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp } from 'lucide-react';

type MarketFilter = 'all' | 'active' | 'resolved';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { markets, loading, refreshMarkets } = useMarkets();
  const [isOwner, setIsOwner] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<MarketFilter>('active');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Check if connected address is owner
    // This would need to be implemented based on your contract
    setIsOwner(false);
  }, [address]);

  // Filter markets based on selected filter
  const filteredMarkets = markets.filter(market => {
    if (filter === 'active') return !market.resolved;
    if (filter === 'resolved') return market.resolved;
    return true; // 'all'
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">PredictMarket</h1>
                <p className="text-sm text-slate-400">Decentralized Prediction Markets</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isOwner && <CreateMarketDialog onSuccess={refreshMarkets} />}
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to PredictMarket</h2>
            <p className="text-slate-400 mb-8 text-center max-w-md">
              Connect your wallet to start betting on prediction markets powered by Chainlink oracles
            </p>
            <ConnectButton />
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                <p className="text-slate-400 text-sm mb-1">Active Markets</p>
                <p className="text-3xl font-bold text-white">{markets.filter(m => !m.resolved).length}</p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                <p className="text-slate-400 text-sm mb-1">Total Volume</p>
                <p className="text-3xl font-bold text-white">
                  {(() => {
                    const total = markets.reduce((acc, m) => {
                      const poolA = BigInt(m.totalPoolA || 0);
                      const poolB = BigInt(m.totalPoolB || 0);
                      return acc + poolA + poolB;
                    }, BigInt(0));
                    return Number(formatEther(total)).toFixed(2);
                  })()} ETH
                </p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                <p className="text-slate-400 text-sm mb-1">Resolved Markets</p>
                <p className="text-3xl font-bold text-white">{markets.filter(m => m.resolved).length}</p>
              </div>
            </div>

            {/* Markets List */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Markets</h2>
                <Button
                  onClick={refreshMarkets}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                >
                  Refresh
                </Button>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setFilter('active')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'active'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active ({markets.filter(m => !m.resolved).length})
                </button>
                <button
                  onClick={() => setFilter('resolved')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'resolved'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Resolved ({markets.filter(m => m.resolved).length})
                </button>
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All ({markets.length})
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : filteredMarkets.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-400 text-lg">
                  {filter === 'active' && 'No active markets'}
                  {filter === 'resolved' && 'No resolved markets'}
                  {filter === 'all' && 'No markets available yet'}
                </p>
                {isOwner && filter === 'all' && (
                  <p className="text-slate-500 mt-2">Create your first market to get started</p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-20 py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            Powered by Chainlink Oracles • Built on Ethereum
          </p>
        </div>
      </footer>
    </main>
  );
}