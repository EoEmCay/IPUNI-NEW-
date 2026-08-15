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
    } catch {
      // Bỏ qua - không chặn UI vì đây chỉ là dữ liệu phụ (thuốc hôm nay)
    }
  }, [setTodayMedications]);

  return { medications, todayMedications, loading, fetchMedications, fetchToday };
}
