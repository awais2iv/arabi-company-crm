// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Phone, 
  TrendingUp, 
  AlertCircle,
  Users,
  CheckCircle,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useGetWorkOrdersQuery } from '@/features/workOrders/workOrdersApiSlice';
import { useGetAgentsQuery, useGetAllKpisQuery } from '@/features/kpis/kpisApiSlice';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState('all');
  
  // Calculate date range
  const getDateRange = () => {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];
    let startDate;
    
    switch(dateRange) {
      case 'today':
        startDate = endDate;
        break;
      case '7days':
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(now.getDate() - 7);
        startDate = sevenDaysAgo.toISOString().split('T')[0];
        break;
      case '30days':
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        startDate = thirtyDaysAgo.toISOString().split('T')[0];
        break;
      case 'all':
        // For 'all', don't set any date filters
        return { startDate: undefined, endDate: undefined };
      default:
        startDate = '';
    }
    
    return { startDate, endDate };
  };
  
  const { startDate, endDate } = getDateRange();
  
  // Fetch work orders
  const { data: workOrdersData, isLoading: workOrdersLoading } = useGetWorkOrdersQuery({
    page: 1,
    limit: 1000,
    startDate: startDate || undefined,
    endDate: endDate || undefined
  });
  
  // Fetch agent/call data
  const { data: agentsData, isLoading: kpiLoading } = useGetAgentsQuery();
  
  // Fetch high-risk calls
  const { data: highRiskData, isLoading: highRiskLoading } = useGetAllKpisQuery({ highRisk: true });
  
  const workOrders = workOrdersData?.data?.workOrders || workOrdersData?.workOrders || workOrdersData || [];
  const agents = agentsData?.data || agentsData || [];
  const highRiskCalls = highRiskData?.data || highRiskData || [];
  
  // Calculate work order statistics
  const workOrderStats = {
    total: workOrders.length,
    completed: workOrders.filter(wo => wo.workOrderStatus === 'Completed').length,
    pending: workOrders.filter(wo => wo.workOrderStatus === 'Pending').length,
    inProgress: workOrders.filter(wo => ['Quotation', 'Need Tomorrow', 'Follow Up'].includes(wo.workOrderStatus)).length,
    cancelled: workOrders.filter(wo => wo.workOrderStatus === 'Cancelled').length
  };
  
  // Calculate call statistics
  const callStats = {
    totalCalls: agents.reduce((sum, agent) => sum + (agent.callCount || 0), 0),
    totalAgents: agents.length,
    avgQuality: agents.length > 0 
      ? (agents.reduce((sum, agent) => sum + (agent.avgScore || 0), 0) / agents.length).toFixed(1)
      : 0,
    highRiskCount: highRiskCalls.length
  };
  
  // Work order status distribution for bar chart - include all possible statuses
  const allStatuses = [
    'Completed',
    'Quotation',
    'Need Tomorrow',
    'Need S.V',
    'Under Observ.',
    'Pending',
    'S.N.R / Un Comp.',
    'No Body At Site',
    'Cancel / No Need',
    'No Answer',
    'Will Call Later',
    'Need Other Day'
  ];

  // Count occurrences of each status from work orders
  const statusCounts = workOrders.reduce((acc, wo) => {
    const status = wo.workOrderStatus || 'Unknown';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  // Ensure all predefined statuses are included, even if count is 0
  const fullStatusCounts = allStatuses.reduce((acc, status) => {
    acc[status] = statusCounts[status] || 0;
    return acc;
  }, {});

  const statusDistribution = Object.entries(fullStatusCounts)
    .map(([name, value]) => ({
      name,
      value
    }))
    .filter(item => item.value > 0) // Only show statuses with work orders
    .sort((a, b) => b.value - a.value); // Sort by count descending
  
  // Calculate high-risk calls per agent
  const highRiskByAgent = highRiskCalls.reduce((acc, call) => {
    const agent = call.agent || 'Unknown';
    acc[agent] = (acc[agent] || 0) + 1;
    return acc;
  }, {});
  
  // Prepare agent performance data for chart
  const agentPerformance = agents.map(agent => ({
    name: agent.agentName || 'Unknown',
    calls: agent.callCount || 0,
    quality: agent.avgScore || 0
  })).sort((a, b) => b.calls - a.calls);
  
  const StatCard = ({ title, value, icon: Icon, color, onClick, subtitle }) => (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow ${onClick ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back! Here's your performance overview.</p>
        </div>
        
        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="7days">Last 7 Days</option>
            <option value="30days">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Executive KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Work Orders"
          value={workOrderStats.total}
          subtitle={`${workOrderStats.completed} completed`}
          icon={ClipboardList}
          color="blue"
          onClick={() => navigate('/work-orders')}
        />
        <StatCard
          title="Total Calls"
          value={callStats.totalCalls}
          subtitle={`${callStats.totalAgents} agents active`}
          icon={Phone}
          color="green"
          onClick={() => navigate('/agents')}
        />
        <StatCard
          title="Avg Quality Score"
          value={`${callStats.avgQuality}/5`}
          subtitle="Call quality rating"
          icon={TrendingUp}
          color="purple"
        />
        <StatCard
          title="High Risk Alerts"
          value={callStats.highRiskCount}
          subtitle={`${callStats.totalCalls > 0 ? ((callStats.highRiskCount / callStats.totalCalls) * 100).toFixed(1) : 0}% of calls`}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Work Order Status Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Work Order Status</h3>
              <p className="text-sm text-gray-600">Distribution by status</p>
            </div>
            <ClipboardList className="w-5 h-5 text-gray-400" />
          </div>
          
          {workOrdersLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : statusDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={statusDistribution}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45} 
                  textAnchor="end" 
                  height={80}
                  interval={0}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, 'Count']}
                  labelFormatter={(label) => `Status: ${label}`}
                />
                <Bar 
                  dataKey="value" 
                  fill="#3b82f6"
                  name="Work Orders"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No work orders found
            </div>
          )}
        </div>

        {/* Agent Performance */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Agent Performance</h3>
              <p className="text-sm text-gray-600">Top 5 agents by call volume</p>
            </div>
            <Users className="w-5 h-5 text-gray-400" />
          </div>
          
          {kpiLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : agentPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={agentPerformance}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="calls" fill="#3b82f6" name="Total Calls" />
                <Bar yAxisId="right" dataKey="quality" fill="#10b981" name="Avg Quality (0-5)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">
              No agent data available
            </div>
          )}
        </div>
      </div>

      {/* Work Order Details */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Work Order Summary</h3>
            <p className="text-sm text-gray-600">Status breakdown and completion rates</p>
          </div>
          <button
            onClick={() => navigate('/work-orders')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All →
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statusDistribution.slice(0, 8).map((status, index) => {
            // Define colors and icons for different status types
            const getStatusStyle = (statusName) => {
              const name = statusName.toLowerCase();
              if (name.includes('completed') || name.includes('done')) {
                return { bg: 'bg-green-50', text: 'text-green-600', icon: CheckCircle };
              } else if (name.includes('pending') || name.includes('awaiting')) {
                return { bg: 'bg-yellow-50', text: 'text-yellow-600', icon: Clock };
              } else if (name.includes('cancel') || name.includes('closed')) {
                return { bg: 'bg-red-50', text: 'text-red-600', icon: AlertCircle };
              } else {
                return { bg: 'bg-blue-50', text: 'text-blue-600', icon: Activity };
              }
            };

            const style = getStatusStyle(status.name);
            const IconComponent = style.icon;
            const percentage = workOrderStats.total > 0 ? ((status.value / workOrderStats.total) * 100).toFixed(0) : 0;

            // Map text colors to bold colors
            const boldColorMap = {
              'text-green-600': 'text-green-900',
              'text-yellow-600': 'text-yellow-900',
              'text-blue-600': 'text-blue-900',
              'text-red-600': 'text-red-900'
            };
            const boldColor = boldColorMap[style.text] || 'text-gray-900';

            return (
              <div key={status.name} className={`p-4 ${style.bg} rounded-lg`}>
                <div className={`flex items-center gap-2 ${style.text} mb-2`}>
                  <IconComponent className="w-5 h-5" />
                  <span className="text-sm font-medium">{status.name}</span>
                </div>
                <p className={`text-2xl font-bold ${boldColor}`}>
                  {status.value}
                </p>
                <p className={`text-xs ${style.text} mt-1`}>
                  {percentage}% of total
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* High Risk Alerts Section */}
      {!highRiskLoading && highRiskCalls.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">High Risk Alerts</h3>
              <p className="text-sm text-gray-600">Recent calls requiring immediate attention</p>
            </div>
            <button
              onClick={() => navigate('/agents')}
              className="text-sm font-medium text-red-600 hover:text-red-700"
            >
              View All →
            </button>
          </div>
          
          <div className="space-y-4">
            {highRiskCalls.slice(0, 3).map((call, index) => (
              <div 
                key={index}
                className="p-4 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors cursor-pointer"
                onClick={() => navigate(`/agents/${call.agent}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-red-600">
                          {(call.agent || 'A').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">Agent: {call.agent || 'Unknown'}</h4>
                        <p className="text-xs text-gray-500">
                          {(() => {
                            // Try multiple date sources in order of preference
                            let dateValue = null;
                            
                            // 1. Try createdAt field
                            if (call.createdAt) {
                              dateValue = call.createdAt;
                            }
                            // 2. Try nested call_date
                            else if (call.message?.key_call_details?.call_date) {
                              dateValue = call.message.key_call_details.call_date;
                            }
                            // 3. Try extracting from MongoDB ObjectId
                            else if (call._id) {
                              try {
                                // MongoDB ObjectId contains timestamp in first 8 characters (hex)
                                const timestamp = parseInt(call._id.toString().substring(0, 8), 16) * 1000;
                                dateValue = new Date(timestamp);
                              } catch (e) {
                                console.warn('Failed to extract date from ObjectId:', call._id);
                              }
                            }
                            
                            // Parse and format the date
                            if (dateValue) {
                              try {
                                const date = new Date(dateValue);
                                // Check if date is valid
                                if (!isNaN(date.getTime())) {
                                  return date.toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  });
                                }
                              } catch (e) {
                                console.warn('Failed to parse date:', dateValue, e);
                              }
                            }
                            
                            return 'Unknown date';
                          })()}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      {call.message?.call_summary?.problem || 'High risk call detected'}
                    </p>
                    {call.message?.high_risk?.risk_reasons && (
                      <div className="mt-2">
                        <p className="text-xs text-red-600 font-medium">Risk factors:</p>
                        <ul className="text-xs text-red-600 mt-1">
                          {call.message.high_risk.risk_reasons.slice(0, 2).map((reason, idx) => (
                            <li key={idx}>• {reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      High Risk
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Agent Cards Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Agents</h3>
            <p className="text-sm text-gray-600">Based on call quality and volume</p>
          </div>
          <button
            onClick={() => navigate('/agents')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All →
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {agents.slice(0, 3).map((agent, index) => (
            <div 
              key={index}
              className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              onClick={() => navigate(`/agents/${agent.agentName}`)}
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-blue-600">
                    {(agent.agentName || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{agent.agentName || 'Unknown'}</h4>
                  <p className="text-xs text-gray-500">{agent.callCount || 0} calls</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Quality Score</span>
                  <span className="font-medium text-gray-900">{(agent.avgScore || 0).toFixed(1)}/5</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">High Risk</span>
                  <span className={`font-medium ${highRiskByAgent[agent.agentName] > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {highRiskByAgent[agent.agentName] || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => navigate('/work-orders')}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
          >
            Manage Work Orders
          </button>
          <button
            onClick={() => navigate('/agents')}
            className="px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium text-sm"
          >
            View All Agents
          </button>
          <button
            onClick={() => navigate('/work-orders')}
            className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-lg hover:bg-white/20 transition-colors font-medium text-sm"
          >
            Export Reports
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;