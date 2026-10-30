import { create } from 'zustand';

const ROLE_STORAGE_KEY = 'diaplus_active_role_mode_v2';
const DEVICE_STORAGE_KEY = 'diaplus_supervisor_device_mode_v1';
const CALLER_TITLE_KEY = 'diaplus_family_caller_title_v1';
const ALERT_PREFS_KEY = 'diaplus_supervisor_alert_prefs_v1';
// v2: bỏ dữ liệu mẫu cũ (Cô Lan, Cụ Nguyễn Văn An, chỉ số đo mẫu...). Khóa v1 bị xóa khi tải.
const CAREGIVER_DATA_KEY = 'diaplus_caregiver_data_v2';
const LEGACY_CAREGIVER_DATA_KEY = 'diaplus_caregiver_data_v1';

const DEFAULT_CALLER_TITLE = 'Người thân nhắc bạn uống thuốc';

const DEFAULT_ALERT_PREFS = {
  urgentMissedDose: true,
  eveningDigest: true,
  highLowGlucose: true,
  supervisorName: '',
  supervisorPhone: '',
};

// Mặc định TRỐNG: không có tên, số điện thoại, chỉ số đo hay nhật ký mẫu. Các mục việc trong ngày
// chỉ là mẫu việc chăm sóc chung, tất cả ở trạng thái chưa làm.
const DEFAULT_TASK_TEMPLATE = [
  { id: 'task_1', title: 'Cho uống thuốc cữ sáng', time: '08:00', category: 'medication' },
  { id: 'task_2', title: 'Cho ăn sáng', time: '07:30', category: 'meal' },
  { id: 'task_3', title: 'Đo đường huyết & huyết áp', time: '07:15', category: 'vital' },
  { id: 'task_4', title: 'Cho ăn trưa', time: '11:30', category: 'meal' },
  { id: 'task_5', title: 'Hỗ trợ vận động / đi dạo nhẹ', time: '16:00', category: 'activity' },
  { id: 'task_6', title: 'Cho uống thuốc cữ chiều / tối', time: '18:30', category: 'medication' },
  { id: 'task_7', title: 'Cho ăn tối', time: '19:00', category: 'meal' },
  { id: 'task_8', title: 'Vệ sinh cá nhân & chuẩn bị ngủ', time: '21:00', category: 'activity' },
];

const buildDefaultTasks = () =>
  DEFAULT_TASK_TEMPLATE.map((t) => ({ ...t, completed: false, completedAt: null, assignedBy: 'Con cháu' }));

const DEFAULT_CAREGIVER_DATA = {
  nurseName: '',
  patientName: '',
  caregiverPhone: '',
  checklistLogs: {}, // slotId -> { taken: true, takenAt: '08:05', photoProof, by }
  vitalsLogs: [],
  dailyNote: {
    meals: '',
    mood: '',
    sleep: '',
    generalNotes: '',
    lastUpdated: '',
  },
  dailyTasks: buildDefaultTasks(),
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

// Giá trị mẫu cũ có thể đã bị lưu vào máy khi người dùng đổi một công tắc bất kỳ -> coi như chưa đặt.
const LEGACY_DEMO_CALLER_TITLE = 'Con gái Trinh nhắc bố uống thuốc';
const LEGACY_DEMO_SUPERVISOR_NAME = 'Con gái Trinh';
const LEGACY_DEMO_SUPERVISOR_PHONE = '0908 123 456';

export function getSavedCallerTitle() {
  try {
    const saved = localStorage.getItem(CALLER_TITLE_KEY);
    if (!saved || saved === LEGACY_DEMO_CALLER_TITLE) return DEFAULT_CALLER_TITLE;
    return saved;
  } catch {
    return DEFAULT_CALLER_TITLE;
  }
}

function loadAlertPrefs() {
  try {
    const raw = localStorage.getItem(ALERT_PREFS_KEY);
    if (!raw) return DEFAULT_ALERT_PREFS;
    const prefs = { ...DEFAULT_ALERT_PREFS, ...JSON.parse(raw) };
    if (prefs.supervisorName === LEGACY_DEMO_SUPERVISOR_NAME) prefs.supervisorName = '';
    if (prefs.supervisorPhone === LEGACY_DEMO_SUPERVISOR_PHONE) prefs.supervisorPhone = '';
    return prefs;
  } catch {
    return DEFAULT_ALERT_PREFS;
  }
}

function loadCaregiverData() {
  try {
    // Xóa dữ liệu mẫu cũ còn lưu trên máy.
    localStorage.removeItem(LEGACY_CAREGIVER_DATA_KEY);
    const raw = localStorage.getItem(CAREGIVER_DATA_KEY);
    if (!raw) return DEFAULT_CAREGIVER_DATA;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CAREGIVER_DATA,
      ...parsed,
      dailyTasks: Array.isArray(parsed.dailyTasks) && parsed.dailyTasks.length > 0
        ? parsed.dailyTasks
        : buildDefaultTasks(),
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
    try {
      window.dispatchEvent(new CustomEvent('medicationIntakeChanged', { detail: { slotId, status: 'taken' } }));
    } catch {
      /* ignore */
    }
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
    try {
      window.dispatchEvent(new CustomEvent('medicationIntakeChanged', { detail: { slotId, status: 'pending' } }));
    } catch {
      /* ignore */
    }
  },

  // Đồng bộ trạng thái cữ thuốc từ store tuân thủ (khi bệnh nhân hoặc người con bấm uống)
  syncSlotFromAdherence: (medicationId, slotTime, status, takenAt = null, by = 'Bệnh nhân') => {
    const prev = get().caregiverData;
    const nowStr = takenAt || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const cleanTimeKey = String(slotTime || '').replace(':', '');
    const nextChecklist = { ...prev.checklistLogs };

    const matchingKey = Object.keys(nextChecklist).find(
      (k) => (medicationId && k.includes(String(medicationId))) || (cleanTimeKey && k.includes(cleanTimeKey))
    ) || `${medicationId || 'med'}_slot_0_${cleanTimeKey}`;

    if (status === 'taken') {
      nextChecklist[matchingKey] = {
        ...(nextChecklist[matchingKey] || {}),
        taken: true,
        takenAt: nowStr,
        by: by || nextChecklist[matchingKey]?.by || 'Bệnh nhân',
      };
    } else if (status === 'pending') {
      if (nextChecklist[matchingKey]) {
        delete nextChecklist[matchingKey];
      }
    }

    const nextData = { ...prev, checklistLogs: nextChecklist };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
    try {
      window.dispatchEvent(new CustomEvent('medicationIntakeChanged', { detail: { medicationId, slotTime, status } }));
    } catch {
      /* ignore */
    }
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
    try {
      window.dispatchEvent(new CustomEvent('caregiverDataChanged', { detail: nextData }));
    } catch {
      /* ignore */
    }
  },

  // Hộ lý tick hoàn thành hoặc hoàn tác nhiệm vụ trong ngày
  toggleCaregiverTask: (taskId) => {
    const prev = get().caregiverData;
    const currentTasks = prev.dailyTasks || buildDefaultTasks();
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
    try {
      window.dispatchEvent(new CustomEvent('caregiverDataChanged', { detail: nextData }));
    } catch {
      /* ignore */
    }
  },

  // Con cháu thêm nhiệm vụ mới giao cho Hộ lý
  addCaregiverTask: (newTask) => {
    const prev = get().caregiverData;
    const currentTasks = prev.dailyTasks || buildDefaultTasks();
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
    try {
      window.dispatchEvent(new CustomEvent('caregiverDataChanged', { detail: nextData }));
    } catch {
      /* ignore */
    }
  },

  // Con cháu xóa nhiệm vụ
  removeCaregiverTask: (taskId) => {
    const prev = get().caregiverData;
    const currentTasks = prev.dailyTasks || buildDefaultTasks();
    const nextTasks = currentTasks.filter((t) => t.id !== taskId);
    const nextData = { ...prev, dailyTasks: nextTasks };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
    try {
      window.dispatchEvent(new CustomEvent('caregiverDataChanged', { detail: nextData }));
    } catch {
      /* ignore */
    }
  },

  // Con cháu chỉnh sửa nhiệm vụ
  updateCaregiverTask: (taskId, patch) => {
    const prev = get().caregiverData;
    const currentTasks = prev.dailyTasks || buildDefaultTasks();
    const nextTasks = currentTasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t));
    const nextData = { ...prev, dailyTasks: nextTasks };
    try {
      localStorage.setItem(CAREGIVER_DATA_KEY, JSON.stringify(nextData));
    } catch {
      /* ignore */
    }
    set({ caregiverData: nextData });
    try {
      window.dispatchEvent(new CustomEvent('caregiverDataChanged', { detail: nextData }));
    } catch {
      /* ignore */
    }
  },
}));

export default useRoleModeStore;
