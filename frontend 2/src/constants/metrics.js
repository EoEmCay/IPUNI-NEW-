// Glucose, HbA1c & C-peptide measurement types, thresholds and status logic
//
// Status returned by getMetricStatus():
//   'low'         -> Hạ đường huyết / thiếu insulin   (tím  #7C3AED)
//   'normal'      -> Bình thường                       (xanh #22C55E)
//   'prediabetes' -> Tiền đái tháo đường / nguy cơ     (vàng #F59E0B)
//   'danger'      -> Đái tháo đường                    (đỏ   #EF4444)

export const HYPOGLYCEMIA_THRESHOLD = 3.9; // mmol/L (glucose only)

export const METRIC_TYPES = {
  glucose_fasting: {
    label: 'Glucose',
    unit: 'mmol/L',
    category: 'glucose',
    min: 0.1,
    max: 50,
    placeholder: '5.5',
    // <3.9 low | 3.9–5.5 normal | 5.6–6.9 prediabetes | ≥7 danger
    lowMax: 3.9,
    normalMax: 5.5,
    prediabetesMin: 5.6,
    prediabetesMax: 6.9,
    dangerMin: 7.0
  },
  glucose_postmeal: {
    label: 'Glucose (Sau ăn 2h)',
    unit: 'mmol/L',
    category: 'glucose',
    min: 0.1,
    max: 50,
    placeholder: '7.8',
    // <3.9 low | 3.9–7.7 normal | 7.8–11.0 prediabetes | ≥11.1 danger
    lowMax: 3.9,
    normalMax: 7.7,
    prediabetesMin: 7.8,
    prediabetesMax: 11.0,
    dangerMin: 11.1
  },
  glucose_tolerance: {
    label: 'Dung nạp Glucose (OGTT 2h)',
    unit: 'mmol/L',
    category: 'glucose',
    min: 0.1,
    max: 50,
    placeholder: '7.8',
    // <7.8 normal | 7.8–11.0 prediabetes | ≥11.1 danger (low <3.9 vẫn cảnh báo)
    lowMax: 3.9,
    normalMax: 7.7,
    prediabetesMin: 7.8,
    prediabetesMax: 11.0,
    dangerMin: 11.1
  },
  hba1c: {
    label: 'HbA1c',
    unit: '%',
    category: 'hba1c',
    min: 3.0,
    max: 20,
    placeholder: '5.7',
    // <5.7 normal | 5.7–6.4 prediabetes | ≥6.5 danger
    normalMax: 5.6,
    prediabetesMin: 5.7,
    prediabetesMax: 6.4,
    dangerMin: 6.5
  },
  c_peptide: {
    label: 'C-peptide',
    unit: 'ng/mL',
    category: 'c_peptide',
    min: 0,
    max: 20,
    placeholder: '1.5',
    // <0.5 low (thiếu insulin) | 0.5–2.0 normal | >2.0 high (kháng insulin) -> prediabetes/vàng
    lowMax: 0.5,
    normalMax: 2.0,
    prediabetesMin: 2.0
  },
  blood_pressure: {
    label: 'Huyết áp',
    unit: 'mmHg',
    category: 'blood_pressure',
    min: 40,
    max: 250,
    placeholder: '120',
    lowMax: 90, // Dưới 90 là thấp
    normalMax: 120,
    prediabetesMin: 120,
    prediabetesMax: 139,
    dangerMin: 140
  }
};

export const MEASUREMENT_TYPES = {
  GLUCOSE_FASTING: 'glucose_fasting',
  GLUCOSE_POSTMEAL: 'glucose_postmeal',
  GLUCOSE_TOLERANCE: 'glucose_tolerance',
  HBAIC: 'hba1c',
  C_PEPTIDE: 'c_peptide',
  BLOOD_PRESSURE: 'blood_pressure'
};

export const MEASUREMENT_CATEGORIES = {
  GLUCOSE: 'glucose',
  HBAIC: 'hba1c',
  C_PEPTIDE: 'c_peptide',
  BLOOD_PRESSURE: 'blood_pressure'
};

// Status -> color map (single source of truth for the UI)
export const STATUS_COLORS = {
  low: '#7C3AED',         // tím
  normal: '#22C55E',      // xanh
  prediabetes: '#F59E0B', // vàng
  danger: '#EF4444'       // đỏ
};

export function getMetricStatus(measurementType, value) {
  const m = METRIC_TYPES[measurementType];
  if (!m || value == null || isNaN(value)) return 'normal';

  // C-peptide: thấp là nguy cơ (tím), cao là kháng insulin (vàng)
  if (measurementType === 'c_peptide') {
    if (value < m.lowMax) return 'low';
    if (value <= m.normalMax) return 'normal';
    return 'prediabetes';
  }

  // Glucose: hạ đường huyết khi <3.9
  if (m.category === 'glucose' && value < HYPOGLYCEMIA_THRESHOLD) return 'low';
  
  // Blood pressure: thấp khi <90
  if (m.category === 'blood_pressure' && value < m.lowMax) return 'low';

  if (value >= m.dangerMin) return 'danger';
  if (value >= m.prediabetesMin) return 'prediabetes';
  return 'normal';
}

export function getStatusLabel(status, t) {
  const labels = {
    low: t?.metrics?.statusLow || 'Low',
    normal: t?.metrics?.statusNormal || 'Normal',
    prediabetes: t?.metrics?.statusPrediabetes || 'Prediabetes',
    danger: t?.metrics?.statusDanger || 'Danger'
  };
  return labels[status] || status;
}
