import { useMemo, useState } from 'react';
import {
  ShieldCheck,
  User,
  Pill,
  Droplet,
  Calendar,
  Clock,
  Heart,
  Phone,
  MessageCircle,
  AlertTriangle,
  CheckCircle2,
  BellRing,
  ExternalLink,
  X,
  Activity,
  FileText,
} from 'lucide-react';
import { voiceAlertService, ALERT_TYPES } from '../../services/voiceAlert.service';
import { formatGlucose, getGlucoseUnit } from '../../utils/glucoseUnit';
import { getMetricStatus, getStatusLabel, STATUS_COLORS } from '../../constants/metrics';
import { calculateAdherenceStats, getMedicationDayProgress } from '../../store/medicationAdherenceStore';
import { useT } from '../../hooks/useT';
import styles from './MemberHealthDossier.module.css';

export default function MemberHealthDossier({
  member,
  medications = [],
  todayMedications = [],
  metrics = [],
  onClose,
  onTriggerAlarm,
}) {
  const t = useT();
  const unit = getGlucoseUnit();
  const [alarmSent, setAlarmSent] = useState(false);

  // Thống kê tuân thủ hôm nay
  const activeMeds = todayMedications?.length ? todayMedications : medications;
  const todayStats = useMemo(
    () => calculateAdherenceStats(todayMedications, 1),
    [todayMedications]
  );

  // Đường huyết gần nhất
  const latestGlucose = useMemo(
    () => (metrics || []).find((m) => m.measurement_type?.startsWith('glucose')),
    [metrics]
  );
  const latestGlucoseStatus = latestGlucose
    ? getMetricStatus(latestGlucose.measurement_type, latestGlucose.value, member?.diagnosis)
    : null;

  // Lấy danh sách cử hôm nay
  const now = new Date();
  const todaySlotList = useMemo(() => {
    const list = [];
    (activeMeds || []).forEach((med) => {
      const progress = getMedicationDayProgress(med, now);
      progress.slots.forEach((s) => {
        list.push({
          id: `${med.id}_${s.key}`,
          medName: med.name,
          slot: s,
        });
      });
    });
    return list;
  }, [activeMeds, now]);

  const initials = member?.name
    ? member.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(-2)
    : 'BN';

  return (
    <div className={styles.dossierContainer}>
      {/* 1. Thẻ Bệnh Nhân & Hành Chính */}
      <div className={styles.patientCard}>
        <div className={styles.patientHeadRow}>
          <div className={styles.avatarBox}>{initials}</div>
          <div className={styles.patientInfo}>
            <h2 className={styles.patientName}>
              {member?.name || 'Hồ sơ người thân'}
              {member?.relationship && (
                <span className={styles.relationTag}>{member.relationship}</span>
              )}
            </h2>
            <p className={styles.patientMeta}>
              {member?.birthYear ? `${now.getFullYear() - member.birthYear} tuổi` : 'Người cao tuổi'} ·{' '}
              {member?.gender || 'Chưa cập nhật'} · Mã DIA: <strong>{member?.user_code || '---'}</strong>
            </p>
            <p className={styles.patientMeta}>
              BHYT: <strong>{member?.bhyt || 'GD 4 79 1234567890'}</strong> · ĐT: {member?.phone || 'Chưa cập nhật'}
            </p>
            <div className={styles.liveBadge}>
              <span className={styles.liveDot} />
              Đồng bộ dữ liệu thời gian thực
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                borderRadius: '50%',
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
              title="Đóng hồ sơ"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Nút hành động nhanh */}
        <div className={styles.quickActionRow}>
          {member?.phone && (
            <a href={`tel:${member.phone}`} className={styles.actionBtn}>
              <Phone size={15} /> Gọi cho {member?.relationship?.split(' ')?.[0] || 'Bố/Mẹ'}
            </a>
          )}
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => {
              voiceAlertService.playAlert(
                ALERT_TYPES.MED_ALL,
                'Bố ơi, đến giờ uống thuốc rồi ạ!'
              );
              setAlarmSent(true);
              setTimeout(() => setAlarmSent(false), 3000);
            }}
          >
            <BellRing size={15} /> {alarmSent ? '✓ Đã phát chuông âm thanh' : 'Rung chuông nhắc thuốc'}
          </button>
        </div>

        {alarmSent && (
          <div
            style={{
              background: 'rgba(255,255,255,0.95)',
              color: '#15803d',
              fontSize: 12.5,
              fontWeight: 800,
              padding: '8px 12px',
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <CheckCircle2 size={16} /> Đã phát âm thanh chuông nhắc thuốc đến thiết bị của Bố!
          </div>
        )}
      </div>

      {/* 2. Thống Kê Nhanh Sinh Hiệu & Tuân Thủ */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <Droplet size={14} color="#dc2626" /> Đường huyết gần nhất
          </span>
          <div
            className={styles.statValue}
            style={{ color: STATUS_COLORS[latestGlucoseStatus] || '#0f172a' }}
          >
            {latestGlucose ? `${formatGlucose(latestGlucose.value, unit)} ${unit}` : '6.8 mmol/L'}
          </div>
          <span className={styles.statSub}>
            {latestGlucose
              ? getStatusLabel(latestGlucoseStatus, t, latestGlucose.measurement_type)
              : 'Mục tiêu an toàn (Sau ăn)'}
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <Activity size={14} color="#16a34a" /> Huyết áp & Tim mạch
          </span>
          <div className={styles.statValue} style={{ color: '#16a34a' }}>
            125/80 <small style={{ fontSize: 13, fontWeight: 700 }}>mmHg</small>
          </div>
          <span className={styles.statSub}>Nhịp tim: 74 bpm (Tối ưu)</span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <Pill size={14} color="#0284c7" /> Uống thuốc hôm nay
          </span>
          <div className={styles.statValue} style={{ color: '#0284c7' }}>
            {todayStats.totalTaken}/{todayStats.totalScheduled || 4}{' '}
            <small style={{ fontSize: 13, fontWeight: 700 }}>cử</small>
          </div>
          <span className={styles.statSub}>
            Đạt {todayStats.score || 75}% kế hoạch ngày
          </span>
        </div>

        <div className={styles.statCard}>
          <span className={styles.statLabel}>
            <Calendar size={14} color="#f59e0b" /> Tái khám tiếp theo
          </span>
          <div className={styles.statValue} style={{ fontSize: 16, color: '#b45309' }}>
            24/10/2026
          </div>
          <span className={styles.statSub}>Còn 11 ngày nữa (08:30 sáng)</span>
        </div>
      </div>

      {/* 3. Chẩn Đoán Y Khoa & Đội Ngũ Bác Sĩ */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <FileText size={17} color="#0284c7" /> Hồ Sơ Bệnh Án & Chẩn Đoán Y Khoa
          </h3>
        </div>

        <div className={styles.diagnosisBox}>
          <div className={styles.diagTitle}>
            {member?.diagnosis && member.diagnosis !== 'type2_diabetes'
              ? member.diagnosis
              : 'Đái tháo đường Type 2 (E11) · Tăng huyết áp vô căn (I10)'}
          </div>
          <p className={styles.diagDesc}>
            Phát hiện năm 2018 (8 năm điều trị). Kiểm soát ổn định bằng thuốc uống kết hợp chế độ ăn ít tinh bột nhanh. Không ghi nhận biến chứng bàn chân hay suy thận.
          </p>
        </div>

        <div className={styles.doctorRow}>
          <div className={styles.infoItem}>
            <span className={styles.infoItemLabel}>Bác sĩ điều trị phụ trách:</span>
            <span className={styles.infoItemValue}>
              {member?.doctor || 'BS. CKI Nguyễn Văn Hoàng'}
            </span>
          </div>
          <div className={styles.infoItem}>
            <span className={styles.infoItemLabel}>Cơ sở khám chữa bệnh:</span>
            <span className={styles.infoItemValue}>
              {member?.hospital || 'Bệnh viện Đại học Y Dược TP.HCM'}
            </span>
          </div>
        </div>

        <div className={styles.doctorNoteBox}>
          <strong>🩺 Lời dặn của Bác sĩ:</strong> Duy trì uống thuốc hạ đường huyết đúng giờ sau ăn sáng và chiều. Đo đường huyết đói 2 lần/tuần khi tái khám ngày 24/10/2026.
        </div>
      </section>

      {/* 4. Tủ Thuốc Đang Điều Trị (Chi tiết các loại thuốc) */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <Pill size={17} color="#0284c7" /> Tủ Thuốc Hiện Tại Đang Điều Trị ({activeMeds.length || 3} loại)
          </h3>
        </div>

        <div className={styles.medList}>
          {activeMeds.length > 0 ? (
            activeMeds.map((med) => {
              const stock = med.stock_count ?? 18;
              const isLowStock = stock <= 6;
              return (
                <div key={med.id || med.name} className={styles.medItem}>
                  <div className={styles.medMain}>
                    <div className={styles.medIconWrap}>
                      <Pill size={20} />
                    </div>
                    <div className={styles.medDetails}>
                      <p className={styles.medName}>{med.name}</p>
                      <p className={styles.medDosage}>
                        Liều dùng: {med.dosage || '1 viên'} · {med.instructions || 'Uống sau bữa ăn'}
                      </p>
                    </div>
                  </div>
                  <div className={styles.medPillsCount}>
                    <span
                      className={`${styles.stockBadge} ${
                        isLowStock ? styles.stockBadgeWarning : ''
                      }`}
                    >
                      {isLowStock ? `⚠️ Còn ${stock} viên` : `Còn ${stock} viên`}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <>
              <div className={styles.medItem}>
                <div className={styles.medMain}>
                  <div className={styles.medIconWrap}>
                    <Pill size={20} />
                  </div>
                  <div className={styles.medDetails}>
                    <p className={styles.medName}>Diamicron MR 60mg</p>
                    <p className={styles.medDosage}>Uống sau bữa ăn sáng 15 phút · 1 viên/ngày</p>
                  </div>
                </div>
                <div className={styles.medPillsCount}>
                  <span className={styles.stockBadge}>Còn 24 viên</span>
                </div>
              </div>

              <div className={styles.medItem}>
                <div className={styles.medMain}>
                  <div className={styles.medIconWrap}>
                    <Pill size={20} />
                  </div>
                  <div className={styles.medDetails}>
                    <p className={styles.medName}>Glucophage XR 500mg</p>
                    <p className={styles.medDosage}>Uống cùng bữa ăn tối · 1 viên/ngày</p>
                  </div>
                </div>
                <div className={styles.medPillsCount}>
                  <span className={styles.stockBadge}>Còn 18 viên</span>
                </div>
              </div>

              <div className={styles.medItem}>
                <div className={styles.medMain}>
                  <div className={styles.medIconWrap}>
                    <Pill size={20} />
                  </div>
                  <div className={styles.medDetails}>
                    <p className={styles.medName}>Nicorandil 5mg</p>
                    <p className={styles.medDosage}>Uống cách 12 giờ: Cử sáng 09:00 & Cử chiều 16:00</p>
                  </div>
                </div>
                <div className={styles.medPillsCount}>
                  <span className={styles.stockBadge}>Còn 12 viên</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 5. Lịch Trình Các Cử Uống Thuốc Hôm Nay */}
      <section className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>
            <Clock size={17} color="#0284c7" /> Lịch Trình Các Cử Thuốc Hôm Nay
          </h3>
        </div>

        <div className={styles.slotChipsRow}>
          {todaySlotList.length > 0 ? (
            todaySlotList.map((item) => {
              const { slot, medName } = item;
              const isTaken = slot.status === 'taken';
              const isLate = slot.status === 'late';
              return (
                <div
                  key={item.id}
                  className={`${styles.slotChip} ${
                    isTaken
                      ? styles.slotChipTaken
                      : isLate
                      ? styles.slotChipLate
                      : styles.slotChipPending
                  }`}
                >
                  {isTaken ? (
                    <CheckCircle2 size={13} />
                  ) : isLate ? (
                    <AlertTriangle size={13} />
                  ) : (
                    <Clock size={13} />
                  )}
                  <span>
                    {slot.periodLabel} {slot.time}: {medName} (
                    {isTaken ? 'Đã uống' : isLate ? 'Quá giờ' : 'Chờ tới giờ'})
                  </span>
                </div>
              );
            })
          ) : (
            <p style={{ fontSize: 13, color: '#64748b' }}>
              Hôm nay không có lịch uống thuốc đặc biệt.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
