'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { parseEther, parseUnits, formatEther, formatUnits } from 'viem';
import { useAccount } from 'wagmi';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ConnectButton } from '@/components/ConnectButton';
import { usePlaceBet, useResolveMarket, useClaimWinnings } from '@/hooks/useMarketActions';
import { useTokenApproval, useTokenBalances } from '@/hooks/useTokensSimple';
import { useOraclePrice } from '@/hooks/useOraclePrice';
import { pUSD_ADDRESS } from '@/lib/contracts';
import { Loader2, TrendingUp, Clock, CheckCircle2, Trophy, Lock } from 'lucide-react';
import { Market, MarketType } from '@/types';

interface MarketCardProps {
  market: Market;
}

// Helper function to get market icon based on market name
function getMarketIcon(marketName: string): string {
  const name = marketName.toLowerCase();

  // Check for more specific patterns first (gold vs eth before just eth)
  if (name.includes('gold') && name.includes('eth')) {
    return '/goldvsethIcon.png';
  } else if (name.includes('gold')) {
    return '/goldIcon.png';
  } else if (name.includes('ethereum') || name.includes('eth')) {
    return '/ethIcon.png';
  } else if (name.includes('bitcoin') || name.includes('btc')) {
    return '/btcIcon.png';
  }

  // Default icon
  return '/btcIcon.png';
}

// Helper function to format outcome text for daily markets
function formatOutcome(outcome: string, marketType: MarketType): string {
  if (marketType === MarketType.DAILY_OVER_UNDER) {
    if (outcome.toLowerCase() === 'over') return 'Higher';
    if (outcome.toLowerCase() === 'under') return 'Lower';
  }
  return outcome;
}

// Helper function to format market title for daily markets
function formatMarketTitle(title: string, marketType: MarketType): string {
  if (marketType === MarketType.DAILY_OVER_UNDER) {
    return title.replace(/Over\/Under/gi, 'Higher/Lower');
  }
  return title;
}

export function MarketCard({ market }: MarketCardProps) {
  const [betAmount, setBetAmount] = useState('');
  const [selectedOutcome, setSelectedOutcome] = useState<'A' | 'B' | null>(null);
  const [now, setNow] = useState(Date.now());

  const { isConnected } = useAccount();
  const { placeBet, isPlacingBet } = usePlaceBet();
  const { resolveMarket, isResolving } = useResolveMarket();
  const { claimWinnings, isClaiming } = useClaimWinnings();
  const { pUsdBalance, refetchBalances } = useTokenBalances();

  // Fetch current prices from oracles
  const { price: priceA } = useOraclePrice(market.oracleA);
  const { price: priceB } = useOraclePrice(market.marketType === MarketType.RACE ? market.oracleB : null);
  const {
    approve,
    hasAllowance,
    isPending: isApproving,
    isConfirming: isApprovingConfirm,
    isSuccess: approvalSuccess
  } = useTokenApproval(pUSD_ADDRESS);

  // Update countdown every second
  useEffect(() => {
    if (!market.resolved) {
      const interval = setInterval(() => {
        setNow(Date.now());
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [market.resolved]);

  // Helper to format pUSD amounts without trailing zeros
  const formatPUSD = (value: number): string => {
    return parseFloat(value.toFixed(2)).toString();
  };

  const totalPool = (market.totalPoolA || BigInt(0)) + (market.totalPoolB || BigInt(0));
  const oddsA = totalPool > BigInt(0) ? (Number(market.totalPoolA || 0) / Number(totalPool)) * 100 : 50;
  const oddsB = totalPool > BigInt(0) ? (Number(market.totalPoolB || 0) / Number(totalPool)) * 100 : 50;

  // Check if user needs to approve tokens
  const needsApproval = betAmount && !hasAllowance(betAmount);

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

  const timeLeft = market.endTime - now / 1000;
  const daysLeft = Math.max(0, Math.floor(timeLeft / 86400));
  const hoursLeft = Math.max(0, Math.floor((timeLeft % 86400) / 3600));
  const minutesLeft = Math.max(0, Math.floor((timeLeft % 3600) / 60));
  const secondsLeft = Math.max(0, Math.floor(timeLeft % 60));

  const canResolve = !market.resolved && timeLeft <= 0;
  const canClaim = market.resolved && market.userBet && market.userBet.betOnA === market.outcomeAWon;

  const handleApprove = async () => {
    if (!betAmount) return;
    try {
      approve(betAmount);
    } catch (error) {
      console.error('Error approving tokens:', error);
    }
  };

  const handleBet = async () => {
    if (!selectedOutcome || !betAmount) return;

    try {
      await placeBet(market.id, selectedOutcome === 'A', parseUnits(betAmount, 18));
      setBetAmount('');
      setSelectedOutcome(null);
      // Refetch balances after bet
      setTimeout(() => refetchBalances(), 2000);
    } catch (error) {
      console.error('Error placing bet:', error);
    }
  };

  // Auto-proceed to bet after approval
  useEffect(() => {
    if (approvalSuccess && betAmount && selectedOutcome) {
      // Small delay to ensure blockchain state is updated
      setTimeout(() => {
        if (hasAllowance(betAmount)) {
          handleBet();
        }
      }, 1000);
    }
  }, [approvalSuccess]);

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

  const marketIcon = getMarketIcon(market.name);

  return (
    <Card className="bg-slate-900/50 backdrop-blur-xl border-slate-800 overflow-hidden">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center p-2.5 shrink-0 overflow-hidden">
              <Image
                src={marketIcon}
                alt={market.name}
                width={48}
                height={48}
                className={`object-cover w-full h-full ${marketIcon === '/goldIcon.png' ? 'scale-150 translate-y-[5%] rotate-[25deg]' : ''} ${marketIcon === '/goldvsethIcon.png' ? 'scale-[1.75]' : ''}`}
              />
            </div>
            <CardTitle className="text-white text-xl">{formatMarketTitle(market.name, market.marketType)}</CardTitle>
          </div>
          {market.resolved && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
              <CheckCircle2 className="w-3 h-3 mr-1" />
              Resolved
            </Badge>
          )}
        </div>
        <CardDescription className="text-slate-400 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          {market.resolved ? (
            'Market closed'
          ) : (
            `${daysLeft}d ${hoursLeft}h ${minutesLeft}m ${secondsLeft}s remaining`
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Current & Target Prices */}
        <div className="bg-slate-800/50 rounded-xl p-4">
          {market.marketType === MarketType.DAILY_OVER_UNDER ? (
            <>
              <div className="mb-3">
                <p className="text-slate-400 text-xs mb-1">Starting Price</p>
                <p className="text-xl font-bold text-white">${(Number(market.creationPrice) / 1e8).toLocaleString()}</p>
              </div>
              <div className="pt-2 border-t border-slate-700">
                <p className="text-slate-400 text-xs">Current Price:</p>
                <p className={`text-sm font-semibold ${
                  priceA
                    ? parseFloat(priceA) > (Number(market.creationPrice) / 1e8)
                      ? 'text-green-400'
                      : parseFloat(priceA) < (Number(market.creationPrice) / 1e8)
                      ? 'text-red-400'
                      : 'text-slate-400'
                    : 'text-slate-400'
                }`}>
                  {priceA ? `$${Math.floor(parseFloat(priceA)).toLocaleString()}` : '...'}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3">
                <p className="text-slate-400 text-xs mb-1">Target Price</p>
                <p className="text-xl font-bold text-white">${(Number(market.targetPrice) / 1e8).toLocaleString()}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700">
                <div>
                  <p className="text-slate-400 text-xs">Gold Price</p>
                  <p className="text-sm font-semibold text-yellow-400">
                    {priceA ? `$${Math.floor(parseFloat(priceA)).toLocaleString()}` : '...'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs">ETH Price</p>
                  <p className="text-sm font-semibold text-blue-400">
                    {priceB ? `$${Math.floor(parseFloat(priceB)).toLocaleString()}` : '...'}
                  </p>
                </div>
              </div>
            </>
          )}
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
                {formatOutcome(market.outcomeA, market.marketType)}
              </span>
              <span className="text-sm text-slate-400">{oddsA.toFixed(1)}%</span>
            </div>
            <Progress value={oddsA} className="h-2 bg-slate-700" />
            <p className="text-sm text-slate-400 mt-2">
              Pool: ${parseFloat(formatUnits(market.totalPoolA || BigInt(0), 18)).toFixed(0)}
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
                {formatOutcome(market.outcomeB, market.marketType)}
              </span>
              <span className="text-sm text-slate-400">{oddsB.toFixed(1)}%</span>
            </div>
            <Progress value={oddsB} className="h-2 bg-slate-700" />
            <p className="text-sm text-slate-400 mt-2">
              Pool: ${parseFloat(formatUnits(market.totalPoolB || BigInt(0), 18)).toFixed(0)}
            </p>
          </button>
        </div>

        {/* User's Bet */}
        {market.userBet && (
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="pb-3">
              <CardTitle className="text-slate-300 text-sm font-medium">Your Position</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-white font-semibold">
                ${parseFloat(formatUnits(market.userBet.amount || BigInt(0), 18)).toFixed(0)} on {market.userBet.betOnA ? formatOutcome(market.outcomeA, market.marketType) : formatOutcome(market.outcomeB, market.marketType)}
              </p>
              {potentialWinnings && (
                <div className="pt-2 space-y-1 border-t border-slate-700">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Potential Payout:</span>
                    <span className="text-green-400 font-semibold">${formatPUSD(potentialWinnings.totalPayout)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Potential Profit:</span>
                    <span className="text-green-400 font-semibold">+${formatPUSD(potentialWinnings.profit)}</span>
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
            {!isConnected ? (
              <div className="text-center">
                <ConnectButton />
              </div>
            ) : (
              <>
                <Input
                  type="number"
                  placeholder="Amount in $"
                  value={betAmount}
                  onChange={(e) => setBetAmount(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                  step="1"
                  min="0"
                />
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Your Balance:</span>
                  <span>${parseFloat(pUsdBalance).toFixed(2)}</span>
                </div>

                {needsApproval ? (
                  <Button
                    onClick={handleApprove}
                    disabled={isApproving || isApprovingConfirm || !betAmount}
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
                  >
                    {isApproving || isApprovingConfirm ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Approve ${betAmount || '0'}
                      </>
                    )}
                  </Button>
                ) : (
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
                      `Bet $${betAmount || '0'} on ${selectedOutcome === 'A' ? formatOutcome(market.outcomeA, market.marketType) : formatOutcome(market.outcomeB, market.marketType)}`
                    )}
                  </Button>
                )}
              </>
            )}
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
                    <span className="text-white text-lg font-bold">${formatPUSD(actualWinnings.totalPayout)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Profit:</span>
                    <span className="text-green-400 font-semibold">+${formatPUSD(actualWinnings.profit)}</span>
                  </div>
                  <div className="pt-2 border-t border-green-500/20">
                    <p className="text-slate-500 text-xs">
                      Original bet: ${parseFloat(formatUnits(market.userBet?.amount || BigInt(0), 18)).toFixed(0)}
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
                  <span className="text-white text-lg font-bold">${parseFloat(formatUnits(market.userBet.amount || BigInt(0), 18)).toFixed(0)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Loss:</span>
                  <span className="text-red-400 font-semibold">-${parseFloat(formatUnits(market.userBet.amount || BigInt(0), 18)).toFixed(0)}</span>
                </div>
                <div className="pt-2 border-t border-red-500/20">
                  <p className="text-slate-500 text-xs">
                    You bet on: {market.userBet.betOnA ? formatOutcome(market.outcomeA, market.marketType) : formatOutcome(market.outcomeB, market.marketType)}
                  </p>
                  <p className="text-slate-500 text-xs">
                    Winner: {market.outcomeAWon ? formatOutcome(market.outcomeA, market.marketType) : formatOutcome(market.outcomeB, market.marketType)}
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