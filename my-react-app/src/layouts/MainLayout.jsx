import React, { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import useGoogleSheetData from '../useGoogleSheetData';
import { isArabic, calculateAverage, getRiskColor, getSatisfactionColor } from '../utils';
import { useLogoutMutation } from '../features/auth/authApiSlice';

/**
 * Sidebar Component with Agent List
 */
const Sidebar = ({ agents, selectedAgent, onSelectAgent, onShowDashboard, onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div style={{
      ...styles.sidebar,
      width: isCollapsed ? '70px' : '280px',
    }}>
      {/* Header */}
      <div style={styles.sidebarHeader}>
        {!isCollapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <img 
              src="/arabicompanylogo.png" 
              alt="Arabic Company Logo" 
              style={{ width: '48px', height: '48px', objectFit: 'contain' }}
            />
            <h2 style={styles.sidebarTitle}>Call Analytics</h2>
          </div>
        )}
        {isCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <img 
              src="/arabicompanylogo.png" 
              alt="Arabic Company Logo" 
              style={{ width: '36px', height: '36px', objectFit: 'contain' }}
            />
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          style={styles.collapseButton}
          title={isCollapsed ? 'Expand' : 'Collapse'}
        >
          {isCollapsed ? '☰' : '←'}
        </button>
      </div>

      {/* Dashboard Button */}
      <button
        onClick={onShowDashboard}
        style={{
          ...styles.agentItem,
          background: !selectedAgent ? '#3b82f6' : 'transparent',
          color: !selectedAgent ? 'white' : '#374151',
        }}
      >
        {!isCollapsed ? (
          <>
            <div style={styles.agentIcon}>📊</div>
            <div style={styles.agentInfo}>
              <div style={styles.agentName}>Dashboard</div>
            </div>
          </>
        ) : (
          <div style={styles.agentIcon}>📊</div>
        )}
      </button>

      {/* Agents List */}
      <div style={styles.agentsList}>
        {!isCollapsed && (
          <div style={styles.sectionLabel}>AGENTS</div>
        )}
        {agents.map((agent) => (
          <button
            key={agent.name}
            onClick={() => onSelectAgent(agent.name)}
            style={{
              ...styles.agentItem,
              background: selectedAgent === agent.name ? '#eff6ff' : 'transparent',
              borderLeft: selectedAgent === agent.name ? '3px solid #3b82f6' : '3px solid transparent',
            }}
            title={isCollapsed ? agent.name : ''}
          >
            {!isCollapsed ? (
              <>
                <div style={styles.agentIcon}>👤</div>
                <div style={styles.agentInfo}>
                  <div style={styles.agentName}>{agent.name}</div>
                  <div style={styles.agentStats}>
                    {agent.callCount} calls • {agent.avgSatisfaction}★
                  </div>
                </div>
              </>
            ) : (
              <div style={styles.agentIcon}>👤</div>
            )}
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <div style={styles.logoutSection}>
        <button
          onClick={onLogout}
          style={styles.logoutButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#b91c1c';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#dc2626';
          }}
          title="Logout"
        >
          {!isCollapsed ? (
            <>
              <div style={styles.logoutIcon}>🚪</div>
              <div style={styles.logoutText}>Logout</div>
            </>
          ) : (
            <div style={styles.logoutIcon}>🚪</div>
          )}
        </button>
      </div>
    </div>
  );
};

/**
 * Call Card - Summary view of a single call
 */
const CallCard = ({ call, callIndex, onClick }) => {
  const summaryText = call['Call Summary'] || call['call_summary'] || call['main_takeaway'] || 'No summary available';
  const isSummaryArabic = isArabic(summaryText);

  return (
    <div
      onClick={onClick}
      style={styles.callCard}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Header */}
      <div style={styles.callCardHeader}>
        <div style={styles.callCardBadge}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: getSatisfactionColor(call.satisfaction_level),
            display: 'inline-block',
            marginRight: '8px',
          }}></span>
          Call #{callIndex + 1}
        </div>
        <div style={styles.callCardDate}>
          {call.call_date ? new Date(call.call_date).toLocaleDateString() : 'Recent'}
        </div>
      </div>

      {/* Summary */}
      <div
        style={{
          ...styles.callCardSummary,
          direction: isSummaryArabic ? 'rtl' : 'ltr',
          textAlign: isSummaryArabic ? 'right' : 'left',
        }}
      >
        {summaryText}
      </div>

      {/* Metrics Grid */}
      <div style={styles.callCardMetrics}>
        <div style={styles.metricItem}>
          <div style={styles.metricLabel}>Satisfaction</div>
          <div style={{
            ...styles.metricValue,
            color: getSatisfactionColor(call.satisfaction_level),
          }}>
            {call.satisfaction_level || 'N/A'}
          </div>
        </div>
        <div style={styles.metricItem}>
          <div style={styles.metricLabel}>Churn Risk</div>
          <div style={{
            ...styles.metricValue,
            color: getRiskColor(call.churn_risk),
          }}>
            {call.churn_risk || 'N/A'}
          </div>
        </div>
        <div style={styles.metricItem}>
          <div style={styles.metricLabel}>Upsell</div>
          <div style={{
            ...styles.metricValue,
            color: parseFloat(call.upsell_potential) >= 7 ? '#10b981' : '#6b7280',
          }}>
            {call.upsell_potential || 'N/A'}
          </div>
        </div>
        <div style={styles.metricItem}>
          <div style={styles.metricLabel}>Engagement</div>
          <div style={styles.metricValue}>
            {call.engagement_level || 'N/A'}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.callCardFooter}>
        <div style={{
          ...styles.moodBadge,
          direction: isArabic(call.mood) ? 'rtl' : 'ltr',
        }}>
          {call.mood || 'Neutral'}
        </div>
        <div style={styles.viewDetailsLink}>
          View Details →
        </div>
      </div>
    </div>
  );
};

/**
 * Dashboard Overview Component
 */
const DashboardOverview = ({ agents, data, basePath }) => {
  const navigate = useNavigate();

  const globalStats = useMemo(() => {
    const avgSatisfaction = calculateAverage(data.allRecords, 'satisfaction_level');
    const avgChurnRisk = calculateAverage(data.allRecords, 'churn_risk');
    const highUpsell = data.allRecords.filter(r => parseFloat(r.upsell_potential) >= 7).length;
    const avgEngagement = calculateAverage(data.allRecords, 'engagement_level');

    return {
      totalCalls: data.allRecords.length,
      avgSatisfaction: parseFloat(avgSatisfaction),
      avgChurnRisk: parseFloat(avgChurnRisk),
      highUpsell,
      avgEngagement: parseFloat(avgEngagement),
    };
  }, [data.allRecords]);

  return (
    <div style={styles.dashboardContent}>
      {/* Global Stats */}
      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>📊</div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>Total Calls</div>
            <div style={styles.statValue}>{globalStats.totalCalls}</div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⭐</div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>Avg Satisfaction</div>
            <div style={{
              ...styles.statValue,
              color: getSatisfactionColor(globalStats.avgSatisfaction),
            }}>
              {globalStats.avgSatisfaction}
            </div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>⚠️</div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>Avg Churn Risk</div>
            <div style={{
              ...styles.statValue,
              color: getRiskColor(globalStats.avgChurnRisk),
            }}>
              {globalStats.avgChurnRisk}
            </div>
          </div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statIcon}>💰</div>
          <div style={styles.statContent}>
            <div style={styles.statLabel}>Upsell Opportunities</div>
            <div style={{ ...styles.statValue, color: '#10b981' }}>
              {globalStats.highUpsell}
            </div>
          </div>
        </div>
      </div>

      {/* Agents Grid */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Agent Performance</h2>
        <div style={styles.agentsGrid}>
          {agents.map((agent) => (
            <div
              key={agent.name}
              onClick={() => navigate(`${basePath}/agent/${encodeURIComponent(agent.name)}`)}
              style={styles.agentCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div style={styles.agentCardHeader}>
                <div style={styles.agentAvatar}>👤</div>
                <div style={styles.agentCardName}>{agent.name}</div>
              </div>
              <div style={styles.agentCardStats}>
                <div style={styles.agentCardStat}>
                  <span style={styles.agentCardStatLabel}>Calls:</span>
                  <span style={styles.agentCardStatValue}>{agent.callCount}</span>
                </div>
                <div style={styles.agentCardStat}>
                  <span style={styles.agentCardStatLabel}>Rating:</span>
                  <span style={{
                    ...styles.agentCardStatValue,
                    color: getSatisfactionColor(agent.avgSatisfaction),
                  }}>
                    {agent.avgSatisfaction}★
                  </span>
                </div>
              </div>
              <div style={styles.viewAgentLink}>View Agent Details →</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Layout Component
 */
const MainLayout = () => {
  const navigate = useNavigate();
  const { agentName } = useParams();
  const { role } = useSelector((state) => state.auth); // Get user role from Redux
  const { data, loading, error, lastUpdated, refresh } = useGoogleSheetData();
  const [logout] = useLogoutMutation();
  const [selectedAgent, setSelectedAgent] = useState(agentName ? decodeURIComponent(agentName) : null);

  // Determine base path based on role
  const basePath = role === 'admin' ? '/admin' : '/agent';

  // Sync selected agent with URL
  React.useEffect(() => {
    if (agentName) {
      setSelectedAgent(decodeURIComponent(agentName));
    } else {
      setSelectedAgent(null);
    }
  }, [agentName]);

  // Prepare agents list
  const agentsList = useMemo(() => {
    return Object.entries(data.agents).map(([name, records]) => ({
      name,
      callCount: records.length,
      avgSatisfaction: calculateAverage(records, 'satisfaction_level'),
    })).sort((a, b) => b.callCount - a.callCount);
  }, [data.agents]);

  // Get current agent's calls
  const currentCalls = useMemo(() => {
    if (!selectedAgent) return [];
    return data.agents[selectedAgent] || [];
  }, [data.agents, selectedAgent]);

  const handleSelectAgent = (agentName) => {
    setSelectedAgent(agentName);
    navigate(`${basePath}/agent/${encodeURIComponent(agentName)}`);
  };

  const handleShowDashboard = () => {
    setSelectedAgent(null);
    navigate(`${basePath}/dashboard`);
  };

  const handleCallClick = (call, index) => {
    navigate(`${basePath}/agent/${encodeURIComponent(selectedAgent)}/call/${index}`);
  };

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, redirect to login
      navigate('/login');
    }
  };

  if (loading && !lastUpdated) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading call data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <h2 style={styles.errorTitle}>Error Loading Data</h2>
        <p style={styles.errorMessage}>{error}</p>
        <button onClick={refresh} style={styles.retryButton}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Sidebar */}
      <Sidebar
        agents={agentsList}
        selectedAgent={selectedAgent}
        onSelectAgent={handleSelectAgent}
        onShowDashboard={handleShowDashboard}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.pageTitle}>
              {selectedAgent ? selectedAgent : 'Dashboard Overview'}
            </h1>
            <p style={styles.pageSubtitle}>
              {selectedAgent 
                ? `${currentCalls.length} calls • Last updated: ${lastUpdated?.toLocaleTimeString()}`
                : `${data.allRecords.length} total calls • ${agentsList.length} agents`
              }
            </p>
          </div>
          <button
            onClick={refresh}
            style={styles.refreshButton}
            disabled={loading}
          >
            {loading ? '↻ Refreshing...' : '↻ Refresh'}
          </button>
        </div>

        {/* Content Area */}
        {selectedAgent ? (
          <div style={styles.callsGrid}>
            {currentCalls.length > 0 ? (
              currentCalls.map((call, index) => (
                <CallCard
                  key={index}
                  call={call}
                  callIndex={index}
                  onClick={() => handleCallClick(call, index)}
                />
              ))
            ) : (
              <div style={styles.emptyState}>
                <div style={styles.emptyIcon}>📞</div>
                <h3 style={styles.emptyTitle}>No Calls Found</h3>
                <p style={styles.emptyText}>
                  This agent doesn't have any recorded calls yet.
                </p>
              </div>
            )}
          </div>
        ) : (
          <DashboardOverview agents={agentsList} data={data} basePath={basePath} />
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    minHeight: '100vh',
    background: '#f9fafb',
  },
  sidebar: {
    background: 'white',
    borderRight: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    transition: 'width 0.3s ease',
    position: 'sticky',
    top: 0,
    height: '100vh',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  sidebarHeader: {
    padding: '24px 20px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sidebarTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  collapseButton: {
    background: '#f3f4f6',
    border: 'none',
    borderRadius: '6px',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    fontSize: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9ca3af',
    padding: '12px 20px 8px',
    letterSpacing: '0.5px',
  },
  agentsList: {
    flex: 1,
    overflowY: 'auto',
    paddingBottom: '20px',
  },
  agentItem: {
    width: '100%',
    padding: '12px 20px',
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s ease',
    textAlign: 'left',
  },
  agentIcon: {
    fontSize: '24px',
    minWidth: '24px',
  },
  agentInfo: {
    flex: 1,
    minWidth: 0,
  },
  agentName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#111827',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  agentStats: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '2px',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
  },
  header: {
    background: 'white',
    borderBottom: '1px solid #e5e7eb',
    padding: '24px 32px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
    flexWrap: 'wrap',
  },
  pageTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
  },
  pageSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '4px 0 0',
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
    whiteSpace: 'nowrap',
  },
  callsGrid: {
    padding: '32px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: '24px',
    overflowY: 'auto',
  },
  callCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    border: '1px solid #e5e7eb',
  },
  callCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  callCardBadge: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#6b7280',
    display: 'flex',
    alignItems: 'center',
  },
  callCardDate: {
    fontSize: '12px',
    color: '#9ca3af',
  },
  callCardSummary: {
    fontSize: '15px',
    lineHeight: '1.6',
    color: '#374151',
    marginBottom: '16px',
    minHeight: '48px',
    maxHeight: '72px',
    overflow: 'hidden',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
  },
  callCardMetrics: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '16px',
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px',
  },
  metricItem: {
    textAlign: 'center',
  },
  metricLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginBottom: '4px',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#111827',
  },
  callCardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
  },
  moodBadge: {
    background: '#eff6ff',
    color: '#3b82f6',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '500',
  },
  viewDetailsLink: {
    fontSize: '13px',
    color: '#3b82f6',
    fontWeight: '600',
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
  emptyState: {
    gridColumn: '1 / -1',
    textAlign: 'center',
    padding: '64px 24px',
  },
  emptyIcon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '8px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
  },
  dashboardContent: {
    padding: '32px',
    overflowY: 'auto',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: '20px',
    marginBottom: '40px',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
  },
  statIcon: {
    fontSize: '36px',
  },
  statContent: {
    flex: 1,
  },
  statLabel: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '4px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
  },
  section: {
    marginBottom: '40px',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '20px',
  },
  agentsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
  },
  agentCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e5e7eb',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  agentCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  agentAvatar: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#eff6ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
  },
  agentCardName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
  },
  agentCardStats: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
  },
  agentCardStat: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  agentCardStatLabel: {
    fontSize: '13px',
    color: '#6b7280',
  },
  agentCardStatValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
  },
  viewAgentLink: {
    fontSize: '13px',
    color: '#3b82f6',
    fontWeight: '600',
    textAlign: 'center',
    paddingTop: '16px',
    borderTop: '1px solid #f3f4f6',
  },
  logoutSection: {
    padding: '20px',
    borderTop: '1px solid #e5e7eb',
    marginTop: 'auto',
  },
  logoutButton: {
    width: '100%',
    padding: '12px 20px',
    border: 'none',
    background: '#dc2626',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    transition: 'all 0.2s ease',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
  },
  logoutIcon: {
    fontSize: '18px',
    minWidth: '18px',
  },
  logoutText: {
    flex: 1,
    textAlign: 'left',
  },
};

export default MainLayout;
