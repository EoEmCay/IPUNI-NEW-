import { useState } from 'react';
import { FileText, Loader2 } from 'lucide-react';
import { metricsService } from '../../services/metrics.service';
import { medicationsService } from '../../services/medications.service';
import useAuthStore from '../../store/authStore';
import { buildReportModel, exportPdf } from '../../utils/medicalReport';
import styles from './ExportReportButton.module.css';

/**
 * Nút xuất "Sổ theo dõi đường huyết & tuân thủ thuốc" (PDF) để mang đi khám.
 * Xuất hoàn toàn phía client.
 */
export default function ExportReportButton({ days = 30, patientOverride = null }) {
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function collect() {
    const [mAll, meds, logs, adh] = await Promise.all([
      metricsService.getMetrics(undefined, days),
      medicationsService.getAll(),
      medicationsService.getLogs(days),
      medicationsService.getAdherence(days),
    ]);
    return buildReportModel({
      patient: patientOverride || user,
      metrics: mAll.data.data,
      medications: meds.data.data,
      medicationLogs: logs.data.data,
      adherence: adh.data.data,
      period: `${days} ngày gần nhất`,
    });
  }

  const run = async () => {
    setBusy(true);
    setErr('');
    try {
      const model = await collect();
      await exportPdf(model);
    } catch (e) {
      setErr(e?.message || 'Không tạo được báo cáo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.wrap}>
      <button className={styles.btnAlt} onClick={run} disabled={busy}>
        {busy ? <Loader2 className={styles.spin} size={18} /> : <FileText size={18} />}
        Xuất báo cáo PDF cho bác sĩ
      </button>
      {err && <span className={styles.err}>{err}</span>}
    </div>
  );
}
