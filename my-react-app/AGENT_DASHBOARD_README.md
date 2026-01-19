# Professional Agent Dashboard - Implementation Guide

## Overview
A comprehensive Agent Dashboard has been implemented to visualize KPI data from MongoDB, allowing agents to view their performance metrics with professional charts and detailed analytics.

## Features Implemented

### 1. **Agent Dashboard Main Page** (`/pages/agent/AgentDashboard.jsx`)
- **Agent Selection Sidebar**: Choose from a list of available agents
- **KPI Summary Cards**: 8 key metrics at a glance
  - Total Calls
  - Average Quality Score
  - Empathy Score
  - First Call Resolution %
  - Compliance Score
  - High Risk Calls Count
  - Sales Conversion %
  - Average Call Duration
- **Advanced Filtering**:
  - Search by call description
  - Date range filter (All Time, Today, Last 7 Days, Last 30 Days)
  - Status filter (All, Resolved, Unresolved)
  - Risk level filter (All, High Risk, Low Risk)
- **Calls List**: Professional table showing all calls with metadata

### 2. **Agent Selector Component** (`/components/agent/AgentSelector.jsx`)
- Sidebar with scrollable agent list
- Each agent card shows:
  - Agent name with avatar (initials)
  - Call count
  - Average score
- Loading skeletons during data fetch
- Active agent highlighting

### 3. **KPI Summary Cards** (`/components/agent/KpiSummaryCards.jsx`)
- 8 professional metric cards with:
  - Color-coded icons
  - Current value display
  - Trend indicators (up/down arrows)
  - Contextual colors (green for good, red for warnings)
  - Loading skeletons

### 4. **Calls List Component** (`/components/agent/CallsList.jsx`)
- Professional call cards showing:
  - Call date and time
  - Main problem/description
  - Call duration
  - Quality score with color coding
  - Resolution status badge (Resolved/Unresolved)
  - High Risk indicator
  - Call type classification
- Click to open detailed modal
- Empty states and error handling

### 5. **Call Detail Modal** (`/components/agent/CallDetailModal.jsx`)
- **Full-screen modal with tabs:**
  - **Overview Tab**: 
    - Call information (agent, type, channel, duration)
    - Resolution status with risk factors
    - Call summary (problem, actions, follow-up)
    - Quick score cards (Quality, Empathy, Compliance, Sales)
  
  - **Quality Metrics Tab**:
    - Bar chart showing Quality breakdown (Structure, Clarity, Professionalism, Listening)
    - Compliance checklist bar chart (Protocol, Greeting, Closing, Hold Procedure)
    - Problem-solving radar chart (Approach, Accuracy, Effort, Ownership)
  
  - **Empathy Tab**:
    - Line chart showing Empathy metrics (Tone, Empathy, Politeness, Patience)
    - Tone analysis details with issue detection
    - Customer experience metrics (interruptions, rapport, wait time)
  
  - **Transcript Tab**:
    - Full call transcript with speaker identification (Agent/Customer)
    - Color-coded messages (blue for agent, gray for customer)
    - Timestamps for each entry

### 6. **Data Visualization** (Using Recharts)
- **Charts implemented:**
  - Bar Charts (Quality metrics, Compliance)
  - Line Charts (Empathy trends)
  - Radar Charts (Problem-solving effectiveness)
  - Responsive containers (100% width, fixed heights)
  - Color-coded data points
  - Interactive tooltips
  - Grid backgrounds

### 7. **API Integration** (`/features/kpis/kpisApiSlice.js`)
- RTK Query endpoints:
  - `useGetAgentsQuery()` - Fetch all agents
  - `useGetAgentKpisQuery(agentId)` - Fetch all KPIs for an agent
  - `useGetKpiByIdQuery(kpiId)` - Fetch single KPI detail
  - `useGetAllKpisQuery(filters)` - Fetch filtered KPIs
  - `useGetAgentStatsQuery(agentId)` - Fetch aggregated stats
- Automatic caching and refetching
- Loading and error state management

## Routing

The dashboard is accessible at:
```
/agent/dashboard
```

**Route Configuration:**
- Path: `/agent/dashboard`
- Protection: `RoleBasedRoute` (agents only)
- Component: `<AgentDashboard />`

## Required Backend Endpoints

The frontend expects the following API endpoints at `${VITE_API_URL}/kpis/*`:

### 1. **GET /kpis/agents**
Get list of all unique agents with their basic stats.

**Response:**
```json
[
  {
    "agentId": "agent123",
    "agentName": "John Doe",
    "callCount": 145,
    "averageScore": 4.2
  }
]
```

### 2. **GET /kpis/agent/:agentId**
Get all KPI records for a specific agent.

**Response:**
```json
[
  {
    "_id": "kpi123",
    "agent_id": "agent123",
    "agent_name": "John Doe",
    "key_call_details": {
      "call_date": "2024-01-15",
      "call_start_time": "09:30:00",
      "call_duration_minutes": 12.5,
      "channel": "phone",
      "language": "en"
    },
    "call_summary": {
      "main_problem": "Account access issues",
      "actions_taken": "Reset password and verified email",
      "resolution_type": "resolved",
      "outcome": "Successful",
      "follow_up_required": false
    },
    "call_quality_metrics": {
      "structure_score": 4.5,
      "clarity_score": 4.2,
      "professionalism_score": 4.8,
      "active_listening_score": 4.3
    },
    "empathy_and_tone": {
      "overall_tone": "positive",
      "tone_score": 4.5,
      "empathy_rating": 4.7,
      "politeness_score": 4.6,
      "patience_level": 4.4,
      "tone_issues": []
    },
    "operational_signals": {
      "first_call_resolution": true
    },
    "high_risk": {
      "is_high_risk": false,
      "risk_factors": []
    },
    "call_type_classification": {
      "call_type": "technical_support"
    },
    "compliance_and_protocol": {
      "protocol_followed": true,
      "greeting_standard": true,
      "closing_standard": true,
      "hold_procedure_compliant": true
    },
    "problem_solving_effectiveness": {
      "problem_solving_approach": "methodical",
      "solution_accuracy_score": 4.5,
      "effort_required": "low",
      "ownership_demonstrated": true
    },
    "sales_and_conversion": {
      "sales_opportunity_score": 3.5
    },
    "customer_satisfaction": {
      "interruption_count": 1,
      "agent_interruptions": 0,
      "rapport_building": true,
      "wait_time": "2 minutes"
    },
    "transcript": [
      {
        "speaker": "agent",
        "text": "Hello, how can I help you today?",
        "timestamp": "00:00:05"
      },
      {
        "speaker": "customer",
        "text": "I can't access my account",
        "timestamp": "00:00:12"
      }
    ]
  }
]
```

### 3. **GET /kpis/:kpiId**
Get single KPI record by ID.

**Response:** Same structure as individual KPI object above

### 4. **GET /kpis?agent=X&startDate=Y&endDate=Z&highRisk=true&resolved=false**
Get filtered KPIs with query parameters.

**Query Parameters:**
- `agent` - Filter by agent ID
- `startDate` - Start date (ISO format)
- `endDate` - End date (ISO format)
- `highRisk` - Filter high-risk calls (true/false)
- `resolved` - Filter by resolution status (true/false)

**Response:** Array of KPI objects

### 5. **GET /kpis/agent/:agentId/stats**
Get aggregated statistics for an agent.

**Response:**
```json
{
  "agentId": "agent123",
  "agentName": "John Doe",
  "totalCalls": 145,
  "averageQualityScore": 4.2,
  "averageEmpathyScore": 4.5,
  "firstCallResolutionRate": 85.5,
  "complianceScore": 4.8,
  "highRiskCallsCount": 12,
  "highRiskCallsPercentage": 8.3,
  "salesConversionRate": 25.5,
  "averageDuration": 15.2
}
```

## MongoDB Schema Reference

The dashboard expects KPI documents with the following structure:

```javascript
{
  _id: ObjectId,
  agent_id: String,
  agent_name: String,
  
  // 1. Key Call Details
  key_call_details: {
    call_date: String,
    call_start_time: String,
    call_duration_minutes: Number,
    channel: String,
    language: String
  },
  
  // 2. Call Summary
  call_summary: {
    main_problem: String,
    actions_taken: String,
    resolution_type: String,
    outcome: String,
    follow_up_required: Boolean
  },
  
  // 3. Call Quality Metrics
  call_quality_metrics: {
    structure_score: Number (0-5),
    clarity_score: Number (0-5),
    professionalism_score: Number (0-5),
    active_listening_score: Number (0-5)
  },
  
  // 4. Empathy and Tone
  empathy_and_tone: {
    overall_tone: String,
    tone_score: Number (0-5),
    empathy_rating: Number (0-5),
    politeness_score: Number (0-5),
    patience_level: Number (0-5),
    tone_issues: [String]
  },
  
  // 5. Operational Signals
  operational_signals: {
    first_call_resolution: Boolean
  },
  
  // 6. High Risk Identification
  high_risk: {
    is_high_risk: Boolean,
    risk_factors: [String]
  },
  
  // 7. Call Type Classification
  call_type_classification: {
    call_type: String
  },
  
  // 8. Compliance and Protocol
  compliance_and_protocol: {
    protocol_followed: Boolean,
    greeting_standard: Boolean,
    closing_standard: Boolean,
    hold_procedure_compliant: Boolean
  },
  
  // 9. Problem-Solving Effectiveness
  problem_solving_effectiveness: {
    problem_solving_approach: String,
    solution_accuracy_score: Number (0-5),
    effort_required: String,
    ownership_demonstrated: Boolean
  },
  
  // 10. Sales and Conversion
  sales_and_conversion: {
    sales_opportunity_score: Number (0-5)
  },
  
  // 11. Customer Satisfaction Signals
  customer_satisfaction: {
    interruption_count: Number,
    agent_interruptions: Number,
    rapport_building: Boolean,
    wait_time: String
  },
  
  // Transcript
  transcript: [{
    speaker: String ("agent" | "customer"),
    text: String,
    timestamp: String
  }]
}
```

## Dependencies

All required packages are already installed:
- **recharts** (^2.x) - Professional charts and graphs
- **lucide-react** (^0.562.0) - Icon library
- **@reduxjs/toolkit** - State management
- **react-router-dom** - Routing

## Usage

1. **Login as Agent:**
   - Navigate to `/login`
   - Enter credentials
   - Select "Agent" role toggle

2. **Access Dashboard:**
   - After login, you'll be redirected to `/agent/dashboard`

3. **View Agent KPIs:**
   - Select an agent from the left sidebar
   - Summary cards show key metrics
   - Scroll to see all calls

4. **Filter Calls:**
   - Use search bar to find specific calls
   - Apply date filter (Today, Last 7 Days, etc.)
   - Filter by status (Resolved/Unresolved)
   - Filter by risk level (High/Low)

5. **View Call Details:**
   - Click any call card to open detailed modal
   - Navigate tabs (Overview, Quality, Empathy, Transcript)
   - View charts and visualizations
   - Click X or outside modal to close

## File Structure

```
my-react-app/
├── src/
│   ├── pages/
│   │   └── agent/
│   │       └── AgentDashboard.jsx           # Main dashboard page
│   ├── components/
│   │   └── agent/
│   │       ├── AgentSelector.jsx            # Agent list sidebar
│   │       ├── KpiSummaryCards.jsx          # Summary metrics cards
│   │       ├── CallsList.jsx                # Call records list
│   │       └── CallDetailModal.jsx          # Detailed call modal with charts
│   ├── features/
│   │   └── kpis/
│   │       └── kpisApiSlice.js              # RTK Query API definitions
│   └── App.jsx                              # Routing configuration
```

## Environment Configuration

Ensure your `.env` file has:
```bash
VITE_API_URL=http://localhost:8000/api/v1
```

Or update to your Avaya backend URL.

## Next Steps for Backend Implementation

1. Create KPI routes file: `backend_avaya/src/routes/kpi.routes.js`
2. Create KPI controller: `backend_avaya/src/controllers/kpi.controller.js`
3. Create KPI model: `backend_avaya/src/models/kpi.model.js` (Mongoose schema)
4. Implement the 5 endpoints listed above
5. Add KPI routes to main app: `app.use('/api/v1/kpis', kpiRoutes)`
6. Test endpoints with Postman/Thunder Client
7. Verify frontend integration

## Testing Checklist

- [ ] Login as agent redirects to dashboard
- [ ] Agent list loads from backend
- [ ] Selecting agent shows their calls
- [ ] Summary cards display correct metrics
- [ ] Search filter works
- [ ] Date filters work
- [ ] Status filter works
- [ ] Risk filter works
- [ ] Clicking call opens modal
- [ ] All 4 tabs in modal work
- [ ] Charts render correctly
- [ ] Transcript displays properly
- [ ] Modal closes correctly
- [ ] Loading states show skeletons
- [ ] Error states show proper messages
- [ ] Empty states display when no data

## Styling

The dashboard uses:
- **Tailwind CSS 4** with @theme directive
- **Professional color palette:**
  - Blue: Primary actions (#3b82f6)
  - Green: Success/positive metrics (#10b981)
  - Red: Warnings/high risk (#ef4444)
  - Gray: Neutral elements
  - Pink: Empathy metrics (#ec4899)
  - Purple: Advanced metrics (#8b5cf6)
- **Responsive design:** Mobile-first with md/lg breakpoints
- **Professional shadows and borders**
- **Smooth transitions and hover effects**

## Performance Optimizations

- RTK Query caching reduces API calls
- useMemo for filtered calls computation
- Lazy loading for chart components
- Skeleton loaders during data fetch
- Debounced search input (can be added)
- Pagination for large call lists (can be added)

## Future Enhancements

- [ ] Export KPIs to CSV/PDF
- [ ] Date range picker for custom ranges
- [ ] Real-time updates with WebSockets
- [ ] Comparison view (multiple agents)
- [ ] Trend analysis over time
- [ ] Coaching recommendations based on KPIs
- [ ] Agent performance leaderboard
- [ ] Advanced analytics dashboard
- [ ] Custom KPI thresholds
- [ ] Email reports
