'use client';

import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { MarketCard } from '@/components/MarketCard';
import { useMarkets } from '@/hooks/useMarkets';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function ResolvedPage() {
  const { markets, loading, refreshMarkets } = useMarkets();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter only resolved markets
  const resolvedMarkets = markets.filter(market => market.resolved);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="container mx-auto px-4 py-8">
        {!mounted ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          </div>
        ) : (
          <>
            {/* Resolved Markets List */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Resolved Markets</h2>
                  <p className="text-slate-400 text-sm mt-1">View past markets and claim your winnings</p>
                </div>
                <Button
                  onClick={refreshMarkets}
                  className="hidden md:flex bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold"
                >
                  Refresh
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : resolvedMarkets.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-slate-400 text-lg">No resolved markets yet</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                {resolvedMarkets.map((market) => (
                  <MarketCard key={market.id} market={market} />
                ))}
              </div>
            )}

            {/* Stats Section */}
            {resolvedMarkets.length > 0 && (
              <div className="mt-12">
                <h2 className="text-2xl font-bold text-white mb-6">Resolved Stats</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                    <p className="text-slate-400 text-sm mb-1">Total Resolved Markets</p>
                    <p className="text-3xl font-bold text-white">{resolvedMarkets.length}</p>
                  </div>
                  <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
                    <p className="text-slate-400 text-sm mb-1">Total Resolved Volume</p>
                    <p className="text-3xl font-bold text-white">
                      ${(() => {
                        const total = resolvedMarkets.reduce((acc, m) => {
                          const poolA = BigInt(m.totalPoolA || 0);
                          const poolB = BigInt(m.totalPoolB || 0);
                          return acc + poolA + poolB;
                        }, BigInt(0));
                        return Math.floor(Number(formatEther(total))).toLocaleString('en-US');
                      })()}
                    </p>
                  </div>
                </div>
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
