'use client';

import { useState } from 'react';
import { useWalletClient, usePublicClient } from 'wagmi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PREDICTION_MARKET_ABI, PREDICTION_MARKET_ADDRESS } from '@/lib/contracts';
import { toast } from 'sonner';
import { Plus, Loader2 } from 'lucide-react';

interface CreateMarketDialogProps {
  onSuccess: () => void;
}

export function CreateMarketDialog({ onSuccess }: CreateMarketDialogProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [formData, setFormData] = useState({
    name: '',
    outcomeA: '',
    outcomeB: '',
    oracleA: '',
    oracleB: '',
    targetPrice: '',
    durationInDays: '30',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletClient || !publicClient) {
      toast.error('Wallet not connected');
      return;
    }

    try {
      setIsCreating(true);

      // Convert target price to the correct format (8 decimals)
      const targetPriceInWei = BigInt(Math.floor(parseFloat(formData.targetPrice) * 1e8));

      const { request } = await publicClient.simulateContract({
        address: PREDICTION_MARKET_ADDRESS,
        abi: PREDICTION_MARKET_ABI,
        functionName: 'createMarket',
        args: [
          formData.name,
          formData.outcomeA,
          formData.outcomeB,
          formData.oracleA as `0x${string}`,
          formData.oracleB as `0x${string}`,
          targetPriceInWei,
          BigInt(formData.durationInDays),
        ],
        account: walletClient.account,
      });

      const hash = await walletClient.writeContract(request);
      
      toast.loading('Creating market...', { id: hash });

      await publicClient.waitForTransactionReceipt({ hash });

      toast.success('Market created successfully!', { id: hash });
      
      setOpen(false);
      setFormData({
        name: '',
        outcomeA: '',
        outcomeB: '',
        oracleA: '',
        oracleB: '',
        targetPrice: '',
        durationInDays: '30',
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error creating market:', error);
      toast.error(error.message || 'Failed to create market');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Market
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Create New Market</DialogTitle>
          <DialogDescription className="text-slate-400">
            Set up a new prediction market with Chainlink oracles
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name" className="text-slate-300">Market Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Gold vs ETH to $5000"
              className="bg-slate-800 border-slate-700 text-white mt-1"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="outcomeA" className="text-slate-300">Outcome A</Label>
              <Input
                id="outcomeA"
                name="outcomeA"
                value={formData.outcomeA}
                onChange={handleChange}
                placeholder="e.g., Gold reaches $5000 first"
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="outcomeB" className="text-slate-300">Outcome B</Label>
              <Input
                id="outcomeB"
                name="outcomeB"
                value={formData.outcomeB}
                onChange={handleChange}
                placeholder="e.g., ETH reaches $5000 first"
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="oracleA" className="text-slate-300">Oracle A Address</Label>
              <Input
                id="oracleA"
                name="oracleA"
                value={formData.oracleA}
                onChange={handleChange}
                placeholder="0x..."
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="oracleB" className="text-slate-300">Oracle B Address</Label>
              <Input
                id="oracleB"
                name="oracleB"
                value={formData.oracleB}
                onChange={handleChange}
                placeholder="0x..."
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetPrice" className="text-slate-300">Target Price (USD)</Label>
              <Input
                id="targetPrice"
                name="targetPrice"
                type="number"
                value={formData.targetPrice}
                onChange={handleChange}
                placeholder="5000"
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
                step="0.01"
              />
            </div>

            <div>
              <Label htmlFor="durationInDays" className="text-slate-300">Duration (Days)</Label>
              <Input
                id="durationInDays"
                name="durationInDays"
                type="number"
                value={formData.durationInDays}
                onChange={handleChange}
                placeholder="30"
                className="bg-slate-800 border-slate-700 text-white mt-1"
                required
                min="1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-slate-700 text-slate-300"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Market'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}