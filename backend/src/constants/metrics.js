// Glucose, HbA1c & C-peptide constants, thresholds, and targets

const MEASUREMENT_TYPES = {
  GLUCOSE_FASTING: 'glucose_fasting',
  GLUCOSE_TOLERANCE: 'glucose_tolerance',
  HBAIC: 'hba1c',
  C_PEPTIDE: 'c_peptide',
  BLOOD_PRESSURE: 'blood_pressure'
};

const MEASUREMENT_CATEGORIES = {
  GLUCOSE: 'glucose',
  HBAIC: 'hba1c',
  C_PEPTIDE: 'c_peptide'
};

const UNITS = {
  GLUCOSE: 'mmol/L',
  HBAIC: '%',
  C_PEPTIDE: 'ng/mL'
};

// Clinical thresholds for each measurement type
const THRESHOLDS = {
  glucose_fasting: {
    unit: 'mmol/L',
    category: 'glucose',
    lowMax: 3.9,
    normalMax: 5.5,
    prediabetesMin: 5.6,
    prediabetesMax: 6.9,
    dangerMin: 7.0,
    diagnosticCutoff: 7.0
  },

  glucose_postmeal: {
    unit: 'mmol/L',
    category: 'glucose',
    lowMax: 3.9,
    normalMax: 7.7,
    prediabetesMin: 7.8,
    prediabetesMax: 11.0,
    dangerMin: 11.1,
    diagnosticCutoff: 11.1
  },

  glucose_tolerance: {
    unit: 'mmol/L',
    category: 'glucose',
    lowMax: 3.9,
    normalMax: 7.7,
    prediabetesMin: 7.8,
    prediabetesMax: 11.0,
    dangerMin: 11.1,
    diagnosticCutoff: 11.1
  },

  blood_pressure: {
    unit: 'mmHg',
    category: 'blood_pressure',
    lowMax: 90,      // systolic < 90 = thấp
    normalMax: 120,
    prediabetesMin: 120,
    prediabetesMax: 139,
    dangerMin: 140
  },

  hba1c: {
    unit: '%',
    category: 'hba1c',
    normalMax: 5.6,
    prediabetesMin: 5.7,
    prediabetesMax: 6.4,
    dangerMin: 6.5,
    diagnosticCutoff: 6.5,
    type2Target: 7.0,
    type1Target: 6.5,
    warningThreshold: 8.0
  },

  c_peptide: {
    unit: 'ng/mL',
    category: 'c_peptide',
    lowMax: 0.5,
    normalMax: 2.0,
    prediabetesMin: 2.0
  }
};

// Hypoglycemia threshold (applies to glucose types)
const HYPOGLYCEMIA_THRESHOLD = 3.9; // mmol/L

// Treatment targets by patient type
const PATIENT_TARGETS = {
  type2_diabetes: {
    glucose: {
      fasting: 7.0,
      tolerance: 7.8
    },
    hba1c: 7.0
  },
  type1_diabetes: {
    glucose: {
      fasting: 5.0,
      tolerance: 7.2
    },
    hba1c: 6.5
  }
};

module.exports = {
  MEASUREMENT_TYPES,
  MEASUREMENT_CATEGORIES,
  UNITS,
  THRESHOLDS,
  HYPOGLYCEMIA_THRESHOLD,
  PATIENT_TARGETS
};
