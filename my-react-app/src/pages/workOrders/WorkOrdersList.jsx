// src/pages/workOrders/WorkOrdersList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import {
  Plus,
  Search,
  Filter,
  Download,
  ClipboardList,
  Calendar,
  User,
  MapPin,
  Clock,
  Edit,
  Trash2,
  MoreVertical,
  Eye,
  AlertCircle,
  Settings,
  Columns,
  X
} from 'lucide-react';
import { useGetWorkOrdersQuery, useDeleteWorkOrderMutation, useExportWorkOrdersMutation } from '@/features/workOrders/workOrdersApiSlice';
import CreateWorkOrderModal from '@/components/workOrders/CreateWorkOrderModal';
import ViewWorkOrderModal from '@/components/workOrders/ViewWorkOrderModal';
import ConfirmDeleteModal from '@/components/common/ConfirmDeleteModal';
import ExportModal from '@/components/workOrders/ExportModal';

const WorkOrdersList = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const token = useSelector((state) => state.auth.token);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [workOrderStatusFilter, setWorkOrderStatusFilter] = useState('');
  const [supervisorFilter, setSupervisorFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState('');
  const [areaCodeFilter, setAreaCodeFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [workOrderToDelete, setWorkOrderToDelete] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showColumnSettings, setShowColumnSettings] = useState(false);
  
  // Define all available columns
  const [availableColumns] = useState([
    { id: 'workOrderNumber', label: 'Work Order #', visible: true },
    { id: 'customerName', label: 'Customer', visible: true },
    { id: 'customerPhone', label: 'Phone', visible: true },
    { id: 'visitInstDate', label: 'Visit Date', visible: true },
    { id: 'workOrderType', label: 'Type', visible: true },
    { id: 'area', label: 'Area', visible: true },
    { id: 'areaCode', label: 'Area Code', visible: false },
    { id: 'block', label: 'Block', visible: false },
    { id: 'street', label: 'Street', visible: false },
    { id: 'house', label: 'House', visible: false },
    { id: 'technician', label: 'Technician', visible: true },
    { id: 'supervisor', label: 'Supervisor', visible: false },
    { id: 'workOrderStatus', label: 'Status', visible: true },
    { id: 'jobStatus', label: 'Job Status', visible: false },
    { id: 'distribution', label: 'Distribution', visible: false },
    { id: 'hours', label: 'Hours', visible: false },
    { id: 'description', label: 'Description', visible: false },
    { id: 'rescheduleDate', label: 'Reschedule Date', visible: false },
    { id: 'createdAt', label: 'Created', visible: false }
  ]);
  
  const [visibleColumns, setVisibleColumns] = useState(
    availableColumns.filter(col => col.visible).map(col => col.id)
  );

  const [deleteWorkOrder, { isLoading: isDeleting }] = useDeleteWorkOrderMutation();
  const [exportWorkOrders, { isLoading: isExporting }] = useExportWorkOrdersMutation();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [search]);

  const {
    data: workOrdersData,
    isLoading,
    isError,
    error
  } = useGetWorkOrdersQuery({
    page,
    limit: 10,
    search: debouncedSearch,
    status: statusFilter,
      workOrderStatus: workOrderStatusFilter,
    supervisor: supervisorFilter,
    technician: technicianFilter,
    area: areaFilter,
    areaCode: areaCodeFilter,
    startDate: startDateFilter,
    endDate: endDateFilter
  });

  const workOrders = workOrdersData?.data?.workOrders || [];
  const pagination = workOrdersData?.data?.pagination || {};

  // Clear all filters
  const clearAllFilters = useCallback(() => {
    setSearch('');
    setStatusFilter('');
    setWorkOrderStatusFilter('');
    setSupervisorFilter('');
    setTechnicianFilter('');
    setAreaFilter('');
    setAreaCodeFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setPage(1);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    statusFilter,
    workOrderStatusFilter,
    supervisorFilter,
    technicianFilter,
    areaFilter,
    areaCodeFilter,
    startDateFilter,
    endDateFilter
  ]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.actions-dropdown')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'On Hold': 'bg-orange-100 text-orange-800',
      'Rescheduled': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handleDeleteWorkOrder = (workOrder) => {
    setWorkOrderToDelete(workOrder);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteWorkOrder = async () => {
    if (!workOrderToDelete) return;

    try {
      await deleteWorkOrder(workOrderToDelete._id).unwrap();
      setIsDeleteModalOpen(false);
      setWorkOrderToDelete(null);
    } catch (error) {
      console.error('Failed to delete work order:', error);
      // Error handling is done in the modal
      throw error;
    }
  };

  const toggleColumn = (columnId) => {
    setVisibleColumns(prev => 
      prev.includes(columnId) 
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    );
  };

  const formatCellValue = (workOrder, columnId) => {
    switch (columnId) {
      case 'workOrderNumber':
        return workOrder.workOrderNumber;
      case 'customerName':
        return workOrder.customerName;
      case 'customerPhone':
        return workOrder.customerPhone;
      case 'visitInstDate':
        return new Date(workOrder.visitInstDate).toLocaleDateString();
      case 'workOrderType':
        return workOrder.workOrderType;
      case 'area':
        return workOrder.area;
      case 'areaCode':
        return workOrder.areaCode || '—';
      case 'block':
        return workOrder.block || '—';
      case 'street':
        return workOrder.street || '—';
      case 'house':
        return workOrder.house || '—';
      case 'technician':
        return workOrder.technician || '—';
      case 'supervisor':
        return workOrder.supervisor || '—';
      case 'workOrderStatus':
        return workOrder.workOrderStatus;
      case 'jobStatus':
        return workOrder.jobStatus || '—';
      case 'distribution':
        return workOrder.distribution || '—';
      case 'hours':
        return workOrder.hours || '—';
      case 'description':
        return workOrder.description || '—';
      case 'rescheduleDate':
        return workOrder.rescheduleDate ? new Date(workOrder.rescheduleDate).toLocaleDateString() : '—';
      case 'createdAt':
        return new Date(workOrder.createdAt).toLocaleDateString();
      default:
        return '—';
    }
  };

  const handleExport = async (exportOptions) => {
    try {
      // Calculate date range based on selection
      const now = new Date();
      let startDate = '';
      let endDate = '';

      switch (exportOptions.dateRange) {
        case 'today':
          startDate = now.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          break;
        case '3days':
          const threeDaysAgo = new Date(now);
          threeDaysAgo.setDate(now.getDate() - 3);
          startDate = threeDaysAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          break;
        case '7days':
          const sevenDaysAgo = new Date(now);
          sevenDaysAgo.setDate(now.getDate() - 7);
          startDate = sevenDaysAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          break;
        case '30days':
          const thirtyDaysAgo = new Date(now);
          thirtyDaysAgo.setDate(now.getDate() - 30);
          startDate = thirtyDaysAgo.toISOString().split('T')[0];
          endDate = now.toISOString().split('T')[0];
          break;
        case 'all':
        default:
          // No date filter for 'all'
          break;
      }

      // Build query parameters
      const params = new URLSearchParams();
      params.append('format', exportOptions.format);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      // Make direct fetch call to bypass RTK Query's JSON parsing
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'}/work-orders/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = exportOptions.format === 'csv' ? 'csv' : 'xlsx';
      const dateSuffix = exportOptions.dateRange === 'all' ? 'all' : exportOptions.dateRange;
      a.download = `work-orders-${dateSuffix}-${new Date().toISOString().split('T')[0]}.${extension}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setIsExportModalOpen(false);
    } catch (error) {
      console.error('Failed to export work orders:', error);
      alert('Failed to export work orders. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Work Orders</h1>
            <p className="text-sm text-gray-600">Manage and track all work orders</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowColumnSettings(!showColumnSettings)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Columns className="w-4 h-4" />
            Columns
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create Work Order</span>
          </button>
        </div>
      </div>

      {/* Column Settings Panel */}
      {showColumnSettings && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Customize Columns</h3>
            <button
              onClick={() => setShowColumnSettings(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableColumns.map(column => (
              <label
                key={column.id}
                className="flex items-center gap-2 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={visibleColumns.includes(column.id)}
                  onChange={() => toggleColumn(column.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{column.label}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-3">
            <button
              onClick={() => setVisibleColumns(availableColumns.filter(col => col.visible).map(col => col.id))}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Reset to Default
            </button>
            <button
              onClick={() => setVisibleColumns(availableColumns.map(col => col.id))}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Show All
            </button>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="space-y-4">
          {/* Primary Filters Row */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name, work order #..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {search !== debouncedSearch && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[160px]"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="On Hold">On Hold</option>
              <option value="Rescheduled">Rescheduled</option>
            </select>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`px-4 py-2 border rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
                showAdvancedFilters
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4" />
              <span>{showAdvancedFilters ? 'Hide Filters' : 'More Filters'}</span>
            </button>

            <button 
              onClick={() => setIsExportModalOpen(true)}
              disabled={isExporting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Exporting...' : 'Export'}</span>
            </button>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                {/* Work Order Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Work Order Status</label>
                  <select
                    value={workOrderStatusFilter}
                    onChange={(e) => setWorkOrderStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Statuses</option>
                    <option value="Completed">Completed</option>
                    <option value="Quotation">Quotation</option>
                    <option value="Need Tomorrow">Need Tomorrow</option>
                    <option value="Need S.V">Need S.V</option>
                    <option value="Under Observ.">Under Observ.</option>
                    <option value="Pending">Pending</option>
                    <option value="S.N.R / Un Comp.">S.N.R / Un Comp.</option>
                    <option value="No Body At Site">No Body At Site</option>
                    <option value="Cancel / No Need">Cancel / No Need</option>
                    <option value="No Answer">No Answer</option>
                    <option value="Will Call Later">Will Call Later</option>
                    <option value="Need Other Day">Need Other Day</option>
                  </select>
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area</label>
                  <input
                    type="text"
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    placeholder="Area name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Area Code */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Area Code</label>
                  <select
                    value={areaCodeFilter}
                    onChange={(e) => setAreaCodeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Area Codes</option>
                    <option value="Area 1">Area 1</option>
                    <option value="Area 2">Area 2</option>
                    <option value="Area 3">Area 3</option>
                    <option value="Blank">Blank</option>
                    <option value="Others">Others</option>
                  </select>
                </div>

                {/* Supervisor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervisor</label>
                  <input
                    type="text"
                    value={supervisorFilter}
                    onChange={(e) => setSupervisorFilter(e.target.value)}
                    placeholder="Supervisor name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Technician */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Technician</label>
                  <input
                    type="text"
                    value={technicianFilter}
                    onChange={(e) => setTechnicianFilter(e.target.value)}
                    placeholder="Technician name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={startDateFilter}
                      onChange={(e) => setStartDateFilter(e.target.value)}
                      className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="From"
                    />
                    <input
                      type="date"
                      value={endDateFilter}
                      onChange={(e) => setEndDateFilter(e.target.value)}
                      className="flex-1 px-2 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="To"
                    />
                  </div>
                </div>
              </div>

              {/* Clear Filters Button */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Table Container with Fixed Min-Height */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-visible min-h-[500px] flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-500">
            <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-medium">Loading work orders...</p>
          </div>
        ) : isError ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900">Connection Error</h3>
            <p className="text-gray-500 max-w-xs">We couldn't load the work orders. Please check your connection and try again.</p>
          </div>
        ) : workOrders.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">No work orders found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your filters or search criteria.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="text-blue-600 font-medium hover:text-blue-700 underline underline-offset-4"
            >
              Create your first work order
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full min-w-max divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0 z-10">
                  <tr>
                    {visibleColumns.map(columnId => {
                      const column = availableColumns.find(c => c.id === columnId);
                      return (
                        <th 
                          key={columnId}
                          className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap"
                        >
                          {column?.label}
                        </th>
                      );
                    })}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20 sticky right-0 bg-gray-50">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workOrders.map((workOrder) => (
                    <tr
                      key={workOrder._id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      {visibleColumns.map(columnId => {
                        const value = formatCellValue(workOrder, columnId);
                        const isStatus = columnId === 'workOrderStatus';
                        
                        return (
                          <td 
                            key={columnId}
                            className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap"
                          >
                            {isStatus ? (
                              <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getStatusColor(value)}`}>
                                {value}
                              </span>
                            ) : (
                              value
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium relative sticky right-0 bg-white group-hover:bg-gray-50">
                        <div className="actions-dropdown inline-block relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId(openDropdownId === workOrder._id ? null : workOrder._id);
                            }}
                            className="p-1.5 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openDropdownId === workOrder._id && (
                            <div
                              className="absolute right-0 z-[1000] mt-1 w-44 bg-white rounded-lg shadow-xl border border-gray-200 py-1 focus:outline-none"
                            >
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedWorkOrder(workOrder);
                                  setIsViewModalOpen(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Eye className="w-4 h-4" />
                                View
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedWorkOrder(workOrder);
                                  setIsEditModalOpen(true);
                                  setOpenDropdownId(null);
                                }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteWorkOrder(workOrder);
                                  setOpenDropdownId(null);
                                }}
                                disabled={isDeleting}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 ${
                                  isDeleting 
                                    ? 'text-gray-400 cursor-not-allowed' 
                                    : 'text-red-600 hover:bg-red-50'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - Sticks to bottom of container if data is sparse */}
            {pagination.totalPages > 1 && (
              <div className="mt-auto px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl">
                <div className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.currentPage}</span> of <span className="font-medium">{pagination.totalPages}</span>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setPage(p => p - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(p => p + 1)}
                    disabled={!pagination.hasNextPage}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <CreateWorkOrderModal 
        isOpen={isCreateModalOpen || isEditModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setIsEditModalOpen(false);
          setSelectedWorkOrder(null);
        }}
        isEdit={isEditModalOpen}
        workOrder={selectedWorkOrder}
      />

      {isViewModalOpen && selectedWorkOrder && (
        <ViewWorkOrderModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false);
            setSelectedWorkOrder(null);
          }}
          workOrder={selectedWorkOrder}
        />
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setWorkOrderToDelete(null);
        }}
        onConfirm={confirmDeleteWorkOrder}
        title="Delete Work Order"
        message={`Are you sure you want to delete work order "${workOrderToDelete?.workOrderNumber}"? This action cannot be undone.`}
        confirmText="Delete Work Order"
        isLoading={isDeleting}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        onExport={handleExport}
        isLoading={isExporting}
      />
    </div>
  );
};

export default WorkOrdersList;