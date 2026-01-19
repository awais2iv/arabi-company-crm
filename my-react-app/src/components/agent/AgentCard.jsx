import React from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Star, ArrowRight } from 'lucide-react';

const AgentCard = ({ agent, onClick }) => {
  const { t } = useTranslation();
  const score = Number(agent.avgScore) || 0;
  
  const getStatus = (s) => {
    if (s >= 4.2) return { text: t('agents.excellent'), color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    if (s >= 3.5) return { text: t('agents.good'),      color: 'text-blue-700 bg-blue-50 border-blue-200' };
    if (s >= 3.0) return { text: 'Fair',      color: 'text-amber-700 bg-amber-50 border-amber-200' };
    return { text: t('agents.needsImprovement'), color: 'text-red-700 bg-red-50 border-red-200' };
  };

  const status = getStatus(score);

  return (
    <div
      className={`
        bg-white rounded-lg border border-gray-200 
        p-5 hover:border-gray-300 hover:shadow 
        transition-shadow duration-200 cursor-pointer group
      `}
      onClick={() => onClick(agent)}
    >
      <div className="flex items-start gap-4">
        {/* Avatar - simple, no crazy gradients */}
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-xl font-medium text-gray-700">
            {agent.agentName?.[0]?.toUpperCase() || '?'}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-blue-700">
            {agent.agentName}
          </h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
            <Phone size={14} />
            <span>{agent.callCount?.toLocaleString() || 0} calls</span>
          </div>
        </div>

        <ArrowRight 
          size={18} 
          className="text-gray-400 group-hover:text-blue-500 transition-colors" 
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-500">Avg. Score</div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-2xl font-bold text-gray-900">
              {score.toFixed(1)}
            </span>
            <Star size={16} className="text-amber-500" fill="currentColor" />
          </div>
        </div>

        <div className="flex items-end justify-end">
          <span className={`
            px-3 py-1 text-xs font-medium rounded-full border
            ${status.color}
          `}>
            {status.text}
          </span>
        </div>
      </div>

      <button
        className={`
          mt-6 w-full py-2 px-4 
          text-sm font-medium text-blue-700 
          bg-blue-50 hover:bg-blue-100 
          rounded-md transition-colors
        `}
        onClick={(e) => {
          e.stopPropagation();
          onClick(agent);
        }}
      >
        View Details
      </button>
    </div>
  );
};

export default AgentCard;