'use strict';
const { EventEmitter } = require('events');

/**
 * Bus sự kiện trong tiến trình. Đủ cho 1 instance (Render / Fly free tier).
 * Khi scale nhiều instance -> thay bằng Redis pub/sub hoặc Postgres LISTEN/NOTIFY.
 *
 * Sự kiện phát ra:
 *   patient.metric_added        { patientId, metric }
 *   patient.medication_logged   { patientId, log }
 *   patient.prescription_scanned{ patientId, medications, doctorName }
 *   clinical.alert              { patientId, alert }
 */
const bus = new EventEmitter();
bus.setMaxListeners(0);

function publish(type, payload) {
  bus.emit('event', { type, payload, ts: Date.now() });
}

function subscribe(handler) {
  bus.on('event', handler);
  return () => bus.off('event', handler);
}

module.exports = { publish, subscribe };
