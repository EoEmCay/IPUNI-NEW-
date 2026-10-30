# 💾 UNIFIED METRICS SCHEMA DESIGN

**Objective:** Store Glucose & HbA1c in a single `metrics` table with optimal querying & validation

**Date:** 2026-06-11  
**Status:** Ready for Implementation

---

## 📋 MỤC LỤC

1. [Schema Design Options](#schema-design-options)
2. [Recommended Schema](#recommended-schema)
3. [Data Types & Validation](#data-types--validation)
4. [Index Strategy](#index-strategy)
5. [Migration Script](#migration-script)
6. [Query Examples](#query-examples)
7. [Application Layer](#application-layer)

---

## 🏗️ SCHEMA DESIGN OPTIONS

### **Option 1: Minimal (Simple but Less Flexible)**

```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,  -- 'fasting' | 'postmeal' | 'random' | 'hba1c'
  value FLOAT NOT NULL,
  unit TEXT NOT NULL,  -- 'mmol/L' | '%'
  measured_at DATETIME NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Pros:** Simple, small footprint  
**Cons:** No validation logic in DB, harder to query by category

---

### **Option 2: With Category & Status (Recommended ⭐)**

```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  
  -- Type identification
  measurement_type TEXT NOT NULL,  
    -- 'glucose_fasting' | 'glucose_postmeal' | 'glucose_random' | 'hba1c'
  measurement_category TEXT NOT NULL,  
    -- 'glucose' | 'hba1c' (for quick filtering)
  
  -- Value & unit
  value FLOAT NOT NULL,
  unit TEXT NOT NULL,  
    -- 'mmol/L' for glucose, '%' for hba1c
  
  -- Timestamps
  measured_at DATETIME NOT NULL,
    -- When the measurement was actually taken
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Metadata
  note TEXT,
  
  -- Cached calculations (for performance)
  status TEXT,  
    -- For glucose: 'low' | 'normal' | 'warning' | 'danger'
    -- For hba1c: 'normal' | 'prediabetes' | 'danger'
  
  estimated_hba1c FLOAT,  
    -- Only for glucose readings (calculated from 90-day average)
    -- NULL for actual HbA1c readings
  
  -- Constraints
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT ck_value_range CHECK (
    (measurement_category = 'glucose' AND value > 0.1 AND value <= 50) OR
    (measurement_category = 'hba1c' AND value >= 4.0 AND value <= 15.0)
  ),
  CONSTRAINT ck_unit_match CHECK (
    (measurement_category = 'glucose' AND unit = 'mmol/L') OR
    (measurement_category = 'hba1c' AND unit = '%')
  ),
  CONSTRAINT ck_hba1c_null CHECK (
    (measurement_category = 'glucose' AND estimated_hba1c IS NULL) OR
    (measurement_category = 'hba1c' AND estimated_hba1c IS NOT NULL)
  )
);

-- Indexes for common queries
CREATE INDEX idx_metrics_user_date ON metrics(user_id, measured_at DESC);
CREATE INDEX idx_metrics_type ON metrics(user_id, measurement_type);
CREATE INDEX idx_metrics_category ON metrics(user_id, measurement_category);
CREATE INDEX idx_metrics_status ON metrics(user_id, status);
```

**Pros:** 
- ✅ Clear category separation
- ✅ DB-level validation
- ✅ Fast queries by type/category
- ✅ Performance optimization with caching
- ✅ Flexible for future extensions

**Cons:**
- More fields
- DB constraints require careful updates

---

### **Option 3: With Statistics Cache (Advanced)**

```sql
-- Core metrics table
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  measurement_type TEXT NOT NULL,
  measurement_category TEXT NOT NULL,
  value FLOAT NOT NULL,
  unit TEXT NOT NULL,
  measured_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  note TEXT,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Statistics cache (updated daily)
CREATE TABLE metric_statistics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  measurement_type TEXT NOT NULL,
  
  -- 7-day window
  avg_7d FLOAT,
  min_7d FLOAT,
  max_7d FLOAT,
  stddev_7d FLOAT,
  cv_7d FLOAT,
  estimated_hba1c_7d FLOAT,
  reading_count_7d INTEGER,
  
  -- 30-day window
  avg_30d FLOAT,
  min_30d FLOAT,
  max_30d FLOAT,
  stddev_30d FLOAT,
  cv_30d FLOAT,
  estimated_hba1c_30d FLOAT,
  reading_count_30d INTEGER,
  
  -- 90-day window (for HbA1c estimation)
  avg_90d FLOAT,
  min_90d FLOAT,
  max_90d FLOAT,
  stddev_90d FLOAT,
  cv_90d FLOAT,
  estimated_hba1c_90d FLOAT,
  reading_count_90d INTEGER,
  
  last_calculated DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id, measurement_type)
);
```

**Pros:**
- ✅ Ultra-fast statistics queries
- ✅ Pre-calculated HbA1c estimation
- ✅ Scalable for large datasets

**Cons:**
- More complex maintenance
- Requires scheduled updates

---

## ✅ RECOMMENDED SCHEMA

**Use Option 2** (with Category & Status) for IPUNI

### **Final Schema Specification**

```sql
CREATE TABLE metrics (
  -- Primary Key
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- User relationship
  user_id INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- === MEASUREMENT IDENTIFICATION ===
  
  -- measurement_type: specific glucose subtype or hba1c
  -- Values: 'glucose_fasting' | 'glucose_postmeal' | 'glucose_random' | 'hba1c'
  measurement_type TEXT NOT NULL,
  
  -- measurement_category: glucose or hba1c (for quick categorization)
  -- Values: 'glucose' | 'hba1c'
  measurement_category TEXT NOT NULL,
  
  -- === VALUE & UNIT ===
  
  -- Numeric value
  -- For glucose: 0.1-50 mmol/L
  -- For HbA1c: 4.0-15.0 %
  value FLOAT NOT NULL,
  
  -- Unit of measurement
  -- 'mmol/L' for glucose
  -- '%' for hba1c
  unit TEXT NOT NULL,
  
  -- === TIMESTAMPS ===
  
  -- When the measurement was actually taken
  measured_at DATETIME NOT NULL,
  
  -- When the record was created
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- For soft deletes or audit trails (optional)
  updated_at DATETIME,
  
  -- === METADATA ===
  
  -- User's notes about the reading
  -- E.g., "after heavy meal", "before exercise"
  note TEXT,
  
  -- === CALCULATED FIELDS (Cached) ===
  
  -- Status interpretation
  -- For glucose: 'low' | 'normal' | 'warning' | 'danger'
  -- For hba1c: 'normal' | 'prediabetes' | 'danger'
  -- Updated when new reading is created
  status TEXT,
  
  -- Estimated HbA1c from glucose readings
  -- Calculated from 90-day rolling average
  -- Only populated for glucose readings
  -- NULL for actual HbA1c readings
  estimated_hba1c FLOAT,
  
  -- === CONSTRAINTS ===
  
  -- Validate value range based on category
  CONSTRAINT ck_glucose_value_range CHECK (
    measurement_category = 'glucose' AND value >= 0.1 AND value <= 50
    OR
    measurement_category = 'hba1c' AND value >= 4.0 AND value <= 15.0
  ),
  
  -- Validate unit matches category
  CONSTRAINT ck_unit_match CHECK (
    (measurement_category = 'glucose' AND unit = 'mmol/L') OR
    (measurement_category = 'hba1c' AND unit = '%')
  ),
  
  -- Ensure measurement_type matches category
  CONSTRAINT ck_type_match CHECK (
    (measurement_category = 'glucose' AND measurement_type LIKE 'glucose_%') OR
    (measurement_category = 'hba1c' AND measurement_type = 'hba1c')
  )
);

-- === INDEXES ===

-- Most common query: user's recent readings
CREATE INDEX idx_metrics_user_date 
  ON metrics(user_id, measured_at DESC);

-- Query by specific type
CREATE INDEX idx_metrics_type 
  ON metrics(user_id, measurement_type, measured_at DESC);

-- Filter by category (glucose vs hba1c)
CREATE INDEX idx_metrics_category 
  ON metrics(user_id, measurement_category, measured_at DESC);

-- Filter by status (danger/low alerts)
CREATE INDEX idx_metrics_status 
  ON metrics(user_id, status) 
  WHERE status IN ('low', 'danger');

-- Find readings within date range (for statistics)
CREATE INDEX idx_metrics_date_range 
  ON metrics(user_id, measurement_category, measured_at);
```

---

## 🔐 DATA TYPES & VALIDATION

### **Column Specifications**

| Column | Type | Size | Nullable | Validation | Notes |
|--------|------|------|----------|-----------|-------|
| `id` | INTEGER | 4 bytes | NO | Primary Key | Auto-increment |
| `user_id` | INTEGER | 4 bytes | NO | Foreign Key | Must exist in users |
| `measurement_type` | TEXT | 20 bytes | NO | ENUM-like | Use check constraint |
| `measurement_category` | TEXT | 10 bytes | NO | IN ('glucose','hba1c') | Quick filter |
| `value` | FLOAT | 8 bytes | NO | 0.1-50 or 4-15 | Type-dependent |
| `unit` | TEXT | 10 bytes | NO | IN ('mmol/L','%') | Match category |
| `measured_at` | DATETIME | 8 bytes | NO | Valid date | When user took reading |
| `created_at` | DATETIME | 8 bytes | NO | Valid date | System timestamp |
| `note` | TEXT | Variable | YES | Max 500 chars | Optional metadata |
| `status` | TEXT | 15 bytes | YES | Enum-like | Cached calculation |
| `estimated_hba1c` | FLOAT | 8 bytes | YES | 4-15 | Null for actual HbA1c |

### **Validation Rules (Application Layer)**

```javascript
// File: backend/src/modules/metrics/metrics.validation.js

const validateMetricValue = (type, value) => {
  switch(type) {
    case 'glucose_fasting':
    case 'glucose_postmeal':
    case 'glucose_random':
      if (value < 0.1 || value > 50) {
        throw new Error('Glucose must be 0.1-50 mmol/L');
      }
      return true;
    
    case 'hba1c':
      if (value < 4.0 || value > 15.0) {
        throw new Error('HbA1c must be 4.0-15.0 %');
      }
      return true;
    
    default:
      throw new Error('Unknown measurement type');
  }
};

const getCategory = (type) => {
  if (type.startsWith('glucose_')) return 'glucose';
  if (type === 'hba1c') return 'hba1c';
  throw new Error('Invalid type');
};

const getUnit = (category) => {
  return category === 'glucose' ? 'mmol/L' : '%';
};
```

---

## 📊 INDEX STRATEGY

### **Why These Indexes?**

```
1. idx_metrics_user_date
   └─ Most common query: "Get user's recent readings"
   └─ Covers: WHERE user_id = ? ORDER BY measured_at DESC

2. idx_metrics_type  
   └─ Filter by specific type: "Get user's fasting readings from last 30 days"
   └─ Covers: WHERE user_id = ? AND measurement_type = ? ORDER BY measured_at

3. idx_metrics_category
   └─ Quick category split: "Get all glucose vs HbA1c"
   └─ Covers: WHERE user_id = ? AND measurement_category = 'glucose'

4. idx_metrics_status
   └─ Alert queries: "Get all danger/low readings"
   └─ Partial index (FILTERED) = smaller, faster
   └─ Covers: WHERE user_id = ? AND status IN ('low', 'danger')

5. idx_metrics_date_range
   └─ Statistics calculation: "Average glucose in last 90 days"
   └─ Covers: WHERE user_id = ? AND measured_at BETWEEN ? AND ?
```

### **Index Maintenance**

```sql
-- View index usage
EXPLAIN QUERY PLAN SELECT * FROM metrics 
WHERE user_id = 1 AND measured_at >= datetime('now', '-7 days');

-- Rebuild indexes if fragmented (monthly)
REINDEX idx_metrics_user_date;

-- Analyze table for query optimization (weekly)
ANALYZE metrics;
```

---

## 🔄 MIGRATION SCRIPT

### **From Old Schema to New**

```sql
-- Step 1: Backup old data
CREATE TABLE metrics_backup AS SELECT * FROM metrics;

-- Step 2: Create new table with proper schema
CREATE TABLE metrics_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  measurement_type TEXT NOT NULL,
  measurement_category TEXT NOT NULL,
  value FLOAT NOT NULL,
  unit TEXT NOT NULL,
  measured_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT,
  status TEXT,
  estimated_hba1c FLOAT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT ck_glucose_value_range CHECK (
    (measurement_category = 'glucose' AND value >= 0.1 AND value <= 50) OR
    (measurement_category = 'hba1c' AND value >= 4.0 AND value <= 15.0)
  ),
  CONSTRAINT ck_unit_match CHECK (
    (measurement_category = 'glucose' AND unit = 'mmol/L') OR
    (measurement_category = 'hba1c' AND unit = '%')
  )
);

-- Step 3: Migrate data from old schema
INSERT INTO metrics_new (
  id, 
  user_id, 
  measurement_type, 
  measurement_category, 
  value, 
  unit, 
  measured_at, 
  created_at, 
  note
)
SELECT 
  id,
  user_id,
  -- Map old type to new type
  CASE 
    WHEN type = 'fasting' THEN 'glucose_fasting'
    WHEN type = 'post_meal_2h' THEN 'glucose_postmeal'
    WHEN type = 'pre_meal' THEN 'glucose_random'
    WHEN type = 'pre_sleep' THEN 'glucose_random'
    WHEN type = 'hba1c' THEN 'hba1c'
  END as measurement_type,
  -- Add category
  CASE
    WHEN type IN ('fasting', 'post_meal_2h', 'pre_meal', 'pre_sleep') THEN 'glucose'
    WHEN type = 'hba1c' THEN 'hba1c'
  END as measurement_category,
  value,
  unit,
  measured_at,
  created_at,
  note
FROM metrics;

-- Step 4: Drop old table and rename
DROP TABLE metrics;
ALTER TABLE metrics_new RENAME TO metrics;

-- Step 5: Create indexes
CREATE INDEX idx_metrics_user_date ON metrics(user_id, measured_at DESC);
CREATE INDEX idx_metrics_type ON metrics(user_id, measurement_type, measured_at DESC);
CREATE INDEX idx_metrics_category ON metrics(user_id, measurement_category, measured_at DESC);
CREATE INDEX idx_metrics_status ON metrics(user_id, status) WHERE status IN ('low', 'danger');
CREATE INDEX idx_metrics_date_range ON metrics(user_id, measurement_category, measured_at);

-- Step 6: Verify migration
SELECT COUNT(*) as total_readings,
       COUNT(CASE WHEN measurement_category = 'glucose' THEN 1 END) as glucose_count,
       COUNT(CASE WHEN measurement_category = 'hba1c' THEN 1 END) as hba1c_count
FROM metrics;
```

---

## 🔍 QUERY EXAMPLES

### **Get Latest Reading for Each Type**

```sql
SELECT 
  measurement_type,
  value,
  unit,
  measured_at,
  status,
  estimated_hba1c,
  note
FROM metrics
WHERE user_id = 1 
  AND id IN (
    SELECT MAX(id) 
    FROM metrics 
    WHERE user_id = 1 
    GROUP BY measurement_type
  )
ORDER BY measurement_type;
```

**Result Example:**
```
| measurement_type   | value | unit   | measured_at         | status  | estimated_hba1c |
|--------------------|-------|--------|---------------------|---------|-----------------|
| glucose_fasting    | 7.2   | mmol/L | 2026-06-11 08:00:00 | normal  | 6.8             |
| glucose_postmeal   | 8.5   | mmol/L | 2026-06-10 14:30:00 | warning | 6.9             |
| glucose_random     | 9.1   | mmol/L | 2026-06-09 16:00:00 | warning | 7.1             |
| hba1c              | 6.8   | %      | 2026-05-11 10:00:00 | normal  | NULL            |
```

---

### **Get 7-Day Statistics by Type**

```sql
WITH glucose_readings AS (
  SELECT 
    measurement_type,
    value,
    measured_at
  FROM metrics
  WHERE user_id = 1 
    AND measurement_category = 'glucose'
    AND measured_at >= datetime('now', '-7 days')
)
SELECT 
  measurement_type,
  COUNT(*) as reading_count,
  ROUND(AVG(value), 1) as average,
  ROUND(MIN(value), 1) as minimum,
  ROUND(MAX(value), 1) as maximum,
  ROUND(
    SQRT(SUM((value - (SELECT AVG(value) FROM glucose_readings g2 WHERE g2.measurement_type = glucose_readings.measurement_type)) * 
             (value - (SELECT AVG(value) FROM glucose_readings g2 WHERE g2.measurement_type = glucose_readings.measurement_type))) / COUNT(*)),
    2
  ) as std_deviation
FROM glucose_readings
GROUP BY measurement_type
ORDER BY measurement_type;
```

---

### **Alert: Get Danger/Low Readings**

```sql
SELECT 
  id,
  measurement_type,
  value,
  unit,
  status,
  measured_at,
  note
FROM metrics
WHERE user_id = 1 
  AND status IN ('low', 'danger')
ORDER BY measured_at DESC
LIMIT 20;
```

---

### **Calculate Estimated HbA1c from 90-Day Average**

```sql
WITH glucose_avg_90d AS (
  SELECT 
    ROUND(AVG(value), 1) as avg_glucose_90d,
    COUNT(*) as reading_count
  FROM metrics
  WHERE user_id = 1 
    AND measurement_category = 'glucose'
    AND measured_at >= datetime('now', '-90 days')
)
SELECT 
  avg_glucose_90d,
  reading_count,
  ROUND((0.0915 * avg_glucose_90d) + 2.15, 2) as estimated_hba1c_percent,
  CASE 
    WHEN (0.0915 * avg_glucose_90d) + 2.15 < 5.7 THEN 'normal'
    WHEN (0.0915 * avg_glucose_90d) + 2.15 <= 6.4 THEN 'prediabetes'
    ELSE 'diabetes'
  END as estimated_status
FROM glucose_avg_90d;
```

---

### **Compare Actual vs Estimated HbA1c**

```sql
WITH latest_hba1c AS (
  SELECT value as actual_hba1c, measured_at
  FROM metrics
  WHERE user_id = 1 AND measurement_type = 'hba1c'
  ORDER BY measured_at DESC
  LIMIT 1
),
glucose_avg_90d AS (
  SELECT 
    AVG(value) as avg_glucose,
    COUNT(*) as reading_count
  FROM metrics
  WHERE user_id = 1 
    AND measurement_category = 'glucose'
    AND measured_at >= datetime('now', '-90 days')
)
SELECT 
  (SELECT actual_hba1c FROM latest_hba1c) as actual_hba1c_percent,
  ROUND((0.0915 * (SELECT avg_glucose FROM glucose_avg_90d)) + 2.15, 2) as estimated_hba1c_percent,
  ROUND(
    ABS((SELECT actual_hba1c FROM latest_hba1c) - 
        ((0.0915 * (SELECT avg_glucose FROM glucose_avg_90d)) + 2.15)),
    2
  ) as difference,
  (SELECT reading_count FROM glucose_avg_90d) as readings_used;
```

---

### **Get Readings by Date Range**

```sql
SELECT 
  measurement_type,
  value,
  unit,
  measured_at,
  status,
  note
FROM metrics
WHERE user_id = 1 
  AND measured_at BETWEEN 
      datetime('2026-06-01') AND datetime('2026-06-11 23:59:59')
ORDER BY measured_at DESC;
```

---

## 💻 APPLICATION LAYER

### **Backend Constants**

```javascript
// File: backend/src/constants/metrics.js

export const MEASUREMENT_TYPES = {
  GLUCOSE_FASTING: 'glucose_fasting',
  GLUCOSE_POSTMEAL: 'glucose_postmeal',
  GLUCOSE_RANDOM: 'glucose_random',
  HБА1C: 'hba1c'
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
    normalMax: 5.6,
    warningMin: 5.6,
    warningMax: 6.9,
    dangerMin: 7.0,
    unit: 'mmol/L'
  },
  glucose_postmeal: {
    normalMax: 7.8,
    warningMin: 7.8,
    warningMax: 11.0,
    dangerMin: 11.1,
    unit: 'mmol/L'
  },
  glucose_random: {
    normalMax: 7.8,
    dangerMin: 11.1,
    unit: 'mmol/L'
  },
  hba1c: {
    normalMax: 5.7,
    prediabetesMin: 5.7,
    prediabetesMax: 6.4,
    dangerMin: 6.5,
    type2Target: 7.0,
    type1Target: 6.5,
    unit: '%'
  }
};

export const HYPOGLYCEMIA_THRESHOLD = 3.9; // mmol/L - applies to all glucose types
```

### **Status Calculation Function**

```javascript
// File: backend/src/utils/metric.calculator.js

export function calculateStatus(type, value) {
  const thresholds = THRESHOLDS[type];
  
  if (!thresholds) return null;

  if (type === 'hba1c') {
    if (value < 5.7) return 'normal';
    if (value <= 6.4) return 'prediabetes';
    return 'danger';
  }

  // Glucose types
  if (value < HYPOGLYCEMIA_THRESHOLD) return 'low';
  if (value >= thresholds.dangerMin) return 'danger';
  if (value > thresholds.normalMax) return 'warning';
  return 'normal';
}

export function estimateHbA1c(avgGlucoseMmolL) {
  // EAGA Formula: HbA1c = (0.0915 × Avg glucose) + 2.15
  return (0.0915 * avgGlucoseMmolL) + 2.15;
}
```

### **Example API Request/Response**

```javascript
// POST /api/v1/metrics

REQUEST:
{
  "measurement_type": "glucose_fasting",
  "value": 7.2,
  "measured_at": "2026-06-11T08:00:00Z",
  "note": "Before breakfast"
}

RESPONSE (201):
{
  "id": 142,
  "user_id": 1,
  "measurement_type": "glucose_fasting",
  "measurement_category": "glucose",
  "value": 7.2,
  "unit": "mmol/L",
  "measured_at": "2026-06-11T08:00:00Z",
  "created_at": "2026-06-11T08:05:23Z",
  "note": "Before breakfast",
  "status": "danger",
  "estimated_hba1c": 6.79,
  "message": "Glucose reading saved"
}
```

---

## 📊 SUMMARY TABLE

### **What Goes Where**

| Data | Table | Column | Notes |
|------|-------|--------|-------|
| Glucose readings | metrics | value, unit='mmol/L' | Store raw value |
| Glucose type | metrics | measurement_type='glucose_*' | Fasting, postmeal, random |
| HbA1c readings | metrics | value, unit='%' | Store HbA1c percentage |
| HbA1c type | metrics | measurement_type='hba1c' | Quarterly check |
| Calculated status | metrics | status | low/normal/warning/danger |
| Estimated HbA1c | metrics | estimated_hba1c | From 90-day glucose avg |
| User notes | metrics | note | Optional metadata |
| Reading timestamp | metrics | measured_at | When user took reading |

---

**Document Status:** Ready for Implementation  
**Next Step:** Create migration script & deploy to backend
