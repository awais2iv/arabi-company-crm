import React from 'react';
import { X, User, Calendar, MapPin, ClipboardList, FileText, Users } from 'lucide-react';

const ViewWorkOrderModal = ({ isOpen, onClose, workOrder }) => {
  if (!isOpen || !workOrder) return null;

  const getStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-yellow-100 text-yellow-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'On Hold': 'bg-orange-100 text-orange-800',
      'Rescheduled': 'bg-purple-100 text-purple-800',
      'Quotation': 'bg-indigo-100 text-indigo-800',
      'Need Tomorrow': 'bg-orange-100 text-orange-800',
      'Need S.V': 'bg-purple-100 text-purple-800',
      'Under Observ.': 'bg-yellow-100 text-yellow-800',
      'S.N.R / Un Comp.': 'bg-red-100 text-red-800',
      'No Body At Site': 'bg-gray-100 text-gray-800',
      'Cancel / No Need': 'bg-red-100 text-red-800',
      'No Answer': 'bg-gray-100 text-gray-800',
      'Will Call Later': 'bg-blue-100 text-blue-800',
      'Need Other Day': 'bg-purple-100 text-purple-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const InfoRow = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      {Icon && <Icon className="w-5 h-5 text-gray-400 mt-0.5" />}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-sm text-gray-900 mt-1">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Work Order Details</h2>
              <p className="text-blue-100 text-sm">{workOrder.workOrderNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Basic Information
              </h3>
              <div className="space-y-1">
                <InfoRow 
                  label="Work Order Number" 
                  value={workOrder.workOrderNumber}
                  icon={ClipboardList}
                />
                <InfoRow 
                  label="Agent Name" 
                  value={workOrder.agentName}
                  icon={User}
                />
                <InfoRow 
                  label="Visit & Installation Date" 
                  value={new Date(workOrder.visitInstDate).toLocaleDateString()}
                  icon={Calendar}
                />
                <InfoRow 
                  label="Work Order Type" 
                  value={workOrder.workOrderType}
                />
                <div className="flex items-start gap-3 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Work Order Status</p>
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${getStatusColor(workOrder.workOrderStatus)}`}>
                      {workOrder.workOrderStatus}
                    </span>
                  </div>
                </div>
                <div className="flex items-start gap-3 py-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-500">Job Status</p>
                    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full mt-1 ${workOrder.jobStatus === 'Attend' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {workOrder.jobStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Information */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-blue-600" />
                Customer Information
              </h3>
              <div className="space-y-1">
                <InfoRow 
                  label="Customer Name" 
                  value={workOrder.customerName}
                  icon={User}
                />
                <InfoRow 
                  label="Customer Phone" 
                  value={workOrder.customerPhone}
                />
              </div>
            </div>

            {/* Location Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Location Details
              </h3>
              <div className="space-y-1">
                <InfoRow 
                  label="Area" 
                  value={workOrder.area}
                  icon={MapPin}
                />
                <InfoRow 
                  label="Area Code" 
                  value={workOrder.areaCode}
                />
              </div>
            </div>

            {/* Assignment */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Assignment
              </h3>
              <div className="space-y-1">
                <InfoRow 
                  label="Supervisor" 
                  value={workOrder.supervisor}
                  icon={User}
                />
                <InfoRow 
                  label="Technician" 
                  value={workOrder.technician}
                  icon={User}
                />
                <InfoRow 
                  label="Agent Name" 
                  value={workOrder.agentName}
                  icon={User}
                />
                <InfoRow 
                  label="Distribution" 
                  value={workOrder.distribution}
                />
                {workOrder.rescheduleReason && (
                  <InfoRow 
                    label="Reschedule Date" 
                    value={new Date(workOrder.rescheduleReason).toLocaleDateString()}
                    icon={Calendar}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Description - Full Width */}
          <div className="bg-gray-50 rounded-lg p-4 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Work Description
            </h3>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">
              {workOrder.description}
            </p>
          </div>

          {/* Timestamps */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 text-xs text-gray-500">
            <div>
              <span className="font-medium">Created:</span> {new Date(workOrder.createdAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Last Updated:</span> {new Date(workOrder.updatedAt).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ViewWorkOrderModal;
