import { useState } from 'react';
import { useToast } from '@/components/ui/toast';
import { StockCheck } from '@/types/pos';

export function useStockCheck() {
  const [checking, setChecking] = useState(false);
  const { push: toast } = useToast();

  const checkStock = async (itemCodes: string[], warehouse: string) => {
    try {
      setChecking(true);
      const params = new URLSearchParams({
        item_codes: itemCodes.join(','),
        warehouse,
      });
      
      const response = await fetch(`/api/pos/stock-check?${params}`);
      if (!response.ok) {
        throw new Error('Failed to check stock');
      }
      
      const data = await response.json();
      return data.data.stock as StockCheck[];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toast({
        variant: "error",
        title: "Stock Check Error",
        description: errorMessage,
      });
      return [];
    } finally {
      setChecking(false);
    }
  };

  return { checking, checkStock };
}