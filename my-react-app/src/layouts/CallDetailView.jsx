import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGoogleSheetData from '../useGoogleSheetData';
import { isArabic, parseArrayField } from '../utils';

/**
 * Call Detail View - Deep dive into a single call
 */
const CallDetailView = () => {
  const { agentName, callId } = useParams();
  const navigate = useNavigate();
  const { data, loading, error } = useGoogleSheetData();

  const call = useMemo(() => {
    const decodedAgentName = decodeURIComponent(agentName);
    const agentCalls = data.agents[decodedAgentName] || [];
    return agentCalls[parseInt(callId)] || null;
  }, [data, agentName, callId]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading call details...</p>
      </div>
    );
  }

  if (error || !call) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorTitle}>Call Not Found</h2>
        <p style={styles.errorMessage}>
          {error || 'Unable to load call details.'}
        </p>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }

  const callSummary = call['Call Summary'] || call['call_summary'] || call['main_takeaway'] || '';
  const keyPoints = Array.isArray(call.key_points) ? call.key_points : parseArrayField(call.key_points);
  const risks = Array.isArray(call.risks) ? call.risks : parseArrayField(call.risks);
  const opportunities = Array.isArray(call.opportunities) ? call.opportunities : parseArrayField(call.opportunities);
  const positiveSignals = Array.isArray(call.positive_signals) ? call.positive_signals : parseArrayField(call.positive_signals);
  const negativeSignals = Array.isArray(call.negative_signals) ? call.negative_signals : parseArrayField(call.negative_signals);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backButton}>
          ← Back
        </button>
        <div style={styles.headerInfo}>
          <h1 style={styles.title}>Call Details</h1>
          <p style={styles.subtitle}>
            Agent: {decodeURIComponent(agentName)} • Call #{parseInt(callId) + 1}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Call Summary Card */}
        <div style={styles.summaryCard}>
          <h2 style={styles.sectionTitle}>Call Summary</h2>
          <BilingualText
            text={callSummary || 'No summary available'}
            style={styles.summaryText}
          />
        </div>

        {/* Metrics Grid */}
        <div style={styles.metricsGrid}>
          {/* Customer Satisfaction */}
          <DetailCard title="Customer Satisfaction" icon="⭐">
            <MetricRow label="Satisfaction Level" value={call.satisfaction_level} type="satisfaction" />
            <MetricRow label="Recommendation Likelihood" value={call.recommendation_likelihood} type="satisfaction" />
            <MetricRow label="Mood" value={call.mood} type="text" />
          </DetailCard>

          {/* Issue Handling */}
          <DetailCard title="Issue Handling" icon="🔧">
            <MetricRow label="Problem Identified" value={call.problem_identified} type="text" />
            <MetricRow label="Resolution Status" value={call.resolution_status} type="text" />
            <MetricRow label="Customer Effort" value={call.customer_effort} type="number" />
          </DetailCard>

          {/* Engagement & Risk */}
          <DetailCard title="Engagement & Risk" icon="📊">
            <MetricRow label="Engagement Level" value={call.engagement_level} type="engagement" />
            <MetricRow label="Objection Level" value={call.objection_level} type="risk" />
            <MetricRow label="Churn Risk" value={call.churn_risk} type="risk" />
          </DetailCard>

          {/* Growth Opportunities */}
          <DetailCard title="Growth Opportunities" icon="💰">
            <MetricRow label="Upsell Potential" value={call.upsell_potential} type="upsell" />
            <MetricRow label="Budget Discussed" value={call.budget_discussed} type="boolean" />
            <MetricRow label="Decision Maker Present" value={call.decision_maker_present} type="boolean" />
          </DetailCard>

          {/* Next Steps */}
          <DetailCard title="Next Steps" icon="📋">
            <MetricRow label="Next Steps Clarity" value={call.next_steps_clarity} type="number" />
            <MetricRow label="Follow-up Needed" value={call.follow_up_needed} type="boolean" />
          </DetailCard>

          {/* Analysis Quality */}
          <DetailCard title="Analysis Quality" icon="🎯">
            <MetricRow label="Analysis Confidence" value={call.analysis_confidence} type="confidence" />
          </DetailCard>
        </div>

        {/* Insights Section */}
        <div style={styles.insightsGrid}>
          {/* Key Points */}
          {keyPoints.length > 0 && (
            <InsightCard title="Key Points" icon="🔑" color="#3b82f6">
              <BilingualList items={keyPoints} />
            </InsightCard>
          )}

          {/* Risks */}
          {risks.length > 0 && (
            <InsightCard title="Risks" icon="⚠️" color="#dc2626">
              <BilingualList items={risks} />
            </InsightCard>
          )}

          {/* Opportunities */}
          {opportunities.length > 0 && (
            <InsightCard title="Opportunities" icon="🎯" color="#10b981">
              <BilingualList items={opportunities} />
            </InsightCard>
          )}

          {/* Positive Signals */}
          {positiveSignals.length > 0 && (
            <InsightCard title="Positive Signals" icon="✅" color="#10b981">
              <BilingualList items={positiveSignals} />
            </InsightCard>
          )}

          {/* Negative Signals */}
          {negativeSignals.length > 0 && (
            <InsightCard title="Negative Signals" icon="❌" color="#dc2626">
              <BilingualList items={negativeSignals} />
            </InsightCard>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Bilingual Text Component
 */
const BilingualText = ({ text, style = {} }) => {
  const textIsArabic = isArabic(text);
  return (
    <div
      style={{
        direction: textIsArabic ? 'rtl' : 'ltr',
        textAlign: textIsArabic ? 'right' : 'left',
        ...style,
      }}
    >
      {text}
    </div>
  );
};

/**
 * Bilingual List Component
 */
const BilingualList = ({ items }) => {
  if (!items || items.length === 0) {
    return <p style={styles.noData}>No data available</p>;
  }

  return (
    <ul style={styles.list}>
      {items.map((item, index) => {
        const itemIsArabic = isArabic(item);
        return (
          <li
            key={index}
            style={{
              ...styles.listItem,
              direction: itemIsArabic ? 'rtl' : 'ltr',
              textAlign: itemIsArabic ? 'right' : 'left',
            }}
          >
            {item}
          </li>
        );
      })}
    </ul>
  );
};

/**
 * Detail Card Component
 */
const DetailCard = ({ title, icon, children }) => {
  return (
    <div style={styles.detailCard}>
      <div style={styles.detailCardHeader}>
        <span style={styles.detailCardIcon}>{icon}</span>
        <h3 style={styles.detailCardTitle}>{title}</h3>
      </div>
      <div style={styles.detailCardContent}>{children}</div>
    </div>
  );
};

/**
 * Insight Card Component
 */
const InsightCard = ({ title, icon, color, children }) => {
  return (
    <div style={styles.insightCard}>
      <div style={styles.insightCardHeader}>
        <span style={styles.insightCardIcon}>{icon}</span>
        <h3 style={{ ...styles.insightCardTitle, color }}>{title}</h3>
      </div>
      <div style={styles.insightCardContent}>{children}</div>
    </div>
  );
};

/**
 * Metric Row Component
 */
const MetricRow = ({ label, value, type = 'text' }) => {
  const getColor = () => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '#111827';

    switch (type) {
      case 'satisfaction':
        if (numValue >= 8) return '#10b981';
        if (numValue >= 5) return '#f59e0b';
        return '#dc2626';
      case 'risk':
        if (numValue >= 7) return '#dc2626';
        if (numValue >= 4) return '#f59e0b';
        return '#10b981';
      case 'upsell':
        if (numValue >= 7) return '#10b981';
        if (numValue >= 4) return '#f59e0b';
        return '#6b7280';
      case 'engagement':
        if (numValue >= 7) return '#10b981';
        if (numValue >= 4) return '#3b82f6';
        return '#6b7280';
      case 'confidence':
        if (numValue >= 80) return '#10b981';
        if (numValue >= 60) return '#3b82f6';
        return '#f59e0b';
      default:
        return '#111827';
    }
  };

  const formatValue = () => {
    if (type === 'boolean') {
      const boolValue = value === 'true' || value === '1' || value === true || value === 'TRUE';
      return boolValue ? 'Yes' : 'No';
    }
    if (type === 'confidence') {
      return `${value}%`;
    }
    return value || 'N/A';
  };

  const valueIsArabic = type === 'text' && isArabic(String(value));

  return (
    <div style={styles.metricRow}>
      <span style={styles.metricLabel}>{label}</span>
      <span
        style={{
          ...styles.metricValue,
          color: getColor(),
          direction: valueIsArabic ? 'rtl' : 'ltr',
          textAlign: valueIsArabic ? 'right' : 'left',
        }}
      >
        {formatValue()}
      </span>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f9fafb',
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '24px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    position: 'sticky',
    top: 0,
    zIndex: 10,
  },
  backButton: {
    background: '#f3f4f6',
    color: '#374151',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0',
  },
  content: {
    padding: '32px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  summaryCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '32px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '16px',
  },
  summaryText: {
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#374151',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    marginBottom: '32px',
  },
  detailCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  detailCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f3f4f6',
  },
  detailCardIcon: {
    fontSize: '24px',
  },
  detailCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
  },
  detailCardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '16px',
  },
  metricLabel: {
    fontSize: '14px',
    color: '#6b7280',
    flex: '0 0 auto',
  },
  metricValue: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#111827',
    flex: '1 1 auto',
    textAlign: 'right',
  },
  insightsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '20px',
  },
  insightCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  insightCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '1px solid #f3f4f6',
  },
  insightCardIcon: {
    fontSize: '24px',
  },
  insightCardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0,
  },
  insightCardContent: {
    fontSize: '14px',
    color: '#374151',
  },
  list: {
    margin: 0,
    padding: '0 0 0 24px',
    listStyleType: 'disc',
  },
  listItem: {
    marginBottom: '8px',
    lineHeight: '1.6',
  },
  noData: {
    color: '#9ca3af',
    fontStyle: 'italic',
    margin: 0,
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
  },
  spinner: {
    width: '48px',
    height: '48px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #3b82f6',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    fontSize: '16px',
    color: '#6b7280',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '48px 24px',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#dc2626',
    marginBottom: '12px',
  },
  errorMessage: {
    fontSize: '16px',
    color: '#6b7280',
    marginBottom: '24px',
  },
};

export default CallDetailView;
