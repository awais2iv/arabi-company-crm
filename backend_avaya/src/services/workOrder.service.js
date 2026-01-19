import WorkOrder from '../models/workOrder.model.js';
import { User } from '../models/user.model.js';

/**
 * ═══════════════════════════════════════════════════════════
 * Work Order Service Layer
 * Business logic for work order operations
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Generate unique work order number
 * Format: WOYYYYMMDDXXXX
 * Example: WO202601180001
 */
export const generateWorkOrderNumber = async () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Find count of work orders created today
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  
  const count = await WorkOrder.countDocuments({
    createdAt: {
      $gte: startOfDay,
      $lte: endOfDay
    }
  });
  
  // Increment and pad with zeros (4 digits)
  const sequence = String(count + 1).padStart(4, '0');
  const workOrderNumber = `WO${dateStr}${sequence}`;
  
  // Check for uniqueness (rare collision scenario)
  const exists = await WorkOrder.findOne({ workOrderNumber });
  if (exists) {
    // Retry with incremented sequence
    const retrySequence = String(count + 2).padStart(4, '0');
    return `WO-${dateStr}-${retrySequence}`;
  }
  
  return workOrderNumber;
};

/**
 * Validate status transition
 */
export const validateStatusTransition = (currentStatus, newStatus) => {
  const allowedTransitions = {
    'Pending': ['In Progress', 'Cancelled', 'Rescheduled'],
    'In Progress': ['Completed', 'On Hold', 'Cancelled', 'Rescheduled'],
    'On Hold': ['In Progress', 'Cancelled', 'Rescheduled'],
    'Rescheduled': ['Pending', 'Cancelled'],
    'Completed': [],
    'Cancelled': []
  };

  const allowed = allowedTransitions[currentStatus] || [];
  return {
    isValid: allowed.includes(newStatus),
    allowedStatuses: allowed,
    message: allowed.includes(newStatus) 
      ? 'Transition is valid' 
      : `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(', ')}`
  };
};

/**
 * Calculate distribution status based on assignment
 */
export const calculateDistribution = (supervisor, technician, workOrderStatus) => {
  if (supervisor && technician && supervisor.trim() && technician.trim()) {
    // Both assigned
    if (workOrderStatus === 'In Progress') {
      return 'Distributed';
    } else if (workOrderStatus === 'Pending') {
      return 'Pending Distribution';
    } else {
      return 'Distributed';
    }
  } else {
    // Either supervisor or technician not assigned
    return 'Not Distributed';
  }
};

export const validateWorkOrderFields = async (data) => {
  const errors = [];

  // Validate supervisor as string
  if (data.supervisor && (typeof data.supervisor !== 'string' || data.supervisor.trim().length < 1)) {
    errors.push('Supervisor must be a valid name');
  }

  // Validate technician as string
  if (data.technician && (typeof data.technician !== 'string' || data.technician.trim().length < 1)) {
    errors.push('Technician must be a valid name');
  }

  // Phone number validation removed - allow any format

  // Validate visit date not too far in past
  if (data.visitInstDate) {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    if (new Date(data.visitInstDate) < oneYearAgo) {
      errors.push('Visit date cannot be more than 1 year in the past');
    }
  }

  // Validate completion date after visit date
  if (data.completionDate && data.visitInstDate) {
    if (new Date(data.completionDate) < new Date(data.visitInstDate)) {
      errors.push('Completion date cannot be before visit date');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Check for duplicate work order
 */
export const checkDuplicateWorkOrder = async (criteria) => {
  const { customerName, customerPhone, visitInstDate, excludeId } = criteria;

  const query = {
    customerName,
    customerPhone,
    visitInstDate: {
      $gte: new Date(visitInstDate).setHours(0, 0, 0, 0),
      $lte: new Date(visitInstDate).setHours(23, 59, 59, 999)
    },
    isDeleted: false,
    workOrderStatus: { $nin: ['Cancelled', 'Completed'] }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const duplicate = await WorkOrder.findOne(query);
  
  return {
    isDuplicate: !!duplicate,
    existingWorkOrder: duplicate
  };
};

/**
 * Get work order statistics
 */
export const getWorkOrderStatistics = async (filters = {}) => {
  const matchStage = { isDeleted: false };

  // Apply date range filter
  if (filters.startDate || filters.endDate) {
    matchStage.visitInstDate = {};
    if (filters.startDate) matchStage.visitInstDate.$gte = new Date(filters.startDate);
    if (filters.endDate) matchStage.visitInstDate.$lte = new Date(filters.endDate);
  }

  // Apply supervisor filter
  if (filters.supervisor) {
    matchStage.supervisor = filters.supervisor;
  }

  // Apply technician filter
  if (filters.technician) {
    matchStage.technician = filters.technician;
  }

  // Get stats by status
  const statusStats = await WorkOrder.getStatsByStatus(matchStage);

  // Get total count
  const totalWorkOrders = await WorkOrder.countDocuments(matchStage);

  // Get overdue count
  const overdueCount = await WorkOrder.countDocuments({
    ...matchStage,
    visitInstDate: { $lt: new Date() },
    workOrderStatus: { $nin: ['Completed', 'Cancelled'] }
  });

  // Calculate completion rate
  const completedCount = await WorkOrder.countDocuments({
    ...matchStage,
    workOrderStatus: 'Completed'
  });
  const completionRate = totalWorkOrders > 0 
    ? ((completedCount / totalWorkOrders) * 100).toFixed(2) 
    : 0;

  // Calculate average completion time
  const completedWorkOrders = await WorkOrder.find({
    ...matchStage,
    workOrderStatus: 'Completed',
    completionDate: { $exists: true }
  }).select('visitInstDate completionDate');

  let avgCompletionTime = 0;
  if (completedWorkOrders.length > 0) {
    const totalHours = completedWorkOrders.reduce((sum, wo) => {
      const visitDate = new Date(wo.visitInstDate);
      const completionDate = new Date(wo.completionDate);
      const diffInMs = completionDate - visitDate;
      const diffInHours = diffInMs / (1000 * 60 * 60);
      return sum + diffInHours;
    }, 0);
    avgCompletionTime = (totalHours / completedWorkOrders.length).toFixed(2);
  }

  // Get stats by type
  const typeStats = await WorkOrder.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$workOrderType',
        count: { $sum: 1 }
      }
    },
    {
      $project: {
        type: '$_id',
        count: 1,
        _id: 0
      }
    }
  ]);

  return {
    totalWorkOrders,
    byStatus: statusStats,
    byType: typeStats,
    overdueCount,
    completionRate: parseFloat(completionRate),
    avgCompletionTime: parseFloat(avgCompletionTime),
    completedCount
  };
};

/**
 * Build query filters for work order search
 * NOTE: This function does NOT filter by user - it returns work orders for ALL users
 */
export const buildWorkOrderQuery = (filters) => {
  const query = { isDeleted: false };

  // Status filter
  if (filters.status) {
    query.workOrderStatus = filters.status;
  }

  // Type filter
  if (filters.workOrderType) {
    query.workOrderType = filters.workOrderType;
  }

  // Distribution filter
  if (filters.distribution) {
    query.distribution = filters.distribution;
  }

  // Supervisor filter
  if (filters.supervisor) {
    query.supervisor = filters.supervisor;
  }

  // Technician filter
  if (filters.technician) {
    query.technician = filters.technician;
  }

  // Area filter
  if (filters.area) {
    query.area = { $regex: filters.area, $options: 'i' };
  }

  // Area code filter
  if (filters.areaCode) {
    query.areaCode = filters.areaCode.toUpperCase();
  }

  // Date range filter
  if (filters.startDate || filters.endDate) {
    query.visitInstDate = {};
    if (filters.startDate) {
      query.visitInstDate.$gte = new Date(filters.startDate);
    }
    if (filters.endDate) {
      query.visitInstDate.$lte = new Date(filters.endDate);
    }
  }

  // Search filter (customer name or description)
  if (filters.search) {
    query.$or = [
      { customerName: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
      { workOrderNumber: { $regex: filters.search, $options: 'i' } }
    ];
  }

  return query;
};

export default {
  generateWorkOrderNumber,
  validateStatusTransition,
  calculateDistribution,
  validateWorkOrderFields,
  checkDuplicateWorkOrder,
  getWorkOrderStatistics,
  buildWorkOrderQuery
};
