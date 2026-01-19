// src/components/workOrders/EditWorkOrderModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, Clock, AlertCircle } from 'lucide-react';
import { useUpdateWorkOrderMutation } from '@/features/workOrders/workOrdersApiSlice';
import { useGetAgentsQuery } from '@/features/kpis/kpisApiSlice';
import { useSelector } from 'react-redux';

const EditWorkOrderModal = ({ isOpen, onClose, workOrder }) => {
  const [updateWorkOrder, { isLoading }] = useUpdateWorkOrderMutation();
  const { data: agentsData } = useGetAgentsQuery();

  // Get current user from Redux auth state
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserName = currentUser ?
    (currentUser.name || currentUser.username || currentUser.email || 'Unknown User') :
    'Unknown User';

  const [formData, setFormData] = useState({
    visitInstDate: '',
    workOrderType: '',
    customerName: '',
    customerPhone: '',
    area: '',
    description: '',
    areaCode: '',
    supervisor: '',
    technician: '',
    workOrderStatus: 'Pending',
    rescheduleReason: '',
    jobStatus: 'Not Attend',
    distribution: '',
    agentName: currentUserName
  });

  const [errors, setErrors] = useState({});

  // Populate form when workOrder prop changes
  useEffect(() => {
    if (workOrder) {
      setFormData({
        visitInstDate: workOrder.visitInstDate ? new Date(workOrder.visitInstDate).toISOString().split('T')[0] : '',
        workOrderType: workOrder.workOrderType || '',
        customerName: workOrder.customerName || '',
        customerPhone: workOrder.customerPhone || '',
        area: workOrder.area || '',
        description: workOrder.description || '',
        areaCode: workOrder.areaCode || '',
        supervisor: workOrder.supervisor || '',
        technician: workOrder.technician || '',
        workOrderStatus: workOrder.workOrderStatus || 'Pending',
        rescheduleReason: workOrder.rescheduleReason || '',
        jobStatus: workOrder.jobStatus || 'Not Attend',
        distribution: workOrder.distribution || '',
        agentName: workOrder.agentName || currentUserName
      });
    }
  }, [workOrder, currentUserName]);

  const workOrderTypes = [
    'Installation',
    'Maintenance',
    'Repair',
    'Inspection',
    'Emergency',
    'Preventive Maintenance',
    'Corrective Maintenance'
  ];

  const areaCodeOptions = ['Area 1', 'Area 2', 'Area 3', 'Blank', 'Others'];
  const jobStatuses = ['Not Attend', 'Attend', 'Completed', 'Cancelled'];
  const workOrderStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled', 'Rescheduled'];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.visitInstDate) newErrors.visitInstDate = 'Visit date is required';
    if (!formData.workOrderType) newErrors.workOrderType = 'Work order type is required';
    if (!formData.customerName) newErrors.customerName = 'Customer name is required';
    if (!formData.area) newErrors.area = 'Area is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await updateWorkOrder({
        id: workOrder._id,
        ...formData
      }).unwrap();
      onClose();
    } catch (error) {
      console.error('Failed to update work order:', error);
      if (error?.data?.errors) {
        const backendErrors = {};
        error.data.errors.forEach(err => {
          backendErrors.general = err;
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: error?.data?.message || 'Failed to update work order' });
      }
    }
  };

  if (!isOpen || !workOrder) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 backdrop-blur-sm bg-black bg-opacity-20 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Edit Work Order</h2>
                <p className="text-sm text-gray-600">Update work order details</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* General Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Visit Date *
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="date"
                      name="visitInstDate"
                      value={formData.visitInstDate}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.visitInstDate ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.visitInstDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.visitInstDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Order Type *
                  </label>
                  <select
                    name="workOrderType"
                    value={formData.workOrderType}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.workOrderType ? 'border-red-300' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select type</option>
                    {workOrderTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.workOrderType && (
                    <p className="mt-1 text-sm text-red-600">{errors.workOrderType}</p>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.customerName ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.customerName && (
                    <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Phone
                  </label>
                  <input
                    type="tel"
                    name="customerPhone"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Location Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area *
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleInputChange}
                      placeholder="Enter area"
                      className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.area ? 'border-red-300' : 'border-gray-300'
                      }`}
                    />
                  </div>
                  {errors.area && (
                    <p className="mt-1 text-sm text-red-600">{errors.area}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Area Code
                  </label>
                  <select
                    name="areaCode"
                    value={formData.areaCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select area code</option>
                    {areaCodeOptions.map(code => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Assignment Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supervisor
                  </label>
                  <input
                    type="text"
                    name="supervisor"
                    value={formData.supervisor}
                    onChange={handleInputChange}
                    placeholder="Enter supervisor name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Technician
                  </label>
                  <input
                    type="text"
                    name="technician"
                    value={formData.technician}
                    onChange={handleInputChange}
                    placeholder="Enter technician name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Work Order Status
                  </label>
                  <select
                    name="workOrderStatus"
                    value={formData.workOrderStatus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {workOrderStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Job Status
                  </label>
                  <select
                    name="jobStatus"
                    value={formData.jobStatus}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {jobStatuses.map(status => (
                      <option key={status} value={status}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Distribution
                  </label>
                  <input
                    type="text"
                    name="distribution"
                    value={formData.distribution}
                    onChange={handleInputChange}
                    placeholder="Enter distribution details"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter work order description"
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reschedule Reason
                  </label>
                  <textarea
                    name="rescheduleReason"
                    value={formData.rescheduleReason}
                    onChange={handleInputChange}
                    placeholder="Enter reschedule reason if applicable"
                    rows={2}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-sm text-red-700">{errors.general}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Updating...' : 'Update Work Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditWorkOrderModal;