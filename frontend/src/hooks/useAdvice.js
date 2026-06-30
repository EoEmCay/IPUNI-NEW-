import { useCallback } from 'react';
import useAdviceStore from '../store/adviceStore';
import { adviceService } from '../services/advice.service';

export function useAdvice() {
  const { advice, loading, setAdvice, setLoading } = useAdviceStore();

  const fetchAdvice = useCallback(async (category) => {
    setLoading(true);
    try {
      const res = await adviceService.getAll(category);
      setAdvice(res.data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  return { advice, loading, fetchAdvice };
}
