import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import PredictionUSDabi from '../contracts/PredictionUSD.json';
import PredictionETHabi from '../contracts/PredictionETH.json';

const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
const pUSD_ADDRESS = process.env.NEXT_PUBLIC_PUSD_ADDRESS as `0x${string}`;
const pETH_ADDRESS = process.env.NEXT_PUBLIC_PETH_ADDRESS as `0x${string}`;

// Standard ERC20 ABI for approve and allowance
const ERC20_ABI = [
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
  },
  {
    "inputs": [{ "name": "account", "type": "address" }],
    "name": "balanceOf",
    "outputs": [{ "name": "", "type": "uint256" }],
    "stateMutability": "view",
    "type": "function"
  }
] as const;

export function useTokenBalances() {
  const { address } = useAccount();

  // Get pUSD balance
  const { data: pUsdBalance, refetch: refetchPUsd } = useReadContract({
    address: pUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!pUSD_ADDRESS && pUSD_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });

  // Get pETH balance
  const { data: pEthBalance, refetch: refetchPEth } = useReadContract({
    address: pETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!pETH_ADDRESS && pETH_ADDRESS !== '0x0000000000000000000000000000000000000000',
    },
  });

  const refetchBalances = () => {
    refetchPUsd();
    refetchPEth();
  };

  return {
    pUsdBalance: pUsdBalance ? formatUnits(pUsdBalance as bigint, 18) : '0',
    pEthBalance: pEthBalance ? formatUnits(pEthBalance as bigint, 18) : '0',
    pUsdBalanceRaw: pUsdBalance as bigint | undefined,
    pEthBalanceRaw: pEthBalance as bigint | undefined,
    refetchBalances,
  };
}

export function useTokenApproval(tokenAddress: `0x${string}`) {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Check current allowance
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONTRACT_ADDRESS] : undefined,
    query: {
      enabled: !!address,
    },
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const approve = (amount: string) => {
    const amountWei = parseUnits(amount, 18);

    writeContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [CONTRACT_ADDRESS, amountWei],
    });
  };

  const hasAllowance = (amount: string) => {
    if (!allowance) return false;
    const amountWei = parseUnits(amount, 18);
    return (allowance as bigint) >= amountWei;
  };

  return {
    approve,
    hasAllowance,
    allowance: allowance as bigint | undefined,
    isPending,
    isConfirming,
    isSuccess,
    refetchAllowance,
  };
}
