// hooks/usePosData.ts
import { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/toast';
import { POSProfile, POSItem } from '@/types/pos';

export function usePosData() {
  const { push } = useToast();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<POSProfile | null>(null);
  const [categories, setCategories] = useState<Array<{ name: string; items: POSItem[] }>>([]);
  const [customers, setCustomers] = useState<string[]>([]); // Add customers state
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPosData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/pos');
        if (!response.ok) {
          throw new Error('Failed to fetch POS data');
        }
        const data = await response.json();
        setProfile(data.data.profile);
        setCategories(data.data.categories);
        setCustomers(data.data.customers); // Set customers from API response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        push({
          variant: "error",
          title: "Error",
          description: errorMessage,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPosData();
  }, []);

  return { loading, profile, categories, customers, error, refetch: () => window.location.reload() };
}