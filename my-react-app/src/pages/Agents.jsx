// src/pages/Agents.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Phone, 
  Star, 
  Activity, 
  AlertCircle,
  HeadphonesIcon,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { useGetAgentsQuery, useGetAllKpisQuery } from '@/features/kpis/kpisApiSlice';
import CallDetailModal from '@/components/agent/CallDetailModal';
import { formatNumber } from '@/utils/languageUtils';

const StatCard = ({ icon: Icon, title, value, color = 'blue' }) => {
  const colors = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   icon: 'text-blue-600'   },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  icon: 'text-green-600'  },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
  }[color];

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-gray-300 transition-colors">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 ${colors.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-6 h-6 ${colors.icon}`} />
        </div>
        <div>
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
};

const EmptyState = () => (
  <div className="bg-white rounded-lg border border-gray-200 py-16 px-8 text-center">
    <Users className="w-14 h-14 mx-auto text-gray-400 mb-5" strokeWidth={1.5} />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents yet</h3>
    <p className="text-gray-600 max-w-md mx-auto">
      Once agents are added to the system, their performance overview will appear here.
    </p>
  </div>
);

const Agents = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { data: agentsData = [], isLoading, error } = useGetAgentsQuery();
  const { data: allCalls = [], isLoading: callsLoading } = useGetAllKpisQuery({});
  const [selectedCall, setSelectedCall] = useState(null);

  const handleAgentClick = (agentName) => {
    navigate(`/agents/${agentName}`);
  };

  // Process agents data into AI agents format
  const aiAgents = agentsData.map((agent, index) => {
    const colors = ['blue', 'green', 'orange', 'purple', 'indigo'];
    const icons = [HeadphonesIcon, TrendingUp, DollarSign, Phone, Activity];
    const color = colors[index % colors.length];
    const Icon = icons[index % icons.length];
    
    // Get all calls for this agent to calculate metrics
    const agentCalls = allCalls.filter(call => {
      const data = call.message || call;
      const callAgentName = call.agent || data.agent_name;
      return callAgentName === agent.agentName;
    });

    // Calculate success rate based on resolution status and quality metrics
    const successfulCalls = agentCalls.filter(call => {
      const data = call.message || call;
      const resolutionStatus = data.call_summary?.resolution_status;
      const qualityScore = (data.call_quality_metrics?.call_structure?.structure_score || 0) / 20;
      const isHighRisk = data.high_risk?.is_high_risk;
      
      // Consider successful if resolved or partially resolved with good quality and not high risk
      return (
        resolutionStatus === 'resolved' || 
        (resolutionStatus === 'partially_resolved' && qualityScore >= 3.5 && !isHighRisk)
      );
    });
    
    const successRate = agentCalls.length > 0 
      ? Math.round((successfulCalls.length / agentCalls.length) * 100) 
      : 0;
    
    // Calculate average call duration from seconds field
    const totalSeconds = agentCalls.reduce((sum, call) => {
      const data = call.message || call;
      return sum + (data.seconds || call.seconds || 0);
    }, 0);
    
    const avgSeconds = agentCalls.length > 0 ? totalSeconds / agentCalls.length : 0;
    const avgMinutes = Math.floor(avgSeconds / 60);
    const avgSecs = Math.floor(avgSeconds % 60);
    const avgTime = `${avgMinutes}:${String(avgSecs).padStart(2, '0')}`;

    return {
      id: agent._id || index,
      name: agent.agentName,
      description: `Handles ${agent.callCount || 0} total calls with ${agent.avgScore ? agent.avgScore.toFixed(1) : '0'}/5 quality score`,
      icon: Icon,
      color,
      status: (agent.callCount || 0) > 0 ? 'active' : 'idle',
      callsToday: agent.callCount || 0,
      successRate,
      avgTime: avgTime || '0:00'
    };
  });

  // Process recent calls from allCalls data
  const recentCalls = (allCalls || []).slice(0, 5).map((call) => {
    const data = call.message || call;
    const agentName = call.agent || data.agent_name || 'Unknown';
    
    // Extract customer name from transcript
    const getCustomerName = () => {
      const transcript = call.transcript || data.transcript;
      if (Array.isArray(transcript)) {
        const customerEntry = transcript.find(entry => 
          entry.speaker && 
          entry.speaker !== 'agent' && 
          entry.speaker !== 'support_representative'
        );
        return customerEntry ? customerEntry.speaker : 'Customer';
      }
      return 'Customer';
    };
    
    const customerName = getCustomerName();
    const callType = data.call_type_classification?.call_type || 'General';
    const duration = (data.seconds || call.seconds || 0);
    const durationFormatted = `${Math.floor(duration / 60)}:${String(duration % 60).padStart(2, '0')}`;
    
    // Get time from call date
    const callTime = data.key_call_details?.call_start_time 
      ? data.key_call_details.call_start_time.substring(0, 5)
      : '—';
    
    // Determine status
    const resolutionStatus = data.call_summary?.resolution_status;
    let status = 'Success';
    if (resolutionStatus === 'resolved') {
      status = 'Success';
    } else if (resolutionStatus === 'partially_resolved') {
      status = 'Escalated';
    } else if (data.high_risk?.is_high_risk) {
      status = 'Escalated';
    }

    return {
      ...call,
      id: call._id || call.id,
      name: customerName,
      type: callType,
      duration: durationFormatted,
      time: callTime,
      status,
      agent: agentName
    };
  });

  // Derived stats
  const totalAgents = agentsData.length;
  const totalCalls = agentsData.reduce((sum, a) => sum + (a.callCount || 0), 0);
  const avgScore = totalAgents > 0
    ? (agentsData.reduce((sum, a) => sum + (a.avgScore || 0), 0) / totalAgents).toFixed(1)
    : '—';

  if (isLoading || callsLoading) {
    return (
      <div className="space-y-10">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-9 w-40 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-5 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-6 w-28 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-24 bg-gray-200 rounded"></div>
                  <div className="h-8 w-16 bg-gray-200 rounded"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-red-200 p-10 text-center">
        <AlertCircle className="w-14 h-14 mx-auto text-red-500 mb-5" />
        <h2 className="text-xl font-semibold text-gray-900 mb-3">Failed to load agents</h2>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          {error?.data?.message || "We're having trouble connecting to the server right now."}
        </p>
        <button 
          className="px-5 py-2.5 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <h1 className="text-3xl font-bold text-gray-900">AI Voice Agents</h1>
        <p className="mt-1 text-gray-600">Intelligent voice automation for customer interactions</p>
      </div>

      <div className="px-8 py-8 space-y-8">
        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {/* Total Calls */}
          <div className="bg-blue-50 rounded-lg p-5 border border-blue-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                <Phone className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{allCalls.length}</p>
              <p className="text-xs text-blue-700 font-medium">Total Calls</p>
            </div>
          </div>

          {/* Average Quality Score */}
          <div className="bg-green-50 rounded-lg p-5 border border-green-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                <Star className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">
                {allCalls.length > 0 
                  ? (allCalls.reduce((sum, call) => {
                      const data = call.message || call;
                      const score = (data.call_quality_metrics?.call_structure?.structure_score || 0) / 20;
                      return sum + score;
                    }, 0) / allCalls.length).toFixed(1)
                  : '0.0'
                }/5
              </p>
              <p className="text-xs text-green-700 font-medium">Avg Quality</p>
            </div>
          </div>

          {/* Resolution Rate */}
          <div className="bg-purple-50 rounded-lg p-5 border border-purple-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                <CheckCircle2 className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">
                {allCalls.length > 0
                  ? Math.round(
                      (allCalls.filter(call => {
                        const data = call.message || call;
                        return data.call_summary?.resolution_status === 'resolved';
                      }).length / allCalls.length) * 100
                    )
                  : 0
                }%
              </p>
              <p className="text-xs text-purple-700 font-medium">Resolved</p>
            </div>
          </div>

          {/* High Risk Calls */}
          <div className="bg-orange-50 rounded-lg p-5 border border-orange-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-orange-900">
                {allCalls.filter(call => {
                  const data = call.message || call;
                  return data.high_risk?.is_high_risk;
                }).length}
              </p>
              <p className="text-xs text-orange-700 font-medium">High Risk</p>
            </div>
          </div>

          {/* Average Call Duration */}
          <div className="bg-indigo-50 rounded-lg p-5 border border-indigo-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center mb-3">
                <Clock className="w-5 h-5 text-indigo-600" />
              </div>
              <p className="text-2xl font-bold text-indigo-900">
                {allCalls.length > 0
                  ? (() => {
                      const avgSeconds = allCalls.reduce((sum, call) => {
                        const data = call.message || call;
                        return sum + (data.seconds || call.seconds || 0);
                      }, 0) / allCalls.length;
                      const minutes = Math.floor(avgSeconds / 60);
                      const seconds = Math.floor(avgSeconds % 60);
                      return `${minutes}:${String(seconds).padStart(2, '0')}`;
                    })()
                  : '0:00'
                }
              </p>
              <p className="text-xs text-indigo-700 font-medium">Avg Duration</p>
            </div>
          </div>

          {/* Active Agents */}
          <div className="bg-teal-50 rounded-lg p-5 border border-teal-100">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-teal-600" />
              </div>
              <p className="text-2xl font-bold text-teal-900">{agentsData.length}</p>
              <p className="text-xs text-teal-700 font-medium">Active Agents</p>
            </div>
          </div>
        </div>

        {/* AI Agents Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {aiAgents.map((agent) => {
            const Icon = agent.icon;
            const borderColors = {
              blue: 'border-t-blue-500',
              green: 'border-t-green-500',
              orange: 'border-t-orange-500'
            };
            const iconBg = {
              blue: 'bg-blue-100',
              green: 'bg-green-100',
              orange: 'bg-orange-100'
            };
            const iconColor = {
              blue: 'text-blue-600',
              green: 'text-green-600',
              orange: 'text-orange-600'
            };

            return (
              <div
                key={agent.id}
                className={`bg-white rounded-lg border-t-4 ${borderColors[agent.color]} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
                onClick={() => handleAgentClick(agent.name)}
              >
                <div className="p-6">
                  {/* Header with icon and status */}
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 ${iconBg[agent.color]} rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${iconColor[agent.color]}`} />
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      agent.status === 'active' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${
                        agent.status === 'active' ? 'bg-green-500' : 'bg-gray-400'
                      }`}></span>
                      {agent.status}
                    </span>
                  </div>

                  {/* Title and description */}
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{agent.name}</h3>
                  <p className="text-sm text-gray-600 mb-6 line-clamp-2">{agent.description}</p>

                  {/* Metrics */}
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{agent.callsToday}</div>
                      <div className="text-xs text-gray-500">Calls Today</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">{agent.successRate}%</div>
                      <div className="text-xs text-gray-500">Success</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-gray-900">{agent.avgTime}</div>
                      <div className="text-xs text-gray-500">Avg Time</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Agents;