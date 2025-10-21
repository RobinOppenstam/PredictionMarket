import { useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import { PREDICTION_MARKET_ABI, PREDICTION_MARKET_ADDRESS } from '@/lib/contracts';
import { toast } from 'sonner';

export function usePlaceBet() {
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const placeBet = async (marketId: number, betOnA: boolean, amount: bigint) => {
    if (!walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsPlacingBet(true);

      const { request } = await publicClient.simulateContract({
        address: PREDICTION_MARKET_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'placeBet',
        args: [BigInt(marketId), betOnA],
        value: amount,
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      
      toast.loading('Placing bet...', { id: hash });

      await publicClient.waitForTransactionReceipt({ hash });

      toast.success('Bet placed successfully!', { id: hash });
    } catch (error: any) {
      console.error('Error placing bet:', error);
      toast.error(error.message || 'Failed to place bet');
      throw error;
    } finally {
      setIsPlacingBet(false);
    }
  };

  return { placeBet, isPlacingBet };
}

export function useResolveMarket() {
  const [isResolving, setIsResolving] = useState(false);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const resolveMarket = async (marketId: number) => {
    if (!walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsResolving(true);

      const { request } = await publicClient.simulateContract({
        address: PREDICTION_MARKET_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'resolveMarket',
        args: [BigInt(marketId)],
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      
      toast.loading('Resolving market...', { id: hash });

      await publicClient.waitForTransactionReceipt({ hash });

      toast.success('Market resolved successfully!', { id: hash });
    } catch (error: any) {
      console.error('Error resolving market:', error);
      toast.error(error.message || 'Failed to resolve market');
      throw error;
    } finally {
      setIsResolving(false);
    }
  };

  return { resolveMarket, isResolving };
}

export function useClaimWinnings() {
  const [isClaiming, setIsClaiming] = useState(false);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const claimWinnings = async (marketId: number) => {
    if (!walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsClaiming(true);

      const { request } = await publicClient.simulateContract({
        address: PREDICTION_MARKET_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'claimWinnings',
        args: [BigInt(marketId)],
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      
      toast.loading('Claiming winnings...', { id: hash });

      await publicClient.waitForTransactionReceipt({ hash });

      toast.success('Winnings claimed successfully!', { id: hash });
    } catch (error: any) {
      console.error('Error claiming winnings:', error);
      toast.error(error.message || 'Failed to claim winnings');
      throw error;
    } finally {
      setIsClaiming(false);
    }
  };

  return { claimWinnings, isClaiming };
}