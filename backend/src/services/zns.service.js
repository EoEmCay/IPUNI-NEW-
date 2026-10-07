'use strict';
const axios = require('axios');
const logger = require('../utils/logger');
const { vnParts } = require('../modules/medications/medicationSchedule');

// ============================================================================
// ZALO ZNS QUA eSMS - gửi tin Zalo theo MẪU ĐÃ ĐƯỢC ZALO DUYỆT tới số điện thoại (người nhận
// không cần quan tâm OA). Mẫu tin xem docs/ZALO_ZNS_TEMPLATES.md.
// Cần: ESMS_API_KEY, ESMS_SECRET_KEY, ESMS_ZALO_OAID + mã mẫu ZNS_TEMPLATE_DOSE_REMINDER /
// ZNS_TEMPLATE_CAREGIVER_MISSED. Thiếu biến nào thì mẫu đó tự tắt (no-op), không throw.
// ESMS_ZNS_SANDBOX=1 để gửi thử (eSMS không trừ tiền, không tới người nhận thật).
// ============================================================================
const ESMS_ZNS_URL = 'https://rest.esms.vn/MainService.svc/json/SendZaloMessage_V6/';

const TEMPLATES = {
  doseReminder: () => process.env.ZNS_TEMPLATE_DOSE_REMINDER,
  caregiverMissed: () => process.env.ZNS_TEMPLATE_CAREGIVER_MISSED,
};

function isConfigured(template) {
  return Boolean(process.env.ESMS_API_KEY && process.env.ESMS_SECRET_KEY && process.env.ESMS_ZALO_OAID &&
    TEMPLATES[template] && TEMPLATES[template]());
}

// 0912345678 / +84912345678 -> 84912345678 (định dạng eSMS yêu cầu)
function toEsmsPhone(phone) {
  const digits = String(phone || '').replace(/\D/g, '');
  if (digits.startsWith('84')) return digits;
  if (digits.startsWith('0')) return '84' + digits.slice(1);
  return digits;
}

// Tham số giờ uống chung cho cả 2 mẫu: { buoi: 'Sáng', gio: '07:00', ngay: '07/10/2026' } (giờ VN).
// Cố ý KHÔNG gửi tên thuốc: Zalo xếp thuốc kê đơn vào nội dung hạn chế -> mẫu dễ bị từ chối.
function doseTimeParams(instant) {
  const p = vnParts(instant);
  const pad = n => String(n).padStart(2, '0');
  const buoi = p.hh < 11 ? 'Sáng' : p.hh < 14 ? 'Trưa' : p.hh < 18 ? 'Chiều' : 'Tối';
  return { buoi, gio: `${pad(p.hh)}:${pad(p.mm)}`, ngay: `${pad(p.d)}/${pad(p.m + 1)}/${p.y}` };
}

/**
 * Gửi 1 tin ZNS. Không bao giờ throw.
 * @param {{ template: 'doseReminder'|'caregiverMissed', phone: string, data: object, requestId: string }} msg
 *   requestId: eSMS bỏ qua yêu cầu trùng RequestId trong 24h -> chống gửi lặp khi job chạy lại.
 * @returns {Promise<{ sent: boolean, reason?: string }>}
 */
async function sendZns({ template, phone, data, requestId }) {
  if (!phone) return { sent: false, reason: 'no_phone' };
  if (!isConfigured(template)) return { sent: false, reason: 'not_configured' };
  try {
    const res = await axios.post(ESMS_ZNS_URL, {
      ApiKey: process.env.ESMS_API_KEY,
      SecretKey: process.env.ESMS_SECRET_KEY,
      OAID: process.env.ESMS_ZALO_OAID,
      TempID: TEMPLATES[template](),
      TempData: data,
      Phone: toEsmsPhone(phone),
      RequestId: String(requestId).slice(0, 50),
      campaignid: `DIA+ ${template}`,
      Sandbox: process.env.ESMS_ZNS_SANDBOX === '1' ? '1' : '0',
    }, { timeout: 8000 });
    if (String(res.data && res.data.CodeResult) !== '100') {
      logger.warn(`[ZNS] eSMS từ chối (${template}): ${res.data && (res.data.ErrorMessage || res.data.CodeResult)}`);
      return { sent: false, reason: 'rejected' };
    }
    return { sent: true };
  } catch (e) {
    logger.warn(`[ZNS] Gửi thất bại (${template}): ${e.message}`);
    return { sent: false, reason: 'send_failed' };
  }
}

module.exports = { sendZns, isConfigured, toEsmsPhone, doseTimeParams };
