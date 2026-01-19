# 📊 Updated Database Schema with Call Summary

## 🗄️ Complete Table Structure

### **Table: `call_analysis`**

| Column Name | Data Type | Format | Example | Priority |
|------------|-----------|---------|---------|----------|
| `id` | INTEGER | Primary Key | `1, 2, 3...` | Required |
| `agent_name` | VARCHAR(100) | Text | `Ahmed Hassan` | **Required** |
| `call_date` | DATETIME | ISO 8601 | `2024-01-13 14:30:00` | Optional |
| **`call_summary`** | **TEXT** | **Text** | **`العميل راضٍ ومهتم بالترقية`** | **HIGH** |
| `satisfaction_level` | DECIMAL(3,1) | 0.0-10.0 | `8.5` | HIGH |
| `mood` | VARCHAR(50) | Text | `راضٍ` or `Satisfied` | HIGH |
| `recommendation_likelihood` | DECIMAL(3,1) | 0.0-10.0 | `9.0` | MEDIUM |
| `problem_identified` | VARCHAR(200) | Text | `مشكلة في الفوترة` | MEDIUM |
| `resolution_status` | VARCHAR(50) | Text | `تم الحل` | MEDIUM |
| `customer_effort` | DECIMAL(3,1) | 0.0-10.0 | `3.5` | MEDIUM |
| `engagement_level` | DECIMAL(3,1) | 0.0-10.0 | `7.8` | HIGH |
| `objection_level` | DECIMAL(3,1) | 0.0-10.0 | `2.3` | MEDIUM |
| `churn_risk` | DECIMAL(3,1) | 0.0-10.0 | `4.5` | **HIGH** |
| `upsell_potential` | DECIMAL(3,1) | 0.0-10.0 | `8.0` | **HIGH** |
| `budget_discussed` | BOOLEAN | true/false | `true` | MEDIUM |
| `decision_maker_present` | BOOLEAN | true/false | `false` | MEDIUM |
| `next_steps_clarity` | DECIMAL(3,1) | 0.0-10.0 | `9.5` | MEDIUM |
| `follow_up_needed` | BOOLEAN | true/false | `true` | MEDIUM |
| `main_takeaway` | TEXT | Text | `العميل مهتم بالترقية` | LOW |
| `key_points` | TEXT | CSV/JSON | See below | MEDIUM |
| `risks` | TEXT | CSV/JSON | See below | MEDIUM |
| `opportunities` | TEXT | CSV/JSON | See below | HIGH |
| `positive_signals` | TEXT | CSV/JSON | See below | MEDIUM |
| `negative_signals` | TEXT | CSV/JSON | See below | MEDIUM |
| `analysis_confidence` | DECIMAL(3,1) | 0.0-10.0 | `8.7` | LOW |

## 🎯 Field Priority Explanation

### **HIGH Priority (Shown on Call Cards)**
- `call_summary` - **Main summary displayed prominently**
- `satisfaction_level` - Color-coded metric
- `churn_risk` - Color-coded metric
- `upsell_potential` - Revenue opportunity indicator
- `engagement_level` - Customer interest
- `mood` - Quick emotional indicator
- `agent_name` - Required for grouping

### **MEDIUM Priority (Detail View Only)**
- All other metrics and insights

### **LOW Priority (Metadata)**
- `analysis_confidence` - Quality indicator
- `main_takeaway` - Fallback for call_summary

## 📝 Call Summary Field Details

### **Purpose:**
The `call_summary` field is the **most important field** in the new design. It's displayed prominently on call cards and at the top of the detail view.

### **Specifications:**
```sql
call_summary TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
```

### **Guidelines:**
- **Length**: 100-300 characters recommended for card display
- **Language**: Can be English or Arabic (auto-detected for RTL)
- **Content**: High-level overview of the call
- **Format**: Plain text (no HTML or special formatting)

### **Good Examples:**

**English:**
```
Customer satisfied with service. Interested in upgrading to premium plan. 
Budget approved. Follow-up scheduled for next week.
```

**Arabic:**
```
العميل راضٍ عن الخدمة ومهتم بالترقية للباقة المميزة. 
تمت الموافقة على الميزانية. تم جدولة متابعة للأسبوع القادم.
```

**Mixed (Not Recommended but Supported):**
```
Customer راضٍ with service and wants ترقية للباقة المميزة.
```

### **Bad Examples:**
```
❌ Too short: "Good call"
❌ Too long: "The customer called at 10:00 AM and said... [500 words]"
❌ Empty: ""
❌ Generic: "Call completed successfully"
```

### **Fallback Logic:**
If `call_summary` is empty, the system uses:
1. `call_summary` (primary)
2. `main_takeaway` (fallback)
3. "No summary available" (last resort)

## 🗂️ Google Sheets Column Headers

### **Correct Order (23 columns):**

```
Call Summary | satisfaction_level | mood | recommendation_likelihood | problem_identified | resolution_status | customer_effort | engagement_level | objection_level | churn_risk | upsell_potential | budget_discussed | decision_maker_present | next_steps_clarity | follow_up_needed | main_takeaway | key_points | risks | opportunities | positive_signals | negative_signals | analysis_confidence | Agent Name
```

### **Example Data Row:**

```
Customer satisfied and interested in upgrade | 8.5 | راضٍ جداً | 9.0 | مشكلة في الفوترة | تم الحل | 3.5 | 8.2 | 2.0 | 3.5 | 8.5 | TRUE | TRUE | 9.0 | TRUE | العميل راضٍ عن الحل | سرعة في الاستجابة, حل فعال | منافسة من شركات أخرى | بيع باقة بريميوم | شكر الوكيل, سأل عن الباقات | ذكر أن السعر مرتفع | 8.7 | أحمد حسن
```

## 💾 SQL Schema (Updated)

```sql
CREATE TABLE call_analysis (
    id INT AUTO_INCREMENT PRIMARY KEY,
    
    -- Core identification
    agent_name VARCHAR(100) NOT NULL,
    call_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    -- NEW: Main summary field (HIGH priority)
    call_summary TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    
    -- Satisfaction metrics (HIGH priority)
    satisfaction_level DECIMAL(3,1) DEFAULT 0.0,
    mood VARCHAR(50),
    recommendation_likelihood DECIMAL(3,1) DEFAULT 0.0,
    
    -- Issue handling
    problem_identified VARCHAR(200),
    resolution_status VARCHAR(50),
    customer_effort DECIMAL(3,1) DEFAULT 0.0,
    
    -- Engagement & risk (HIGH priority)
    engagement_level DECIMAL(3,1) DEFAULT 0.0,
    objection_level DECIMAL(3,1) DEFAULT 0.0,
    churn_risk DECIMAL(3,1) DEFAULT 0.0,
    
    -- Growth opportunities (HIGH priority)
    upsell_potential DECIMAL(3,1) DEFAULT 0.0,
    budget_discussed BOOLEAN DEFAULT FALSE,
    decision_maker_present BOOLEAN DEFAULT FALSE,
    
    -- Next steps
    next_steps_clarity DECIMAL(3,1) DEFAULT 0.0,
    follow_up_needed BOOLEAN DEFAULT FALSE,
    
    -- Insights (MEDIUM priority)
    main_takeaway TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    key_points TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    risks TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    opportunities TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    positive_signals TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    negative_signals TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    
    -- Metadata
    analysis_confidence DECIMAL(3,1) DEFAULT 0.0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Indexes
    INDEX idx_agent (agent_name),
    INDEX idx_date (call_date),
    INDEX idx_churn (churn_risk),
    INDEX idx_upsell (upsell_potential),
    INDEX idx_satisfaction (satisfaction_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 📊 Complete Data Example

```sql
INSERT INTO call_analysis (
  agent_name,
  call_date,
  call_summary,
  satisfaction_level,
  mood,
  recommendation_likelihood,
  problem_identified,
  resolution_status,
  customer_effort,
  engagement_level,
  objection_level,
  churn_risk,
  upsell_potential,
  budget_discussed,
  decision_maker_present,
  next_steps_clarity,
  follow_up_needed,
  main_takeaway,
  key_points,
  risks,
  opportunities,
  positive_signals,
  negative_signals,
  analysis_confidence
) VALUES (
  'أحمد حسن',
  '2024-01-13 14:30:00',
  'العميل راضٍ جداً عن الخدمة ومهتم بالترقية للباقة المميزة. تمت الموافقة على الميزانية وحضر صانع القرار.',
  8.5,
  'راضٍ جداً',
  9.0,
  'مشكلة بسيطة في الفوترة',
  'تم الحل بالكامل',
  3.5,
  8.2,
  2.0,
  3.5,
  8.5,
  true,
  true,
  9.0,
  true,
  'فرصة ممتازة لبيع الباقة المميزة',
  'سرعة في الاستجابة, حل فعال للمشكلة, اهتمام واضح بالترقية',
  'قد يحتاج موافقة إضافية من الإدارة, منافسة من شركات أخرى',
  'بيع باقة بريميوم, عقد سنوي بخصم, خدمات إضافية',
  'شكر الوكيل بحماس, سأل عن الباقات الأعلى, تحدث عن الميزانية المتاحة',
  'ذكر أن السعر أعلى قليلاً من المنافسين, طلب وقتاً للتفكير',
  8.7
);
```

## ✅ Data Validation Checklist

### Before Import:
- [ ] `call_summary` is filled (not empty)
- [ ] `call_summary` length: 100-300 chars
- [ ] `agent_name` is never empty
- [ ] Numeric scores are 0.0-10.0
- [ ] Boolean fields use TRUE/FALSE
- [ ] Array fields use comma separation
- [ ] UTF-8 encoding for Arabic text
- [ ] Dates in ISO 8601 format

### Quality Check:
- [ ] Call summary is descriptive (not generic)
- [ ] Call summary includes key outcome
- [ ] Arabic text displays correctly
- [ ] All required fields populated
- [ ] No special characters in column names

## 🎯 Field Usage in UI

| Field | Dashboard | Call Card | Detail View |
|-------|-----------|-----------|-------------|
| call_summary | ❌ | ✅ **Large** | ✅ **Top** |
| satisfaction_level | ✅ | ✅ | ✅ |
| churn_risk | ✅ | ✅ | ✅ |
| upsell_potential | ✅ | ✅ | ✅ |
| engagement_level | ❌ | ✅ | ✅ |
| mood | ❌ | ✅ Badge | ✅ |
| key_points | ❌ | ❌ | ✅ List |
| risks | ❌ | ❌ | ✅ List |
| opportunities | ❌ | ❌ | ✅ List |

## 📝 Summary

The `call_summary` field is now the **most prominent field** in the UI:

1. **Call Cards**: Displayed at the top (3 lines max)
2. **Detail View**: First card, full text
3. **Bilingual**: Automatic RTL detection
4. **Priority**: Highest visual hierarchy
5. **Fallback**: Uses main_takeaway if empty

Make sure this field is always filled with meaningful, concise summaries!
