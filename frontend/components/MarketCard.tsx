'use client';

import { useState } from 'react';
import { parseEther, formatEther } from 'viem';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { usePlaceBet, useResolveMarket, useClaimWinnings } from '@/hooks/useMarketActions';
import { Loader2, TrendingUp, Clock, CheckCircle2, Trophy } from 'lucide-react';
import { Market } from '@/types';

interface MarketCardProps {
  market: Market;
}

export function MarketCard({ market }: MarketCardProps) {
  const [betAmount, setBetAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<'A' | 'B' | null>(null);

  const { placeBet, isPlacingBet } = usePlaceBet();
  const { resolveMarket, isResolving } = useResolveMarket();
  const { claimWinnings, isClaiming } = useClaimWinnings();

  // Helper to format ETH amounts without trailing zeros
  const formatETH = (value: number): string => {
    return parseFloat(value.toFixed(4)).toString();
  };

  const totalPool = (market.totalPoolA || BigInt(0)) + (market.totalPoolB || BigInt(0));
  const oddsA = totalPool > BigInt(0) ? (Number(market.totalPoolA || 0) / Number(totalPool)) * 100 : 50;
  const oddsB = totalPool > BigInt(0) ? (Number(market.totalPoolB || 0) / Number(totalPool)) * 100 : 50;

  // Calculate potential winnings for user's bet
  const calculatePotentialWinnings = () => {
    if (!market.userBet || market.resolved) return null;

    const betAmount = market.userBet.amount;
    const betOnA = market.userBet.betOnA;

    const winningPool = betOnA ? (market.totalPoolA || BigInt(0)) : (market.totalPoolB || BigInt(0));
    const losingPool = betOnA ? (market.totalPoolB || BigInt(0)) : (market.totalPoolA || BigInt(0));

    if (!winningPool || winningPool === BigInt(0)) return null;

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

  const potentialWinnings = calculatePotentialWinnings();

  // Calculate actual winnings for resolved markets
  const calculateActualWinnings = () => {
    if (!market.resolved || !market.userBet) return null;

    const betAmount = market.userBet.amount;
    const betOnA = market.userBet.betOnA;
    const won = betOnA === market.outcomeAWon;

    if (!won) return null;

    const winningPool = market.outcomeAWon ? (market.totalPoolA || BigInt(0)) : (market.totalPoolB || BigInt(0));
    const losingPool = market.outcomeAWon ? (market.totalPoolB || BigInt(0)) : (market.totalPoolA || BigInt(0));

    if (!winningPool || winningPool === BigInt(0)) return null;

    const FEE_PERCENT = 0.98;
    const betAmountEth = Number(formatEther(betAmount));
    const winningPoolEth = Number(formatEther(winningPool));
    const losingPoolEth = Number(formatEther(losingPool));

    const userShare = (betAmountEth / winningPoolEth) * losingPoolEth * FEE_PERCENT;
    const totalPayout = betAmountEth + userShare;

    return { totalPayout, profit: userShare };
  };

  const actualWinnings = calculateActualWinnings();

  const timeLeft = market.endTime - Date.now() / 1000;
  const daysLeft = Math.max(0, Math.floor(timeLeft / 86400));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % 86400) / 3600));

  const canResolve = !market.resolved && timeLeft <= 0;
  const canClaim = market.resolved && market.userBet && market.userBet.betOnA === market.outcomeAWon;

  const handleBet = async () => {
    if (!selectedOutcome || !betAmount) return;
    
    try {
      await placeBet(market.id, selectedOutcome === 'A', parseEther(betAmount));
      setBetAmount('');
      setSelectedOutcome(null);
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  };

  const handleResolve = async () => {
    try {
      await resolveMarket(market.id);
    } catch (error) {
      console.error('Error resolving market:', error);
    }
  };

  const handleClaim = async () => {
    try {
      await claimWinnings(market.id);
    } catch (error) {
      console.error('Error claiming winnings:', error);
    }
  };

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <CardTitle className="text-white text-xl">{market.name}</CardTitle>
          {market.resolved ? (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Resolved
            </Badge>
          ) : (
            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
              <TrendingUp className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
        </div>
        <CardDescription className="text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {market.resolved ? (
            'Market closed'
          ) : (
            `${daysLeft}d ${hoursLeft}h remaining`
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Target Price */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          <p className="text-slate-400 text-sm mb-1">Target Price</p>
          <p className="text-2xl font-bold text-white">${(Number(market.targetPrice) / 1e8).toLocaleString()}</p>
        </div>

        {/* Outcomes */}
        <div className="space-y-3">
          {/* Outcome A */}
          <button
            onClick={() => !market.resolved && setSelectedOutcome('A')}
            disabled={market.resolved}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selectedOutcome === 'A'
                ? 'border-purple-500 bg-purple-500/10'
                : market.resolved && market.outcomeAWon
                ? 'border-green-500 bg-green-500/10'
                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white flex items-center gap-2">
                {market.resolved && market.outcomeAWon && (
                  <Trophy className="w-4 h-4 text-green-400" />
                )}
                {market.outcomeA}
              </span>
              <span className="text-sm text-slate-400">{oddsA.toFixed(1)}%</span>
            </div>
            <Progress value={oddsA} className="h-2 bg-slate-700" />
            <p className="text-sm text-slate-400 mt-2">
              Pool: {formatEther(market.totalPoolA || BigInt(0))} ETH
            </p>
          </button>

          {/* Outcome B */}
          <button
            onClick={() => !market.resolved && setSelectedOutcome('B')}
            disabled={market.resolved}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
              selectedOutcome === 'B'
                ? 'border-pink-500 bg-pink-500/10'
                : market.resolved && !market.outcomeAWon
                ? 'border-green-500 bg-green-500/10'
                : 'border-slate-700 bg-slate-800/30 hover:border-slate-600'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-white flex items-center gap-2">
                {market.resolved && !market.outcomeAWon && (
                  <Trophy className="w-4 h-4 text-green-400" />
                )}
                {market.outcomeB}
              </span>
              <span className="text-sm text-slate-400">{oddsB.toFixed(1)}%</span>
            </div>
            <Progress value={oddsB} className="h-2 bg-slate-700" />
            <p className="text-sm text-slate-400 mt-2">
              Pool: {formatEther(market.totalPoolB || BigInt(0))} ETH
            </p>
          </button>
        </div>

        {/* User's Bet */}
        {market.userBet && (
          <Card className="bg-blue-500/10 border-blue-500/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-400 text-sm font-medium">Your Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-white font-semibold">
                {formatEther(market.userBet.amount || BigInt(0))} ETH on {market.userBet.betOnA ? market.outcomeA : market.outcomeB}
              </p>
              {potentialWinnings && (
                <div className="pt-2 space-y-1 border-t border-blue-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Potential Payout:</span>
                    <span className="text-green-400 font-semibold">{formatETH(potentialWinnings.totalPayout)} ETH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Potential Profit:</span>
                    <span className="text-green-400 font-semibold">+{formatETH(potentialWinnings.profit)} ETH</span>
                  </div>
                  <p className="text-slate-500 text-xs pt-1">
                    * includes 2% protocol fee deduction
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bet Input */}
        {!market.resolved && !market.userBet && selectedOutcome && (
          <div className="space-y-3">
            <Input
              type="number"
              placeholder="Amount in ETH"
              value={betAmount}
              onChange={(e) => setBetAmount(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white"
              step="0.01"
              min="0"
            />
            <Button
              onClick={handleBet}
              disabled={isPlacingBet || !betAmount}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isPlacingBet ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Placing Bet...
                </>
              ) : (
                `Bet ${betAmount || '0'} ETH on ${selectedOutcome === 'A' ? market.outcomeA : market.outcomeB}`
              )}
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-3">
        {canResolve && (
          <Button
            onClick={handleResolve}
            disabled={isResolving}
            variant="outline"
            className="flex-1 border-slate-700"
          >
            {isResolving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Resolving...
              </>
            ) : (
              'Resolve Market'
            )}
          </Button>
        )}

        {/* Winner Section */}
        {canClaim && (
          <div className="flex-1 space-y-3">
            {actualWinnings && (
              <Card className="bg-green-500/10 border-green-500/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-green-400 text-base font-semibold">You Won! 🎉</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Total Payout:</span>
                    <span className="text-white text-lg font-bold">{formatETH(actualWinnings.totalPayout)} ETH</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Profit:</span>
                    <span className="text-green-400 font-semibold">+{formatETH(actualWinnings.profit)} ETH</span>
                  </div>
                  <div className="pt-2 border-t border-green-500/20">
                    <p className="text-slate-500 text-xs">
                      Original bet: {formatEther(market.userBet?.amount || BigInt(0))} ETH
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
            <Button
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <Trophy className="w-4 h-4 mr-2" />
                  Claim Winnings
                </>
              )}
            </Button>
          </div>
        )}

        {/* Loser Section */}
        {market.resolved && market.userBet && market.userBet.betOnA !== market.outcomeAWon && (
          <div className="flex-1">
            <Card className="bg-red-500/10 border-red-500/30">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-400 text-base font-semibold">You Lost 😔</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Bet Amount:</span>
                  <span className="text-white text-lg font-bold">{formatEther(market.userBet.amount || BigInt(0))} ETH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Loss:</span>
                  <span className="text-red-400 font-semibold">-{formatEther(market.userBet.amount || BigInt(0))} ETH</span>
                </div>
                <div className="pt-2 border-t border-red-500/20">
                  <p className="text-slate-500 text-xs">
                    You bet on: {market.userBet.betOnA ? market.outcomeA : market.outcomeB}
                  </p>
                  <p className="text-slate-500 text-xs">
                    Winner: {market.outcomeAWon ? market.outcomeA : market.outcomeB}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}