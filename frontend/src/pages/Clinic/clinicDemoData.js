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

export const INITIAL_PATIENTS = [
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
    status: 'active', // active: đang điều trị tại PK
    deviceStatus: 'cgm_connected', // cgm_connected, ble_synced, disconnected
    deviceType: 'Cảm biến CGM Dexcom G7',
    lastSyncTime: 'Vừa xong (3 phút trước)',
    
    // Chỉ số & Cảnh báo
    currentGlucose: 3.2,
    glucoseStatus: 'emergency_low', // emergency_low (<3.9), high (>10), normal (3.9-10)
    glucoseTrend: 'falling_fast', // falling_fast, rising, stable
    hba1c: 7.8,
    adherenceScore: 78, // % tuân thủ dùng thuốc
    
    // Lịch sử đường huyết 24h
    glucoseHistory24h: [
      { time: '00:00', value: 6.8 },
      { time: '03:00', value: 6.2 },
      { time: '06:00', value: 5.8 },
      { time: '07:30', value: 5.1 },
      { time: '08:00', value: 4.2 },
      { time: '08:30', value: 3.5 },
      { time: '08:45', value: 3.2 }
    ],

    // Đơn thuốc & Lịch sử uống thuốc
    medications: [
      { name: 'Insulin Mixtard 30', dosage: '14 IU', timing: 'Trước ăn sáng 30p', status: 'taken' },
      { name: 'Metformin 850mg', dosage: '1 viên', timing: 'Sau ăn sáng', status: 'taken' },
      { name: 'Galvus 50mg', dosage: '1 viên', timing: 'Sau ăn tối', status: 'pending' }
    ],

    medicationLogs: [
      { time: '07:15', date: 'Hôm nay', medName: 'Insulin Mixtard 30 (14 IU)', status: 'taken', punctuality: 'on_time', note: 'Đã tiêm đủ liều trước ăn' },
      { time: '07:45', date: 'Hôm nay', medName: 'Metformin 850mg (1 viên)', status: 'taken', punctuality: 'on_time', note: 'Đã uống sau ăn sáng (ăn ít tinh bột)' },
      { time: '19:30', date: 'Hôm qua', medName: 'Galvus 50mg (1 viên)', status: 'taken', punctuality: 'late', note: 'Uống trễ 45 phút' },
      { time: '12:00', date: 'Hôm qua', medName: 'Metformin 850mg (1 viên)', status: 'missed', punctuality: 'missed', note: 'Bệnh nhân quên mang theo thuốc khi đi làm' }
    ],

    notes: 'Bệnh nhân tiêm insulin sáng nhưng ăn sáng ít tinh bột dẫn đến hạ đường huyết cấp. Đã chỉ định điều dưỡng cho uống ngay 15g đường glucose nhanh.',
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
    deviceType: 'Máy đo đường huyết Bluetooth Accu-Chek Guide',
    lastSyncTime: '15 phút trước',
    
    currentGlucose: 14.5,
    glucoseStatus: 'high',
    glucoseTrend: 'rising',
    hba1c: 8.4,
    adherenceScore: 62, // Kém
    
    glucoseHistory24h: [
      { time: '06:30', value: 7.8 },
      { time: '09:00', value: 11.2 },
      { time: '12:30', value: 13.0 },
      { time: '14:00', value: 14.5 }
    ],

    medications: [
      { name: 'Diamicron MR 60mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' },
      { name: 'Glucophage 1000mg', dosage: '1 viên', timing: 'Trưa', status: 'missed' },
      { name: 'Januvia 100mg', dosage: '1 viên', timing: 'Tối', status: 'pending' }
    ],

    medicationLogs: [
      { time: '07:00', date: 'Hôm nay', medName: 'Diamicron MR 60mg', status: 'taken', punctuality: 'on_time', note: 'Đã uống' },
      { time: '12:30', date: 'Hôm nay', medName: 'Glucophage 1000mg', status: 'missed', punctuality: 'missed', note: 'Bỏ cữ trưa dẫn đến đường huyết tăng vọt 14.5' },
      { time: '19:00', date: 'Hôm qua', medName: 'Januvia 100mg', status: 'taken', punctuality: 'on_time', note: 'Đã uống' }
    ],

    notes: 'Bệnh nhân thường xuyên quên cữ thuốc trưa tại nơi làm việc. Cần kích hoạt tính năng nhắc nhở giọng nói DIA+ trên điện thoại.',
    nextAppointment: '2026-08-28'
  },
  {
    id: 'p3',
    code: 'DIA-8803',
    name: 'Lê Hoàng Nam',
    age: 29,
    gender: 'Nam',
    phone: '0989 334 112',
    diabetesType: 'Type 1 (Đái tháo đường trẻ tuổi)',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: '09:00 Hôm nay',
    status: 'active',
    deviceStatus: 'cgm_connected',
    deviceType: 'Cảm biến CGM Freestyle Libre 2',
    lastSyncTime: 'Vừa xong',
    
    currentGlucose: 6.4,
    glucoseStatus: 'normal',
    glucoseTrend: 'stable',
    hba1c: 6.7,
    adherenceScore: 96, // Xuất sắc
    
    glucoseHistory24h: [
      { time: '00:00', value: 6.1 },
      { time: '04:00', value: 5.9 },
      { time: '07:00', value: 5.6 },
      { time: '09:00', value: 7.2 },
      { time: '12:00', value: 6.8 },
      { time: '14:00', value: 6.4 }
    ],

    medications: [
      { name: 'Insulin Novorapid', dosage: '6 IU', timing: 'Trước 3 bữa ăn', status: 'taken' },
      { name: 'Insulin Lantus', dosage: '18 IU', timing: '21:00 Trước ngủ', status: 'pending' }
    ],

    medicationLogs: [
      { time: '07:00', date: 'Hôm nay', medName: 'Insulin Novorapid (6 IU)', status: 'taken', punctuality: 'on_time', note: 'Tiêm trước ăn sáng' },
      { time: '12:00', date: 'Hôm nay', medName: 'Insulin Novorapid (6 IU)', status: 'taken', punctuality: 'on_time', note: 'Tiêm trước ăn trưa' },
      { time: '21:00', date: 'Hôm qua', medName: 'Insulin Lantus (18 IU)', status: 'taken', punctuality: 'on_time', note: 'Tiêm trước ngủ' }
    ],

    notes: 'Kiểm soát đường huyết rất tốt, Time-in-Range đạt 89%. Tiếp tục duy trì phác đồ hiện tại.',
    nextAppointment: '2026-09-20'
  },
  {
    id: 'p4',
    code: 'DIA-8804',
    name: 'Phạm Thị Lan',
    age: 32,
    gender: 'Nữ',
    phone: '0908 991 223',
    diabetesType: 'Đái tháo đường Thai kỳ (Tuần 28)',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: '09:15 Hôm nay',
    status: 'active',
    deviceStatus: 'ble_synced',
    deviceType: 'Máy đo Contour Plus One',
    lastSyncTime: '30 phút trước',
    
    currentGlucose: 5.2,
    glucoseStatus: 'normal',
    glucoseTrend: 'stable',
    hba1c: 5.4,
    adherenceScore: 100, // Hoàn hảo
    
    glucoseHistory24h: [
      { time: '06:30', value: 4.9 },
      { time: '08:30', value: 6.1 },
      { time: '11:30', value: 5.0 },
      { time: '13:30', value: 5.8 }
    ],

    medications: [
      { name: 'Kiểm soát chế độ ăn & Vận động', dosage: 'Thực đơn mẫu DIA+', timing: 'Cả ngày', status: 'taken' }
    ],

    medicationLogs: [
      { time: '07:30', date: 'Hôm nay', medName: 'Bữa sáng theo thực đơn ít đường', status: 'taken', punctuality: 'on_time', note: 'Tuân thủ thực đơn thai kỳ' }
    ],

    notes: 'Chưa cần can thiệp insulin, đường huyết đói và sau ăn 2h đều đạt chuẩn mục tiêu thai kỳ (Đói < 5.3, Sau ăn < 6.7).',
    nextAppointment: '2026-09-01'
  },
  {
    id: 'p5',
    code: 'DIA-8805',
    name: 'Vũ Đình Khoa',
    age: 59,
    gender: 'Nam',
    phone: '0934 778 899',
    diabetesType: 'Type 2 kèm Tăng Huyết Áp',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: '07:45 Hôm nay',
    status: 'active',
    deviceStatus: 'disconnected', // Mất kết nối
    deviceType: 'Máy đo đường huyết OneTouch Verio',
    lastSyncTime: 'Mất kết nối từ 5 giờ trước',
    
    currentGlucose: 11.2,
    glucoseStatus: 'high',
    glucoseTrend: 'unknown',
    hba1c: 8.9,
    adherenceScore: 54, // Kém
    
    glucoseHistory24h: [
      { time: '06:00', value: 11.2 }
    ],

    medications: [
      { name: 'Glimepiride 4mg', dosage: '1 viên', timing: 'Sáng', status: 'unknown' },
      { name: 'Metformin 1000mg', dosage: '2 viên', timing: 'Sáng - Tối', status: 'unknown' },
      { name: 'Amlodipine 5mg', dosage: '1 viên', timing: 'Sáng (Huyết áp)', status: 'unknown' }
    ],

    medicationLogs: [
      { time: '06:30', date: 'Hôm qua', medName: 'Glimepiride 4mg', status: 'taken', punctuality: 'on_time', note: 'Đã uống' },
      { time: '19:00', date: 'Hôm qua', medName: 'Metformin 1000mg', status: 'missed', punctuality: 'missed', note: 'Quên cữ tối' }
    ],

    notes: 'Thiết bị đo ngắt kết nối. Bệnh nhân có tiền sử không tuân thủ uống thuốc. Điều dưỡng đã gọi điện hướng dẫn kết nối lại máy đo.',
    nextAppointment: '2026-08-30'
  },
  {
    id: 'p6',
    code: 'DIA-8806',
    name: 'Đặng Minh Tuấn',
    age: 67,
    gender: 'Nam',
    phone: '0977 445 119',
    diabetesType: 'Type 2 có biến chứng thận nhẹ',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: 'Hẹn tái khám (Quá hạn 4 ngày)',
    status: 'overdue', // Quá hạn
    deviceStatus: 'ble_synced',
    deviceType: 'Máy đo Sinocare Safe-Accu',
    lastSyncTime: '1 ngày trước',
    
    currentGlucose: 7.1,
    glucoseStatus: 'normal',
    glucoseTrend: 'stable',
    hba1c: 7.2,
    adherenceScore: 84,
    
    glucoseHistory24h: [
      { time: '07:00', value: 7.1 }
    ],

    medications: [
      { name: 'Trajenta 5mg', dosage: '1 viên', timing: 'Sáng (An toàn cho thận)', status: 'taken' },
      { name: 'Forxiga 10mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' }
    ],

    medicationLogs: [
      { time: '07:30', date: 'Hôm nay', medName: 'Trajenta 5mg + Forxiga 10mg', status: 'taken', punctuality: 'on_time', note: 'Uống thuốc đúng giờ' }
    ],

    notes: 'Đã trễ hẹn tái khám xét nghiệm eGFR và HbA1c định kỳ 3 tháng. Hệ thống đã tự động gửi tin nhắn SMS nhắc lịch.',
    nextAppointment: '2026-08-21 (Đã quá hạn)'
  },
  {
    id: 'p7',
    code: 'DIA-8807',
    name: 'Hoàng Thị Cúc',
    age: 53,
    gender: 'Nữ',
    phone: '0912 889 001',
    diabetesType: 'Type 2 mới phát hiện (6 tháng)',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: 'Vừa quét QR Check-in (5 phút trước)',
    status: 'active',
    deviceStatus: 'cgm_connected',
    deviceType: 'Cảm biến CGM Dexcom ONE+',
    lastSyncTime: 'Vừa xong',
    
    currentGlucose: 8.1,
    glucoseStatus: 'normal',
    glucoseTrend: 'rising',
    hba1c: 7.5,
    adherenceScore: 92,
    
    glucoseHistory24h: [
      { time: '06:00', value: 6.5 },
      { time: '08:00', value: 7.4 },
      { time: '09:00', value: 8.1 }
    ],

    medications: [
      { name: 'Metformin XR 750mg', dosage: '1 viên', timing: 'Sau ăn tối', status: 'taken' },
      { name: 'Jardiance 10mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' }
    ],

    medicationLogs: [
      { time: '07:15', date: 'Hôm nay', medName: 'Jardiance 10mg', status: 'taken', punctuality: 'on_time', note: 'Đã uống sau ăn sáng' }
    ],

    notes: 'Bệnh nhân vừa quét mã QR check-in tại quầy lễ tân. Đang ngồi chờ tại phòng đợi số 2.',
    nextAppointment: 'Hôm nay'
  },
  {
    id: 'p8',
    code: 'DIA-8808',
    name: 'Bùi Quang Huy',
    age: 74,
    gender: 'Nam',
    phone: '0909 332 554',
    diabetesType: 'Type 2 Lâu năm (15 năm)',
    doctor: 'BS.CKII Nguyễn Văn An',
    checkinAt: '08:00 Hôm nay',
    status: 'active',
    deviceStatus: 'cgm_connected',
    deviceType: 'Cảm biến Dexcom G7',
    lastSyncTime: 'Vừa xong',
    
    currentGlucose: 3.6,
    glucoseStatus: 'emergency_low',
    glucoseTrend: 'falling_fast',
    hba1c: 8.1,
    adherenceScore: 70,
    
    glucoseHistory24h: [
      { time: '05:00', value: 6.8 },
      { time: '07:00', value: 5.4 },
      { time: '08:30', value: 4.1 },
      { time: '09:10', value: 3.6 }
    ],

    medications: [
      { name: 'Insulin Lantus', dosage: '20 IU', timing: 'Tối', status: 'taken' },
      { name: 'Gliclazide MR 60mg', dosage: '2 viên', timing: 'Sáng', status: 'taken' }
    ],

    medicationLogs: [
      { time: '07:00', date: 'Hôm nay', medName: 'Gliclazide MR 60mg (2 viên)', status: 'taken', punctuality: 'on_time', note: 'Uống thuốc sáng' }
    ],

    notes: '🚨 BỆNH NHÂN VỪA BẤM NÚT SOS CẦU CỨU TRÊN APP: Triệu chứng tim đập nhanh, vã mồ hôi lạnh, run tay chân. Bác sĩ đã yêu cầu điều dưỡng tiếp cận khẩn cấp.',
    nextAppointment: '2026-09-02'
  }
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'n1',
    type: 'emergency', // emergency, warning, medication, workflow, overdue
    patientId: 'p8',
    patientName: 'Bùi Quang Huy (DIA-8808)',
    title: '🚨 TÍN HIỆU SOS KHẨN CẤP: Bệnh nhân đang bị hạ đường huyết 3.6 mmol/L!',
    desc: 'Bệnh nhân vừa bấm nút SOS cầu cứu trên App DIA+. Xu hướng đường huyết đang tụt dốc nhanh.',
    time: '2 phút trước',
    read: false,
    severity: 'critical'
  },
  {
    id: 'n2',
    type: 'emergency',
    patientId: 'p1',
    patientName: 'Nguyễn Văn Hùng (DIA-8801)',
    title: '🔴 BÁO ĐỘNG HẠ ĐƯỜNG HUYẾT: 3.2 mmol/L',
    desc: 'Cảm biến CGM phát hiện đường huyết dưới ngưỡng 3.9 mmol/L sau khi tiêm insulin sáng.',
    time: '12 phút trước',
    read: false,
    severity: 'critical'
  },
  {
    id: 'n3',
    type: 'workflow',
    patientId: 'p7',
    patientName: 'Hoàng Thị Cúc (DIA-8807)',
    title: '🎫 Bệnh nhân mới vừa quét QR Check-in vào phòng khám',
    desc: 'Bệnh nhân đã xác nhận phiên điều trị với BS.CKII Nguyễn Văn An tại quầy lễ tân.',
    time: '5 phút trước',
    read: false,
    severity: 'info'
  },
  {
    id: 'n4',
    type: 'medication',
    patientId: 'p2',
    patientName: 'Trần Thị Mai (DIA-8802)',
    title: '💊 Cảnh báo quên thuốc: Bỏ cữ Glucophage 1000mg trưa',
    desc: 'Đường huyết sau ăn tăng vọt lên 14.5 mmol/L do bệnh nhân quên uống thuốc trưa.',
    time: '35 phút trước',
    read: true,
    severity: 'warning'
  },
  {
    id: 'n5',
    type: 'device',
    patientId: 'p5',
    patientName: 'Vũ Đình Khoa (DIA-8805)',
    title: '📡 Mất kết nối thiết bị đo đường huyết > 5 giờ',
    desc: 'Không nhận được dữ liệu đồng bộ từ máy đo OneTouch của bệnh nhân.',
    time: '1 giờ trước',
    read: true,
    severity: 'warning'
  },
  {
    id: 'n6',
    type: 'overdue',
    patientId: 'p6',
    patientName: 'Đặng Minh Tuấn (DIA-8806)',
    title: '⏰ Quá hạn tái khám: Trễ hẹn 4 ngày',
    desc: 'Bệnh nhân chưa đến kiểm tra chức năng thận và chỉ số HbA1c theo lịch hẹn.',
    time: '3 giờ trước',
    read: true,
    severity: 'info'
  }
];
