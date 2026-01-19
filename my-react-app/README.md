# Call Analysis Intelligence Dashboard

A production-ready, bilingual React dashboard with **sidebar navigation** for analyzing call data from Google Sheets with real-time updates and comprehensive analytics.

## 🚀 Features

### Core Functionality
- **Live Google Sheets Integration**: Fetches data from public Google Sheet via CSV export
- **Auto-Refresh**: Updates every 5 minutes automatically
- **Bilingual Support**: English UI with automatic RTL support for Arabic data (including **Call Summary** field)
- **Responsive Design**: Professional sidebar layout with collapsible navigation
- **Real-Time Analytics**: Dynamic calculation of all metrics from live data

### Dashboard Views

#### 1. Dashboard Overview (`/`)
- **Global Performance Metrics**: Average satisfaction, churn risk, upsell opportunities, total calls
- **Agent Performance Cards**: Clickable cards showing agent statistics
- **Persistent Sidebar**: Agent list with call counts and ratings

#### 2. Agent Call List (`/agent/:agentName`)
- **Call Cards Grid**: Each call shown as a card with:
  - Call Summary (with RTL support for Arabic)
  - Satisfaction score (color-coded)
  - Churn Risk (color-coded)
  - Upsell Potential
  - Engagement Level
  - Customer Mood badge
  - "View Details" link
- **Sidebar Navigation**: Quick access to other agents
- **Search & Filter**: Easy navigation through calls

#### 3. Call Detail View (`/agent/:agentName/call/:callId`)
Comprehensive deep-dive into individual call:
- **Call Summary**: Full text with bilingual support
- **Customer Satisfaction**: Satisfaction level, recommendation, mood
- **Issue Handling**: Problem identified, resolution status, customer effort
- **Engagement & Risk**: Engagement level, objection level, churn risk
- **Growth Opportunities**: Upsell potential, budget discussed, decision maker
- **Next Steps**: Next steps clarity, follow-up needed
- **Analysis Quality**: Confidence score
- **Insights Cards**: Key points, risks, opportunities, positive/negative signals

## 🌐 Bilingual Support

**CRITICAL RULE**: All UI (headings, labels, navigation) is in **English**. Data from Google Sheet displayed as-is (may be Arabic) with automatic RTL support.

### Implementation
```javascript
const isArabic = (text) => /[\u0600-\u06FF]/.test(text);

style={{
  direction: isArabic(value) ? "rtl" : "ltr",
  textAlign: isArabic(value) ? "right" : "left"
}}
```

## 📊 Data Processing

### Google Sheet Details
- **Sheet ID**: `1a5bFYy6IFBEDP6cHkiKq9K0OwfGCgoFSVlg4oYQbUrk`
- **Access**: Public (read-only)
- **Format**: CSV export
- **Update Frequency**: Every 5 minutes (automatic)

### Supported Columns (23 total)
All data fields including:
- **Call Summary** (NEW) - Main summary text with RTL support
- satisfaction_level
- mood
- recommendation_likelihood
- problem_identified
- resolution_status
- customer_effort
- engagement_level
- objection_level
- churn_risk
- upsell_potential
- budget_discussed
- decision_maker_present
- next_steps_clarity
- follow_up_needed
- main_takeaway
- key_points (array)
- risks (array)
- opportunities (array)
- positive_signals (array)
- negative_signals (array)
- analysis_confidence
- Agent Name

Array fields (key_points, risks, opportunities, positive_signals, negative_signals) are automatically parsed.

## 🎨 Design System

### Color Indicators
- **Risk**: High (≥7) = Red, Medium (4-6) = Orange, Low (<4) = Green
- **Satisfaction**: High (≥8) = Green, Medium (5-7) = Orange, Low (<5) = Red

## 🚀 Getting Started

### Installation
```bash
cd my-react-app
npm install
```

### Development
```bash
npm run dev
```
Access at: `http://localhost:5173`

### Production Build
```bash
npm run build
npm run preview
```

## 🏗️ Architecture

### New Sidebar-Based Layout

```
┌─────────────────────────────────────────────┐
│  Sidebar        │  Main Content Area        │
│  ┌────────────┐ │  ┌──────────────────────┐ │
│  │ 📊 Dashboard│ │  │  Header              │ │
│  ├────────────┤ │  │  Agent/Dashboard     │ │
│  │  AGENTS    │ │  └──────────────────────┘ │
│  ├────────────┤ │                           │
│  │ 👤 Ahmed   │ │  ┌────────┐  ┌────────┐  │
│  │   50 • 8.5★│ │  │ Call 1 │  │ Call 2 │  │
│  ├────────────┤ │  │Summary │  │Summary │  │
│  │ 👤 Sarah   │ │  │Metrics │  │Metrics │  │
│  │   42 • 9.0★│ │  └────────┘  └────────┘  │
│  ├────────────┤ │                           │
│  │ 👤 Ali     │ │  ┌────────┐  ┌────────┐  │
│  │   38 • 8.2★│ │  │ Call 3 │  │ Call 4 │  │
│  └────────────┘ │  └────────┘  └────────┘  │
└─────────────────┴───────────────────────────┘
```

### File Structure
```
src/
├── MainLayout.jsx            # NEW: Sidebar + call cards grid
├── CallDetailView.jsx        # NEW: Deep dive into single call
├── utils.js                  # Data processing utilities
├── useGoogleSheetData.js     # Custom data fetching hook
├── AnalyticsCard.jsx         # Reusable card components
├── MainDashboard.jsx         # OLD: Not used (kept for reference)
├── AgentDashboard.jsx        # OLD: Not used (kept for reference)
├── App.jsx                   # Router with 3 routes
├── App.css                   # App styles
└── index.css                 # Global styles
```

### Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | MainLayout | Dashboard overview + sidebar |
| `/agent/:agentName` | MainLayout | Agent's call list + sidebar |
| `/agent/:agentName/call/:callId` | CallDetailView | Individual call details |

## 🎯 Key Metrics

### Global
- Average satisfaction/churn across all agents
- Total upsell opportunities (score ≥7)
- Most frequent signals

### Per-Agent
- Call volume, satisfaction, recommendation scores
- Problem resolution rates, customer effort
- Engagement, objection, and churn risk levels
- Upsell potential, budget discussions
- Key insights, risks, and opportunities

## 🛠️ Technology Stack

- React 18 + React Router DOM
- Vite (build tool)
- Inline CSS (no external frameworks)
- Native Fetch API
- Memoization for performance

## 📝 Notes

- All processing happens client-side
- No hardcoded data - everything is dynamic
- Production-ready code quality
- Fully responsive design
- Graceful error handling

---

**Built with ❤️ using React + Vite**
