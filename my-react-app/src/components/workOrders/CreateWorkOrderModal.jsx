// src/components/workOrders/CreateWorkOrderModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, User, Clock, AlertCircle } from 'lucide-react';
import { useCreateWorkOrderMutation, useUpdateWorkOrderMutation, useLazyGetWorkOrderByIdQuery } from '@/features/workOrders/workOrdersApiSlice';
import { useGetAgentsQuery } from '@/features/kpis/kpisApiSlice';
import { useSelector } from 'react-redux';

const CreateWorkOrderModal = ({ isOpen, onClose, isEdit = false, workOrder = null }) => {
  // Get current user from Redux auth state
  const currentUser = useSelector((state) => state.auth.user);
  const currentUserName = currentUser ? 
    (currentUser.name || currentUser.username || currentUser.email || 'Unknown User') : 
    'Unknown User';
  
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(''); // Add success message state
  
  const [createWorkOrder, { isLoading: isCreating }] = useCreateWorkOrderMutation();
  const [updateWorkOrder, { isLoading: isUpdating }] = useUpdateWorkOrderMutation();
  const [getWorkOrderById, { isFetching: isFinding }] = useLazyGetWorkOrderByIdQuery();
  const { data: agentsData } = useGetAgentsQuery();
  
  const [formData, setFormData] = useState({
    visitInstDate: new Date().toISOString().split('T')[0], // Default to today's date
    workOrderType: '',
    workOrderNumber: '',
    customerName: '',
    customerPhone: '',
    area: '',
    description: '',
    areaCode: '',
    supervisor: '',
    technician: '',
    hours: '', // Decimal hours field
    workOrderStatus: 'Pending',
    rescheduleReason: '',
    jobStatus: 'Not Attend',
    distribution: '', // Free text field with no restrictions
    agentName: currentUserName // Use actual logged-in user name
  });

  // Pre-populate form when editing
  useEffect(() => {
    if (isEdit && workOrder) {
      setFormData({
        visitInstDate: workOrder.visitInstDate ? new Date(workOrder.visitInstDate).toISOString().split('T')[0] : '',
        workOrderType: workOrder.workOrderType || '',
        workOrderNumber: workOrder.workOrderNumber || '',
        customerName: workOrder.customerName || '',
        customerPhone: workOrder.customerPhone || '',
        area: workOrder.area || '',
        description: workOrder.description || '',
        areaCode: workOrder.areaCode || '',
        supervisor: workOrder.supervisor || '',
        technician: workOrder.technician || '',
        hours: workOrder.hours || '',
        workOrderStatus: workOrder.workOrderStatus || 'Pending',
        rescheduleReason: workOrder.rescheduleReason || '',
        jobStatus: workOrder.jobStatus || 'Not Attend',
        distribution: workOrder.distribution || '',
        agentName: workOrder.agentName || currentUserName
      });
      setErrors({}); // Clear any previous errors
    } else if (!isEdit) {
      // Reset to defaults for create mode
      setFormData({
        visitInstDate: new Date().toISOString().split('T')[0],
        workOrderType: '',
        workOrderNumber: '',
        customerName: '',
        customerPhone: '',
        area: '',
        description: '',
        areaCode: '',
        supervisor: '',
        technician: '',
        hours: '',
        workOrderStatus: 'Pending',
        rescheduleReason: '',
        jobStatus: 'Not Attend',
        distribution: '',
        agentName: currentUserName
      });
      setErrors({}); // Clear any previous errors
    }
  }, [isEdit, workOrder, currentUserName, isOpen]);

  const workOrderTypes = [
    'Installation',
    'Maintenance',
    'Repair',
    'Inspection',
    'Emergency',
    'Preventive Maintenance',
    'Corrective Maintenance'
  ];

  const priorities = ['Low', 'Medium', 'High', 'Critical'];
  const sparePumpOptions = ['Yes', 'No', 'N/A'];
  const areaCodeOptions = ['AREA 1', 'AREA 2', 'AREA 3', 'Others'];
  const workOrderStatuses = [
    'Completed',
    'Quotation',
    'Need Tomorrow',
    'Need S.V',
    'Under Observ.',
    'Pending',
    'S.N.R / Un Comp.',
    'No Body At Site',
    'Cancel / No Need',
    'No Answer',
    'Will Call Later',
    'Need Other Day'
  ];
  const jobStatusOptions = ['Attend', 'Not Attend'];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
    // Clear success message when form changes
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleClearForm = () => {
    setFormData({
      visitInstDate: new Date().toISOString().split('T')[0],
      workOrderType: '',
      workOrderNumber: '',
      customerName: '',
      customerPhone: '',
      area: '',
      description: '',
      areaCode: '',
      supervisor: '',
      technician: '',
      hours: '',
      workOrderStatus: 'Pending',
      rescheduleReason: '',
      jobStatus: 'Not Attend',
      distribution: '',
      agentName: currentUserName
    });
    setErrors({});
    setSuccessMessage('');
  };

  const handleFindWorkOrder = async () => {
    if (!formData.workOrderNumber.trim()) {
      setErrors({ workOrderNumber: 'Please enter a work order number to find' });
      return;
    }

    try {
      const result = await getWorkOrderById(formData.workOrderNumber.trim()).unwrap();
      console.log('Found work order result:', result);
      // Populate form with found work order data, excluding specified fields
      setFormData(prev => ({
        ...prev,
        visitInstDate: result.data.visitInstDate ? new Date(result.data.visitInstDate).toISOString().split('T')[0] : prev.visitInstDate,
        customerName: result.data.customerName || '',
        customerPhone: result.data.customerPhone || '',
        area: result.data.area || '',
        areaCode: result.data.areaCode || '',
        supervisor: result.data.supervisor || '',
        technician: result.data.technician || '',
        agentName: prev.agentName // Keep current user
        // Excluded fields: workOrderType, workOrderStatus, jobStatus, hours, rescheduleReason, distribution, description
      }));
      setErrors({});
      setSuccessMessage('Work order details loaded successfully');
    } catch (error) {
      console.error('Failed to find work order:', error);
      setErrors({ general: error?.data?.message || 'Work order not found' });
    }
  };

  const validate = () => {
    const newErrors = {};

    // Work order number is required only in create mode
    if (!isEdit) {
      if (!formData.workOrderNumber.trim()) {
        newErrors.workOrderNumber = 'Work order number is required';
      } else if (formData.workOrderNumber.trim().length < 3) {
        newErrors.workOrderNumber = 'Work order number must be at least 3 characters';
      }
    }

    if (!formData.visitInstDate) newErrors.visitInstDate = 'Visit date is required';
    if (!formData.customerName.trim()) newErrors.customerName = 'Customer name is required';
    if (formData.customerName.trim().length < 2) newErrors.customerName = 'Customer name must be at least 2 characters';
    if (!formData.customerPhone.trim()) newErrors.customerPhone = 'Customer phone is required';
    if (!formData.area.trim()) newErrors.area = 'Area is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (formData.description.trim().length < 10) newErrors.description = 'Description must be at least 10 characters';
    // Area code is now optional since "Blank" is a valid option
    if (!formData.supervisor) newErrors.supervisor = 'Supervisor is required';
    if (!formData.technician) newErrors.technician = 'Technician is required';

    // Validate hours
    if (formData.hours !== '' && formData.hours !== undefined && formData.hours !== null) {
      const hoursNum = parseFloat(formData.hours);
      if (isNaN(hoursNum)) {
        newErrors.hours = 'Hours must be a valid number';
      } else if (hoursNum < 0) {
        newErrors.hours = 'Hours cannot be negative';
      } else if (hoursNum > 100) {
        newErrors.hours = 'Hours cannot exceed 100';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validate()) return;

    try {
      // Prepare data for submission
      const submitData = { ...formData };
      
      // Don't send workOrderNumber during updates (it cannot be changed)
      if (isEdit) {
        delete submitData.workOrderNumber;
      }
      
      // Convert hours to number if provided, otherwise omit
      if (submitData.hours === '' || submitData.hours === null || submitData.hours === undefined) {
        delete submitData.hours;
      } else {
        submitData.hours = parseFloat(submitData.hours);
      }

      if (isEdit && workOrder) {
        // Update existing work order
        await updateWorkOrder({ id: workOrder._id, ...submitData }).unwrap();
      } else {
        // Create new work order
        await createWorkOrder(submitData).unwrap();
      }
      onClose();
      // Reset form and errors
      setErrors({});
    } catch (error) {
      console.error(`Failed to ${isEdit ? 'update' : 'create'} work order:`, error);
      if (error?.data?.errors) {
        const backendErrors = {};
        error.data.errors.forEach(err => {
          backendErrors.general = err;
        });
        setErrors(backendErrors);
      } else {
        setErrors({ general: error?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} work order` });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 backdrop-blur-sm  bg-opacity-20 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {isEdit ? 'Edit Work Order' : 'Create Work Order'}
                </h2>
                <p className="text-sm text-gray-600">
                  {isEdit ? 'Update the work order details' : 'Fill in the details to create a new work order'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearForm}
                className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 font-medium"
              >
                Clear Form
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white rounded-lg transition-colors duration-200"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1">
            {/* General Error */}
            {errors.general && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-red-800">{errors.general}</div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                <div className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5">✓</div>
                <div className="text-sm text-green-800">{successMessage}</div>
              </div>
            )}

            <div className="space-y-6">
              {/* Section 1: Basic Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Work Order Number - Manual Entry (Read-only in edit mode) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Order Number <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {isEdit ? (
                        <input
                          type="text"
                          value={formData.workOrderNumber}
                          readOnly
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                        />
                      ) : (
                        <input
                          type="text"
                          name="workOrderNumber"
                          value={formData.workOrderNumber}
                        onChange={handleChange}
                          className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.workOrderNumber ? 'border-red-500' : 'border-gray-300'
                          }`}
                          placeholder="Enter work order number"
                          required
                        />
                      )}
                      {!isEdit && (
                        <button
                          type="button"
                          onClick={handleFindWorkOrder}
                          disabled={isFinding}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2"
                        >
                          {isFinding ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Finding...</span>
                            </>
                          ) : (
                            <span>Find</span>
                          )}
                        </button>
                      )}
                    </div>
                    {errors.workOrderNumber && !isEdit && (
                      <p className="mt-1 text-xs text-red-600">{errors.workOrderNumber}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      {isEdit ? "Work order number cannot be changed" : "Enter a unique work order number or find existing details"}
                    </p>
                  </div>

                  {/* Agent Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      name="agentName"
                      value={formData.agentName}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                    />
                    <p className="mt-1 text-xs text-gray-500">Automatically set to logged-in user</p>
                  </div>

                  {/* Visit Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Visit & Installation Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      name="visitInstDate"
                      value={formData.visitInstDate}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.visitInstDate ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.visitInstDate && (
                      <p className="mt-1 text-sm text-red-600">{errors.visitInstDate}</p>
                    )}
                  </div>

                  {/* Work Order Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Order Type <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="workOrderType"
                      value={formData.workOrderType}
                      onChange={handleChange}
                      placeholder="e.g., Installation, Maintenance, Repair"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Work Order Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Work Order Status
                    </label>
                    <select
                      name="workOrderStatus"
                      value={formData.workOrderStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {workOrderStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                  {/* Job Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Job Status
                    </label>
                    <select
                      name="jobStatus"
                      value={formData.jobStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {jobStatusOptions.map(status => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </div>

                </div>
              </div>

              {/* Section 2: Customer Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Customer Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleChange}
                      placeholder="Enter customer name"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.customerName ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.customerName && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
                    )}
                  </div>

                  {/* Customer Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Customer Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      placeholder="+1 (555) 123-4567"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.customerPhone ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.customerPhone && (
                      <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 3: Location Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  Location Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Area */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="area"
                      value={formData.area}
                      onChange={handleChange}
                      placeholder="e.g., Downtown, North District"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.area ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.area && (
                      <p className="mt-1 text-sm text-red-600">{errors.area}</p>
                    )}
                  </div>

                  {/* Area Code */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Area Code
                    </label>
                    <select
                      name="areaCode"
                      value={formData.areaCode}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.areaCode ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Select Area Code</option>
                      {areaCodeOptions.map(option => (
                        <option key={option} value={option === 'Blank' ? '' : option}>
                          {option}
                        </option>
                      ))}
                    </select>
                    {errors.areaCode && (
                      <p className="mt-1 text-sm text-red-600">{errors.areaCode}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Assignment */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Assignment
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Supervisor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Supervisor <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="supervisor"
                      value={formData.supervisor}
                      onChange={handleChange}
                      placeholder="Supervisor Name"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.supervisor ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.supervisor && (
                      <p className="mt-1 text-sm text-red-600">{errors.supervisor}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Enter the supervisor's name</p>
                  </div>

                  {/* Technician */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Technician <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="technician"
                      value={formData.technician}
                      onChange={handleChange}
                      placeholder="Technician Name"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.technician ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.technician && (
                      <p className="mt-1 text-sm text-red-600">{errors.technician}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Enter the technician's name</p>
                  </div>

                  {/* Hours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      name="hours"
                      value={formData.hours}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      max="100"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors.hours ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.hours && (
                      <p className="mt-1 text-sm text-red-600">{errors.hours}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Enter work hours (decimal values allowed)</p>
                  </div>

                  {/* Reschedule Reason & Remarks */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reschedule Date
                    </label>
                    <input
                      type="date"
                      name="rescheduleReason"
                      value={formData.rescheduleReason}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <p className="mt-1 text-xs text-gray-500">Leave empty if no rescheduling needed</p>
                  </div>

                  {/* Distribution */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Distribution
                    </label>
                    <input
                      type="text"
                      name="distribution"
                      value={formData.distribution}
                      onChange={handleChange}
                      placeholder="Enter distribution details"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Description */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Work Description
                </h3>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="4"
                    placeholder="Provide detailed description of the work to be performed..."
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.description ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.description.length}/2000 characters (minimum 10 required)
                  </p>
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
              disabled={isCreating || isUpdating}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isCreating || isUpdating}
              className="px-8 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center gap-2 shadow-sm"
            >
              {(isCreating || isUpdating) ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>{isEdit ? 'Updating Work Order...' : 'Creating Work Order...'}</span>
                </>
              ) : (
                <span>{isEdit ? 'Update Work Order' : 'Create Work Order'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkOrderModal;
