// src/pages/AgentDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Phone, Search, Filter } from 'lucide-react';
import { useGetAgentKpisQuery, useGetAgentStatsQuery } from '@/features/kpis/kpisApiSlice';
import CallDetailModal from '@/components/agent/CallDetailModal';

const AgentDetail = () => {
  const { agentName } = useParams();
  const navigate = useNavigate();
  const [selectedCall, setSelectedCall] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');

  // Fetch agent calls
  const {
    data: agentKpis,
    isLoading: kpisLoading,
    error: kpisError
  } = useGetAgentKpisQuery(agentName, {
    skip: !agentName
  });

  // Fetch agent statistics
  const {
    data: agentStats,
    isLoading: statsLoading
  } = useGetAgentStatsQuery(agentName, {
    skip: !agentName
  });

  const handleBack = () => {
    navigate('/dashboard');
  };

  const handleSelectCall = (call) => {
    setSelectedCall(call);
  };

  const getPriorityBadge = (call) => {
    const data = call.message || call;
    const isHighRisk = data.high_risk?.is_high_risk;
    const qualityScore = (data.call_quality_metrics?.call_structure?.structure_score || 0) / 20;
    
    if (isHighRisk) {
      return { label: 'Critical', color: 'bg-red-500', icon: '🔴' };
    }
    if (qualityScore >= 4) {
      return { label: 'Low', color: 'bg-blue-500', icon: '🔵' };
    }
    if (qualityScore >= 3) {
      return { label: 'Medium', color: 'bg-orange-500', icon: '🟠' };
    }
    return { label: 'High', color: 'bg-amber-500', icon: '🟡' };
  };

  const getStatusBadge = (call) => {
    const data = call.message || call;
    const resolutionStatus = data.call_summary?.resolution_status;
    
    if (resolutionStatus === 'resolved') {
      return { label: 'On Track', color: 'bg-green-100 text-green-700 border-green-200' };
    }
    if (resolutionStatus === 'partially_resolved') {
      return { label: 'In Progress', color: 'bg-orange-100 text-orange-700 border-orange-200' };
    }
    return { label: 'Pending', color: 'bg-purple-100 text-purple-700 border-purple-200' };
  };

  const getTrackingBadge = (call) => {
    const data = call.message || call;
    const isHighRisk = data.high_risk?.is_high_risk;
    
    if (isHighRisk) {
      return { label: 'At Risk', color: 'bg-amber-100 text-amber-700 border-amber-200' };
    }
    return { label: 'On Track', color: 'bg-green-100 text-green-700 border-green-200' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

  const calls = agentKpis || [];
  const filteredCalls = calls.filter(call => {
    const data = call.message || call;
    const problem = data.call_summary?.problem || '';
    const matchesSearch = problem.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'All' || getStatusBadge(call).label === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <LayoutDashboard className="w-4 h-4" />
            Go to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
              <span className="text-lg font-semibold text-white">
                {agentName?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{agentName}</h1>
              <p className="text-sm text-gray-600">{calls.length} total calls</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Calls List */}
        <div className={`${selectedCall ? 'w-96' : 'flex-1'} bg-white border-r border-gray-200 flex flex-col transition-all duration-300`}>
          {/* Search and Filters */}
          <div className="p-4 border-b border-gray-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search calls..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option>All</option>
                <option>On Track</option>
                <option>In Progress</option>
                <option>Pending</option>
                <option>At Risk</option>
              </select>
            </div>
          </div>

          {/* Calls List */}
          <div className="flex-1 overflow-y-auto">
            {kpisLoading ? (
              <div className="p-4 space-y-3">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
                    <div className="h-4 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-2/3" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {filteredCalls.map((call, index) => {
                  const data = call.message || call;
                  const priority = getPriorityBadge(call);
                  const status = getStatusBadge(call);
                  const tracking = getTrackingBadge(call);
                  const problem = data.call_summary?.problem || 'No description';
                  const callType = data.call_type_classification?.call_type || 'General';
                  const callId = `T${String(index + 1).padStart(3, '0')}`;

                  return (
                    <button
                      key={call._id || index}
                      onClick={() => handleSelectCall(call)}
                      className={`w-full text-left p-4 rounded-lg border transition-all ${
                        selectedCall?._id === call._id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm bg-white'
                      }`}
                    >
                      {/* Priority & Status Badges */}
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`${priority.color} text-white text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1`}>
                          {priority.icon} {priority.label}
                        </span>
                        <span className={`${status.color} text-xs font-medium px-2 py-0.5 rounded border`}>
                          {status.label}
                        </span>
                        <span className="ml-auto text-xs text-gray-500 font-mono">{callId}</span>
                      </div>

                      {/* Title */}
                      <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2" dir="rtl">
                        {problem}
                      </h3>

                      {/* Customer/Type */}
                      <p className="text-xs text-gray-600 mb-2">{callType}</p>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Phone className="w-3 h-3" />
                          {formatDate(data.key_call_details?.call_date)}
                        </div>
                        <span className={`${tracking.color} text-xs font-medium px-2 py-0.5 rounded border`}>
                          {tracking.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedCall && (
          <div className="flex-1 bg-gray-50 overflow-y-auto">
            <CallDetailModal 
              call={selectedCall} 
              onClose={() => setSelectedCall(null)}
              isEmbedded={true}
            />
          </div>
        )}

        {/* Empty State */}
        {!selectedCall && (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <Phone className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Call</h3>
              <p className="text-gray-600">Choose a call from the list to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDetail;