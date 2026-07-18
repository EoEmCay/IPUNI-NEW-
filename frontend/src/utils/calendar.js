/**
 * Hỗ trợ tạo và tải tệp .ics để thêm lịch uống thuốc vào ứng dụng Lịch của điện thoại (iOS, Android, Google Calendar,...)
 */
export function exportMedicationToCalendar(med) {
  if (!med || !med.name) return;

  const times = Array.isArray(med.times) ? med.times : [];
  if (times.length === 0) return;

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}${month}${day}`;

  const stamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const events = [];

  times.forEach((tm) => {
    // Parse giờ và phút
    const match = tm.match(/(\d{1,2}):(\d{2})/);
    if (!match) return;

    const hours = match[1].padStart(2, '0');
    const minutes = match[2];

    const startStr = `${todayStr}T${hours}${minutes}00`;
    
    // Tính thời gian kết thúc (15 phút sau khi bắt đầu)
    const startDate = new Date(year, now.getMonth(), now.getDate(), parseInt(hours), parseInt(minutes));
    const endDate = new Date(startDate.getTime() + 15 * 60 * 1000);
    const endHours = String(endDate.getHours()).padStart(2, '0');
    const endMinutes = String(endDate.getMinutes()).padStart(2, '0');
    const endStr = `${todayStr}T${endHours}${endMinutes}00`;

    const uid = `med-${med.id || Math.floor(Math.random() * 1000000)}-${hours}${minutes}@diaplus.vn`;
    const summary = `Uống thuốc: ${med.name}${med.dosage ? ' ' + med.dosage : ''}`;
    const description = `Liều lượng & Tần suất: ${med.frequency || ''}.
${med.instructions ? 'Hướng dẫn: ' + med.instructions : ''}
---
Lịch nhắc nhở tự động từ ứng dụng DIA+`;

    const event = [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${startStr}`,
      `DTEND:${endStr}`,
      'RRULE:FREQ=DAILY', // Nhắc nhở lặp lại hàng ngày
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT0M', // Báo thức đúng giờ uống
      'ACTION:DISPLAY',
      'DESCRIPTION:Nhắc nhở uống thuốc',
      'END:VALARM',
      'END:VEVENT'
    ].join('\r\n');

    events.push(event);
  });

  if (events.length === 0) return;

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DIA+//Medication Calendar//VN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    ...events,
    'END:VCALENDAR'
  ];

  const icsString = icsLines.join('\r\n');
  const blob = new Blob([icsString], { type: 'text/calendar;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  // Tạo tên file tiếng Việt không dấu, viết thường
  const safeName = med.name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-');
  
  link.setAttribute('download', `nhac-uong-thuoc-${safeName}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
