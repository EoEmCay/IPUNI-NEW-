'use strict';
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const db = require('../config/database');
const { subscribe } = require('./eventBus');

/**
 * GET /api/v1/clinic/stream?token=<jwt>
 * EventSource không gửi được header Authorization -> nhận token qua query (chỉ dùng qua HTTPS).
 * Chỉ bác sĩ / quản trị phòng khám mới kết nối được, và chỉ nhận sự kiện của bệnh nhân mình quản lý.
 */
async function streamHandler(req, res) {
  const token = req.query.token || (req.headers.authorization || '').replace('Bearer ', '');
  let user;
  try {
    user = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).end();
  }

  const provider = await db('users').where({ id: user.id }).first();
  if (!provider || !['doctor', 'clinic_admin'].includes(provider.role)) {
    return res.status(403).end();
  }

  // Tập bệnh nhân bác sĩ này được phép nhận realtime
  const links = await db('care_links')
    .where({ member_id: user.id, relation: 'doctor', status: 'active' })
    .select('patient_id');
  const allowed = new Set(links.map((l) => l.patient_id));
  if (provider.clinic_id) {
    const co = await db('users').where({ role: 'patient', clinic_id: provider.clinic_id }).select('id');
    co.forEach((r) => allowed.add(r.id));
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.write('retry: 5000\n\n');
  res.write(`event: ready\ndata: ${JSON.stringify({ patients: [...allowed] })}\n\n`);

  const send = (evt) => {
    const pid = evt.payload && evt.payload.patientId;
    if (pid && !allowed.has(pid)) return;
    res.write(`event: ${evt.type}\ndata: ${JSON.stringify({ ...evt.payload, ts: evt.ts })}\n\n`);
  };
  const unsub = subscribe(send);

  const ping = setInterval(() => res.write(': ping\n\n'), 25000);

  req.on('close', () => {
    clearInterval(ping);
    unsub();
    res.end();
  });
}

module.exports = { streamHandler };
