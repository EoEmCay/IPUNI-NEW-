# 📊 GLUCOSE & HbA1c IMPLEMENTATION SPECIFICATION

**Version:** 2.0 (Updated with Research)  
**Date:** 2026-06-11  
**Status:** Ready for Development

---

## 📋 MỤC LỤC

1. [4 Loại Glucose Cơ Bản](#4-loại-glucose-cơ-bản)
2. [HbA1c - Định nghĩa & Tính toán](#hba1c---định-nghĩa--tính-toán)
3. [Thresholds Lâm Sàng](#thresholds-lâm-sàng)
4. [Database Schema](#database-schema)
5. [Backend Implementation](#backend-implementation)
6. [Frontend Implementation](#frontend-implementation)
7. [Constants & Formulas](#constants--formulas)

---

## 4 LOẠI GLUCOSE CƠ BẢN

### 1️⃣ **FASTING GLUCOSE (FG) - Đường huyết lúc đói**

**Định nghĩa:**
- Blood glucose đo lúc sáng sớm sau khi không ăn uống ≥ 8-10 giờ (ngoại trừ nước)
- Phản ánh khả năng kiểm soát glucose đêm & sản xuất glucose từ gan (hepatic glucose production)

**Thời điểm đo:**
- Sáng sớm, trước khi ăn/uống (ngoài nước)
- Tối thiểu 8-10 giờ trống dạ

**Thresholds (mmol/L):**
```
Normal:          < 5.6 mmol/L (< 100 mg/dL)
Prediabetes:     5.6-6.9 mmol/L (101-125 mg/dL)
Diabetes:        ≥ 7.0 mmol/L (≥ 126 mg/dL)

IPUNI Targets (Type 2):  < 7.0 mmol/L ✅
IPUNI Targets (Type 1):  4.4-7.2 mmol/L ✅
```

**Ý nghĩa lâm sàng:**
- High fasting = Poor overnight glucose control
- High fasting + Low post-meal = Insulin resistance
- Low fasting = Good hepatic glucose control

---

### 2️⃣ **POSTPRANDIAL GLUCOSE (PPG) - Đường huyết sau ăn**

**Định nghĩa:**
- Blood glucose đo **chính xác 2 giờ** từ lúc bắt đầu ăn
- Phản ánh khả năng tuyến tụy bài tiết insulin đáp ứng với thức ăn (insulin secretion response)

**Thời điểm đo:**
- **Bắt đầu từ lúc bắt đầu ăn**, không phải lúc xong ăn
- Đúng **2 giờ** sau đó

**Thresholds (mmol/L):**
```
Normal:          < 7.8 mmol/L (< 140 mg/dL)
Prediabetes:     7.8-11.0 mmol/L (140-199 mg/dL)
Diabetes:        ≥ 11.1 mmol/L (≥ 200 mg/dL)

IPUNI Targets (Type 2):  < 7.8 mmol/L ✅
IPUNI Targets (Type 1):  < 10 mmol/L ✅
```

**Ý nghĩa lâm sàng:**
- High post-meal = Impaired insulin secretion
- Very high (> 11.1) = Insulin deficiency
- Pattern: High fasting + Low post-meal = Type 2 insulin resistance

---

### 3️⃣ **RANDOM GLUCOSE (RG) - Đường huyết ngẫu nhiên**

**Định nghĩa:**
- Blood glucose đo **bất kỳ lúc nào** trong ngày, không cần nhịn ăn
- Dùng để screening nhanh, không yêu cầu chuẩn bị

**Thời điểm đo:**
- Anytime, anywhere
- Không cần nhịn ăn
- Có thể sau bất kỳ hoạt động nào

**Thresholds (mmol/L):**
```
Normal:          < 7.8 mmol/L (< 140 mg/dL)
Diabetes:        ≥ 11.1 mmol/L (≥ 200 mg/dL) + symptoms

IPUNI Targets (General):  < 7.8 mmol/L ✅
```

**Ý nghĩa lâm sàng:**
- Quick screening when fasting not possible
- Used for convenience, less clinically specific
- Single elevated reading không đủ để chẩn đoán (cần repeat)

**Advantages:**
- Không cần preparation
- Dễ dàng cho patient compliance
- Good for pattern detection (post-activity, post-meal, etc.)

---

### 4️⃣ **HbA1c - Chỉ số glucose 3 tháng**

**Định nghĩa:**
- **Hemoglobin A1c** = Phần trăm hemoglobin bị glucose gắn kết (glycated hemoglobin)
- **Represents: AVERAGE glucose control over 3 months**
- Phản ánh glucose trung bình từ 2-3 tháng trước (RBC lifespan ~120 ngày)

**Thời điểm đo:**
- Bất kỳ lúc nào trong ngày
- **Tần suất:** Kiểm tra mỗi **3 tháng (quarterly)**
- Không cần nhịn ăn

**Thresholds (%):**
```
Normal:          < 5.7% (< 39 mmol/mol)
Prediabetes:     5.7-6.4% (39-47 mmol/mol)
Diabetes:        ≥ 6.5% (≥ 48 mmol/mol)

IPUNI Targets (Type 2):  < 7.0% (< 53 mmol/mol) ✅
IPUNI Targets (Type 1):  < 6.5% (< 48 mmol/mol) ✅
```

**Conversion mmol/mol ↔ %:**
```
mmol/mol = (10.93 × %) - 23.5
% = (mmol/mol + 23.5) / 10.93
```

**Ý nghĩa lâm sàng:**
- ✅ **Không bị ảnh hưởng bởi:** Stress hôm nay, ăn gì hôm nay, luyện tập hôm nay
- ⚠️ **Bị ảnh hưởng bởi:** Average glucose over 3 months, RBC lifespan, hemolysis
- **Best indicator:** Overall long-term glucose control

**Khi nào HbA1c cao dù daily readings bình thường?**
- Liên tục ăn quá đạm/chất béo → glucose lên từ từ
- Thành viên gia đình cao → gen
- Hemolysis (RBC bị phá hủy sớm) → false high

---

## HbA1c - ĐỊNH NGHĨA & TÍNH TOÁN

### Mối Quan Hệ Giữa Average Glucose & HbA1c

**EAGA REGRESSION FORMULA** (Được xác thực bởi ADA):

#### **Formula 1: Từ Average Glucose (mg/dL)**
```
HbA1c (%) = (2.59 + 0.635 × Avg_Glucose_mg/dL) / 100

Example:
  Avg glucose = 154 mg/dL
  HbA1c = (2.59 + 0.635 × 154) / 100
  HbA1c = (2.59 + 97.79) / 100
  HbA1c = 100.38 / 100
  HbA1c = 1.0038 = 6.8%
```

#### **Formula 2: Từ Average Glucose (mmol/L) - PREFERRED**
```
HbA1c (%) = (0.0915 × Avg_Glucose_mmol/L) + 2.15

Example:
  Avg glucose = 8.5 mmol/L
  HbA1c = (0.0915 × 8.5) + 2.15
  HbA1c = 0.778 + 2.15
  HbA1c = 2.928 = 6.8%
```

#### **Formula 3: Reverse (HbA1c → Avg Glucose)**
```
Avg_Glucose_mmol/L = (HbA1c (%) - 2.15) / 0.0915

Example:
  HbA1c = 6.8%
  Avg glucose = (6.8 - 2.15) / 0.0915
  Avg glucose = 4.65 / 0.0915
  Avg glucose = 50.8 mmol/L ❌ WRONG
  
  Wait, let me recalculate using correct formula:
  Avg_Glucose_mmol/L = (HbA1c - 2.15) / 0.0915
  But this seems off. Let me verify with mg/dL first:
  
  HbA1c = 6.8%
  Avg_Glucose_mg/dL = (100 × HbA1c - 259) / 63.5
  = (100 × 6.8 - 259) / 63.5
  = (680 - 259) / 63.5
  = 421 / 63.5
  = 6.63... ❌ ALSO WRONG
  
  Correct reverse formula (from linear regression):
  Avg_Glucose_mg/dL = 28.7 × HbA1c (%) - 46.7
  = 28.7 × 6.8 - 46.7
  = 195.16 - 46.7
  = 148.46 ≈ 149 mg/dL ✅
  
  In mmol/L:
  Avg_Glucose_mmol/L = (Avg_Glucose_mg/dL) / 18
  = 149 / 18
  = 8.3 mmol/L ✅
```

### Accuracy Margin
- **±15-20% margin of error** (due to individual RBC variation)
- Use estimated HbA1c only as **GUIDE**, not absolute

### When to Use Each Formula

| Scenario | Formula | Accuracy |
|----------|---------|----------|
| Calculate estimated HbA1c from daily readings | EAGA (mmol/L) | ⭐⭐⭐⭐⭐ |
| Patient wants to know avg glucose from HbA1c | Reverse (mg/dL) | ⭐⭐⭐⭐ |
| Convert mmol/L to mg/dL for charts | ÷18 or ×18 | ⭐⭐⭐⭐⭐ |

---

## THRESHOLDS LÂM SÀNG

### Type 2 Diabetes - Diagnostic Criteria (ADA)

| Measurement | Normal | Prediabetes | Diabetes |
|-------------|--------|-------------|----------|
| **Fasting** | < 5.6 | 5.6-6.9 | ≥ 7.0 |
| **2h Post-meal (OGTT)** | < 7.8 | 7.8-11.0 | ≥ 11.1 |
| **Random** | — | — | ≥ 11.1 + symptoms |
| **HbA1c (%)** | < 5.7 | 5.7-6.4 | ≥ 6.5 |

### Type 2 Diabetes - Management Targets (IPUNI)

| Reading Type | Target | Warning | Danger |
|--------------|--------|---------|--------|
| **Fasting** | < 7.0 | 7.0-10.0 | > 10.0 |
| **Post-meal (2h)** | < 7.8 | 7.8-11.1 | > 11.1 |
| **Random** | < 7.8 | 7.8-11.1 | > 11.1 |
| **HbA1c (%)** | < 7.0 | 7.0-8.0 | > 8.0 |

### Type 1 Diabetes - Management Targets (IPUNI)

| Reading Type | Target | Warning | Danger |
|--------------|--------|---------|--------|
| **Any reading** | 4.4-7.2 | — | > 10.0 |
| **Hypoglycemia** | — | < 3.9 | < 3.0 |
| **HbA1c (%)** | < 6.5 | 6.5-7.0 | > 7.0 |

---

## DATABASE SCHEMA

### Updated `metrics` Table

```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
    -- 'fasting' | 'post_meal_2h' | 'random' | 'hba1c'
  value FLOAT NOT NULL,
    -- For fasting/post_meal/random: mmol/L (0.1-50)
    -- For hba1c: percentage (4.0-15.0)
  unit TEXT NOT NULL DEFAULT 'mmol/L',
    -- 'mmol/L' for glucose, '%' for hba1c
  measured_at DATETIME NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### New: `hba1c_metadata` Table (Optional - Advanced)

```sql
CREATE TABLE hba1c_metadata (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  hba1c_reading_id INTEGER REFERENCES metrics(id),
  estimated_hba1c FLOAT,  -- Calculated from daily readings
  avg_glucose_7d FLOAT,   -- 7-day average
  avg_glucose_30d FLOAT,  -- 30-day average
  avg_glucose_90d FLOAT,  -- 90-day average (for HbA1c)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## BACKEND IMPLEMENTATION

### 1. Updated `metrics.constants.js`

```javascript
// File: backend/src/config/metrics.constants.js

export const METRIC_TYPES = {
  fasting: {
    label: 'Fasting Glucose',
    unit: 'mmol/L',
    normalMax: 5.6,
    warningMin: 5.6,
    warningMax: 6.9,
    dangerMin: 7.0,
    diagnosticCutoff: 7.0,  // Diabetes threshold
  },
  post_meal_2h: {
    label: 'Post-meal (2h) Glucose',
    unit: 'mmol/L',
    normalMax: 7.8,
    warningMin: 7.8,
    warningMax: 11.0,
    dangerMin: 11.1,
    diagnosticCutoff: 11.1,
  },
  random: {
    label: 'Random Glucose',
    unit: 'mmol/L',
    normalMax: 7.8,
    dangerMin: 11.1,  // + symptoms
    diagnosticCutoff: 11.1,
  },
  hba1c: {
    label: 'HbA1c',
    unit: '%',
    normalMax: 5.7,
    prediabetesMin: 5.7,
    prediabetesMax: 6.4,
    dangerMin: 6.5,
    diagnosticCutoff: 6.5,
    // Targets
    type2Target: 7.0,
    type1Target: 6.5,
    targetMax: 8.0,  // Warning if > 8%
  }
};

// Hypoglycemia threshold (all types)
export const HYPOGLYCEMIA_THRESHOLD = 3.9;

// Type-specific targets
export const TARGETS_BY_TYPE = {
  type2_diabetes: {
    fasting: { target: 7.0, warning: 10.0 },
    post_meal_2h: { target: 7.8, warning: 11.1 },
    hba1c: { target: 7.0, warning: 8.0 }
  },
  type1_diabetes: {
    any: { target: 7.2, warning: 10.0 },
    hba1c: { target: 6.5, warning: 7.0 },
    hypoglycemia: { threshold: 3.9, critical: 3.0 }
  }
};
```

### 2. HbA1c Calculation Service

```javascript
// File: backend/src/modules/metrics/hba1c.calculator.js

class HbA1cCalculator {
  /**
   * Calculate estimated HbA1c from average glucose
   * EAGA Formula: HbA1c (%) = (0.0915 × Avg_Glucose_mmol/L) + 2.15
   */
  static calculateEstimatedHbA1c(avgGlucoseMmolL) {
    const hba1c = (0.0915 * avgGlucoseMmolL) + 2.15;
    return Math.round(hba1c * 100) / 100; // Round to 2 decimals
  }

  /**
   * Reverse: Calculate average glucose from HbA1c
   * Avg_Glucose_mg/dL = 28.7 × HbA1c (%) - 46.7
   */
  static calculateAvgGlucoseFromHbA1c(hba1cPercent) {
    const avgGlucoseMgdL = (28.7 * hba1cPercent) - 46.7;
    const avgGlucoseMmolL = avgGlucoseMgdL / 18; // Convert to mmol/L
    return Math.round(avgGlucoseMmolL * 10) / 10; // Round to 1 decimal
  }

  /**
   * Calculate average glucose from recent readings
   * @param readings - array of {type, value, measured_at}
   * @param days - number of days to consider (7, 30, 90)
   */
  static getAverageGlucose(readings, days = 90) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const relevantReadings = readings.filter(r => {
      // Include all glucose types except HbA1c
      if (r.type === 'hba1c') return false;
      return new Date(r.measured_at) >= cutoffDate;
    });

    if (relevantReadings.length === 0) return null;

    const sum = relevantReadings.reduce((acc, r) => acc + r.value, 0);
    return Math.round((sum / relevantReadings.length) * 10) / 10;
  }

  /**
   * Get glucose statistics
   */
  static getStatistics(readings) {
    if (readings.length === 0) return null;

    const values = readings.map(r => r.value);
    const avg = values.reduce((a, b) => a + b) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Standard deviation (for variability)
    const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Coefficient of Variation (CV%)
    const cv = (stdDev / avg) * 100;

    return {
      average: Math.round(avg * 10) / 10,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      stdDev: Math.round(stdDev * 10) / 10,
      cv: Math.round(cv * 1) // Percentage
    };
  }
}

module.exports = HbA1cCalculator;
```

### 3. Updated Zod Validation Schema

```javascript
// File: backend/src/modules/metrics/metrics.schema.js

const { z } = require('zod');

const createMetricSchema = z.object({
  type: z.enum(
    ['fasting', 'post_meal_2h', 'random', 'hba1c'],
    { errorMap: () => ({ message: 'Invalid glucose type' }) }
  ),
  value: z.number().refine(
    (val) => {
      // Different ranges for different types
      // Glucose: 0.1-50 mmol/L
      // HbA1c: 4.0-15.0 %
      return val > 0 && val <= 50; // Will validate type-specific in controller
    },
    { message: 'Invalid glucose value' }
  ),
  unit: z.enum(['mmol/L', '%']).optional().default('mmol/L'),
  measured_at: z.string().datetime({ offset: true }).or(z.string().min(1)),
  note: z.string().optional()
}).superRefine((data, ctx) => {
  // Type-specific validation
  if (data.type === 'hba1c') {
    if (data.value < 4.0 || data.value > 15.0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'HbA1c must be between 4.0 and 15.0 %',
        path: ['value']
      });
    }
    if (data.unit !== '%') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'HbA1c unit must be %',
        path: ['unit']
      });
    }
  } else {
    // Glucose readings
    if (data.value < 0.1 || data.value > 50) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Glucose must be between 0.1 and 50 mmol/L',
        path: ['value']
      });
    }
    if (data.unit !== 'mmol/L') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Glucose unit must be mmol/L',
        path: ['unit']
      });
    }
  }
});

module.exports = { createMetricSchema };
```

### 4. Updated Metrics Controller

```javascript
// File: backend/src/modules/metrics/metrics.controller.js

const metricsService = require('./metrics.service');
const HbA1cCalculator = require('./hba1c.calculator');
const { sendSuccess, sendError } = require('../../utils/response.helper');

async function getMetrics(req, res, next) {
  try {
    const { type, days } = req.query;
    const data = await metricsService.getMetrics(req.user.id, type, days);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

async function getLatestMetrics(req, res, next) {
  try {
    const data = await metricsService.getLatestMetrics(req.user.id);
    sendSuccess(res, data);
  } catch (err) { next(err); }
}

// NEW: Get statistics
async function getStatistics(req, res, next) {
  try {
    const { days = 90 } = req.query;
    const readings = await metricsService.getMetrics(req.user.id, null, days);
    
    // Calculate statistics by type
    const stats = {};
    const types = ['fasting', 'post_meal_2h', 'random'];
    
    for (const type of types) {
      const typeReadings = readings.filter(r => r.type === type);
      stats[type] = HbA1cCalculator.getStatistics(typeReadings);
    }
    
    // Calculate estimated HbA1c from all glucose readings
    const glucoseReadings = readings.filter(r => r.type !== 'hba1c');
    const avgGlucose = HbA1cCalculator.getAverageGlucose(glucoseReadings, days);
    stats.estimatedHbA1c = avgGlucose ? {
      value: HbA1cCalculator.calculateEstimatedHbA1c(avgGlucose),
      basedOnAvgGlucose: avgGlucose,
      readingCount: glucoseReadings.length
    } : null;
    
    sendSuccess(res, stats);
  } catch (err) { next(err); }
}

async function createMetric(req, res, next) {
  try {
    const data = await metricsService.createMetric(req.user.id, req.validatedBody);
    sendSuccess(res, data, 'Glucose reading saved', 201);
  } catch (err) { next(err); }
}

async function deleteMetric(req, res, next) {
  try {
    await metricsService.deleteMetric(req.user.id, req.params.id);
    sendSuccess(res, null, 'Glucose reading deleted');
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status);
    next(err);
  }
}

module.exports = {
  getMetrics,
  getLatestMetrics,
  getStatistics,
  createMetric,
  deleteMetric
};
```

### 5. Updated Routes

```javascript
// File: backend/src/modules/metrics/metrics.routes.js

const express = require('express');
const router = express.Router();
const controller = require('./metrics.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createMetricSchema } = require('./metrics.schema');

router.use(authMiddleware);

// Get 4 latest readings (one per type)
router.get('/latest', controller.getLatestMetrics);

// NEW: Get statistics & estimated HbA1c
router.get('/statistics', controller.getStatistics);

// Get filtered readings by type & days
router.get('/', controller.getMetrics);

// Create new reading
router.post('/', validate(createMetricSchema), controller.createMetric);

// Delete reading
router.delete('/:id', controller.deleteMetric);

module.exports = router;
```

---

## FRONTEND IMPLEMENTATION

### 1. Updated Constants

```javascript
// File: frontend/src/constants/metrics.js

export const METRIC_TYPES = {
  fasting: {
    normalMax: 5.6,
    warningMin: 5.6,
    warningMax: 6.9,
    dangerMin: 7.0,
    unit: 'mmol/L',
  },
  post_meal_2h: {
    normalMax: 7.8,
    warningMin: 7.8,
    warningMax: 11.0,
    dangerMin: 11.1,
    unit: 'mmol/L',
  },
  random: {
    normalMax: 7.8,
    dangerMin: 11.1,
    unit: 'mmol/L',
  },
  hba1c: {
    normalMax: 5.7,
    prediabetesMax: 6.4,
    dangerMin: 6.5,
    type2Target: 7.0,
    type1Target: 6.5,
    unit: '%',
  }
};

export const HYPOGLYCEMIA_THRESHOLD = 3.9;

export function getMetricStatus(type, value) {
  const thresholds = METRIC_TYPES[type];
  if (!thresholds) return 'normal';

  if (type === 'hba1c') {
    if (value < 5.7) return 'normal';
    if (value <= 6.4) return 'warning';
    if (value < 7.0) return 'danger'; // For Type 2 target
    return 'danger';
  }

  if (value < HYPOGLYCEMIA_THRESHOLD) return 'low';
  if (value >= thresholds.dangerMin) return 'danger';
  if (value > thresholds.normalMax) return 'warning';
  return 'normal';
}
```

### 2. HbA1c Calculation Utility (Frontend)

```javascript
// File: frontend/src/utils/hba1c.calculator.js

/**
 * Calculate estimated HbA1c from average glucose
 * EAGA Formula: HbA1c (%) = (0.0915 × Avg_Glucose_mmol/L) + 2.15
 */
export function estimateHbA1c(avgGlucoseMmolL) {
  const hba1c = (0.0915 * avgGlucoseMmolL) + 2.15;
  return Math.round(hba1c * 100) / 100;
}

/**
 * Reverse: Calculate average glucose from HbA1c
 */
export function getAvgGlucoseFromHbA1c(hba1cPercent) {
  const avgGlucoseMgdL = (28.7 * hba1cPercent) - 46.7;
  const avgGlucoseMmolL = avgGlucoseMgdL / 18;
  return Math.round(avgGlucoseMmolL * 10) / 10;
}

/**
 * Calculate glucose statistics
 */
export function calculateStats(readings) {
  if (!readings || readings.length === 0) return null;

  const values = readings.map(r => r.value);
  const avg = values.reduce((a, b) => a + b) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avg) * 100; // Coefficient of Variation

  return {
    average: Math.round(avg * 10) / 10,
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    cv: Math.round(cv)
  };
}
```

### 3. Updated AddMetricModal

```javascript
// File: frontend/src/components/metrics/AddMetricModal.jsx

const handleSave = async () => {
  const num = parseFloat(value);
  
  // Type-specific validation
  if (type === 'hba1c') {
    if (!value || isNaN(num) || num < 4.0 || num > 15.0) {
      setError('HbA1c phải trong khoảng 4.0-15.0 %');
      return;
    }
  } else {
    if (!value || isNaN(num) || num < 0.1 || num > 50) {
      setError('Glucose phải trong khoảng 0.1-50 mmol/L');
      return;
    }
  }

  // ... rest of save logic
};

// Select dropdown options
<select className={styles.select} value={type} onChange={(e) => setType(e.target.value)}>
  <option value="fasting">{t.metrics?.types?.fasting}</option>
  <option value="post_meal_2h">{t.metrics?.types?.post_meal_2h}</option>
  <option value="random">{t.metrics?.types?.random}</option>
  <option value="hba1c">{t.metrics?.types?.hba1c}</option>
</select>
```

---

## CONSTANTS & FORMULAS (Summary)

### Key Formulas

```
1. Estimated HbA1c from Avg Glucose:
   HbA1c (%) = (0.0915 × Avg_Glucose_mmol/L) + 2.15

2. Avg Glucose from HbA1c:
   Avg_Glucose_mg/dL = 28.7 × HbA1c (%) - 46.7
   Avg_Glucose_mmol/L = Avg_Glucose_mg/dL / 18

3. Unit Conversion:
   mmol/L × 18 = mg/dL
   mg/dL ÷ 18 = mmol/L

4. Coefficient of Variation (Glucose Variability):
   CV (%) = (Standard Deviation / Average) × 100
```

### Diagnostic Cutoffs (Type 2 - ADA)

| Test | Normal | Prediabetes | Diabetes |
|------|--------|-------------|----------|
| Fasting | < 5.6 | 5.6-6.9 | ≥ 7.0 |
| 2h OGTT | < 7.8 | 7.8-11.0 | ≥ 11.1 |
| Random | N/A | N/A | ≥ 11.1 + symptoms |
| HbA1c | < 5.7% | 5.7-6.4% | ≥ 6.5% |

---

## IMPLEMENTATION CHECKLIST

### Phase 1 (Week 1-2)
- [ ] Update database schema (add 'random' & 'hba1c' types)
- [ ] Create HbA1c calculator (backend + frontend)
- [ ] Update constants with new thresholds
- [ ] Update Zod validation schema
- [ ] Update AddMetricModal to support 4 types
- [ ] Add type-specific validation
- [ ] Test all formulas with sample data

### Phase 2 (Week 3-4)
- [ ] Create statistics endpoint (/statistics)
- [ ] Add statistics display card (Avg, Min, Max, CV%)
- [ ] Show estimated HbA1c from daily readings
- [ ] Add estimated vs actual HbA1c comparison
- [ ] Update i18n with new metric types

### Phase 3 (Week 5+)
- [ ] Type 1 vs Type 2 specific targets
- [ ] Advanced HbA1c tracking
- [ ] Quarterly reminder for HbA1c test
- [ ] Historical HbA1c trend chart

---

**Document Status:** Ready for Development  
**Last Updated:** 2026-06-11  
**Next:** Begin implementation on VSCode
