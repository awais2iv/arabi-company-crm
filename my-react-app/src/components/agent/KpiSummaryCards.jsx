// src/components/agent/KpiSummaryCards.jsx
import React from 'react';
import { TrendingUp, TrendingDown, Target, Heart, Shield, AlertTriangle, CheckCircle, Phone } from 'lucide-react';

const KpiSummaryCards = ({ stats, isLoading }) => {
  console.log('=== KPI SUMMARY CARDS COMPONENT ===');
  console.log('Stats data:', stats);
  console.log('Stats type:', typeof stats);
  console.log('Stats keys:', stats ? Object.keys(stats) : 'No stats');
  console.log('Is loading:', isLoading);
  console.log('====================================');

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  const cards = [
    {
      title: 'Total Calls',
      value: stats.totalCalls || 0,
      icon: Phone,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      trend: stats.callsTrend,
    },
    {
      title: 'Avg Quality Score',
      value: stats.avgQualityScore?.toFixed(1) || '0.0',
      suffix: '/5',
      icon: Target,
      color: 'green',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600',
      trend: stats.qualityTrend,
    },
    {
      title: 'Empathy Score',
      value: stats.avgEmpathyScore?.toFixed(1) || '0.0',
      suffix: '/5',
      icon: Heart,
      color: 'pink',
      bgColor: 'bg-pink-50',
      iconColor: 'text-pink-600',
      trend: stats.empathyTrend,
    },
    {
      title: 'First Call Resolution',
      value: stats.firstCallResolutionRate?.toFixed(0) || '0',
      suffix: '%',
      icon: CheckCircle,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      trend: stats.resolutionTrend,
    },
    {
      title: 'Compliance Score',
      value: stats.avgComplianceScore?.toFixed(1) || '0.0',
      suffix: '/5',
      icon: Shield,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      trend: stats.complianceTrend,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      {cards.map((card, index) => (
        <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-lg ${card.bgColor} flex items-center justify-center`}>
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            {card.trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${
                card.trend > 0 ? 'text-green-600' : card.trend < 0 ? 'text-red-600' : 'text-gray-600'
              }`}>
                {card.trend > 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : card.trend < 0 ? (
                  <TrendingDown className="w-3 h-3" />
                ) : null}
                {card.trend !== 0 && `${Math.abs(card.trend)}%`}
              </div>
            )}
          </div>
          <div className="text-sm font-medium text-gray-600 mb-1">
            {card.title}
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {card.value}
            {card.suffix && <span className="text-lg text-gray-500">{card.suffix}</span>}
          </div>
          {card.subtext && (
            <div className="text-xs text-gray-500 mt-1">
              {card.subtext}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default KpiSummaryCards;
