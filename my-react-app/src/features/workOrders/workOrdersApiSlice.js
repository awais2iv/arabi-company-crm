// src/features/workOrders/workOrdersApiSlice.js - Work Orders API Slice
import { apiSlice } from '@/app/api/apiSlice';

export const workOrdersApiSlice = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Get all work orders with filtering and pagination
    getWorkOrders: builder.query({
      query: ({
        page = 1,
        limit = 10,
        status,
        workOrderType,
        supervisor,
        technician,
        area,
        areaCode,
        startDate,
        endDate,
        search,
        sortBy = 'visitInstDate',
        sortOrder = 'desc',
        distribution
      } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
        
        if (status) params.append('status', status);
        if (workOrderType) params.append('workOrderType', workOrderType);
        if (supervisor) params.append('supervisor', supervisor);
        if (technician) params.append('technician', technician);
        if (area) params.append('area', area);
        if (areaCode) params.append('areaCode', areaCode);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (search) params.append('search', search);
        if (distribution) params.append('distribution', distribution);
        
        return `/work-orders?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data?.workOrders
          ? [
              ...result.data.workOrders.map(({ _id }) => ({ type: 'WorkOrder', id: _id })),
              { type: 'WorkOrder', id: 'LIST' },
            ]
          : [{ type: 'WorkOrder', id: 'LIST' }],
    }),

    // Get single work order by ID
    getWorkOrderById: builder.query({
      query: (id) => `/work-orders/${id}`,
      providesTags: (result, error, id) => [{ type: 'WorkOrder', id }],
      keepUnusedDataFor: 0, // Don't cache the data
    }),

    // Create new work order
    createWorkOrder: builder.mutation({
      query: (workOrderData) => ({
        url: '/work-orders',
        method: 'POST',
        body: workOrderData,
      }),
      invalidatesTags: [{ type: 'WorkOrder', id: 'LIST' }, 'WorkOrderStats'],
    }),

    // Update work order
    updateWorkOrder: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/work-orders/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'WorkOrder', id },
        { type: 'WorkOrder', id: 'LIST' },
        'WorkOrderStats',
      ],
    }),

    // Update work order status
    updateWorkOrderStatus: builder.mutation({
      query: ({ id, ...statusUpdate }) => ({
        url: `/work-orders/${id}/status`,
        method: 'PATCH',
        body: statusUpdate,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'WorkOrder', id },
        { type: 'WorkOrder', id: 'LIST' },
        'WorkOrderStats',
        'WorkOrderHistory',
      ],
    }),

    // Delete work order
    deleteWorkOrder: builder.mutation({
      query: (id) => ({
        url: `/work-orders/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'WorkOrder', id },
        { type: 'WorkOrder', id: 'LIST' },
        'WorkOrderStats',
      ],
    }),

    // Bulk update work orders
    bulkUpdateWorkOrders: builder.mutation({
      query: ({ workOrderIds, updates }) => ({
        url: '/work-orders/bulk-update',
        method: 'POST',
        body: { workOrderIds, updates },
      }),
      invalidatesTags: [{ type: 'WorkOrder', id: 'LIST' }, 'WorkOrderStats'],
    }),

    // Get work order history
    getWorkOrderHistory: builder.query({
      query: ({ id, page = 1, limit = 50 }) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        return `/work-orders/${id}/history?${params.toString()}`;
      },
      providesTags: (result, error, { id }) => [{ type: 'WorkOrderHistory', id }],
    }),

    // Export work orders
    exportWorkOrders: builder.mutation({
      query: ({
        format = 'csv',
        status,
        workOrderType,
        supervisor,
        technician,
        area,
        areaCode,
        startDate,
        endDate,
        search,
        distribution
      } = {}) => {
        const params = new URLSearchParams();
        params.append('format', format);
        
        if (status) params.append('status', status);
        if (workOrderType) params.append('workOrderType', workOrderType);
        if (supervisor) params.append('supervisor', supervisor);
        if (technician) params.append('technician', technician);
        if (area) params.append('area', area);
        if (areaCode) params.append('areaCode', areaCode);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (search) params.append('search', search);
        if (distribution) params.append('distribution', distribution);
        
        return {
          url: `/work-orders/export?${params.toString()}`,
          method: 'GET',
          responseHandler: (response) => response.blob(),
          cache: 'no-cache',
        };
      },
    }),

    // Get work order statistics
    getWorkOrderStats: builder.query({
      query: ({ startDate, endDate, supervisor, technician } = {}) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (supervisor) params.append('supervisor', supervisor);
        if (technician) params.append('technician', technician);
        
        return `/work-orders/stats/overview?${params.toString()}`;
      },
      providesTags: ['WorkOrderStats'],
    }),

    // Get work orders by technician
    getWorkOrdersByTechnician: builder.query({
      query: ({ technicianId, page = 1, limit = 10, status }) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (status) params.append('status', status);
        
        return `/work-orders/technician/${technicianId}?${params.toString()}`;
      },
      providesTags: (result, error, { technicianId }) => [
        { type: 'WorkOrder', id: `TECHNICIAN_${technicianId}` },
      ],
    }),

    // Get work orders by supervisor
    getWorkOrdersBySupervisor: builder.query({
      query: ({ supervisorId, page = 1, limit = 10, status }) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (status) params.append('status', status);
        
        return `/work-orders/supervisor/${supervisorId}?${params.toString()}`;
      },
      providesTags: (result, error, { supervisorId }) => [
        { type: 'WorkOrder', id: `SUPERVISOR_${supervisorId}` },
      ],
    }),
  }),
});

export const {
  useGetWorkOrdersQuery,
  useGetWorkOrderByIdQuery,
  useLazyGetWorkOrderByIdQuery,
  useCreateWorkOrderMutation,
  useUpdateWorkOrderMutation,
  useUpdateWorkOrderStatusMutation,
  useDeleteWorkOrderMutation,
  useBulkUpdateWorkOrdersMutation,
  useGetWorkOrderHistoryQuery,
  useExportWorkOrdersMutation,
  useGetWorkOrderStatsQuery,
  useGetWorkOrdersByTechnicianQuery,
  useGetWorkOrdersBySupervisorQuery,
} = workOrdersApiSlice;
