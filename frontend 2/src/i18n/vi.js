const vi = {
  // Nav
  nav: {
    home: 'Tổng quan',
    metrics: 'Chỉ số',
    scan: 'Chụp ảnh',
    medications: 'Thuốc',
    appointments: 'Bác Sĩ',
  },

  // Dashboard
  dashboard: {
    greetNight: 'Chào buổi đêm,',
    greetMorning: 'Chào buổi sáng,',
    greetAfternoon: 'Chào buổi chiều,',
    greetEvening: 'Chào buổi tối,',
    greetNightCute: 'Chúc ngủ ngon,',
    greetMorningCute: 'Chào buổi sáng xinh,',
    greetAfternoonCute: 'Chiều vui vẻ nha,',
    greetEveningCute: 'Buổi tối dễ thương,',
    metricsSection: 'Chỉ số gần nhất',
    metricsSectionCute: '✨ Chỉ số gần nhất',
    viewAll: 'Xem tất cả >',
    viewAllCute: 'Xem tất cả 🔍',
    todayMeds: 'Thuốc hôm nay',
    viewPrescription: 'Xem đơn',
    viewPrescriptionCute: 'Xem đơn 💊',
    noMeds: 'Chưa có đơn thuốc',
    noMedsSubtitle: 'Bác sĩ chưa kê đơn thuốc nào.',
    addMetric: 'Nhập chỉ số',
  },

  // Metrics page
  metrics: {
    title: 'Theo dõi chỉ số',
    subtitle: 'Nhập và xem biểu đồ chỉ số sức khỏe',
    addBtn: 'Nhập chỉ số',
    days7: '7 ngày',
    days14: '14 ngày',
    days30: '30 ngày',
    noData: 'Chưa có dữ liệu',
    noDataSubtitle: 'Hãy nhập chỉ số đầu tiên của bạn.',
    glucoseLabel: 'Glucose',
    hba1cLabel: 'HbA1c',
    types: {
      glucose_fasting: 'Glucose (Đói)',
      glucose_postmeal: 'Glucose (Sau ăn 2h)',
      glucose_tolerance: 'Dung nạp Glucose',
      hba1c: 'HbA1c',
      c_peptide: 'C-peptide',
      blood_pressure: 'Huyết áp',
    },
    thresholds: {
      glucose_fasting: 'Bình thường: 3.9–5.5 | Tiền ĐTĐ: 5.6–6.9 | Đái tháo đường: ≥7.0 mmol/L',
      glucose_postmeal: 'Bình thường: <7.8 | Tiền ĐTĐ: 7.8–11.0 | Đái tháo đường: ≥11.1 mmol/L',
      glucose_tolerance: 'Bình thường: <7.8 | Tiền ĐTĐ: 7.8–11.0 | Đái tháo đường: ≥11.1 mmol/L',
      hba1c: 'Bình thường: <5.7% | Tiền ĐTĐ: 5.7–6.4% | Đái tháo đường: ≥6.5%',
      c_peptide: 'Thấp (thiếu insulin): <0.5 | Bình thường: 0.5–2.0 | Cao (kháng insulin): >2.0 ng/mL',
      blood_pressure: 'Thấp: <90/60 | Bình thường: <120/80 | Tiền cao HA: 120–139 | Cao HA: ≥140/90 mmHg',
    },
    statusLow: 'Hạ đường huyết',
    statusNormal: 'Bình thường (Kiểm soát tốt)',
    statusWarning: 'Cảnh báo',
    statusDanger: 'Đái tháo đường',
    statusPrediabetes: 'Tiền đái tháo đường (Có nguy cơ)',
    hypoglycemia: 'Hạ đường huyết (<3.9 mmol/L)',
    statisticsTitle: 'Thống kê',
    average: 'Trung bình',
    minimum: 'Thấp nhất',
    maximum: 'Cao nhất',
    readingCount: 'Số lần',
    estimatedHbA1c: 'Ước tính HbA1c',
    estimatedNote: '(sai số ±15-20%)',
  },

  // Add metric modal
  addMetric: {
    title: 'Nhập chỉ số',
    typeLabel: 'Loại đường huyết',
    valueLabel: 'Giá trị (mmol/L)',
    valuePlaceholder: 'Ví dụ: 6.5',
    timeLabel: 'Thời gian đo',
    noteLabel: 'Ghi chú (tùy chọn)',
    notePlaceholder: 'Ghi chú...',
    saveBtn: 'Lưu chỉ số',
    saving: 'Đang lưu...',
    invalidValue: 'Vui lòng nhập giá trị hợp lệ (0.1 – 50 mmol/L)',
    errorGeneric: 'Có lỗi xảy ra',
  },

  // Medications page
  medications: {
    title: 'Đơn thuốc & Nhắc uống',
    subtitle: 'Quản lý thuốc từ bác sĩ kê',
    noMeds: 'Chưa có đơn thuốc',
    noMedsSubtitle: 'Bác sĩ chưa kê đơn thuốc nào. Vui lòng liên hệ bác sĩ phụ trách.',
  },

  // Appointments page
  appointments: {
    title: 'Bác Sĩ & Hướng dẫn',
    subtitle: 'Lịch tái khám và chỉ dẫn từ bác sĩ',
    tabAppointments: 'Lịch hẹn',
    tabDoctor: 'Từ bác sĩ',
    noAppointments: 'Chưa có lịch hẹn',
    noAppointmentsSubtitle: 'Bác sĩ sẽ đặt lịch tái khám cho bạn sau mỗi lần khám.',
    noDoctorNotes: 'Chưa có chỉ dẫn',
    noDoctorNotesSubtitle: 'Bác sĩ sẽ ghi chỉ dẫn cho bạn sau mỗi lần khám.',
    statusUpcoming: 'Sắp tới',
    statusCompleted: 'Đã khám',
    statusCancelled: 'Đã hủy',
    doctorNote: 'Ghi chú từ bác sĩ',
    retakeSchedule: 'Tái khám định kỳ',
  },

  // Advice page
  advice: {
    title: 'Lời khuyên sức khỏe',
    subtitle: 'Hướng dẫn chế độ ăn và lối sống',
    allAdvice: 'Tất cả',
    shouldEat: 'Nên ăn',
    shouldAvoid: 'Nên tránh',
    exercise: 'Vận động',
    danger: 'Nguy hiểm',
  },

  // Auth
  auth: {
    loginTitle: 'Đăng nhập',
    loginSubtitle: 'Chào mừng bạn quay trở lại',
    loginBtn: 'Đăng nhập',
    loggingIn: 'Đang đăng nhập...',
    identifierLabel: 'Email / CCCD',
    identifierPlaceholder: 'Email hoặc số CCCD',
    passwordLabel: 'Mật khẩu',
    noAccount: 'Chưa có tài khoản?',
    registerLink: 'Đăng ký ngay',
    loginFailed: 'Đăng nhập thất bại',
    fillAll: 'Vui lòng nhập đầy đủ thông tin',

    registerTitle: 'Đăng ký',
    registerSubtitle: 'Nhập thông tin để tạo tài khoản',
    registerBtn: 'Đăng ký',
    registering: 'Đang đăng ký...',
    cccdLabel: 'Số CCCD',
    phoneLabel: 'Số điện thoại',
    confirmPasswordLabel: 'Nhập lại mật khẩu',
    hasAccount: 'Đã có tài khoản?',
    loginLink: 'Đăng nhập',
    registerFailed: 'Đăng ký thất bại',
    cccdInvalid: 'CCCD phải đúng 12 chữ số',
    phoneInvalid: 'Số điện thoại không hợp lệ',
    passwordTooShort: 'Mật khẩu ít nhất 6 ký tự',
    passwordMismatch: 'Mật khẩu nhập lại không khớp',

    tagline: 'Ứng dụng theo dõi sức khỏe tiểu đường',
    taglineRegister: 'Tạo tài khoản mới\nđể bắt đầu theo dõi sức khỏe',
    taglineLogin: 'Theo dõi sức khỏe tiểu đường\nmọi lúc, mọi nơi',
  },

  // User menu
  userMenu: {
    upgrade: 'Nâng cấp',
    profile: 'Thông Tin',
    language: 'Ngôn ngữ',
    theme: 'Giao diện',
    settings: 'Cài Đặt',
    logout: 'Đăng Xuất',
  },

  // Settings
  settings: {
    title: 'Cài Đặt',
    sectionDisplay: 'Hiển thị',
    fontSizeTitle: 'Cỡ chữ (Phóng to)',
    fontSizeDesc: 'Phóng to toàn bộ chữ để dễ đọc hơn',
    sectionTheme: 'Giao diện',
    cuteMode: 'Cute Mode',
    cuteModeDesc: 'Giao diện trẻ trung, màu pastel dễ thương',
    goldTheme: 'Gold Theme',
    goldThemeDesc: 'Giao diện cao cấp dành riêng cho tài khoản Pro',
    sectionNotify: 'Thông báo',
    reminderTitle: 'Nhắc đo đường huyết',
    reminderDesc: 'Nhắc nhở mỗi sáng lúc 7:00 và chiều 17:00',
    sectionOther: 'Khác',
    privacy: 'Quyền riêng tư',
    privacyDesc: 'Quản lý dữ liệu sức khỏe của bạn',
    support: 'Hỗ trợ & Hướng dẫn',
    supportDesc: 'Câu hỏi thường gặp, liên hệ hỗ trợ',
    comingSoon: 'Sắp ra mắt',
    version: 'DIA+ v1.0.0 — Chăm sóc sức khỏe thông minh',
  },

  // Common
  common: {
    loading: 'Đang tải...',
    save: 'Lưu',
    cancel: 'Hủy',
    close: 'Đóng',
    delete: 'Xóa',
    edit: 'Chỉnh sửa',
    add: 'Thêm',
    back: 'Quay lại',
    success: 'Thành công!',
    error: 'Có lỗi xảy ra',
  },

  // Days of week
  days: ['Chủ nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
  months: ['tháng 1', 'tháng 2', 'tháng 3', 'tháng 4', 'tháng 5', 'tháng 6', 'tháng 7', 'tháng 8', 'tháng 9', 'tháng 10', 'tháng 11', 'tháng 12'],
  dateFormat: (d, m, y) => `${d} tháng ${m} ${y}`,
};

export default vi;
