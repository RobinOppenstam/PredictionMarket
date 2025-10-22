'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DollarSign } from 'lucide-react';
import { useTokenBalances } from '@/hooks/useTokensSimple';

export default function TokenBalances() {
  const { pUsdBalance } = useTokenBalances();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (num >= 1000) {
      return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  };

  if (!mounted) {
    return (
      <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold cursor-default">
        <DollarSign className="w-4 h-4 mr-2" />
        $0
      </Button>
    );
  }

  return (
    <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-semibold cursor-default">
      <DollarSign className="w-4 h-4 mr-2" />
      ${formatBalance(pUsdBalance)}
    </Button>
  );
}
