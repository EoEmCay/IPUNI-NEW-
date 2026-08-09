const { THRESHOLDS, HYPOGLYCEMIA_THRESHOLD, PATIENT_TARGETS } = require('../../constants/metrics');

// Hệ số quy đổi mmol/L <-> mg/dL chính xác (khối lượng phân tử glucose ~180.18 g/mol).
// Trước đây estimateHbA1c() dùng 18.0182 còn convertGlucoseUnit()/getAvgGlucoseFromHbA1c()
// dùng 18 làm tròn - khiến 2 hàm không round-trip đúng nhau. Dùng chung 1 hằng số.
const MMOL_TO_MGDL = 18.0182;

class MetricsCalculator {
  /**
   * Calculate status based on measurement type and value
   * @param {string} measurementType - glucose_fasting, glucose_postmeal, hba1c, blood_pressure, c_peptide
   * @param {number} value - The metric value
   * @param {number} valueDiastolic - The diastolic value (for blood pressure)
   * @param {string} patientType - 'type2_diabetes' | 'type1_diabetes' | undefined (sàng lọc/chưa chẩn đoán)
   * @returns {string} - 'low' | 'normal' | 'above_target' | 'prediabetes' | 'elevated' | 'danger'
   */
  static calculateStatus(measurementType, value, valueDiastolic, patientType) {
    const thresholds = THRESHOLDS[measurementType];
    if (!thresholds) return null;

    // C-peptide: thấp = thiếu insulin (low), cao = kháng insulin (prediabetes)
    if (measurementType === 'c_peptide') {
      if (value < thresholds.lowMax) return 'low';
      if (value <= thresholds.normalMax) return 'normal';
      return 'prediabetes';
    }

    // Glucose readings (fasting, tolerance, postmeal)
    if (measurementType.includes('glucose')) {
      // Hạ đường huyết là ngưỡng AN TOÀN PHỔ QUÁT - áp dụng cho mọi bệnh nhân, không cá nhân hoá.
      if (value < HYPOGLYCEMIA_THRESHOLD) return 'low';

      const target = patientType && PATIENT_TARGETS[patientType];
      const glucoseKey = measurementType.replace('glucose_', '');
      const personalTarget = target?.glucose?.[glucoseKey];

      if (personalTarget != null) {
        // Bệnh nhân ĐÃ ĐƯỢC CHẨN ĐOÁN: so với mục tiêu điều trị cá nhân (ADA Standards of
        // Care) thay vì ngưỡng CHẨN ĐOÁN quần thể - tránh gắn nhãn "nguy hiểm"/"tiền đái
        // tháo đường" sai cho người đã biết bệnh và đang kiểm soát tốt trong mục tiêu của họ.
        if (value > personalTarget * 1.5) return 'danger';
        if (value > personalTarget) return 'above_target';
        return 'normal';
      }

      // Không rõ patientType (vd đang sàng lọc, chưa chẩn đoán) -> dùng ngưỡng chẩn đoán quần thể.
      if (value >= thresholds.dangerMin) return 'danger';
      if (value >= thresholds.prediabetesMin) return 'prediabetes';
      return 'normal';
    }

    // HbA1c reading
    if (measurementType === 'hba1c') {
      const target = patientType && PATIENT_TARGETS[patientType];
      if (target?.hba1c != null) {
        if (value > target.hba1c + 1.5) return 'danger';
        if (value > target.hba1c) return 'above_target';
        return 'normal';
      }
      if (value >= thresholds.dangerMin) return 'danger';
      if (value >= thresholds.prediabetesMin) return 'prediabetes';
      return 'normal';
    }

    // Blood pressure
    if (measurementType === 'blood_pressure') {
      return this.calculateBloodPressureStatus(value, valueDiastolic);
    }

    return null;
  }

  /**
   * Phân loại huyết áp: xếp loại ĐỘC LẬP cho tâm thu và tâm trương rồi lấy mức nặng hơn,
   * thay vì chuỗi if/else OR xếp tầng cố định (vốn khiến vd một tâm trương hơi cao 82 có
   * thể "đè" mất tín hiệu tâm thu thấp 85 - báo "elevated" trong khi bệnh nhân thực ra
   * đang tụt huyết áp).
   * @param {number} systolic
   * @param {number} diastolic
   * @returns {string} 'low' | 'normal' | 'elevated' | 'danger'
   */
  static calculateBloodPressureStatus(systolic, diastolic) {
    const t = THRESHOLDS.blood_pressure;

    const classifySystolic = (value) => {
      if (value == null) return 'normal';
      if (value < t.lowMax) return 'low';
      if (value >= t.dangerMin) return 'danger';
      if (value >= t.prediabetesMin) return 'elevated';
      return 'normal';
    };
    const classifyDiastolic = (value) => {
      if (value == null) return 'normal';
      if (value < 60) return 'low';
      if (value >= 90) return 'danger';
      if (value >= 80) return 'elevated';
      return 'normal';
    };

    const sysStatus = classifySystolic(systolic);
    const diaStatus = classifyDiastolic(diastolic);
    const rank = { low: 0, normal: 1, elevated: 2, danger: 3 };

    // "danger" luôn thắng (ưu tiên an toàn), kể cả khi chiều còn lại đang "low" - huyết áp
    // kiểu 85/95 (tâm thu thấp, tâm trương rất cao) vẫn là bất thường cần cảnh báo NẶNG.
    if (sysStatus === 'danger' || diaStatus === 'danger') return 'danger';
    if (sysStatus === 'low' || diaStatus === 'low') return 'low';
    return rank[sysStatus] >= rank[diaStatus] ? sysStatus : diaStatus;
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

    const avgMgDl = avgGlucoseMmolL * MMOL_TO_MGDL;
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
    const avgGlucoseMmolL = avgGlucoseMgdL / MMOL_TO_MGDL;

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
    const status = this.calculateStatus(measurementType, value, valueDiastolic, patientType);
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
      return Math.round(value * MMOL_TO_MGDL);
    }

    if (fromUnit === 'mg/dL' && toUnit === 'mmol/L') {
      return Math.round((value / MMOL_TO_MGDL) * 10) / 10;
    }

    return value;
  }
}

module.exports = MetricsCalculator;
