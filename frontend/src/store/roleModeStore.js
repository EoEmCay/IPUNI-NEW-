import { create } from 'zustand';

const ROLE_STORAGE_KEY = 'diaplus_active_role_mode_v2';
const DEVICE_STORAGE_KEY = 'diaplus_supervisor_device_mode_v1';
const CALLER_TITLE_KEY = 'diaplus_family_caller_title_v1';
const ALERT_PREFS_KEY = 'diaplus_supervisor_alert_prefs_v1';
const CAREGIVER_DATA_KEY = 'diaplus_caregiver_data_v1';

const DEFAULT_CALLER_TITLE = 'Con gái Trinh nhắc bố uống thuốc';

const DEFAULT_ALERT_PREFS = {
  urgentMissedDose: true,
  eveningDigest: true,
  highLowGlucose: true,
  supervisorName: 'Con gái Trinh',
  supervisorPhone: '0908 123 456',
};

const DEFAULT_CAREGIVER_DATA = {
  nurseName: 'Cô Lan',
  patientName: 'Cụ Nguyễn Văn An (72 tuổi)',
  caregiverPhone: '0912 345 678',
  checklistLogs: {}, // slotId -> { taken: true, time: '08:05', photo: dataUrl, by: 'Cô Lan' }
  vitalsLogs: [
    {
      id: 'vital_sample_1',
      type: 'glucose',
      value: 6.2,
      time: '07:15',
      tag: 'Trước ăn sáng',
      status: 'normal',
      loggedBy: 'Cô Lan',
    },
    {
      id: 'vital_sample_2',
      type: 'blood_pressure',
      systolic: 125,
      diastolic: 80,
      heartRate: 74,
      time: '07:20',
      tag: 'Nghỉ ngơi 15 phút',
      status: 'normal',
      loggedBy: 'Cô Lan',
    },
  ],
  dailyNote: {
    meals: 'Ăn hết 1 bát cháo yến mạch và 1 quả trứng luộc, uống 500ml nước ấm',
    mood: 'Tinh thần vui vẻ, tỉnh táo, nhớ tên con cháu',
    sleep: 'Ngủ sâu từ 21:30 đến 06:00, không bị mất ngủ',
    generalNotes: 'Cụ đi bộ nhẹ nhàng ngoài sân 15 phút, chân bớt tê bì.',
    lastUpdated: '08:30 sáng nay',
  },
  dailyTasks: [
    {
      id: 'task_1',
      title: 'Đã cho uống thuốc cử sáng',
      time: '08:00',
      category: 'medication',
      completed: true,
      completedAt: '08:05',
      assignedBy: 'Con cháu',
    },
    {
      id: 'task_2',
      title: 'Đã cho ăn sáng',
      time: '07:30',
      category: 'meal',
      completed: true,
      completedAt: '07:45',
      assignedBy: 'Con cháu',
    },
    {
      id: 'task_3',
      title: 'Đo đường huyết & huyết áp',
      time: '07:15',
      category: 'vital',
      completed: true,
      completedAt: '07:20',
      assignedBy: 'Con cháu',
    },
    {
      id: 'task_4',
      title: 'Đã cho ăn trưa',
      time: '11:30',
      category: 'meal',
      completed: false,
      completedAt: null,
      assignedBy: 'Con cháu',
    },
    {
      id: 'task_5',
      title: 'Hỗ trợ cụ vận động / đi dạo nhẹ',
      time: '16:00',
      category: 'activity',
      completed: false,
      completedAt: null,
      assignedBy: 'Con cháu',
    },
    {
      id: 'task_6',
      title: 'Đã cho uống thuốc cử chiều / tối',
      time: '18:30',
      category: 'medication',
      completed: false,
      completedAt: null,
      assignedBy: 'Con cháu',
    },
    {
      id: 'task_7',
      title: 'Đã cho ăn tối',
      time: '19:00',
      category: 'meal',
      completed: false,
      completedAt: null,
      assignedBy: 'Con cháu',
    },
    {
      id: 'task_8',
      title: 'Vệ sinh cá nhân & chuẩn bị ngủ',
      time: '21:00',
      category: 'activity',
      completed: false,
      completedAt: null,
      assignedBy: 'Con cháu',
    },
  ],
};

function loadInitialRole() {
  try {
    const saved = localStorage.getItem(ROLE_STORAGE_KEY);
    if (saved === 'supervisor' || saved === 'caregiver' || saved === 'patient') {
      return saved;
    }
    // Fallback to old key if exists
    const oldSaved = localStorage.getItem('diaplus_active_role_mode_v1');
    if (oldSaved === 'supervisor') return 'supervisor';
    return 'patient';
  } catch {
    return 'patient';
  }
}

function loadInitialDeviceMode() {
  try {
    const saved = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (saved === 'pc' || saved === 'mobile') return saved;
    return typeof window !== 'undefined' && window.innerWidth >= 900 ? 'pc' : 'mobile';
  } catch {
    return 'mobile';
  }
}

export function getSavedCallerTitle() {
  try {
    return localStorage.getItem(CALLER_TITLE_KEY) || DEFAULT_CALLER_TITLE;
  } catch {
    return DEFAULT_CALLER_TITLE;
  }
}

function loadAlertPrefs() {
  try {
    const raw = localStorage.getItem(ALERT_PREFS_KEY);
    return raw ? { ...DEFAULT_ALERT_PREFS, ...JSON.parse(raw) } : DEFAULT_ALERT_PREFS;
  } catch {
    return DEFAULT_ALERT_PREFS;
  }
}

function loadCaregiverData() {
  try {
    const raw = localStorage.getItem(CAREGIVER_DATA_KEY);
    if (!raw) return DEFAULT_CAREGIVER_DATA;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CAREGIVER_DATA,
      ...parsed,
      dailyTasks: Array.isArray(parsed.dailyTasks) && parsed.dailyTasks.length > 0
        ? parsed.dailyTasks
        : DEFAULT_CAREGIVER_DATA.dailyTasks,
    };
  } catch {
    return DEFAULT_CAREGIVER_DATA;
  }
}

const useRoleModeStore = create((set, get) => ({
  roleMode: loadInitialRole(), // 'patient' | 'caregiver' | 'supervisor'
  deviceMode: loadInitialDeviceMode(), // 'mobile' | 'pc'
  callerTitle: getSavedCallerTitle(),
  alertPrefs: loadAlertPrefs(),
  isRoleSelectorOpen: false,

  // Transition state cho hiệu ứng điện ảnh 3D lật thẻ
  transitioning: false,
  fromRole: null,
  targetRole: null,

  // Dữ liệu người chăm sóc (hộ lý trực tiếp)
  caregiverData: loadCaregiverData(),

  openRoleSelector: () => set({ isRoleSelectorOpen: true }),
  closeRoleSelector: () => set({ isRoleSelectorOpen: false }),

  setDeviceMode: (mode) => {
    try {
      localStorage.setItem(DEVICE_STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
    set({ deviceMode: mode });
  },

  toggleDeviceMode: () => {
    const next = get().deviceMode === 'pc' ? 'mobile' : 'pc';
    get().setDeviceMode(next);
  },

  setCallerTitle: (title) => {
    const clean = (title || '').trim() || DEFAULT_CALLER_TITLE;
    try {
      localStorage.setItem(CALLER_TITLE_KEY, clean);
    } catch {
      /* ignore */
    }
    set({ callerTitle: clean });
  },

  updateAlertPrefs: (patch) => {
    const next = { ...get().alertPrefs, ...patch };
    try {
      localStorage.setItem(ALERT_PREFS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    set({ alertPrefs: next });
  },

  // Chuyển đổi giữa 3 vai trò ('patient' | 'caregiver' | 'supervisor')
  switchRole: (nextRole) => {
    if (get().transitioning) return;
    const current = get().roleMode;
    const resolved = nextRole || (current === 'patient' ? 'supervisor' : 'patient');
    if (resolved === current) {
      set({ isRoleSelectorOpen: false });
      return;
    }

    set({
      isRoleSelectorOpen: false,
      transitioning: true,
      fromRole: current,
      targetRole: resolved,
    });

    // Đúng thời điểm thẻ tiếp đất phẳng phiu (520ms), cập nhật DOM nền
    setTimeout(() => {
      try {
        localStorage.setItem(ROLE_STORAGE_KEY, resolved);
      } catch {
        /* ignore */
      }
      set({ roleMode: resolved });
    }, 520);

    // Mờ dần lớp portal để hiển thị giao diện mới sau 920ms
    setTimeout(() => {
      set({ transitioning: false, fromRole: null, targetRole: null });
    }, 920);
  },

  // Ghi nhận nhiệm vụ uống thuốc của Hộ lý
  setCaregiverSlotTaken: (slotId, photoProof = null) => {
    const prev = get().caregiverData;
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const nextChecklist = {
      ...prev.checklistLogs,
      [slotId]: {
        taken: true,
        takenAt: nowStr,
        photoProof,
        by: prev.nurseName || 'Hộ lý',
      },
    };
    const nextData = { ...prev, checklistLogs: nextChecklist };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
  },

  undoCaregiverSlot: (slotId) => {
    const prev = get().caregiverData;
    const nextChecklist = { ...prev.checklistLogs };
    delete nextChecklist[slotId];
    const nextData = { ...prev, checklistLogs: nextChecklist };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
  },

  // Thêm chỉ số đo trực tiếp từ Hộ lý
  addCaregiverVital: (vitalItem) => {
    const prev = get().caregiverData;
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newEntry = {
      id: `vital_${Date.now()}`,
      time: nowStr,
      loggedBy: prev.nurseName || 'Hộ lý',
      ...vitalItem,
    };
    const nextVitals = [newEntry, ...prev.vitalsLogs.slice(0, 19)];
    const nextData = { ...prev, vitalsLogs: nextVitals };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
  },

  // Cập nhật nhật ký chăm sóc hàng ngày
  updateCaregiverDailyNote: (patch) => {
    const prev = get().caregiverData;
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const nextDaily = {
      ...prev.dailyNote,
      ...patch,
      lastUpdated: nowStr,
    };
    const nextData = { ...prev, dailyNote: nextDaily };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
  },

  // Hộ lý tick hoàn thành hoặc hoàn tác nhiệm vụ trong ngày
  toggleCaregiverTask: (taskId) => {
    const prev = get().caregiverData;
    const currentTasks = prev.dailyTasks || DEFAULT_CAREGIVER_DATA.dailyTasks;
    const nowStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const nextTasks = currentTasks.map((t) => {
      if (t.id === taskId) {
        const willBeCompleted = !t.completed;
        return {
          ...t,
          completed: willBeCompleted,
          completedAt: willBeCompleted ? nowStr : null,
        };
      }
      return t;
    });
    const nextData = { ...prev, dailyTasks: nextTasks };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
  },

  // Con cháu thêm nhiệm vụ mới giao cho Hộ lý
  addCaregiverTask: (newTask) => {
    const prev = get().caregiverData;
    const currentTasks = prev.dailyTasks || DEFAULT_CAREGIVER_DATA.dailyTasks;
    const item = {
      id: `task_${Date.now()}`,
      title: (newTask.title || '').trim() || 'Nhiệm vụ mới',
      time: newTask.time || '12:00',
      category: newTask.category || 'custom',
      completed: false,
      completedAt: null,
      assignedBy: 'Con cháu',
    };
    const nextTasks = [...currentTasks, item];
    const nextData = { ...prev, dailyTasks: nextTasks };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
  },

  // Con cháu xóa nhiệm vụ
  removeCaregiverTask: (taskId) => {
    const prev = get().caregiverData;
    const currentTasks = prev.dailyTasks || DEFAULT_CAREGIVER_DATA.dailyTasks;
    const nextTasks = currentTasks.filter((t) => t.id !== taskId);
    const nextData = { ...prev, dailyTasks: nextTasks };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
  },

  // Con cháu chỉnh sửa nhiệm vụ
  updateCaregiverTask: (taskId, patch) => {
    const prev = get().caregiverData;
    const currentTasks = prev.dailyTasks || DEFAULT_CAREGIVER_DATA.dailyTasks;
    const nextTasks = currentTasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
    const nextData = { ...prev, dailyTasks: nextTasks };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
  },
}));

export default useRoleModeStore;
