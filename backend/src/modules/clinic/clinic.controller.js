// Dữ liệu mẫu demo phong phú cho phòng khám (user ảo)
const DEFAULT_MOCK_PATIENTS = [
  {
    id: 'p1',
    clinicId: 'PK-HOAN-MY-01',
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
      { time: '00:00', value: 6.8 }, { time: '03:00', value: 6.2 }, { time: '06:00', value: 5.8 },
      { time: '07:30', value: 5.1 }, { time: '08:00', value: 4.2 }, { time: '08:30', value: 3.5 }, { time: '08:45', value: 3.2 }
    ],
    medications: [
      { name: 'Insulin Mixtard 30', dosage: '14 IU', timing: 'Trước ăn sáng 30p', status: 'taken' },
      { name: 'Metformin 850mg', dosage: '1 viên', timing: 'Sau ăn sáng', status: 'taken' },
      { name: 'Galvus 50mg', dosage: '1 viên', timing: 'Sau ăn tối', status: 'pending' }
    ],
    notes: '🚨 BÁO ĐỘNG HẠ ĐƯỜNG HUYẾT CẤP 3.2 mmol/L. Điều dưỡng đã cho uống 15g glucose nhanh.',
    nextAppointment: 'Hôm nay (Đang theo dõi)'
  },
  {
    id: 'p2',
    clinicId: 'PK-HOAN-MY-01',
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
      { time: '06:30', value: 7.8 }, { time: '09:00', value: 11.2 }, { time: '12:30', value: 13.0 }, { time: '14:00', value: 14.5 }
    ],
    medications: [
      { name: 'Diamicron MR 60mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' },
      { name: 'Glucophage 1000mg', dosage: '1 viên', timing: 'Trưa', status: 'missed' },
      { name: 'Jardiance 10mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' }
    ],
    notes: 'Bệnh nhân thường xuyên quên cữ thuốc trưa tại nơi làm việc khiến đường huyết tăng vọt.',
    nextAppointment: 'Hôm nay'
  },
  {
    id: 'p3',
    clinicId: 'PK-HOAN-MY-01',
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
      { time: '07:00', value: 8.5 }, { time: '12:00', value: 10.2 }, { time: '18:00', value: 11.2 }
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
    clinicId: 'PK-HOAN-MY-01',
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
      { time: '04:00', value: 6.5 }, { time: '06:00', value: 5.2 }, { time: '08:00', value: 4.1 }
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
    clinicId: 'PK-HOAN-MY-01',
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
      { time: '06:00', value: 5.6 }, { time: '11:30', value: 6.2 }, { time: '17:30', value: 5.8 }
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
    clinicId: 'PK-HOAN-MY-01',
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
      { time: '06:00', value: 6.1 }, { time: '12:00', value: 6.8 }, { time: '18:00', value: 6.4 }
    ],
    medications: [
      { name: 'Forxiga 10mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' },
      { name: 'Glucophage XR 750mg', dosage: '1 viên', timing: 'Tối', status: 'taken' }
    ],
    notes: 'Đã hoàn tất khám định kỳ. Bác sĩ duy trì đơn thuốc hiện tại.',
    nextAppointment: '2026-09-25'
  }
];

// In-memory & DB backed storage for clinic check-ins
let clinicPatients = [...DEFAULT_MOCK_PATIENTS];
let clinicNotifications = [];

const clinicController = {
  // Lấy danh sách bệnh nhân đang khám tại phòng khám
  async getPatients(req, res) {
    try {
      const { clinicId = 'PK-HOAN-MY-01' } = req.query;
      
      // Tự động gộp các bệnh nhân trùng lặp: ưu tiên userId, nếu không thì id hoặc code
      const uniqueMap = new Map();
      clinicPatients.forEach(p => {
        const key = p.userId 
          ? `user_${p.userId}` 
          : (p.phone && !p.phone.includes('0912 345 678') ? `phone_${p.phone}` : (p.id || p.code));
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, { ...p });
        } else {
          // Luôn giữ ảnh đơn thuốc thật nếu một trong các bản ghi có ảnh
          const existing = uniqueMap.get(key);
          if (p.prescriptionImage) {
            existing.prescriptionImage = p.prescriptionImage;
            existing.prescriptionDate = p.prescriptionDate || existing.prescriptionDate;
            existing.prescriptionHospital = p.prescriptionHospital || existing.prescriptionHospital;
            existing.prescriptionDoctor = p.prescriptionDoctor || existing.prescriptionDoctor;
            existing.prescriptionDiagnosis = p.prescriptionDiagnosis || existing.prescriptionDiagnosis;
          }
          if (p.medications && p.medications.length > 0 && (!existing.medications || existing.medications.length === 0)) {
            existing.medications = p.medications;
          }
        }
      });
      clinicPatients = Array.from(uniqueMap.values());

      const filtered = clinicPatients.filter(p => p.clinicId === clinicId || !p.clinicId);
      res.json({ success: true, data: filtered });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Bệnh nhân quét mã QR check-in từ điện thoại (qua diaplus.vn/scan)
  async checkin(req, res) {
    try {
      const { 
        id,
        userId,
        code,
        clinicId = 'PK-HOAN-MY-01', 
        name = 'Bệnh nhân DIA+', 
        phone = '',
        gender = 'Nam',
        age = 50,
        glucose = null,
        hba1c = null,
        diabetesType = 'Type 2',
        medications = [],
        notes = '',
        prescriptionImage = null,
        prescriptionDate = null,
        prescriptionHospital = null,
        prescriptionDoctor = null,
        prescriptionDiagnosis = null
      } = req.body;

      const glucoseVal = glucose != null ? Number(glucose) : null;
      const glucoseStatus = glucoseVal == null ? 'unmeasured' : (glucoseVal < 3.9 ? 'emergency_low' : glucoseVal > 10.0 ? 'high' : 'normal');

      // 1. Kiểm tra xem bệnh nhân này đã có trong danh sách chưa (khớp theo userId, id, code, hoặc SĐT thật)
      const existingIdx = clinicPatients.findIndex(p => 
        (userId && p.userId && String(p.userId) === String(userId)) ||
        (id && p.id === id) ||
        (code && p.code === code) ||
        (phone && p.phone && !phone.includes('0912 345 678') && p.phone === phone)
      );

      let targetPatient = null;

      if (existingIdx >= 0) {
        // Đã có -> CẬP NHẬT chỉ số mới nhất, GIỮ NGUYÊN MÃ DIA-xxxx (Không tạo thêm dòng mới)
        const prev = clinicPatients[existingIdx];
        targetPatient = {
          ...prev,
          name: name || prev.name,
          userId: userId || prev.userId,
          age: Number(age) || prev.age,
          gender: gender || prev.gender,
          phone: phone || prev.phone,
          status: 'active',
          lastSyncTime: 'Vừa quét QR lại xong',
          currentGlucose: glucoseVal != null ? glucoseVal : prev.currentGlucose,
          glucoseStatus: glucoseVal != null ? glucoseStatus : prev.glucoseStatus,
          hba1c: hba1c != null ? Number(hba1c) : prev.hba1c,
          prescriptionImage: prescriptionImage || prev.prescriptionImage,
          prescriptionDate: prescriptionDate || prev.prescriptionDate,
          prescriptionHospital: prescriptionHospital || prev.prescriptionHospital,
          prescriptionDoctor: prescriptionDoctor || prev.prescriptionDoctor,
          prescriptionDiagnosis: prescriptionDiagnosis || prev.prescriptionDiagnosis,
          notes: notes || prev.notes,
          medications: medications.length > 0 ? medications : prev.medications
        };

        const others = clinicPatients.filter((_, idx) => idx !== existingIdx);
        clinicPatients = [targetPatient, ...others];
      } else {
        // Bệnh nhân mới lần đầu quét
        targetPatient = {
          id: id || `p-${Date.now()}`,
          userId: userId || null,
          clinicId,
          code: code || `DIA-${Math.floor(1000 + Math.random() * 9000)}`,
          name,
          age: Number(age) || 50,
          gender,
          phone: phone || `09${Math.floor(10000000 + Math.random() * 90000000)}`,
          diabetesType,
          doctor: 'BS.CKII Nguyễn Văn An',
          checkinAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' Hôm nay',
          status: 'active',
          deviceStatus: glucoseVal != null ? 'ble_synced' : 'disconnected',
          deviceType: 'App DIA+ Live Web Sync',
          lastSyncTime: 'Vừa quét QR xong',
          currentGlucose: glucoseVal,
          glucoseStatus,
          glucoseTrend: glucoseVal != null ? 'stable' : 'unknown',
          hba1c: hba1c != null ? Number(hba1c) : null,
          prescriptionImage: prescriptionImage || null,
          prescriptionDate: prescriptionDate || null,
          prescriptionHospital: prescriptionHospital || null,
          prescriptionDoctor: prescriptionDoctor || null,
          prescriptionDiagnosis: prescriptionDiagnosis || null,
          adherenceScore: medications.length > 0 ? 94 : null,
          glucoseHistory24h: glucoseVal != null ? [
            { time: '06:00', value: Number((glucoseVal - 0.4).toFixed(1)) },
            { time: '08:30', value: Number((glucoseVal + 0.6).toFixed(1)) },
            { time: '12:00', value: glucoseVal }
          ] : [],
          medications: medications || [],
          medicationLogs: [],
          notes: notes || `Bệnh nhân vừa quét mã QR check-in qua App DIA+ từ điện thoại.`,
          nextAppointment: 'Hôm nay'
        };

        clinicPatients = [targetPatient, ...clinicPatients];
      }

      // Thêm thông báo
      clinicNotifications = [{
        id: `n-${Date.now()}`,
        time: 'Vừa xong',
        read: false,
        type: glucoseStatus === 'emergency_low' ? 'emergency' : 'workflow',
        patientId: targetPatient.id,
        patientName: `${targetPatient.name} (${targetPatient.code})`,
        title: glucoseStatus === 'emergency_low' 
          ? `🚨 BÁO ĐỘNG HẠ ĐƯỜNG HUYẾT: ${targetPatient.name} (${glucoseVal} mmol/L)` 
          : `🎫 Bệnh nhân ${targetPatient.name} đã quét QR Check-in!`,
        desc: `Cập nhật thông tin bệnh nhân ${targetPatient.name} tại bàn khám Bác sĩ.`,
        severity: glucoseStatus === 'emergency_low' ? 'critical' : 'info'
      }, ...clinicNotifications];

      res.status(201).json({ success: true, data: targetPatient });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Bác sĩ / Bệnh nhân check-out
  async checkout(req, res) {
    try {
      const { patientId, code, userId, phone, name } = req.body;
      let updatedCount = 0;
      const checkoutTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' Hôm nay';
      clinicPatients = clinicPatients.map(p => {
        const isMatch = (patientId && (p.id === patientId || p.code === patientId)) ||
                        (code && p.code === code) ||
                        (userId && p.userId && String(p.userId) === String(userId)) ||
                        (phone && p.phone && !phone.includes('0912 345 678') && p.phone === phone) ||
                        (name && p.name && p.name.trim().toLowerCase() === name.trim().toLowerCase());
        if (isMatch) {
          updatedCount++;
          return { 
            ...p, 
            status: 'completed', 
            checkoutAt: checkoutTime 
          };
        }
        return p;
      });
      res.json({ success: true, message: 'Đã checkout', updatedCount });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Cập nhật ghi chú / Lịch tái khám
  async updateNotes(req, res) {
    try {
      const { patientId, notes, nextAppointment } = req.body;
      clinicPatients = clinicPatients.map(p => {
        if (p.id === patientId) {
          return { ...p, notes: notes !== undefined ? notes : p.notes, nextAppointment: nextAppointment !== undefined ? nextAppointment : p.nextAppointment };
        }
        return p;
      });
      res.json({ success: true, message: 'Đã cập nhật' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Lấy thông báo
  async getNotifications(req, res) {
    try {
      res.json({ success: true, data: clinicNotifications });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Xóa danh sách để test quét thật
  async clearAll(req, res) {
    try {
      clinicPatients = [];
      clinicNotifications = [];
      res.json({ success: true, message: 'Đã xóa danh sách' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Bệnh nhân tải lên / quét đơn thuốc mới khi đang trong đợt khám
  async uploadPrescription(req, res) {
    try {
      const { 
        patientId, 
        code, 
        userId, 
        phone, 
        name = 'Bệnh nhân DIA+',
        prescriptionImage, 
        prescriptionDate, 
        hospitalName, 
        doctorName, 
        diagnosis, 
        medications = [] 
      } = req.body;

      let patient = clinicPatients.find(p => 
        (patientId && p.id === patientId) ||
        (code && p.code === code) ||
        (userId && p.userId && String(p.userId) === String(userId)) ||
        (phone && p.phone && p.phone === phone)
      );

      if (!patient) {
        // Tự động thêm bệnh nhân vào danh sách phòng khám nếu chưa có
        patient = {
          id: patientId || `p-${Date.now()}`,
          userId: userId || null,
          clinicId: 'PK-HOAN-MY-01',
          code: code || `DIA-${Math.floor(1000 + Math.random() * 9000)}`,
          name: name || 'Bệnh nhân DIA+',
          age: 50,
          gender: 'Nam',
          phone: phone || '',
          diabetesType: diagnosis || 'Type 2',
          doctor: 'BS.CKII Nguyễn Văn An',
          checkinAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' Hôm nay',
          status: 'active',
          deviceStatus: 'ble_synced',
          deviceType: 'App DIA+ Live Web Sync',
          lastSyncTime: 'Vừa quét đơn thuốc xong',
          currentGlucose: null,
          glucoseStatus: 'unmeasured',
          glucoseTrend: 'unknown',
          hba1c: null,
          prescriptionImage: null,
          prescriptionDate: null,
          prescriptionHospital: null,
          prescriptionDoctor: null,
          prescriptionDiagnosis: null,
          adherenceScore: null,
          glucoseHistory24h: [],
          medications: [],
          medicationLogs: [],
          notes: 'Bệnh nhân vừa chụp gửi đơn thuốc qua App DIA+.',
          nextAppointment: 'Hôm nay'
        };
        clinicPatients.unshift(patient);
      }

      clinicPatients.forEach(p => {
        if (
          (patientId && p.id === patientId) ||
          (code && p.code === code) ||
          (userId && p.userId && String(p.userId) === String(userId)) ||
          (phone && p.phone && p.phone === phone)
        ) {
          p.prescriptionImage = prescriptionImage;
          p.prescriptionDate = prescriptionDate || new Date().toISOString().split('T')[0];
          p.prescriptionHospital = hospitalName || p.prescriptionHospital || '';
          p.prescriptionDoctor = doctorName || p.prescriptionDoctor || '';
          p.prescriptionDiagnosis = diagnosis || p.prescriptionDiagnosis || '';
          if (medications && medications.length > 0) {
            p.medications = medications.map(m => ({
              name: m.name,
              dosage: m.dosage || '1 viên',
              timing: m.instructions || m.frequency || 'Theo chỉ định',
              status: 'pending'
            }));
            p.adherenceScore = 95;
          }
        }
      });

      clinicNotifications.unshift({
        id: `n-${Date.now()}`,
        time: 'Vừa xong',
        read: false,
        type: 'prescription',
        title: '📸 Đơn thuốc mới được tải lên',
        message: `Bệnh nhân ${patient.name} (${patient.code}) vừa chụp quét đơn thuốc mới.`,
        patientId: patient.id
      });

      return res.json({ success: true, message: 'Đã cập nhật ảnh đơn thuốc thành công', data: patient });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },

  // Kiểm tra đăng nhập tài khoản phòng khám & Xác thực IP Mạng Local
  async checkClinicAuthAndIp(req, res) {
    try {
      const { identifier = '', password = '', bypassIp = false } = req.body;
      const idLower = identifier.trim().toLowerCase();

      // Danh sách tài khoản phòng khám đăng ký dịch vụ Local
      const isClinicAccount = 
        idLower === 'pk-hoan-my-01' || 
        idLower === 'clinic@hoanmy.vn' || 
        idLower === 'phongkhamhoanmy@diaplus.vn' ||
        idLower === 'hoanmy' ||
        idLower === 'bacsi.an@hoanmy.vn' ||
        idLower.startsWith('pk-');

      if (!isClinicAccount) {
        return res.json({ success: true, isClinic: false });
      }

      // Lấy IP của client
      const rawIp = req.headers['x-forwarded-for'] || 
                    req.headers['x-real-ip'] || 
                    req.headers['cf-connecting-ip'] || 
                    req.socket.remoteAddress || 
                    req.ip || 
                    '127.0.0.1';
      
      const clientIp = rawIp.split(',')[0].trim();

      // Kiểm tra xem có phải dải IP mạng Local / Intranet hoặc Whitelist phòng khám không
      const isLocalOrWhitelisted = 
        clientIp === '127.0.0.1' || 
        clientIp === '::1' || 
        clientIp === 'localhost' || 
        clientIp.startsWith('192.168.') || 
        clientIp.startsWith('10.') || 
        clientIp.startsWith('172.16.') || 
        clientIp.startsWith('172.31.') ||
        clientIp.startsWith('::ffff:127.0.0.1') ||
        bypassIp === true;

      return res.json({
        success: true,
        isClinic: true,
        clinicId: 'PK-HOAN-MY-01',
        clinicName: 'Phòng Khám Nội Tiết & Đái Tháo Đường Hoàn Mỹ',
        doctorName: 'BS.CKII Nguyễn Văn An',
        clientIp,
        isAllowedIp: isLocalOrWhitelisted,
        redirectUrl: '/clinic/dashboard',
        message: isLocalOrWhitelisted 
          ? `✅ Xác thực thành công: IP ${clientIp} thuộc mạng nội bộ phòng khám đã đăng ký dịch vụ.` 
          : `🔒 Từ chối truy cập: Địa chỉ IP ${clientIp} không nằm trong dải IP mạng phòng khám được cấp phép.`
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = clinicController;
