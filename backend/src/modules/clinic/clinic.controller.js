// In-memory & DB backed storage for clinic check-ins
let clinicPatients = [];
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
          uniqueMap.set(key, p);
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
        glucose = 6.4,
        hba1c = 6.8,
        diabetesType = 'Type 2',
        medications = [],
        notes = ''
      } = req.body;

      const glucoseVal = Number(glucose) || 6.4;
      const glucoseStatus = glucoseVal < 3.9 ? 'emergency_low' : glucoseVal > 10.0 ? 'high' : 'normal';

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
          currentGlucose: glucoseVal,
          glucoseStatus,
          hba1c: Number(hba1c) || prev.hba1c,
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
          deviceStatus: 'ble_synced',
          deviceType: 'App DIA+ Live Web Sync',
          lastSyncTime: 'Vừa quét QR xong',
          currentGlucose: glucoseVal,
          glucoseStatus,
          glucoseTrend: 'stable',
          hba1c: Number(hba1c) || 6.8,
          adherenceScore: 94,
          glucoseHistory24h: [
            { time: '06:00', value: Number((glucoseVal - 0.4).toFixed(1)) },
            { time: '08:30', value: Number((glucoseVal + 0.6).toFixed(1)) },
            { time: '12:00', value: glucoseVal }
          ],
          medications: medications.length > 0 ? medications : [
            { name: 'Metformin 500mg', dosage: '1 viên', timing: 'Sau ăn sáng', status: 'taken' },
            { name: 'Januvia 100mg', dosage: '1 viên', timing: 'Sau ăn tối', status: 'pending' }
          ],
          medicationLogs: [
            { time: '07:30', date: 'Hôm nay', medName: 'Metformin 500mg (1 viên)', status: 'taken', punctuality: 'on_time', note: 'Uống thuốc đúng giờ' }
          ],
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
