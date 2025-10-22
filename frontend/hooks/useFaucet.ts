import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import TokenFaucetabi from '../contracts/TokenFaucet.json';

const FAUCET_ADDRESS = process.env.NEXT_PUBLIC_FAUCET_ADDRESS as `0x${string}`;

export function useFaucet() {
  const { address } = useAccount();
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Check if user can claim
  const { data: canClaimData, refetch } = useReadContract({
    address: FAUCET_ADDRESS,
    abi: TokenFaucetabi,
    functionName: 'canClaim',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address,
      refetchInterval: 500000, // Refetch every 500 seconds
    },
  });

  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  });

  const claim = () => {
    writeContract({
      address: FAUCET_ADDRESS,
      abi: TokenFaucetabi,
      functionName: 'claim',
    });
  };

  // canClaimData is a tuple: [bool able, uint256 timeUntilNextClaim]
  const canClaim = canClaimData ? (canClaimData as [boolean, bigint])[0] : false;
  const timeUntilNextClaim = canClaimData ? Number((canClaimData as [boolean, bigint])[1]) : 0;

  return {
    claim,
    canClaim,
    timeUntilNextClaim,
    isPending,
    isConfirming,
    isSuccess,
    refetch,
  };
}
