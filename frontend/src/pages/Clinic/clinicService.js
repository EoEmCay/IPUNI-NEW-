import { CLINIC_PROFILE, INITIAL_PATIENTS, INITIAL_NOTIFICATIONS } from './clinicDemoData';

const STORAGE_KEYS = {
  CLINIC_PROFILE: 'diaplus_clinic_profile',
  PATIENTS: 'diaplus_clinic_patients',
  NOTIFICATIONS: 'diaplus_clinic_notifications',
  ACTIVE_PATIENT_SESSION: 'diaplus_patient_active_clinic_session'
};

// Cross-tab real-time broadcast channel
let broadcastChannel = null;
try {
  broadcastChannel = new BroadcastChannel('diaplus_clinic_sync_channel');
} catch (e) {
  console.warn('BroadcastChannel not supported', e);
}

export const clinicService = {
  // Lấy thông tin phòng khám
  getClinicProfile() {
    const data = localStorage.getItem(STORAGE_KEYS.CLINIC_PROFILE);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CLINIC_PROFILE, JSON.stringify(CLINIC_PROFILE));
      return CLINIC_PROFILE;
    }
    return JSON.parse(data);
  },

  // Đăng nhập phòng khám
  loginClinic(clinicCode, doctorName) {
    const profile = this.getClinicProfile();
    const session = {
      isClinicLoggedIn: true,
      clinicCode: clinicCode || profile.id,
      doctorName: doctorName || profile.doctorName,
      clinicName: profile.name,
      loginAt: new Date().toISOString()
    };
    sessionStorage.setItem('diaplus_clinic_auth', JSON.stringify(session));
    return session;
  },

  getClinicAuthSession() {
    try {
      return JSON.parse(sessionStorage.getItem('diaplus_clinic_auth') || 'null');
    } catch {
      return null;
    }
  },

  logoutClinic() {
    sessionStorage.removeItem('diaplus_clinic_auth');
  },

  // Lấy danh sách bệnh nhân của phòng khám
  getPatients() {
    const data = localStorage.getItem(STORAGE_KEYS.PATIENTS);
    if (!data) {
      // Mặc định bắt đầu danh sách sạch (0 bệnh nhân ảo), chỉ hiển thị bệnh nhân thật quét QR
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify([]));
      return [];
    }
    return JSON.parse(data);
  },

  // Lấy thông tin 1 bệnh nhân
  getPatientById(id) {
    const patients = this.getPatients();
    return patients.find(p => p.id === id || p.code === id) || null;
  },

  // Cập nhật lời dặn & lịch tái khám cho bệnh nhân
  updatePatientNotes(patientId, notes, nextAppointment) {
    const patients = this.getPatients();
    const updated = patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          notes: notes !== undefined ? notes : p.notes,
          nextAppointment: nextAppointment !== undefined ? nextAppointment : p.nextAppointment
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updated));
    this.broadcastSync('PATIENT_UPDATED', { patientId });
    return updated.find(p => p.id === patientId);
  },

  // Bác sĩ kết thúc đợt điều trị / Bệnh nhân check-out
  checkoutPatient(patientId) {
    const patients = this.getPatients();
    const updated = patients.map(p => {
      if (p.id === patientId) {
        return {
          ...p,
          status: 'completed', // Đã kết thúc điều trị
          checkoutAt: new Date().toLocaleString('vi-VN')
        };
      }
      return p;
    });
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updated));

    // Thêm thông báo
    this.addNotification({
      type: 'workflow',
      patientId,
      patientName: patients.find(p => p.id === patientId)?.name || 'Bệnh nhân',
      title: '🚪 Đã kết thúc đợt điều trị',
      desc: `Bác sĩ đã hoàn tất phiên khám cho bệnh nhân. Hồ sơ đã chuyển vào lịch sử.`,
      severity: 'info'
    });

    // Đồng bộ session phía app bệnh nhân
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PATIENT_SESSION);
    this.broadcastSync('PATIENT_CHECKOUT', { patientId });
  },

  // Bệnh nhân QUÉT MÃ QR THẬT Check-in vào phòng khám
  checkinFromPatientApp(realPatientData) {
    const patients = this.getPatients();
    const profile = this.getClinicProfile();

    // Check if patient with same phone or id already exists
    const existingIndex = patients.findIndex(p => p.phone === realPatientData.phone || p.id === realPatientData.id);

    const glucoseVal = Number(realPatientData.glucose) || 6.2;
    const glucoseStatus = glucoseVal < 3.9 ? 'emergency_low' : glucoseVal > 10.0 ? 'high' : 'normal';

    const newPatient = {
      id: realPatientData.id || `p-${Date.now()}`,
      code: realPatientData.code || `DIA-${Math.floor(1000 + Math.random() * 9000)}`,
      name: realPatientData.name || 'Bệnh nhân DIA+',
      age: realPatientData.age || 50,
      gender: realPatientData.gender || 'Nam',
      phone: realPatientData.phone || '0901 234 567',
      diabetesType: realPatientData.diabetesType || 'Type 2',
      doctor: profile.doctorName,
      checkinAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' Hôm nay',
      status: 'active',
      deviceStatus: 'ble_synced',
      deviceType: realPatientData.deviceType || 'App DIA+ Live Sync',
      lastSyncTime: 'Vừa quét QR xong',
      
      currentGlucose: glucoseVal,
      glucoseStatus: glucoseStatus,
      glucoseTrend: 'stable',
      hba1c: Number(realPatientData.hba1c) || 6.8,
      adherenceScore: realPatientData.adherenceScore || 92,
      
      glucoseHistory24h: realPatientData.glucoseHistory24h || [
        { time: '06:00', value: Number((glucoseVal - 0.4).toFixed(1)) },
        { time: '08:30', value: Number((glucoseVal + 0.8).toFixed(1)) },
        { time: '12:00', value: glucoseVal }
      ],

      medications: realPatientData.medications && realPatientData.medications.length > 0 
        ? realPatientData.medications 
        : [
          { name: 'Metformin 500mg', dosage: '1 viên', timing: 'Sau ăn sáng', status: 'taken' },
          { name: 'Januvia 100mg', dosage: '1 viên', timing: 'Sau ăn tối', status: 'pending' }
        ],

      medicationLogs: realPatientData.medicationLogs || [
        { time: '07:30', date: 'Hôm nay', medName: 'Metformin 500mg (1 viên)', status: 'taken', punctuality: 'on_time', note: 'Uống thuốc đúng giờ' }
      ],

      notes: realPatientData.notes || `Bệnh nhân vừa quét mã QR check-in tại bàn khám của ${profile.doctorName}.`,
      nextAppointment: 'Hôm nay'
    };

    let updated = [];
    if (existingIndex >= 0) {
      updated = [...patients];
      updated[existingIndex] = { ...newPatient, status: 'active' };
    } else {
      updated = [newPatient, ...patients];
    }

    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updated));

    // Gửi thông báo đến Dashboard Bác Sĩ
    this.addNotification({
      type: glucoseStatus === 'emergency_low' ? 'emergency' : 'workflow',
      patientId: newPatient.id,
      patientName: `${newPatient.name} (${newPatient.code})`,
      title: glucoseStatus === 'emergency_low' 
        ? `🚨 BÁO ĐỘNG HẠ ĐƯỜNG HUYẾT: ${newPatient.name} (${glucoseVal} mmol/L)` 
        : `🎫 Bệnh nhân mới vừa quét QR Check-in!`,
      desc: `Bệnh nhân ${newPatient.name} đã quét mã QR và kết nối trực tiếp với ${profile.doctorName}.`,
      severity: glucoseStatus === 'emergency_low' ? 'critical' : 'info'
    });

    // Lưu session active phía bệnh nhân
    const patientSession = {
      clinicId: profile.id,
      clinicName: profile.name,
      doctorName: profile.doctorName,
      checkinAt: new Date().toISOString(),
      patientId: newPatient.id,
      patientCode: newPatient.code
    };
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT_SESSION, JSON.stringify(patientSession));

    // Phát tín hiệu đồng bộ tức thì sang tab Dashboard của Bác sĩ
    this.broadcastSync('PATIENT_CHECKIN', { patient: newPatient });

    return newPatient;
  },

  // Lấy phiên điều trị hiện tại của bệnh nhân (trên app B2C)
  getActivePatientClinicSession() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT_SESSION) || 'null');
    } catch {
      return null;
    }
  },

  // Bệnh nhân tự bấm rời phòng khám trên app B2C
  patientLeaveClinic() {
    const session = this.getActivePatientClinicSession();
    if (session && session.patientId) {
      this.checkoutPatient(session.patientId);
    }
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PATIENT_SESSION);
    this.broadcastSync('PATIENT_LEAVE', {});
  },

  // Lấy thông báo phòng khám
  getNotifications() {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
      return [];
    }
    return JSON.parse(data);
  },

  addNotification(notif) {
    const list = this.getNotifications();
    const newNotif = {
      id: `n-${Date.now()}`,
      time: 'Vừa xong',
      read: false,
      ...notif
    };
    const updated = [newNotif, ...list];
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    this.broadcastSync('NOTIFICATION_ADDED', { notification: newNotif });
    return newNotif;
  },

  markNotificationRead(id) {
    const list = this.getNotifications();
    const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    return updated;
  },

  markAllNotificationsRead() {
    const list = this.getNotifications();
    const updated = list.map(n => ({ ...n, read: true }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updated));
    return updated;
  },

  // Xóa sạch dữ liệu ảo để test quét thật
  clearAllPatients() {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify([]));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify([]));
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PATIENT_SESSION);
    this.broadcastSync('DATA_CLEARED', {});
  },

  // Nạp dữ liệu mẫu giả định khi cần thuyết trình
  loadMockDemoData() {
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
    this.broadcastSync('DEMO_LOADED', {});
  },

  // Broadcast sync trigger
  broadcastSync(type, payload) {
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
      } catch (e) {
        console.warn('BroadcastChannel error', e);
      }
    }
    window.dispatchEvent(new CustomEvent('clinicSyncEvent', { detail: { type, payload } }));
  }
};
