import { useCallback } from 'react';
import useMedicationsStore from '../store/medicationsStore';
import { medicationsService } from '../services/medications.service';
import { getLocalCache, setLocalCache, CACHE_KEYS } from '../services/localCache';

export function useMedications() {
  const {
    medications,
    todayMedications,
    loading,
    setMedications,
    setTodayMedications,
    setLoading,
  } = useMedicationsStore();

  const fetchMedications = useCallback(async () => {
    // Nếu store chưa có danh sách thuốc, khôi phục nhanh từ IndexedDB
    if (!medications || medications.length === 0) {
      const cached = await getLocalCache(CACHE_KEYS.ALL_MEDICATIONS, []);
      if (cached && cached.length > 0) {
        setMedications(cached);
      } else {
        setLoading(true);
      }
    }
    try {
      const res = await medicationsService.getAll();
      const list = res.data?.data || res.data || [];
      setMedications(list);
      setLocalCache(CACHE_KEYS.ALL_MEDICATIONS, list);
    } catch (err) {
      console.warn('[useMedications] Lỗi tải danh sách thuốc từ server, giữ bản cache:', err);
    } finally {
      setLoading(false);
    }
  }, [medications, setMedications, setLoading]);

  const fetchToday = useCallback(async () => {
    // Chiến lược Stale-While-Revalidate: nạp ngay từ IndexedDB nếu store trống
    if (!todayMedications || todayMedications.length === 0) {
      const cached = await getLocalCache(CACHE_KEYS.TODAY_MEDICATIONS, []);
      if (cached && cached.length > 0) {
        setTodayMedications(cached);
      }
    }
    try {
      const res = await medicationsService.getToday();
      const list = res.data?.data || res.data || [];
      setTodayMedications(list);
      setLocalCache(CACHE_KEYS.TODAY_MEDICATIONS, list);
    } catch {
      // Khi mất mạng tạm thời, không chặn UI vì người già vẫn xem được thuốc từ bộ nhớ máy
    }
  }, [todayMedications, setTodayMedications]);

  return { medications, todayMedications, loading, fetchMedications, fetchToday };
}
