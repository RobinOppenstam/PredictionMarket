import { useState, useEffect } from 'react';
import { usePublicClient } from 'wagmi';
import { formatUnits } from 'viem';

const ORACLE_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { name: 'roundId', type: 'uint80' },
      { name: 'answer', type: 'int256' },
      { name: 'startedAt', type: 'uint256' },
      { name: 'updatedAt', type: 'uint256' },
      { name: 'answeredInRound', type: 'uint80' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export function useOraclePrice(oracleAddress: string | null) {
  const [price, setPrice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const publicClient = usePublicClient();

  const fetchPrice = async () => {
    if (!publicClient || !oracleAddress || oracleAddress === '0x0000000000000000000000000000000000000000') {
      return;
    }

    try {
      setLoading(true);
      const result = await publicClient.readContract({
        address: oracleAddress as `0x${string}`,
        abi: ORACLE_ABI,
        functionName: 'latestRoundData',
      });

      // result[1] is the answer/price with 8 decimals
      const priceValue = formatUnits(result[1] as bigint, 8);
      setPrice(priceValue);
    } catch (error) {
      console.error('Error fetching oracle price:', error);
      setPrice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();

    // Refresh every 105 seconds
    const interval = setInterval(fetchPrice, 105000);
    return () => clearInterval(interval);
  }, [publicClient, oracleAddress]);

  return { price, loading, refetch: fetchPrice };
}
