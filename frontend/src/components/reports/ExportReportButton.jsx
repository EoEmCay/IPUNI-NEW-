import { useState } from 'react';
import { FileText, Table, Loader2 } from 'lucide-react';
import { metricsService } from '../../services/metrics.service';
import { medicationsService } from '../../services/medications.service';
import useAuthStore from '../../store/authStore';
import { buildReportModel, exportPdf, exportCsv } from '../../utils/medicalReport';
import styles from './ExportReportButton.module.css';

/**
 * Nút xuất "Sổ theo dõi đường huyết & tuân thủ thuốc" (PDF y khoa / Excel).
 * Xuất hoàn toàn phía client.
 */
export default function ExportReportButton({ days = 30, patientOverride = null }) {
  const user = useAuthStore((s) => s.user);
  const [busy, setBusy] = useState(null);
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

  const run = async (kind) => {
    setBusy(kind);
    setErr('');
    try {
      const model = await collect();
      if (kind === 'pdf') await exportPdf(model);
      else exportCsv(model);
    } catch (e) {
      setErr(e?.message || 'Không tạo được báo cáo');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={styles.wrap}>
      <button className={styles.btn} onClick={() => run('pdf')} disabled={!!busy}>
        {busy === 'pdf' ? <Loader2 className={styles.spin} size={16} /> : <FileText size={16} />}
        Xuất PDF y khoa
      </button>
      <button className={styles.btnAlt} onClick={() => run('csv')} disabled={!!busy}>
        {busy === 'csv' ? <Loader2 className={styles.spin} size={16} /> : <Table size={16} />}
        Xuất Excel (.csv)
      </button>
      {err && <span className={styles.err}>{err}</span>}
    </div>
  );
}
