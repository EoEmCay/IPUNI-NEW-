/**
 * Tiện ích tạo sự kiện Calendar (Google Calendar / ICS)
 */

function formatICSDatetime(date) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export function groupMedicationsByTime(medications) {
  const groups = {};
  medications.forEach(med => {
    let times = [];
    if (Array.isArray(med.times)) {
      times = med.times;
    } else if (typeof med.times === 'string') {
      times = med.times.split(/[,&]/).map(t => t.trim());
    }

    times.forEach(t => {
      const timeMatch = t.match(/\d{1,2}:\d{2}/);
      if (timeMatch) {
        const timeKey = timeMatch[0];
        if (!groups[timeKey]) groups[timeKey] = [];
        groups[timeKey].push(med);
      }
    });
  });
  return groups;
}

export function generateGoogleCalendarUrl(groupedMeds) {
  const timeKeys = Object.keys(groupedMeds).sort();
  if (timeKeys.length === 0) return null;

  const firstTime = timeKeys[0];
  const medsFirst = groupedMeds[firstTime];
  
  const title = encodeURIComponent(`Uống thuốc DIA+: ${medsFirst.map(m => m.name).join(', ')}`);
  
  const now = new Date();
  const [h, m] = firstTime.split(':').map(Number);
  
  const startDate = new Date();
  if (now.getHours() > h || (now.getHours() === h && now.getMinutes() > m)) {
    startDate.setDate(startDate.getDate() + 1);
  }
  startDate.setHours(h, m, 0, 0);
  
  const endDate = new Date(startDate.getTime() + 5 * 60000); 

  const dates = formatICSDatetime(startDate).replace('Z', '') + '/' + formatICSDatetime(endDate).replace('Z', '');
  
  let details = 'Lịch nhắc uống thuốc từ DIA+\\n\\n';
  timeKeys.forEach(t => {
    const names = groupedMeds[t].map(med => med.name).join(', ');
    details += `- Lúc ${t}: ${names}\\n`;
  });

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${encodeURIComponent(details)}&sf=true&output=xml`;
}

export function generateICSContent(groupedMeds) {
  const timeKeys = Object.keys(groupedMeds).sort();
  if (timeKeys.length === 0) return null;

  let ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//DIA+ App//VN\nCALSCALE:GREGORIAN\n`;

  timeKeys.forEach(time => {
    const meds = groupedMeds[time];
    const [h, m] = time.split(':').map(Number);
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 1);
    startDate.setHours(h, m, 0, 0);
    
    const endDate = new Date(startDate.getTime() + 5 * 60000);
    
    const summary = `Uống thuốc: ${meds.map(m => m.name).join(', ')}`;
    const description = `Nhắc nhở uống thuốc từ DIA+. Bạn cần uống: ${meds.map(m => `${m.name} (${m.dosage || ''})`).join(', ')}`;

    ics += `BEGIN:VEVENT\nUID:${new Date().getTime()}_${time.replace(':','')}@diaplus.vn\nDTSTAMP:${formatICSDatetime(new Date())}\nDTSTART:${formatICSDatetime(startDate)}\nDTEND:${formatICSDatetime(endDate)}\nSUMMARY:${summary}\nDESCRIPTION:${description}\nRRULE:FREQ=DAILY\nBEGIN:VALARM\nTRIGGER:-PT5M\nACTION:DISPLAY\nDESCRIPTION:Nhắc nhở uống thuốc!\nEND:VALARM\nEND:VEVENT\n`;
  });

  ics += `END:VCALENDAR`;
  return ics;
}

export function addMedicationsToCalendar(medications) {
  const grouped = groupMedicationsByTime(medications);
  if (Object.keys(grouped).length === 0) {
    alert("Không tìm thấy giờ uống thuốc hợp lệ để thêm vào lịch.");
    return;
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    const icsContent = generateICSContent(grouped);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'diaplus_medications.ics';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    const url = generateGoogleCalendarUrl(grouped);
    if (url) window.open(url, '_blank');
  }
}
