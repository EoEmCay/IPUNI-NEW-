import api from './api';

export const careService = {
  // 1. Lấy dòng thời gian chăm sóc trực tiếp trong ngày (Live Care Timeline kiểu Grab)
  async getTimeline(date = null, patientId = null) {
    const params = {};
    if (date) params.date = date;
    if (patientId) params.patient_id = patientId;
    const res = await api.get('/care/timeline', { params });
    return res.data?.data || res.data;
  },

  // 2. Ghi nhận cữ uống thuốc (1 chạm cho người già / người chăm sóc)
  async logDose(payload) {
    const res = await api.post('/care/log-dose', payload);
    return res.data?.data || res.data;
  },

  // 3. Bản tin tuần cho con cháu & phân tích quy luật bỏ cữ lặp lại (AI Insights)
  async getWeeklySummary(patientId = null) {
    const params = {};
    if (patientId) params.patient_id = patientId;
    const res = await api.get('/care/weekly-summary', { params });
    return res.data?.data || res.data;
  },

  // 4. Báo cáo 1 trang cho Bác sĩ trước buổi tái khám (Doctor Briefing)
  async getDoctorReport(patientId = null) {
    const params = {};
    if (patientId) params.patient_id = patientId;
    const res = await api.get('/care/doctor-report', { params });
    return res.data?.data || res.data;
  },
};

export default careService;
