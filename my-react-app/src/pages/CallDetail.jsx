// src/pages/CallDetail.jsx
import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  ArrowLeft, Phone, User, CheckCircle2, XCircle, AlertTriangle, 
  FileText, BarChart3, Heart, MessageSquare, Eye, Info, BookOpen, Clock, Play
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { getTextDirection, getTextAlign, formatDate, formatTime, formatNumber } from '../utils/languageUtils';
import AudioPlayer from '../components/common/AudioPlayer';

// Custom Tooltip Component
const InfoTooltip = ({ text }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <Eye className="w-4 h-4" />
      </button>
      
      {isVisible && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-[9999] max-w-xs whitespace-normal">
          {text}
          <div className="absolute bottom-full right-3 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-900"></div>
        </div>
      )}
    </div>
  );
};

const CallDetail = () => {
  const { agentName, callId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');

  // Get call data from location state
  const call = location.state?.call;

  if (!call) {
    return (
      <div className="space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <Phone className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Call Not Found</h1>
          <p className="text-gray-600 mb-4">Unable to load call details.</p>
          <button
            onClick={() => navigate(`/agents/${agentName}`)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Agent
          </button>
        </div>
      </div>
    );
  }

  // Normalize data access
  const data = call.message || call;
  const agent = call.agent || data.agent_name || agentName || 'Unknown Agent';

  // Debug logging
  console.log('Call data:', call);
  console.log('Normalized data:', data);
  console.log('Recording link:', call.recordingLink || data.recordingLink);
  console.log('Seconds:', call.seconds || data.seconds);

  const tabs = [
    { id: 'overview',    label: t('callDetail.tabs.overview'),     icon: FileText       },
    { id: 'metrics',     label: t('callDetail.tabs.metrics'),      icon: BarChart3      },
    { id: 'empathy',     label: t('callDetail.tabs.empathy'),      icon: Heart          },
    { id: 'transcript',  label: t('callDetail.tabs.transcript'),   icon: MessageSquare  },
    { id: 'recording',   label: 'Recording',                       icon: Play           },
  ];

  const qualityScore = Math.round((data.call_quality_metrics?.call_structure?.structure_score || 0) / 20 * 10) / 10;

  const handleBack = () => {
    navigate(`/agents/${agentName}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center ring-1 ring-inset ring-blue-100">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>

            <div>
              <h2 
                className={`text-xl font-semibold text-gray-900 tracking-tight ${getTextAlign(data.call_summary?.problem || '')}`}
                dir={getTextDirection(data.call_summary?.problem || '')}
              >
                {data.call_summary?.problem || t('callDetail.overview.callInformation')}
              </h2>
              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                <span>{formatDate(data.key_call_details?.call_date, i18n.language)}</span>
                <span>•</span>
                <span>{formatTime(data.key_call_details?.call_start_time, i18n.language)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
        <div className="bg-gray-50/30 min-h-screen">
          <div className="p-6 space-y-8">

            {/* ── Overview ── */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Call Information */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-5">Call Information</h3>
                    <div className="space-y-4">
                      <InfoRow label="Agent" value={agent} />
                      <InfoRow label="Call Type" value={data.call_type_classification?.call_type || '—'} />
                      <InfoRow label="Channel" value="Phone" />
                      <InfoRow label="Language" value="Arabic" />
                      {(data.seconds !== undefined && data.seconds !== null) || (call.seconds !== undefined && call.seconds !== null) ? (
                        <div className="flex justify-between py-1 text-sm">
                          <span className="text-gray-600 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Duration
                          </span>
                          <span className="text-gray-900 font-medium">{`${Math.round(((data.seconds || call.seconds) / 60) * 10) / 10} minutes`}</span>
                        </div>
                      ) : null}
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

                {/* Call Summary - Enhanced Sections */}
                <div className="space-y-6">
                  {/* Problem Section */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('callDetail.overview.problem')}</h3>
                      </div>
                      <InfoTooltip text={t('callDetail.tooltips.problem')} />
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p 
                        className={`text-gray-800 leading-relaxed ${getTextAlign(data.call_summary?.problem || '')}`}
                        dir={getTextDirection(data.call_summary?.problem || '')}
                      >
                        {data.call_summary?.problem || t('callDetail.overview.noProblem')}
                      </p>
                    </div>
                  </div>

                  {/* Customer Intent Section */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('callDetail.overview.customerIntent')}</h3>
                      </div>
                      <InfoTooltip text={t('callDetail.tooltips.customerIntent')} />
                    </div>
                    <div className="bg-blue-50/50 rounded-lg p-4 border border-blue-100">
                      <p 
                        className={`text-gray-800 leading-relaxed ${getTextAlign(data.call_summary?.customer_intent || '')}`}
                        dir={getTextDirection(data.call_summary?.customer_intent || '')}
                      >
                        {data.call_summary?.customer_intent || t('callDetail.overview.noIntent')}
                      </p>
                    </div>
                  </div>

                  {/* Agent Action Section */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('callDetail.overview.agentAction')}</h3>
                      </div>
                      <InfoTooltip text={t('callDetail.tooltips.agentAction')} />
                    </div>
                    <div className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                      <p 
                        className={`text-gray-800 leading-relaxed ${getTextAlign(data.call_summary?.agent_action || '')}`}
                        dir={getTextDirection(data.call_summary?.agent_action || '')}
                      >
                        {data.call_summary?.agent_action || t('callDetail.overview.noAction')}
                      </p>
                    </div>
                  </div>

                  {/* Call Story Section */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">{t('callDetail.overview.callStory')}</h3>
                      </div>
                      <InfoTooltip text={t('callDetail.tooltips.callStory')} />
                    </div>
                    <div className="bg-purple-50/50 rounded-lg p-4 border border-purple-100">
                      <p 
                        className={`text-gray-800 leading-relaxed ${getTextAlign(data.call_summary?.call_story || '')}`}
                        dir={getTextDirection(data.call_summary?.call_story || '')}
                      >
                        {data.call_summary?.call_story || t('callDetail.overview.noStory')}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── Quality Metrics ── */}
            {activeTab === 'metrics' && (
              <div className="space-y-8">
                {/* Overall Quality Score */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm min-h-[200px]">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Overall Quality Score</h3>
                        <p className="text-sm text-gray-600">Based on call structure and performance</p>
                      </div>
                    </div>
                    <InfoTooltip text="An overall rating of the call quality based on agent performance, customer satisfaction, and adherence to best practices" />
                  </div>
                  <div className="text-center py-8">
                    <div className="text-6xl font-bold text-gray-900 mb-2">
                      {qualityScore.toFixed(1)}
                      <span className="text-2xl font-normal text-gray-500">/5</span>
                    </div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-700">
                      <BarChart3 className="w-4 h-4" />
                      {qualityScore >= 4 ? 'Excellent' : qualityScore >= 3 ? 'Good' : qualityScore >= 2 ? 'Average' : 'Needs Improvement'}
                    </div>
                  </div>
                </div>

                {/* Quality Breakdown Chart */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Quality Breakdown</h3>
                      <p className="text-sm text-gray-600">Detailed analysis of call quality components</p>
                    </div>
                  </div>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[
                          { name: 'Structure', score: qualityScore, color: '#3b82f6' },
                          { name: 'Greeting', score: data.call_quality_metrics?.call_structure?.greeting ? 5 : 0, color: '#10b981' },
                          { name: 'Discovery', score: data.call_quality_metrics?.call_structure?.problem_discovery ? 5 : 0, color: '#f59e0b' },
                          { name: 'Solution', score: data.call_quality_metrics?.call_structure?.solution_explanation ? 5 : 0, color: '#ef4444' },
                        ]}
                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tick={{ fill: '#6b7280' }} />
                        <YAxis domain={[0, 5]} axisLine={false} tick={{ fill: '#6b7280' }} />
                        <Tooltip
                          cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                          formatter={(value, name) => [value, 'Score']}
                        />
                        <Bar dataKey="score" radius={[6, 6, 0, 0]} barSize={50}>
                          {[
                            { name: 'Structure', score: qualityScore, color: '#3b82f6' },
                            { name: 'Greeting', score: data.call_quality_metrics?.call_structure?.greeting ? 5 : 0, color: '#10b981' },
                            { name: 'Discovery', score: data.call_quality_metrics?.call_structure?.problem_discovery ? 5 : 0, color: '#f59e0b' },
                            { name: 'Solution', score: data.call_quality_metrics?.call_structure?.solution_explanation ? 5 : 0, color: '#ef4444' },
                          ].map((entry, index) => (
                            <Bar key={`bar-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Quality Components Status */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        data.call_quality_metrics?.call_structure?.greeting ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {data.call_quality_metrics?.call_structure?.greeting ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900">Greeting</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {data.call_quality_metrics?.call_structure?.greeting ? 
                        'Proper greeting was provided' : 
                        'Greeting was missing or inadequate'}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        data.call_quality_metrics?.call_structure?.problem_discovery ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {data.call_quality_metrics?.call_structure?.problem_discovery ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900">Problem Discovery</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {data.call_quality_metrics?.call_structure?.problem_discovery ? 
                        'Problem was properly identified' : 
                        'Problem discovery was inadequate'}
                    </p>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        data.call_quality_metrics?.call_structure?.solution_explanation ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {data.call_quality_metrics?.call_structure?.solution_explanation ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                      <h4 className="font-medium text-gray-900">Solution Explanation</h4>
                    </div>
                    <p className="text-sm text-gray-600">
                      {data.call_quality_metrics?.call_structure?.solution_explanation ? 
                        'Solution was properly explained' : 
                        'Solution explanation was inadequate'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Empathy ── */}
            {activeTab === 'empathy' && (
              <div className="space-y-8">
                {/* Empathy Score Overview */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-pink-50 rounded-lg flex items-center justify-center">
                        <Heart className="w-5 h-5 text-pink-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Empathy & Communication</h3>
                        <p className="text-sm text-gray-600">Analysis of emotional intelligence and tone</p>
                      </div>
                    </div>
                    <InfoTooltip text="A measure of the agent's ability to understand and respond to customer emotions with appropriate empathy and communication skills" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="text-center">
                      <div className="text-5xl font-bold text-gray-900 mb-2">
                        {((data.empathy_politeness?.score || 0) / 20).toFixed(1)}
                        <span className="text-xl font-normal text-gray-500">/5</span>
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Empathy Score</p>
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-pink-100 text-pink-700">
                        <Heart className="w-4 h-4" />
                        {((data.empathy_politeness?.score || 0) / 20) >= 4 ? 'Excellent' :
                         ((data.empathy_politeness?.score || 0) / 20) >= 3 ? 'Good' :
                         ((data.empathy_politeness?.score || 0) / 20) >= 2 ? 'Average' : 'Needs Improvement'}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Tone Assessment</span>
                        <span className="text-sm text-gray-900 font-medium">
                          {data.empathy_politeness?.tone_assessment || '—'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Politeness Level</span>
                        <span className="text-sm text-gray-900 font-medium">
                          {data.empathy_politeness?.politeness_level || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detected Empathy Phrases */}
                {data.empathy_politeness?.empathy_phrases_detected?.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Detected Empathy Phrases</h3>
                        <p className="text-sm text-gray-600">Positive emotional intelligence indicators found in the conversation</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {data.empathy_politeness.empathy_phrases_detected.map((phrase, i) => (
                        <div key={i} className="bg-green-50/50 rounded-lg p-4 border border-green-100">
                          <div className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Heart className="w-3 h-3 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-green-800 mb-1">Empathy Phrase {i + 1}</p>
                              <p className="text-green-700 leading-relaxed" dir="rtl">"{phrase}"</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Communication Analysis */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Communication Analysis</h3>
                      <p className="text-sm text-gray-600">Detailed breakdown of communication effectiveness</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                        <h4 className="font-medium text-blue-900 mb-2">Active Listening</h4>
                        <p className="text-sm text-blue-800">
                          {data.empathy_politeness?.active_listening_indicators?.length > 0
                            ? 'Demonstrated through multiple indicators'
                            : 'Limited indicators of active listening'}
                        </p>
                      </div>

                      <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                        <h4 className="font-medium text-purple-900 mb-2">Emotional Support</h4>
                        <p className="text-sm text-purple-800">
                          {data.empathy_politeness?.emotional_support_provided
                            ? 'Emotional support was provided'
                            : 'Limited emotional support detected'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-4 bg-green-50/50 rounded-lg border border-green-100">
                        <h4 className="font-medium text-green-900 mb-2">Understanding</h4>
                        <p className="text-sm text-green-800">
                          {data.empathy_politeness?.customer_understanding_demonstrated
                            ? 'Customer understanding was clearly demonstrated'
                            : 'Customer understanding could be improved'}
                        </p>
                      </div>

                      <div className="p-4 bg-orange-50/50 rounded-lg border border-orange-100">
                        <h4 className="font-medium text-orange-900 mb-2">Rapport Building</h4>
                        <p className="text-sm text-orange-800">
                          {data.empathy_politeness?.rapport_building_efforts
                            ? 'Efforts made to build rapport'
                            : 'Limited rapport building observed'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Transcript ── */}
            {activeTab === 'transcript' && (
              <div className="space-y-6">
                {/* Transcript Content */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
                          <MessageSquare className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-gray-900 text-lg">Conversation Transcript</span>
                          <p className="text-sm text-gray-600">Interactive chat view</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {Array.isArray(call.transcript || data.transcript) && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-white/70 rounded-full border border-indigo-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-gray-700">
                              {(call.transcript || data.transcript).length} messages
                            </span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 bg-white/50 px-2 py-1 rounded-md">
                          {Array.isArray(call.transcript || data.transcript) ? 'Structured' : 'Raw Text'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {(call.transcript || data.transcript) ? (
                    <div className="p-6 max-h-[70vh] overflow-y-auto">
                      {typeof (call.transcript || data.transcript) === 'string' ? (
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                          <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <FileText className="w-4 h-4 text-gray-600" />
                            </div>
                            <span className="font-medium text-gray-900">Full Transcript</span>
                          </div>
                          <p className="text-gray-800 whitespace-pre-wrap leading-relaxed font-mono text-sm" dir="rtl">
                            {call.transcript || data.transcript}
                          </p>
                        </div>
                      ) : Array.isArray(call.transcript || data.transcript) ? (
                        <div className="space-y-3 max-h-96 overflow-y-auto bg-gradient-to-b from-slate-50 to-gray-100 p-6 rounded-xl border border-slate-200 shadow-inner">
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
                                  {entry.speaker === 'agent' || entry.speaker === 'support_representative' ? agent : 'Customer'}
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
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-40" />
                      <p className="text-lg font-medium mb-2">No transcript available</p>
                      <p className="text-sm">The transcript for this call could not be loaded</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Recording ── */}
            {activeTab === 'recording' && (
              <div className="space-y-6">
                {/* Recording Player */}
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
                        title={`Call Recording - ${agent}`}
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
              </div>
            )}
          </div>
        </div>
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

export default CallDetail;
