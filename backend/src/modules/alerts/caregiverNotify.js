'use strict';
const db = require('../../config/database');
const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');
const { sendUrgentAlert } = require('../../services/urgentChannel.service');
const zns = require('../../services/zns.service');
const tg = require('../../services/telegram.service');

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.BREVO_USER || process.env.MAIL_USER;
  const pass = process.env.BREVO_PASS || process.env.MAIL_PASS;
  if (!user || user === 'your-email@gmail.com') return null;
  transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    auth: { user, pass },
  });
  return transporter;
}

/**
 * Gửi cảnh báo tới người nhà / bác sĩ được liên kết.
 * @param {number} patientId
 * @param {{type, severity, title, detail}} alert
 * @param {{onlyFlag?: 'alert_on_missed_dose'|'alert_on_critical_glucose', doseInstant?: Date}} opts
 *   doseInstant: giờ của cữ bị quên - có thì báo người nhà qua Zalo ZNS (nếu đã cấu hình).
 */
async function notifyCaregivers(patientId, alert, { onlyFlag, doseInstant } = {}) {
  const patient = await db('users').where({ id: patientId }).first();
  let q = db('care_links').where({ patient_id: patientId, status: 'active' });
  if (onlyFlag) q = q.andWhere(onlyFlag, true);
  const links = await q;
  if (!links.length) return;

  const tx = getTransporter();
  const patientName = (patient && patient.name) || 'Người thân của bạn';

  for (const link of links) {
    let email = link.contact_email;
    const member = link.member_id ? await db('users').where({ id: link.member_id }).first() : null;
    if (!email && member) email = member.email;
    // Người nhà kết nối bằng mã gia đình: chỉ nhắn Zalo vào SĐT của họ khi chính họ đã bật "Nhắc qua Zalo".
    const znsPhone = link.contact_phone || (member && member.zalo_reminders ? member.phone : null);

    // Telegram: người nhà (kết nối bằng mã gia đình) đã kết nối bot -> nhận mọi cảnh báo, tức thì, miễn phí.
    if (member && member.telegram_chat_id) {
      tg.sendMessage(member.telegram_chat_id,
        `${alert.severity === 'critical' ? '🚨 <b>KHẨN</b>' : '⚠️'} <b>${tg.escapeHtml(alert.title)}</b> — ${tg.escapeHtml(patientName)}\n` +
        `${tg.escapeHtml(alert.detail || '')}\n\nVui lòng liên hệ và nhắc nhở người bệnh. Đây là thông báo tự động, không thay thế tư vấn y tế.`,
      ).catch(() => {});
    }

    // Kênh khẩn (SMS/Zalo ZNS...) - gửi SONG SONG với email, không chờ nhau, không để lỗi ở
    // kênh này (kể cả "chưa cấu hình") ảnh hưởng tới việc gửi email chính bên dưới.
    const useZns = znsPhone && doseInstant && zns.isConfigured('caregiverMissed');
    if (useZns) {
      zns.sendZns({
        template: 'caregiverMissed',
        phone: znsPhone,
        data: {
          ten_nguoi_than: link.display_name || (member && member.name) || 'Quý khách',
          ten_benh_nhan: patientName,
          ma_benh_nhan: (patient && patient.user_code) || String(patientId),
          ...zns.doseTimeParams(doseInstant),
        },
        requestId: `cg${link.id}-${alert.dedupe_key}`,
      }).catch(() => {});
    } else if (link.contact_phone) {
      const smsText = `[DIA+] ${alert.severity === 'critical' ? 'KHAN CAP' : 'Canh bao'}: ${alert.title} - ${patientName}. ${alert.detail || ''}`.slice(0, 300);
      sendUrgentAlert({ phone: link.contact_phone, message: smsText }).catch(() => {});
    }

    if (!email || !tx) {
      logger.warn(`[Caregiver] Bỏ qua email cảnh báo link#${link.id} (thiếu email hoặc SMTP chưa cấu hình)`);
      continue;
    }
    try {
      await tx.sendMail({
        from: `"DIA+ Cảnh báo" <${process.env.BREVO_USER || process.env.MAIL_USER}>`,
        to: email,
        subject: `[DIA+] ${alert.severity === 'critical' ? '🚨 KHẨN' : '⚠️'} ${alert.title} — ${patientName}`,
        html: `
          <p>Xin chào ${link.display_name || 'bạn'},</p>
          <p>Hệ thống DIA+ ghi nhận tình huống cần lưu ý với <b>${patientName}</b>:</p>
          <blockquote style="border-left:4px solid #EF4444;padding-left:12px;margin:12px 0">
            <b>${alert.title}</b><br/>${alert.detail || ''}
          </blockquote>
          <p>Vui lòng liên hệ và nhắc nhở người bệnh. Đây là thông báo tự động, không thay thế tư vấn y tế.</p>
        `,
      });
      logger.info(`[Caregiver] Đã gửi cảnh báo "${alert.type}" tới ${email}`);
    } catch (e) {
      logger.error(`[Caregiver] Lỗi gửi mail: ${e.message}`);
    }
  }
}

module.exports = { notifyCaregivers };
