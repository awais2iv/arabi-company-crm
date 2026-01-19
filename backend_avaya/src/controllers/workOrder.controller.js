import { asyncHandler } from '../utils/asyncHandler.util.js';
import { ApiResponse } from '../utils/apiResponse.util.js';
import { ApiError } from '../utils/apiError.util.js';
import mongoose from 'mongoose';
import WorkOrder from '../models/workOrder.model.js';
import ExcelJS from 'exceljs';
import {
  generateWorkOrderNumber,
  validateStatusTransition,
  validateWorkOrderFields,
  checkDuplicateWorkOrder,
  getWorkOrderStatistics,
  buildWorkOrderQuery
} from '../services/workOrder.service.js';

/**
 * ═══════════════════════════════════════════════════════════
 * Work Order Controller
 * Handles all work order CRUD operations
 * ═══════════════════════════════════════════════════════════
 */

/**
 * Create new work order
 * @route POST /api/v1/work-orders
 * @access Private (Admin, Supervisor)
 */
const createWorkOrder = asyncHandler(async (req, res) => {
  const workOrderData = req.body;

  // Validate work order fields
  const validation = await validateWorkOrderFields(workOrderData);
  if (!validation.isValid) {
    throw new ApiError(400, 'Validation failed', validation.errors);
  }

  // Use provided work order number or generate one if not provided
  let workOrderNumber = workOrderData.workOrderNumber;
  if (!workOrderNumber) {
    workOrderNumber = await generateWorkOrderNumber();
  }

  // Create work order
  const workOrder = await WorkOrder.create({
    ...workOrderData,
    workOrderNumber,
    createdBy: req.user._id,
    updatedBy: req.user._id
  });

  return res.status(201).json(
    new ApiResponse(201, workOrder, 'Work order created successfully')
  );
});

/**
 * Get all work orders with filtering, pagination, and search
 * Returns ALL work orders regardless of user/creator
 * @route GET /api/v1/work-orders
 * @access Private (All authenticated users)
 */
const getAllWorkOrders = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    sortBy = 'visitInstDate',
    sortOrder = 'desc',
    ...filters
  } = req.query;

  // Build query - NO user-based filtering, returns ALL work orders
  const query = buildWorkOrderQuery(filters);

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const sortOptions = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  // Execute query with pagination
  const [workOrders, totalItems] = await Promise.all([
    WorkOrder.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    WorkOrder.countDocuments(query)
  ]);

  // Calculate pagination meta
  const totalPages = Math.ceil(totalItems / parseInt(limit));
  const currentPage = parseInt(page);

  const pagination = {
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage: parseInt(limit),
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };

  return res.status(200).json(
    new ApiResponse(200, { workOrders, pagination }, 'Work orders fetched successfully')
  );
});

/**
 * Get single work order by ID
 * @route GET /api/v1/work-orders/:id
 * @access Private
 */
const getWorkOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if id is a valid ObjectId or a work order number
  let query;
  if (mongoose.Types.ObjectId.isValid(id)) {
    query = { _id: id, isDeleted: false };
  } else {
    // Assume it's a work order number - use compound index
    query = { workOrderNumber: id.toUpperCase(), isDeleted: false };
  }

  const workOrder = await WorkOrder.findOne(query).lean();

  if (!workOrder) {
    throw new ApiError(404, 'Work order not found');
  }

  return res.status(200).json(
    new ApiResponse(200, workOrder, 'Work order fetched successfully')
  );
});

/**
 * Update work order
 * @route PUT /api/v1/work-orders/:id
 * @access Private (Admin, Supervisor)
 */
const updateWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  // Find existing work order
  const existingWorkOrder = await WorkOrder.findOne({ _id: id, isDeleted: false });

  if (!existingWorkOrder) {
    throw new ApiError(404, 'Work order not found');
  }

  // Store old state for audit
  const oldState = existingWorkOrder.toObject();

  // Validate updates
  const validation = await validateWorkOrderFields(updates);
  if (!validation.isValid) {
    throw new ApiError(400, 'Validation failed', validation.errors);
  }

  // Apply updates
  Object.keys(updates).forEach(key => {
    if (updates[key] !== undefined && key !== 'workOrderNumber') {
      existingWorkOrder[key] = updates[key];
    }
  });

  existingWorkOrder.updatedBy = req.user._id;
  await existingWorkOrder.save();

  return res.status(200).json(
    new ApiResponse(200, existingWorkOrder, 'Work order updated successfully')
  );
});

/**
 * Update work order status
 * @route PATCH /api/v1/work-orders/:id/status
 * @access Private
 */
const updateWorkOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { workOrderStatus, jobStatus, rescheduleReasonRemarks, completionDate } = req.body;

  // Find work order
  const workOrder = await WorkOrder.findOne({ _id: id, isDeleted: false });

  if (!workOrder) {
    throw new ApiError(404, 'Work order not found');
  }

  // Store old state
  const oldState = workOrder.toObject();

  // Validate status transition if workOrderStatus is being changed
  if (workOrderStatus && workOrderStatus !== workOrder.workOrderStatus) {
    const transition = validateStatusTransition(workOrder.workOrderStatus, workOrderStatus);
    
    if (!transition.isValid) {
      throw new ApiError(400, transition.message, [
        `Allowed transitions: ${transition.allowedStatuses.join(', ')}`
      ]);
    }

    workOrder.workOrderStatus = workOrderStatus;
  }

  // Update job status if provided
  if (jobStatus) {
    workOrder.jobStatus = jobStatus;
  }

  // Update reschedule reason if provided
  if (rescheduleReasonRemarks) {
    workOrder.rescheduleReasonRemarks = rescheduleReasonRemarks;
  }

  // Update completion date if provided
  if (completionDate) {
    workOrder.completionDate = new Date(completionDate);
  }

  workOrder.updatedBy = req.user._id;
  await workOrder.save();

  // Supervisor and technician are now string fields, no need to populate

  return res.status(200).json(
    new ApiResponse(200, workOrder, 'Work order status updated successfully')
  );
});

/**
 * Delete work order (soft delete)
 * @route DELETE /api/v1/work-orders/:id
 * @access Private (Admin)
 */
const deleteWorkOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const workOrder = await WorkOrder.findOne({ _id: id, isDeleted: false });

  if (!workOrder) {
    throw new ApiError(404, 'Work order not found');
  }

  // Store old state
  const oldState = workOrder.toObject();

  // Soft delete
  workOrder.isDeleted = true;
  workOrder.deletedAt = new Date();
  workOrder.deletedBy = req.user._id;
  workOrder.updatedBy = req.user._id;
  await workOrder.save();

  return res.status(200).json(
    new ApiResponse(200, {}, 'Work order deleted successfully')
  );
});

/**
 * Bulk update work orders
 * @route POST /api/v1/work-orders/bulk-update
 * @access Private (Admin, Supervisor)
 */
const bulkUpdateWorkOrders = asyncHandler(async (req, res) => {
  const { workOrderIds, updates } = req.body;

  const results = {
    successCount: 0,
    failedCount: 0,
    successIds: [],
    failedIds: []
  };

  // Process each work order
  for (const workOrderId of workOrderIds) {
    try {
      const workOrder = await WorkOrder.findOne({ _id: workOrderId, isDeleted: false });

      if (!workOrder) {
        results.failedCount++;
        results.failedIds.push({ id: workOrderId, reason: 'Work order not found' });
        continue;
      }

      const oldState = workOrder.toObject();

      // Apply updates
      Object.keys(updates).forEach(key => {
        if (updates[key] !== undefined && key !== 'workOrderNumber') {
          workOrder[key] = updates[key];
        }
      });

      workOrder.updatedBy = req.user._id;
      await workOrder.save();

      results.successCount++;
      results.successIds.push(workOrderId);
    } catch (error) {
      results.failedCount++;
      results.failedIds.push({ id: workOrderId, reason: error.message });
    }
  }

  return res.status(200).json(
    new ApiResponse(200, results, `Bulk update completed. ${results.successCount} succeeded, ${results.failedCount} failed`)
  );
});

/**
 * Export work orders to CSV
 * @route GET /api/v1/work-orders/export
 * @access Private
 */
const exportWorkOrders = asyncHandler(async (req, res) => {
  const { format = 'csv', ...filters } = req.query;

  // Build query
  const query = buildWorkOrderQuery(filters);

  // Fetch all matching work orders
  const workOrders = await WorkOrder.find(query)
    .sort({ visitInstDate: -1 })
    .lean();

  if (format === 'excel' || format === 'xlsx') {
    // Generate Excel file
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Work Orders');

    // Define columns
    worksheet.columns = [
      { header: 'Work Order #', key: 'workOrderNumber', width: 15 },
      { header: 'Visit Date', key: 'visitInstDate', width: 12 },
      { header: 'Type', key: 'workOrderType', width: 15 },
      { header: 'Customer Name', key: 'customerName', width: 20 },
      { header: 'Customer Phone', key: 'customerPhone', width: 15 },
      { header: 'Area', key: 'area', width: 20 },
      { header: 'Area Code', key: 'areaCode', width: 10 },
      { header: 'Agent Name', key: 'agentName', width: 15 },
      { header: 'Description', key: 'description', width: 30 },
      { header: 'Supervisor', key: 'supervisor', width: 15 },
      { header: 'Technician', key: 'technician', width: 15 },
      { header: 'Status', key: 'workOrderStatus', width: 15 },
      { header: 'Job Status', key: 'jobStatus', width: 15 },
      { header: 'Distribution', key: 'distribution', width: 15 },
      { header: 'Created At', key: 'createdAt', width: 12 }
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };

    // Add data rows
    workOrders.forEach((wo, index) => {
      const row = worksheet.addRow({
        workOrderNumber: wo.workOrderNumber,
        visitInstDate: new Date(wo.visitInstDate).toLocaleDateString(),
        workOrderType: wo.workOrderType,
        customerName: wo.customerName,
        customerPhone: wo.customerPhone,
        area: wo.area,
        areaCode: wo.areaCode,
        agentName: wo.agentName,
        description: wo.description,
        supervisor: wo.supervisor || '',
        technician: wo.technician || '',
        workOrderStatus: wo.workOrderStatus,
        jobStatus: wo.jobStatus,
        distribution: wo.distribution,
        createdAt: new Date(wo.createdAt).toLocaleDateString()
      });

      // Alternate row colors
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F8F8' }
        };
      }
    });

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=work-orders-${Date.now()}.xlsx`);

    // Write to response
    await workbook.xlsx.write(res);
    return res.end();
  }

  if (format === 'csv') {
    // Generate CSV
    const csvHeaders = [
      'Work Order #',
      'Visit Date',
      'Type',
      'Customer Name',
      'Customer Phone',
      'Area',
      'Area Code',
      'Agent Name',
      'Description',
      'Supervisor',
      'Technician',
      'Status',
      'Job Status',
      'Distribution',
      'Created At'
    ].join(',');

    const csvRows = workOrders.map(wo => {
      return [
        wo.workOrderNumber,
        new Date(wo.visitInstDate).toLocaleDateString(),
        wo.workOrderType,
        `"${wo.customerName}"`,
        wo.customerPhone,
        `"${wo.area}"`,
        wo.areaCode,
        `"${wo.agentName}"`,
        `"${wo.description.replace(/"/g, '""')}"`,
        wo.supervisor || '',
        wo.technician || '',
        wo.workOrderStatus,
        wo.jobStatus,
        wo.distribution,
        new Date(wo.createdAt).toLocaleDateString()
      ].join(',');
    });

    const csv = [csvHeaders, ...csvRows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=work-orders-${Date.now()}.csv`);
    return res.send(csv);
  }

  // Default JSON response
  return res.status(200).json(
    new ApiResponse(200, workOrders, 'Work orders exported successfully')
  );
});

/**
 * Get work order statistics
 * @route GET /api/v1/work-orders/stats/overview
 * @access Private
 */
const getWorkOrderStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, supervisor, technician } = req.query;

  const filters = {};
  if (startDate) filters.startDate = startDate;
  if (endDate) filters.endDate = endDate;
  if (supervisor) filters.supervisor = supervisor;
  if (technician) filters.technician = technician;

  const stats = await getWorkOrderStatistics(filters);

  return res.status(200).json(
    new ApiResponse(200, stats, 'Statistics fetched successfully')
  );
});

/**
 * Get work orders by technician
 * @route GET /api/v1/work-orders/technician/:technicianId
 * @access Private
 */
const getWorkOrdersByTechnician = asyncHandler(async (req, res) => {
  const { technicianId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  const query = {
    technician: technicianId,
    isDeleted: false
  };

  if (status) {
    query.workOrderStatus = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [workOrders, totalItems] = await Promise.all([
    WorkOrder.find(query)
      .sort({ visitInstDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    WorkOrder.countDocuments(query)
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      workOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalItems
      }
    }, 'Work orders fetched successfully')
  );
});

/**
 * Get work orders by supervisor
 * @route GET /api/v1/work-orders/supervisor/:supervisorId
 * @access Private
 */
const getWorkOrdersBySupervisor = asyncHandler(async (req, res) => {
  const { supervisorId } = req.params;
  const { page = 1, limit = 10, status } = req.query;

  const query = {
    supervisor: supervisorId,
    isDeleted: false
  };

  if (status) {
    query.workOrderStatus = status;
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [workOrders, totalItems] = await Promise.all([
    WorkOrder.find(query)
      .sort({ visitInstDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    WorkOrder.countDocuments(query)
  ]);

  return res.status(200).json(
    new ApiResponse(200, {
      workOrders,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalItems / parseInt(limit)),
        totalItems
      }
    }, 'Work orders fetched successfully')
  );
});

export {
  createWorkOrder,
  getAllWorkOrders,
  getWorkOrderById,
  updateWorkOrder,
  updateWorkOrderStatus,
  deleteWorkOrder,
  bulkUpdateWorkOrders,
  exportWorkOrders,
  getWorkOrderStats,
  getWorkOrdersByTechnician,
  getWorkOrdersBySupervisor
};
