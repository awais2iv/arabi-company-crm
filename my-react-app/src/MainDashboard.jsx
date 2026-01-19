import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useGoogleSheetData from './useGoogleSheetData';
import AnalyticsCard, { Stat, StatGrid, Badge } from './AnalyticsCard';
import { calculateAverage, countArrayOccurrences, getTopItems, getSatisfactionColor, getRiskColor } from './utils';

/**
 * Main Dashboard - Shows overview of all agents
 */
const MainDashboard = () => {
  const { data, loading, error, lastUpdated, refresh } = useGoogleSheetData();
  const navigate = useNavigate();

  // Calculate global statistics
  const globalStats = useMemo(() => {
    const { allRecords } = data;

    if (allRecords.length === 0) {
      return {
        totalRecords: 0,
        avgSatisfaction: 0,
        avgChurnRisk: 0,
        totalUpsellOpportunities: 0,
        topPositiveSignals: [],
        topNegativeSignals: [],
      };
    }

    const avgSatisfaction = calculateAverage(allRecords, 'satisfaction_level');
    const avgChurnRisk = calculateAverage(allRecords, 'churn_risk');

    const upsellCount = allRecords.filter(
      (r) => r.upsell_potential && parseFloat(r.upsell_potential) >= 7
    ).length;

    const positiveSignalCounts = countArrayOccurrences(allRecords, 'positive_signals');
    const negativeSignalCounts = countArrayOccurrences(allRecords, 'negative_signals');

    return {
      totalRecords: allRecords.length,
      avgSatisfaction: parseFloat(avgSatisfaction),
      avgChurnRisk: parseFloat(avgChurnRisk),
      totalUpsellOpportunities: upsellCount,
      topPositiveSignals: getTopItems(positiveSignalCounts, 3),
      topNegativeSignals: getTopItems(negativeSignalCounts, 3),
    };
  }, [data]);

  // Calculate agent statistics
  const agentStats = useMemo(() => {
    const { agents } = data;

    return Object.entries(agents).map(([agentName, records]) => {
      const avgSatisfaction = calculateAverage(records, 'satisfaction_level');
      const avgChurnRisk = calculateAverage(records, 'churn_risk');
      const upsellCount = records.filter(
        (r) => r.upsell_potential && parseFloat(r.upsell_potential) >= 7
      ).length;

      return {
        agentName,
        totalRecords: records.length,
        avgSatisfaction: parseFloat(avgSatisfaction),
        avgChurnRisk: parseFloat(avgChurnRisk),
        upsellOpportunities: upsellCount,
      };
    }).sort((a, b) => b.totalRecords - a.totalRecords);
  }, [data]);

  if (loading && !lastUpdated) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading call analysis data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Error Loading Data</h2>
          <p style={styles.errorMessage}>{error}</p>
          <button onClick={refresh} style={styles.retryButton}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Call Analysis Dashboard</h1>
          <p style={styles.subtitle}>
            Real-time analytics from Google Sheets • {agentStats.length} agents • {globalStats.totalRecords} calls analyzed
          </p>
        </div>
        <button onClick={refresh} style={styles.refreshButton} disabled={loading}>
          {loading ? '↻ Refreshing...' : '↻ Refresh Data'}
        </button>
      </div>

      {lastUpdated && (
        <div style={styles.updateInfo}>
          Last updated: {lastUpdated.toLocaleString()}
        </div>
      )}

      {/* Global Statistics */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Overall Performance</h2>
        <div style={styles.cardGrid}>
          <AnalyticsCard title="Customer Satisfaction" variant="success">
            <Stat
              label="Average Satisfaction Level"
              value={globalStats.avgSatisfaction}
              color={getSatisfactionColor(globalStats.avgSatisfaction)}
            />
          </AnalyticsCard>

          <AnalyticsCard title="Churn Risk" variant="warning">
            <Stat
              label="Average Churn Risk"
              value={globalStats.avgChurnRisk}
              color={getRiskColor(globalStats.avgChurnRisk)}
            />
          </AnalyticsCard>

          <AnalyticsCard title="Growth Opportunities" variant="info">
            <Stat
              label="High Upsell Potential"
              value={globalStats.totalUpsellOpportunities}
              color="#3b82f6"
            />
          </AnalyticsCard>

          <AnalyticsCard title="Total Calls" variant="default">
            <Stat
              label="Analyzed Calls"
              value={globalStats.totalRecords}
              color="#6366f1"
            />
          </AnalyticsCard>
        </div>
      </div>

      {/* Top Signals */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Key Signals</h2>
        <div style={styles.cardGrid}>
          <AnalyticsCard title="Top Positive Signals">
            {globalStats.topPositiveSignals.length > 0 ? (
              globalStats.topPositiveSignals.map((signal, idx) => (
                <div key={idx} style={styles.signalItem}>
                  <Badge text={signal.item} color="#10b981" />
                  <span style={styles.signalCount}>{signal.count}</span>
                </div>
              ))
            ) : (
              <p style={styles.noData}>No data available</p>
            )}
          </AnalyticsCard>

          <AnalyticsCard title="Top Negative Signals">
            {globalStats.topNegativeSignals.length > 0 ? (
              globalStats.topNegativeSignals.map((signal, idx) => (
                <div key={idx} style={styles.signalItem}>
                  <Badge text={signal.item} color="#ef4444" />
                  <span style={styles.signalCount}>{signal.count}</span>
                </div>
              ))
            ) : (
              <p style={styles.noData}>No data available</p>
            )}
          </AnalyticsCard>
        </div>
      </div>

      {/* Agent Overview */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Agents Overview</h2>
        <div style={styles.agentGrid}>
          {agentStats.map((agent) => (
            <div
              key={agent.agentName}
              onClick={() => navigate(`/agent/${encodeURIComponent(agent.agentName)}`)}
              style={styles.agentCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
              }}
            >
              <h3 style={styles.agentName}>{agent.agentName}</h3>
              <div style={styles.agentStats}>
                <StatGrid columns={2}>
                  <div>
                    <div style={styles.agentStatLabel}>Calls</div>
                    <div style={styles.agentStatValue}>{agent.totalRecords}</div>
                  </div>
                  <div>
                    <div style={styles.agentStatLabel}>Satisfaction</div>
                    <div
                      style={{
                        ...styles.agentStatValue,
                        color: getSatisfactionColor(agent.avgSatisfaction),
                      }}
                    >
                      {agent.avgSatisfaction}
                    </div>
                  </div>
                  <div>
                    <div style={styles.agentStatLabel}>Churn Risk</div>
                    <div
                      style={{
                        ...styles.agentStatValue,
                        color: getRiskColor(agent.avgChurnRisk),
                      }}
                    >
                      {agent.avgChurnRisk}
                    </div>
                  </div>
                  <div>
                    <div style={styles.agentStatLabel}>Upsell Opp.</div>
                    <div style={styles.agentStatValue}>{agent.upsellOpportunities}</div>
                  </div>
                </StatGrid>
              </div>
              <div style={styles.viewDetailsText}>Click to view details →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '24px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
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
  retryButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  title: {
    fontSize: '32px',
    fontWeight: '800',
    color: '#111827',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0',
  },
  refreshButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  updateInfo: {
    fontSize: '12px',
    color: '#9ca3af',
    marginBottom: '24px',
    textAlign: 'right',
  },
  section: {
    marginBottom: '48px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '16px',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
  },
  agentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '20px',
  },
  agentCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  },
  agentName: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    margin: '0 0 16px 0',
  },
  agentStats: {
    marginBottom: '16px',
  },
  agentStatLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  agentStatValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
  },
  viewDetailsText: {
    fontSize: '14px',
    color: '#3b82f6',
    fontWeight: '600',
    textAlign: 'center',
    marginTop: '12px',
  },
  signalItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px',
  },
  signalCount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#6b7280',
  },
  noData: {
    color: '#9ca3af',
    fontStyle: 'italic',
    margin: '0',
  },
};

export default MainDashboard;
