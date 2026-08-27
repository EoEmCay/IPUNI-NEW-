'use strict';
const db = require('../../config/database');
const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');

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
 * @param {{onlyFlag?: 'alert_on_missed_dose'|'alert_on_critical_glucose'}} opts
 */
async function notifyCaregivers(patientId, alert, { onlyFlag } = {}) {
  const patient = await db('users').where({ id: patientId }).first();
  let q = db('care_links').where({ patient_id: patientId, status: 'active' });
  if (onlyFlag) q = q.andWhere(onlyFlag, true);
  const links = await q;
  if (!links.length) return;

  const tx = getTransporter();
  const patientName = (patient && patient.name) || 'Người thân của bạn';

  for (const link of links) {
    let email = link.contact_email;
    if (!email && link.member_id) {
      const m = await db('users').where({ id: link.member_id }).first();
      email = m && m.email;
    }
    if (!email || !tx) {
      logger.warn(`[Caregiver] Bỏ qua cảnh báo link#${link.id} (thiếu email hoặc SMTP chưa cấu hình)`);
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
