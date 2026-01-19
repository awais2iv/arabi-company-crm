// src/components/agent/CallsList.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Phone,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  Star
} from 'lucide-react';
import { getTextDirection, getTextAlign } from '../../utils/languageUtils';

const CallsList = ({ calls = [], isLoading, error, onSelectCall }) => {
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <div className="divide-y divide-gray-100">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="px-4 py-3 animate-pulse flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-md" />
            <div className="flex-1 h-4 bg-gray-200 rounded" />
            <div className="w-20 h-4 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-10 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto text-red-500 opacity-70 mb-2" />
        <p className="text-sm font-medium text-gray-700">{t('calls.error')}</p>
      </div>
    );
  }

  if (!calls.length) {
    return (
      <div className="py-12 text-center text-gray-500">
        <Phone className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm font-medium text-gray-700">{t('calls.noRecords')}</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {calls.map((call, index) => {
        const data = call.message || call;

        const isResolved =
          data.call_summary?.resolution_status === 'resolved' ||
          data.call_summary?.resolution_status === 'partially_resolved';

        const isHighRisk = data.high_risk?.is_high_risk;
        const quality =
          (data.call_quality_metrics?.call_structure?.structure_score || 0) / 20;

        const problem =
          data.call_summary?.problem ||
          data.call_summary?.customer_intent ||
          'No description';

        return (
          <button
            key={call._id || index}
            onClick={() => onSelectCall(call)}
            className={`
              w-full group px-4 py-3 flex items-center gap-4 text-left
              hover:bg-gray-50 transition
              border-l-2
              ${
                isHighRisk
                  ? 'border-red-400'
                  : isResolved
                  ? 'border-green-400'
                  : 'border-amber-400'
              }
            `}
          >
            {/* Left: Status Icon */}
            <div
              className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0
              ${
                isHighRisk
                  ? 'bg-red-50 text-red-600'
                  : isResolved
                  ? 'bg-green-50 text-green-600'
                  : 'bg-amber-50 text-amber-600'
              }`}
            >
              <Phone size={16} />
            </div>

            {/* Center: Problem / Title */}
            <div className="flex-1 min-w-0">
              <p 
                className={`text-sm font-medium text-gray-900 truncate ${getTextAlign(problem)}`}
                dir={getTextDirection(problem)}
              >
                {problem}
              </p>
            </div>

            {/* Right: KPIs */}
            <div className="flex items-center gap-2 flex-shrink-0">

              {/* Quality */}
              {quality > 0 && (
                <div className="flex items-center gap-1 text-xs text-gray-700">
                  <Star size={12} className="text-amber-500" fill="currentColor" />
                  <span className="font-medium">{quality.toFixed(1)}</span>
                </div>
              )}

              {/* Resolution */}
              <div
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium
                ${
                  isResolved
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {isResolved ? t('calls.resolved_status') : t('calls.unresolved_status')}
              </div>

              {/* Risk */}
              {isHighRisk && (
                <div className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-800 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  {t('calls.highRisk')}
                </div>
              )}

              <ChevronRight
                size={16}
                className="text-gray-400 group-hover:text-blue-500"
              />
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default CallsList;
