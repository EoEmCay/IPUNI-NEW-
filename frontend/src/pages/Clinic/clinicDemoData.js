export const CLINIC_PROFILE = {
  id: 'PK-HOAN-MY-01',
  name: 'Phòng Khám Nội Tiết & Đái Tháo Đường Hoàn Mỹ',
  address: 'Số 124 Đường Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
  phone: '028 3822 9988',
  doctorName: 'BS.CKII Nguyễn Văn An',
  doctorTitle: 'Trưởng Khoa Nội Tiết',
  department: 'Khoa Đái Tháo Đường & Rối Loạn Chuyển Hóa',
  qrCodeValue: JSON.stringify({
    type: 'DIAPLUS_CLINIC_CHECKIN',
    clinicId: 'PK-HOAN-MY-01',
    clinicName: 'Phòng Khám Nội Tiết Hoàn Mỹ',
    doctorName: 'BS.CKII Nguyễn Văn An',
    address: '124 Nguyễn Trãi, Q.1, TP.HCM'
  })
};

// Mặc định hoàn toàn TRỐNG để chỉ nhận bệnh nhân thật quét mã QR
export const INITIAL_PATIENTS = [];
export const INITIAL_NOTIFICATIONS = [];

// Dữ liệu mẫu demo phong phú cho phòng khám (user ảo)
export const MOCK_PATIENTS_SAMPLE = [
  {
    id: 'p1',
    code: 'DIA-8801',
    name: 'Nguyễn Văn Hùng',
    age: 62,
    gender: 'Nam',
    phone: '0903 124 556',
    diabetesType: 'Type 2 (Phụ thuộc Insulin)',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: '08:15 Hôm nay',
    status: 'active',
    deviceStatus: 'cgm_connected',
    deviceType: 'Cảm biến CGM Dexcom G7',
    lastSyncTime: 'Vừa xong (3 phút trước)',
    currentGlucose: 3.2,
    glucoseStatus: 'emergency_low',
    glucoseTrend: 'falling_fast',
    hba1c: 7.8,
    adherenceScore: 78,
    glucoseHistory24h: [
      { time: '00:00', value: 6.8 },
      { time: '03:00', value: 6.2 },
      { time: '06:00', value: 5.8 },
      { time: '07:30', value: 5.1 },
      { time: '08:00', value: 4.2 },
      { time: '08:30', value: 3.5 },
      { time: '08:45', value: 3.2 }
    ],
    medications: [
      { name: 'Insulin Mixtard 30', dosage: '14 IU', timing: 'Trước ăn sáng 30p', status: 'taken' },
      { name: 'Metformin 850mg', dosage: '1 viên', timing: 'Sau ăn sáng', status: 'taken' },
      { name: 'Galvus 50mg', dosage: '1 viên', timing: 'Sau ăn tối', status: 'pending' }
    ],
    medicationLogs: [
      { time: '07:15', date: 'Hôm nay', medName: 'Insulin Mixtard 30 (14 IU)', status: 'taken', punctuality: 'on_time', note: 'Đã tiêm đủ liều trước ăn' },
      { time: '07:45', date: 'Hôm nay', medName: 'Metformin 850mg (1 viên)', status: 'taken', punctuality: 'on_time', note: 'Đã uống sau ăn sáng' }
    ],
    notes: '🚨 BÁO ĐỘNG HẠ ĐƯỜNG HUYẾT CẤP 3.2 mmol/L. Điều dưỡng đã cho uống 15g glucose nhanh.',
    nextAppointment: 'Hôm nay (Đang theo dõi)'
  },
  {
    id: 'p2',
    code: 'DIA-8802',
    name: 'Trần Thị Mai',
    age: 48,
    gender: 'Nữ',
    phone: '0918 678 234',
    diabetesType: 'Type 2 (Kém tuân thủ thuốc)',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: '08:30 Hôm nay',
    status: 'active',
    deviceStatus: 'ble_synced',
    deviceType: 'Máy đo đường huyết Accu-Chek Guide',
    lastSyncTime: '15 phút trước',
    currentGlucose: 14.5,
    glucoseStatus: 'high',
    glucoseTrend: 'rising',
    hba1c: 8.4,
    adherenceScore: 52,
    glucoseHistory24h: [
      { time: '06:30', value: 7.8 },
      { time: '09:00', value: 11.2 },
      { time: '12:30', value: 13.0 },
      { time: '14:00', value: 14.5 }
    ],
    medications: [
      { name: 'Diamicron MR 60mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' },
      { name: 'Glucophage 1000mg', dosage: '1 viên', timing: 'Trưa', status: 'missed' },
      { name: 'Jardiance 10mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' }
    ],
    medicationLogs: [
      { time: '07:00', date: 'Hôm nay', medName: 'Diamicron MR 60mg', status: 'taken', punctuality: 'on_time', note: 'Đã uống' },
      { time: '12:30', date: 'Hôm nay', medName: 'Glucophage 1000mg', status: 'missed', punctuality: 'missed', note: 'Bỏ cữ trưa tại công ty' }
    ],
    notes: 'Bệnh nhân thường xuyên quên cữ thuốc trưa tại nơi làm việc khiến đường huyết tăng vọt.',
    nextAppointment: 'Hôm nay'
  },
  {
    id: 'p3',
    code: 'DIA-8803',
    name: 'Lê Hoàng Nam',
    age: 56,
    gender: 'Nam',
    phone: '0977 345 890',
    diabetesType: 'Type 2 (Quá hạn tái khám)',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: '09:00 Hôm nay',
    status: 'overdue',
    deviceStatus: 'ble_synced',
    deviceType: 'Máy đo Contour Plus',
    lastSyncTime: 'Hôm qua',
    currentGlucose: 11.2,
    glucoseStatus: 'high',
    glucoseTrend: 'rising',
    hba1c: 8.9,
    adherenceScore: 68,
    glucoseHistory24h: [
      { time: '07:00', value: 8.5 },
      { time: '12:00', value: 10.2 },
      { time: '18:00', value: 11.2 }
    ],
    medications: [
      { name: 'Jardiance 10mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' },
      { name: 'Metformin 500mg', dosage: '2 viên', timing: 'Sau ăn tối', status: 'taken' }
    ],
    notes: '⏰ Quá hạn tái khám 7 ngày (Lịch hẹn gốc: 20/08/2026). HbA1c tăng cao, cần điều chỉnh phác đồ.',
    nextAppointment: 'Quá hạn 7 ngày'
  },
  {
    id: 'p4',
    code: 'DIA-8804',
    name: 'Phạm Thu Hà',
    age: 51,
    gender: 'Nữ',
    phone: '0934 567 123',
    diabetesType: 'Type 1 (Đái tháo đường phụ thuộc Insulin)',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: '09:15 Hôm nay',
    status: 'active',
    deviceStatus: 'disconnected',
    deviceType: 'Cảm biến CGM Dexcom G7',
    lastSyncTime: 'Mất tín hiệu 4 giờ qua',
    currentGlucose: 4.1,
    glucoseStatus: 'normal',
    glucoseTrend: 'falling_fast',
    hba1c: 7.2,
    adherenceScore: 88,
    glucoseHistory24h: [
      { time: '04:00', value: 6.5 },
      { time: '06:00', value: 5.2 },
      { time: '08:00', value: 4.1 }
    ],
    medications: [
      { name: 'Insulin Lantus', dosage: '18 IU', timing: 'Trước ngủ', status: 'taken' },
      { name: 'NovoRapid', dosage: '6 IU', timing: 'Trước các bữa ăn', status: 'taken' }
    ],
    notes: '📡 Cảm biến CGM bị mất kết nối Bluetooth. Cần điều dưỡng hỗ trợ kiểm tra lại đầu dò.',
    nextAppointment: '2026-09-10'
  },
  {
    id: 'p5',
    code: 'DIA-8805',
    name: 'Đỗ Minh Trí',
    age: 67,
    gender: 'Nam',
    phone: '0913 222 789',
    diabetesType: 'Type 2 (Kiểm soát tốt)',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: '09:30 Hôm nay',
    status: 'active',
    deviceStatus: 'ble_synced',
    deviceType: 'App DIA+ Live Web Sync',
    lastSyncTime: '10 phút trước',
    currentGlucose: 5.8,
    glucoseStatus: 'normal',
    glucoseTrend: 'stable',
    hba1c: 6.5,
    adherenceScore: 98,
    glucoseHistory24h: [
      { time: '06:00', value: 5.6 },
      { time: '11:30', value: 6.2 },
      { time: '17:30', value: 5.8 }
    ],
    medications: [
      { name: 'Januvia 100mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' },
      { name: 'Metformin 850mg', dosage: '1 viên', timing: 'Sau ăn sáng', status: 'taken' }
    ],
    notes: '🟢 Bệnh nhân tuân thủ uống thuốc 98%, chỉ số đường huyết ổn định hoàn hảo.',
    nextAppointment: '2026-09-27'
  },
  {
    id: 'p6',
    code: 'DIA-8806',
    name: 'Hoàng Thị Lan',
    age: 54,
    gender: 'Nữ',
    phone: '0988 999 112',
    diabetesType: 'Type 2 (Đã hoàn tất)',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: '08:00 Hôm nay',
    status: 'completed',
    checkoutAt: '09:45 Hôm nay',
    deviceStatus: 'ble_synced',
    deviceType: 'App DIA+ Live Web Sync',
    lastSyncTime: '30 phút trước',
    currentGlucose: 6.4,
    glucoseStatus: 'normal',
    glucoseTrend: 'stable',
    hba1c: 6.8,
    adherenceScore: 92,
    glucoseHistory24h: [
      { time: '06:00', value: 6.1 },
      { time: '12:00', value: 6.8 },
      { time: '18:00', value: 6.4 }
    ],
    medications: [
      { name: 'Forxiga 10mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' },
      { name: 'Glucophage XR 750mg', dosage: '1 viên', timing: 'Tối', status: 'taken' }
    ],
    notes: 'Đã hoàn tất khám định kỳ. Bác sĩ duy trì đơn thuốc hiện tại.',
    nextAppointment: '2026-09-25'
  }
];

export const MOCK_NOTIFICATIONS_SAMPLE = [
  {
    id: 'n1',
    type: 'emergency',
    patientId: 'p1',
    patientName: 'Nguyễn Văn Hùng (DIA-8801)',
    title: '🔴 BÁO ĐỘNG HẠ ĐƯỜNG HUYẾT: 3.2 mmol/L',
    desc: 'Cảm biến CGM phát hiện đường huyết tụt dốc dưới ngưỡng 3.9 mmol/L sau khi tiêm insulin sáng.',
    time: '5 phút trước',
    read: false,
    severity: 'critical'
  },
  {
    id: 'n2',
    type: 'workflow',
    patientId: 'p2',
    patientName: 'Trần Thị Mai (DIA-8802)',
    title: '⚠️ CẢNH BÁO QUÊN THUỐC: Tuân thủ 52%',
    desc: 'Bệnh nhân bỏ cữ thuốc Glucophage 1000mg trưa, đường huyết đo được 14.5 mmol/L.',
    time: '20 phút trước',
    read: false,
    severity: 'warning'
  }
];
