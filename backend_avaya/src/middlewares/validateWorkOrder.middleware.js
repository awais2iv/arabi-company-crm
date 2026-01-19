import { ApiError } from '../utils/apiError.util.js';
import mongoose from 'mongoose';

/**
 * ═══════════════════════════════════════════════════════════
 * Work Order Validation Middleware
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Validate create work order request
 */
export const validateCreateWorkOrder = (req, res, next) => {
  const {
    visitInstDate,
    workOrderType,
    workOrderNumber,
    customerName,
    customerPhone,
    area,
    description,
    areaCode,
    supervisor,
    technician,
    hours,
    workOrderStatus,
    rescheduleReason,
    jobStatus,
    distribution,
    agentName
  } = req.body;

  const errors = [];

  // Optional field validations (only validate if provided)
  if (visitInstDate && isNaN(Date.parse(visitInstDate))) {
    errors.push('Invalid visit date format');
  }

  if (customerName && typeof customerName === 'string' && customerName.trim().length > 0) {
    if (customerName.trim().length < 2 || customerName.trim().length > 200) {
      errors.push('Customer name must be between 2 and 200 characters');
    }
  }

  if (workOrderNumber && typeof workOrderNumber === 'string' && workOrderNumber.trim().length > 0) {
    if (workOrderNumber.trim().length < 3) {
      errors.push('Work Order Number must be at least 3 characters');
    }
  }

  // Validate supervisor and technician as strings (optional)
  if (supervisor && typeof supervisor === 'string' && supervisor.trim().length > 0) {
    if (supervisor.trim().length < 2) {
      errors.push('Supervisor must be a valid name with at least 2 characters');
    }
  }

  if (technician && typeof technician === 'string' && technician.trim().length > 0) {
    if (technician.trim().length < 2) {
      errors.push('Technician must be a valid name with at least 2 characters');
    }
  }

  // Validate hours as a number
  if (hours !== undefined && hours !== null && hours !== '') {
    const hoursNum = parseFloat(hours);
    if (isNaN(hoursNum)) {
      errors.push('Hours must be a valid number');
    } else if (hoursNum < 0) {
      errors.push('Hours cannot be negative');
    } else if (hoursNum > 100) {
      errors.push('Hours cannot exceed 100');
    }
  }

  // Validate date fields
  if (rescheduleReason && isNaN(Date.parse(rescheduleReason))) {
    errors.push('Invalid reschedule date format');
  }

  // Validate enum values (optional)
  const validWorkOrderStatuses = [
    'Completed',
    'Quotation',
    'Need Tomorrow',
    'Need S.V',
    'Under Observ.',
    'Pending',
    'preventive pending',
    'S.N.R / Un Comp.',
    'No Body At Site',
    'Cancel / No Need',
    'No Answer',
    'Will Call Later',
    'Need Other Day'
  ];
  if (workOrderStatus && !validWorkOrderStatuses.includes(workOrderStatus)) {
    errors.push(`Work Order Status must be one of: ${validWorkOrderStatuses.join(', ')}`);
  }

  const validJobStatuses = ['Attend', 'Not Attend'];
  if (jobStatus && !validJobStatuses.includes(jobStatus)) {
    errors.push(`Job Status must be one of: ${validJobStatuses.join(', ')}`);
  }


  if (agentName && typeof agentName === 'string' && agentName.trim().length > 0) {
    if (agentName.trim().length > 100) {
      errors.push('Agent name cannot exceed 100 characters');
    }
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  next();
};

/**
 * Validate update work order request
 */
export const validateUpdateWorkOrder = (req, res, next) => {
  const errors = [];

  // Optional field validations (only validate if provided)
  if (req.body.visitInstDate && isNaN(Date.parse(req.body.visitInstDate))) {
    errors.push('Invalid visit date format');
  }

  if (req.body.customerName && typeof req.body.customerName === 'string' && req.body.customerName.trim().length > 0) {
    if (req.body.customerName.trim().length < 2 || req.body.customerName.trim().length > 200) {
      errors.push('Customer name must be between 2 and 200 characters');
    }
  }

  if (req.body.supervisor && typeof req.body.supervisor === 'string' && req.body.supervisor.trim().length > 0) {
    if (req.body.supervisor.trim().length < 2) {
      errors.push('Supervisor name must be a valid string with at least 2 characters');
    }
  }

  if (req.body.technician && typeof req.body.technician === 'string' && req.body.technician.trim().length > 0) {
    if (req.body.technician.trim().length < 2) {
      errors.push('Technician name must be a valid string with at least 2 characters');
    }
  }

  // Validate hours as a number if provided
  if (req.body.hours !== undefined && req.body.hours !== null && req.body.hours !== '') {
    const hoursNum = parseFloat(req.body.hours);
    if (isNaN(hoursNum)) {
      errors.push('Hours must be a valid number');
    } else if (hoursNum < 0) {
      errors.push('Hours cannot be negative');
    } else if (hoursNum > 100) {
      errors.push('Hours cannot exceed 100');
    }
  }

  // Validate enum values if provided
  // workOrderType is now free text - no enum validation

  const validStatuses = [
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
  if (req.body.workOrderStatus && !validStatuses.includes(req.body.workOrderStatus)) {
    errors.push(`Work Order Status must be one of: ${validStatuses.join(', ')}`);
  }

  const validJobStatuses = ['Attend', 'Not Attend'];
  if (req.body.jobStatus && !validJobStatuses.includes(req.body.jobStatus)) {
    errors.push(`Job Status must be one of: ${validJobStatuses.join(', ')}`);
  }

  // Prevent manual work order number change
  if (req.body.workOrderNumber) {
    errors.push('Work Order Number cannot be manually changed');
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  next();
};

/**
 * Validate status update request
 */
export const validateStatusUpdate = (req, res, next) => {
  const { workOrderStatus, jobStatus, rescheduleReasonRemarks, completionDate } = req.body;
  const errors = [];

  if (!workOrderStatus && !jobStatus) {
    errors.push('Either workOrderStatus or jobStatus must be provided');
  }

  // Validate status enum values
  const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold', 'Rescheduled'];
  if (workOrderStatus && !validStatuses.includes(workOrderStatus)) {
    errors.push(`Work Order Status must be one of: ${validStatuses.join(', ')}`);
  }

  const validJobStatuses = ['Attend', 'Not Attend'];
  if (jobStatus && !validJobStatuses.includes(jobStatus)) {
    errors.push(`Job Status must be one of: ${validJobStatuses.join(', ')}`);
  }

  // Status-specific validations
  if ((workOrderStatus === 'Rescheduled' || workOrderStatus === 'On Hold') && !rescheduleReasonRemarks) {
    errors.push('Reschedule Reason & Remarks is required for Rescheduled or On Hold status');
  }

  if (workOrderStatus === 'Completed' && !completionDate) {
    // Auto-set to current date if not provided
    req.body.completionDate = new Date();
  }

  if (completionDate && isNaN(Date.parse(completionDate))) {
    errors.push('Invalid completion date format');
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  next();
};

/**
 * Validate bulk update request
 */
export const validateBulkUpdate = (req, res, next) => {
  const { workOrderIds, updates } = req.body;
  const errors = [];

  if (!workOrderIds || !Array.isArray(workOrderIds) || workOrderIds.length === 0) {
    errors.push('workOrderIds must be a non-empty array');
  }

  if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
    errors.push('updates must be a non-empty object');
  }

  // Validate each ID
  if (workOrderIds) {
    workOrderIds.forEach((id, index) => {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        errors.push(`Invalid work order ID at index ${index}: ${id}`);
      }
    });
  }

  // Validate update fields
  if (updates) {
    if (updates.supervisor && (typeof updates.supervisor !== 'string' || updates.supervisor.trim().length < 2)) {
      errors.push('Supervisor name must be a valid string with at least 2 characters');
    }

    if (updates.technician && (typeof updates.technician !== 'string' || updates.technician.trim().length < 2)) {
      errors.push('Technician name must be a valid string with at least 2 characters');
    }

    const validStatuses = ['Pending', 'In Progress', 'Completed', 'Cancelled', 'On Hold', 'Rescheduled'];
    if (updates.workOrderStatus && !validStatuses.includes(updates.workOrderStatus)) {
      errors.push(`Work Order Status must be one of: ${validStatuses.join(', ')}`);
    }

    // Prevent certain fields from bulk update
    const restrictedFields = ['workOrderNumber', 'createdBy', 'createdAt'];
    restrictedFields.forEach(field => {
      if (updates[field]) {
        errors.push(`Field '${field}' cannot be bulk updated`);
      }
    });
  }

  if (errors.length > 0) {
    throw new ApiError(400, 'Validation failed', errors);
  }

  next();
};

/**
 * Validate work order ID param (can be ObjectId or work order number)
 */
export const validateWorkOrderId = (req, res, next) => {
  const { id } = req.params;

  if (!id) {
    throw new ApiError(400, 'Work order ID is required');
  }

  // Allow both ObjectId and work order number formats
  if (!mongoose.Types.ObjectId.isValid(id) && id.length < 3) {
    throw new ApiError(400, 'Invalid work order ID format');
  }

  next();
};
