import { useEffect, useRef } from 'react';
import { voiceAlertService, ALERT_TYPES } from '../../services/voiceAlert.service';
import { useMedications } from '../../hooks/useMedications';
import { useToast } from '../../hooks/useToast';

export default function VoiceAlertEngine() {
  const { medications, fetchMedications } = useMedications();
  const { showToast } = useToast();
  
  // Ref to track already alerted medications so we don't alert multiple times
  const alertedRef = useRef({});

  useEffect(() => {
    fetchMedications();
    // Request notification permission for local background alerts
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [fetchMedications]);

  useEffect(() => {
    const checkMedicationTimes = () => {
      if (!medications || medications.length === 0) return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      const dateString = now.toDateString();

      let triggeredType = null;
      let medsToTake = [];

      medications.forEach(med => {
        if (med.times && med.times.includes(timeString)) {
          const alertKey = `${med.id}_${dateString}_${timeString}`;
          if (!alertedRef.current[alertKey]) {
            alertedRef.current[alertKey] = true;
            medsToTake.push(med.name);
            
            if (!triggeredType) {
              triggeredType = ALERT_TYPES.MED_ALL;
            }
          }
        }
      });

      if (triggeredType && medsToTake.length > 0) {
        voiceAlertService.playAlert(triggeredType, medsToTake);
        
        const msg = `Đã đến giờ uống thuốc: ${medsToTake.join(', ')}`;
        showToast(msg, 'success'); 
        
        // Show Local Notification (works on desktop and PWA on mobile)
        if ('Notification' in window && Notification.permission === 'granted') {
          try {
            new Notification('Nhắc nhở uống thuốc (Diaplus)', {
              body: msg,
              icon: '/logo192.png',
              badge: '/logo192.png',
              vibrate: [200, 100, 200, 100, 200]
            });
          } catch (e) {
            console.error('Local Notification failed', e);
          }
        }
      }
    };

    // Check every 30 seconds
    const interval = setInterval(() => {
      checkMedicationTimes();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [medications, showToast]);

  return null;
}
