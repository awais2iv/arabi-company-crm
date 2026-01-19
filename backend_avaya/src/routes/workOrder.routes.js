import { Router } from 'express';
import {
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
} from '../controllers/workOrder.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { verifyAdmin } from '../middlewares/verifyAdmin.middleware.js';
import {
  validateCreateWorkOrder,
  validateUpdateWorkOrder,
  validateStatusUpdate,
  validateBulkUpdate,
  validateWorkOrderId
} from '../middlewares/validateWorkOrder.middleware.js';

const router = Router();

/**
 * ═══════════════════════════════════════════════════════════
 * Work Order Routes
 * All routes require authentication
 * ═══════════════════════════════════════════════════════════
 */

// Statistics route (must come before /:id to avoid conflict)
router.route('/stats/overview')
  .get(verifyJWT, getWorkOrderStats);

// Export route (must come before /:id)
router.route('/export')
  .get(verifyJWT, exportWorkOrders);

// Bulk update route (must come before /:id)
router.route('/bulk-update')
  .post(verifyJWT, verifyAdmin, validateBulkUpdate, bulkUpdateWorkOrders);

// Technician-specific routes (must come before /:id)
router.route('/technician/:technicianId')
  .get(verifyJWT, getWorkOrdersByTechnician);

// Supervisor-specific routes (must come before /:id)
router.route('/supervisor/:supervisorId')
  .get(verifyJWT, getWorkOrdersBySupervisor);

// Main CRUD routes
router.route('/')
  .get(verifyJWT, getAllWorkOrders)
  .post(verifyJWT, validateCreateWorkOrder, createWorkOrder);

router.route('/:id')
  .get(verifyJWT, validateWorkOrderId, getWorkOrderById)
  .put(verifyJWT, validateWorkOrderId, validateUpdateWorkOrder, updateWorkOrder)
  .delete(verifyJWT, validateWorkOrderId, deleteWorkOrder);

// Status update route
router.route('/:id/status')
  .patch(verifyJWT, validateWorkOrderId, validateStatusUpdate, updateWorkOrderStatus);

export default router;
