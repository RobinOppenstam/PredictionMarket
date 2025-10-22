'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplet, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import { useFaucet } from '@/hooks/useFaucet';
import { useTokenBalances } from '@/hooks/useTokensSimple';
import { useAccount } from 'wagmi';

export default function Faucet() {
  const { address } = useAccount();
  const { claim, canClaim, timeUntilNextClaim, isPending, isConfirming, isSuccess } = useFaucet();
  const { refetchBalances } = useTokenBalances();
  const [timeDisplay, setTimeDisplay] = useState('');

  // Format time remaining
  useEffect(() => {
    if (timeUntilNextClaim > 0) {
      const hours = Math.floor(timeUntilNextClaim / 3600);
      const minutes = Math.floor((timeUntilNextClaim % 3600) / 60);
      const seconds = timeUntilNextClaim % 60;
      setTimeDisplay(`${hours}h ${minutes}m ${seconds}s`);
    } else {
      setTimeDisplay('');
    }
  }, [timeUntilNextClaim]);

  // Refetch balances after successful claim
  useEffect(() => {
    if (isSuccess) {
      setTimeout(() => {
        refetchBalances();
      }, 2000);
    }
  }, [isSuccess, refetchBalances]);

  const handleClaim = () => {
    claim();
  };

  return (
    <Card className="bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-xl border-slate-700">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 p-3 rounded-xl">
            <Droplet className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-xl text-white">Token Faucet</CardTitle>
            <CardDescription className="text-slate-400">
              Claim free betting tokens every 24 hours
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Claim amount */}
        <div className="bg-slate-800/50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-slate-400">Claim Amount</span>
            <span className="text-white font-semibold">$10,000</span>
          </div>
        </div>

        {/* Claim button or cooldown */}
        {!address ? (
          <Button disabled className="w-full">
            Connect Wallet to Claim
          </Button>
        ) : canClaim ? (
          <Button
            onClick={handleClaim}
            disabled={isPending || isConfirming}
            className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold"
          >
            {isPending || isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isPending ? 'Confirming...' : 'Claiming...'}
              </>
            ) : isSuccess ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Claimed Successfully!
              </>
            ) : (
              <>
                <Droplet className="mr-2 h-4 w-4" />
                Claim Tokens
              </>
            )}
          </Button>
        ) : (
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-slate-300 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Next claim available in:</span>
            </div>
            <p className="text-2xl font-bold text-white text-center">{timeDisplay}</p>
          </div>
        )}

        {/* Success message */}
        {isSuccess && (
          <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-3">
            <p className="text-green-400 text-sm text-center">
              Tokens claimed successfully! Check your balance above.
            </p>
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-slate-500 space-y-1">
          <p>• Free tokens for testing prediction markets</p>
          <p>• Claim once every 24 hours</p>
          <p>• Use pUSD to place bets on markets</p>
        </div>
      </CardContent>
    </Card>
  );
}
