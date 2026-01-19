// src/components/agent/AgentSelector.jsx
import React from 'react';
import { User, Phone, Star, TrendingUp } from 'lucide-react';

const AgentSelector = ({ agents, selectedAgent, onSelectAgent, isLoading }) => {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-4">AGENTS</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sticky top-24">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <User className="w-4 h-4" />
        AGENTS ({agents.length})
      </h3>
      
      <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
        {agents.map((agent) => (
          <button
            key={agent.agentName || agent.name}
            onClick={() => onSelectAgent(agent)}
            className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
              selectedAgent?.agentName === agent.agentName || selectedAgent?.name === agent.name
                ? 'bg-blue-50 border-2 border-blue-500 shadow-sm'
                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                selectedAgent?.agentName === agent.agentName || selectedAgent?.name === agent.name
                  ? 'bg-blue-500'
                  : 'bg-gray-400'
              }`}>
                {(agent.agentName || agent.name)?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">
                  {agent.agentName || agent.name || 'Unknown Agent'}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-600">
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    {agent.callCount || agent.totalCalls || 0}
                  </span>
                  {agent.avgScore !== undefined && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      {agent.avgScore.toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {agents.length === 0 && !isLoading && (
        <div className="text-center py-8">
          <User className="w-12 h-12 mx-auto text-gray-400 mb-2" />
          <p className="text-sm text-gray-500">No agents found</p>
        </div>
      )}
    </div>
  );
};

export default AgentSelector;
