import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useGoogleSheetData from '../../useGoogleSheetData';
import AnalyticsCard, { Stat, StatGrid, BilingualText, BilingualList, Badge, ProgressBar } from '../../AnalyticsCard';
import {
  calculateAverage,
  countOccurrences,
  countArrayOccurrences,
  getTopItems,
  getSatisfactionColor,
  getRiskColor,
} from '../../utils';

/**
 * Agent-Specific Dashboard
 * Shows detailed analytics for a single agent
 */
const AgentDashboard = () => {
  const { agentName } = useParams();
  const navigate = useNavigate();
  const { data, loading, error, lastUpdated, refresh } = useGoogleSheetData();

  // Get agent's records
  const agentRecords = useMemo(() => {
    const decodedAgentName = decodeURIComponent(agentName);
    return data.agents[decodedAgentName] || [];
  }, [data, agentName]);

  // Calculate analytics
  const analytics = useMemo(() => {
    if (agentRecords.length === 0) {
      return null;
    }

    const avgSatisfaction = calculateAverage(agentRecords, 'satisfaction_level');
    const avgRecommendation = calculateAverage(agentRecords, 'recommendation_likelihood');
    const avgCustomerEffort = calculateAverage(agentRecords, 'customer_effort');
    const avgEngagement = calculateAverage(agentRecords, 'engagement_level');
    const avgObjection = calculateAverage(agentRecords, 'objection_level');
    const avgChurnRisk = calculateAverage(agentRecords, 'churn_risk');
    const avgUpsellPotential = calculateAverage(agentRecords, 'upsell_potential');
    const avgConfidence = calculateAverage(agentRecords, 'analysis_confidence');

    const moodCounts = countOccurrences(agentRecords, 'mood');
    const problemCounts = countOccurrences(agentRecords, 'problem_identified');
    const resolutionCounts = countOccurrences(agentRecords, 'resolution_status');
    const budgetCounts = countOccurrences(agentRecords, 'budget_discussed');
    const decisionMakerCounts = countOccurrences(agentRecords, 'decision_maker_present');
    const followUpCounts = countOccurrences(agentRecords, 'follow_up_needed');

    const keyPointsCounts = countArrayOccurrences(agentRecords, 'key_points');
    const risksCounts = countArrayOccurrences(agentRecords, 'risks');
    const opportunitiesCounts = countArrayOccurrences(agentRecords, 'opportunities');
    const positiveSignalsCounts = countArrayOccurrences(agentRecords, 'positive_signals');
    const negativeSignalsCounts = countArrayOccurrences(agentRecords, 'negative_signals');

    return {
      totalRecords: agentRecords.length,
      // Satisfaction
      avgSatisfaction: parseFloat(avgSatisfaction),
      avgRecommendation: parseFloat(avgRecommendation),
      topMoods: getTopItems(moodCounts, 3),
      // Issue Handling
      topProblems: getTopItems(problemCounts, 3),
      topResolutions: getTopItems(resolutionCounts, 3),
      avgCustomerEffort: parseFloat(avgCustomerEffort),
      // Engagement & Risk
      avgEngagement: parseFloat(avgEngagement),
      avgObjection: parseFloat(avgObjection),
      avgChurnRisk: parseFloat(avgChurnRisk),
      // Growth
      avgUpsellPotential: parseFloat(avgUpsellPotential),
      budgetDiscussed: budgetCounts,
      decisionMaker: decisionMakerCounts,
      // Next Steps
      followUpNeeded: followUpCounts,
      // Insights
      topKeyPoints: getTopItems(keyPointsCounts, 5),
      topRisks: getTopItems(risksCounts, 5),
      topOpportunities: getTopItems(opportunitiesCounts, 5),
      // Signals
      topPositiveSignals: getTopItems(positiveSignalsCounts, 5),
      topNegativeSignals: getTopItems(negativeSignalsCounts, 5),
      // Confidence
      avgConfidence: parseFloat(avgConfidence),
    };
  }, [agentRecords]);

  if (loading && !lastUpdated) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading agent data...</p>
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

  if (!analytics || agentRecords.length === 0) {
    return (
      <div style={styles.container}>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <div style={styles.errorContainer}>
          <h2 style={styles.errorTitle}>Agent Not Found</h2>
          <p style={styles.errorMessage}>
            No data found for agent: {decodeURIComponent(agentName)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backButton}>
          ← Back to Dashboard
        </button>
        <button onClick={refresh} style={styles.refreshButton} disabled={loading}>
          {loading ? '↻ Refreshing...' : '↻ Refresh Data'}
        </button>
      </div>

      <div style={styles.titleSection}>
        <h1 style={styles.title}>{decodeURIComponent(agentName)}</h1>
        <p style={styles.subtitle}>
          {analytics.totalRecords} calls analyzed • Last updated: {lastUpdated?.toLocaleString()}
        </p>
      </div>

      {/* Customer Satisfaction */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Customer Satisfaction</h2>
        <div style={styles.cardGrid}>
          <AnalyticsCard title="Satisfaction Metrics" variant="success">
            <StatGrid columns={2}>
              <Stat
                label="Avg Satisfaction"
                value={analytics.avgSatisfaction}
                color={getSatisfactionColor(analytics.avgSatisfaction)}
              />
              <Stat
                label="Avg Recommendation"
                value={analytics.avgRecommendation}
                color={getSatisfactionColor(analytics.avgRecommendation)}
              />
            </StatGrid>
            <div style={{ marginTop: '16px' }}>
              <div style={styles.label}>Satisfaction Level</div>
              <ProgressBar value={analytics.avgSatisfaction} max={10} color={getSatisfactionColor(analytics.avgSatisfaction)} />
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Top Customer Moods">
            {analytics.topMoods.map((mood, idx) => (
              <div key={idx} style={styles.listItem}>
                <BilingualText text={mood.item} style={{ fontSize: '14px' }} />
                <Badge text={mood.count} color="#3b82f6" />
              </div>
            ))}
          </AnalyticsCard>
        </div>
      </section>

      {/* Issue Handling */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Issue Handling</h2>
        <div style={styles.cardGrid}>
          <AnalyticsCard title="Problems Identified">
            {analytics.topProblems.length > 0 ? (
              analytics.topProblems.map((problem, idx) => (
                <div key={idx} style={styles.listItem}>
                  <BilingualText text={problem.item} style={{ fontSize: '14px', flex: 1 }} />
                  <Badge text={problem.count} color="#f59e0b" />
                </div>
              ))
            ) : (
              <p style={styles.noData}>No problems identified</p>
            )}
          </AnalyticsCard>

          <AnalyticsCard title="Resolution Status">
            {analytics.topResolutions.length > 0 ? (
              analytics.topResolutions.map((resolution, idx) => (
                <div key={idx} style={styles.listItem}>
                  <BilingualText text={resolution.item} style={{ fontSize: '14px', flex: 1 }} />
                  <Badge text={resolution.count} color="#10b981" />
                </div>
              ))
            ) : (
              <p style={styles.noData}>No resolution data</p>
            )}
          </AnalyticsCard>

          <AnalyticsCard title="Customer Effort">
            <Stat
              label="Average Effort Score"
              value={analytics.avgCustomerEffort}
              color="#6366f1"
            />
            <div style={{ marginTop: '16px' }}>
              <div style={styles.label}>Effort Level</div>
              <ProgressBar value={analytics.avgCustomerEffort} max={10} color="#6366f1" />
            </div>
          </AnalyticsCard>
        </div>
      </section>

      {/* Engagement & Risk */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Engagement & Risk Analysis</h2>
        <div style={styles.cardGrid}>
          <AnalyticsCard title="Engagement Level">
            <Stat
              label="Average Engagement"
              value={analytics.avgEngagement}
              color="#10b981"
            />
            <div style={{ marginTop: '16px' }}>
              <ProgressBar value={analytics.avgEngagement} max={10} color="#10b981" />
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Objection Level">
            <Stat
              label="Average Objections"
              value={analytics.avgObjection}
              color="#f59e0b"
            />
            <div style={{ marginTop: '16px' }}>
              <ProgressBar value={analytics.avgObjection} max={10} color="#f59e0b" />
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Churn Risk" variant="warning">
            <Stat
              label="Average Churn Risk"
              value={analytics.avgChurnRisk}
              color={getRiskColor(analytics.avgChurnRisk)}
            />
            <div style={{ marginTop: '16px' }}>
              <ProgressBar value={analytics.avgChurnRisk} max={10} color={getRiskColor(analytics.avgChurnRisk)} />
            </div>
          </AnalyticsCard>
        </div>
      </section>

      {/* Growth Opportunities */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Growth Opportunities</h2>
        <div style={styles.cardGrid}>
          <AnalyticsCard title="Upsell Potential" variant="info">
            <Stat
              label="Average Upsell Score"
              value={analytics.avgUpsellPotential}
              color="#3b82f6"
            />
            <div style={{ marginTop: '16px' }}>
              <ProgressBar value={analytics.avgUpsellPotential} max={10} color="#3b82f6" />
            </div>
          </AnalyticsCard>

          <AnalyticsCard title="Budget Discussion">
            {Object.entries(analytics.budgetDiscussed).map(([key, count], idx) => (
              <div key={idx} style={styles.listItem}>
                <BilingualText text={key} style={{ fontSize: '14px' }} />
                <Badge text={count} color="#8b5cf6" />
              </div>
            ))}
          </AnalyticsCard>

          <AnalyticsCard title="Decision Maker Present">
            {Object.entries(analytics.decisionMaker).map(([key, count], idx) => (
              <div key={idx} style={styles.listItem}>
                <BilingualText text={key} style={{ fontSize: '14px' }} />
                <Badge text={count} color="#ec4899" />
              </div>
            ))}
          </AnalyticsCard>
        </div>
      </section>

      {/* Next Steps */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Next Steps & Follow-up</h2>
        <div style={styles.cardGrid}>
          <AnalyticsCard title="Follow-up Status">
            {Object.entries(analytics.followUpNeeded).map(([key, count], idx) => (
              <div key={idx} style={styles.listItem}>
                <BilingualText text={key} style={{ fontSize: '14px' }} />
                <Badge text={count} color="#06b6d4" />
              </div>
            ))}
          </AnalyticsCard>
        </div>
      </section>

      {/* Key Insights */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Key Insights</h2>
        <div style={styles.cardGrid}>
          <AnalyticsCard title="Most Common Key Points">
            {analytics.topKeyPoints.length > 0 ? (
              analytics.topKeyPoints.map((point, idx) => (
                <div key={idx} style={styles.listItem}>
                  <BilingualText text={point.item} style={{ fontSize: '14px', flex: 1 }} />
                  <Badge text={point.count} color="#6366f1" />
                </div>
              ))
            ) : (
              <p style={styles.noData}>No key points</p>
            )}
          </AnalyticsCard>

          <AnalyticsCard title="Top Risks">
            {analytics.topRisks.length > 0 ? (
              analytics.topRisks.map((risk, idx) => (
                <div key={idx} style={styles.listItem}>
                  <BilingualText text={risk.item} style={{ fontSize: '14px', flex: 1 }} />
                  <Badge text={risk.count} color="#dc2626" />
                </div>
              ))
            ) : (
              <p style={styles.noData}>No risks identified</p>
            )}
          </AnalyticsCard>

          <AnalyticsCard title="Top Opportunities">
            {analytics.topOpportunities.length > 0 ? (
              analytics.topOpportunities.map((opp, idx) => (
                <div key={idx} style={styles.listItem}>
                  <BilingualText text={opp.item} style={{ fontSize: '14px', flex: 1 }} />
                  <Badge text={opp.count} color="#10b981" />
                </div>
              ))
            ) : (
              <p style={styles.noData}>No opportunities identified</p>
            )}
          </AnalyticsCard>
        </div>
      </section>

      {/* Signals */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Customer Signals</h2>
        <div style={styles.cardGrid}>
          <AnalyticsCard title="Top Positive Signals" variant="success">
            {analytics.topPositiveSignals.length > 0 ? (
              analytics.topPositiveSignals.map((signal, idx) => (
                <div key={idx} style={styles.listItem}>
                  <BilingualText text={signal.item} style={{ fontSize: '14px', flex: 1 }} />
                  <Badge text={signal.count} color="#10b981" />
                </div>
              ))
            ) : (
              <p style={styles.noData}>No positive signals</p>
            )}
          </AnalyticsCard>

          <AnalyticsCard title="Top Negative Signals" variant="danger">
            {analytics.topNegativeSignals.length > 0 ? (
              analytics.topNegativeSignals.map((signal, idx) => (
                <div key={idx} style={styles.listItem}>
                  <BilingualText text={signal.item} style={{ fontSize: '14px', flex: 1 }} />
                  <Badge text={signal.count} color="#ef4444" />
                </div>
              ))
            ) : (
              <p style={styles.noData}>No negative signals</p>
            )}
          </AnalyticsCard>
        </div>
      </section>

      {/* Confidence */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Analysis Quality</h2>
        <div style={styles.cardGrid}>
          <AnalyticsCard title="Analysis Confidence">
            <Stat
              label="Average Confidence"
              value={`${analytics.avgConfidence}%`}
              color="#6366f1"
            />
            <div style={{ marginTop: '16px' }}>
              <ProgressBar value={analytics.avgConfidence} max={100} color="#6366f1" />
            </div>
          </AnalyticsCard>
        </div>
      </section>

      {/* Recent Calls */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Recent Calls</h2>
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={styles.tableHeader}>Satisfaction</th>
                <th style={styles.tableHeader}>Mood</th>
                <th style={styles.tableHeader}>Churn Risk</th>
                <th style={styles.tableHeader}>Upsell Potential</th>
                <th style={styles.tableHeader}>Main Takeaway</th>
              </tr>
            </thead>
            <tbody>
              {agentRecords.slice(0, 10).map((record, idx) => (
                <tr key={idx} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    <span style={{ color: getSatisfactionColor(record.satisfaction_level) }}>
                      {record.satisfaction_level || 'N/A'}
                    </span>
                  </td>
                  <td style={styles.tableCell}>
                    <BilingualText text={record.mood || 'N/A'} style={{ fontSize: '14px' }} />
                  </td>
                  <td style={styles.tableCell}>
                    <span style={{ color: getRiskColor(record.churn_risk) }}>
                      {record.churn_risk || 'N/A'}
                    </span>
                  </td>
                  <td style={styles.tableCell}>{record.upsell_potential || 'N/A'}</td>
                  <td style={styles.tableCell}>
                    <BilingualText text={record.main_takeaway || 'N/A'} style={{ fontSize: '14px' }} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
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
    transition: 'background 0.2s',
  },
  refreshButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  titleSection: {
    marginBottom: '32px',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  label: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '8px',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    gap: '12px',
  },
  noData: {
    color: '#9ca3af',
    fontStyle: 'italic',
    margin: '0',
  },
  tableContainer: {
    overflowX: 'auto',
    background: 'white',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeaderRow: {
    background: '#f9fafb',
  },
  tableHeader: {
    padding: '12px 16px',
    textAlign: 'left',
    fontSize: '12px',
    fontWeight: '700',
    color: '#6b7280',
    textTransform: 'uppercase',
    borderBottom: '1px solid #e5e7eb',
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
  },
  tableCell: {
    padding: '12px 16px',
    fontSize: '14px',
    color: '#374151',
  },
};

export default AgentDashboard;
