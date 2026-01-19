# 🌍 Translation System Guide (i18n)

## Overview
The application now supports **Arabic (العربية)** and **English** with automatic RTL/LTR layout switching.

## 🚀 Quick Start

### Using Translations in Components

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  
  return (
    <div>
      <h1>{t('agents.title')}</h1>
      <p>{t('calls.totalCalls')}: 150</p>
      <p>Current language: {i18n.language}</p>
    </div>
  );
}
```

## 📁 File Structure

```
src/
├── i18n/
│   ├── config.js          # i18n configuration
│   └── locales/
│       ├── en.json        # English translations
│       └── ar.json        # Arabic translations
└── components/
    └── LanguageSwitcher.jsx  # Language toggle button
```

## 🎯 Translation Keys

### Sidebar
```javascript
t('sidebar.dashboard')    // "Dashboard" / "لوحة التحكم"
t('sidebar.agents')       // "Agents" / "الوكلاء"
t('sidebar.reports')      // "Reports" / "التقارير"
t('sidebar.settings')     // "Settings" / "الإعدادات"
t('sidebar.logout')       // "Logout" / "تسجيل الخروج"
```

### Agents Page
```javascript
t('agents.title')           // "Agent Analytics Dashboard"
t('agents.totalCalls')      // "Total Calls"
t('agents.avgQuality')      // "Avg Quality"
t('agents.highRisk')        // "High Risk"
t('agents.avgEmpathy')      // "Avg Empathy"
t('agents.excellent')       // "Excellent"
t('agents.good')            // "Good"
t('agents.needsImprovement') // "Needs Improvement"
```

### Calls List
```javascript
t('calls.title')             // "Call Records"
t('calls.loading')           // "Loading calls..."
t('calls.error')             // "Failed to load calls"
t('calls.noRecords')         // "No call records"
t('calls.quality')           // "Quality"
t('calls.resolved_status')   // "Resolved"
t('calls.unresolved_status') // "Unresolved"
t('calls.highRisk')          // "High Risk"
```

### Call Details
```javascript
t('callDetail.backToAgent')  // "Back to Agent"

// Tabs
t('callDetail.tabs.overview')
t('callDetail.tabs.metrics')
t('callDetail.tabs.empathy')
t('callDetail.tabs.transcript')

// Overview
t('callDetail.overview.callInformation')
t('callDetail.overview.agent')
t('callDetail.overview.problem')
t('callDetail.overview.customerIntent')
t('callDetail.overview.agentAction')

// Tooltips
t('callDetail.tooltips.problem')
t('callDetail.tooltips.qualityScore')
```

## 🔄 Language Switching

### Automatic Features
- **RTL/LTR Layout**: Automatically switches based on language
- **Persistent Storage**: Language preference saved to localStorage
- **Browser Detection**: Auto-detects browser language on first visit

### Manual Switching
The `LanguageSwitcher` component is placed in the sidebar and provides one-click language toggle.

## ✨ Best Practices

### 1. Always Use Translation Keys
```jsx
// ❌ Bad - Hardcoded text
<h1>Dashboard</h1>

// ✅ Good - Using translations
<h1>{t('sidebar.dashboard')}</h1>
```

### 2. Handle Dynamic Content
```jsx
// For dynamic numbers or values
<p>{t('calls.totalCalls')}: {callCount}</p>
```

### 3. RTL-Aware Styling
```jsx
// Use dir attribute for Arabic text
<p dir="rtl">{arabicText}</p>

// Or use CSS classes
<p className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
  {t('some.text')}
</p>
```

## 📝 Adding New Translations

### Step 1: Add to English (en.json)
```json
{
  "newSection": {
    "title": "My New Section",
    "description": "This is a description"
  }
}
```

### Step 2: Add to Arabic (ar.json)
```json
{
  "newSection": {
    "title": "قسمي الجديد",
    "description": "هذا وصف"
  }
}
```

### Step 3: Use in Component
```jsx
function NewComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h2>{t('newSection.title')}</h2>
      <p>{t('newSection.description')}</p>
    </div>
  );
}
```

## 🎨 RTL Layout Support

The application automatically:
- Switches `dir` attribute on `<html>` element
- Adjusts Tailwind CSS classes for RTL
- Reverses flex directions
- Mirrors padding/margin as needed

### CSS Tips for RTL
```css
/* Use logical properties */
margin-inline-start: 1rem;  /* Instead of margin-left */
padding-inline-end: 2rem;   /* Instead of padding-right */

/* Or use Tailwind's RTL support */
className="ms-4 pe-2"  /* Margin start, padding end */
```

## 🔧 Configuration

### Changing Default Language
Edit `src/i18n/config.js`:
```javascript
fallbackLng: 'en',  // Change to 'ar' for Arabic default
lng: localStorage.getItem('language') || 'en',
```

### Adding More Languages
1. Create new locale file: `src/i18n/locales/fr.json`
2. Import in `config.js`:
```javascript
import fr from './locales/fr.json';

resources: {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr }
}
```

## 📊 Current Translation Coverage

- ✅ Sidebar navigation
- ✅ Agent cards and listings
- ✅ Call records list
- ✅ Call detail tabs
- ✅ Status badges
- ✅ Error messages
- ⏳ Forms and inputs (coming soon)
- ⏳ Settings page (coming soon)

## 🐛 Troubleshooting

### Translations Not Showing
1. Check if key exists in both `en.json` and `ar.json`
2. Verify import of `./i18n/config` in `App.jsx`
3. Clear browser cache and localStorage

### RTL Not Working
1. Check HTML `dir` attribute in DevTools
2. Verify CSS doesn't override RTL rules
3. Use logical properties instead of left/right

### Language Not Persisting
1. Check if localStorage is enabled
2. Verify `localStorage.setItem('language', lang)` is called
3. Check browser privacy settings

## 📚 Resources

- [react-i18next Documentation](https://react.i18next.com/)
- [i18next Documentation](https://www.i18next.com/)
- [RTL CSS Guide](https://rtlstyling.com/)

## 🎯 Example Component with Full i18n

```jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, CheckCircle } from 'lucide-react';

function CallCard({ call }) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  
  return (
    <div className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center gap-2">
        <Phone className="w-4 h-4" />
        <h3 className="font-semibold">{t('calls.title')}</h3>
      </div>
      
      <p className="text-sm text-gray-600">
        {t('calls.quality')}: {call.quality}/5
      </p>
      
      <div className="mt-2 flex items-center gap-2">
        <CheckCircle className="w-4 h-4 text-green-600" />
        <span className="text-sm">{t('calls.resolved_status')}</span>
      </div>
    </div>
  );
}

export default CallCard;
```
