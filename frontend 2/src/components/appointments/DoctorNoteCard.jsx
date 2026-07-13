import { FileText } from 'lucide-react';

function formatShortDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' });
}

export default function DoctorNoteCard({ appointment }) {
  return (
    <div style={{
      background: '#FFF',
      borderRadius: 12,
      border: '1px solid #E2E8F0',
      padding: 16,
      display: 'flex',
      gap: 12
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 10, background: '#F0FDF4',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#22C55E', flexShrink: 0
      }}>
        <FileText size={20} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#1A2332' }}>Dr. {appointment.doctor_name}</div>
        <div style={{ fontSize: 12, color: '#6B7A8D', marginTop: 2 }}>{formatShortDate(appointment.scheduled_at)}</div>
        <div style={{ fontSize: 14, color: '#1A2332', marginTop: 8, lineHeight: 1.6 }}>{appointment.note}</div>
      </div>
    </div>
  );
}
