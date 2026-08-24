import { CLINIC_PROFILE, INITIAL_PATIENTS, INITIAL_NOTIFICATIONS } from './clinicDemoData';

const STORAGE_KEYS = {
  CLINIC_PROFILE: 'diaplus_clinic_profile',
  PATIENTS: 'diaplus_clinic_patients',
  NOTIFICATIONS: 'diaplus_clinic_notifications',
  ACTIVE_PATIENT_SESSION: 'diaplus_patient_active_clinic_session'
};

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
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
      return INITIAL_PATIENTS;
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
      desc: `Bác sĩ đã hoàn tất phiên khám cho bệnh nhân. Hồ sơ đã được chuyển vào lịch sử.`,
      severity: 'info'
    });

    // Đồng bộ session phía app bệnh nhân nếu cùng trình duyệt
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_PATIENT_SESSION);
    window.dispatchEvent(new CustomEvent('clinicSessionChanged'));
  },

  // Bệnh nhân quét mã QR Check-in vào phòng khám
  checkinFromPatientApp(patientData) {
    const patients = this.getPatients();
    const newPatient = {
      id: `p-${Date.now()}`,
      code: `DIA-${Math.floor(1000 + Math.random() * 9000)}`,
      name: patientData.name || 'Bệnh nhân mới',
      age: patientData.age || 45,
      gender: patientData.gender || 'Nam',
      phone: patientData.phone || '0901 234 567',
      diabetesType: patientData.diabetesType || 'Type 2',
      doctor: patientData.doctorName || CLINIC_PROFILE.doctorName,
      checkinAt: 'Vừa quét QR Check-in',
      status: 'active',
      deviceStatus: 'ble_synced',
      deviceType: 'App DIA+ Mobile Sync',
      lastSyncTime: 'Vừa xong',
      currentGlucose: patientData.glucose || 6.5,
      glucoseStatus: patientData.glucose < 3.9 ? 'emergency_low' : patientData.glucose > 10 ? 'high' : 'normal',
      glucoseTrend: 'stable',
      hba1c: patientData.hba1c || 6.8,
      adherenceScore: 90,
      glucoseHistory24h: [
        { time: '07:00', value: 6.2 },
        { time: '11:30', value: 6.8 },
        { time: '13:00', value: patientData.glucose || 6.5 }
      ],
      medications: patientData.medications || [
        { name: 'Metformin 500mg', dosage: '1 viên', timing: 'Sáng', status: 'taken' }
      ],
      medicationLogs: [
        { time: '07:15', date: 'Hôm nay', medName: 'Metformin 500mg', status: 'taken', punctuality: 'on_time', note: 'Uống thuốc đúng giờ' }
      ],
      notes: 'Bệnh nhân vừa check-in qua mã QR phòng khám từ App DIA+.',
      nextAppointment: 'Hôm nay'
    };

    // Đưa bệnh nhân mới lên đầu danh sách
    const updated = [newPatient, ...patients];
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(updated));

    // Thêm thông báo
    this.addNotification({
      type: 'workflow',
      patientId: newPatient.id,
      patientName: `${newPatient.name} (${newPatient.code})`,
      title: '🎫 Bệnh nhân mới vừa quét QR Check-in!',
      desc: `Bệnh nhân ${newPatient.name} đã quét mã QR tại bàn khám và kích hoạt phiên theo dõi trực tiếp.`,
      severity: 'info'
    });

    // Lưu session active phía bệnh nhân
    const patientSession = {
      clinicId: CLINIC_PROFILE.id,
      clinicName: CLINIC_PROFILE.name,
      doctorName: CLINIC_PROFILE.doctorName,
      checkinAt: new Date().toISOString(),
      patientId: newPatient.id,
      patientCode: newPatient.code
    };
    localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT_SESSION, JSON.stringify(patientSession));
    window.dispatchEvent(new CustomEvent('clinicSessionChanged'));

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
    window.dispatchEvent(new CustomEvent('clinicSessionChanged'));
  },

  // Lấy thông báo phòng khám
  getNotifications() {
    const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
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
    window.dispatchEvent(new CustomEvent('clinicNotificationAdded', { detail: newNotif }));
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

  // Reset demo data
  resetDemoData() {
    localStorage.setItem(STORAGE_KEYS.CLINIC_PROFILE, JSON.stringify(CLINIC_PROFILE));
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(INITIAL_PATIENTS));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
  }
};
