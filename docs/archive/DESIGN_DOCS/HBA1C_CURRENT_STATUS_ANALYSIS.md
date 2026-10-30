# 📊 HbA1c - CURRENT STATUS ANALYSIS IN IPUNI

**Analysis Date:** 2026-06-11  
**Project:** IPUNI (Diabetes Management PWA)

---

## 🔍 EXECUTIVE SUMMARY

### **Current Status: ❌ NOT IMPLEMENTED**

**HbA1c DOES NOT exist in the current codebase.**

- ✅ **Glucose tracking:** FULLY IMPLEMENTED (4 types)
- ❌ **HbA1c tracking:** NOT IMPLEMENTED
- 📋 **HbA1c in plans:** Mentioned in Pro Plan roadmap only (line 454 in CLAUDE.md)

---

## 📍 WHERE HbA1c IS MENTIONED

### 1. **CLAUDE.md - Pro Plan Features (Line 454)**

```markdown
## 16. Hệ Thống 2 Plan (Pricing)

### Pro Plan (49.000đ/tháng)
- ✅ Biểu đồ HbA1c & xu hướng  ← HERE (Future feature, not implemented)
```

**Context:** Listed as Premium feature to differentiate Free vs Pro plans

### 2. **Research Documents (Created Today)**

- `HBA1C_DETAILED_RESEARCH.md` (New)
- `UNIFIED_METRICS_SCHEMA_DESIGN.md` (New)
- `GLUCOSE_HBAIC_FINAL_SUMMARY.md` (New)

**Status:** Research only, no code implementation yet

### 3. **Grep Results**

```
✗ No "hba1c" references in source code
✗ No "HbA1c" in components
✗ No "A1c" in services
✗ No HbA1c calculation logic
✗ No HbA1c database schema
```

---

## ✅ WHAT CURRENTLY EXISTS: GLUCOSE (4 Types)

### **Database Schema**

```sql
CREATE TABLE metrics (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
    -- 'fasting' | 'post_meal_2h' | 'pre_meal' | 'pre_sleep'
  value FLOAT NOT NULL,
    -- mmol/L (0.1-50)
  measured_at DATETIME NOT NULL,
  note TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### **4 Glucose Types (Implemented)**

| Type | Code | When | Target | Status |
|------|------|------|--------|--------|
| Fasting | `fasting` | Early morning (8-10h fast) | < 7 mmol/L | ✅ Working |
| Post-meal | `post_meal_2h` | 2h after eating | < 7.8 mmol/L | ✅ Working |
| Pre-meal | `pre_meal` | Before eating | 4.4-7.2 mmol/L | ✅ Working |
| Pre-sleep | `pre_sleep` | Before bedtime | 5.0-8.3 mmol/L | ✅ Working |

### **Glucose Features (Implemented)**

**Backend:**
- ✅ `GET /api/v1/metrics/latest` - 4 latest readings (one per type)
- ✅ `GET /api/v1/metrics?type=&days=7` - Filter by type & days
- ✅ `POST /api/v1/metrics` - Create with Zod validation
- ✅ `DELETE /api/v1/metrics/:id` - Delete reading
- ✅ Status calculation (low/normal/warning/danger)

**Frontend:**
- ✅ MetricCard - Display 4 latest readings
- ✅ AddMetricModal - Input form (type, value, time, note)
- ✅ BloodGlucoseChart - Recharts line chart (7/14/30 days)
- ✅ MetricHistoryItem - List with status badges
- ✅ MetricsPage - Full management interface
- ✅ DashboardPage - Quick summary

---

## ❌ WHAT'S MISSING: HbA1c (NOT IMPLEMENTED)

### **Why HbA1c is Needed**

| Aspect | Glucose | HbA1c | Why HbA1c? |
|--------|---------|-------|-----------|
| **Measures** | Point-in-time glucose | 3-month average | Shows long-term control |
| **Frequency** | Daily/weekly | Every 3 months | Quarterly checkup |
| **Unit** | mmol/L | % | Different scale |
| **Clinical use** | Daily management | Diagnosis/assessment | Validates glucose control |
| **Time to reflect change** | Immediate | 3 months (slow) | Reflects sustained control |

### **Current Gaps**

#### **1. No Database Support**

```sql
-- MISSING: Table for HbA1c readings
CREATE TABLE hba1c_readings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  value FLOAT NOT NULL,  -- % (4.0-15.0)
  measured_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
-- This table DOES NOT EXIST
```

#### **2. No Constants/Thresholds**

```javascript
// File: frontend/src/constants/metrics.js
// MISSING:
export const HBA1C_THRESHOLDS = {
  normalMax: 5.7,
  prediabetesMin: 5.7,
  prediabetesMax: 6.4,
  dangerMin: 6.5,
  type2Target: 7.0,
  type1Target: 6.5
};
// This does NOT exist
```

#### **3. No API Endpoints**

```
MISSING endpoints:
  GET /api/v1/hba1c - List HbA1c readings
  POST /api/v1/hba1c - Add new HbA1c
  PUT /api/v1/hba1c/:id - Update
  DELETE /api/v1/hba1c/:id - Delete
```

#### **4. No Calculation Logic**

```javascript
// File: backend/src/utils/hba1c.calculator.js
// MISSING:
export function estimateHbA1c(avgGlucoseMmolL) {
  // HbA1c (%) = (0.0915 × Avg_Glucose_mmol/L) + 2.15
  return (0.0915 * avgGlucoseMmolL) + 2.15;
}
// This file DOES NOT EXIST
```

#### **5. No Frontend Components**

```
MISSING components:
  - HbA1cCard.jsx (display latest HbA1c)
  - HbA1cHistory.jsx (list all readings)
  - HbA1cEstimator.jsx (show estimated from glucose)
  - HbA1cChart.jsx (trend over 12 months)
```

#### **6. No Service Layer**

```javascript
// File: frontend/src/services/hba1c.service.js
// MISSING
// Should have:
//   hba1cService.getAll()
//   hba1cService.getLatest()
//   hba1cService.create(data)
//   hba1cService.delete(id)
```

#### **7. No Store (State Management)**

```javascript
// File: frontend/src/store/hba1cStore.js
// MISSING
// Should have:
//   hba1cStore.readings
//   hba1cStore.loading
//   hba1cStore.setReadings()
//   hba1cStore.addReading()
```

#### **8. No Hooks**

```javascript
// File: frontend/src/hooks/useHbA1c.js
// MISSING
// Should have:
//   const { readings, addHbA1c } = useHbA1c()
```

#### **9. No i18n Translations**

```javascript
// File: frontend/src/i18n/vi.js
// MISSING:
hba1c: {
  title: 'Chỉ số HbA1c',
  subtitle: 'Theo dõi glucose trung bình 3 tháng',
  types: {
    hba1c: 'HbA1c (Glucose 3 tháng)'
  },
  thresholds: {
    normal: 'Bình thường: < 5.7%',
    prediabetes: 'Tiền tiểu đường: 5.7-6.4%',
    diabetes: 'Tiểu đường: ≥ 6.5%'
  }
}
// This does NOT exist
```

---

## 📊 COMPARISON: GLUCOSE vs HbA1c (Current Status)

### **What's Implemented vs What's Missing**

| Feature | Glucose | HbA1c | Status |
|---------|---------|-------|--------|
| **Database** | ✅ metrics table | ❌ No table | Glucose only |
| **API endpoints** | ✅ 4 endpoints | ❌ No endpoints | Glucose only |
| **Constants/thresholds** | ✅ METRIC_TYPES | ❌ No constants | Glucose only |
| **Status calculation** | ✅ getMetricStatus() | ❌ No function | Glucose only |
| **Input form** | ✅ AddMetricModal | ❌ No form | Glucose only |
| **Display card** | ✅ MetricCard | ❌ No card | Glucose only |
| **History list** | ✅ MetricHistoryItem | ❌ No list | Glucose only |
| **Charts** | ✅ BloodGlucoseChart | ❌ No chart | Glucose only |
| **Statistics** | ❌ No stats | ❌ No stats | Neither |
| **Estimated HbA1c** | ❌ No estimation | ❌ No estimation | Neither |
| **i18n** | ✅ Partial | ❌ No translations | Glucose only |

---

## 🎯 WHY HbA1c IS MISSING

### **Business Reasons**

1. **Phase 1 Focus:** MVP focused on daily glucose tracking (easier for users)
2. **Pro Plan Feature:** HbA1c positioned as Premium feature (upsell value)
3. **Low Frequency:** Only quarterly check-ups (vs daily glucose)
4. **Medical Consultation:** Usually done at lab/doctor, not home

### **Technical Reasons**

1. **Different Data Model:** 
   - Glucose: Daily readings (mmol/L)
   - HbA1c: Quarterly readings (%)

2. **Calculation Complexity:**
   - HbA1c = derived from 90-day glucose average
   - Requires algorithm (EAGA formula)

3. **Clinical Accuracy:**
   - HbA1c ±15-20% margin of error
   - Must be measured at lab (not estimated for diagnosis)

---

## 🔧 IMPLEMENTATION ROADMAP

### **To Add HbA1c to IPUNI, You Need:**

#### **Phase 1: Backend Foundation (Week 1)**

```
[ ] 1. Create migration: 012_add_hba1c_table.js
   └─ Add HbA1c table OR extend metrics table
   
[ ] 2. Update metrics.constants.js
   └─ Add HBA1C_THRESHOLDS
   
[ ] 3. Create hba1c.calculator.js
   └─ Implement EAGA formula
   └─ Implement reverse formula
   
[ ] 4. Update metrics.schema.js
   └─ Add HbA1c validation (4.0-15.0 %)
   
[ ] 5. Create/update controller
   └─ Handle HbA1c requests
   └─ Calculate estimated HbA1c
   
[ ] 6. Create/update routes
   └─ POST /api/v1/hba1c
   └─ GET /api/v1/hba1c
   └─ DELETE /api/v1/hba1c/:id
```

#### **Phase 2: Frontend (Week 2)**

```
[ ] 1. Create frontend constants
   └─ HBA1C_THRESHOLDS
   
[ ] 2. Create hba1c.calculator.js
   └─ Frontend formula implementation
   
[ ] 3. Create components
   └─ HbA1cCard.jsx
   └─ AddHbA1cModal.jsx
   └─ HbA1cHistoryItem.jsx
   
[ ] 4. Update AddMetricModal
   └─ Add HbA1c option to type selector
   
[ ] 5. Create hook
   └─ useHbA1c()
   
[ ] 6. Create store
   └─ hba1cStore.js
   
[ ] 7. Create service
   └─ hba1c.service.js
   
[ ] 8. Update i18n
   └─ vi.js, en.js, lo.js
```

#### **Phase 3: Features (Week 3+)**

```
[ ] 1. Statistics
   └─ Calculate avg, min, max HbA1c
   
[ ] 2. Estimated HbA1c
   └─ Show estimated from 90-day glucose
   └─ Compare actual vs estimated
   
[ ] 3. Chart
   └─ HbA1c trend over 12 months
   
[ ] 4. Alerts
   └─ Notify when HbA1c high/low
   
[ ] 5. Quarterly reminder
   └─ Remind user to get lab test
```

---

## 📋 DECISION: Unified Table vs Separate Table?

### **Option A: Unified metrics Table (Recommended ⭐)**

**Add to existing metrics table:**

```sql
ALTER TABLE metrics ADD COLUMN unit TEXT DEFAULT 'mmol/L';
ALTER TABLE metrics ADD COLUMN measurement_category TEXT;

-- Then:
INSERT INTO metrics (user_id, type, value, unit, measurement_category, measured_at)
VALUES (1, 'hba1c', 6.8, '%', 'hba1c', NOW());
```

**Pros:**
- Simpler queries (single table)
- Unified API
- Dashboard shows all metrics together
- Easier statistics

**Cons:**
- Need to handle different units
- Different validation rules

### **Option B: Separate hba1c Table**

```sql
CREATE TABLE hba1c_readings (
  id INTEGER PRIMARY KEY,
  user_id INTEGER NOT NULL,
  value FLOAT NOT NULL,
  measured_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Pros:**
- Cleaner separation
- Simpler schema (only % values)

**Cons:**
- Requires joins
- Duplicate code (service/controller)
- More API endpoints

---

## 💡 RECOMMENDATIONS

### **1. Use Unified Table (Option A)**

**Why:**
- Simpler implementation
- Aligns with user mental model (all metrics together)
- Dashboard can show both glucose & HbA1c
- Statistics easier to calculate

### **2. Key Design Decisions**

**a) Add unit column to metrics**
```sql
ALTER TABLE metrics ADD unit TEXT CHECK(
  (type IN ('fasting', 'post_meal_2h', 'pre_meal', 'pre_sleep') AND unit = 'mmol/L') OR
  (type = 'hba1c' AND unit = '%')
);
```

**b) Rename type field to measurement_type**
```sql
-- OLD: type = 'fasting' | 'post_meal_2h' | 'pre_meal' | 'pre_sleep'
-- NEW: measurement_type = 'glucose_fasting' | 'glucose_postmeal' | 'glucose_random' | 'hba1c'
```

**c) Add measurement_category**
```sql
-- measurement_category = 'glucose' | 'hba1c' (for quick filtering)
```

### **3. Start Small**

**Minimum Viable HbA1c (Week 1):**
- Add HbA1c to metrics table
- Create basic input form
- Add API endpoint
- Display latest reading on dashboard

**Expand Later (Week 2+):**
- Statistics
- Estimated HbA1c from glucose
- Charts
- Quarterly reminders

---

## 📝 SUMMARY TABLE

| Item | Current | Status | Effort |
|------|---------|--------|--------|
| **Glucose** | 4 types (fasting, postmeal, pre-meal, pre-sleep) | ✅ Complete | Done |
| **HbA1c** | 0 types | ❌ Missing | 2-3 weeks |
| **Unified table** | metrics table (glucose only) | ⚠️ Needs refactor | 1 week |
| **Calculation** | getMetricStatus() | ✅ Exists (glucose) | Done |
| **Estimated HbA1c** | None | ❌ Missing | 2 days |
| **Charts** | BloodGlucoseChart | ✅ Exists (glucose) | Done |
| **Statistics** | None | ❌ Missing | 1 week |
| **Pro Plan feature** | Listed but not built | ⚠️ Promised but missing | 2-3 weeks |

---

## 🚀 NEXT STEPS

**Option 1: Build HbA1c Now (Recommended)**
- Implement using unified table approach
- Takes 2-3 weeks
- Delivers on Pro Plan promise

**Option 2: Keep Glucose-Only for Now**
- Current status quo
- Focus on other features
- Add HbA1c later when resources available

**Option 3: Quick MVP HbA1c**
- Basic input + display only
- No statistics/estimation
- Takes 1 week
- Expand features later

---

**Analysis Complete ✅**  
**Ready to implement?**
