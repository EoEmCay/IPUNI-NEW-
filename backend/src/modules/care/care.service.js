'use strict';

const db = require('../../config/database');
const memoryCache = require('../../utils/memoryCache');
const {
  isDoseDay,
  resolveTimes,
  parseYmd,
  vnParts,
  vnDateStr,
  vnWallToInstant,
} = require('../medications/medicationSchedule');
const { logDose } = require('../medications/adherence.service');
const {
  partOfDay,
  slotLabel,
  adherence,
  adherenceByMed,
  findMissPatterns,
  glucoseStats,
  buildWeeklyText,
} = require('../insights/insights.logic');

// Trả về { dateStr, dow, slot } theo GIỜ VIỆT NAM của một Instant (độc lập múi giờ máy chủ).
function vnDoseFields(instant) {
  const p = vnParts(new Date(instant));
  const dateStr = `${p.y}-${String(p.m + 1).padStart(2, '0')}-${String(p.d).padStart(2, '0')}`;
  const slot = `${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`;
  return { dateStr, dow: p.dow, slot };
}

// "HH:MM" theo GIỜ VIỆT NAM của một Instant (không phụ thuộc múi giờ máy chủ).
function vnHm(instant) {
  const p = vnParts(new Date(instant));
  return `${String(p.hh).padStart(2, '0')}:${String(p.mm).padStart(2, '0')}`;
}

/**
 * 'YYYY-MM-DD' (ngày VN) -> khoảng nửa mở [start, end) dạng ISO UTC.
 * Ví dụ 2026-11-09 -> [2026-11-08T17:00:00.000Z, 2026-11-09T17:00:00.000Z).
 * VN không có DST nên +24h luôn đúng. Trả kèm p = {y, m, d}.
 */
function dayRangeVn(dateStr) {
  const p = parseYmd(dateStr);
  if (!p) throw Object.assign(new Error('Ngày không hợp lệ'), { status: 400 });
  const start = vnWallToInstant(p.y, p.m, p.d, 0, 0);
  const end = new Date(start.getTime() + 86400000);
  return { start: start.toISOString(), end: end.toISOString(), p };
}

/**
 * Lấy dòng thời gian chăm sóc trực tiếp trong ngày (Live Care Timeline kiểu Grab).
 * Trả về danh sách sự kiện theo thứ tự thời gian từ sáng đến tối.
 */
async function getTimeline(patientId, targetDateStr = null) {
  // Toàn bộ timeline tính theo NGÀY/GIỜ VIỆT NAM (khớp engine lịch thuốc), không theo múi giờ máy chủ.
  const now = new Date();
  const todayStr = targetDateStr || vnDateStr(now);
  const currentHourMin = vnHm(now);
  const isToday = todayStr === vnDateStr(now);

  const cacheKey = `care:timeline:${patientId}:${todayStr}`;
  const hit = memoryCache.get(cacheKey);
  if (hit) return hit;

  const patient = await db('users').where({ id: patientId }).select('id', 'name', 'user_code').first();
  if (!patient) throw new Error('Không tìm thấy bệnh nhân');

  // 1. Lấy danh sách thuốc đang hoạt động của bệnh nhân
  const rawMeds = await db('medications').where({ user_id: patientId, is_active: 1 });
  const meds = rawMeds.map((m) => {
    let times = [];
    let slots = null;
    let days_of_week = null;
    try { times = JSON.parse(m.times || '[]'); } catch { times = []; }
    try { slots = m.slots ? JSON.parse(m.slots) : null; } catch { slots = null; }
    try { days_of_week = m.days_of_week ? JSON.parse(m.days_of_week) : null; } catch { days_of_week = null; }
    return { ...m, times, slots, days_of_week };
  });

  // 2. Lấy nhật ký uống thuốc trong ngày
  // Khoảng nửa mở [đầu ngày VN, đầu ngày VN kế) thay cho date(cột) = ? để DB dùng được index
  // (idx_medlog_user_time, metrics(user_id, measured_at)) và để liều/chỉ số trước 07:00 sáng giờ VN
  // (thuộc ngày UTC hôm trước) không bị rơi khỏi timeline. scheduled_for NOT NULL nên bỏ coalesce.
  const { start: dayStart, end: dayEnd, p: dv } = dayRangeVn(todayStr);

  const logs = await db('medication_logs')
    .where({ user_id: patientId })
    .where('scheduled_for', '>=', dayStart)
    .where('scheduled_for', '<', dayEnd);

  // 3. Lấy chỉ số đường huyết trong ngày
  const metrics = await db('metrics')
    .where({ user_id: patientId })
    .where('measured_at', '>=', dayStart)
    .where('measured_at', '<', dayEnd)
    .orderBy('measured_at', 'asc');

  const timelineItems = [];

  // Tạo các mốc thuốc theo cữ
  for (const med of meds) {
    if (!isDoseDay(med, dv)) continue;
    const doseTimes = resolveTimes(med);

    for (const time of doseTimes) {
      // Khớp ĐÚNG cữ: theo mốc Instant dự kiến của cữ (giờ VN -> UTC) hoặc theo slot_time (giờ VN).
      // Tuyệt đối không dùng "log taken bất kỳ của thuốc này" làm dự phòng: một cữ sáng đã uống
      // không được làm cữ trưa/tối hiện "đã uống".
      const [hh, mm] = time.split(':').map(Number);
      const expectedMs = vnWallToInstant(dv.y, dv.m, dv.d, hh, mm).getTime();
      const matchingLog = logs.find(
        (l) => l.medication_id === med.id &&
               ((l.scheduled_for && new Date(l.scheduled_for).getTime() === expectedMs) ||
                l.slot_time === time)
      );

      let status = 'pending';
      let takenAtStr = null;

      if (matchingLog) {
        status = matchingLog.status; // 'taken' | 'skipped' | 'missed'
        if (matchingLog.taken_at) takenAtStr = vnHm(matchingLog.taken_at);
      } else if (isToday && time < currentHourMin) {
        // Cữ đã qua giờ mà chưa xác nhận -> cảnh báo trễ/quên
        status = 'missed';
      }

      timelineItems.push({
        id: `med-${med.id}-${time}`,
        type: 'medication',
        time,
        title: `Cữ ${partOfDay(time)}: ${med.name}`,
        subtitle: `${med.dosage || ''} ${med.instructions ? '· ' + med.instructions : ''}`.trim(),
        status, // 'taken' | 'pending' | 'missed'
        taken_at: takenAtStr,
        medication_id: med.id,
        medication_name: med.name,
      });
    }
  }

  // Đưa các mốc đo đường huyết vào timeline
  for (const m of metrics) {
    const mTime = vnHm(m.measured_at);
    const val = Number(m.value);

    let gStatus = 'normal';
    if (val < 3.9) gStatus = 'danger'; // Hạ đường huyết nguy hiểm
    else if (val > 13.9) gStatus = 'danger'; // Tăng đường huyết rất cao
    else if (val > 10.0) gStatus = 'warning';

    timelineItems.push({
      id: `glucose-${m.id}`,
      type: 'glucose',
      time: mTime,
      title: 'Đo đường huyết',
      subtitle: `${val} mmol/L ${m.type ? `(${m.type})` : ''}`,
      value: val,
      unit: 'mmol/L',
      status: gStatus, // 'normal' | 'warning' | 'danger'
      measured_at: m.measured_at,
    });
  }

  // Sắp xếp timeline theo thứ tự thời gian từ sáng đến tối
  timelineItems.sort((a, b) => a.time.localeCompare(b.time));

  // Đánh giá trạng thái tổng thể trong ngày
  let overallStatus = 'stable'; // 'stable' | 'needs_attention' | 'danger'
  if (timelineItems.some((i) => i.status === 'danger')) {
    overallStatus = 'danger';
  } else if (timelineItems.some((i) => i.status === 'missed' || i.status === 'warning')) {
    overallStatus = 'needs_attention';
  }

  const result = {
    date: todayStr,
    patient_name: patient.name || 'Người thân',
    patient_id: patient.id,
    overall_status: overallStatus,
    summary: {
      total_doses: timelineItems.filter((i) => i.type === 'medication').length,
      taken_doses: timelineItems.filter((i) => i.type === 'medication' && i.status === 'taken').length,
      glucose_readings: timelineItems.filter((i) => i.type === 'glucose').length,
    },
    items: timelineItems,
  };
  memoryCache.set(cacheKey, result, 30 * 1000); // 30s cache chống bão request
  return result;
}

/**
 * Bản tin tuần cho con cháu & phân tích quy luật bỏ cữ lặp lại (AI Insights).
 */
async function getWeeklyInsights(patientId) {
  const patient = await db('users').where({ id: patientId }).select('id', 'name').first();
  if (!patient) throw new Error('Không tìm thấy bệnh nhân');

  // Lấy dữ liệu 14 ngày (7 ngày hiện tại vs 7 ngày trước đó)
  const now = new Date();
  const past14Days = new Date(now.getTime() - 14 * 24 * 3600 * 1000);

  const logs = await db('medication_logs as l')
    .join('medications as m', 'm.id', 'l.medication_id')
    .where('l.user_id', patientId)
    .where('l.scheduled_for', '>=', past14Days.toISOString())
    .select('l.*', 'm.name as med_name');

  const metrics = await db('metrics')
    .where({ user_id: patientId })
    .where('measured_at', '>=', past14Days.toISOString())
    .orderBy('measured_at', 'desc');

  // Chuẩn bị doses dạng [{ medName, dateStr, dow, slot, taken }]
  const dosesThisWeek = [];
  const dosesPrevWeek = [];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

  for (const l of logs) {
    const dTime = new Date(l.scheduled_for || l.taken_at || l.created_at);
    const { dateStr, dow, slot } = vnDoseFields(dTime);
    const taken = l.status === 'taken';

    const item = { medName: l.med_name || 'Thuốc', dateStr, dow, slot, taken };
    if (dTime >= sevenDaysAgo) dosesThisWeek.push(item);
    else dosesPrevWeek.push(item);
  }

  const weekAdherence = adherence(dosesThisWeek);
  const prevWeekAdherence = adherence(dosesPrevWeek);
  const missPatterns = findMissPatterns(dosesThisWeek.concat(dosesPrevWeek));
  const gStats = glucoseStats(metrics.filter((m) => new Date(m.measured_at) >= sevenDaysAgo));

  const missedList = dosesThisWeek.filter((d) => !d.taken);
  const weeklyText = buildWeeklyText({
    name: patient.name,
    week: weekAdherence,
    prevWeek: prevWeekAdherence,
    missedDoses: missedList,
    patterns: missPatterns,
    glucose: gStats,
  });

  return {
    patient_name: patient.name,
    title: weeklyText.title,
    lines: weeklyText.lines,
    stats: {
      week_adherence: weekAdherence,
      prev_adherence: prevWeekAdherence,
      miss_patterns: missPatterns,
      glucose: gStats,
    },
  };
}

/**
 * Báo cáo 1 trang cho Bác sĩ trước buổi tái khám (Doctor's 1-Page Briefing).
 */
async function getDoctorBriefing(patientId) {
  const patient = await db('users').where({ id: patientId }).first();
  if (!patient) throw new Error('Không tìm thấy bệnh nhân');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000);

  // 1. Danh sách thuốc hiện tại
  const meds = await db('medications')
    .where({ user_id: patientId, is_active: 1 })
    .select('id', 'name', 'dosage', 'frequency', 'instructions', 'doctor_name', 'prescribed_at', 'times', 'slots');

  // 2. Lịch sử tuân thủ 30 ngày
  const logs = await db('medication_logs as l')
    .join('medications as m', 'm.id', 'l.medication_id')
    .where('l.user_id', patientId)
    .where('l.scheduled_for', '>=', thirtyDaysAgo.toISOString())
    .select('l.*', 'm.name as med_name');

  const doses30d = logs.map((l) => {
    const dTime = new Date(l.scheduled_for || l.taken_at || l.created_at);
    const { dateStr, dow, slot } = vnDoseFields(dTime);
    return {
      medName: l.med_name || 'Thuốc',
      dateStr,
      dow,
      slot,
      taken: l.status === 'taken',
    };
  });

  const adherence30d = adherence(doses30d);
  const adherencePerMed = adherenceByMed(doses30d);
  const missPatterns = findMissPatterns(doses30d, { minMissed: 2, minRatio: 0.5 });

  // 3. Chỉ số đo 30 ngày (Đường huyết & Huyết áp)
  const metrics = await db('metrics')
    .where({ user_id: patientId })
    .where('measured_at', '>=', thirtyDaysAgo.toISOString())
    .orderBy('measured_at', 'asc');

  const glucoseMetrics = metrics.filter((m) =>
    (m.measurement_category || '').includes('glucose') ||
    (m.measurement_type || '').includes('glucose')
  );

  const bpMetrics = metrics.filter((m) =>
    (m.measurement_category || '').includes('blood_pressure') ||
    (m.measurement_type || '').includes('blood_pressure')
  );

  const gStats = glucoseStats(glucoseMetrics);

  let bpProfile = null;
  if (bpMetrics.length > 0) {
    const sysVals = bpMetrics.map((m) => Number(m.value)).filter(Number.isFinite);
    const diaVals = bpMetrics.map((m) => Number(m.value_diastolic)).filter(Number.isFinite);
    const avgSys = sysVals.length ? Math.round(sysVals.reduce((a, b) => a + b, 0) / sysVals.length) : null;
    const avgDia = diaVals.length ? Math.round(diaVals.reduce((a, b) => a + b, 0) / diaVals.length) : null;
    bpProfile = {
      readings_count: bpMetrics.length,
      average_systolic: avgSys,
      average_diastolic: avgDia,
      target_met: avgSys ? (avgSys < 130 && avgDia < 80) : null,
      recent_readings: bpMetrics.slice(-5),
    };
  }

  return {
    patient: {
      name: patient.name || 'Bệnh nhân',
      user_code: patient.user_code,
      date_of_birth: patient.date_of_birth,
      birth_year: patient.birth_year || (patient.date_of_birth ? new Date(patient.date_of_birth).getFullYear() : null),
      diagnosis: patient.diagnosis,
      blood_type: patient.blood_type,
      insurance_number: patient.insurance_number,
      phone: patient.phone,
      gender: patient.gender,
    },
    period: '30 ngày gần nhất',
    adherence: {
      overall_percent: adherence30d.percent, // null khi chưa có dữ liệu - KHÔNG được mặc định 100%
      total_expected: adherence30d.expected,
      total_taken: adherence30d.taken,
      by_medication: adherencePerMed,
      recurrent_miss_patterns: missPatterns,
    },
    glucose_profile: {
      readings_count: gStats.count,
      average_mmol: gStats.average,
      time_in_range_percent: gStats.timeInRangePercent,
      hypoglycemia_count: gStats.lows.length,
      severe_hyperglycemia_count: gStats.highs.length,
      recent_readings: glucoseMetrics.slice(-10),
    },
    bp_profile: bpProfile,
    active_medications: meds,
  };
}

module.exports = {
  getTimeline,
  getWeeklyInsights,
  getDoctorBriefing,
  logDose,
};
