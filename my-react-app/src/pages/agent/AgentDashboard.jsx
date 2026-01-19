// src/pages/agent/AgentDashboard.jsx - Professional Agent Dashboard
import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, CheckCircle, XCircle, TrendingUp, TrendingDown, Phone, Clock } from 'lucide-react';
import { useGetAgentsQuery, useGetAgentKpisQuery, useGetAgentStatsQuery } from '@/features/kpis/kpisApiSlice';
import CallDetailModal from '@/components/agent/CallDetailModal';
import KpiSummaryCards from '@/components/agent/KpiSummaryCards';
import CallsList from '@/components/agent/CallsList';
import AgentSelector from '@/components/agent/AgentSelector';

const AgentDashboard = () => {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedCall, setSelectedCall] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');

  // Fetch agents list
  const { data: agents, isLoading: agentsLoading } = useGetAgentsQuery();
  
  console.log('=== FRONTEND AGENTS DATA ===');
  console.log('Agents loading:', agentsLoading);
  console.log('Agents data:', agents);
  console.log('=============================');

  // Fetch selected agent's KPIs
  const { 
    data: agentKpis, 
    isLoading: kpisLoading,
    error: kpisError 
  } = useGetAgentKpisQuery(selectedAgent?.agentName, {
    skip: !selectedAgent?.agentName
  });

  console.log('=== FRONTEND AGENT KPIS DATA ===');
  console.log('Selected agent:', selectedAgent);
  console.log('KPIs loading:', kpisLoading);
  console.log('KPIs error:', kpisError);
  console.log('KPIs data:', agentKpis);
  console.log('================================');

  // Fetch agent statistics
  const { 
    data: agentStats, 
    isLoading: statsLoading 
  } = useGetAgentStatsQuery(selectedAgent?.agentName, {
    skip: !selectedAgent?.agentName
  });

  console.log('=== FRONTEND AGENT STATS DATA ===');
  console.log('Stats loading:', statsLoading);
  console.log('Stats data:', agentStats);
  console.log('==================================');

  // Filter calls based on search and filters
  const filteredCalls = React.useMemo(() => {
    if (!agentKpis || !Array.isArray(agentKpis)) return [];

    let filtered = [...agentKpis];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(call =>
        call.call_summary?.main_problem?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        call.call_summary?.call_story?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(call => {
        const callDate = new Date(call.key_call_details?.call_date);
        switch (dateFilter) {
          case 'today':
            return callDate.toDateString() === now.toDateString();
          case 'week':
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return callDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            return callDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(call =>
        statusFilter === 'resolved'
          ? call.operational_signals?.first_call_resolution
          : !call.operational_signals?.first_call_resolution
      );
    }

    // Risk filter
    if (riskFilter !== 'all') {
      filtered = filtered.filter(call => {
        const isHighRisk = call.high_risk?.is_high_risk;
        return riskFilter === 'high' ? isHighRisk : !isHighRisk;
      });
    }

    return filtered;
  }, [agentKpis, searchTerm, dateFilter, statusFilter, riskFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor agent performance and call analytics
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <Clock className="inline w-4 h-4 mr-1" />
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Agent Selection */}
          <div className="lg:col-span-1">
            <AgentSelector
              agents={agents || []}
              selectedAgent={selectedAgent}
              onSelectAgent={setSelectedAgent}
              isLoading={agentsLoading}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedAgent ? (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                <Phone className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select an Agent
                </h3>
                <p className="text-gray-500">
                  Choose an agent from the list to view their call records and performance metrics
                </p>
              </div>
            ) : (
              <>
                {/* Summary Cards */}
                <KpiSummaryCards 
                  stats={agentStats?.data}
                  isLoading={statsLoading}
                />

                {/* Filters Bar */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search calls..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Date Filter */}
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">Last 7 Days</option>
                      <option value="month">Last 30 Days</option>
                    </select>

                    {/* Status Filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Status</option>
                      <option value="resolved">Resolved</option>
                      <option value="unresolved">Unresolved</option>
                    </select>

                    {/* Risk Filter */}
                    <select
                      value={riskFilter}
                      onChange={(e) => setRiskFilter(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="all">All Risks</option>
                      <option value="high">High Risk</option>
                      <option value="low">Low Risk</option>
                    </select>
                  </div>
                </div>

                {/* Calls List */}
                <CallsList
                  calls={filteredCalls}
                  isLoading={kpisLoading}
                  error={kpisError}
                  onSelectCall={setSelectedCall}
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <CallDetailModal
          call={selectedCall}
          onClose={() => setSelectedCall(null)}
        />
      )}
    </div>
  );
};

export default AgentDashboard;
