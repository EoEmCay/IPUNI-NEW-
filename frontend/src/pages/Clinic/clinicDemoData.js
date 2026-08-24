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

// Dữ liệu mẫu tùy chọn (chỉ nạp khi người dùng bấm nút "Nạp dữ liệu mẫu")
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
    notes: 'Bệnh nhân tiêm insulin sáng nhưng ăn ít tinh bột dẫn đến hạ đường huyết cấp.',
    nextAppointment: '2026-09-05'
  },
  {
    id: 'p2',
    code: 'DIA-8802',
    name: 'Trần Thị Mai',
    age: 48,
    gender: 'Nữ',
    phone: '0918 678 234',
    diabetesType: 'Type 2 (Không phụ thuộc Insulin)',
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
    adherenceScore: 62,
    glucoseHistory24h: [
      { time: '06:30', value: 7.8 },
      { time: '09:00', value: 11.2 },
      { time: '12:30', value: 13.0 },
      { time: '14:00', value: 14.5 }
    ],
    medications: [
      { name: 'Diamicron MR 60mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' },
      { name: 'Glucophage 1000mg', dosage: '1 viên', timing: 'Trưa', status: 'missed' }
    ],
    medicationLogs: [
      { time: '07:00', date: 'Hôm nay', medName: 'Diamicron MR 60mg', status: 'taken', punctuality: 'on_time', note: 'Đã uống' },
      { time: '12:30', date: 'Hôm nay', medName: 'Glucophage 1000mg', status: 'missed', punctuality: 'missed', note: 'Bỏ cữ trưa' }
    ],
    notes: 'Bệnh nhân thường xuyên quên cữ thuốc trưa tại nơi làm việc.',
    nextAppointment: '2026-08-28'
  }
];

export const MOCK_NOTIFICATIONS_SAMPLE = [
  {
    id: 'n1',
    type: 'emergency',
    patientId: 'p1',
    patientName: 'Nguyễn Văn Hùng (DIA-8801)',
    title: '🔴 BÁO ĐỘNG HẠ ĐƯỜNG HUYẾT: 3.2 mmol/L',
    desc: 'Cảm biến CGM phát hiện đường huyết dưới ngưỡng 3.9 mmol/L sau khi tiêm insulin sáng.',
    time: '12 phút trước',
    read: false,
    severity: 'critical'
  }
];
