const { THRESHOLDS, HYPOGLYCEMIA_THRESHOLD, PATIENT_TARGETS } = require('../../constants/metrics');

class MetricsCalculator {
  /**
   * Calculate status based on measurement type and value
   * @param {string} measurementType - glucose_fasting, glucose_postmeal, glucose_random, hba1c, blood_pressure
   * @param {number} value - The metric value
   * @param {number} valueDiastolic - The diastolic value (for blood pressure)
   * @returns {string} - 'low' | 'normal' | 'warning' | 'danger' | 'prediabetes'
   */
  static calculateStatus(measurementType, value, valueDiastolic) {
    const thresholds = THRESHOLDS[measurementType];
    if (!thresholds) return null;

    // C-peptide: thấp = thiếu insulin (low), cao = kháng insulin (prediabetes)
    if (measurementType === 'c_peptide') {
      if (value < thresholds.lowMax) return 'low';
      if (value <= thresholds.normalMax) return 'normal';
      return 'prediabetes';
    }

    // Glucose readings (fasting, tolerance)
    if (measurementType.includes('glucose')) {
      if (value < HYPOGLYCEMIA_THRESHOLD) return 'low';
      if (value >= thresholds.dangerMin) return 'danger';
      if (value >= thresholds.prediabetesMin) return 'prediabetes';
      return 'normal';
    }

    // HbA1c reading
    if (measurementType === 'hba1c') {
      if (value >= thresholds.dangerMin) return 'danger';
      if (value >= thresholds.prediabetesMin) return 'prediabetes';
      return 'normal';
    }

    // Blood pressure
    if (measurementType === 'blood_pressure') {
      if (value >= thresholds.dangerMin || (valueDiastolic && valueDiastolic >= 90)) return 'danger';
      if (value >= thresholds.prediabetesMin || (valueDiastolic && valueDiastolic >= 80)) return 'prediabetes';
      if (value < thresholds.lowMax || (valueDiastolic && valueDiastolic < 60)) return 'low';
      return 'normal';
    }

    return null;
  }

  /**
   * Estimate HbA1c from average glucose (ADAG Formula - ADA 2008)
   * eA1C (%) = (avg_glucose_mg_dL + 46.7) / 28.7
   * Reference: Nathan et al., Diabetes Care 2008
   *
   * @param {number} avgGlucoseMmolL - Average glucose in mmol/L
   * @returns {number|null} - Estimated HbA1c percentage
   */
  static estimateHbA1c(avgGlucoseMmolL) {
    if (!avgGlucoseMmolL || avgGlucoseMmolL <= 0) return null;

    const avgMgDl = avgGlucoseMmolL * 18.0182;
    const estimated = (avgMgDl + 46.7) / 28.7;

    if (estimated < 4.0) return 4.0;
    if (estimated > 15.0) return 15.0;

    return Math.round(estimated * 10) / 10; // 1 decimal place
  }

  /**
   * Reverse: Calculate average glucose from HbA1c
   * Avg_Glucose_mg/dL = 28.7 × HbA1c (%) - 46.7
   * Returns in mmol/L
   *
   * @param {number} hba1cPercent - HbA1c in percentage
   * @returns {number|null} - Average glucose in mmol/L
   */
  static getAvgGlucoseFromHbA1c(hba1cPercent) {
    if (!hba1cPercent || hba1cPercent <= 0) return null;

    const avgGlucoseMgdL = (28.7 * hba1cPercent) - 46.7;
    const avgGlucoseMmolL = avgGlucoseMgdL / 18; // Convert to mmol/L

    return Math.round(avgGlucoseMmolL * 10) / 10; // 1 decimal place
  }

  /**
   * Calculate statistics from readings
   * @param {Array} readings - Array of metric objects with .value
   * @returns {Object|null} - Statistics object
   */
  static getStatistics(readings) {
    if (!readings || readings.length === 0) return null;

    const values = readings.map(r => parseFloat(r.value)).filter(v => !isNaN(v));
    if (values.length === 0) return null;

    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Standard deviation
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of Variation (CV%)
    const cv = (stdDev / avg) * 100;

    return {
      count: readings.length,
      average: Math.round(avg * 10) / 10,
      minimum: Math.round(min * 10) / 10,
      maximum: Math.round(max * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      cv: Math.round(cv) // Percentage
    };
  }

  /**
   * Categorize reading for a specific patient
   * @param {string} measurementType - Type of measurement
   * @param {number} value - The value
   * @param {string} patientType - type2_diabetes or type1_diabetes
   * @param {number} valueDiastolic - Diastolic value
   * @returns {Object} - Status and target info
   */
  static categorizeReading(measurementType, value, patientType = 'type2_diabetes', valueDiastolic) {
    const status = this.calculateStatus(measurementType, value, valueDiastolic);
    const target = PATIENT_TARGETS[patientType];

    if (!target) return { status };

    let targetValue = null;

    if (measurementType.includes('glucose')) {
      const glucoseType = measurementType.replace('glucose_', '');
      targetValue = target.glucose[glucoseType];
    } else if (measurementType === 'hba1c') {
      targetValue = target.hba1c;
    }

    return {
      status,
      targetValue,
      isAboveTarget: targetValue ? value > targetValue : null
    };
  }

  /**
   * Convert glucose between units
   * @param {number} value - Value to convert
   * @param {string} fromUnit - 'mmol/L' or 'mg/dL'
   * @param {string} toUnit - 'mmol/L' or 'mg/dL'
   * @returns {number} - Converted value
   */
  static convertGlucoseUnit(value, fromUnit, toUnit) {
    if (fromUnit === toUnit) return value;

    if (fromUnit === 'mmol/L' && toUnit === 'mg/dL') {
      return Math.round(value * 18);
    }

    if (fromUnit === 'mg/dL' && toUnit === 'mmol/L') {
      return Math.round((value / 18) * 10) / 10;
    }

    return value;
  }
}

module.exports = MetricsCalculator;
