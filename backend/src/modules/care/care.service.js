'use strict';

const db = require('../../config/database');
const { isMedicationScheduledOnDate, getDoseTimesForDate } = require('../medications/medicationSchedule');
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

// Helper formatting YYYY-MM-DD
function toDateStr(d) {
  const dt = new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Lấy dòng thời gian chăm sóc trực tiếp trong ngày (Live Care Timeline kiểu Grab).
 * Trả về danh sách sự kiện theo thứ tự thời gian từ sáng đến tối.
 */
async function getTimeline(patientId, targetDateStr = null) {
  const todayStr = targetDateStr || toDateStr(new Date());
  const now = new Date();
  const currentHourMin = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const isToday = todayStr === toDateStr(now);

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
  const logs = await db('medication_logs')
    .where({ user_id: patientId })
    .whereRaw("date(coalesce(scheduled_for, taken_at)) = ?", [todayStr]);

  // 3. Lấy chỉ số đường huyết trong ngày
  const metrics = await db('metrics')
    .where({ user_id: patientId })
    .whereRaw("date(measured_at) = ?", [todayStr])
    .orderBy('measured_at', 'asc');

  const timelineItems = [];

  // Tạo các mốc thuốc theo cữ
  for (const med of meds) {
    if (!isMedicationScheduledOnDate(med, todayStr)) continue;
    const doseTimes = getDoseTimesForDate(med, todayStr);

    for (const time of doseTimes) {
      // Tìm xem cữ này đã được ghi nhận chưa
      const matchingLog = logs.find(
        (l) => l.medication_id === med.id &&
               l.scheduled_for &&
               l.scheduled_for.includes(time)
      ) || logs.find((l) => l.medication_id === med.id && l.status === 'taken');

      let status = 'pending';
      let takenAtStr = null;

      if (matchingLog) {
        status = matchingLog.status; // 'taken' | 'missed'
        if (matchingLog.taken_at) {
          const tDate = new Date(matchingLog.taken_at);
          takenAtStr = `${String(tDate.getHours()).padStart(2, '0')}:${String(tDate.getMinutes()).padStart(2, '0')}`;
        }
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
    const mDate = new Date(m.measured_at);
    const mTime = `${String(mDate.getHours()).padStart(2, '0')}:${String(mDate.getMinutes()).padStart(2, '0')}`;
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

  return {
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
    .where('l.created_at', '>=', past14Days.toISOString())
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
    const dateStr = toDateStr(dTime);
    const dow = dTime.getDay();
    const slot = `${String(dTime.getHours()).padStart(2, '0')}:${String(dTime.getMinutes()).padStart(2, '0')}`;
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
    .select('name', 'dosage', 'frequency', 'instructions', 'doctor_name', 'prescribed_at');

  // 2. Lịch sử tuân thủ 30 ngày
  const logs = await db('medication_logs as l')
    .join('medications as m', 'm.id', 'l.medication_id')
    .where('l.user_id', patientId)
    .where('l.created_at', '>=', thirtyDaysAgo.toISOString())
    .select('l.*', 'm.name as med_name');

  const doses30d = logs.map((l) => {
    const dTime = new Date(l.scheduled_for || l.taken_at || l.created_at);
    return {
      medName: l.med_name || 'Thuốc',
      dateStr: toDateStr(dTime),
      dow: dTime.getDay(),
      slot: `${String(dTime.getHours()).padStart(2, '0')}:${String(dTime.getMinutes()).padStart(2, '0')}`,
      taken: l.status === 'taken',
    };
  });

  const adherence30d = adherence(doses30d);
  const adherencePerMed = adherenceByMed(doses30d);
  const missPatterns = findMissPatterns(doses30d, { minMissed: 2, minRatio: 0.5 });

  // 3. Chỉ số đường huyết 30 ngày
  const metrics = await db('metrics')
    .where({ user_id: patientId })
    .where('measured_at', '>=', thirtyDaysAgo.toISOString())
    .orderBy('measured_at', 'asc');

  const gStats = glucoseStats(metrics);

  return {
    patient: {
      name: patient.name || 'Bệnh nhân',
      user_code: patient.user_code,
      date_of_birth: patient.date_of_birth,
      diagnosis: patient.diagnosis,
      blood_type: patient.blood_type,
      insurance_number: patient.insurance_number,
    },
    period: '30 ngày gần nhất',
    adherence: {
      overall_percent: adherence30d.percent || 100,
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
      recent_readings: metrics.slice(-10),
    },
    active_medications: meds,
  };
}

module.exports = {
  getTimeline,
  getWeeklyInsights,
  getDoctorBriefing,
  logDose,
};
