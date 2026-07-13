import { useCallback } from 'react';
import useMedicationsStore from '../store/medicationsStore';
import { medicationsService } from '../services/medications.service';

export function useMedications() {
  const { medications, todayMedications, loading, setMedications, setTodayMedications, setLoading } = useMedicationsStore();

  const fetchMedications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await medicationsService.getAll();
      setMedications(res.data.data);
    } finally {
      setLoading(false);
    }
  }, [setMedications, setLoading]);

  const fetchToday = useCallback(async () => {
    try {
      const res = await medicationsService.getToday();
      setTodayMedications(res.data.data);
    } catch {}
  }, [setTodayMedications]);

  return { medications, todayMedications, loading, fetchMedications, fetchToday };
}
