// src/features/kpis/kpisApiSlice.js - KPIs API Slice
import { apiSlice } from "@/app/api/apiSlice";

export const kpisApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all agents (unique agent names from transcriber collection)
    getAgents: builder.query({
      query: () => '/transcriber/agents',
      providesTags: ['Agents'],
    }),

    // Get all KPIs for a specific agent
    getAgentKpis: builder.query({
      query: (agentName) => `/transcriber/agent/${agentName}`,
      providesTags: (result, error, agentName) => [{ type: 'KPIs', id: agentName }],
    }),

    // Get single KPI detail by ID
    getKpiById: builder.query({
      query: (kpiId) => `/transcriber/${kpiId}`,
      providesTags: (result, error, kpiId) => [{ type: 'KPI', id: kpiId }],
    }),

    // Get all KPIs with optional filters
    getAllKpis: builder.query({
      query: ({ agentName, startDate, endDate, highRisk, resolved } = {}) => {
        const params = new URLSearchParams();
        if (agentName) params.append('agent', agentName);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (highRisk !== undefined) params.append('highRisk', highRisk);
        if (resolved !== undefined) params.append('resolved', resolved);
        
        return `/transcriber?${params.toString()}`;
      },
      providesTags: ['KPIs'],
    }),

    // Get KPI statistics for an agent
    getAgentStats: builder.query({
      query: (agentName) => `/transcriber/agent/${agentName}/stats`,
      providesTags: (result, error, agentName) => [{ type: 'AgentStats', id: agentName }],
    }),
  }),
});

export const {
  useGetAgentsQuery,
  useGetAgentKpisQuery,
  useGetKpiByIdQuery,
  useGetAllKpisQuery,
  useGetAgentStatsQuery,
} = kpisApiSlice;
