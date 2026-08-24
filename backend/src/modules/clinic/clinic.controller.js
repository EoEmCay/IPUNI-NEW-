// In-memory & DB backed storage for clinic check-ins
let clinicPatients = [];
let clinicNotifications = [];

const clinicController = {
  // Lấy danh sách bệnh nhân đang khám tại phòng khám
  async getPatients(req, res) {
    try {
      const { clinicId = 'PK-HOAN-MY-01' } = req.query;
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
        clinicId = 'PK-HOAN-MY-01', 
        name = 'Bệnh nhân DIA+', 
        phone = '0901 234 567',
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

      const newPatient = {
        id: `p-${Date.now()}`,
        clinicId,
        code: `DIA-${Math.floor(1000 + Math.random() * 9000)}`,
        name,
        age: Number(age) || 50,
        gender,
        phone,
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

      // Đưa bệnh nhân lên đầu
      clinicPatients = [newPatient, ...clinicPatients];

      // Thêm thông báo
      clinicNotifications = [{
        id: `n-${Date.now()}`,
        time: 'Vừa xong',
        read: false,
        type: glucoseStatus === 'emergency_low' ? 'emergency' : 'workflow',
        patientId: newPatient.id,
        patientName: `${newPatient.name} (${newPatient.code})`,
        title: glucoseStatus === 'emergency_low' 
          ? `🚨 BÁO ĐỘNG HẠ ĐƯỜNG HUYẾT: ${newPatient.name} (${glucoseVal} mmol/L)` 
          : `🎫 Bệnh nhân mới vừa quét QR Check-in!`,
        desc: `Bệnh nhân ${newPatient.name} đã quét mã QR từ điện thoại và kết nối trực tiếp với Bác sĩ.`,
        severity: glucoseStatus === 'emergency_low' ? 'critical' : 'info'
      }, ...clinicNotifications];

      res.status(201).json({ success: true, data: newPatient });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // Bác sĩ / Bệnh nhân check-out
  async checkout(req, res) {
    try {
      const { patientId } = req.body;
      clinicPatients = clinicPatients.map(p => p.id === patientId ? { ...p, status: 'completed', checkoutAt: new Date().toLocaleString('vi-VN') } : p);
      res.json({ success: true, message: 'Đã checkout' });
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
  }
};

module.exports = clinicController;
