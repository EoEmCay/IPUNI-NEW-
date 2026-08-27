import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clinicService } from '../../services/clinic.service';
import { useClinicStream } from '../../hooks/useClinicStream';
import ExportReportButton from '../../components/reports/ExportReportButton';
import styles from './ClinicPatientPage.module.css';

const fmt = (iso) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)} ${p(d.getHours())}:${p(d.getMinutes())}`;
};

export default function ClinicPatientPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');

  const load = useCallback(async () => {
    try {
      clinicService.refresh();
      const res = await clinicService.getPatient(id, 30);
      setData(res.data.data);
    } catch (e) {
      setErr(e?.response?.data?.message || 'Không tải được hồ sơ bệnh nhân');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useClinicStream((type, evt) => {
    if (evt?.patientId && String(evt.patientId) === String(id)) load();
  });

  const ack = async (alertId) => {
    await clinicService.ackAlert(alertId);
    load();
  };

  if (err) return <div className={styles.state}>{err} <button onClick={() => nav('/clinic')}>Quay lại</button></div>;
  if (!data) return <div className={styles.state}>Đang tải…</div>;

  const { patient, metrics, medications, medicationLogs, adherence, appointments, alerts } = data;
  const openAlerts = (alerts || []).filter((a) => !a.acknowledged);

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => nav('/clinic')}>← Danh sách bệnh nhân</button>

      <header className={styles.head}>
        <h1>{patient?.name || '(chưa đặt tên)'}</h1>
        <div className={styles.hcard}>
          <span>Chẩn đoán: <b>{patient?.diagnosis || '—'}</b></span>
          <span>Ngày sinh: {patient?.date_of_birth || '—'}</span>
          <span>SĐT: {patient?.phone || '—'}</span>
          <span>Dị ứng: {patient?.allergies || 'Không'}</span>
        </div>
      </header>

      {openAlerts.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.hCrit}>Cảnh báo chưa xử lý</h2>
          {openAlerts.map((a) => (
            <div key={a.id} className={a.severity === 'critical' ? styles.alertCrit : styles.alertWarn}>
              <div>
                <b>{a.title}</b>
                <p>{a.detail}</p>
                <small>{fmt(a.created_at)}</small>
              </div>
              <button onClick={() => ack(a.id)}>Đã xử lý</button>
            </div>
          ))}
        </section>
      )}

      <section className={styles.section}>
        <h2>Tuân thủ thuốc (30 ngày)</h2>
        <div className={styles.adh}>
          <div className={styles.big} style={{ color: adherence?.isPoorAdherence ? '#dc2626' : '#16a34a' }}>
            {adherence?.adherencePercent ?? '—'}%
          </div>
          <div className={styles.adhMeta}>
            <span>Kỳ vọng {adherence?.expectedDoses ?? 0} liều</span>
            <span>Đã uống {adherence?.takenDoses ?? 0}</span>
            <span>Bỏ lỡ {adherence?.missedDoses ?? 0}</span>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Đơn thuốc đang dùng ({medications?.length || 0})</h2>
        {(medications || []).map((m) => (
          <div key={m.id} className={styles.med}>
            <b>{m.name}</b> {m.dosage} · {Array.isArray(m.times) ? m.times.join(', ') : ''}
            <span className={styles.tag}>{scheduleLabel(m)}</span>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2>Đường huyết gần đây</h2>
        <div className={styles.metricList}>
          {(metrics || [])
            .filter((x) => (x.measurement_category || '').includes('glucose'))
            .slice(0, 20)
            .map((x) => (
              <div key={x.id} className={styles.metricRow}>
                <span>{fmt(x.measured_at)}</span>
                <b style={{ color: color(x) }}>{x.value} {x.unit || 'mmol/L'}</b>
                <span>{x.note || ''}</span>
              </div>
            ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2>Lịch hẹn / tái khám</h2>
        {(appointments || []).slice(0, 5).map((a) => (
          <div key={a.id} className={styles.appt}>
            {fmt(a.scheduled_at)} — {a.doctor_name} <span className={styles.tag}>{a.status}</span>
          </div>
        ))}
      </section>

      <section className={styles.section}>
        <h2>Xuất báo cáo cho bệnh nhân</h2>
        <ExportReportButton days={30} patientOverride={patient} />
      </section>

      <details className={styles.section}>
        <summary>Nhật ký uống thuốc ({medicationLogs?.length || 0})</summary>
        {(medicationLogs || []).map((l) => (
          <div key={l.id} className={styles.logRow}>
            {fmt(l.scheduled_for)} · {l.medication_name} · cữ {l.slot_time} ·{' '}
            <b className={styles[`s_${l.status}`]}>
              {{ taken: 'Đã uống', skipped: 'Bỏ qua', missed: 'Quên' }[l.status] || l.status}
            </b>
          </div>
        ))}
      </details>
    </div>
  );
}

function scheduleLabel(m) {
  if (m.schedule_type === 'every_n_days') return m.every_n_days === 2 ? 'Cách ngày' : `Mỗi ${m.every_n_days} ngày`;
  if (m.schedule_type === 'days_of_week') return 'Theo thứ';
  if (m.schedule_type === 'as_needed') return 'Khi cần';
  return 'Hằng ngày';
}
function color(x) {
  const v = Number(x.value);
  if (v < 3.9) return '#7c3aed';
  if (v > 13.9) return '#dc2626';
  if (v >= 10) return '#d97706';
  return '#16a34a';
}
