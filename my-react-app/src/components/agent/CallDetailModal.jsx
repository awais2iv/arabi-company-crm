// src/components/agent/CallDetailModal.jsx
import React, { useState } from 'react';
import { 
  X, Phone, Clock, User, CheckCircle2, XCircle, AlertTriangle, 
  FileText, BarChart3, Heart, MessageSquare, AlertCircle, Target, 
  Headphones, BookOpen, Play
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import AudioPlayer from '../common/AudioPlayer';

const CallDetailModal = ({ call, onClose, isEmbedded = false }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!call) return null;

  // Normalize data access
  const data = call.message || call;
  const agentName = call.agent || data.agent_name || 'Unknown Agent';
  
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

  // Extract creation date from MongoDB _id
  const getCreationDate = () => {
    const id = call._id || data._id;
    if (id) {
      // MongoDB ObjectId timestamp is in the first 8 characters (4 bytes)
      const timestamp = parseInt(id.substring(0, 8), 16) * 1000;
      return new Date(timestamp);
    }
    // Fallback to createdAt field if exists
    if (call.createdAt) return new Date(call.createdAt);
    if (data.createdAt) return new Date(data.createdAt);
    return null;
  };

  const creationDate = getCreationDate();

  const formatDate = (dateStr) => 
    dateStr ? new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric' 
    }) : '—';

  const formatTime = (timeStr) => 
    timeStr ? new Date(`1970-01-01T${timeStr}`).toLocaleTimeString('en-US', { 
      hour: 'numeric', minute: '2-digit', hour12: true 
    }) : '—';
  
  const formatDateTime = (date) => {
    if (!date) return '—';
    return date.toLocaleDateString('en-US', { 
      month: 'long', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    });
  };

  const tabs = [
    { id: 'overview',    label: 'Overview',     icon: FileText       },
    { id: 'metrics',     label: 'Quality',      icon: BarChart3      },
    { id: 'empathy',     label: 'Empathy',      icon: Heart          },
    { id: 'transcript',  label: 'Transcript',   icon: MessageSquare  },
    { id: 'recording',   label: 'Recording',    icon: Play           },
  ];

  const qualityScore = Math.round((data.call_quality_metrics?.call_structure?.structure_score || 0) / 20 * 10) / 10;

  const getStatusBadge = () => {
    const resolutionStatus = data.call_summary?.resolution_status;
    if (resolutionStatus === 'resolved') {
      return { label: 'On Track', color: 'bg-green-500' };
    }
    if (resolutionStatus === 'partially_resolved') {
      return { label: 'In Progress', color: 'bg-orange-500' };
    }
    return { label: 'Pending', color: 'bg-purple-500' };
  };

  const status = getStatusBadge();

  const content = (
    <>
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className={`${status.color} text-white text-sm font-semibold px-3 py-1 rounded`}>
              {status.label}
            </span>
            <span className="text-sm text-gray-500">
              {data.call_type_classification?.call_type || 'General'}
            </span>
          </div>
          {!isEmbedded && (
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <h2 className="text-xl font-bold text-gray-900 mb-4" dir="rtl">
          {data.call_summary?.problem || 'Call Details'}
        </h2>

        {/* Customer & Agent Info */}
        <div className="grid grid-cols-2 gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Customer</div>
              <div className="font-medium text-gray-900">
                {customerName}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="text-xs text-gray-500">Assigned To</div>
              <div className="font-medium text-gray-900">{agentName}</div>
            </div>
          </div>
        </div>

        {/* Category & Deadline */}
        <div className="grid grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500 mb-1">Category</div>
            <div className="font-medium text-gray-900">
              {data.call_type_classification?.call_type || 'General'}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">Call Date</div>
            <div className="font-medium text-gray-900">
              {formatDateTime(creationDate)}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 bg-gray-50/70">
        <div className="px-6 flex gap-1 overflow-x-auto scrollbar-thin">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all
                    border-b-2 whitespace-nowrap
                    ${isActive 
                      ? 'border-blue-600 text-blue-700' 
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'}
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50/30">
          <div className="p-6 space-y-8">

            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Call Information */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-5">Call Information</h3>
                    <div className="space-y-4">
                      <InfoRow label="Agent" value={agentName} />
                      <InfoRow label="Call Type" value={data.call_type_classification?.call_type || '—'} />
                      <InfoRow label="Channel" value="Phone" />
                      <div className="flex justify-between py-1 text-sm">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Duration
                        </span>
                        <span className="text-gray-900 font-medium">{
                          (data.seconds !== undefined && data.seconds !== null) || (call.seconds !== undefined && call.seconds !== null) 
                            ? `${Math.round(((data.seconds || call.seconds) / 60) * 10) / 10} minutes` 
                            : '—'
                        }</span>
                      </div>
                      <InfoRow label="Language" value="Arabic" />
                    </div>
                  </div>

                  {/* Resolution & Risk */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-5">Resolution & Risk</h3>
                    <div className="space-y-4">
                      <InfoRow 
                        label="Status" 
                        value={data.call_summary?.resolution_status || '—'}
                        valueClass={
                          data.call_summary?.resolution_status === 'resolved' 
                            ? 'text-green-700 font-medium' 
                            : 'text-amber-700 font-medium'
                        }
                      />
                      <InfoRow label="Next Step" value={data.call_summary?.next_step || '—'} />
                      <InfoRow 
                        label="Risk Level" 
                        value={data.high_risk?.is_high_risk ? 'High' : 'Low'}
                        valueClass={data.high_risk?.is_high_risk ? 'text-red-700 font-medium' : 'text-green-700'}
                      />
                    </div>

                    {data.high_risk?.is_high_risk && data.high_risk.risk_reasons?.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <p className="text-sm font-medium text-red-800 mb-2">Risk Reasons:</p>
                        <ul className="text-sm text-red-700 space-y-1.5 list-disc pl-5">
                          {data.high_risk.risk_reasons.map((reason, i) => (
                            <li key={i}>{reason}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-8 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Call Summary</h3>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <EnhancedSummaryCard 
                      icon={AlertCircle} 
                      iconColor="text-red-600" 
                      iconBg="bg-red-100" 
                      label="Problem" 
                      value={data.call_summary?.problem} 
                    />
                    <EnhancedSummaryCard 
                      icon={Target} 
                      iconColor="text-purple-600" 
                      iconBg="bg-purple-100" 
                      label="Customer Intent" 
                      value={data.call_summary?.customer_intent} 
                    />
                    <EnhancedSummaryCard 
                      icon={Headphones} 
                      iconColor="text-blue-600" 
                      iconBg="bg-blue-100" 
                      label="Agent Action" 
                      value={data.call_summary?.agent_action} 
                    />
                    <EnhancedSummaryCard 
                      icon={BookOpen} 
                      iconColor="text-green-600" 
                      iconBg="bg-green-100" 
                      label="Call Story" 
                      value={data.call_summary?.call_story} 
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Quality Metrics ── */}
            {activeTab === 'metrics' && (
              <div className="space-y-8">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Quality Score Breakdown</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={[
                          { name: 'Structure', score: qualityScore },
                          { name: 'Greeting', score: data.call_quality_metrics?.call_structure?.greeting ? 5 : 0 },
                          { name: 'Discovery', score: data.call_quality_metrics?.call_structure?.problem_discovery ? 5 : 0 },
                          { name: 'Solution', score: data.call_quality_metrics?.call_structure?.solution_explanation ? 5 : 0 },
                        ]}
                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tick={{ fill: '#6b7280' }} />
                        <YAxis domain={[0, 5]} axisLine={false} tick={{ fill: '#6b7280' }} />
                        <Tooltip 
                          cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                        <Bar dataKey="score" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* ── Empathy ── */}
            {activeTab === 'empathy' && (
              <div className="space-y-6">
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-5">Empathy & Tone</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Empathy Score</p>
                      <div className="text-4xl font-bold text-gray-900">
                        {((data.empathy_politeness?.score || 0) / 20).toFixed(1)}
                        <span className="text-xl font-normal text-gray-500">/5</span>
                      </div>
                      <p className="mt-2 text-sm text-gray-600">
                        Tone: <span className="font-medium">{data.empathy_politeness?.tone_assessment || '—'}</span>
                      </p>
                    </div>

                    {data.empathy_politeness?.empathy_phrases_detected?.length > 0 && (
                      <div className="bg-green-50/50 rounded-lg p-5 border border-green-100">
                        <p className="text-sm font-medium text-green-800 mb-3">Detected Empathy Phrases:</p>
                        <ul className="space-y-2 text-sm text-green-700">
                          {data.empathy_politeness.empathy_phrases_detected.map((phrase, i) => (
                            <li key={i}>“{phrase}”</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ── Transcript ── */}
            {activeTab === 'transcript' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Call Transcript</h3>
                </div>

                {(call.transcript || data.transcript) ? (
                  <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {typeof (call.transcript || data.transcript) === 'string' ? (
                      <p className="text-gray-800 whitespace-pre-wrap leading-relaxed font-mono text-sm" dir="rtl">
                        {call.transcript || data.transcript}
                      </p>
                    ) : Array.isArray(call.transcript || data.transcript) ? (
                      <div className="space-y-3 max-h-96 overflow-y-auto bg-gradient-to-b from-slate-50 to-gray-100 p-6 rounded-xl border border-slate-200 shadow-inner -mx-6">
                        {(call.transcript || data.transcript).map((entry, idx) => (
                          <div 
                            key={idx}
                            className={`flex ${entry.speaker === 'agent' || entry.speaker === 'support_representative' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md ${
                              entry.speaker === 'agent' || entry.speaker === 'support_representative'
                                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-sm border border-blue-500'
                                : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200 shadow-sm'
                            }`}>
                              <div className={`text-xs mb-2 font-semibold ${
                                entry.speaker === 'agent' || entry.speaker === 'support_representative' 
                                  ? 'text-blue-100' 
                                  : 'text-slate-600'
                              }`}>
                                {entry.speaker === 'agent' || entry.speaker === 'support_representative' ? agentName : customerName}
                              </div>
                              <p className="text-sm leading-relaxed" dir="rtl">{entry.text}</p>
                              {entry.timestamp && (
                                <div className={`text-xs mt-2 text-right ${
                                  entry.speaker === 'agent' || entry.speaker === 'support_representative' 
                                    ? 'text-blue-200' 
                                    : 'text-gray-500'
                                }`}>
                                  {entry.timestamp}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="py-20 text-center text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
                    <p>No transcript available for this call</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Recording ── */}
            {activeTab === 'recording' && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                      <Play className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-lg">Call Recording</span>
                      <p className="text-sm text-gray-600">Listen to the original call audio</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {(call.recordingLink || data.recordingLink) ? (
                    <AudioPlayer
                      src={call.recordingLink || data.recordingLink}
                      duration={call.seconds || data.seconds}
                      title={`Call Recording - ${agentName}`}
                    />
                  ) : (
                    <div className="py-20 text-center text-gray-500">
                      <Play className="w-12 h-12 mx-auto mb-4 opacity-40" />
                      <p className="text-lg font-medium mb-2">No recording available</p>
                      <p className="text-sm">The recording for this call could not be loaded</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
    </>
  );

  if (isEmbedded) {
    return (
      <div className="h-full flex flex-col bg-white overflow-hidden">
        {content}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-200">
        {content}
      </div>
    </div>
  );
};

// ── Helpers ────────────────────────────────────────────────
const InfoRow = ({ label, value, valueClass = 'text-gray-900 font-medium' }) => (
  <div className="flex justify-between py-1 text-sm">
    <span className="text-gray-600">{label}</span>
    <span className={valueClass}>{value || '—'}</span>
  </div>
);

const SummaryItem = ({ label, value }) => (
  value ? (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>
      <p className="text-gray-900">{value}</p>
    </div>
  ) : null
);

const EnhancedSummaryCard = ({ icon: Icon, iconColor, iconBg, label, value }) => (
  value ? (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center flex-shrink-0 mt-1`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-gray-900 mb-2">{label}</h4>
          <p className="text-sm text-gray-700 leading-relaxed" dir="rtl">{value}</p>
        </div>
      </div>
    </div>
  ) : null
);

export default CallDetailModal;