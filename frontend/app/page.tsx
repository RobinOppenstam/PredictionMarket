'use client';

import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { MarketCard } from '@/components/MarketCard';
import TokenBalances from '@/components/TokenBalances';
import { useMarkets } from '@/hooks/useMarkets';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { MarketType } from '@/types';

type MarketFilter = 'all' | 'daily' | 'other';

export default function Home() {
  const { markets, loading, refreshMarkets } = useMarkets();
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<MarketFilter>('all');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter markets based on selected filter - exclude resolved markets
  const filteredMarkets = markets.filter(market => {
    // Don't show resolved markets
    if (market.resolved) return false;

    if (filter === 'daily') return market.marketType === MarketType.DAILY_OVER_UNDER;
    if (filter === 'other') return market.marketType !== MarketType.DAILY_OVER_UNDER;
    return true; // 'all'
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {!mounted ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <>
            {/* Markets List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-white">Markets</h2>
                <div className="flex items-center gap-2">
                  <TokenBalances />
                  <Button
                    onClick={refreshMarkets}
                    className="hidden md:flex bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-xl p-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'all'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Markets ({markets.filter(m => !m.resolved).length})
                </button>
                <button
                  onClick={() => setFilter('daily')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'daily'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Daily Markets ({markets.filter(m => !m.resolved && m.marketType === MarketType.DAILY_OVER_UNDER).length})
                </button>
                <button
                  onClick={() => setFilter('other')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    filter === 'other'
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Other Markets ({markets.filter(m => !m.resolved && m.marketType !== MarketType.DAILY_OVER_UNDER).length})
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
                  {filter === 'daily' && 'No daily markets available'}
                  {filter === 'other' && 'No other markets available'}
                  {filter === 'all' && 'No active markets available'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {filteredMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}

            {/* Stats Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-white mb-6">Statistics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                <p className="text-slate-400 text-sm mb-1">Active Markets</p>
                <p className="text-3xl font-bold text-white">{markets.filter(m => !m.resolved).length}</p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                <p className="text-slate-400 text-sm mb-1">Total Volume</p>
                <p className="text-3xl font-bold text-white">
                  ${(() => {
                    const total = markets.reduce((acc, m) => {
                      const poolA = BigInt(m.totalPoolA || 0);
                      const poolB = BigInt(m.totalPoolB || 0);
                      return acc + poolA + poolB;
                    }, BigInt(0));
                    return Math.floor(Number(formatEther(total))).toLocaleString('en-US');
                  })()}
                </p>
              </div>
              <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                <p className="text-slate-400 text-sm mb-1">Resolved Markets</p>
                <p className="text-3xl font-bold text-white">{markets.filter(m => m.resolved).length}</p>
              </div>
              </div>
            </div>
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