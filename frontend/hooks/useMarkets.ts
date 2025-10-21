import { useState, useEffect } from 'react';
import { useAccount, usePublicClient } from 'wagmi';
import { PREDICTION_MARKET_ABI, PREDICTION_MARKET_ADDRESS } from '@/lib/contracts';
import { Market } from '@/types';

export function useMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const fetchMarkets = async () => {
    if (!publicClient) return;

    try {
      setLoading(true);

      // Get total market count
      const marketCount = await publicClient.readContract({
        address: PREDICTION_MARKET_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'getMarketCount',
      }) as bigint;

      const marketPromises = [];
      
      for (let i = 0; i < Number(marketCount); i++) {
        marketPromises.push(fetchMarketData(i));
      }

      const fetchedMarkets = await Promise.all(marketPromises);
      setMarkets(fetchedMarkets.filter((m): m is Market => m !== null));
    } catch (error) {
      console.error('Error fetching markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketData = async (marketId: number): Promise<Market | null> => {
    if (!publicClient) return null;

    try {
      // Fetch market details
      const marketData = await publicClient.readContract({
        address: PREDICTION_MARKET_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'getMarket',
        args: [BigInt(marketId)],
      }) as any;

      // Fetch user bet if connected
      let userBet = null;
      if (address) {
        const betData = await publicClient.readContract({
          address: PREDICTION_MARKET_ADDRESS,
          abi: PREDICTION_MARKET_ABI,
          functionName: 'getUserBet',
          args: [BigInt(marketId), address],
        }) as any;

        if (betData.hasBet ?? betData[2]) { // hasBet
          userBet = {
            amount: betData.amount || betData[0],
            betOnA: betData.betOnA ?? betData[1],
          };
        }
      }

      const market = {
        id: marketId,
        name: marketData.name || marketData[0],
        outcomeA: marketData.outcomeA || marketData[1],
        outcomeB: marketData.outcomeB || marketData[2],
        oracleA: marketData.oracleA || marketData[3],
        oracleB: marketData.oracleB || marketData[4],
        targetPrice: marketData.targetPrice || marketData[5],
        totalPoolA: marketData.totalPoolA || marketData[6],
        totalPoolB: marketData.totalPoolB || marketData[7],
        endTime: Number(marketData.endTime || marketData[8]),
        resolved: marketData.resolved ?? marketData[9],
        outcomeAWon: marketData.outcomeAWon ?? marketData[10],
        marketType: Number(marketData.marketType ?? marketData[12] ?? 0),
        creationPrice: marketData.creationPrice || marketData[13] || BigInt(0),
        isAutomatic: marketData.isAutomatic ?? marketData[14] ?? false,
        userBet,
      };

      return market;
    } catch (error) {
      console.error(`Error fetching market ${marketId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    fetchMarkets();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchMarkets, 30000);
    return () => clearInterval(interval);
  }, [publicClient, address]);

  return {
    markets,
    loading,
    refreshMarkets: fetchMarkets,
  };
}