import { useState, useEffect } from 'react';
import { useAccount, usePublicClient, useWalletClient } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const pUSD_ADDRESS = process.env.NEXT_PUBLIC_PUSD_ADDRESS as `0x${string}`;

// Minimal ERC20 ABI
const ERC20_ABI = [
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "spender", "type": "address" },
      { "name": "amount", "type": "uint256" }
    ],
    "name": "approve",
    "outputs": [{ "name": "", "type": "bool" }],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "name": "owner", "type": "address" },
      { "name": "spender", "type": "address" }
    ],
    "name": "allowance",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export function useTokenBalances() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [pUsdBalance, setPUsdBalance] = useState('0');

  const fetchBalances = async () => {
    if (!address || !publicClient) return;

    try {
      // Fetch pUSD balance
      const pUsdResult = await publicClient.readContract({
        address: pUSD_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      setPUsdBalance(formatUnits(pUsdResult as bigint, 18));
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  useEffect(() => {
    fetchBalances();
    // Refresh every 5 seconds
    const interval = setInterval(fetchBalances, 5000);
    return () => clearInterval(interval);
  }, [address, publicClient]);

  return {
    pUsdBalance,
    pUsdBalanceRaw: pUsdBalance ? parseUnits(pUsdBalance, 18) : BigInt(0),
    refetchBalances: fetchBalances,
  };
}

export function useTokenApproval(tokenAddress: `0x${string}`) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [isPending, setIsPending] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [allowance, setAllowance] = useState<bigint>(BigInt(0));

  const fetchAllowance = async () => {
    if (!address || !publicClient) return;

    try {
      const result = await publicClient.readContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'allowance',
        args: [address, CONTRACT_ADDRESS],
      });
      setAllowance(result as bigint);
    } catch (error) {
      console.error('Error fetching allowance:', error);
    }
  };

  useEffect(() => {
    fetchAllowance();
  }, [address, publicClient, tokenAddress]);

  const approve = async (amount: string) => {
    if (!walletClient || !publicClient) return;

    try {
      setIsPending(true);
      setIsSuccess(false);

      const amountWei = parseUnits(amount, 18);

      const hash = await walletClient.writeContract({
        address: tokenAddress,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [CONTRACT_ADDRESS, amountWei],
      });

      setIsPending(false);
      setIsConfirming(true);

      await publicClient.waitForTransactionReceipt({ hash });

      setIsConfirming(false);
      setIsSuccess(true);

      // Refetch allowance after approval
      setTimeout(() => {
        fetchAllowance();
      }, 500);
    } catch (error) {
      console.error('Error approving:', error);
      setIsPending(false);
      setIsConfirming(false);
    }
  };

  const hasAllowance = (amount: string) => {
    if (!allowance) return false;
    const amountWei = parseUnits(amount, 18);
    return allowance >= amountWei;
  };

  return {
    approve,
    hasAllowance,
    allowance,
    isPending,
    isConfirming,
    isSuccess,
    refetchAllowance: fetchAllowance,
  };
}
