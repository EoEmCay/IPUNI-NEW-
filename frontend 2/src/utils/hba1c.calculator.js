/**
 * Estimate HbA1c from average glucose
 * EAGA Formula: HbA1c (%) = (0.0915 × Avg_Glucose_mmol/L) + 2.15
 * Accuracy: ±15-20% (biological variation)
 */
export function estimateHbA1c(avgGlucoseMmolL) {
  if (!avgGlucoseMmolL || avgGlucoseMmolL <= 0) return null;

  const estimated = (0.0915 * avgGlucoseMmolL) + 2.15;

  // Clamp to reasonable range
  if (estimated < 4.0) return 4.0;
  if (estimated > 15.0) return 15.0;

  return Math.round(estimated * 100) / 100;
}

/**
 * Reverse: Calculate average glucose from HbA1c
 * Avg_Glucose_mg/dL = 28.7 × HbA1c (%) - 46.7
 * Returns in mmol/L
 */
export function getAvgGlucoseFromHbA1c(hba1cPercent) {
  if (!hba1cPercent || hba1cPercent <= 0) return null;

  const avgGlucoseMgdL = (28.7 * hba1cPercent) - 46.7;
  const avgGlucoseMmolL = avgGlucoseMgdL / 18;

  return Math.round(avgGlucoseMmolL * 10) / 10;
}

/**
 * Calculate average glucose from readings
 */
export function calculateAverageGlucose(readings) {
  if (!readings || readings.length === 0) return null;

  const sum = readings.reduce((acc, r) => acc + r.value, 0);
  return Math.round((sum / readings.length) * 10) / 10;
}

/**
 * Calculate statistics from readings
 */
export function calculateStatistics(readings) {
  if (!readings || readings.length === 0) return null;

  const values = readings.map(r => r.value);
  const avg = values.reduce((a, b) => a + b) / values.length;
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
    cv: Math.round(cv)
  };
}

/**
 * Convert glucose units
 */
export function convertGlucoseUnit(value, fromUnit, toUnit) {
  if (fromUnit === toUnit) return value;

  if (fromUnit === 'mmol/L' && toUnit === 'mg/dL') {
    return Math.round(value * 18);
  }

  if (fromUnit === 'mg/dL' && toUnit === 'mmol/L') {
    return Math.round((value / 18) * 10) / 10;
  }

  return value;
}
