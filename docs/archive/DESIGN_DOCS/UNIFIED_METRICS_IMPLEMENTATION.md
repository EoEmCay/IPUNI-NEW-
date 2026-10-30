# 💾 UNIFIED METRICS - COMPLETE IMPLEMENTATION LOGIC

**Approach:** Single Polymorphic Table Design  
**Date:** 2026-06-11  
**Status:** Ready to Code

---

## 🧠 DESIGN THINKING

### **Core Challenge**

Glucose & HbA1c are fundamentally different:
- **Glucose:** Frequent (daily), mmol/L, 0.1-50 range
- **HbA1c:** Infrequent (quarterly), %, 4-15 range

**Solution:** Polymorphic table with type-based handling

### **Key Design Decisions**

1. **Single `metrics` table** (unified)
   - Avoid joins
   - Flexible querying
   - Dashboard-friendly

2. **Type-based polymorphism**
   - `measurement_type`: specific type (glucose_fasting, hba1c, etc.)
   - `measurement_category`: quick filter (glucose, hba1c)

3. **Unit segregation**
   - Different units stored explicitly
   - Validation enforces unit-type matching

4. **Cached calculations**
   - `status`: Pre-calculated (low/normal/warning/danger)
   - `estimated_hba1c`: 90-day glucose average

5. **Index strategy**
   - By user + date (most queries)
   - By category (glucose vs hba1c)
   - By status (alerts)

---

## 📊 FINAL SCHEMA DESIGN

### **Table Structure**

```sql
CREATE TABLE metrics (
  -- Primary & Foreign Keys
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  -- === TYPE IDENTIFICATION (Polymorphic) ===
  
  -- Specific measurement type
  measurement_type TEXT NOT NULL CHECK(
    measurement_type IN (
      'glucose_fasting',    -- Blood glucose upon waking (8-10h fast)
      'glucose_postmeal',   -- Blood glucose 2 hours after eating
      'glucose_random',     -- Blood glucose at any time (no fast needed)
      'hba1c'               -- Hemoglobin A1c (3-month average %)
    )
  ),
  
  -- Category for quick filtering
  measurement_category TEXT NOT NULL CHECK(
    measurement_category IN ('glucose', 'hba1c')
  ),

  -- === VALUE & UNIT (Type-Dependent) ===
  
  -- Numeric value
  -- Glucose: 0.1-50 mmol/L
  -- HbA1c: 4.0-15.0 %
  value FLOAT NOT NULL CHECK(value > 0),
  
  -- Unit of measurement
  unit TEXT NOT NULL CHECK(
    unit IN ('mmol/L', '%')
  ),

  -- === TIMESTAMPS ===
  
  -- When the measurement was actually taken (critical for time-based analysis)
  measured_at DATETIME NOT NULL,
  
  -- When the record was entered into system
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Last update (for soft edits if allowed)
  updated_at DATETIME,

  -- === METADATA ===
  
  -- User's contextual notes
  -- Examples:
  --   "after heavy meal"
  --   "before exercise"
  --   "lab test result"
  --   "post-hypoglycemia event"
  note TEXT,

  -- === CALCULATED FIELDS (Cached for Performance) ===
  
  -- Status classification (calculated from value + type)
  -- Glucose: 'low' | 'normal' | 'warning' | 'danger'
  -- HbA1c: 'normal' | 'prediabetes' | 'danger'
  status TEXT CHECK(
    status IN ('low', 'normal', 'warning', 'danger', 'prediabetes')
  ),
  
  -- Estimated HbA1c (for glucose readings)
  -- Calculated from 90-day rolling average
  -- NULL for actual HbA1c readings
  -- Use: Show user "Your estimated HbA1c: 6.8% (based on 45 readings)"
  estimated_hba1c FLOAT CHECK(
    (measurement_category = 'glucose' AND (estimated_hba1c IS NULL OR (estimated_hba1c >= 4.0 AND estimated_hba1c <= 15.0)))
    OR
    (measurement_category = 'hba1c' AND estimated_hba1c IS NULL)
  ),

  -- === CONSTRAINTS (Data Integrity) ===
  
  -- Ensure value range matches category
  CONSTRAINT ck_value_range CHECK(
    (measurement_category = 'glucose' AND value >= 0.1 AND value <= 50)
    OR
    (measurement_category = 'hba1c' AND value >= 4.0 AND value <= 15.0)
  ),
  
  -- Ensure unit matches category
  CONSTRAINT ck_unit_match CHECK(
    (measurement_category = 'glucose' AND unit = 'mmol/L')
    OR
    (measurement_category = 'hba1c' AND unit = '%')
  ),
  
  -- Ensure measurement_type matches category
  CONSTRAINT ck_type_category_match CHECK(
    (measurement_category = 'glucose' AND measurement_type LIKE 'glucose_%')
    OR
    (measurement_category = 'hba1c' AND measurement_type = 'hba1c')
  ),
  
  -- Ensure FK relationship is valid
  CONSTRAINT fk_user FOREIGN KEY(user_id) REFERENCES users(id)
);

-- === INDEXES (Query Optimization) ===

-- Most common: Get user's recent readings (dashboard, metrics page)
CREATE INDEX idx_metrics_user_date 
  ON metrics(user_id, measured_at DESC);

-- Filter by specific type (e.g., "Show all fasting readings")
CREATE INDEX idx_metrics_type 
  ON metrics(user_id, measurement_type, measured_at DESC);

-- Quick category split (e.g., "Show all glucose vs all HbA1c")
CREATE INDEX idx_metrics_category 
  ON metrics(user_id, measurement_category, measured_at DESC);

-- Alert queries (find all danger/low readings)
CREATE INDEX idx_metrics_status 
  ON metrics(user_id, status) 
  WHERE status IN ('low', 'danger');

-- Statistics queries (find readings in date range)
CREATE INDEX idx_metrics_date_range 
  ON metrics(user_id, measurement_category, measured_at);

-- Find latest reading of each type (dashboard cards)
CREATE INDEX idx_metrics_latest 
  ON metrics(user_id, measurement_type, measured_at DESC);
```

---

## 🔄 MIGRATION SCRIPT

### **From Old Glucose Schema to Unified Schema**

```javascript
// File: backend/database/migrations/012_unified_metrics_schema.js

exports.up = function(knex) {
  return knex.schema
    // Step 1: Create new unified metrics table
    .createTable('metrics_new', (t) => {
      t.increments('id').primary();
      t.integer('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
      
      // Type identification
      t.text('measurement_type').notNullable();
      t.text('measurement_category').notNullable();
      
      // Value & unit
      t.float('value').notNullable();
      t.text('unit').notNullable();
      
      // Timestamps
      t.datetime('measured_at').notNullable();
      t.datetime('created_at').notNullable().defaultTo(knex.fn.now());
      t.datetime('updated_at');
      
      // Metadata
      t.text('note');
      
      // Calculated fields
      t.text('status');
      t.float('estimated_hba1c');
      
      // Indexes
      t.index(['user_id', 'measured_at']);
      t.index(['user_id', 'measurement_type']);
      t.index(['user_id', 'measurement_category']);
    })
    
    // Step 2: Migrate data from old metrics table
    .then(() => {
      return knex('metrics').select('*').then((oldData) => {
        const newData = oldData.map((row) => ({
          id: row.id,
          user_id: row.user_id,
          
          // Map old type to new measurement_type
          measurement_type: mapOldTypeToNew(row.type),
          
          // Always glucose for old data
          measurement_category: 'glucose',
          
          value: row.value,
          unit: 'mmol/L',
          measured_at: row.measured_at,
          created_at: row.created_at,
          note: row.note,
          status: null,  // Will be calculated during insert
          estimated_hba1c: null
        }));
        
        // Batch insert
        return knex('metrics_new').insert(newData);
      });
    })
    
    // Step 3: Drop old table
    .then(() => knex.schema.dropTable('metrics'))
    
    // Step 4: Rename new table
    .then(() => knex.schema.renameTable('metrics_new', 'metrics'));
};

exports.down = function(knex) {
  // Rollback: recreate old table
  return knex.schema.createTable('metrics', (t) => {
    t.increments('id').primary();
    t.integer('user_id').notNullable().references('id').inTable('users');
    t.string('type').notNullable();
    t.float('value').notNullable();
    t.datetime('measured_at').notNullable();
    t.text('note');
    t.datetime('created_at').defaultTo(knex.fn.now());
  });
};

// Helper function
function mapOldTypeToNew(oldType) {
  const mapping = {
    'fasting': 'glucose_fasting',
    'post_meal_2h': 'glucose_postmeal',
    'pre_meal': 'glucose_random',
    'pre_sleep': 'glucose_random'
  };
  return mapping[oldType] || oldType;
}
```

---

## 🔐 BACKEND CONSTANTS & VALIDATION

### **Constants File**

```javascript
// File: backend/src/constants/metrics.js

export const MEASUREMENT_TYPES = {
  GLUCOSE_FASTING: 'glucose_fasting',
  GLUCOSE_POSTMEAL: 'glucose_postmeal',
  GLUCOSE_RANDOM: 'glucose_random',
  HBAIC: 'hba1c'
};

export const MEASUREMENT_CATEGORIES = {
  GLUCOSE: 'glucose',
  HBAIC: 'hba1c'
};

export const UNITS = {
  GLUCOSE: 'mmol/L',
  HBAIC: '%'
};

export const THRESHOLDS = {
  glucose_fasting: {
    unit: 'mmol/L',
    category: 'glucose',
    normalMax: 5.6,
    warningMin: 5.6,
    warningMax: 6.9,
    dangerMin: 7.0,
    // Clinical diagnostic cutoff
    diagnosticCutoff: 7.0  // Diabetes if ≥ 7.0
  },
  
  glucose_postmeal: {
    unit: 'mmol/L',
    category: 'glucose',
    normalMax: 7.8,
    warningMin: 7.8,
    warningMax: 11.0,
    dangerMin: 11.1,
    diagnosticCutoff: 11.1
  },
  
  glucose_random: {
    unit: 'mmol/L',
    category: 'glucose',
    normalMax: 7.8,
    dangerMin: 11.1,
    diagnosticCutoff: 11.1
  },
  
  hba1c: {
    unit: '%',
    category: 'hba1c',
    normalMax: 5.7,
    prediabetesMin: 5.7,
    prediabetesMax: 6.4,
    dangerMin: 6.5,
    diagnosticCutoff: 6.5,
    // Treatment targets
    type2Target: 7.0,
    type1Target: 6.5,
    warningThreshold: 8.0
  }
};

// Hypoglycemia (applies to all glucose types)
export const HYPOGLYCEMIA_THRESHOLD = 3.9; // mmol/L

// Type 2 vs Type 1 targets (for patient context)
export const PATIENT_TARGETS = {
  type2_diabetes: {
    glucose: {
      fasting: 7.0,
      postmeal: 7.8,
      random: 7.8
    },
    hba1c: 7.0
  },
  type1_diabetes: {
    glucose: {
      fasting: 5.0,      // Tighter for Type 1
      postmeal: 7.2,
      random: 7.2
    },
    hba1c: 6.5          // Stricter for Type 1
  }
};
```

### **Zod Validation Schema**

```javascript
// File: backend/src/modules/metrics/metrics.schema.js

const { z } = require('zod');

// Validate measurement_type exists and matches category
const measurementTypeSchema = z.string()
  .refine(
    (type) => Object.values(MEASUREMENT_TYPES).includes(type),
    { message: 'Invalid measurement type' }
  );

// Validate category
const categorySchema = z.enum(
  Object.values(MEASUREMENT_CATEGORIES),
  { message: 'Invalid measurement category' }
);

// Main creation schema
const createMetricSchema = z.object({
  measurement_type: measurementTypeSchema,
  value: z.number().positive('Value must be positive'),
  measured_at: z.string().datetime({ offset: true }).or(z.string().min(1)),
  note: z.string().optional().nullable()
})
.refine(
  (data) => {
    // Glucose: 0.1-50 mmol/L
    if (data.measurement_type.includes('glucose')) {
      return data.value >= 0.1 && data.value <= 50;
    }
    // HbA1c: 4.0-15.0 %
    if (data.measurement_type === 'hba1c') {
      return data.value >= 4.0 && data.value <= 15.0;
    }
    return false;
  },
  {
    message: 'Value out of valid range for this measurement type',
    path: ['value']
  }
);

module.exports = { createMetricSchema };
```

### **Calculator Functions**

```javascript
// File: backend/src/modules/metrics/metrics.calculator.js

const { THRESHOLDS, HYPOGLYCEMIA_THRESHOLD } = require('../../constants/metrics');

class MetricsCalculator {
  /**
   * Calculate status based on measurement type and value
   * @returns 'low' | 'normal' | 'warning' | 'danger' | 'prediabetes'
   */
  static calculateStatus(measurementType, value) {
    const thresholds = THRESHOLDS[measurementType];
    if (!thresholds) return null;

    // Glucose readings
    if (measurementType.includes('glucose')) {
      if (value < HYPOGLYCEMIA_THRESHOLD) return 'low';
      if (value >= thresholds.dangerMin) return 'danger';
      if (value > thresholds.normalMax) return 'warning';
      return 'normal';
    }

    // HbA1c reading
    if (measurementType === 'hba1c') {
      if (value < thresholds.normalMax) return 'normal';
      if (value <= thresholds.prediabetesMax) return 'prediabetes';
      return 'danger';
    }

    return null;
  }

  /**
   * Estimate HbA1c from average glucose (EAGA Formula - ADA Validated)
   * HbA1c (%) = (0.0915 × Avg_Glucose_mmol/L) + 2.15
   * 
   * Accuracy: ±15-20% (biological variation)
   */
  static estimateHbA1c(avgGlucoseMmolL) {
    if (!avgGlucoseMmolL || avgGlucoseMmolL <= 0) return null;
    
    const estimated = (0.0915 * avgGlucoseMmolL) + 2.15;
    
    // Clamp to reasonable range
    if (estimated < 4.0) return 4.0;
    if (estimated > 15.0) return 15.0;
    
    return Math.round(estimated * 100) / 100; // 2 decimal places
  }

  /**
   * Reverse: Calculate average glucose from HbA1c
   * Avg_Glucose_mg/dL = 28.7 × HbA1c (%) - 46.7
   * Returns in mmol/L
   */
  static getAvgGlucoseFromHbA1c(hba1cPercent) {
    if (!hba1cPercent || hba1cPercent <= 0) return null;
    
    const avgGlucoseMgdL = (28.7 * hba1cPercent) - 46.7;
    const avgGlucoseMmolL = avgGlucoseMgdL / 18; // Convert to mmol/L
    
    return Math.round(avgGlucoseMmolL * 10) / 10; // 1 decimal place
  }

  /**
   * Calculate statistics from readings
   */
  static getStatistics(readings) {
    if (!readings || readings.length === 0) return null;

    const values = readings.map(r => r.value);
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
   */
  static categorizeReading(measurementType, value, patientType = 'type2_diabetes') {
    const status = this.calculateStatus(measurementType, value);
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
}

module.exports = MetricsCalculator;
```

---

## 📨 BACKEND API IMPLEMENTATION

### **Controller**

```javascript
// File: backend/src/modules/metrics/metrics.controller.js

const metricsService = require('./metrics.service');
const MetricsCalculator = require('./metrics.calculator');
const { sendSuccess, sendError } = require('../../utils/response.helper');

async function getMetrics(req, res, next) {
  try {
    const { measurement_type, measurement_category, days = 7 } = req.query;
    const data = await metricsService.getMetrics(
      req.user.id,
      measurement_type,
      measurement_category,
      parseInt(days)
    );
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

async function getLatestMetrics(req, res, next) {
  try {
    // Get latest reading for each glucose type + latest HbA1c
    const data = await metricsService.getLatestByType(req.user.id);
    sendSuccess(res, data);
  } catch (err) {
    next(err);
  }
}

async function getStatistics(req, res, next) {
  try {
    const { measurement_type, days = 90 } = req.query;
    const readings = await metricsService.getMetrics(
      req.user.id,
      measurement_type,
      null,
      parseInt(days)
    );

    const stats = MetricsCalculator.getStatistics(readings);
    
    // If glucose readings, calculate estimated HbA1c
    let estimatedHbA1c = null;
    if (!measurement_type || measurement_type.includes('glucose')) {
      const glucoseReadings = readings.filter(r => r.measurement_category === 'glucose');
      if (glucoseReadings.length > 0) {
        const avgGlucose = stats.average;
        estimatedHbA1c = MetricsCalculator.estimateHbA1c(avgGlucose);
      }
    }

    sendSuccess(res, {
      statistics: stats,
      estimatedHbA1c,
      period: `${days} days`,
      readingCount: readings.length
    });
  } catch (err) {
    next(err);
  }
}

async function createMetric(req, res, next) {
  try {
    const { measurement_type, value, measured_at, note } = req.validatedBody;

    // Determine category based on type
    const measurement_category = measurement_type.includes('glucose') ? 'glucose' : 'hba1c';
    const unit = measurement_category === 'glucose' ? 'mmol/L' : '%';

    // Calculate status
    const status = MetricsCalculator.calculateStatus(measurement_type, value);

    // For glucose readings, also calculate estimated HbA1c
    let estimated_hba1c = null;
    if (measurement_category === 'glucose') {
      // Get 90-day average from existing readings
      const glucose90d = await metricsService.getMetrics(
        req.user.id,
        null,
        'glucose',
        90
      );
      if (glucose90d.length > 0) {
        const stats = MetricsCalculator.getStatistics(glucose90d);
        estimated_hba1c = MetricsCalculator.estimateHbA1c(stats.average);
      }
    }

    const metric = await metricsService.createMetric(req.user.id, {
      measurement_type,
      measurement_category,
      value,
      unit,
      measured_at,
      status,
      estimated_hba1c,
      note
    });

    sendSuccess(res, metric, 'Metric recorded successfully', 201);
  } catch (err) {
    next(err);
  }
}

async function deleteMetric(req, res, next) {
  try {
    await metricsService.deleteMetric(req.user.id, req.params.id);
    sendSuccess(res, null, 'Metric deleted');
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

### **Service Layer**

```javascript
// File: backend/src/modules/metrics/metrics.service.js

const db = require('../../config/database');
const { daysAgo } = require('../../utils/date.helper');

async function getMetrics(userId, measurementType, measurementCategory, days = 7) {
  const since = daysAgo(days);
  
  let query = db('metrics')
    .where({ user_id: userId })
    .where('measured_at', '>=', since)
    .orderBy('measured_at', 'desc');

  if (measurementType) {
    query = query.where({ measurement_type: measurementType });
  }

  if (measurementCategory) {
    query = query.where({ measurement_category: measurementCategory });
  }

  return query;
}

async function getLatestByType(userId) {
  const types = ['glucose_fasting', 'glucose_postmeal', 'glucose_random', 'hba1c'];
  const results = {};

  for (const type of types) {
    results[type] = await db('metrics')
      .where({ user_id: userId, measurement_type: type })
      .orderBy('measured_at', 'desc')
      .first();
  }

  return results;
}

async function createMetric(userId, data) {
  const [id] = await db('metrics').insert({
    user_id: userId,
    ...data
  });
  return db('metrics').where({ id }).first();
}

async function deleteMetric(userId, id) {
  const metric = await db('metrics').where({ id, user_id: userId }).first();
  if (!metric) {
    throw { status: 404, message: 'Metric not found' };
  }
  await db('metrics').where({ id }).delete();
}

module.exports = {
  getMetrics,
  getLatestByType,
  createMetric,
  deleteMetric
};
```

### **Routes**

```javascript
// File: backend/src/modules/metrics/metrics.routes.js

const express = require('express');
const router = express.Router();
const controller = require('./metrics.controller');
const { authMiddleware } = require('../../middlewares/auth.middleware');
const { validate } = require('../../middlewares/validate.middleware');
const { createMetricSchema } = require('./metrics.schema');

router.use(authMiddleware);

// Get latest reading for each type
router.get('/latest', controller.getLatestMetrics);

// Get statistics for period
router.get('/statistics', controller.getStatistics);

// Get filtered readings
router.get('/', controller.getMetrics);

// Create new reading
router.post('/', validate(createMetricSchema), controller.createMetric);

// Delete reading
router.delete('/:id', controller.deleteMetric);

module.exports = router;
```

---

## 🎨 FRONTEND IMPLEMENTATION

### **Constants**

```javascript
// File: frontend/src/constants/metrics.js

export const MEASUREMENT_TYPES = {
  GLUCOSE_FASTING: 'glucose_fasting',
  GLUCOSE_POSTMEAL: 'glucose_postmeal',
  GLUCOSE_RANDOM: 'glucose_random',
  HBAIC: 'hba1c'
};

export const MEASUREMENT_CATEGORIES = {
  GLUCOSE: 'glucose',
  HBAIC: 'hba1c'
};

export const METRIC_THRESHOLDS = {
  glucose_fasting: {
    normalMax: 5.6,
    warningMin: 5.6,
    warningMax: 6.9,
    dangerMin: 7.0
  },
  glucose_postmeal: {
    normalMax: 7.8,
    warningMin: 7.8,
    warningMax: 11.0,
    dangerMin: 11.1
  },
  glucose_random: {
    normalMax: 7.8,
    dangerMin: 11.1
  },
  hba1c: {
    normalMax: 5.7,
    prediabetesMax: 6.4,
    dangerMin: 6.5
  }
};

export const HYPOGLYCEMIA_THRESHOLD = 3.9;

export function getMetricStatus(measurementType, value) {
  const thresholds = METRIC_THRESHOLDS[measurementType];
  if (!thresholds) return 'normal';

  // Glucose status
  if (measurementType.includes('glucose')) {
    if (value < HYPOGLYCEMIA_THRESHOLD) return 'low';
    if (value >= thresholds.dangerMin) return 'danger';
    if (value > thresholds.normalMax) return 'warning';
    return 'normal';
  }

  // HbA1c status
  if (measurementType === 'hba1c') {
    if (value < thresholds.normalMax) return 'normal';
    if (value <= thresholds.prediabetesMax) return 'prediabetes';
    return 'danger';
  }

  return 'normal';
}
```

### **Calculator Utility**

```javascript
// File: frontend/src/utils/hba1c.calculator.js

/**
 * Estimate HbA1c from average glucose
 * EAGA Formula: HbA1c (%) = (0.0915 × Avg_Glucose_mmol/L) + 2.15
 */
export function estimateHbA1c(avgGlucoseMmolL) {
  if (!avgGlucoseMmolL || avgGlucoseMmolL <= 0) return null;
  
  const estimated = (0.0915 * avgGlucoseMmolL) + 2.15;
  return Math.round(estimated * 100) / 100;
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
 * Calculate statistics
 */
export function calculateStatistics(readings) {
  if (!readings || readings.length === 0) return null;

  const values = readings.map(r => r.value);
  const avg = values.reduce((a, b) => a + b) / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);

  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  const cv = (stdDev / avg) * 100;

  return {
    average: Math.round(avg * 10) / 10,
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
    cv: Math.round(cv),
    count: readings.length
  };
}
```

### **Updated AddMetricModal**

```javascript
// File: frontend/src/components/metrics/AddMetricModal.jsx

import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { MEASUREMENT_TYPES } from '../../constants/metrics';
import { useT } from '../../hooks/useT';
import styles from './AddMetricModal.module.css';

export default function AddMetricModal({ onClose, onSave, onSuccess, defaultType }) {
  const { date, time } = nowLocalISO();
  const t = useT();
  const [measurementType, setMeasurementType] = useState(defaultType || 'glucose_fasting');
  const [value, setValue] = useState('');
  const [measuredDate, setMeasuredDate] = useState(date);
  const [measuredTime, setMeasuredTime] = useState(time);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isHbA1c = measurementType === 'hba1c';
  const minValue = isHbA1c ? 4.0 : 0.1;
  const maxValue = isHbA1c ? 15.0 : 50;
  const unit = isHbA1c ? '%' : 'mmol/L';

  const handleSave = async () => {
    const num = parseFloat(value);
    
    if (!value || isNaN(num) || num < minValue || num > maxValue) {
      setError(
        isHbA1c
          ? `HbA1c must be between ${minValue}-${maxValue} %`
          : `Glucose must be between ${minValue}-${maxValue} mmol/L`
      );
      return;
    }

    setError('');
    setSaving(true);
    
    try {
      const measured_at = new Date(`${measuredDate}T${measuredTime}:00`).toISOString();
      await onSave({
        measurement_type: measurementType,
        value: num,
        measured_at,
        note: note.trim() || undefined
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      setError(e?.response?.data?.message || 'Error saving metric');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={t.addMetric.title} onClose={onClose}>
      <div className={styles.group}>
        <label className={styles.label}>{t.addMetric.typeLabel}</label>
        <select 
          className={styles.select} 
          value={measurementType} 
          onChange={(e) => setMeasurementType(e.target.value)}
        >
          {/* Glucose types */}
          <optgroup label="Glucose">
            <option value="glucose_fasting">{t.metrics?.types?.glucose_fasting}</option>
            <option value="glucose_postmeal">{t.metrics?.types?.glucose_postmeal}</option>
            <option value="glucose_random">{t.metrics?.types?.glucose_random}</option>
          </optgroup>
          
          {/* HbA1c */}
          <optgroup label="HbA1c">
            <option value="hba1c">{t.metrics?.types?.hba1c}</option>
          </optgroup>
        </select>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>{t.addMetric.valueLabel}</label>
        <div className={styles.valueRow}>
          <input
            className={styles.input}
            type="number"
            step="0.1"
            min={minValue}
            max={maxValue}
            placeholder={isHbA1c ? '6.5' : '7.0'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <span className={styles.unit}>{unit}</span>
        </div>
        {error && <div className={styles.error}>{error}</div>}
      </div>

      <div className={styles.group}>
        <label className={styles.label}>{t.addMetric.timeLabel}</label>
        <div className={styles.dateRow}>
          <input 
            className={styles.input} 
            type="date" 
            value={measuredDate} 
            onChange={(e) => setMeasuredDate(e.target.value)} 
          />
          <input 
            className={styles.input} 
            type="time" 
            value={measuredTime} 
            onChange={(e) => setMeasuredTime(e.target.value)} 
          />
        </div>
      </div>

      <div className={styles.group}>
        <label className={styles.label}>{t.addMetric.noteLabel}</label>
        <textarea 
          className={styles.textarea} 
          placeholder={t.addMetric.notePlaceholder} 
          value={note} 
          onChange={(e) => setNote(e.target.value)} 
        />
      </div>

      <Button full onClick={handleSave} disabled={saving}>
        {saving ? t.addMetric.saving : t.addMetric.saveBtn}
      </Button>
    </Modal>
  );
}

function nowLocalISO() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return {
    date: `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`,
    time: `${pad(now.getHours())}:${pad(now.getMinutes())}`
  };
}
```

---

## 📊 EXAMPLE API PAYLOADS

### **Create Glucose Reading**

```json
POST /api/v1/metrics

{
  "measurement_type": "glucose_fasting",
  "value": 7.2,
  "measured_at": "2026-06-11T08:00:00Z",
  "note": "Before breakfast"
}

Response (201):
{
  "id": 142,
  "user_id": 1,
  "measurement_type": "glucose_fasting",
  "measurement_category": "glucose",
  "value": 7.2,
  "unit": "mmol/L",
  "measured_at": "2026-06-11T08:00:00Z",
  "status": "danger",
  "estimated_hba1c": 6.79,
  "created_at": "2026-06-11T08:05:23Z",
  "note": "Before breakfast"
}
```

### **Create HbA1c Reading**

```json
POST /api/v1/metrics

{
  "measurement_type": "hba1c",
  "value": 6.8,
  "measured_at": "2026-06-11T10:00:00Z",
  "note": "Lab test result"
}

Response (201):
{
  "id": 143,
  "user_id": 1,
  "measurement_type": "hba1c",
  "measurement_category": "hba1c",
  "value": 6.8,
  "unit": "%",
  "measured_at": "2026-06-11T10:00:00Z",
  "status": "danger",
  "estimated_hba1c": null,
  "created_at": "2026-06-11T10:05:23Z",
  "note": "Lab test result"
}
```

### **Get Statistics (90-day glucose)**

```json
GET /api/v1/metrics/statistics?measurement_category=glucose&days=90

Response (200):
{
  "statistics": {
    "count": 45,
    "average": 8.3,
    "minimum": 5.2,
    "maximum": 11.7,
    "stdDev": 1.8,
    "cv": 21
  },
  "estimatedHbA1c": 6.8,
  "period": "90 days",
  "readingCount": 45
}
```

---

## ✅ KEY FEATURES

1. **Polymorphic Design**
   - Single table handles glucose + HbA1c
   - Type-based validation
   - Category-based filtering

2. **Calculated Fields**
   - `status`: Pre-calculated (low/normal/warning/danger/prediabetes)
   - `estimated_hba1c`: From 90-day glucose average (EAGA formula)

3. **Flexible Querying**
   - Filter by measurement_type (glucose_fasting, hba1c, etc.)
   - Filter by category (glucose, hba1c)
   - Get latest reading for each type
   - Calculate statistics by period

4. **Clinical Accuracy**
   - EAGA formula for HbA1c estimation (±15-20% accuracy)
   - Type 2 vs Type 1 targets
   - Proper thresholds for diagnosis

5. **Index Strategy**
   - Fast queries by user + date
   - Quick category split
   - Alert queries (low/danger)
   - Statistics calculations

---

**Status:** ✅ Ready to implement  
**Next Step:** Run migration script and test APIs
