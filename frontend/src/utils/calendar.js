import { saveOrShareFile } from './saveFile';

/**
 * Hỗ trợ tạo và tải tệp .ics để thêm lịch uống thuốc vào ứng dụng Lịch của điện thoại (iOS, Android, Google Calendar,...)
 *
 * Tuân thủ RFC 5545:
 * - DTSTART/DTEND khai báo rõ TZID=Asia/Ho_Chi_Minh (thay vì "floating time" mơ hồ, có
 *   thể bị hiểu sai theo múi giờ khác nếu thiết bị đọc file đổi timezone khi di chuyển).
 * - Escape đầy đủ \, ; , và xuống dòng trong mọi giá trị TEXT (SUMMARY/DESCRIPTION).
 * - Gập dòng (fold) khi vượt 75 octet - quan trọng với tiếng Việt có dấu vì mỗi ký tự dấu
 *   chiếm 2-3 byte UTF-8, dễ vượt giới hạn octet hơn nhiều so với văn bản thuần ASCII.
 */

// Khối định nghĩa múi giờ Việt Nam - UTC+7 cố định quanh năm (không có DST) nên chỉ cần
// 1 khối STANDARD duy nhất.
const VTIMEZONE_VN = [
  'BEGIN:VTIMEZONE',
  'TZID:Asia/Ho_Chi_Minh',
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0700',
  'TZOFFSETTO:+0700',
  'TZNAME:ICT',
  'END:STANDARD',
  'END:VTIMEZONE',
].join('\r\n');

function escapeIcsText(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

// RFC 5545 §3.1: dòng nội dung vượt 75 octet phải được "gập" (fold) bằng CRLF + 1
// khoảng trắng ở đầu dòng tiếp theo.
function foldIcsLine(line) {
  const byteLength = (s) => new TextEncoder().encode(s).length;
  if (byteLength(line) <= 75) return line;

  const chunks = [];
  let current = '';
  for (const ch of line) {
    const candidate = current + ch;
    // Chừa 1 byte cho khoảng trắng ở đầu dòng gập tiếp theo
    if (byteLength(candidate) > 74) {
      chunks.push(current);
      current = ch;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks.join('\r\n ');
}

function pad2(n) {
  return String(n).padStart(2, '0');
}

function buildVeventsForMedications(meds, todayStr, stamp) {
  const events = [];

  meds.forEach((med) => {
    if (!med || !med.name) return;
    const times = Array.isArray(med.times) ? med.times : [];
    if (times.length === 0) return;

    times.forEach((tm) => {
      const match = tm.match(/(\d{1,2}):(\d{2})/);
      if (!match) return;

      const hours = match[1].padStart(2, '0');
      const minutes = match[2];
      const startStr = `${todayStr}T${hours}${minutes}00`;

      // Tính thời gian kết thúc (15 phút sau khi bắt đầu)
      const y = Number(todayStr.slice(0, 4));
      const mo = Number(todayStr.slice(4, 6)) - 1;
      const d = Number(todayStr.slice(6, 8));
      const startDate = new Date(y, mo, d, parseInt(hours), parseInt(minutes));
      const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
      const endStr = `${todayStr}T${pad2(endDate.getHours())}${pad2(endDate.getMinutes())}00`;

      const uid = `med-${med.id || Math.floor(Math.random() * 1000000)}-${hours}${minutes}@diaplus.vn`;
      const summary = `Uống thuốc: ${med.name}${med.dosage ? ' ' + med.dosage : ''}`;
      const description = [
        `Liều lượng & Tần suất: ${med.frequency || ''}.`,
        med.instructions ? `Hướng dẫn: ${med.instructions}` : '',
        '---',
        'Lịch nhắc nhở tự động từ ứng dụng DIA+',
      ].filter(Boolean).join('\n');

      const lines = [
        'BEGIN:VEVENT',
        `UID:${uid}`,
        `DTSTAMP:${stamp}`,
        `DTSTART;TZID=Asia/Ho_Chi_Minh:${startStr}`,
        `DTEND;TZID=Asia/Ho_Chi_Minh:${endStr}`,
        'RRULE:FREQ=DAILY', // Nhắc nhở lặp lại hàng ngày
        `SUMMARY:${escapeIcsText(summary)}`,
        `DESCRIPTION:${escapeIcsText(description)}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT0M', // Báo thức đúng giờ uống
        'ACTION:DISPLAY',
        'DESCRIPTION:Nhắc nhở uống thuốc',
        'END:VALARM',
        'END:VEVENT',
      ].map(foldIcsLine);

      events.push(lines.join('\r\n'));
    });
  });

  return events;
}

function downloadIcsFile(events, filename) {
  if (events.length === 0) return;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DIA+//Medication Calendar//VN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    VTIMEZONE_VN,
    ...events,
    'END:VCALENDAR',
  ];

  const icsString = icsLines.join('\r\n');
  // Web: <a download>. Native (WKWebView chặn download): ghi Filesystem + Share sheet.
  saveOrShareFile({
    fileName: filename,
    data: new Blob([icsString], { type: 'text/calendar;charset=utf-8;' }),
    mimeType: 'text/calendar',
  });
}

function getTodayStr(now) {
  // QUAN TRỌNG: dùng getFullYear()/getMonth()/getDate() (giờ ĐỊA PHƯƠNG của trình duyệt),
  // KHÔNG dùng now.toISOString() (giờ UTC) - với người dùng ở UTC+7, gần nửa đêm giờ VN,
  // ngày theo UTC vẫn có thể là ngày hôm trước, gây lệch ngày bắt đầu lịch nhắc.
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function getStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function exportMedicationToCalendar(med) {
  if (!med || !med.name) return;

  const times = Array.isArray(med.times) ? med.times : [];
  if (times.length === 0) return;

  const todayStr = getTodayStr(new Date());
  const stamp = getStamp();
  const events = buildVeventsForMedications([med], todayStr, stamp);
  if (events.length === 0) return;

  // Tạo tên file tiếng Việt không dấu, viết thường
  const safeName = med.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-');

  downloadIcsFile(events, `nhac-uong-thuoc-${safeName}.ics`);
}

export function exportMultipleMedicationsToCalendar(meds) {
  if (!meds || meds.length === 0) return;

  const todayStr = getTodayStr(new Date());
  const stamp = getStamp();
  const events = buildVeventsForMedications(meds, todayStr, stamp);
  if (events.length === 0) return;

  downloadIcsFile(events, 'nhac-uong-tat-ca-thuoc.ics');
}
